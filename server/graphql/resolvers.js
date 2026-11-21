const Trip = require('../models/Trip');
const Notification = require('../models/Notification');

const resolvers = {
  Query: {
    health: () => 'YatrAI Apollo GraphQL API is operational 🚀',

    publicTrips: async (_, { limit = 20 }) => {
      const trips = await Trip.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 50));

      return trips.map((t) => ({
        id: t._id.toString(),
        ...t.toObject(),
      }));
    },

    trip: async (_, { id }) => {
      const trip = await Trip.findById(id);
      if (!trip) return null;
      return {
        id: trip._id.toString(),
        ...trip.toObject(),
      };
    },

    myTrips: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authorized to access myTrips');
      }
      const trips = await Trip.find({ user: context.user.id }).sort({ createdAt: -1 });
      return trips.map((t) => ({
        id: t._id.toString(),
        ...t.toObject(),
      }));
    },

    unreadNotificationCount: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authorized to access unreadNotificationCount');
      }
      return await Notification.countDocuments({
        user: context.user._id || context.user.id,
        read: false,
      });
    },

    dashboard: async (_, __, context) => {
      if (!context.user) {
        throw new Error('Not authorized to access dashboard');
      }
      const userId = context.user._id || context.user.id;
      const [trips, unreadCount] = await Promise.all([
        Trip.find({ user: userId }).sort({ createdAt: -1 }),
        Notification.countDocuments({ user: userId, read: false }),
      ]);

      const totalTrips = trips.length;
      const completedTrips = trips.filter((t) => t.status === 'completed').length;
      const draftTrips = trips.filter((t) => t.status === 'draft').length;

      return {
        user: {
          id: userId.toString(),
          name: context.user.name,
          email: context.user.email,
        },
        unreadNotificationCount: unreadCount,
        trips: trips.map((t) => ({
          id: t._id.toString(),
          _id: t._id.toString(),
          ...t.toObject(),
        })),
        stats: {
          totalTrips,
          completedTrips,
          draftTrips,
        },
      };
    },
  },
};

module.exports = { resolvers };

