import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/* ── Mock data ────────────────────────────────────────────── */
const recentTrips = [
  { id: '1', destination: 'Jaipur', dates: '15 Mar – 20 Mar', status: 'Completed', color: 'from-pink-500 to-rose-600', days: 5, cost: '₹18,500' },
  { id: '2', destination: 'Goa', dates: '02 Apr – 07 Apr', status: 'Upcoming', color: 'from-cyan-500 to-blue-600', days: 5, cost: '₹22,000' },
  { id: '3', destination: 'Manali', dates: '10 May – 16 May', status: 'Planning', color: 'from-emerald-500 to-teal-600', days: 6, cost: '₹28,000' },
  { id: '4', destination: 'Kerala', dates: '01 Jun – 08 Jun', status: 'Draft', color: 'from-green-500 to-emerald-600', days: 7, cost: '₹35,000' },
];

const sidebarLinks = [
  { label: 'Dashboard', path: '/dashboard', active: true },
  { label: 'My Trips', path: '/dashboard' },
  { label: 'Explore', path: '/explore' },
  { label: 'Notifications', path: '/notifications' },
  { label: 'Settings', path: '/settings' },
];

const statusColors = {
  Completed: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
  Upcoming: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  Planning: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
  Draft: 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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

          <div className="mt-auto">
            <div className="rounded-2xl border border-outline-variant/30 dark:border-white/[0.06] bg-gradient-to-br from-primary-container/10 to-primary/5 dark:from-primary-container/5 dark:to-transparent p-5">
              <p className="text-sm font-semibold text-on-surface dark:text-white">Go Premium</p>
              <p className="mt-1 text-xs text-secondary dark:text-gray-400">Unlock unlimited AI trips and more.</p>
              <button className="mt-3 w-full rounded-lg bg-primary-container px-3 py-2 text-xs font-semibold text-on-primary-container hover:brightness-110 transition-all">
                Upgrade Now
              </button>
            </div>
          </div>
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
              { label: 'Total Trips', value: '12', change: '+2 this month' },
              { label: 'Cities Visited', value: '8', change: '5 states' },
              { label: 'Trips This Month', value: '2', change: '1 upcoming' },
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
              <h2 className="text-xl font-bold text-on-surface dark:text-white">Recent Trips</h2>
              <button className="text-sm text-primary-container hover:underline font-medium">View All</button>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-4 scroll-hidden">
              {recentTrips.map((trip) => (
                <Link
                  key={trip.id}
                  to={`/trip/${trip.id}`}
                  className="group flex-shrink-0 w-64 rounded-2xl border border-outline-variant/30 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] overflow-hidden hover:border-primary-container/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`h-24 bg-gradient-to-br ${trip.color} flex items-end p-3`}>
                    <span className="text-xs font-medium text-white/90 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      {trip.cost}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-on-surface dark:text-white">{trip.destination}</h3>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${statusColors[trip.status]}`}>
                        {trip.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-secondary dark:text-gray-500">{trip.dates}</p>
                    <p className="mt-0.5 text-xs text-secondary dark:text-gray-500">{trip.days} days</p>
                  </div>
                </Link>
              ))}
            </div>
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
