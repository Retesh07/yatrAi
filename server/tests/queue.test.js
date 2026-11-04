const User = require('../models/User');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const {
  addPublicTripShareJob,
  processPublicTripShareJob,
  setPublicTripShareQueue,
  getPublicTripShareQueue,
} = require('../services/queueService');
const { MockQueue } = require('./mocks/bullmqMock');
const { connect, closeDatabase, clearDatabase } = require('./setup/db');

describe('BullMQ Queue & Synchronous Fallback Processing', () => {
  let ownerUser;
  let otherUser1;
  let otherUser2;
  let publicTrip;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    setPublicTripShareQueue(null); // start clean

    ownerUser = await User.create({
      name: 'Trip Owner',
      email: 'owner@example.com',
      password: 'hashedpassword',
    });

    otherUser1 = await User.create({
      name: 'Traveler Alice',
      email: 'alice@example.com',
      password: 'hashedpassword',
    });

    otherUser2 = await User.create({
      name: 'Traveler Bob',
      email: 'bob@example.com',
      password: 'hashedpassword',
    });

    publicTrip = await Trip.create({
      user: ownerUser._id,
      ownerName: ownerUser.name,
      destination: 'Kerala Backwaters',
      startDate: '2026-12-10',
      endDate: '2026-12-15',
      isPublic: true,
      status: 'completed',
    });
  });

  afterEach(() => {
    setPublicTripShareQueue(null);
  });

  it('Normal Path: enqueues job in BullMQ when Redis queue is active', async () => {
    const mockQueue = new MockQueue('public-trip-share', {});
    setPublicTripShareQueue(mockQueue);

    await addPublicTripShareJob(publicTrip._id, ownerUser._id);

    expect(mockQueue.jobs.length).toBe(1);
    expect(mockQueue.jobs[0].name).toBe('public-trip-share');
    expect(mockQueue.jobs[0].data).toEqual({
      tripId: publicTrip._id,
      ownerId: ownerUser._id,
    });

    // Verify no direct notifications were created yet (waiting for worker)
    const notifications = await Notification.find();
    expect(notifications.length).toBe(0);
  });

  it('Worker processing: processPublicTripShareJob creates notifications for all other users', async () => {
    await processPublicTripShareJob({
      tripId: publicTrip._id,
      ownerId: ownerUser._id,
    });

    // Should create notifications for Alice and Bob, NOT for the owner
    const notifications = await Notification.find();
    expect(notifications.length).toBe(2);

    const recipientIds = notifications.map((n) => n.user.toString());
    expect(recipientIds).toContain(otherUser1._id.toString());
    expect(recipientIds).toContain(otherUser2._id.toString());
    expect(recipientIds).not.toContain(ownerUser._id.toString());

    // Check notification content
    const sample = notifications[0];
    expect(sample.title).toContain(ownerUser.name);
    expect(sample.title).toContain(publicTrip.destination);
    expect(sample.type).toBe('social');
  });

  it('Fallback Path 1: when Redis is NOT configured (queue is null), synchronous fallback runs immediately', async () => {
    // Ensure queue is null (simulating REDIS_URL not set or offline)
    setPublicTripShareQueue(null);

    await addPublicTripShareJob(publicTrip._id, ownerUser._id);

    // Notifications should be created immediately via fallback
    const notifications = await Notification.find();
    expect(notifications.length).toBe(2);

    const recipientIds = notifications.map((n) => n.user.toString());
    expect(recipientIds).toContain(otherUser1._id.toString());
    expect(recipientIds).toContain(otherUser2._id.toString());
  });

  it('Fallback Path 2: when Redis queue throws error on add(), it catches and executes synchronous fallback', async () => {
    const failingQueue = new MockQueue('public-trip-share', {});
    failingQueue.shouldFail = true; // Simulates Redis connection dropped / timeout
    setPublicTripShareQueue(failingQueue);

    // Should NOT throw an unhandled error; should run the fallback directly
    await expect(
      addPublicTripShareJob(publicTrip._id, ownerUser._id)
    ).resolves.not.toThrow();

    // Verify notifications were still delivered to other users
    const notifications = await Notification.find();
    expect(notifications.length).toBe(2);
  });

  it('Job processor does not notify if trip is not public', async () => {
    publicTrip.isPublic = false;
    await publicTrip.save();

    await processPublicTripShareJob({
      tripId: publicTrip._id,
      ownerId: ownerUser._id,
    });

    const notifications = await Notification.find();
    expect(notifications.length).toBe(0);
  });
});

