const request = require('supertest');
const app = require('../server');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { generateFallbackTrip } = require('../services/groqService');
const { connect, closeDatabase, clearDatabase } = require('./setup/db');
const {
  mockValidItinerary,
  mockGroqSuccess,
  mockGroqFailure,
  mockGroqMalformed,
} = require('./mocks/groqMock');

describe('Itinerary API & Groq Service Integration', () => {
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
    jest.restoreAllMocks();

    // Create and login test user
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Traveler One',
      email: 'traveler1@example.com',
      password: 'password123',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'traveler1@example.com',
      password: 'password123',
    });

    authToken = loginRes.body.accessToken;
    user = await User.findOne({ email: 'traveler1@example.com' });
  });

  describe('Trip Creation & Input Validation (POST /api/v1/trips)', () => {
    it('should return 400 when destination is missing', async () => {
      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          startDate: '2026-12-01',
          endDate: '2026-12-05',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Destination, start date, and end date are required');
    });

    it('should return 400 when startDate is missing', async () => {
      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destination: 'Jaipur',
          endDate: '2026-12-05',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when endDate is missing', async () => {
      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destination: 'Jaipur',
          startDate: '2026-12-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should successfully create a draft trip with valid input', async () => {
      const res = await request(app)
        .post('/api/v1/trips')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fromLocation: 'Delhi',
          destination: 'Goa',
          startDate: '2026-12-01',
          endDate: '2026-12-03',
          people: '2 Travelers',
          budget: 'Moderate',
          travelStyle: ['Relaxed', 'Beach'],
          food: 'veg',
          transport: ['Flight'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.trip).toBeDefined();
      expect(res.body.trip.destination).toBe('Goa');
      expect(res.body.trip.status).toBe('draft');
      expect(res.body.trip.user.toString()).toBe(user._id.toString());
    });
  });

  describe('Itinerary Generation (POST /api/v1/trips/:id/generate)', () => {
    let testTrip;

    beforeEach(async () => {
      testTrip = await Trip.create({
        user: user._id,
        ownerName: user.name,
        fromLocation: 'Delhi',
        destination: 'Goa',
        startDate: '2026-12-01',
        endDate: '2026-12-03',
        people: '2 Travelers',
        budget: 'Moderate',
        travelStyle: ['Relaxed'],
        food: 'veg',
        transport: ['Flight'],
        status: 'draft',
      });
    });

    it('should generate complete itinerary with expected structure when Groq succeeds', async () => {
      // Mock global.fetch with valid Groq response
      global.fetch = jest.fn().mockImplementation(() => mockGroqSuccess());

      const res = await request(app)
        .post(`/api/v1/trips/${testTrip._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const trip = res.body.trip;

      expect(trip.status).toBe('completed');
      expect(Array.isArray(trip.days)).toBe(true);
      expect(trip.days.length).toBeGreaterThan(0);
      expect(trip.days[0]).toHaveProperty('day');
      expect(trip.days[0]).toHaveProperty('events');

      expect(trip).toHaveProperty('recommendedHotels');
      expect(trip).toHaveProperty('transitOptions');
      expect(trip).toHaveProperty('budgetBreakdown');
      expect(trip).toHaveProperty('estimatedCost');
      expect(trip).toHaveProperty('mustVisitPlaces');
      expect(trip).toHaveProperty('emergencyInformation');
    });

    it('should use fallback generator when Groq returns 500 error', async () => {
      // Mock Groq returning server error
      global.fetch = jest.fn().mockImplementation(() => mockGroqFailure(500, 'Groq Internal Error'));

      const res = await request(app)
        .post(`/api/v1/trips/${testTrip._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const trip = res.body.trip;

      // Status should still complete because fallback succeeded
      expect(trip.status).toBe('completed');
      expect(Array.isArray(trip.days)).toBe(true);
      expect(trip.days.length).toBeGreaterThan(0);
      expect(trip.estimatedCost).toBeDefined();
      expect(Array.isArray(trip.recommendedHotels)).toBe(true);
    });

    it('should use fallback generator when Groq times out or network throws exception', async () => {
      // Mock network exception (timeout, DNS failure, ECONNRESET)
      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('The operation was aborted due to timeout'));
      });

      const res = await request(app)
        .post(`/api/v1/trips/${testTrip._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trip.status).toBe('completed');
      expect(res.body.trip.days.length).toBeGreaterThan(0);
    });

    it('should use fallback generator when Groq returns malformed non-JSON text', async () => {
      global.fetch = jest.fn().mockImplementation(() => mockGroqMalformed());

      const res = await request(app)
        .post(`/api/v1/trips/${testTrip._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.trip.status).toBe('completed');
      expect(res.body.trip.days.length).toBeGreaterThan(0);
    });

    it('should return already completed itinerary immediately without calling Groq again', async () => {
      // Mark trip as completed
      testTrip.status = 'completed';
      testTrip.days = [{ day: 1, title: 'Already Done', events: [] }];
      await testTrip.save();

      const fetchSpy = jest.fn();
      global.fetch = fetchSpy;

      const res = await request(app)
        .post(`/api/v1/trips/${testTrip._id}/generate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.trip.days[0].title).toBe('Already Done');
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should return 403 when trying to generate itinerary for another user\'s trip', async () => {
      // Create a second user
      await request(app).post('/api/v1/auth/register').send({
        name: 'Traveler Two',
        email: 'traveler2@example.com',
        password: 'password123',
      });
      const login2 = await request(app).post('/api/v1/auth/login').send({
        email: 'traveler2@example.com',
        password: 'password123',
      });
      const tokenUser2 = login2.body.accessToken;

      const res = await request(app)
        .post(`/api/v1/trips/${testTrip._id}/generate`)
        .set('Authorization', `Bearer ${tokenUser2}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Not authorized');
    });

    it('should return 404 for a non-existent trip id', async () => {
      const nonExistentId = '60d0fe4f5311236168a109ca';

      const res = await request(app)
        .post(`/api/v1/trips/${nonExistentId}/generate`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Trip not found');
    });
  });

  describe('Fallback Generator Direct Verification', () => {
    it('should generate valid trip payload structure for any input', () => {
      const sampleTrip = {
        fromLocation: 'Mumbai',
        destination: 'Manali',
        startDate: '2026-11-10',
        endDate: '2026-11-13',
        people: '2 Travelers',
        budget: 'Budget',
        travelStyle: ['Adventure'],
        food: 'veg',
        transport: ['Bus'],
      };

      const fallback = generateFallbackTrip(sampleTrip);
      expect(fallback).toBeDefined();
      expect(fallback.days.length).toBe(4);
      expect(Array.isArray(fallback.hotels)).toBe(true);
      expect(Array.isArray(fallback.restaurants)).toBe(true);
      expect(fallback.emergencyInformation).toBeDefined();
      expect(fallback.budgetBreakdown).toBeDefined();
    });
  });
});
