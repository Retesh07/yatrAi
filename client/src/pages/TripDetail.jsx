import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';
import { apiGetTrip } from '../api/client';
import { useAuth } from '../context/AuthContext';

const WEATHER_CODE_LABELS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with heavy hail',
};

const WEATHER_SHORT_LABELS = {
  0: 'Clear',
  1: 'Clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  45: 'Fog',
  48: 'Fog',
  51: 'Drizzle',
  53: 'Drizzle',
  55: 'Drizzle',
  56: 'Drizzle',
  57: 'Drizzle',
  61: 'Rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Rain',
  67: 'Heavy rain',
  71: 'Snow',
  73: 'Snow',
  75: 'Snow',
  77: 'Snow',
  80: 'Showers',
  81: 'Showers',
  82: 'Storm',
  85: 'Snow',
  86: 'Snow',
  95: 'Storm',
  96: 'Storm',
  99: 'Storm',
};

const WEATHER_CODE_ICONS = {
  0: '☀️',
  1: '🌤️',
  2: '⛅',
  3: '☁️',
  45: '🌫️',
  48: '🌫️',
  51: '🌦️',
  53: '🌦️',
  55: '🌧️',
  56: '🌧️',
  57: '🌧️',
  61: '🌧️',
  63: '🌧️',
  65: '🌧️',
  66: '🌧️',
  67: '🌧️',
  71: '🌨️',
  73: '🌨️',
  75: '❄️',
  77: '🌨️',
  80: '🌦️',
  81: '🌧️',
  82: '⛈️',
  85: '🌨️',
  86: '❄️',
  95: '⛈️',
  96: '⛈️',
  99: '⛈️',
};

function toTitleCase(value = '') {
  return String(value)
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatWeatherDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatCompactWeatherDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function addDaysIso(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getWeatherLabel(code) {
  return WEATHER_CODE_LABELS[code] || 'Weather update';
}

function getWeatherShortLabel(code) {
  return WEATHER_SHORT_LABELS[code] || 'Forecast';
}

function getWeatherIcon(code) {
  return WEATHER_CODE_ICONS[code] || '🌤️';
}

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('itinerary');
  const [checkedItems, setCheckedItems] = useState({});
  const [notes, setNotes] = useState({});
  const [toast, setToast] = useState(null);
  const [polling, setPolling] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [locationData, setLocationData] = useState(null);
  // 'live' | 'trip-forecast' | 'too-far' | 'past'
  const [weatherContext, setWeatherContext] = useState('live');
  const [daysUntilTrip, setDaysUntilTrip] = useState(null);

  useEffect(() => {
    let intervalId;

    async function fetchTripDetail() {
      if (!id || !token) return;
      try {
        setLoading(true);
        const data = await apiGetTrip(id, token);
        if (data.success && data.trip) {
          setTrip(data.trip);
          if (data.trip.status === 'generating' || data.trip.status === 'failed') {
            setPolling(true);
          } else {
            setPolling(false);
          }
        } else {
          setError('Trip not found');
        }
      } catch (err) {
        console.error('Error fetching trip:', err);
        setError(err.message || 'Could not load trip details');
      } finally {
        setLoading(false);
      }
    }

    fetchTripDetail();

    if (polling) {
      intervalId = setInterval(fetchTripDetail, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, token, polling]);


  useEffect(() => {
    if (!trip?.destination) return;

    const controller = new AbortController();

    async function fetchDestinationWeather() {
      try {
        setWeatherLoading(true);
        setWeatherError('');

        // ── Compute trip timing ──────────────────────────────────────────
        const todayStr = new Date().toISOString().split('T')[0];
        const startStr = trip.startDate || todayStr;
        const endStr = trip.endDate || startStr;

        const msPerDay = 86400000;
        const todayMs = new Date(todayStr).getTime();
        const startMs = new Date(startStr).getTime();
        const endMs = new Date(endStr).getTime();
        const daysToStart = Math.round((startMs - todayMs) / msPerDay);
        const daysToEnd = Math.round((endMs - todayMs) / msPerDay);

        setDaysUntilTrip(daysToStart);

        // Determine context
        let ctx = 'live';
        if (daysToStart > 16) ctx = 'too-far';
        else if (daysToEnd < 0) ctx = 'past';
        else if (daysToStart > 0) ctx = 'trip-forecast';
        else ctx = 'live'; // trip is today or ongoing
        setWeatherContext(ctx);

        // ── Geocode destination ──────────────────────────────────────────
        // Try full destination name first, then fall back to first word for compound names like "Leh-Ladakh"
        let location = null;
        const destVariants = [trip.destination];
        if (/[-,\/]/.test(trip.destination)) {
          destVariants.push(trip.destination.split(/[-,\/]/)[0].trim());
        }
        for (const destName of destVariants) {
          const geoResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destName)}&count=1&language=en&format=json`,
            { signal: controller.signal }
          );
          if (!geoResponse.ok) continue;
          const geoData = await geoResponse.json();
          location = geoData.results?.[0];
          if (location) break;
        }
        if (!location) throw new Error('No coordinates found for this trip destination');
        setLocationData(location);

        // ── If trip is too far in future, skip weather API ───────────────
        if (ctx === 'too-far') {
          setWeatherLoading(false);
          return;
        }

        // ── Build API URL based on context ───────────────────────────────
        const base = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&timezone=auto`;
        let url = '';

        if (ctx === 'live') {
          // Show current + today through end of trip (max 16 days)
          const tripDays = Math.min(Math.max(daysToEnd + 1, 1), 7);
          url = `${base}&current=temperature_2m,weather_code,wind_speed_10m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&start_date=${todayStr}&end_date=${endStr}`;
        } else if (ctx === 'trip-forecast') {
          // No current; fetch only trip date range
          url = `${base}&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&start_date=${startStr}&end_date=${endStr}`;
        } else {
          // past trip — show current + 5 days
          url = `${base}&current=temperature_2m,weather_code,wind_speed_10m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&forecast_days=5`;
        }

        const weatherResponse = await fetch(url, { signal: controller.signal });
        if (!weatherResponse.ok) throw new Error('Could not load weather forecast');

        const forecastData = await weatherResponse.json();
        setWeatherData(forecastData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Weather load failed:', err);
          setWeatherError(err.message || 'Unable to load weather right now');
        }
      } finally {
        if (!controller.signal.aborted) setWeatherLoading(false);
      }
    }

    fetchDestinationWeather();

    return () => controller.abort();
  }, [trip?.destination, trip?.startDate, trip?.endDate]);

  const toggleCheck = (itemId) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const buildFallbackItinerary = (trip) => {
    const baseIcon = trip.travelStyle?.[0] === 'Adventure' ? '🏔️'
      : trip.travelStyle?.[0] === 'Relaxation' ? '🏖️'
        : trip.travelStyle?.[0] === 'Cultural' ? '🏛️'
          : trip.travelStyle?.[0] === 'Spiritual' ? '🕉️'
            : '📍';
    const dayCount = Math.max(3, Math.min(7, trip.days?.length || 3));

    return Array.from({ length: dayCount }, (_, index) => {
      const day = index + 1;
      return {
        day,
        title: `${trip.destination?.split(' ')[0] || 'Trip'} Highlights`,
        events: [
          {
            time: '09:00',
            title: `Morning ${trip.travelStyle?.[0]?.toLowerCase() || 'exploration'} experience`,
            desc: `Start Day ${day} with a curated activity in ${trip.destination}.`,
            icon: baseIcon,
          },
          {
            time: '13:00',
            title: 'Local lunch',
            desc: 'Enjoy a popular local meal and recharge for the afternoon.',
            icon: '🍲',
          },
          {
            time: '16:00',
            title: 'Afternoon exploration',
            desc: 'Visit a must-see attraction and discover the local culture.',
            icon: '🧭',
          },
        ],
      };
    });
  };

  const tabs = [
    { key: 'itinerary', label: 'Day-by-Day Places', icon: '📍' },
    { key: 'transit', label: 'Transit & Boarding', icon: '✈️' },
    { key: 'hotels', label: 'Hotels', icon: '🏨' },
    { key: 'restaurants', label: 'Food & Dining', icon: '🍽️' },
    { key: 'budget', label: 'Budget Breakdown', icon: '💰' },
    { key: 'packing', label: 'Packing & Tips', icon: '🎒' },
  ];

  const statusColors = {
    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    generating: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    draft: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface dark:bg-[#0F0F0F]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-secondary dark:text-gray-400">
          <svg className="h-8 w-8 animate-spin text-primary-container mb-3" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
          </svg>
          Loading your trip details...
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-surface dark:bg-[#0F0F0F]">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-lg font-bold text-on-surface dark:text-white">{error || 'Trip not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-xl bg-primary-container px-5 py-2.5 text-xs font-semibold text-on-primary-container"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const fromCity = trip.fromLocation || 'Delhi';
  const toCity = trip.destination;
  const days = trip.days && trip.days.length > 0 ? trip.days : buildFallbackItinerary(trip);
  const hotels = trip.recommendedHotels && trip.recommendedHotels.length > 0 ? trip.recommendedHotels : [
    { name: `${trip.destination?.split(' ')[0] || 'Stay'} Comfort`, pricePerNight: '₹3,999', rating: '4.4', area: `${trip.destination?.split(' ')[0] || 'City'} Center` },
  ];

  const sanitizeFileName = (value = 'trip') =>
    String(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'trip';

  const mapEmbedUrl = locationData
    ? (() => {
      const lat = locationData.latitude;
      const lon = locationData.longitude;
      const delta = 0.08;
      const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join('%2C');
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
    })()
    : '';

  const mapOpenUrl = locationData
    ? `https://www.openstreetmap.org/?mlat=${locationData.latitude}&mlon=${locationData.longitude}#map=12/${locationData.latitude}/${locationData.longitude}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(toCity)}`;

  const downloadItinerary = () => {
    const itineraryText = [
      `${fromCity} → ${toCity}`,
      `Dates: ${trip.startDate} → ${trip.endDate}`,
      '',
      ...days.map((day) => {
        const eventLines = (day.events || []).map((event) => `- ${event.time} ${event.title}: ${event.desc}`);
        return [`Day ${day.day}: ${day.title}`, ...eventLines].join('\n');
      }),
    ].join('\n\n');

    const blob = new Blob([itineraryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizeFileName(fromCity)}-to-${sanitizeFileName(toCity)}-itinerary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast('Itinerary downloaded successfully!');
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
                🏰
              </div>
              <div>
                <h1 className="text-2xl font-bold text-on-surface dark:text-white">{fromCity} ➔ {toCity}</h1>
                <p className="text-sm text-secondary dark:text-gray-400">{trip.startDate} → {trip.endDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-medium px-3 py-1 rounded-lg capitalize ${statusColors[trip.status] || statusColors.completed}`}>
                {trip.status}
              </span>
              {trip.estimatedCost && (
                <span className="text-xs font-bold px-3 py-1 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                  Est: {trip.estimatedCost}
                </span>
              )}
              {trip.people && (
                <span className="text-xs px-3 py-1 rounded-lg bg-surface-container dark:bg-white/5 text-secondary dark:text-gray-400">
                  👥 {trip.people}
                </span>
              )}
              {trip.budget && (
                <span className="text-xs px-3 py-1 rounded-lg bg-surface-container dark:bg-white/5 text-secondary dark:text-gray-400">
                  💰 {trip.budget}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={downloadItinerary}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-4 py-2.5 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
              Download Itinerary
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
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
          <section className="rounded-3xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-5 shadow-sm">
            {/* ── Section header ── */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-secondary dark:text-gray-500">
                  {weatherContext === 'live' ? 'Live Weather'
                    : weatherContext === 'trip-forecast' ? 'Trip Forecast'
                      : weatherContext === 'too-far' ? 'Weather Outlook'
                        : 'Weather'}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-on-surface dark:text-white">{trip.destination}</h2>
                <p className="text-sm text-secondary dark:text-gray-400">
                  {weatherContext === 'too-far'
                    ? `${daysUntilTrip} days until your trip`
                    : weatherContext === 'trip-forecast'
                      ? `Forecast for your trip · ${trip.startDate} → ${trip.endDate}`
                      : weatherContext === 'past'
                        ? 'Current conditions at destination'
                        : `Forecast powered by Open-Meteo`}
                </p>
              </div>
              <div className="rounded-2xl bg-primary-container/10 px-3 py-2 text-right shrink-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary-container">Destination</p>
                <p className="text-sm font-semibold text-on-surface dark:text-white">{toTitleCase(trip.destination)}</p>
              </div>
            </div>

            {/* ── Loading ── */}
            {weatherLoading ? (
              <div className="py-10 text-center text-secondary dark:text-gray-400">
                <svg className="h-7 w-7 animate-spin mx-auto text-primary-container mb-2" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                </svg>
                Loading weather forecast...
              </div>

            ) : weatherError ? (
              <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">{weatherError}</div>

            ) : weatherContext === 'too-far' ? (
              /* ── TOO FAR IN FUTURE ── */
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-5 flex gap-4 items-start">
                  <span className="text-4xl mt-0.5">🔮</span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface dark:text-white">Forecast not yet available</p>
                    <p className="mt-1 text-sm text-secondary dark:text-gray-400">
                      Weather forecasts are only accurate up to <strong>16 days</strong> in advance.
                      Your trip starts in <strong className="text-amber-400">{daysUntilTrip} days</strong> — check back closer to your departure.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container dark:bg-white/[0.03] p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-gray-500">Trip Start</p>
                    <p className="mt-2 text-lg font-bold text-on-surface dark:text-white">{trip.startDate}</p>
                    <p className="mt-1 text-xs text-secondary dark:text-gray-400">Departure date</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container dark:bg-white/[0.03] p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-gray-500">Forecast In</p>
                    <p className="mt-2 text-lg font-bold text-amber-400">{daysUntilTrip - 16} days</p>
                    <p className="mt-1 text-xs text-secondary dark:text-gray-400">Until forecast ready</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container dark:bg-white/[0.03] p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-gray-500">Location</p>
                    <p className="mt-2 text-sm font-semibold text-on-surface dark:text-white">{locationData?.name || trip.destination}</p>
                    <p className="mt-1 text-xs text-secondary dark:text-gray-400">{locationData?.admin1 ? `${locationData.admin1}, ` : ''}{locationData?.country || 'India'}</p>
                  </div>
                </div>
                <p className="text-xs text-secondary dark:text-gray-500 text-center pt-1">
                  💡 Tip: Add this trip to your calendar and revisit 2 weeks before departure for an accurate forecast.
                </p>
              </div>

            ) : weatherContext === 'trip-forecast' && weatherData?.daily ? (
              /* ── FUTURE TRIP WITHIN 16 DAYS — show trip-date forecast only ── */
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 px-4 py-3 flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <p className="text-sm text-secondary dark:text-gray-400">
                    Showing forecast for your <strong className="text-on-surface dark:text-white">actual trip dates</strong> ({trip.startDate} → {trip.endDate})
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface dark:text-white">Your Trip Weather</p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {(weatherData.daily?.time || []).map((date, index) => (
                      <div
                        key={date}
                        className="min-h-[180px] rounded-2xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/[0.07] p-4 flex flex-col items-center text-center justify-between"
                      >
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-blue-400 font-semibold">{formatWeatherDate(date)}</p>
                          <div className="mt-3 text-3xl leading-none">{getWeatherIcon(weatherData.daily.weather_code?.[index])}</div>
                          <p className="mt-2 text-sm font-semibold text-on-surface dark:text-white">
                            {Math.round(weatherData.daily.temperature_2m_max?.[index])}° / {Math.round(weatherData.daily.temperature_2m_min?.[index])}°
                          </p>
                          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-secondary dark:text-gray-400">
                            {getWeatherShortLabel(weatherData.daily.weather_code?.[index])}
                          </p>
                        </div>
                        <p className="mt-3 text-xs text-secondary dark:text-gray-500">
                          Precip {Math.round(weatherData.daily.precipitation_probability_max?.[index] || 0)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            ) : weatherData?.current ? (
              /* ── LIVE / ONGOING TRIP ── */
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container dark:bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-gray-500">Now</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-3xl">{getWeatherIcon(weatherData.current.weather_code)}</span>
                      <div>
                        <p className="text-2xl font-bold text-on-surface dark:text-white">{Math.round(weatherData.current.temperature_2m)}°C</p>
                        <p className="text-xs text-secondary dark:text-gray-400">Feels like {Math.round(weatherData.current.apparent_temperature)}°C</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container dark:bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-gray-500">Conditions</p>
                    <p className="mt-2 text-sm font-semibold text-on-surface dark:text-white">{getWeatherLabel(weatherData.current.weather_code)}</p>
                    <p className="mt-1 text-xs text-secondary dark:text-gray-400">Wind {Math.round(weatherData.current.wind_speed_10m)} km/h</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container dark:bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-gray-500">Location</p>
                    <p className="mt-2 text-sm font-semibold text-on-surface dark:text-white">{locationData?.name || trip.destination}</p>
                    <p className="mt-1 text-xs text-secondary dark:text-gray-400">{locationData?.admin1 ? `${locationData.admin1}, ` : ''}{locationData?.country || 'Destination'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface dark:text-white">
                    {weatherContext === 'past' ? '5-Day Forecast' : 'Trip Day Forecast'}
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {(weatherData.daily?.time || []).map((date, index) => (
                      <div
                        key={date}
                        className="min-h-[180px] rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.02] p-4 flex flex-col items-center text-center justify-between"
                      >
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-secondary dark:text-gray-500">{formatWeatherDate(date)}</p>
                          <div className="mt-3 text-3xl leading-none">{getWeatherIcon(weatherData.daily.weather_code?.[index])}</div>
                          <p className="mt-2 text-sm font-semibold text-on-surface dark:text-white">
                            {Math.round(weatherData.daily.temperature_2m_max?.[index])}° / {Math.round(weatherData.daily.temperature_2m_min?.[index])}°
                          </p>
                          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-secondary dark:text-gray-400">
                            {getWeatherShortLabel(weatherData.daily.weather_code?.[index])}
                          </p>
                        </div>
                        <p className="mt-3 text-xs text-secondary dark:text-gray-500">
                          Precip {Math.round(weatherData.daily.precipitation_probability_max?.[index] || 0)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container dark:bg-white/[0.03] px-4 py-3 text-sm text-secondary dark:text-gray-400">
                Weather data will appear here once the destination is resolved.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-secondary dark:text-gray-500">Map</p>
                <h2 className="mt-1 text-lg font-semibold text-on-surface dark:text-white">
                  {trip.destination}
                </h2>
                <p className="text-sm text-secondary dark:text-gray-400">
                  OpenStreetMap preview for the destination
                </p>
              </div>
              <a
                href={mapOpenUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-3 py-2 text-xs font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-colors"
              >
                Open map
              </a>
            </div>

            {locationData ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container-lowest dark:bg-[#0F0F0F]">
                <iframe
                  title={`${trip.destination} map`}
                  src={mapEmbedUrl}
                  className="h-[420px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-outline-variant/20 dark:border-white/5 bg-surface-container dark:bg-white/[0.03] px-4 py-3 text-sm text-secondary dark:text-gray-400">
                Map preview will load when the destination is found.
              </div>
            )}
          </section>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 border-b border-outline-variant/30 dark:border-white/10 overflow-x-auto scroll-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.key
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
              {days.length === 0 ? (
                <div className="py-8 text-center text-secondary dark:text-gray-400">
                  No itinerary details found for this trip.
                </div>
              ) : (
                days.map((day) => (
                  <div key={day.day}>
                    <h3 className="text-lg font-bold text-on-surface dark:text-white mb-4">
                      Day {day.day}: {day.title}
                    </h3>

                    <div className="relative pl-8 space-y-0">
                      {/* Timeline line */}
                      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-outline-variant/30 dark:bg-white/10" />

                      {(day.events || []).map((event, i) => (
                        <div key={i} className="relative pb-6 last:pb-0">
                          {/* Timeline dot */}
                          <div className="absolute -left-5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface-container-lowest dark:bg-[#0F0F0F] border-2 border-primary-container text-xs">
                            {event.icon || '📍'}
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
                ))
              )}
            </div>
          )}

          {/* ── Transit & Boarding Tab ─────────────────── */}
          {activeTab === 'transit' && (
            <div className="space-y-4">
              {!(trip.transport?.options?.length || trip.transitOptions?.options?.length) ? (
                <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-6 text-center text-secondary dark:text-gray-400">
                  <p className="text-2xl mb-2">✈️ 🚆 🚌</p>
                  <p className="text-sm font-semibold">Recommended route: {fromCity} ➔ {toCity}</p>
                  <p className="text-xs text-secondary dark:text-gray-500 mt-1">
                    Book your flight or express train from major hubs in {fromCity} to reach {toCity}.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(trip.transport?.recommendedRoute || trip.transitOptions?.summary) && (
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs text-blue-600 dark:text-blue-300">
                      💡 <strong>Route Summary:</strong> {trip.transport?.recommendedRoute || trip.transitOptions?.summary}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(trip.transport?.options || trip.transitOptions?.options || []).map((opt, i) => (
                      <div key={i} className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm font-bold text-on-surface dark:text-white">
                            <span className="text-xl">{opt.mode === 'Flight' ? '✈️' : opt.mode === 'Train' ? '🚆' : opt.mode === 'Bus' ? '🚌' : '🚗'}</span>
                            {opt.mode}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                            {typeof opt.approxCost === 'number' ? `₹${opt.approxCost.toLocaleString('en-IN')}` : (opt.approxCostPerPerson || opt.approxCost || 'Standard Fare')}
                          </span>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-primary-container">{opt.provider || opt.details || opt.mode}</p>
                          <p className="text-xs text-secondary dark:text-gray-400 mt-0.5">⏱️ Duration: {opt.duration}</p>
                        </div>

                        {(opt.boardingPoint || opt.boardingInfo) && (
                          <div className="rounded-lg bg-surface-container dark:bg-white/5 p-3 text-xs text-secondary dark:text-gray-300">
                            <strong>📍 Boarding Point:</strong> {opt.boardingPoint || opt.boardingInfo}
                          </div>
                        )}

                        {opt.arrivalPoint && (
                          <div className="rounded-lg bg-surface-container dark:bg-white/5 p-3 text-xs text-secondary dark:text-gray-300">
                            <strong>🛬 Arrival Point:</strong> {opt.arrivalPoint}
                          </div>
                        )}

                        {opt.tips && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                            📌 Tip: {opt.tips}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Best Hotels Tab ────────────────── */}
          {activeTab === 'hotels' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(trip.hotels || hotels || []).length === 0 ? (
                <div className="py-8 text-center text-secondary dark:text-gray-400 col-span-2">
                  No hotel suggestions generated for this trip.
                </div>
              ) : (
                (trip.hotels || hotels || []).map((hotel, idx) => (
                  <div key={idx} className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-5 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        {hotel.category && (
                          <span className="text-xs text-primary-container font-semibold uppercase tracking-wider">{hotel.category} Hotel</span>
                        )}
                        <h4 className="text-base font-bold text-on-surface dark:text-white mt-0.5">{hotel.name}</h4>
                        <p className="text-xs text-secondary dark:text-gray-400 mt-0.5">📍 {hotel.area || toCity}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg shrink-0">
                        {typeof hotel.rating === 'number' ? `${hotel.rating}★` : (hotel.rating || '4.5★')}
                      </span>
                    </div>

                    {hotel.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {hotel.amenities.map((am, ai) => (
                          <span key={ai} className="text-[11px] px-2 py-0.5 rounded-md bg-surface-container dark:bg-white/5 text-secondary dark:text-gray-300">
                            ✓ {am}
                          </span>
                        ))}
                      </div>
                    )}

                    {hotel.whyRecommended && (
                      <p className="text-xs text-secondary dark:text-gray-400 italic">
                        "{hotel.whyRecommended}"
                      </p>
                    )}

                    <div className="pt-3 border-t border-outline-variant/20 dark:border-white/5 flex items-center justify-between">
                      <span className="text-xs text-secondary dark:text-gray-400">Est. Rate:</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {typeof hotel.pricePerNight === 'number' ? `₹${hotel.pricePerNight.toLocaleString('en-IN')} / night` : hotel.pricePerNight}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Food & Dining Tab ──────────────── */}
          {activeTab === 'restaurants' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!(trip.restaurants?.length) ? (
                <div className="py-8 text-center text-secondary dark:text-gray-400 col-span-2">
                  No restaurant recommendations available for this destination.
                </div>
              ) : (
                trip.restaurants.map((rest, idx) => (
                  <div key={idx} className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-5 shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs text-pink-500 font-semibold">{rest.cuisine || 'Local Cuisine'}</span>
                        <h4 className="text-base font-bold text-on-surface dark:text-white mt-0.5">{rest.name}</h4>
                        {rest.foodType && <p className="text-xs text-secondary dark:text-gray-400 mt-0.5">🥗 {rest.foodType}</p>}
                      </div>
                      {rest.rating && (
                        <span className="text-sm font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg shrink-0">
                          {typeof rest.rating === 'number' ? `${rest.rating}★` : rest.rating}
                        </span>
                      )}
                    </div>

                    {rest.mustTryDish && (
                      <div className="rounded-lg bg-orange-500/10 p-2.5 text-xs text-orange-600 dark:text-orange-300">
                        🍲 <strong>Must Try:</strong> {rest.mustTryDish}
                      </div>
                    )}

                    <div className="pt-2 border-t border-outline-variant/20 dark:border-white/5 flex items-center justify-between">
                      <span className="text-xs text-secondary dark:text-gray-400">Avg for Two:</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {typeof rest.averageCostForTwo === 'number' ? `₹${rest.averageCostForTwo.toLocaleString('en-IN')}` : rest.averageCostForTwo}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Budget Breakdown Tab ────────────────────── */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              {trip.budget || trip.budgetBreakdown ? (
                <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-on-surface dark:text-white flex items-center justify-between">
                    <span>Complete Expense Breakdown</span>
                    <span className="text-xl text-green-600 dark:text-green-400 font-extrabold">
                      {typeof trip.budget?.estimatedTotal === 'number'
                        ? `₹${trip.budget.estimatedTotal.toLocaleString('en-IN')}`
                        : (trip.budgetBreakdown?.estimatedTotalCost || trip.estimatedCost)}
                    </span>
                  </h3>

                  {trip.budget?.budgetSavingTip && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-700 dark:text-amber-300">
                      💡 <strong>Budget Saving Tip:</strong> {trip.budget.budgetSavingTip}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(trip.budget?.transport || trip.budgetBreakdown?.transitCost) && (
                      <div className="rounded-xl bg-surface-container dark:bg-white/5 p-4">
                        <p className="text-xs text-secondary dark:text-gray-400">✈️ Transport / Flights</p>
                        <p className="text-lg font-bold text-on-surface dark:text-white mt-1">
                          {typeof trip.budget?.transport === 'number' ? `₹${trip.budget.transport.toLocaleString('en-IN')}` : trip.budgetBreakdown?.transitCost}
                        </p>
                      </div>
                    )}
                    {(trip.budget?.hotel || trip.budgetBreakdown?.accommodationCost) && (
                      <div className="rounded-xl bg-surface-container dark:bg-white/5 p-4">
                        <p className="text-xs text-secondary dark:text-gray-400">🏨 Stay / Hotels</p>
                        <p className="text-lg font-bold text-on-surface dark:text-white mt-1">
                          {typeof trip.budget?.hotel === 'number' ? `₹${trip.budget.hotel.toLocaleString('en-IN')}` : trip.budgetBreakdown?.accommodationCost}
                        </p>
                      </div>
                    )}
                    {(trip.budget?.food || trip.budgetBreakdown?.foodAndDiningCost) && (
                      <div className="rounded-xl bg-surface-container dark:bg-white/5 p-4">
                        <p className="text-xs text-secondary dark:text-gray-400">🍽️ Food & Dining</p>
                        <p className="text-lg font-bold text-on-surface dark:text-white mt-1">
                          {typeof trip.budget?.food === 'number' ? `₹${trip.budget.food.toLocaleString('en-IN')}` : trip.budgetBreakdown?.foodAndDiningCost}
                        </p>
                      </div>
                    )}
                    {(trip.budget?.localTransport || trip.budgetBreakdown?.localCommuteCost) && (
                      <div className="rounded-xl bg-surface-container dark:bg-white/5 p-4">
                        <p className="text-xs text-secondary dark:text-gray-400">🚕 Local Commute & Cabs</p>
                        <p className="text-lg font-bold text-on-surface dark:text-white mt-1">
                          {typeof trip.budget?.localTransport === 'number' ? `₹${trip.budget.localTransport.toLocaleString('en-IN')}` : trip.budgetBreakdown?.localCommuteCost}
                        </p>
                      </div>
                    )}
                    {(trip.budget?.attractions || trip.budgetBreakdown?.activitiesCost) && (
                      <div className="rounded-xl bg-surface-container dark:bg-white/5 p-4">
                        <p className="text-xs text-secondary dark:text-gray-400">🎟️ Entry Fees & Sightseeing</p>
                        <p className="text-lg font-bold text-on-surface dark:text-white mt-1">
                          {typeof trip.budget?.attractions === 'number' ? `₹${trip.budget.attractions.toLocaleString('en-IN')}` : trip.budgetBreakdown?.activitiesCost}
                        </p>
                      </div>
                    )}
                    {trip.budget?.shopping && (
                      <div className="rounded-xl bg-surface-container dark:bg-white/5 p-4">
                        <p className="text-xs text-secondary dark:text-gray-400">🛍️ Shopping & Souvenirs</p>
                        <p className="text-lg font-bold text-on-surface dark:text-white mt-1">
                          ₹{trip.budget.shopping.toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-6 text-center text-secondary dark:text-gray-400">
                  <p className="text-2xl mb-2">💰</p>
                  <p className="text-sm font-semibold">Estimated Total Cost: {trip.estimatedCost || '₹25,000'}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Packing & Essential Tips Tab ─────────────── */}
          {activeTab === 'packing' && (
            <div className="space-y-6">
              {/* Emergency Information */}
              {trip.emergencyInformation && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                    🚨 Emergency Contacts & Information
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-secondary">Police:</span> <strong className="text-on-surface dark:text-white">{trip.emergencyInformation.police || '112'}</strong></div>
                    <div><span className="text-secondary">Ambulance:</span> <strong className="text-on-surface dark:text-white">{trip.emergencyInformation.ambulance || '108'}</strong></div>
                    <div><span className="text-secondary">Tourist Helpline:</span> <strong className="text-on-surface dark:text-white">{trip.emergencyInformation.touristHelpline || '1363'}</strong></div>
                    <div><span className="text-secondary">Nearest Hospital:</span> <strong className="text-on-surface dark:text-white">{trip.emergencyInformation.nearestHospital || 'City Hospital'}</strong></div>
                  </div>
                </div>
              )}

              {/* Essential Travel Tips */}
              {trip.essentialTips?.length > 0 && (
                <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#141414] p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-on-surface dark:text-white mb-3 flex items-center gap-2">
                    📌 Essential Destination Tips
                  </h4>
                  <ul className="space-y-2 text-xs text-secondary dark:text-gray-300">
                    {trip.essentialTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary-container font-bold">•</span>
                        <span>{typeof tip === 'string' ? tip : JSON.stringify(tip)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Packing Checklist */}
              <div>
                <h4 className="text-sm font-bold text-on-surface dark:text-white mb-3">🎒 Packing Checklist</h4>
                <div className="space-y-2">
                  {(trip.packingChecklist?.length > 0
                    ? trip.packingChecklist.map((item, idx) => ({ id: idx + 1, item: typeof item === 'string' ? item : item.item || item.name, category: 'Recommended' }))
                    : [
                        { id: 1, item: 'Comfortable walking shoes', category: 'Clothing' },
                        { id: 2, item: 'Light cotton clothes', category: 'Clothing' },
                        { id: 3, item: 'Sun hat & sunglasses', category: 'Accessories' },
                        { id: 4, item: 'Sunscreen SPF 50+', category: 'Toiletries' },
                        { id: 5, item: 'Power bank & chargers', category: 'Electronics' },
                      ]
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleCheck(item.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${checkedItems[item.id]
                          ? 'border-primary-container/30 bg-primary-container/5'
                          : 'border-outline-variant/30 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.02] hover:border-primary-container/20'
                        }`}
                    >
                      <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${checkedItems[item.id]
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
              </div>
            </div>
          )}
        </div>

      </div>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}

