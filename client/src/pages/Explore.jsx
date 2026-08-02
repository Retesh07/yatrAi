import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';
import { apiCreateTrip, apiGetPublicTrips } from '../api/client';

const getFutureDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

/* ── Mock community trips ─────────────────────────────────── */
const allTrips = [
  { id: 1, destination: 'Jaipur Heritage Tour', user: 'Ananya S.', avatar: 'A', days: 5, budget: '₹18K', style: 'Cultural', emoji: '🏰', color: 'from-pink-500 to-rose-600', likes: 234 },
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

const buildSampleItinerary = (trip) => {
  const baseIcon = trip.style === 'Adventure' ? '🏔️' : trip.style === 'Relaxation' ? '🏖️' : trip.style === 'Cultural' ? '🏛️' : trip.style === 'Spiritual' ? '🕉️' : '📍';
  const dayCount = Math.min(Math.max(trip.days, 3), 7);
  return Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    return {
      day,
      title: `${trip.destination.split(' ')[0]} Highlights`,
      events: [
        { time: '09:00', title: `Morning ${trip.style.toLowerCase()} experience`, desc: `Start Day ${day} with a curated ${trip.style.toLowerCase()} activity in ${trip.destination}.`, icon: baseIcon },
        { time: '13:00', title: 'Local lunch', desc: 'Enjoy a popular local meal and recharge for the afternoon.', icon: '🍲' },
        { time: '16:00', title: 'Afternoon exploration', desc: 'Visit a must-see attraction and discover the local culture.', icon: '🧭' },
      ],
    };
  });
};

const buildSampleHotels = (trip) => [
  { name: `${trip.destination.split(' ')[0]} Grand Hotel`, pricePerNight: '₹4,500', rating: '4.6', area: `${trip.destination.split(' ')[0]} City Center` },
  { name: `${trip.destination.split(' ')[0]} Comfort Stay`, pricePerNight: '₹3,200', rating: '4.3', area: `${trip.destination.split(' ')[0]} Riverside` },
];

const getTripDaysCount = (trip) => {
  if (Array.isArray(trip.days)) return trip.days.length;
  if (typeof trip.days === 'number') return trip.days;
  return Number(trip.days) || 0;
};

const getTripStyle = (trip) => {
  if (trip.style) return trip.style;
  if (Array.isArray(trip.travelStyle) && trip.travelStyle.length > 0) return trip.travelStyle[0];
  return 'Cultural';
};

const getTripOwnerName = (trip) => {
  if (!trip) return 'Traveler';
  const ownerName = String(trip.ownerName || '').trim();
  const isPlaceholderOwner = !ownerName || /^(traveler|a traveler)$/i.test(ownerName);
  if (!isPlaceholderOwner) return ownerName;
  if (trip.user && typeof trip.user === 'object' && trip.user.name) return trip.user.name;
  if (trip.sharedBy) return trip.sharedBy;
  if (trip.creatorName) return trip.creatorName;
  return 'Traveler';
};

const getItineraryPreview = (trip) => {
  const daysCount = getTripDaysCount(trip) || 3;
  const itinerary = buildSampleItinerary({
    destination: trip.destination,
    style: getTripStyle(trip),
    days: daysCount,
  });
  return itinerary.slice(0, 2).map((day) => ({
    label: `Day ${day.day}`,
    text: day.events?.[0]?.title || day.title,
  }));
};

export default function Explore() {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  const [filters, setFilters] = useState({
    destination: 'All',
    duration: 'All',
    budget: 'All',
    style: 'All',
  });
  const [visibleCount, setVisibleCount] = useState(6);
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copyError, setCopyError] = useState('');
  const [publicTrips, setPublicTrips] = useState([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState('');

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const parseBudgetValue = (budgetText) => {
    const digits = budgetText.replace(/[^0-9]/g, '');
    return Number(digits || 0);
  };

  useEffect(() => {
    async function fetchPublicTrips() {
      setPublicLoading(true);
      setPublicError('');

      try {
        const data = await apiGetPublicTrips(isAuthenticated ? token : undefined);
        setPublicTrips(data.trips || []);
      } catch (err) {
        console.error('Error loading public trips:', err);
        setPublicError('Could not load public trips right now.');
      } finally {
        setPublicLoading(false);
      }
    }

    fetchPublicTrips();
  }, [token, isAuthenticated]);

  const matchesBudget = (tripBudget, filterBudget) => {
    if (filterBudget === 'All') return true;
    const amount = parseBudgetValue(tripBudget);
    switch (filterBudget) {
      case 'Under ₹10K':
        return amount < 10000;
      case '₹10K-₹20K':
        return amount >= 10000 && amount <= 20000;
      case '₹20K-₹40K':
        return amount > 20000 && amount <= 40000;
      case '₹40K+':
        return amount > 40000;
      default:
        return true;
    }
  };

  const matchesDuration = (tripDays, filterDuration) => {
    if (filterDuration === 'All') return true;
    if (filterDuration === '1-3 days') return tripDays <= 3;
    if (filterDuration === '4-6 days') return tripDays >= 4 && tripDays <= 6;
    if (filterDuration === '7+ days') return tripDays >= 7;
    return true;
  };

  const filteredTrips = allTrips.filter((trip) => {
    if (filters.destination !== 'All' && !trip.destination.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (!matchesDuration(trip.days, filters.duration)) return false;
    if (!matchesBudget(trip.budget, filters.budget)) return false;
    if (filters.style !== 'All' && trip.style !== filters.style) return false;
    return true;
  });

  const publicFilteredTrips = publicTrips.filter((trip) => {
    if (filters.destination !== 'All' && !trip.destination.toLowerCase().includes(filters.destination.toLowerCase())) return false;
    if (!matchesDuration(trip.days?.length || 0, filters.duration)) return false;
    if (!matchesBudget(trip.budget || '', filters.budget)) return false;
    if (filters.style !== 'All' && trip.travelStyle?.[0] !== filters.style) return false;
    return true;
  });

  const tripsToDisplay = publicFilteredTrips.slice(0, visibleCount);

  const handleCopy = async (trip) => {
    setCopyError('');

    if (!isAuthenticated) {
      setCopyError('Log in to copy trips to your dashboard.');
      return;
    }

    const daysCount = getTripDaysCount(trip) || 3;
    const travelStyle = Array.isArray(trip.travelStyle) && trip.travelStyle.length > 0
      ? trip.travelStyle
      : trip.style
      ? [trip.style]
      : ['Adventure'];

    try {
      const completeTrip = {
        fromLocation: trip.fromLocation || 'Mumbai',
        destination: trip.destination,
        startDate: trip.startDate || getFutureDate(7),
        endDate: trip.endDate || getFutureDate(7 + daysCount - 1),
        people: trip.people || 'Couple',
        budget: trip.budget || '₹10K',
        travelStyle,
        food: trip.food || 'No Preference',
        transport: Array.isArray(trip.transport) && trip.transport.length > 0 ? trip.transport : ['Cab'],
        days: Array.isArray(trip.days) && trip.days.length > 0
          ? trip.days
          : buildSampleItinerary({ destination: trip.destination, style: travelStyle[0], days: daysCount }),
        recommendedHotels: Array.isArray(trip.recommendedHotels) && trip.recommendedHotels.length > 0
          ? trip.recommendedHotels
          : buildSampleHotels({ destination: trip.destination }),
        estimatedCost: trip.estimatedCost || trip.budget || '₹10K',
        status: 'completed',
        isPublic: false,
      };

      const createRes = await apiCreateTrip(completeTrip, token);
      if (!createRes.success || !createRes.trip?._id) {
        throw new Error('Could not save copied trip');
      }

      setCopiedId(trip._id || trip.id);
      setToast('Trip copied with itinerary to your dashboard!');
      navigate(`/trip/${createRes.trip._id}`);
    } catch (err) {
      console.error('Failed to copy trip:', err);
      setCopyError('Could not copy trip right now. Try again later.');
    } finally {
      setTimeout(() => setCopiedId(null), 2000);
    }
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
              className="rounded-xl border border-yellow-400/40 bg-[#0b0b0b] text-sm text-yellow-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
            >
              {destinations.map((d) => <option key={d} value={d}>{d === 'All' ? '📍 All Destinations' : d}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filters.duration}
              onChange={(e) => updateFilter('duration', e.target.value)}
              className="rounded-xl border border-yellow-400/40 bg-[#0b0b0b] text-sm text-yellow-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
            >
              {durations.map((d) => <option key={d} value={d}>{d === 'All' ? '📅 All Durations' : d}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filters.budget}
              onChange={(e) => updateFilter('budget', e.target.value)}
              className="rounded-xl border border-yellow-400/40 bg-[#0b0b0b] text-sm text-yellow-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
            >
              {budgets.map((b) => <option key={b} value={b}>{b === 'All' ? '💰 All Budgets' : b}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filters.style}
              onChange={(e) => updateFilter('style', e.target.value)}
              className="rounded-xl border border-yellow-400/40 bg-[#0b0b0b] text-sm text-yellow-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all"
            >
              {styles.map((s) => <option key={s} value={s}>{s === 'All' ? '🎨 All Styles' : s}</option>)}
            </select>
          </div>
        </div>

        {copyError && (
          <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 animate-fade-in">
            {copyError}
          </div>
        )}

        {/* Trip Cards Grid */}
        {publicError && (
        <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500 animate-fade-in">
          {publicError}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in animation-delay-300">
          {tripsToDisplay.map((trip) => (
            <div
              key={trip.id || trip._id}
              className="group rounded-2xl border border-outline-variant/30 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.03] overflow-hidden hover:border-primary-container/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`h-36 bg-gradient-to-br ${trip.color} flex items-center justify-center text-5xl`}>
                {trip.emoji}
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-on-surface dark:text-white">{trip.destination}</h3>

                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-container/20 text-xs font-bold text-primary dark:text-primary-container">
                    {getTripOwnerName(trip).charAt(0).toUpperCase() || 'T'}
                  </div>
                  <p className="text-xs text-secondary dark:text-gray-400">
                    Shared by {getTripOwnerName(trip)}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs bg-surface-container dark:bg-white/5 px-2 py-0.5 rounded-lg text-secondary dark:text-gray-400">
                    📅 {getTripDaysCount(trip)} days
                  </span>
                  <span className="text-xs bg-surface-container dark:bg-white/5 px-2 py-0.5 rounded-lg text-secondary dark:text-gray-400">
                    💰 {trip.budget || '₹0'}
                  </span>
                  <span className="text-xs bg-primary-container/10 px-2 py-0.5 rounded-lg text-primary dark:text-primary-container font-medium">
                    {getTripStyle(trip)}
                  </span>
                </div>

                <div className="mt-4 rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container dark:bg-white/[0.04] p-4 text-sm text-secondary dark:text-gray-300">
                  <p className="text-xs uppercase tracking-wider text-secondary dark:text-gray-400 mb-2">Sample itinerary</p>
                  {getItineraryPreview(trip).map((item) => (
                    <div key={item.label} className="flex items-start gap-2 mb-2 last:mb-0">
                      <span className="mt-0.5 inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-full bg-primary-container/10 text-[11px] font-semibold text-primary dark:text-primary-container">
                        {item.label}
                      </span>
                      <p className="text-xs text-secondary dark:text-gray-400">{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-secondary dark:text-gray-500 flex items-center gap-1">
                    ❤️ {trip.likes}
                  </span>

                  <button
                    onClick={() => handleCopy(trip)}
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
        {visibleCount < publicFilteredTrips.length && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setVisibleCount((c) => c + 3)}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-8 py-3 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all duration-200"
            >
              Load More Trips
            </button>
          </div>
        )}

        {!publicLoading && publicFilteredTrips.length === 0 && (
          <div className="mt-20 text-center">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg text-secondary dark:text-gray-400">No public trips available yet</p>
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
