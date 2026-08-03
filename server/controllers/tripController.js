const Trip = require('../models/Trip');
const { generateItinerary, streamItinerary, normalizeItineraryResponse } = require('../services/groqService');
const { addPublicTripShareJob } = require('../services/queueService');
const { notifyTripSaved, notifyTripGenerated } = require('../services/tripNotificationService');
const { emitToUser } = require('../services/socketService');

// Only allow DB-safe fields from AI response — never spread raw Groq output
const SAFE_AI_FIELDS = [
  'days', 'hotels', 'recommendedHotels', 'restaurants',
  'transitOptions', 'budgetBreakdown', 'estimatedCost',
  'tripSummary', 'mustVisitPlaces', 'packingChecklist',
  'shoppingRecommendations', 'essentialTips',
  'emergencyInformation', 'tripStatistics',
];

function pickSafeFields(data) {
  if (!data || typeof data !== 'object') return {};
  const safe = {};
  for (const key of SAFE_AI_FIELDS) {
    if (data[key] !== undefined) safe[key] = data[key];
  }
  return safe;
}

// @route   GET /api/v1/trips/:id/stream
// @desc    Stream AI itinerary generation via SSE, then save result to DB
exports.streamTripItinerary = async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  if (trip.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

  // SSE headers — X-Accel-Buffering: no disables nginx/proxy buffering
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    if (typeof res.flush === 'function') res.flush(); // force immediate send
  };

  // If already done, send result immediately
  if (trip.status === 'completed' && Array.isArray(trip.days) && trip.days.length > 0) {
    send({ type: 'done', trip });
    res.end();
    return;
  }

  // Mark as generating
  trip.status = 'generating';
  await trip.save();

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  let fullText = '';

  try {
    for await (const chunk of streamItinerary(trip, controller.signal)) {
      fullText += chunk;
      send({ type: 'chunk', text: chunk });
    }

    // Parse and save the completed itinerary
    let parsed;
    try {
      parsed = JSON.parse(fullText);
    } catch {
      throw new Error('AI returned invalid JSON');
    }

    if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
      throw new Error('AI response missing days');
    }

    // Normalize through the same pipeline as generateItinerary
    const normalized = normalizeItineraryResponse(parsed, null);
    const safeUpdate = pickSafeFields(normalized);

    const updated = await Trip.findByIdAndUpdate(
      trip._id,
      { ...safeUpdate, status: 'completed' },
      { returnDocument: 'after' }
    );

    // Notify via Socket.io
    try {
      emitToUser(trip.user.toString(), 'tripReady', { tripId: trip._id, destination: trip.destination });
      await notifyTripGenerated(updated);
    } catch { /* non-fatal */ }

    send({ type: 'done', trip: updated });
    res.end();
  } catch (err) {
    if (err.name === 'AbortError') { res.end(); return; }
    console.error('Stream generation error:', err.message);

    // Fall back to non-streaming generation
    try {
      const fallback = await generateItinerary(trip);
      const safeUpdate = pickSafeFields(fallback);
      const updated = await Trip.findByIdAndUpdate(
        trip._id,
        { ...safeUpdate, status: 'completed' },
        { returnDocument: 'after' }
      );
      emitToUser(trip.user.toString(), 'tripReady', { tripId: trip._id, destination: trip.destination });
      send({ type: 'done', trip: updated });
    } catch (fallbackErr) {
      await Trip.findByIdAndUpdate(trip._id, { status: 'failed' });
      send({ type: 'error', message: fallbackErr.message });
    }
    res.end();
  }
};

// @route   POST /api/v1/trips
// @desc    Create a new trip from wizard data
exports.createTrip = async (req, res) => {
  try {
    const {
      fromLocation,
      destination,
      startDate,
      endDate,
      people,
      budget,
      travelStyle,
      food,
      transport,
      days,
      recommendedHotels,
      estimatedCost,
      status,
      isPublic,
    } = req.body;

    const trip = await Trip.create({
      user: req.user.id,
      ownerName: req.user.name || '',
      fromLocation: fromLocation || 'Delhi',
      destination,
      startDate,
      endDate,
      people,
      budget,
      travelStyle,
      food,
      transport,
      days,
      recommendedHotels,
      estimatedCost,
      status: status || 'draft',
      isPublic: Boolean(isPublic),
    });

    if (trip.isPublic) {
      await addPublicTripShareJob(trip._id, req.user.id);
    }

    try {
      await notifyTripSaved(trip);
    } catch (notificationError) {
      console.error('Trip saved notification failed:', notificationError.message);
    }

    res.status(201).json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/v1/trips/:id/generate
// @desc    Call Groq to generate the itinerary for an existing draft trip
exports.generateTripItinerary = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (trip.status === 'completed' && Array.isArray(trip.days) && trip.days.length > 0) {
      return res.status(200).json({ success: true, trip });
    }

    trip.status = 'generating';
    await trip.save();

    console.log(`Generating itinerary for trip ${trip._id} (${trip.destination})...`);

    try {
      const generatedData = await generateItinerary(trip);
      const safeUpdate = pickSafeFields(generatedData);

      const updatedTrip = await Trip.findByIdAndUpdate(
        trip._id,
        { ...safeUpdate, status: 'completed' },
        { returnDocument: 'after' }
      );

      try {
        emitToUser(trip.user.toString(), 'tripReady', { tripId: trip._id, destination: trip.destination });
        await notifyTripGenerated(updatedTrip);
      } catch (e) {
        console.error('Notification error:', e.message);
      }

      console.log(`Itinerary generation completed for trip ${trip._id}`);
      return res.status(200).json({ success: true, trip: updatedTrip });
    } catch (aiError) {
      await Trip.findByIdAndUpdate(trip._id, { status: 'failed' });
      console.error(`AI generation failed for trip ${trip._id}:`, aiError.message);
      return res.status(500).json({ success: false, message: 'AI generation failed. Please try again.' });
    }
  } catch (error) {
    console.error('Trip generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/v1/trips
// @desc    Get all trips for the logged-in user
exports.getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: trips.length, trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/v1/trips/public
// @desc    Get all publicly shared trips
exports.getPublicTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ isPublic: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    const normalizedTrips = trips.map((trip) => {
      const tripObject = trip.toObject ? trip.toObject() : trip;
      const storedOwnerName = String(tripObject.ownerName || '').trim();
      const populatedOwnerName = String(tripObject.user?.name || '').trim();
      const isPlaceholderOwner = !storedOwnerName || /^(traveler|a traveler)$/i.test(storedOwnerName);
      const ownerName = isPlaceholderOwner ? populatedOwnerName || 'Traveler' : storedOwnerName;

      if ((isPlaceholderOwner || !tripObject.ownerName) && populatedOwnerName) {
        Trip.updateOne({ _id: tripObject._id }, { ownerName }).catch((error) => {
          console.error('Failed to backfill trip owner name:', error.message);
        });
      }

      return {
        ...tripObject,
        ownerName,
      };
    });
    res.status(200).json({ success: true, count: normalizedTrips.length, trips: normalizedTrips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/v1/trips/:id
// @desc    Get a single trip
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.user.toString() !== req.user.id && !trip.isPublic) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this trip' });
    }

    res.status(200).json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/v1/trips/:id
// @desc    Update a trip
exports.updateTrip = async (req, res) => {
  try {
    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this trip' });
    }

    const wasPublic = trip.isPublic;
    const updates = req.body;
    trip = await Trip.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!trip.ownerName && req.user?.name) {
      trip.ownerName = req.user.name;
      await trip.save();
    }

    if (!wasPublic && trip.isPublic) {
      await addPublicTripShareJob(trip._id, req.user.id);
    }

    res.status(200).json({ success: true, trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/v1/trips/:id
// @desc    Delete a trip
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this trip' });
    }

    await trip.deleteOne();

    res.status(200).json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
