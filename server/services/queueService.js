const { Queue, Worker, QueueScheduler } = require('bullmq');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { createNotification } = require('./notificationService');
const { broadcastPublicTrip } = require('./socketService');

let publicTripShareQueue;
let hasQueue = false;

const getRedisConnection = () => {
  if (process.env.REDIS_URL) {
    return { connection: process.env.REDIS_URL };
  }

  if (process.env.REDIS_HOST) {
    return {
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
      },
    };
  }

  return null;
};

const processPublicTripShareJob = async ({ tripId, ownerId }) => {
  const trip = await Trip.findById(tripId).populate('user', 'name');
  if (!trip || !trip.isPublic) return;

  const destination = trip.destination || 'your destination';
  const ownerName = trip.ownerName || trip.user?.name || 'A traveler';

  const users = await User.find({ _id: { $ne: ownerId } }).select('_id');
  if (!users.length) return;

  const notificationPromises = users.map((user) =>
    createNotification({
      userId: user._id,
      title: `${ownerName} shared a public trip to ${destination}`,
      message: `Check out the new public itinerary and use it as travel inspiration.`,
      data: { tripId: trip._id, destination, ownerName },
      type: 'social',
    })
  );

  await Promise.allSettled(notificationPromises);
  broadcastPublicTrip({ tripId: trip._id, destination, ownerName });
};

const initQueue = () => {
  const redisConfig = getRedisConnection();
  if (!redisConfig) {
    console.warn('BullMQ queue is disabled because REDIS_URL or REDIS_HOST is not configured. Falling back to immediate processing.');
    return;
  }

  publicTripShareQueue = new Queue('public-trip-share', redisConfig);
  new QueueScheduler('public-trip-share', redisConfig);

  new Worker(
    'public-trip-share',
    async (job) => {
      await processPublicTripShareJob(job.data);
    },
    redisConfig
  );

  hasQueue = true;
};

const addPublicTripShareJob = async (tripId, ownerId) => {
  if (publicTripShareQueue) {
    await publicTripShareQueue.add('public-trip-share', { tripId, ownerId });
  } else {
    await processPublicTripShareJob({ tripId, ownerId });
  }
};

module.exports = { initQueue, addPublicTripShareJob, processPublicTripShareJob };
