const Trip = require('../models/Trip');

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
  },
};

module.exports = { resolvers };

