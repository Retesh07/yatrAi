import { useState } from 'react';
import Navbar from '../components/Navbar';

/* ── Mock notifications ───────────────────────────────────── */
const initialNotifications = [
  { id: 1, type: 'trip', title: 'Trip to Jaipur completed!', desc: 'Your trip itinerary has been saved successfully. View the details anytime from your dashboard.', time: '2 min ago', read: false, icon: '✈️' },
  { id: 2, type: 'social', title: 'Priya liked your Goa trip', desc: 'Your community trip post received a new like from Priya S.', time: '15 min ago', read: false, icon: '❤️' },
  { id: 3, type: 'system', title: 'New feature: Packing Lists!', desc: 'AI-powered packing lists are now available for all your trips. Check it out!', time: '1 hour ago', read: false, icon: '🎒' },
  { id: 4, type: 'trip', title: 'Weather update for Manali', desc: 'Snowfall expected during your travel dates. We\'ve updated your packing list.', time: '3 hours ago', read: true, icon: '🌨️' },
  { id: 5, type: 'social', title: 'Arjun copied your itinerary', desc: 'Your Kerala backwaters trip was copied by Arjun K. from the Explore page.', time: '5 hours ago', read: true, icon: '📋' },
  { id: 6, type: 'system', title: 'Rate limit reset', desc: 'Your daily AI generation limit has been reset. You now have 5/5 generations available.', time: 'Yesterday', read: true, icon: '🔄' },
  { id: 7, type: 'trip', title: 'Reminder: Goa trip in 3 days', desc: 'Your trip to Goa starts on April 2. Make sure your bags are packed!', time: 'Yesterday', read: true, icon: '📅' },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const allRead = unreadCount === 0;

  return (
    <div className="min-h-screen bg-surface dark:bg-[#0F0F0F] transition-colors duration-300">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-on-surface dark:text-white">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-secondary dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              id="mark-all-read-btn"
              onClick={markAllAsRead}
              className="rounded-xl border border-outline-variant/40 dark:border-white/10 px-4 py-2 text-sm font-medium text-primary-container hover:bg-primary-container/10 transition-all"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="mt-6 space-y-2 animate-fade-in animation-delay-200">
          {notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                notification.read
                  ? 'border-outline-variant/20 dark:border-white/5 bg-surface-container-lowest dark:bg-white/[0.02]'
                  : 'border-l-4 border-l-primary-container border-t border-r border-b border-outline-variant/30 dark:border-white/10 bg-primary-container/5 dark:bg-primary-container/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-container dark:bg-white/5 text-xl">
                  {notification.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold truncate ${
                      notification.read
                        ? 'text-on-surface/70 dark:text-gray-400'
                        : 'text-on-surface dark:text-white'
                    }`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="flex h-2 w-2 flex-shrink-0 rounded-full bg-primary-container" />
                    )}
                  </div>
                  <p className="text-sm text-secondary dark:text-gray-500 mt-0.5 line-clamp-2">
                    {notification.desc}
                  </p>
                  <p className="text-xs text-secondary/70 dark:text-gray-600 mt-1.5">
                    {notification.time}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {allRead && (
          <div className="mt-12 text-center animate-fade-in">
            <p className="text-5xl mb-4">🎉</p>
            <p className="text-lg font-medium text-on-surface dark:text-white">All caught up!</p>
            <p className="text-sm text-secondary dark:text-gray-400 mt-1">
              No unread notifications. Time to plan a new trip?
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
