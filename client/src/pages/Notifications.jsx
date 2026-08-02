import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { apiGetTrip } from '../api/client';
import { apiGetNotifications, apiMarkNotificationRead } from '../api/notifications';
import { initSocket, subscribe } from '../services/socket';

const initialNotifications = [
  { id: 1, type: 'trip', title: 'Trip to Jaipur completed!', desc: 'Your trip itinerary has been saved successfully. View the details anytime from your dashboard.', time: '2 min ago', read: false, icon: '✈️' },
  { id: 2, type: 'social', title: 'Ananya liked your Goa trip', desc: 'Your community trip post received a new like from Ananya S.', time: '15 min ago', read: false, icon: '❤️' },
  { id: 3, type: 'system', title: 'New feature: Packing Lists!', desc: 'AI-powered packing lists are now available for all your trips. Check it out!', time: '1 hour ago', read: false, icon: '🎒' },
  { id: 4, type: 'trip', title: 'Weather update for Manali', desc: 'Snowfall expected during your travel dates. We\'ve updated your packing list.', time: '3 hours ago', read: true, icon: '🌨️' },
  { id: 5, type: 'social', title: 'Arjun copied your itinerary', desc: 'Your Kerala backwaters trip was copied by Arjun K. from the Explore page.', time: '5 hours ago', read: true, icon: '📋' },
  { id: 6, type: 'system', title: 'Rate limit reset', desc: 'Your daily AI generation limit has been reset. You now have 5/5 generations available.', time: 'Yesterday', read: true, icon: '🔄' },
  { id: 7, type: 'trip', title: 'Reminder: Goa trip in 3 days', desc: 'Your trip to Goa starts on April 2. Make sure your bags are packed!', time: 'Yesterday', read: true, icon: '📅' },
];

function normalizeNotification(notification) {
  return {
    id: notification._id || notification.id,
    type: notification.type || 'system',
    title: notification.title,
    desc: notification.message || notification.desc,
    time: notification.createdAt ? new Date(notification.createdAt).toLocaleString() : notification.time || 'Just now',
    icon: notification.icon || '🔔',
    read: Boolean(notification.read),
    data: notification.data || {},
  };
}

export default function Notifications() {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const publishUnreadCount = (items) => {
    window.dispatchEvent(new CustomEvent('notifications:updated', {
      detail: { unreadCount: items.filter((item) => !item.read).length },
    }));
  };

  const markAsRead = async (notification) => {
    const { id } = notification;
    try {
      await apiMarkNotificationRead(id, token);
    } catch (err) {
      console.error('Failed to mark notification read:', err);
      return;
    }
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      publishUnreadCount(next);
      return next;
    });

    const tripId = notification.data?.tripId;
    if (!tripId) return;

    try {
      await apiGetTrip(tripId, token);
      navigate(`/trip/${tripId}`);
    } catch (tripErr) {
      console.error('Unable to open trip from notification:', tripErr);
      setNotice('That trip is no longer available, so we kept you on notifications instead.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.map((n) => apiMarkNotificationRead(n.id, token))
      );
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
    setNotifications((prev) => {
      const next = [];
      publishUnreadCount(next);
      return next;
    });
  };

  const allRead = unreadCount === 0;

  useEffect(() => {
    if (!token || !isAuthenticated) return;

    async function fetchNotifications() {
      try {
        setLoading(true);
        setError('');
        setNotice('');
        const data = await apiGetNotifications(token);
        if (data.success) {
          const normalizedNotifications = data.notifications.map(normalizeNotification);
          setNotifications(normalizedNotifications);
          publishUnreadCount(normalizedNotifications);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
        setError('Unable to load notifications at the moment.');
      } finally {
        setLoading(false);
      }
    }

    const socket = initSocket(token);
    const unsubscribe = subscribe('notification', (payload) => {
      setNotifications((prev) => [
        {
          id: payload.id,
          type: payload.type,
          title: payload.title,
          desc: payload.message,
          time: 'Just now',
          icon: payload.type === 'social' ? '❤️' : payload.type === 'system' ? '⚙️' : '✈️',
          read: false,
          data: payload.data || {},
        },
        ...prev,
      ]);
    });

    fetchNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
      if (socket) socket.off('notification');
    };
  }, [token, isAuthenticated]);

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

        {notice && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {notice}
          </div>
        )}

        {/* Notifications List */}
        <div className="mt-6 space-y-2 animate-fade-in animation-delay-200">
          {loading ? (
          <div className="py-10 text-center text-secondary dark:text-gray-400">
            <svg className="h-8 w-8 animate-spin mx-auto text-primary-container mb-2" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
            </svg>
            Loading notifications...
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-500">{error}</div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => markAsRead(notification)}
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
          ))
        )}
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
