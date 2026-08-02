import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiChangePassword, apiDeleteAccount } from '../api/auth';
import Navbar from '../components/Navbar';
import Toast from '../components/Toast';

/* ── Sidebar links (same as Dashboard) ────────────────────── */
const sidebarLinks = [
  { label: 'Dashboard', icon: '📊', path: '/dashboard' },
  { label: 'Explore', icon: '🌍', path: '/explore' },
  { label: 'Notifications', icon: '🔔', path: '/notifications' },
  { label: 'Settings', icon: '⚙️', path: '/settings', active: true },
];

const travelPrefs = ['Cultural', 'Adventure', 'Relaxation', 'Nature', 'Nightlife', 'Photography', 'Spiritual', 'Foodie', 'Shopping', 'Offbeat'];

export default function Settings() {
  const { user, logout, updateUser, token } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  /* Account details */
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  /* Travel preferences */
  const [selectedPrefs, setSelectedPrefs] = useState(['Cultural', 'Foodie', 'Nature']);

  const togglePref = (pref) => {
    setSelectedPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleSave = () => {
    updateUser({ name, email, phone });
    setToast('Settings saved successfully!');
  };

  const handleChangeAvatar = () => {
    setToast('Avatar customization will be available soon.');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setToast('Please enter both current and new passwords.');
      return;
    }

    try {
      await apiChangePassword(currentPassword, newPassword, token);
      setCurrentPassword('');
      setNewPassword('');
      setToast('Password updated successfully.');
    } catch (err) {
      setToast(err.message || 'Unable to change password.');
    }
  };

  const handleSignOutAll = async () => {
    await logout();
    setToast('Signed out from all sessions.');
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Delete your account and all saved trips? This cannot be undone.');
    if (!confirmed) return;

    try {
      await apiDeleteAccount(token);
      await logout();
      setToast('Account deleted successfully.');
      navigate('/login');
    } catch (err) {
      setToast(err.message || 'Unable to delete account.');
    }
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
                <button onClick={handleChangeAvatar} className="ml-auto text-xs text-primary-container hover:underline font-medium">
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
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-on-surface dark:text-white">Password</p>
                    <p className="text-xs text-secondary dark:text-gray-500">Update your password to keep your account secure</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface dark:text-gray-300 mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-xl border border-outline-variant/40 dark:border-white/10 bg-surface dark:bg-white/5 px-4 py-3 text-sm text-on-surface dark:text-white placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary-container/50 transition-all"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button onClick={handleChangePassword} className="rounded-xl bg-primary-container px-5 py-3 text-sm font-semibold text-on-primary-container hover:brightness-110 transition-all duration-200">
                    Change Password
                  </button>
                </div>
              </div>

              <div className="border-t border-outline-variant/20 dark:border-white/5 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface dark:text-white">Active Sessions</p>
                  <p className="text-xs text-secondary dark:text-gray-500">1 active session (this device)</p>
                </div>
                <button onClick={handleSignOutAll} className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-4 py-2 text-sm font-medium text-error hover:bg-error-container/20 transition-all">
                  Sign Out All
                </button>
              </div>
            </div>
          </section>

          {/* ── Notification Summary ─────────────────────── */}
          <section className="mt-8 animate-fade-in animation-delay-500">
            <h2 className="text-lg font-semibold text-on-surface dark:text-white mb-4">
              Notifications
            </h2>
            <div className="rounded-2xl border border-outline-variant/30 dark:border-white/10 bg-surface-container-lowest dark:bg-white/[0.03] p-6">
              <p className="text-sm font-medium text-on-surface dark:text-white">
                Notifications are handled automatically in this version of the app.
              </p>
              <p className="mt-2 text-xs text-secondary dark:text-gray-400">
                You will be notified when a trip is saved, an itinerary is generated, a public trip is shared, or an upcoming trip is nearing its start date.
              </p>
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
                <button onClick={handleDeleteAccount} className="rounded-xl border border-error/30 px-4 py-2 text-sm font-medium text-error hover:bg-error/10 transition-all flex-shrink-0">
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
