import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { apiGetMyTrips, apiDeleteTrip } from '../api/client';

const sidebarLinks = [
  { label: 'Dashboard', path: '/dashboard', active: true },
  { label: 'Explore', path: '/explore' },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Settings', path: '/settings' },
];

const statusColors = {
  completed: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
  generating: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  draft: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  failed: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400',
};

const tripGradients = [
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-indigo-600',
  'from-amber-500 to-orange-600',
];

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTrips() {
      if (!token) return;
      try {
        setLoading(true);
        const data = await apiGetMyTrips(token);
        if (data.success) {
          setTrips(data.trips || []);
        }
      } catch (err) {
        console.error('Error loading trips:', err);
        setError('Could not load trips');
      } finally {
        setLoading(false);
      }
    }
    fetchTrips();
  }, [token]);

  const handleDeleteTrip = async (e, tripId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this trip?')) return;
    try {
      await apiDeleteTrip(tripId, token);
      setTrips((prev) => prev.filter((t) => t._id !== tripId));
    } catch (err) {
      console.error('Failed to delete trip:', err);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDaysCount = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const diff = new Date(endDate) - new Date(startDate);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0a0a0a] transition-colors duration-300">
      <Navbar />

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] border-r border-outline-variant/30 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#0e0e0e] p-4">
          <nav className="flex flex-col gap-1 mt-4">
            {sidebarLinks.map((link, i) => (
              <Link
                key={i}
                to={link.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  link.active
                    ? 'bg-primary-container/15 text-primary dark:text-primary-container'
                    : 'text-secondary dark:text-gray-400 hover:bg-surface-container dark:hover:bg-white/5 hover:text-on-surface dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-6xl">
          {/* Greeting */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-on-surface dark:text-white">
              {getGreeting()}, {user?.name || 'Traveler'}
            </h1>
            <p className="mt-1 text-secondary dark:text-gray-400">
              Here's what's happening with your trips
            </p>
          </div>

          {/* Stats Row */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in animation-delay-200">
            {[
              { label: 'Total Trips', value: trips.length.toString(), change: 'Your planned trips' },
              { label: 'Completed', value: trips.filter(t => t.status === 'completed').length.toString(), change: 'AI generated' },
              { label: 'Drafts', value: trips.filter(t => t.status === 'draft').length.toString(), change: 'In progress' },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl border border-outline-variant/30 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] p-5 hover:shadow-lg hover:shadow-primary-container/5 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-secondary dark:text-gray-400">{stat.label}</p>
                  <span className="text-xs text-secondary dark:text-gray-500">{stat.change}</span>
                </div>
                <p className="mt-3 text-3xl font-bold text-on-surface dark:text-white">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Trips */}
          <div className="mt-10 animate-fade-in animation-delay-300">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-on-surface dark:text-white">Your Trips</h2>
              {trips.length > 0 && (
                <button
                  onClick={() => navigate('/plan')}
                  className="text-sm text-primary-container hover:underline font-medium"
                >
                  + Create New
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-secondary dark:text-gray-400">
                <svg className="h-8 w-8 animate-spin mx-auto text-primary-container mb-2" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                </svg>
                Loading your trips...
              </div>
            ) : trips.length === 0 ? (
              <div className="rounded-2xl border border-outline-variant/30 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] p-8 text-center">
                <p className="text-4xl mb-3">🧭</p>
                <p className="text-base font-semibold text-on-surface dark:text-white">No trips created yet</p>
                <p className="text-xs text-secondary dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Click the button below to answer 7 quick questions and generate your first AI trip itinerary!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {trips.map((trip, idx) => {
                  const gradient = tripGradients[idx % tripGradients.length];
                  const numDays = getDaysCount(trip.startDate, trip.endDate);
                  const statusLabel = trip.status || 'draft';

                  return (
                    <Link
                      key={trip._id}
                      to={`/trip/${trip._id}`}
                      className="group flex-col rounded-2xl border border-outline-variant/30 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] overflow-hidden hover:border-primary-container/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex"
                    >
                      <div className={`h-24 bg-gradient-to-br ${gradient} flex items-start justify-between p-3 relative`}>
                        <span className="text-xs font-medium text-white/90 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-md self-end">
                          {trip.budget || 'Standard'}
                        </span>
                        <div className="flex items-center gap-1.5 self-start">
                          <button
                            onClick={(e) => handleDeleteTrip(e, trip._id)}
                            className="h-7 w-7 rounded-lg bg-black/30 hover:bg-red-600/80 text-white flex items-center justify-center backdrop-blur-sm transition-all"
                            title="Delete trip"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-on-surface dark:text-white group-hover:text-primary-container transition-colors">
                              {trip.destination}
                            </h3>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-lg capitalize ${statusColors[statusLabel] || statusColors.draft}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-secondary dark:text-gray-500">
                            {trip.startDate} → {trip.endDate}
                          </p>
                        </div>
                        {trip.travelStyle && trip.travelStyle.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {trip.travelStyle.slice(0, 2).map((style, i) => (
                              <span key={i} className="text-[10px] bg-surface-container dark:bg-white/5 text-secondary dark:text-gray-400 px-2 py-0.5 rounded">
                                {style}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Plan a new trip CTA */}
          <div className="mt-10 animate-fade-in animation-delay-400">
            <div className="rounded-2xl border border-dashed border-outline-variant/50 dark:border-white/[0.08] bg-surface-container-low dark:bg-[#111111] p-8 text-center hover:border-primary-container/40 transition-all duration-300">
              <h3 className="text-lg font-semibold text-on-surface dark:text-white">Plan a New Trip</h3>
              <p className="mt-1 text-sm text-secondary dark:text-gray-400">
                Let AI create your perfect itinerary in seconds
              </p>
              <button
                id="dashboard-plan-btn"
                onClick={() => navigate('/plan')}
                className="mt-5 rounded-xl bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 transition-all duration-200"
              >
                Start Planning
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
