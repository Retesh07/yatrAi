const mockValidItinerary = {
  tripSummary: {
    fromLocation: 'Delhi',
    destination: 'Goa',
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    totalDays: 3,
    travelers: '2 Travelers',
    budget: 'Moderate',
    travelStyle: 'Relaxed & Beach',
    bestTimeToVisit: 'Nov to Feb',
    weatherExpectation: 'Warm and sunny',
  },
  days: [
    {
      day: 1,
      date: '2026-12-01',
      title: 'Arrival & Sunset Beach Walk',
      theme: 'Arrival & Sunset Beach Walk',
      estimatedDailyExpense: 3500,
      travelTip: 'Rent a scooter at the airport.',
      events: [
        {
          time: '11:00 AM',
          title: 'Arrival & Check-in',
          desc: 'Check into hotel near Calangute beach',
          description: 'Check into hotel near Calangute beach',
          location: 'Calangute',
          duration: '1.5 Hours',
          estimatedCost: 0,
          category: 'Stay',
          icon: '🏨',
        },
        {
          time: '04:30 PM',
          title: 'Sunset at Anjuna',
          desc: 'Enjoy the iconic sunset and beach shacks',
          description: 'Enjoy the iconic sunset and beach shacks',
          location: 'Anjuna Beach',
          duration: '2.5 Hours',
          estimatedCost: 1200,
          category: 'Sightseeing',
          icon: '🏖️',
        },
      ],
    },
  ],
  hotels: [
    {
      name: 'Taj Fort Aguada Resort',
      category: 'Luxury',
      pricePerNight: 9500,
      rating: 4.8,
      area: 'Sinquerim Beach',
      amenities: ['Pool', 'Spa', 'Ocean View'],
      pros: ['Historic property', 'Stunning views'],
      whyRecommended: 'Best beachfront experience in North Goa.',
    },
  ],
  recommendedHotels: [
    {
      name: 'Taj Fort Aguada Resort',
      pricePerNight: '₹9,500 / night',
      rating: '4.8★',
      area: 'Sinquerim Beach',
    },
  ],
  restaurants: [
    {
      name: "Fisherman's Wharf",
      cuisine: 'Goan Seafood',
      foodType: 'Non-Veg',
      rating: 4.7,
      averageCostForTwo: 1800,
      mustTryDish: 'Goan Prawn Curry',
    },
  ],
  transitOptions: {
    preferredMode: 'Flight',
    summary: 'Direct flight from Delhi to Goa',
    options: [
      {
        mode: 'Flight',
        provider: 'IndiGo 6E-205',
        duration: '2h 40m',
        approxCost: 5500,
        boardingPoint: 'DEL T3',
        arrivalPoint: 'GOI',
        tips: 'Book morning flights.',
      },
    ],
  },
  budgetBreakdown: {
    currency: 'INR',
    transitCost: '₹11,000',
    accommodationCost: '₹19,000',
    foodAndDiningCost: '₹6,000',
    localCommuteCost: '₹2,500',
    activitiesCost: '₹3,500',
    estimatedTotalCost: '₹42,000',
  },
  estimatedCost: '₹42,000',
  mustVisitPlaces: [
    {
      name: 'Aguada Fort',
      description: '17th century Portuguese fort and lighthouse',
      entryFee: 50,
      recommendedDuration: '1.5 Hours',
      bestTime: 'Late afternoon',
    },
  ],
  packingChecklist: ['Sunscreen SPF 50+', 'Beachwear', 'Light cotton shirts'],
  shoppingRecommendations: ['Anjuna Flea Market', 'Mapusa Friday Market'],
  essentialTips: ['Carry sunscreen at all times', 'Always wear helmets on rented scooters'],
  emergencyInformation: {
    police: '112',
    ambulance: '108',
    touristHelpline: '1363',
    nearestHospital: 'Manipal Hospital Goa',
  },
  tripStatistics: {
    totalPlacesCovered: 6,
    totalRestaurantsSuggested: 3,
    estimatedTravelDistance: '120 km',
    averageDailyExpense: 4500,
    walkingLevel: 'Easy',
    familyFriendly: true,
  },
};

const createMockFetchResponse = (data, options = {}) => {
  const status = options.status || 200;
  const ok = status >= 200 && status < 300;
  return Promise.resolve({
    ok,
    status,
    headers: {
      get: (header) => (header.toLowerCase() === 'retry-after' ? null : null),
    },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  });
};

const mockGroqSuccess = () => {
  return createMockFetchResponse({
    choices: [
      {
        message: {
          content: JSON.stringify(mockValidItinerary),
        },
      },
    ],
  });
};

const mockGroqFailure = (status = 500, message = 'Internal Groq Error') => {
  return createMockFetchResponse(message, { status });
};

const mockGroqMalformed = () => {
  return createMockFetchResponse({
    choices: [
      {
        message: {
          content: 'This is not valid JSON content {{{',
        },
      },
    ],
  });
};

module.exports = {
  mockValidItinerary,
  createMockFetchResponse,
  mockGroqSuccess,
  mockGroqFailure,
  mockGroqMalformed,
};
