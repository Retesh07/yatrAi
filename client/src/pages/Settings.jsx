import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

/* ── Sidebar links (same as Dashboard) ────────────────────── */
const sidebarLinks = [
  { label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { label: 'My Trips', icon: '✈️', path: '/dashboard' },
  { label: 'Explore', icon: '🌍', path: '/explore' },
  { label: 'Notifications', icon: '🔔', path: '/notifications' },
  { label: 'Settings', icon: '⚙️', path: '/settings', active: true },
];

const travelPrefs = ['Cultural', 'Adventure', 'Relaxation', 'Nature', 'Nightlife', 'Photography', 'Spiritual', 'Foodie', 'Shopping', 'Offbeat'];

export default function Settings() {
  const { user, logout } = useAuth();
  const [toast, setToast] = useState(null);

  /* Account details */
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');

  /* Travel preferences */
  const [selectedPrefs, setSelectedPrefs] = useState(['Cultural', 'Foodie', 'Nature']);

  const togglePref = (pref) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  /* Notification toggles */
  const [notifSettings, setNotifSettings] = useState({
    tripUpdates: true,
    communityActivity: true,
    marketing: false,
    weatherAlerts: true,
  });

  const toggleNotif = (key) => {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setToast('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0F0F0F] transition-colors duration-300">
      <Navbar />

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-4rem)] border-r border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-[#0a0a0a] p-4">
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
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-4xl">
          <h1 className="text-2xl font-bold text-on-surface dark:text-white animate-fade-in">
            Settings ⚙️
          </h1>
          <p className="mt-1 text-secondary dark:text-gray-400 animate-fade-in">
            Manage your account, preferences, and security
          </p>

          {/* ── Account Details ──────────────────────────── */}
          <section className="mt-8 animate-fade-in animation-delay-200">
            <h2 className="text-lg font-semibold text-on-surface dark:text-white mb-4">
              Account Details
            </h2>
            <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-white/[0.03] p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container text-2xl font-bold">
                  {name.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-on-surface dark:text-white">{name || 'User'}</p>
                  <p className="text-sm text-secondary dark:text-gray-400">{email}</p>
                </div>
                <button className="ml-auto text-xs text-primary-container hover:underline font-medium">
                  Change Avatar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Travel Preferences ───────────────────────── */}
          <section className="mt-8 animate-fade-in animation-delay-300">
            <h2 className="text-lg font-semibold text-on-surface dark:text-white mb-4">
              Travel Preferences
            </h2>
            <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-white/[0.03] p-6">
              <p className="text-sm text-secondary dark:text-gray-400 mb-4">
                Select your preferred travel styles — AI will use these to personalize your trips
              </p>
              <div className="flex flex-wrap gap-2">
                {travelPrefs.map((pref) => (
                  <button
                    key={pref}
                    onClick={() => togglePref(pref)}
                    className={`rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200 ${
                      selectedPrefs.includes(pref)
                        ? 'bg-primary-container text-on-primary-container border-primary-container shadow-sm'
                        : 'border-outline-variant/40 dark:border-white/10 text-on-surface dark:text-gray-300 hover:bg-surface-container dark:hover:bg-white/5'
                    }`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Security ─────────────────────────────────── */}
          <section className="mt-8 animate-fade-in animation-delay-400">
            <h2 className="text-lg font-semibold text-on-surface dark:text-white mb-4">
              Security
            </h2>
            <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-white/[0.03] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface dark:text-white">Password</p>
                  <p className="text-xs text-secondary dark:text-gray-500">Last changed 30 days ago</p>
                </div>
                <button className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-4 py-2 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all">
                  Change Password
                </button>
              </div>

              <div className="border-t border-outline-variant/20 dark:border-white/5 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface dark:text-white">Two-Factor Authentication</p>
                  <p className="text-xs text-secondary dark:text-gray-500">Add an extra layer of security</p>
                </div>
                <button className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-4 py-2 text-sm font-medium text-on-surface dark:text-white hover:bg-surface-container dark:hover:bg-white/5 transition-all">
                  Enable 2FA
                </button>
              </div>

              <div className="border-t border-outline-variant/20 dark:border-white/5 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface dark:text-white">Active Sessions</p>
                  <p className="text-xs text-secondary dark:text-gray-500">1 active session (this device)</p>
                </div>
                <button className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-4 py-2 text-sm font-medium text-error hover:bg-error-container/20 transition-all">
                  Sign Out All
                </button>
              </div>
            </div>
          </section>

          {/* ── Notification Settings ────────────────────── */}
          <section className="mt-8 animate-fade-in animation-delay-500">
            <h2 className="text-lg font-semibold text-on-surface dark:text-white mb-4">
              Notification Preferences
            </h2>
            <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-white/[0.03] p-6 space-y-4">
              {[
                { key: 'tripUpdates', label: 'Trip Updates', desc: 'Get notified about trip changes, weather alerts, and reminders' },
                { key: 'communityActivity', label: 'Community Activity', desc: 'Likes, copies, and comments on your shared trips' },
                { key: 'weatherAlerts', label: 'Weather Alerts', desc: 'Real-time weather updates for upcoming trips' },
                { key: 'marketing', label: 'Marketing Emails', desc: 'New features, tips, and promotional offers' },
              ].map((setting, i) => (
                <div key={setting.key} className={`flex items-center justify-between ${i > 0 ? 'border-t border-outline-variant/20 dark:border-white/5 pt-4' : ''}`}>
                  <div>
                    <p className="text-sm font-medium text-on-surface dark:text-white">{setting.label}</p>
                    <p className="text-xs text-secondary dark:text-gray-500">{setting.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(setting.key)}
                    className={`relative flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                      notifSettings[setting.key] ? 'bg-primary-container' : 'bg-surface-container-high dark:bg-white/10'
                    }`}
                  >
                    <span
                      className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        notifSettings[setting.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ── Danger Zone ──────────────────────────────── */}
          <section className="mt-8 mb-12 animate-fade-in">
            <h2 className="text-lg font-semibold text-error mb-4">
              Danger Zone
            </h2>
            <div className="rounded-2xl border border-error/20 bg-error-container/10 dark:bg-error/5 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-on-surface dark:text-white">Delete Account</p>
                  <p className="text-xs text-secondary dark:text-gray-500">
                    Permanently delete your account and all data. This cannot be undone.
                  </p>
                </div>
                <button className="rounded-xl border border-error/30 px-4 py-2 text-sm font-medium text-error hover:bg-error/10 transition-all flex-shrink-0">
                  Delete Account
                </button>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="sticky bottom-6 flex justify-end">
            <button
              id="save-settings-btn"
              onClick={handleSave}
              className="rounded-xl bg-primary-container px-8 py-3 text-sm font-semibold text-on-primary-container shadow-lg shadow-primary-container/25 hover:brightness-110 transition-all duration-200"
            >
              Save Changes
            </button>
          </div>
        </main>
      </div>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
