const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const { createNotification } = require('./notificationService');

const REMINDER_WINDOWS = [7, 3, 1, 0];
const DAY_MS = 24 * 60 * 60 * 1000;

function parseTripDate(dateValue) {
  if (!dateValue) return null;

  const parts = String(dateValue).split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

function getDaysUntilTrip(dateValue) {
  const startDate = parseTripDate(dateValue);
  if (!startDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tripDate = new Date(startDate);
  tripDate.setHours(0, 0, 0, 0);

  return Math.floor((tripDate - today) / DAY_MS);
}

function getReminderLabel(daysRemaining) {
  if (daysRemaining === 0) return 'today';
  if (daysRemaining === 1) return 'in 1 day';
  return `in ${daysRemaining} days`;
}

async function notifyTripSaved(trip) {
  if (!trip?.user || !trip?.destination) return;

  await createNotification({
    userId: trip.user,
    title: `Trip to ${trip.destination} saved`,
    message: 'Your trip is now in your dashboard and ready for updates.',
    data: {
      tripId: trip._id,
      destination: trip.destination,
      eventType: 'trip_saved',
    },
    type: 'trip',
  });
}

async function notifyTripGenerated(trip) {
  if (!trip?.user || !trip?.destination) return;

  await createNotification({
    userId: trip.user,
    title: `Itinerary ready for ${trip.destination}`,
    message: 'Your trip itinerary has been generated and saved.',
    data: {
      tripId: trip._id,
      destination: trip.destination,
      eventType: 'trip_generated',
    },
    type: 'trip',
  });
}

async function sendUpcomingTripReminders() {
  const trips = await Trip.find({
    startDate: { $exists: true, $nin: [null, ''] },
  }).select('_id user destination startDate');

  const notifications = [];

  for (const trip of trips) {
    const daysRemaining = getDaysUntilTrip(trip.startDate);
    if (daysRemaining === null || daysRemaining < 0 || !REMINDER_WINDOWS.includes(daysRemaining)) {
      continue;
    }

    const reminderKey = `upcoming-${daysRemaining}`;
    const existing = await Notification.findOne({
      user: trip.user,
      type: 'trip',
      'data.tripId': trip._id,
      'data.reminderKey': reminderKey,
    });

    if (existing) continue;

    notifications.push(
      createNotification({
        userId: trip.user,
        title: `${trip.destination} trip starts ${getReminderLabel(daysRemaining)}`,
        message: daysRemaining === 0
          ? 'Your trip starts today. Check the weather and pack the final essentials.'
          : `Your trip starts ${getReminderLabel(daysRemaining)}. Check the weather and get ready.`,
        data: {
          tripId: trip._id,
          destination: trip.destination,
          reminderKey,
          daysRemaining,
          eventType: 'trip_upcoming',
        },
        type: 'trip',
      })
    );
  }

  await Promise.allSettled(notifications);
}

function startTripReminderScheduler() {
  const runReminders = () => {
    sendUpcomingTripReminders().catch((error) => {
      console.error('Trip reminder scheduler error:', error);
    });
  };

  runReminders();
  setInterval(runReminders, 12 * 60 * 60 * 1000);
}

module.exports = {
  notifyTripSaved,
  notifyTripGenerated,
  sendUpcomingTripReminders,
  startTripReminderScheduler,
};
