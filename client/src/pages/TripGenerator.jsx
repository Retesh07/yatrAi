import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

/* ── Mock itinerary content per day ──────────────────────── */
const mockItinerary = {
  1: {
    morning: {
      title: 'Arrive & Settle In',
      desc: 'Check into your hotel and freshen up. Take a short walk around the neighborhood to get your bearings. Grab a light breakfast at a nearby café — try the local specialties.',
      time: '8:00 AM - 12:00 PM',
      icon: '🌅',
    },
    afternoon: {
      title: 'Heritage Walking Tour',
      desc: 'Visit the main historical landmarks. Explore the old city streets, markets, and architecture. Stop for a traditional lunch at a highly-rated local restaurant.',
      time: '12:00 PM - 5:00 PM',
      icon: '🏛️',
    },
    evening: {
      title: 'Sunset & Dinner',
      desc: 'Head to the best sunset viewpoint in the city. Enjoy golden hour photography. Finish with a rooftop dinner featuring local cuisine and live music.',
      time: '5:00 PM - 10:00 PM',
      icon: '🌇',
    },
  },
  2: {
    morning: {
      title: 'Temple & Culture Tour',
      desc: "Visit the most famous temples and cultural sites. Learn about the local history and traditions from your guide. Don't forget to try the temple prasad.",
      time: '7:00 AM - 12:00 PM',
      icon: '🕉️',
    },
    afternoon: {
      title: 'Market & Shopping',
      desc: 'Explore the vibrant local bazaars. Shop for handicrafts, textiles, and souvenirs. Bargain like a local! Stop for street food — try the famous local snacks.',
      time: '12:00 PM - 5:00 PM',
      icon: '🛍️',
    },
    evening: {
      title: 'Cooking Class & Night Walk',
      desc: 'Join a local cooking class to learn signature dishes. Walk through the illuminated old city at night. End with chai at a rooftop terrace.',
      time: '5:00 PM - 10:00 PM',
      icon: '👨‍🍳',
    },
  },
  3: {
    morning: {
      title: 'Day Trip Excursion',
      desc: 'Take a scenic drive to a nearby attraction. Explore forts, palaces, or natural wonders in the surrounding area. Pack a picnic or eat at a highway dhaba.',
      time: '6:00 AM - 12:00 PM',
      icon: '🚗',
    },
    afternoon: {
      title: 'Adventure Activity',
      desc: 'Experience local adventure sports — camel ride, zip-lining, trekking, or water activities depending on your destination. An adrenaline rush guaranteed!',
      time: '12:00 PM - 5:00 PM',
      icon: '🎢',
    },
    evening: {
      title: 'Farewell Dinner',
      desc: 'Enjoy a special farewell dinner at the best restaurant in the city. Reflect on your journey, share photos, and plan your next adventure. Pack up and rest.',
      time: '5:00 PM - 10:00 PM',
      icon: '🥂',
    },
  },
};

import { apiCreateTrip, apiGenerateTrip, apiGetTrip } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function TripGenerator() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, authLoading } = useAuth();
  const wizardData = location.state?.wizardData;

  const [trip, setTrip] = useState(null);
  const [draftTripId, setDraftTripId] = useState(() => sessionStorage.getItem('yatrai_draftTripId'));
  const [activeDay, setActiveDay] = useState(1);
  const [activeTab, setActiveTab] = useState('itinerary'); // 'itinerary' | 'hotels'
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function startTripGeneration() {
      if (authLoading) return; // Wait for auth session restore to finish
      if (!wizardData) return;
      if (!token) {
        navigate('/login');
        return;
      }
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        setIsGenerating(true);
        setError('');
        console.log('TripGenerator: starting generation', { wizardData, tokenPresent: !!token });

        // Step 1: Create draft trip in DB
        const createRes = await apiCreateTrip(wizardData, token);
        console.log('TripGenerator: draft trip created', createRes);
        if (!createRes.success || !createRes.trip) {
          throw new Error(createRes.message || 'Failed to create trip');
        }

        const draftTrip = createRes.trip;
        setDraftTripId(draftTrip._id);
        sessionStorage.setItem('yatrai_draftTripId', draftTrip._id);
        setTrip(draftTrip);

        // Step 2: Trigger AI generation (Groq API / Fallback)
        console.log('TripGenerator: triggering generation for trip id', draftTrip._id);
        const genRes = await apiGenerateTrip(draftTrip._id, token);
        console.log('TripGenerator: generation response', genRes);

        if (!genRes.success || !genRes.trip) {
          throw new Error(genRes.message || 'Trip generation failed');
        }

        if (isMounted) {
          setTrip(genRes.trip);
          setIsGenerating(genRes.trip.status === 'generating');
        }
      } catch (err) {
        console.error('Generation error:', err);
        if (isMounted) {
          setError(err.message || 'Failed to generate itinerary');
          setIsGenerating(false);
        }
      }
    }

    startTripGeneration();

    return () => {
      isMounted = false;
    };
  }, [wizardData, token, authLoading, navigate]);

  useEffect(() => {
    if (!draftTripId || !token) return;

    let intervalId;
    let isActive = true;

    async function pollTrip() {
      try {
        const tripRes = await apiGetTrip(draftTripId, token);
        if (!tripRes.success || !tripRes.trip) {
          return;
        }

        if (!isActive) return;
        setTrip(tripRes.trip);

        if (tripRes.trip.status === 'completed' && Array.isArray(tripRes.trip.days) && tripRes.trip.days.length > 0) {
          setIsGenerating(false);
          clearInterval(intervalId);
        } else if (tripRes.trip.status === 'failed') {
          setIsGenerating(false);
          setError('Trip generation failed. Please try again.');
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Trip polling error:', err);
      }
    }

    intervalId = setInterval(pollTrip, 3000);
    pollTrip();

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [draftTripId, token]);

  useEffect(() => {
    if (trip?.status === 'completed') {
      sessionStorage.removeItem('yatrai_draftTripId');
    }
  }, [trip]);

  const handleSave = () => {
    setToast('Trip saved to your Dashboard!');
    setTimeout(() => navigate('/dashboard'), 1200);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface dark:bg-[#0F0F0F]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-secondary dark:text-gray-400">
          <svg className="h-8 w-8 animate-spin text-primary-container mb-3" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
          </svg>
          Checking your session...
        </div>
      </div>
    );
  }

  if (!wizardData && !draftTripId) {
    return (
      <div className="min-h-screen bg-surface dark:bg-[#0F0F0F]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-4xl mb-4">🗺️</p>
          <p className="text-lg text-secondary dark:text-gray-400">No trip data found.</p>
          <button
            onClick={() => navigate('/plan')}
            className="mt-6 rounded-xl bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary-container hover:brightness-110 transition-all"
          >
            Start Planning
          </button>
        </div>
      </div>
    );
  }

  const daysList = trip?.days || [];
  const hotelList = trip?.recommendedHotels || [];
  const fromCity = wizardData?.fromLocation || trip?.fromLocation || 'Delhi';
  const toCity = wizardData?.destination || trip?.destination || 'Your destination';
  const startDate = wizardData?.startDate || trip?.startDate || '';
  const endDate = wizardData?.endDate || trip?.endDate || '';
  const people = wizardData?.people || trip?.people || '';
  const budget = wizardData?.budget || trip?.budget || '';
  const travelStyle = wizardData?.travelStyle || trip?.travelStyle || [];
  const food = wizardData?.food || trip?.food || '';
  const transport = wizardData?.transport || trip?.transport || [];
  const isTripReady = trip?.status === 'completed' && daysList.length > 0;
  const isTripPending = trip?.status === 'generating' || isGenerating;
  const showGenerating = isTripPending && !isTripReady;

  useEffect(() => {
    if (trip?.days?.length > 0) {
      setActiveDay(trip.days[0].day || 1);
    }
  }, [trip]);

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0F0F0F] transition-colors duration-300">
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Left Panel — Trip Details & Summary */}
        <aside className="w-full lg:w-[38%] border-b lg:border-b-0 lg:border-r border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#0a0a0a] p-6 lg:p-8 lg:overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-on-surface dark:text-white">Trip Summary</h2>
            {trip?.estimatedCost && (
              <span className="text-xs font-bold text-green-700 dark:text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                Est: {trip.estimatedCost}
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface dark:bg-[#111] p-5 space-y-3.5">
            <div className="flex items-start gap-3">
              <span className="text-lg">🚀</span>
              <div>
                <p className="text-[10px] text-secondary dark:text-gray-500 uppercase tracking-wider font-semibold">Route</p>
                <p className="text-sm font-semibold text-on-surface dark:text-white">{fromCity} ➔ {toCity}</p>
              </div>
            </div>

            {[
              { icon: '📅', label: 'Dates', value: `${startDate} → ${endDate}` },
              { icon: '👥', label: 'Travelers', value: people },
              { icon: '💰', label: 'Budget Level', value: budget },
              { icon: '🎨', label: 'Travel Style', value: Array.isArray(travelStyle) ? travelStyle.join(', ') : travelStyle },
              { icon: '🍽️', label: 'Food Preference', value: food },
              { icon: '🚗', label: 'Transport', value: Array.isArray(transport) ? transport.join(', ') : transport },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-[10px] text-secondary dark:text-gray-500 uppercase tracking-wider font-semibold">{item.label}</p>
                  <p className="text-xs font-medium text-on-surface dark:text-gray-200">{item.value || 'Default'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Hotel Recommendations Widget in Sidebar */}
          {hotelList.length > 0 && (
            <div className="mt-6 rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface dark:bg-[#111] p-5">
              <h3 className="text-sm font-bold text-on-surface dark:text-white mb-3 flex items-center gap-2">
                <span>🏨</span> Best Places to Stay
              </h3>
              <div className="space-y-3">
                {hotelList.map((hotel, idx) => (
                  <div key={idx} className="rounded-xl border border-outline-variant/20 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.03] p-3 text-xs">
                    <div className="flex items-center justify-between font-semibold text-on-surface dark:text-white">
                      <span>{hotel.name}</span>
                      <span className="text-amber-500">{hotel.rating || '4.5★'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-secondary dark:text-gray-400">
                      <span>📍 {hotel.area || toCity}</span>
                      <span className="font-bold text-primary-container">{hotel.pricePerNight}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Panel — Generated Itinerary */}
        <main className="flex-1 p-6 lg:p-8 lg:overflow-y-auto">
          {showGenerating ? (
            <div className="space-y-8 py-24">
              <div className="rounded-[32px] border border-white/10 bg-[#111111]/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl text-center">
                <div className="mx-auto mb-6 flex h-18 w-18 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-container to-primary text-white shadow-lg shadow-primary-container/20">
                  <span className="text-3xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Preparing your custom trip to {toCity}...</h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-400">
                  Groq AI is drafting your itinerary in the background. Keep this page open and it will update automatically when your plan is ready.
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-[32px] border border-white/10 bg-[#111111]/80 p-6 shadow-xl shadow-black/20 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Trip draft saved</p>
                      <h4 className="mt-2 text-xl font-semibold text-white">Your trip details are secured</h4>
                    </div>
                    <span className="rounded-full bg-primary-container/15 px-3 py-1 text-xs font-semibold text-primary-container">Pending</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: 'Route', value: `${fromCity} → ${toCity}` },
                      { label: 'Dates', value: `${startDate} → ${endDate}` },
                      { label: 'Travelers', value: people },
                      { label: 'Budget', value: budget },
                      { label: 'Style', value: Array.isArray(travelStyle) ? travelStyle.join(', ') : travelStyle },
                      { label: 'Food', value: food },
                      { label: 'Transport', value: Array.isArray(transport) ? transport.join(', ') : transport },
                    ].map((item, idx) => (
                      <div key={idx} className="rounded-[24px] border border-white/5 bg-white/5 p-4">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-1">{item.label}</p>
                        <p className="text-sm font-semibold text-white">{item.value || 'Not set'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#141414] to-[#0b0b0b] p-6 shadow-xl shadow-black/25 backdrop-blur-xl">
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Waiting for AI</p>
                    <h4 className="mt-3 text-xl font-semibold text-white">Perfect itinerary on the way</h4>
                  </div>
                  <div className="space-y-4 text-sm text-slate-300">
                    <p>✓ Draft saved to MongoDB</p>
                    <p>✓ Generation started on the server</p>
                    <p>✓ Your itinerary will appear here once Groq finishes</p>
                  </div>
                  <div className="mt-7 rounded-3xl bg-white/5 p-4 text-xs uppercase tracking-[0.28em] text-slate-500">
                    Tip: stay on this page for the smoothest experience.
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-error/20 bg-error/10 p-6 text-center text-error">
              <p className="text-2xl mb-2">⚠️</p>
              <h3 className="font-bold">Generation Failed</h3>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={() => navigate('/plan')}
                className="mt-4 rounded-xl bg-primary-container px-5 py-2.5 text-xs font-semibold text-on-primary-container"
              >
                Try Again
              </button>
            </div>
          ) : !trip ? (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-container p-10 text-center">
              <p className="text-2xl font-bold text-on-surface dark:text-white mb-3">Trip data is still loading...</p>
              <p className="text-sm text-secondary dark:text-gray-400">
                We created your trip draft but the itinerary hasn&apos;t arrived yet. Stay on this page for a moment or go back to the planner to try again.
              </p>
              <button
                onClick={() => navigate('/plan')}
                className="mt-6 rounded-xl bg-primary-container px-5 py-2.5 text-xs font-semibold text-on-primary-container"
              >
                Back to Planner
              </button>
            </div>
          ) : (
            <div>
              {/* Content Header & Tabs */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('itinerary')}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      activeTab === 'itinerary'
                        ? 'bg-primary-container text-on-primary-container shadow'
                        : 'border border-outline-variant/30 text-secondary hover:text-on-surface'
                    }`}
                  >
                    📍 Day-by-Day Places
                  </button>
                  <button
                    onClick={() => setActiveTab('hotels')}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                      activeTab === 'hotels'
                        ? 'bg-primary-container text-on-primary-container shadow'
                        : 'border border-outline-variant/30 text-secondary hover:text-on-surface'
                    }`}
                  >
                    🏨 Best Hotels ({hotelList.length})
                  </button>
                </div>

                {trip?.estimatedCost && (
                  <div className="text-xs font-semibold text-on-surface dark:text-white">
                    Total Estimated Cost: <span className="text-green-600 dark:text-green-400 text-sm font-bold">{trip.estimatedCost}</span>
                  </div>
                )}
              </div>

              {activeTab === 'hotels' ? (
                /* Hotels View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  {hotelList.map((hotel, idx) => (
                    <div key={idx} className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs text-primary-container font-semibold">Recommended Hotel #{idx + 1}</span>
                          <h4 className="text-base font-bold text-on-surface dark:text-white mt-0.5">{hotel.name}</h4>
                          <p className="text-xs text-secondary dark:text-gray-400 mt-1">📍 {hotel.area || toCity}</p>
                        </div>
                        <span className="text-sm font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                          {hotel.rating || '4.5★'}
                        </span>
                      </div>
                      <div className="mt-4 pt-3 border-t border-outline-variant/20 dark:border-white/5 flex items-center justify-between">
                        <span className="text-xs text-secondary dark:text-gray-400">Est. Price:</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">{hotel.pricePerNight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Itinerary View */
                <div>
                  {/* Day tabs */}
                  <div className="flex gap-2 mb-6 overflow-x-auto scroll-hidden pb-2">
                    {daysList.map((d) => (
                      <button
                        key={d.day}
                        onClick={() => setActiveDay(d.day)}
                        className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium border transition-all duration-200 ${
                          activeDay === d.day
                            ? 'bg-primary-container text-on-primary-container border-primary-container shadow-md'
                            : 'border-outline-variant/40 dark:border-white/10 text-on-surface dark:text-gray-300 hover:bg-surface-container dark:hover:bg-white/5'
                        }`}
                      >
                        Day {d.day}
                      </button>
                    ))}
                  </div>

                  {/* Active Day Events */}
                  {(() => {
                    const currentDay = daysList.find((d) => d.day === activeDay) || daysList[0];
                    if (!currentDay) return null;

                    return (
                      <div className="space-y-4 animate-fade-in">
                        <h3 className="text-base font-bold text-on-surface dark:text-white mb-2">
                          Day {currentDay.day}: {currentDay.title}
                        </h3>

                        <div className="space-y-4">
                          {(currentDay.events || []).map((ev, idx) => (
                            <div
                              key={idx}
                              className="rounded-2xl border border-outline-variant/30 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.03] p-5 hover:border-primary-container/30 transition-all duration-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{ev.icon || '📍'}</span>
                                  <div>
                                    <h4 className="font-bold text-sm text-on-surface dark:text-white">{ev.title}</h4>
                                    <p className="text-xs text-primary-container font-mono">{ev.time}</p>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm text-on-surface/80 dark:text-gray-300 leading-relaxed mt-2 pl-9">
                                {ev.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Save / View Dashboard CTA */}
              <div className="mt-8">
                <button
                  id="save-trip-btn"
                  onClick={handleSave}
                  className="w-full rounded-xl bg-primary-container px-6 py-4 text-base font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 transition-all duration-200"
                >
                  Save & Go To Dashboard 💾
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
