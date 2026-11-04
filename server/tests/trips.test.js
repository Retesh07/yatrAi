const request = require('supertest');
const app = require('../server');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { connect, closeDatabase, clearDatabase } = require('./setup/db');

describe('Trips CRUD Endpoints', () => {
  let authToken;
  let user;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    await request(app).post('/api/v1/auth/register').send({
      name: 'Explorer Dave',
      email: 'dave@example.com',
      password: 'password123',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'dave@example.com',
      password: 'password123',
    });

    authToken = loginRes.body.accessToken;
    user = await User.findOne({ email: 'dave@example.com' });
  });

  describe('GET /api/v1/trips (My Trips)', () => {
    it('should return list of trips belonging to the logged-in user', async () => {
      await Trip.create({
        user: user._id,
        destination: 'Manali',
        startDate: '2026-11-01',
        endDate: '2026-11-04',
      });
      await Trip.create({
        user: user._id,
        destination: 'Shimla',
        startDate: '2026-11-05',
        endDate: '2026-11-08',
      });

      const res = await request(app)
        .get('/api/v1/trips')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.trips.length).toBe(2);
    });
  });

  describe('GET /api/v1/trips/:id', () => {
    it('should fetch single trip by ID for trip owner', async () => {
      const trip = await Trip.create({
        user: user._id,
        destination: 'Udaipur',
        startDate: '2026-12-20',
        endDate: '2026-12-25',
      });

      const res = await request(app)
        .get(`/api/v1/trips/${trip._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trip.destination).toBe('Udaipur');
    });

    it('should return 404 for non-existent trip ID', async () => {
      const res = await request(app)
        .get('/api/v1/trips/60d0fe4f5311236168a109ca')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Trip not found');
    });
  });

  describe('PUT /api/v1/trips/:id', () => {
    it('should update trip fields when owned by user', async () => {
      const trip = await Trip.create({
        user: user._id,
        destination: 'Varanasi',
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        budget: 'Budget',
      });

      const res = await request(app)
        .put(`/api/v1/trips/${trip._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ budget: 'Luxury' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trip.budget).toBe('Luxury');
    });
  });

  describe('DELETE /api/v1/trips/:id', () => {
    it('should delete a trip owned by user', async () => {
      const trip = await Trip.create({
        user: user._id,
        destination: 'Rishikesh',
        startDate: '2026-10-10',
        endDate: '2026-10-12',
      });

      const res = await request(app)
        .delete(`/api/v1/trips/${trip._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Trip deleted');

      const checkInDb = await Trip.findById(trip._id);
      expect(checkInDb).toBeNull();
    });
  });

  describe('GET /api/v1/trips/public', () => {
    it('should list only public trips without requiring auth', async () => {
      await Trip.create({
        user: user._id,
        destination: 'Public Ladakh Trip',
        startDate: '2026-09-01',
        endDate: '2026-09-10',
        isPublic: true,
      });

      await Trip.create({
        user: user._id,
        destination: 'Private Ladakh Trip',
        startDate: '2026-09-01',
        endDate: '2026-09-10',
        isPublic: false,
      });

      const res = await request(app).get('/api/v1/trips/public');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trips.length).toBe(1);
      expect(res.body.trips[0].destination).toBe('Public Ladakh Trip');
    });
  });
});

