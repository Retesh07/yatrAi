const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function getDaysCount(startDate, endDate) {
  const diff = new Date(endDate) - new Date(startDate);
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

function buildPrompt(trip) {
  const numDays = getDaysCount(trip.startDate, trip.endDate);
  const fromCity = trip.fromLocation || 'Delhi';
  const transportPref = Array.isArray(trip.transport) ? trip.transport.join(', ') : (trip.transport || 'Flight / Train / Bus');
  const travelStyle = Array.isArray(trip.travelStyle) ? trip.travelStyle.join(', ') : (trip.travelStyle || 'Sightseeing & Culture');

  return `You are YatraAI, an intelligent AI Travel Planner.

Your task is to generate a complete, realistic, optimized travel itinerary based on the user's travel preferences.

=========================================================
TRIP DETAILS
=========================================================

Source City: ${fromCity}
Destination: ${trip.destination}
Travel Dates: ${trip.startDate} to ${trip.endDate} (${numDays} Days)
Number of Travelers: ${trip.people || '1 Traveler'}
Budget: ${trip.budget || 'Standard'}
Preferred Transport: ${transportPref}
Food Preference: ${trip.food || 'Local Specialties / No restriction'}
Travel Style:
${travelStyle}

=========================================================
GUIDELINES
=========================================================

Create a realistic travel plan.

The itinerary should feel like it was prepared by an experienced travel planner.

While planning:

• Calculate total travel days automatically.
• Recommend the most suitable transport.
• Suggest hotels according to the selected budget.
• Recommend restaurants based on food preference.
• Minimize unnecessary travel between attractions.
• Group nearby attractions on the same day.
• Keep enough rest time.
• Avoid impossible schedules.
• Use realistic timings.
• Estimate reasonable expenses.
• Use actual travel dates.
• Consider destination weather.
• Consider local culture and tourist timings.
• Include famous attractions.
• Include hidden gems if possible.
• Include local food recommendations.
• Include shopping recommendations if relevant.
• Include nightlife only if travel style supports it.
• Include adventure activities only if travel style supports it.

=========================================================
DAY PLANNING RULES
=========================================================

For EACH day generate:

Morning activities
Breakfast
Sightseeing
Lunch
Afternoon activities
Evening attractions
Dinner
Night activity (if applicable)
Hotel stay

Every event MUST include

• Time
• Title
• Description
• Location
• Estimated Duration
• Estimated Cost
• Category
• Icon

Every day should also include

• Theme
• Estimated Daily Expense
• Travel Tip

=========================================================
HOTEL RULES
=========================================================

Recommend 3-5 hotels.

Each hotel must include

Name
Category
Price Per Night
Rating
Area
Amenities
Pros
Why Recommended

=========================================================
RESTAURANT RULES
=========================================================

Recommend 5 restaurants.

Each restaurant should contain

Name
Cuisine
Food Type
Average Cost
Rating
Must Try Dish

=========================================================
TRANSPORT RULES
=========================================================

Recommend all practical transport options.

Examples

Flight
Train
Bus
Self Drive
Taxi

Each transport option should contain

Mode
Provider
Duration
Approx Cost
Boarding Point
Arrival Point
Tips

=========================================================
BUDGET RULES
=========================================================

Calculate realistic budget.

Include

Transport
Hotel
Food
Local Transport
Sightseeing
Shopping
Miscellaneous
Daily Average
Grand Total
Budget Saving Tip

=========================================================
PACKING LIST
=========================================================

Generate packing recommendations according to

Weather
Travel Style
Destination

=========================================================
TRAVEL TIPS
=========================================================

Generate useful travel tips including

Safety
Payments
Local Etiquette
Language
Emergency Numbers
Best SIM
Internet Availability
Weather Advice

=========================================================
RETURN FORMAT
=========================================================

Return ONLY raw JSON.

DO NOT
Write explanations.

DO NOT
Use Markdown.

DO NOT
Wrap inside \`\`\`json.

DO NOT
Return anything except valid JSON.

Return numbers as numbers.
Do not return null unless absolutely necessary.

=========================================================
JSON FORMAT
=========================================================

{
  "tripSummary": {
    "fromLocation": "${fromCity}",
    "destination": "${trip.destination}",
    "startDate": "${trip.startDate}",
    "endDate": "${trip.endDate}",
    "totalDays": ${numDays},
    "travelers": "${trip.people || '1 Traveler'}",
    "budget": "${trip.budget || 'Standard'}",
    "travelStyle": "${travelStyle}",
    "bestTimeToVisit": "October to March",
    "weatherExpectation": "Pleasant"
  },

  "transport": {
    "recommendedMode": "Flight",
    "recommendedRoute": "Direct Route",
    "options": [
      {
        "mode": "Flight",
        "provider": "IndiGo / Air India",
        "duration": "2h 30m",
        "approxCost": 5000,
        "boardingPoint": "${fromCity} Airport",
        "arrivalPoint": "${trip.destination} Airport",
        "tips": "Book non-stop morning flights in advance."
      }
    ]
  },

  "hotels": [
    {
      "name": "Grand Stay Resort",
      "category": "Mid-Range",
      "pricePerNight": 3500,
      "rating": 4.5,
      "area": "City Center",
      "amenities": ["Free WiFi", "Breakfast Included", "Pool"],
      "pros": ["Central location", "Great staff"],
      "whyRecommended": "Excellent value for money and prime location."
    }
  ],

  "restaurants": [
    {
      "name": "Local Delight Restaurant",
      "cuisine": "Traditional Local",
      "foodType": "Veg / Non-Veg",
      "rating": 4.6,
      "averageCostForTwo": 1200,
      "mustTryDish": "Special Regional Thali"
    }
  ],

  "budget": {
    "currency": "INR",
    "transport": 10000,
    "hotel": 14000,
    "food": 6000,
    "localTransport": 3000,
    "attractions": 2000,
    "shopping": 2000,
    "miscellaneous": 1500,
    "dailyAverage": 7000,
    "estimatedTotal": 38500,
    "budgetSavingTip": "Use local metro / cabs for short distance commute."
  },

  "days": [
    {
      "day": 1,
      "date": "${trip.startDate}",
      "theme": "Arrival & Heritage Exploration",
      "estimatedDailyExpense": 5000,
      "travelTip": "Keep cash/UPI handy for small vendors.",
      "events": [
        {
          "time": "09:00 AM",
          "title": "Board Transport from ${fromCity}",
          "description": "Departure towards ${trip.destination}.",
          "location": "${fromCity} Departure Hub",
          "duration": "3 Hours",
          "estimatedCost": 2500,
          "category": "Transport",
          "icon": "✈️"
        }
      ]
    }
  ],

  "mustVisitPlaces": [
    {
      "name": "Iconic City Palace / Fort",
      "description": "Historical landmark with breathtaking architecture.",
      "entryFee": 300,
      "recommendedDuration": "2-3 Hours",
      "bestTime": "Morning"
    }
  ],

  "packingChecklist": [
    "Comfortable walking shoes",
    "Sunscreen & sunglasses",
    "Universal power adapter",
    "Light cotton wear"
  ],

  "shoppingRecommendations": [
    "Local handicraft markets",
    "Traditional spice bazaars"
  ],

  "essentialTips": [
    "Use official prepaid taxis or ride-hailing apps.",
    "Respect local attire customs at religious places."
  ],

  "emergencyInformation": {
    "police": "112",
    "ambulance": "108",
    "touristHelpline": "1363",
    "nearestHospital": "City General Hospital"
  },

  "tripStatistics": {
    "totalPlacesCovered": 12,
    "totalRestaurantsSuggested": 5,
    "estimatedTravelDistance": "450 km",
    "averageDailyExpense": 5000,
    "walkingLevel": "Moderate",
    "familyFriendly": true
  }
}`;
}

function generateFallbackTrip(trip) {
  const numDays = getDaysCount(trip.startDate, trip.endDate);
  const dest = trip.destination || 'Goa';
  const fromCity = trip.fromLocation || 'Delhi';

  const hotels = [
    { name: `Grand Hyatt & Spa ${dest}`, category: 'Luxury', pricePerNight: 5500, rating: 4.7, area: 'Beachfront / City Center', amenities: ['Pool', 'Spa', 'WiFi'], pros: ['Luxury view', 'Top amenities'], whyRecommended: 'Prime luxury location.' },
    { name: `Zostel & Boutique Stay ${dest}`, category: 'Budget', pricePerNight: 1800, rating: 4.5, area: 'Old Town Heritage', amenities: ['WiFi', 'Cafe'], pros: ['Budget friendly', 'Social vibe'], whyRecommended: 'Ideal for travelers looking for great value.' },
    { name: `The Lemon Tree Hotel ${dest}`, category: 'Mid-Range', pricePerNight: 3500, rating: 4.4, area: 'Central Market', amenities: ['Gym', 'Breakfast', 'WiFi'], pros: ['Central location', 'Clean rooms'], whyRecommended: 'Comfortable mid-range choice.' },
  ];

  const restaurants = [
    { name: `The Spice Trail ${dest}`, cuisine: 'North / South Indian', foodType: trip.food || 'Veg & Non-Veg', rating: 4.6, averageCostForTwo: 1200, mustTryDish: 'Chef Special Thali' },
    { name: `Coastal Flavors`, cuisine: 'Seafood / Regional', foodType: 'Regional Special', rating: 4.5, averageCostForTwo: 1500, mustTryDish: 'Signature Curry & Rice' },
    { name: `Heritage Garden Cafe`, cuisine: 'Cafe & Continental', foodType: 'Multi-cuisine', rating: 4.4, averageCostForTwo: 800, mustTryDish: 'Artisanal Coffee & Breakfast' },
  ];

  const transport = {
    recommendedMode: (trip.transport && trip.transport[0]) || 'Flight',
    recommendedRoute: `Direct travel from ${fromCity} to ${dest}`,
    options: [
      {
        mode: 'Flight',
        provider: 'IndiGo / Air India Direct',
        duration: '2h 30m',
        approxCost: 5500,
        boardingPoint: `${fromCity} Airport T3`,
        arrivalPoint: `${dest} Airport`,
        tips: 'Book non-stop flights 2-3 weeks in advance for lower fares.'
      },
      {
        mode: 'Train',
        provider: 'Vande Bharat / Express Train',
        duration: '8h 15m',
        approxCost: 1800,
        boardingPoint: `${fromCity} Central Station`,
        arrivalPoint: `${dest} Junction`,
        tips: 'Reserve AC 2-Tier or 3-Tier tickets early.'
      }
    ]
  };

  const budget = {
    currency: 'INR',
    transport: 10000,
    hotel: numDays * 3500,
    food: numDays * 1200,
    localTransport: numDays * 800,
    attractions: numDays * 500,
    shopping: 2000,
    miscellaneous: 1500,
    dailyAverage: 6500,
    estimatedTotal: 10000 + numDays * 6000,
    budgetSavingTip: 'Rent a local scooter or use ride sharing to cut daily commute costs.'
  };

  const days = [];
  for (let i = 1; i <= numDays; i++) {
    days.push({
      day: i,
      date: trip.startDate,
      theme: i === 1 ? `Arrival from ${fromCity} & Hotel Check-in` : i === 2 ? `Exploring Top Landmarks & Local Markets` : `Scenic Viewpoints & Departure`,
      estimatedDailyExpense: 5000,
      travelTip: 'Start early morning to avoid peak afternoon crowds.',
      events: [
        { time: '09:00 AM', title: `Board Transport from ${fromCity}`, description: `Begin journey from ${fromCity} towards ${dest}.`, location: `${fromCity} Station / Airport`, duration: '3 Hours', estimatedCost: 2500, category: 'Transport', icon: '✈️' },
        { time: '01:00 PM', title: `Hotel Check-in & Lunch`, description: `Check into hotel, relax, and savor local ${trip.food || 'delicacies'}.`, location: `${dest} Hotel`, duration: '1.5 Hours', estimatedCost: 800, category: 'Food', icon: '🏨' },
        { time: '03:30 PM', title: `Visit Historic Landmarks in ${dest}`, description: `Explore famous monuments, museums, and key tourist spots.`, location: `Central ${dest}`, duration: '3 Hours', estimatedCost: 400, category: 'Sightseeing', icon: '🏛️' },
        { time: '07:00 PM', title: `Evening Market Walk & Dinner`, description: `Stroll through vibrant evening bazaars and enjoy traditional dinner.`, location: `Local Market ${dest}`, duration: '2.5 Hours', estimatedCost: 1000, category: 'Dining', icon: '🍽️' },
      ],
    });
  }

  return {
    tripSummary: {
      fromLocation: fromCity,
      destination: dest,
      startDate: trip.startDate,
      endDate: trip.endDate,
      totalDays: numDays,
      travelers: trip.people || '1 Traveler',
      budget: trip.budget || 'Standard',
      travelStyle: Array.isArray(trip.travelStyle) ? trip.travelStyle.join(', ') : (trip.travelStyle || 'Sightseeing'),
      bestTimeToVisit: 'October to March',
      weatherExpectation: 'Pleasant, clear skies'
    },
    days,
    hotels,
    recommendedHotels: hotels.map(h => ({ name: h.name, pricePerNight: `₹${h.pricePerNight} / night`, rating: `${h.rating}★`, area: h.area })),
    restaurants,
    transitOptions: { preferredMode: transport.recommendedMode, summary: transport.recommendedRoute, options: transport.options },
    budgetBreakdown: { currency: '₹', transitCost: `₹${budget.transport}`, accommodationCost: `₹${budget.hotel}`, foodAndDiningCost: `₹${budget.food}`, localCommuteCost: `₹${budget.localTransport}`, activitiesCost: `₹${budget.attractions}`, estimatedTotalCost: `₹${budget.estimatedTotal}` },
    estimatedCost: `₹${budget.estimatedTotal.toLocaleString('en-IN')}`,
    mustVisitPlaces: [
      { name: `Top Landmark in ${dest}`, description: `Famous historical and cultural attraction.`, entryFee: 250, recommendedDuration: '2 Hours', bestTime: 'Morning' }
    ],
    packingChecklist: ['Comfortable walking shoes', 'Sunscreen & sunglasses', 'Power bank', 'Light clothing'],
    shoppingRecommendations: [`Handicraft bazaars in ${dest}`, `Local spice market`],
    essentialTips: ['Keep UPI and small cash bills ready.', 'Carry a reusable water bottle.'],
    emergencyInformation: { police: '112', ambulance: '108', touristHelpline: '1363', nearestHospital: `City Hospital ${dest}` },
    tripStatistics: { totalPlacesCovered: numDays * 4, totalRestaurantsSuggested: 5, estimatedTravelDistance: '350 km', averageDailyExpense: 5000, walkingLevel: 'Moderate', familyFriendly: true },
  };
}

function normalizeItineraryResponse(parsed, fallback) {
  if (!parsed || typeof parsed !== 'object') return fallback;

  // Standardize event desc/description and title
  const days = (Array.isArray(parsed.days) && parsed.days.length > 0 ? parsed.days : fallback.days).map((d) => ({
    ...d,
    title: d.title || d.theme || 'Day Schedule',
    events: (d.events || []).map((e) => ({
      ...e,
      desc: e.desc || e.description || '',
      description: e.description || e.desc || '',
      title: e.title || 'Activity',
      time: e.time || '10:00 AM',
      icon: e.icon || '📍',
    })),
  }));

  const hotels = Array.isArray(parsed.hotels) && parsed.hotels.length > 0
    ? parsed.hotels
    : Array.isArray(parsed.recommendedHotels) && parsed.recommendedHotels.length > 0
    ? parsed.recommendedHotels
    : fallback.hotels;

  const recommendedHotels = hotels.map((h) => ({
    name: h.name || 'Recommended Hotel',
    pricePerNight: typeof h.pricePerNight === 'number' ? `₹${h.pricePerNight.toLocaleString('en-IN')} / night` : (h.pricePerNight || '₹3,500 / night'),
    rating: typeof h.rating === 'number' ? `${h.rating}★` : (h.rating || '4.5★'),
    area: h.area || 'Central Area',
    category: h.category || 'Mid-Range',
    amenities: h.amenities || [],
    pros: h.pros || [],
    whyRecommended: h.whyRecommended || '',
  }));

  const transport = parsed.transport || fallback.transport;
  const transitOptions = parsed.transitOptions || {
    preferredMode: transport?.recommendedMode || 'Flight',
    summary: transport?.recommendedRoute || 'Travel Options',
    options: (transport?.options || []).map((o) => ({
      mode: o.mode || 'Flight',
      details: `${o.provider || 'Airline/Express'} (${o.boardingPoint || 'Source'} to ${o.arrivalPoint || 'Destination'})`,
      duration: o.duration || '2h 30m',
      approxCostPerPerson: typeof o.approxCost === 'number' ? `₹${o.approxCost.toLocaleString('en-IN')}` : (o.approxCost || '₹5,000'),
      boardingInfo: `Board from ${o.boardingPoint || 'Station/Airport'} -> ${o.arrivalPoint || 'Arrival'}`,
      tips: o.tips || '',
    })),
  };

  const budgetObj = parsed.budget || fallback.budget;
  const budgetBreakdown = parsed.budgetBreakdown || {
    currency: budgetObj?.currency || '₹',
    transitCost: typeof budgetObj?.transport === 'number' ? `₹${budgetObj.transport.toLocaleString('en-IN')}` : (budgetObj?.transport || '₹10,000'),
    accommodationCost: typeof budgetObj?.hotel === 'number' ? `₹${budgetObj.hotel.toLocaleString('en-IN')}` : (budgetObj?.hotel || '₹14,000'),
    foodAndDiningCost: typeof budgetObj?.food === 'number' ? `₹${budgetObj.food.toLocaleString('en-IN')}` : (budgetObj?.food || '₹6,000'),
    localCommuteCost: typeof budgetObj?.localTransport === 'number' ? `₹${budgetObj.localTransport.toLocaleString('en-IN')}` : (budgetObj?.localTransport || '₹3,000'),
    activitiesCost: typeof budgetObj?.attractions === 'number' ? `₹${budgetObj.attractions.toLocaleString('en-IN')}` : (budgetObj?.attractions || '₹2,000'),
    estimatedTotalCost: typeof budgetObj?.estimatedTotal === 'number' ? `₹${budgetObj.estimatedTotal.toLocaleString('en-IN')}` : (budgetObj?.estimatedTotal || '₹38,000'),
  };

  const estimatedTotalCost = typeof budgetObj?.estimatedTotal === 'number'
    ? `₹${budgetObj.estimatedTotal.toLocaleString('en-IN')}`
    : (parsed.estimatedTotalCost || budgetBreakdown.estimatedTotalCost || fallback.estimatedTotalCost);

  // IMPORTANT: Do NOT return 'transport', 'budget', 'travelStyle', 'food', 'people'
  // These field names collide with the user's original trip preferences stored in MongoDB.
  // The AI's transport/budget data is mapped into transitOptions/budgetBreakdown instead.
  return {
    tripSummary: parsed.tripSummary || fallback.tripSummary,
    days,
    hotels,
    recommendedHotels,
    restaurants: parsed.restaurants || fallback.restaurants,
    transitOptions,
    budgetBreakdown,
    estimatedCost: estimatedTotalCost,
    mustVisitPlaces: parsed.mustVisitPlaces || fallback.mustVisitPlaces,
    packingChecklist: parsed.packingChecklist || fallback.packingChecklist,
    shoppingRecommendations: parsed.shoppingRecommendations || fallback.shoppingRecommendations,
    essentialTips: parsed.essentialTips || fallback.essentialTips,
    emergencyInformation: parsed.emergencyInformation || fallback.emergencyInformation,
    tripStatistics: parsed.tripStatistics || fallback.tripStatistics,
  };
}

async function generateItinerary(trip) {
  const prompt = buildPrompt(trip);
  const fallback = generateFallbackTrip(trip);

  try {
    console.log(`Calling Groq for trip ${trip._id} to ${trip.destination}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000);

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are YatraAI, an intelligent AI Travel Planner. You MUST return ONLY raw valid JSON matching the exact JSON format specified in the prompt without markdown syntax or preamble.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 3800,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Groq API returned error (${response.status}): ${errText}. Using fallback generator.`);
      return fallback;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.warn('Groq returned empty response. Using fallback generator.');
      return fallback;
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      console.warn('Groq response JSON parse failed. Using fallback generator.');
      return fallback;
    }

    return normalizeItineraryResponse(parsed, fallback);
  } catch (err) {
    console.warn(`Groq API exception (${err.message}). Using fallback generator.`);
    return fallback;
  }
}

async function* streamItinerary(trip, signal) {
  const prompt = buildPrompt(trip);

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    signal,
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are YatraAI, an intelligent AI Travel Planner. You MUST return ONLY raw valid JSON matching the exact JSON format specified in the prompt.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 3800,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq stream failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep partial line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const dataStr = trimmed.slice(6);
        if (dataStr === '[DONE]') return;
        try {
          const json = JSON.parse(dataStr);
          const chunk = json.choices?.[0]?.delta?.content || '';
          if (chunk) yield chunk;
        } catch {
          // ignore partial json chunk parse errors
        }
      }
    }
  }
}

module.exports = { generateItinerary, streamItinerary, normalizeItineraryResponse };