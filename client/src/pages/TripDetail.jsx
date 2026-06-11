import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

/* ── Mock trip data ───────────────────────────────────────── */
const tripData = {
  destination: 'Jaipur',
  dates: 'Mar 15 - Mar 20, 2026',
  people: 'Couple',
  budget: 'Standard',
  status: 'Completed',
  emoji: '🏰',
};

const itineraryDays = [
  {
    day: 1,
    title: 'Arrival & Heritage',
    events: [
      { time: '8:00 AM', title: 'Arrive at Jaipur Airport', desc: 'Check into Rambagh Palace Hotel. Freshen up and have breakfast.', icon: '✈️' },
      { time: '11:00 AM', title: 'Hawa Mahal Visit', desc: 'Explore the iconic Palace of Winds. Great photo opportunities from the rooftop.', icon: '🏛️' },
      { time: '1:00 PM', title: 'Lunch at LMB', desc: 'Try the famous dal bati churma and ghewar at Laxmi Mishthan Bhandar.', icon: '🍽️' },
      { time: '3:00 PM', title: 'City Palace Tour', desc: 'Explore the royal museum, courtyards, and gardens. See the Peacock Gate.', icon: '👑' },
      { time: '6:00 PM', title: 'Nahargarh Fort Sunset', desc: 'Drive up to Nahargarh for panoramic sunset views of the Pink City.', icon: '🌇' },
      { time: '8:00 PM', title: 'Dinner at 1135 AD', desc: 'Royal dining experience at Amber Fort with traditional Rajasthani cuisine.', icon: '🥘' },
    ],
  },
  {
    day: 2,
    title: 'Forts & Markets',
    events: [
      { time: '7:00 AM', title: 'Amber Fort Excursion', desc: 'Take an elephant ride up to the magnificent fort. Explore Sheesh Mahal (Mirror Palace).', icon: '🐘' },
      { time: '12:00 PM', title: 'Jal Mahal Photo Stop', desc: 'Visit the stunning Water Palace in Man Sagar Lake. Perfect for photography.', icon: '📸' },
      { time: '1:30 PM', title: 'Street Food Tour', desc: 'Explore Johari Bazaar. Try pyaaz kachori, mirchi bada, and kulfi.', icon: '🥘' },
      { time: '4:00 PM', title: 'Jantar Mantar', desc: 'Visit the UNESCO World Heritage astronomical observation site.', icon: '🔭' },
      { time: '6:00 PM', title: 'Bazaar Shopping', desc: 'Shop for block prints, gemstones, blue pottery, and mojari shoes.', icon: '🛍️' },
      { time: '8:30 PM', title: 'Rooftop Dinner', desc: 'Enjoy skyline views at Wind View Café with live folk music.', icon: '🎵' },
    ],
  },
  {
    day: 3,
    title: 'Art, Culture & Departure',
    events: [
      { time: '8:00 AM', title: 'Albert Hall Museum', desc: "Explore India's oldest museum with Indo-Saracenic architecture.", icon: '🏛️' },
      { time: '10:30 AM', title: 'Anokhi Museum', desc: 'Learn about hand block printing traditions of Rajasthan.', icon: '🎨' },
      { time: '12:00 PM', title: 'Farewell Lunch', desc: 'Enjoy a royal thali at Chokhi Dhani ethnic village resort.', icon: '🍛' },
      { time: '3:00 PM', title: 'Souvenir Shopping', desc: 'Last-minute shopping at Bapu Bazaar for textiles and handicrafts.', icon: '🎁' },
      { time: '5:00 PM', title: 'Depart Jaipur', desc: 'Head to the airport with beautiful memories of the Pink City.', icon: '👋' },
    ],
  },
];

const packingItems = [
  { id: 1, item: 'Comfortable walking shoes', category: 'Clothing' },
  { id: 2, item: 'Light cotton clothes', category: 'Clothing' },
  { id: 3, item: 'Sun hat & sunglasses', category: 'Accessories' },
  { id: 4, item: 'Sunscreen SPF 50+', category: 'Toiletries' },
  { id: 5, item: 'Camera + charger', category: 'Electronics' },
  { id: 6, item: 'Power bank', category: 'Electronics' },
  { id: 7, item: 'Water bottle', category: 'Essentials' },
  { id: 8, item: 'First aid kit', category: 'Essentials' },
  { id: 9, item: 'Light scarf/dupatta for temples', category: 'Clothing' },
  { id: 10, item: 'Copies of ID & booking confirmations', category: 'Documents' },
];

export default function TripDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('itinerary');
  const [checkedItems, setCheckedItems] = useState({});
  const [notes, setNotes] = useState({ 1: '', 2: '', 3: '' });
  const [toast, setToast] = useState(null);

  const toggleCheck = (itemId) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const tabs = [
    { key: 'itinerary', label: 'Itinerary', icon: '📋' },
    { key: 'map', label: 'Map', icon: '🗺️' },
    { key: 'packing', label: 'Packing List', icon: '🎒' },
    { key: 'notes', label: 'Notes', icon: '📝' },
  ];

  const statusColors = {
    Completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Upcoming: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    Planning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0F0F0F] transition-colors duration-300">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-3xl">
                {tripData.emoji}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-on-surface dark:text-white">{tripData.destination}</h1>
                <p className="text-sm text-secondary dark:text-gray-400">{tripData.dates}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-3 py-1 rounded-lg ${statusColors[tripData.status]}`}>
                {tripData.status}
              </span>
              <span className="text-xs px-3 py-1 rounded-lg bg-surface-container dark:bg-white/5 text-secondary dark:text-gray-400">
                👥 {tripData.people}
              </span>
              <span className="text-xs px-3 py-1 rounded-lg bg-surface-container dark:bg-white/5 text-secondary dark:text-gray-400">
                💰 {tripData.budget}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setToast('PDF export coming soon!')}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              Export PDF
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setToast('Link copied to clipboard!');
              }}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
              Share Link
            </button>
            <button
              onClick={() => setToast('Edit mode coming soon!')}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Edit Trip
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 border-b border-outline-variant/30 dark:border-white/10 overflow-x-auto scroll-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary-container text-primary-container'
                  : 'border-transparent text-secondary dark:text-gray-400 hover:text-on-surface dark:hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-6 animate-fade-in" key={activeTab}>
          {/* ── Itinerary Tab ──────────────────────────── */}
          {activeTab === 'itinerary' && (
            <div className="space-y-8">
              {itineraryDays.map((day) => (
                <div key={day.day}>
                  <h3 className="text-lg font-bold text-on-surface dark:text-white mb-4">
                    Day {day.day}: {day.title}
                  </h3>

                  <div className="relative pl-8 space-y-0">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-outline-variant/30 dark:bg-white/10" />

                    {day.events.map((event, i) => (
                      <div key={i} className="relative pb-6 last:pb-0">
                        {/* Timeline dot */}
                        <div className="absolute -left-5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest dark:bg-[#0F0F0F] border-2 border-primary-container text-xs">
                          {event.icon}
                        </div>

                        <div className="rounded-xl border border-outline-variant/20 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.02] p-4 ml-4 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-primary-container">{event.time}</span>
                          </div>
                          <h4 className="font-semibold text-sm text-on-surface dark:text-white">{event.title}</h4>
                          <p className="text-sm text-secondary dark:text-gray-400 mt-1 leading-relaxed">{event.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Map Tab ────────────────────────────────── */}
          {activeTab === 'map' && (
            <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 overflow-hidden">
              <iframe
                title="Trip Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d227749.05364834927!2d75.65045930609833!3d26.88511680125647!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396c4adf4c57e281%3A0xce1c63a0cf22e09!2sJaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              />
            </div>
          )}

          {/* ── Packing List Tab ───────────────────────── */}
          {activeTab === 'packing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-secondary dark:text-gray-400">
                  {Object.values(checkedItems).filter(Boolean).length} of {packingItems.length} packed
                </p>
                <div className="h-2 w-32 rounded-full bg-surface-container dark:bg-white/10">
                  <div
                    className="h-2 rounded-full bg-primary-container transition-all"
                    style={{ width: `${(Object.values(checkedItems).filter(Boolean).length / packingItems.length) * 100}%` }}
                  />
                </div>
              </div>

              {packingItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                    checkedItems[item.id]
                      ? 'border-primary-container/30 bg-primary-container/5'
                      : 'border-outline-variant/30 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.02] hover:border-primary-container/20'
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                    checkedItems[item.id]
                      ? 'bg-primary-container border-primary-container'
                      : 'border-outline-variant/60 dark:border-white/20'
                  }`}>
                    {checkedItems[item.id] && (
                      <svg className="h-3 w-3 text-on-primary-container" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${checkedItems[item.id] ? 'line-through text-secondary dark:text-gray-500' : 'text-on-surface dark:text-white'}`}>
                    {item.item}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-surface-container dark:bg-white/5 text-secondary dark:text-gray-500">
                    {item.category}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── Notes Tab ──────────────────────────────── */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {[1, 2, 3].map((day) => (
                <div key={day}>
                  <h3 className="text-sm font-semibold text-on-surface dark:text-white mb-2">
                    Day {day} Notes
                  </h3>
                  <textarea
                    value={notes[day]}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [day]: e.target.value }))}
                    placeholder={`Add notes for Day ${day}...`}
                    rows={4}
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all resize-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weather Strip */}
        <div className="mt-10 rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-gradient-to-r from-blue-50 via-cyan-50 to-sky-50 dark:from-blue-900/10 dark:via-cyan-900/10 dark:to-sky-900/10 p-4">
          <div className="flex items-center gap-4 overflow-x-auto scroll-hidden">
            <span className="text-sm font-semibold text-on-surface dark:text-white whitespace-nowrap">Weather Forecast</span>
            {['Mon ☀️ 32°', 'Tue 🌤️ 30°', 'Wed ☀️ 34°', 'Thu 🌤️ 31°', 'Fri ☁️ 29°'].map((w, i) => (
              <span key={i} className="flex-shrink-0 text-xs text-secondary dark:text-gray-400 bg-white/60 dark:bg-white/5 px-3 py-1.5 rounded-lg whitespace-nowrap">
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
