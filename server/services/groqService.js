const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function getDaysCount(startDate, endDate) {
  const diff = new Date(endDate) - new Date(startDate);
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
}

function buildPrompt(trip) {
  const numDays = getDaysCount(trip.startDate, trip.endDate);
  const fromCity = trip.fromLocation || 'Starting location';

  return `You are India's best expert tour planner AI. Create a highly detailed, practical, and price-aware travel itinerary.

Trip details:
- Starting location (From): ${fromCity}
- Destination (To): ${trip.destination}
- Duration: ${numDays} days (${trip.startDate} to ${trip.endDate})
- Travelers: ${trip.people || 'Not specified'}
- Budget level: ${trip.budget || 'Standard'}
- Travel style: ${(trip.travelStyle || []).join(', ') || 'General sightseeing'}
- Food preference: ${trip.food || 'No preference'}
- Preferred transport: ${(trip.transport || []).join(', ') || 'Any suitable transport'}

Requirements:
1. Provide 2-3 best hotel recommendations in ${trip.destination} suitable for ${trip.budget || 'Standard'} budget with exact hotel names, price per night in INR (₹), rating out of 5, and neighborhood/area.
2. Provide exact real place names to visit in ${trip.destination} for each day with realistic timings in "H:MM AM/PM" format.
3. Strict respect for food preference: ${trip.food}.
4. Provide estimated cost breakdown in Indian Rupees (₹).

Return ONLY valid JSON (no markdown wrapper, no extra commentary) in EXACTLY this shape:
{
  "estimatedTotalCost": "₹15,000",
  "recommendedHotels": [
    {
      "name": "Hotel Taj Palace / Zostel / ITC Rajputana",
      "pricePerNight": "₹3,500 / night",
      "rating": "4.5★",
      "area": "City Center"
    }
  ],
  "days": [
    {
      "day": 1,
      "title": "Theme for Day 1",
      "events": [
        {
          "time": "9:00 AM",
          "title": "Visit Amber Fort & Palace",
          "desc": "Explore the majestic hill fort and palace complex built in red sandstone and marble.",
          "icon": "🏰"
        }
      ]
    }
  ]
}

Generate exactly ${numDays} day(s).`;
}

function generateFallbackTrip(trip) {
  const numDays = getDaysCount(trip.startDate, trip.endDate);
  const dest = trip.destination || 'Goa';
  const fromCity = trip.fromLocation || 'Mumbai';

  const sampleHotels = [
    { name: `Grand Hyatt & Spa ${dest}`, pricePerNight: '₹4,500 / night', rating: '4.7★', area: 'Beachfront / City Center' },
    { name: `Zostel & Boutique Stay ${dest}`, pricePerNight: '₹1,800 / night', rating: '4.5★', area: 'Old Town Heritage' },
    { name: `The Lemon Tree Hotel ${dest}`, pricePerNight: '₹3,200 / night', rating: '4.4★', area: 'Central Market' },
  ];

  const days = [];
  for (let i = 1; i <= numDays; i++) {
    days.push({
      day: i,
      title: i === 1 ? `Arrival from ${fromCity} & Local Heritage` : i === 2 ? `Exploring Top Attractions & Local Markets` : `Scenic Viewpoints & Departure to ${fromCity}`,
      events: [
        { time: '9:00 AM', title: `Arrive in ${dest} & Hotel Check-in`, desc: `Journey from ${fromCity} to ${dest}. Settle into your hotel and enjoy breakfast.`, icon: '🧳' },
        { time: '11:30 AM', title: `Explore Famous Landmarks of ${dest}`, desc: `Visit iconic places, historical sites, and popular tourist spots in ${dest}.`, icon: '🏛️' },
        { time: '1:30 PM', title: `Local Cuisine Lunch (${trip.food || 'Vegetarian'})`, desc: `Taste authentic local dishes at a top-rated traditional restaurant.`, icon: '🍽️' },
        { time: '4:00 PM', title: `Local Market & Shopping Walk`, desc: `Shop for local handicrafts, souvenirs, and famous specialties of ${dest}.`, icon: '🛍️' },
        { time: '7:00 PM', title: `Sunset Point & Evening Dinner`, desc: `Relax at the best sunset view spot in ${dest} followed by a peaceful dinner.`, icon: '🌅' },
      ],
    });
  }

  return {
    days,
    recommendedHotels: sampleHotels,
    estimatedTotalCost: `₹${(numDays * 3500 + 4000).toLocaleString('en-IN')}`,
  };
}

async function generateItinerary(trip) {
  const prompt = buildPrompt(trip);

  try {
    console.log(`Calling Groq for trip ${trip._id} to ${trip.destination}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second max timeout for Groq API

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
          { role: 'system', content: 'You are an expert India travel planner AI. You MUST respond ONLY in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`Groq API returned error (${response.status}): ${errText}. Using fallback generator.`);
      return generateFallbackTrip(trip);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.warn('Groq returned empty response. Using fallback generator.');
      return generateFallbackTrip(trip);
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      console.warn('Groq response JSON parse failed. Using fallback generator.');
      return generateFallbackTrip(trip);
    }

    if (!Array.isArray(parsed.days) || parsed.days.length === 0) {
      console.warn('Groq response missing days array. Using fallback generator.');
      return generateFallbackTrip(trip);
    }

    return {
      days: parsed.days,
      recommendedHotels: parsed.recommendedHotels || generateFallbackTrip(trip).recommendedHotels,
      estimatedTotalCost: parsed.estimatedTotalCost || generateFallbackTrip(trip).estimatedTotalCost,
    };
  } catch (err) {
    console.warn(`Groq API exception (${err.message}). Using fallback generator.`);
    return generateFallbackTrip(trip);
  }
}

module.exports = { generateItinerary };