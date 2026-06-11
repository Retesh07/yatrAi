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

export default function TripGenerator() {
  const location = useLocation();
  const navigate = useNavigate();
  const wizardData = location.state?.wizardData;

  const [activeDay, setActiveDay] = useState(1);
  const [streamedText, setStreamedText] = useState({});
  const [isStreaming, setIsStreaming] = useState(true);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [toast, setToast] = useState(null);
  const [rateLimit, setRateLimit] = useState({ used: 1, max: 5 });
  const streamRef = useRef(null);

  const totalDays = wizardData ? (() => {
    const diff = new Date(wizardData.endDate) - new Date(wizardData.startDate);
    return Math.max(1, Math.min(Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1, 3));
  })() : 3;

  /* ── Typewriter streaming simulation ────────────────────── */
  useEffect(() => {
    if (!isStreaming) return;

    const allSlots = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayData = mockItinerary[day] || mockItinerary[1];
      for (const slot of ['morning', 'afternoon', 'evening']) {
        allSlots.push({ day, slot, text: dayData[slot].desc });
      }
    }

    let slotIdx = 0;
    let charIdx = 0;

    streamRef.current = setInterval(() => {
      if (slotIdx >= allSlots.length) {
        clearInterval(streamRef.current);
        setIsStreaming(false);
        setGenerationComplete(true);
        return;
      }

      const current = allSlots[slotIdx];
      const key = `${current.day}-${current.slot}`;
      const chunk = current.text.slice(0, charIdx + 3);

      setStreamedText((prev) => ({ ...prev, [key]: chunk }));
      setActiveDay(current.day);

      charIdx += 3;
      if (charIdx >= current.text.length) {
        slotIdx++;
        charIdx = 0;
      }
    }, 30);

    return () => clearInterval(streamRef.current);
  }, [isStreaming, totalDays]);

  const handleSave = () => {
    setToast('Trip saved successfully!');
    setTimeout(() => navigate('/trip/1'), 1500);
  };

  if (!wizardData) {
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

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0F0F0F] transition-colors duration-300">
      <Navbar />

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Left Panel — Summary (40%) */}
        <aside className="w-full lg:w-[40%] border-b lg:border-b-0 lg:border-r border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#0a0a0a] p-6 lg:p-8 lg:overflow-y-auto">
          <h2 className="text-lg font-bold text-on-surface dark:text-white mb-6">Trip Summary</h2>

          <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface dark:bg-[#111] p-5 space-y-3">
            {[
              { icon: '📍', label: 'Destination', value: wizardData.destination },
              { icon: '📅', label: 'Dates', value: `${wizardData.startDate} → ${wizardData.endDate}` },
              { icon: '👥', label: 'Travelers', value: wizardData.people },
              { icon: '💰', label: 'Budget', value: wizardData.budget },
              { icon: '🎨', label: 'Style', value: wizardData.travelStyle.join(', ') },
              { icon: '🍽️', label: 'Food', value: wizardData.food },
              { icon: '🚗', label: 'Transport', value: wizardData.transport.join(', ') },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-base mt-0.5">{item.icon}</span>
                <div>
                  <p className="text-[11px] text-secondary dark:text-gray-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-medium text-on-surface dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Rate limit counter */}
          <div className="mt-6 rounded-xl border border-outline-variant/30 dark:border-white/10 bg-surface dark:bg-[#111] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-secondary dark:text-gray-400">API Usage</span>
              <span className="text-xs font-medium text-primary-container">{rateLimit.used}/{rateLimit.max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-container dark:bg-white/10">
              <div
                className="h-1.5 rounded-full bg-primary-container transition-all"
                style={{ width: `${(rateLimit.used / rateLimit.max) * 100}%` }}
              />
            </div>
          </div>

          {/* Weather Widget */}
          <div className="mt-6 rounded-xl border border-outline-variant/30 dark:border-white/10 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">☀️</span>
              <div>
                <p className="text-sm font-semibold text-on-surface dark:text-white">{wizardData.destination} Weather</p>
                <p className="text-xs text-secondary dark:text-gray-400">32°C · Sunny · Humidity 45%</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Panel — Itinerary (60%) */}
        <main className="flex-1 p-6 lg:p-8 lg:overflow-y-auto">
          {/* Day tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto scroll-hidden pb-2">
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-medium border transition-all duration-200 ${
                  activeDay === day
                    ? 'bg-primary-container text-on-primary-container border-primary-container shadow-md'
                    : 'border-outline-variant/40 dark:border-white/10 text-on-surface dark:text-gray-300 hover:bg-surface-container dark:hover:bg-white/5'
                }`}
              >
                Day {day}
              </button>
            ))}
          </div>

          {/* Streaming Status */}
          {isStreaming && (
            <div className="flex items-center gap-2 mb-6 text-sm text-primary-container">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-primary-container animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-primary-container animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-primary-container animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="font-medium">AI is generating your itinerary...</span>
            </div>
          )}

          {/* Itinerary Slots */}
          <div className="space-y-4">
            {['morning', 'afternoon', 'evening'].map((slot) => {
              const dayData = mockItinerary[activeDay] || mockItinerary[1];
              const slotData = dayData[slot];
              const key = `${activeDay}-${slot}`;
              const text = streamedText[key] || '';
              const isComplete = text.length >= slotData.desc.length;

              return (
                <div
                  key={slot}
                  className="rounded-2xl border border-outline-variant/30 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.03] p-5 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{slotData.icon}</span>
                    <div>
                      <h3 className="font-semibold text-on-surface dark:text-white">{slotData.title}</h3>
                      <p className="text-xs text-secondary dark:text-gray-500">{slotData.time}</p>
                    </div>
                    <span className="ml-auto text-xs font-medium capitalize px-2 py-0.5 rounded-lg bg-surface-container dark:bg-white/5 text-secondary dark:text-gray-400">
                      {slot}
                    </span>
                  </div>

                  <p className="text-sm text-on-surface/80 dark:text-gray-300 leading-relaxed">
                    {text}
                    {!isComplete && text.length > 0 && (
                      <span className="inline-block w-0.5 h-4 bg-primary-container ml-0.5 align-middle" style={{ animation: 'typewriter-blink 0.8s step-end infinite' }} />
                    )}
                  </p>

                  {text.length === 0 && (
                    <div className="flex gap-2">
                      <div className="h-3 rounded bg-surface-container dark:bg-white/5 animate-pulse w-3/4" />
                      <div className="h-3 rounded bg-surface-container dark:bg-white/5 animate-pulse w-1/4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save Button */}
          {generationComplete && (
            <div className="mt-8 animate-fade-in">
              <button
                id="save-trip-btn"
                onClick={handleSave}
                className="w-full rounded-xl bg-primary-container px-6 py-4 text-base font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 transition-all duration-200"
              >
                Save Trip 💾
              </button>
            </div>
          )}
        </main>
      </div>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
