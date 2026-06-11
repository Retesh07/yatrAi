import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';

/* ── Mock community trips ─────────────────────────────────── */
const allTrips = [
  { id: 1, destination: 'Jaipur Heritage Tour', user: 'Priya S.', avatar: 'P', days: 5, budget: '₹18K', style: 'Cultural', emoji: '🏰', color: 'from-pink-500 to-rose-600', likes: 234 },
  { id: 2, destination: 'Goa Beach Getaway', user: 'Arjun K.', avatar: 'A', days: 4, budget: '₹12K', style: 'Relaxation', emoji: '🏖️', color: 'from-cyan-500 to-blue-600', likes: 189 },
  { id: 3, destination: 'Manali Adventure Trip', user: 'Rahul M.', avatar: 'R', days: 6, budget: '₹25K', style: 'Adventure', emoji: '🏔️', color: 'from-emerald-500 to-teal-600', likes: 312 },
  { id: 4, destination: 'Kerala Backwaters', user: 'Sneha D.', avatar: 'S', days: 7, budget: '₹22K', style: 'Nature', emoji: '🌴', color: 'from-green-500 to-emerald-600', likes: 156 },
  { id: 5, destination: 'Varanasi Spiritual Journey', user: 'Amit R.', avatar: 'A', days: 3, budget: '₹8K', style: 'Spiritual', emoji: '🕉️', color: 'from-orange-500 to-amber-600', likes: 98 },
  { id: 6, destination: 'Udaipur Romantic Escape', user: 'Kavita P.', avatar: 'K', days: 4, budget: '₹30K', style: 'Relaxation', emoji: '💖', color: 'from-purple-500 to-violet-600', likes: 267 },
  { id: 7, destination: 'Rishikesh Yoga Retreat', user: 'Dev S.', avatar: 'D', days: 5, budget: '₹15K', style: 'Spiritual', emoji: '🧘', color: 'from-teal-500 to-cyan-600', likes: 145 },
  { id: 8, destination: 'Hampi Ruins Explorer', user: 'Nisha T.', avatar: 'N', days: 3, budget: '₹10K', style: 'Cultural', emoji: '🏛️', color: 'from-amber-500 to-orange-600', likes: 112 },
  { id: 9, destination: 'Leh-Ladakh Road Trip', user: 'Vikram G.', avatar: 'V', days: 10, budget: '₹45K', style: 'Adventure', emoji: '🏍️', color: 'from-blue-600 to-indigo-700', likes: 421 },
];

const destinations = ['All', 'Jaipur', 'Goa', 'Manali', 'Kerala', 'Varanasi', 'Udaipur', 'Rishikesh'];
const durations = ['All', '1-3 days', '4-6 days', '7+ days'];
const budgets = ['All', 'Under ₹10K', '₹10K-₹20K', '₹20K-₹40K', '₹40K+'];
const styles = ['All', 'Cultural', 'Adventure', 'Relaxation', 'Nature', 'Spiritual'];

export default function Explore() {
  const [filters, setFilters] = useState({
    destination: 'All',
    duration: 'All',
    budget: 'All',
    style: 'All',
  });
  const [visibleCount, setVisibleCount] = useState(6);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const filteredTrips = allTrips.filter((trip) => {
    if (filters.style !== 'All' && trip.style !== filters.style) return false;
    return true;
  });

  const displayedTrips = filteredTrips.slice(0, visibleCount);

  const handleCopy = (id) => {
    setCopiedId(id);
    setToast('Trip copied to your plans!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0F0F0F] transition-colors duration-300">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-on-surface dark:text-white">
            Explore Community Trips 🌍
          </h1>
          <p className="mt-2 text-secondary dark:text-gray-400">
            Discover itineraries created by fellow travelers and copy them for your own adventure
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mt-8 flex flex-wrap gap-3 animate-fade-in animation-delay-200">
          <div>
            <select
              value={filters.destination}
              onChange={(e) => updateFilter('destination', e.target.value)}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-2.5 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
            >
              {destinations.map((d) => <option key={d} value={d}>{d === 'All' ? '📍 All Destinations' : d}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filters.duration}
              onChange={(e) => updateFilter('duration', e.target.value)}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-2.5 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
            >
              {durations.map((d) => <option key={d} value={d}>{d === 'All' ? '📅 All Durations' : d}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filters.budget}
              onChange={(e) => updateFilter('budget', e.target.value)}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-2.5 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
            >
              {budgets.map((b) => <option key={b} value={b}>{b === 'All' ? '💰 All Budgets' : b}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filters.style}
              onChange={(e) => updateFilter('style', e.target.value)}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface-container-lowest dark:bg-white/5 px-4 py-2.5 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
            >
              {styles.map((s) => <option key={s} value={s}>{s === 'All' ? '🎨 All Styles' : s}</option>)}
            </select>
          </div>
        </div>

        {/* Trip Cards Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animation-delay-300">
          {displayedTrips.map((trip) => (
            <div
              key={trip.id}
              className="group rounded-2xl border border-outline-variant/30 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.03] overflow-hidden hover:border-primary-container/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`h-36 bg-gradient-to-br ${trip.color} flex items-center justify-center text-5xl`}>
                {trip.emoji}
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-on-surface dark:text-white">{trip.destination}</h3>

                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container/20 text-xs font-bold text-primary dark:text-primary-container">
                    {trip.avatar}
                  </div>
                  <span className="text-xs text-secondary dark:text-gray-400">by {trip.user}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-surface-container dark:bg-white/5 px-2 py-0.5 rounded-lg text-secondary dark:text-gray-400">
                    📅 {trip.days} days
                  </span>
                  <span className="text-xs bg-surface-container dark:bg-white/5 px-2 py-0.5 rounded-lg text-secondary dark:text-gray-400">
                    💰 {trip.budget}
                  </span>
                  <span className="text-xs bg-primary-container/10 px-2 py-0.5 rounded-lg text-primary dark:text-primary-container font-medium">
                    {trip.style}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-secondary dark:text-gray-500 flex items-center gap-1">
                    ❤️ {trip.likes}
                  </span>

                  <button
                    onClick={() => handleCopy(trip.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      copiedId === trip.id
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-primary-container/10 text-primary dark:text-primary-container hover:bg-primary-container/20'
                    }`}
                  >
                    {copiedId === trip.id ? '✓ Copied!' : '📋 Copy Trip'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {visibleCount < filteredTrips.length && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setVisibleCount((c) => c + 3)}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-8 py-3 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all duration-200"
            >
              Load More Trips
            </button>
          </div>
        )}

        {filteredTrips.length === 0 && (
          <div className="mt-20 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg text-secondary dark:text-gray-400">No trips match your filters</p>
            <button
              onClick={() => setFilters({ destination: 'All', duration: 'All', budget: 'All', style: 'All' })}
              className="mt-4 text-sm text-primary-container hover:underline font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <Footer />

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
