import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Toast from '../components/Toast';

/* ── Indian date formatter ────────────────────────────────── */
const formatDate = (date) =>
  date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/* ── Trending destinations data ───────────────────────────── */
const trendingDestinations = [
  { name: 'Jaipur', tag: 'Heritage', color: 'from-pink-500 to-rose-600', days: '3–5 days', avgCost: '₹12K' },
  { name: 'Goa', tag: 'Beach', color: 'from-cyan-500 to-blue-600', days: '4–6 days', avgCost: '₹15K' },
  { name: 'Manali', tag: 'Mountains', color: 'from-emerald-500 to-teal-600', days: '5–7 days', avgCost: '₹18K' },
  { name: 'Kerala', tag: 'Nature', color: 'from-green-500 to-emerald-600', days: '6–8 days', avgCost: '₹20K' },
  { name: 'Varanasi', tag: 'Spiritual', color: 'from-orange-500 to-amber-600', days: '2–4 days', avgCost: '₹8K' },
  { name: 'Udaipur', tag: 'Romance', color: 'from-purple-500 to-violet-600', days: '3–5 days', avgCost: '₹16K' },
  { name: 'Rishikesh', tag: 'Adventure', color: 'from-teal-500 to-cyan-600', days: '3–4 days', avgCost: '₹10K' },
  { name: 'Darjeeling', tag: 'Hill Station', color: 'from-yellow-600 to-orange-600', days: '4–5 days', avgCost: '₹14K' },
];

/* ── Live notification messages ───────────────────────────── */
const liveMessages = [
  'Priya just planned a trip to Goa',
  'Arjun generated an itinerary for Manali',
  'New trending destination: Hampi',
  '12 trips planned to Kerala today',
  'Rahul shared his Jaipur itinerary',
  'AI generated 500+ itineraries this week',
];

/* ── Feature cards ────────────────────────────────────────── */
const features = [
  {
    title: 'AI-Powered Plans',
    desc: 'Get personalized itineraries crafted by advanced AI that understands your travel style.',
  },
  {
    title: 'Instant Generation',
    desc: 'Watch your perfect trip come to life in seconds with real-time streaming.',
  },
  {
    title: 'Explore & Discover',
    desc: 'Browse community trips and get inspired by fellow Indian travelers.',
  },
  {
    title: 'Smart Packing',
    desc: 'AI-generated packing lists customized to your destination and weather.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  /* Live toast notification simulation - removed */

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0a0a0a] transition-colors duration-300">
      <Navbar />

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-28 text-center">
          {/* Badge */}
          <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-primary-container/30 bg-primary-container/10 px-4 py-1.5 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary-container animate-pulse" />
            <span className="text-xs font-medium text-primary dark:text-primary-container">
              AI-Powered Trip Planning
            </span>
          </div>

          <h1 className="animate-fade-in text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight text-on-surface dark:text-white tracking-tight">
            Plan Your Perfect
            <br />
            <span className="bg-gradient-to-r from-primary-container to-primary bg-clip-text text-transparent">
              Journey with AI
            </span>
          </h1>

          <p className="animate-fade-in animation-delay-200 mx-auto mt-6 max-w-2xl text-lg text-secondary dark:text-gray-400 leading-relaxed">
            Tell us your dream destination, travel style, and budget — our AI crafts a personalized
            day-by-day itinerary in seconds. No more hours of research.
          </p>

          <div className="animate-fade-in animation-delay-300 mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-plan-btn"
              onClick={() => navigate('/plan')}
              className="group relative rounded-2xl bg-primary-container px-8 py-4 text-base font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 transition-all duration-300"
            >
              <span className="relative z-10 flex items-center gap-2">
                Plan a Trip
                <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </button>

            <button
              onClick={() => navigate('/explore')}
              className="rounded-2xl border border-outline-variant/50 dark:border-white/8 px-8 py-4 text-base font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all duration-200"
            >
              Explore Trips
            </button>
          </div>

          {/* Stats */}
          <div className="animate-fade-in animation-delay-500 mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            {[
              { num: '10K+', label: 'Trips Planned' },
              { num: '200+', label: 'Indian Cities' },
              { num: '4.9', label: 'User Rating' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold text-on-surface dark:text-white">{s.num}</p>
                <p className="text-sm text-secondary dark:text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ──────────────────────────────────── */}
      <section className="py-20 bg-surface-container-low dark:bg-[#0e0e0e]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-on-surface dark:text-white">
              Why <span className="text-primary-container">YatrAI</span>?
            </h2>
            <p className="mt-4 text-secondary dark:text-gray-400 max-w-lg mx-auto">
              Everything you need for a stress-free travel planning experience, powered by AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-outline-variant/30 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] p-6 hover:border-primary-container/40 hover:shadow-lg hover:shadow-primary-container/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container/10 dark:bg-primary-container/15 mb-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary-container" />
                </div>
                <h3 className="font-semibold text-on-surface dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-secondary dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending Destinations ─────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-on-surface dark:text-white">
                Trending Destinations
              </h2>
              <p className="mt-2 text-secondary dark:text-gray-400">
                Popular picks across India this season
              </p>
            </div>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 scroll-hidden">
            {trendingDestinations.map((d, i) => (
              <div
                key={i}
                onClick={() => navigate('/plan')}
                className="group flex-shrink-0 w-56 cursor-pointer rounded-2xl border border-outline-variant/30 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] overflow-hidden hover:border-primary-container/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`h-28 bg-gradient-to-br ${d.color} flex items-end p-3`}>
                  <span className="text-xs font-medium text-white/90 bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
                    avg. {d.avgCost}/person
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-on-surface dark:text-white">{d.name}</h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium text-primary-container bg-primary-container/10 px-2 py-0.5 rounded-lg">
                      {d.tag}
                    </span>
                    <span className="text-xs text-secondary dark:text-gray-500">{d.days}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────── */}
      <section className="py-20 bg-surface-container-low dark:bg-[#0e0e0e]">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-on-surface dark:text-white">
            Ready to start your journey?
          </h2>
          <p className="mt-4 text-secondary dark:text-gray-400 max-w-lg mx-auto">
            Join thousands of Indian travelers who plan smarter with AI. Free to get started.
          </p>
          <button
            onClick={() => navigate('/plan')}
            className="mt-8 rounded-2xl bg-primary-container px-10 py-4 text-base font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 transition-all duration-300"
          >
            Start Planning — It's Free
          </button>
        </div>
      </section>

      <Footer />

      {/* ── Live Toast ────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast} type="info" onClose={() => setToast(null)} />
      )}
    </div>
  );
}
