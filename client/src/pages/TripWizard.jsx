import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

/* ── Wizard option data ──────────────────────────────────── */
const quickFromCities = ['Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad'];
const quickDestinations = ['Jaipur', 'Goa', 'Manali', 'Kerala', 'Varanasi', 'Udaipur', 'Rishikesh', 'Darjeeling', 'Leh-Ladakh', 'Hampi'];

const peopleOptions = [
  { label: 'Solo', desc: 'Just me' },
  { label: 'Couple', desc: 'Two of us' },
  { label: 'Family', desc: 'With kids' },
  { label: 'Group', desc: '5+ people' },
];

const budgetOptions = [
  { label: 'Budget', range: '₹0 – ₹5K' },
  { label: 'Economy', range: '₹5K – ₹15K' },
  { label: 'Standard', range: '₹15K – ₹30K' },
  { label: 'Premium', range: '₹30K – ₹60K' },
  { label: 'Luxury', range: '₹60K+' },
];

const travelStyles = ['Cultural', 'Adventure', 'Relaxation', 'Nature', 'Nightlife', 'Photography', 'Spiritual', 'Foodie', 'Shopping', 'Offbeat'];

const foodOptions = [
  { label: 'Vegetarian' },
  { label: 'Non-Vegetarian' },
  { label: 'Vegan' },
  { label: 'No Preference' },
];

const transportOptions = ['Flight', 'Train', 'Bus', 'Self-Drive', 'Bike', 'Cab'];

const TOTAL_STEPS = 8; // 7 input steps + 1 review

/* ── Indian date format helper ───────────────────────────── */
const formatDateIndian = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const todayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
};

const clampDate = (value, min) => {
  if (!value) return value;
  return value < min ? min : value;
};

export default function TripWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    fromLocation: '',
    destination: '',
    startDate: '',
    endDate: '',
    people: '',
    budget: '',
    travelStyle: [],
    food: '',
    transport: [],
    isPublic: false,
  });

  const update = (key, value) => setWizardData((prev) => ({ ...prev, [key]: value }));

  const toggleArrayItem = (key, item) => {
    setWizardData((prev) => {
      const arr = prev[key];
      return { ...prev, [key]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item] };
    });
  };

  const progress = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;

  const getDaysCount = () => {
    if (!wizardData.startDate || !wizardData.endDate) return 0;
    const diff = new Date(wizardData.endDate) - new Date(wizardData.startDate);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1);
  };

  const isFromToValid = () => {
    if (!wizardData.fromLocation.trim() || !wizardData.destination.trim()) return false;
    return wizardData.fromLocation.trim().toLowerCase() !== wizardData.destination.trim().toLowerCase();
  };

  const isDateRangeValid = () => {
    if (!wizardData.startDate || !wizardData.endDate) return false;
    const today = todayISO();
    if (wizardData.startDate < today || wizardData.endDate < today) return false;
    return getDaysCount() > 0;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return isFromToValid();
      case 2: return isDateRangeValid();
      case 3: return wizardData.people.length > 0;
      case 4: return wizardData.budget.length > 0;
      case 5: return wizardData.travelStyle.length > 0;
      case 6: return wizardData.food.length > 0;
      case 7: return wizardData.transport.length > 0;
      default: return true;
    }
  };

  const handleGenerate = () => {
    navigate('/generate', { state: { wizardData } });
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0a0a0a] transition-colors duration-300">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary dark:text-gray-400">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-sm font-medium text-primary-container">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-container dark:bg-white/[0.06]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary-container to-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="animate-fade-in" key={currentStep}>
          {/* ── Step 1: From & Destination ──────────────────────── */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">
                Where are you traveling from & to?
              </h2>
              <p className="mt-2 text-secondary dark:text-gray-400">
                Enter your starting city and destination
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                    🚀 Starting Location (From)
                  </label>
                  <input
                    id="from-input"
                    type="text"
                    value={wizardData.fromLocation}
                    onChange={(e) => update('fromLocation', e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Bangalore, Kolkata..."
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/[0.08] bg-surface-container-lowest dark:bg-[#141414] px-5 py-3.5 text-base text-on-surface dark:text-white placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickFromCities.map((c) => (
                      <button
                        key={c}
                        onClick={() => update('fromLocation', c)}
                        className={`rounded-lg px-3 py-1 text-xs font-medium border transition-all ${
                          wizardData.fromLocation === c
                            ? 'bg-primary-container text-on-primary-container border-primary-container font-semibold'
                            : 'border-outline-variant/30 text-secondary dark:text-gray-400 hover:bg-surface-container dark:hover:bg-white/5'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                    📍 Destination City (To)
                  </label>
                  <input
                    id="destination-input"
                    type="text"
                    value={wizardData.destination}
                    onChange={(e) => update('destination', e.target.value)}
                    placeholder="e.g. Jaipur, Goa, Manali, Kerala..."
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/[0.08] bg-surface-container-lowest dark:bg-[#141414] px-5 py-3.5 text-base text-on-surface dark:text-white placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickDestinations.map((d) => (
                      <button
                        key={d}
                        onClick={() => update('destination', d)}
                        className={`rounded-lg px-3 py-1 text-xs font-medium border transition-all ${
                          wizardData.destination === d
                            ? 'bg-primary-container text-on-primary-container border-primary-container font-semibold'
                            : 'border-outline-variant/30 text-secondary dark:text-gray-400 hover:bg-surface-container dark:hover:bg-white/5'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  {wizardData.fromLocation.trim() && wizardData.destination.trim() && !isFromToValid() && (
                    <p className="mt-3 text-sm text-red-500">
                      Starting location and destination must be different.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Dates ───────────────────────────── */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">
                When are you traveling?
              </h2>
              <p className="mt-2 text-secondary dark:text-gray-400">
                Select your trip dates
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                    Start Date
                  </label>
                  <input
                    id="start-date-input"
                    type="date"
                    value={wizardData.startDate}
                    onChange={(e) => update('startDate', clampDate(e.target.value, todayISO()))}
                    min={todayISO()}
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/[0.08] bg-surface-container-lowest dark:bg-[#141414] px-4 py-3 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">
                    End Date
                  </label>
                  <input
                    id="end-date-input"
                    type="date"
                    value={wizardData.endDate}
                    onChange={(e) => update('endDate', clampDate(e.target.value, wizardData.startDate || todayISO()))}
                    min={wizardData.startDate || todayISO()}
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/[0.08] bg-surface-container-lowest dark:bg-[#141414] px-4 py-3 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {getDaysCount() > 0 && (
                  <div className="flex items-center gap-2 rounded-xl bg-primary-container/10 px-4 py-3">
                    <span className="text-sm font-medium text-primary dark:text-primary-container">
                      {getDaysCount()} day{getDaysCount() > 1 ? 's' : ''} trip · {formatDateIndian(wizardData.startDate)} – {formatDateIndian(wizardData.endDate)}
                    </span>
                  </div>
                )}

                {!isDateRangeValid() && wizardData.startDate && wizardData.endDate && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                    Please choose dates from today onward, and make sure your end date comes after the start date.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: People ──────────────────────────── */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">
                Who's coming along?
              </h2>
              <p className="mt-2 text-secondary dark:text-gray-400">
                Select your travel group
              </p>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {peopleOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => update('people', opt.label)}
                    className={`rounded-2xl border p-5 text-center transition-all duration-200 hover:-translate-y-1 ${
                      wizardData.people === opt.label
                        ? 'border-primary-container bg-primary-container/10 shadow-lg shadow-primary-container/10'
                        : 'border-outline-variant/40 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] hover:border-primary-container/40'
                    }`}
                  >
                    <p className="font-semibold text-sm text-on-surface dark:text-white">{opt.label}</p>
                    <p className="text-xs text-secondary dark:text-gray-400 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Budget ─────────────────────────── */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">
                What's your budget?
              </h2>
              <p className="mt-2 text-secondary dark:text-gray-400">
                Per person estimate for the entire trip
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {budgetOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => update('budget', opt.label)}
                    className={`rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-1 ${
                      wizardData.budget === opt.label
                        ? 'border-primary-container bg-primary-container/10 shadow-lg shadow-primary-container/10'
                        : 'border-outline-variant/40 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] hover:border-primary-container/40'
                    }`}
                  >
                    <p className="font-semibold text-sm text-on-surface dark:text-white">{opt.label}</p>
                    <p className="text-xs text-secondary dark:text-gray-400 mt-0.5">{opt.range}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 5: Travel Style ───────────────────── */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">
                Your travel style?
              </h2>
              <p className="mt-2 text-secondary dark:text-gray-400">
                Select all that match — the AI will personalize your itinerary
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {travelStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => toggleArrayItem('travelStyle', style)}
                    className={`rounded-full px-5 py-2.5 text-sm font-medium border transition-all duration-200 ${
                      wizardData.travelStyle.includes(style)
                        ? 'bg-primary-container text-on-primary-container border-primary-container shadow-md'
                        : 'border-outline-variant/40 dark:border-white/[0.08] text-on-surface dark:text-gray-300 hover:bg-surface-container dark:hover:bg-white/5'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>

              {wizardData.travelStyle.length > 0 && (
                <p className="mt-4 text-sm text-secondary dark:text-gray-500">
                  Selected: {wizardData.travelStyle.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* ── Step 6: Food Preference ────────────────── */}
          {currentStep === 6 && (
            <div>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">
                Food preferences?
              </h2>
              <p className="mt-2 text-secondary dark:text-gray-400">
                We'll recommend restaurants accordingly
              </p>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {foodOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => update('food', opt.label)}
                    className={`rounded-2xl border p-5 text-center transition-all duration-200 hover:-translate-y-1 ${
                      wizardData.food === opt.label
                        ? 'border-primary-container bg-primary-container/10 shadow-lg shadow-primary-container/10'
                        : 'border-outline-variant/40 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] hover:border-primary-container/40'
                    }`}
                  >
                    <p className="font-semibold text-sm text-on-surface dark:text-white">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 7: Transport ──────────────────────── */}
          {currentStep === 7 && (
            <div>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">
                Preferred transport?
              </h2>
              <p className="mt-2 text-secondary dark:text-gray-400">
                Select all modes you're open to
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {transportOptions.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleArrayItem('transport', t)}
                    className={`rounded-full px-5 py-2.5 text-sm font-medium border transition-all duration-200 ${
                      wizardData.transport.includes(t)
                        ? 'bg-primary-container text-on-primary-container border-primary-container shadow-md'
                        : 'border-outline-variant/40 dark:border-white/[0.08] text-on-surface dark:text-gray-300 hover:bg-surface-container dark:hover:bg-white/5'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {wizardData.transport.length > 0 && (
                <p className="mt-4 text-sm text-secondary dark:text-gray-500">
                  Selected: {wizardData.transport.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* ── Step 8: Review ─────────────────────────── */}
          {currentStep === 8 && (
            <div>
              <h2 className="text-2xl font-bold text-on-surface dark:text-white">
                Review your trip
              </h2>
              <p className="mt-2 text-secondary dark:text-gray-400">
                Make sure everything looks good before generating
              </p>

              <div className="mt-6 rounded-2xl border border-outline-variant/30 dark:border-white/[0.06] bg-surface-container-lowest dark:bg-[#141414] p-6 space-y-4">
                {[
                  { label: 'Destination', value: wizardData.destination },
                  { label: 'Dates', value: `${formatDateIndian(wizardData.startDate)} – ${formatDateIndian(wizardData.endDate)} (${getDaysCount()} days)` },
                  { label: 'Travelers', value: wizardData.people },
                  { label: 'Budget', value: wizardData.budget },
                  { label: 'Style', value: wizardData.travelStyle.join(', ') },
                  { label: 'Food', value: wizardData.food },
                  { label: 'Transport', value: wizardData.transport.join(', ') },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div>
                      <p className="text-xs text-secondary dark:text-gray-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-medium text-on-surface dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-outline-variant/20 bg-surface-container p-4 flex items-center justify-between gap-4 dark:border-white/10 dark:bg-[#1a1a1a]">
                <div>
                  <p className="text-sm font-semibold text-on-surface dark:text-[#f5f5f5]">Share this trip publicly</p>
                  <p className="mt-1 text-xs text-secondary dark:text-[#b8b8b8]">If enabled, other travelers will receive a notification and can discover your itinerary.</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`text-sm font-semibold ${wizardData.isPublic ? 'text-green-600 dark:text-green-400' : 'text-on-surface dark:text-[#f5f5f5]'}`}>
                    {wizardData.isPublic ? 'Publicly shared' : 'Private'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={wizardData.isPublic}
                    aria-label="Share this trip publicly"
                    onClick={() => update('isPublic', !wizardData.isPublic)}
                    className={`relative h-7 w-12 rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a1a1a] ${
                      wizardData.isPublic ? 'bg-green-500' : 'bg-outline-variant/50 dark:bg-[#383838]'
                    }`}
                  >
                    <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${
                      wizardData.isPublic ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
              <button
                id="generate-trip-btn"
                onClick={handleGenerate}
                className="mt-8 w-full rounded-xl bg-primary-container px-6 py-4 text-base font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 transition-all duration-200"
              >
                Generate My Trip
              </button>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 8 && (
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              disabled={currentStep === 1}
              className="rounded-xl border border-outline-variant/40 dark:border-white/[0.08] px-6 py-3 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              Back
            </button>

            <button
              onClick={() => setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1))}
              disabled={!canProceed()}
              className="rounded-xl bg-primary-container px-6 py-3 text-sm font-semibold text-on-primary-container shadow-md shadow-primary-container/25 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              {currentStep === 7 ? 'Review' : 'Next'}
            </button>
          </div>
        )}

        {currentStep === 8 && (
          <div className="mt-4">
            <button
              onClick={() => setCurrentStep(7)}
              className="rounded-xl border border-outline-variant/40 dark:border-white/[0.08] px-6 py-3 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all duration-200"
            >
              Back to edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
