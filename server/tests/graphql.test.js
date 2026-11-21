const request = require('supertest');
const app = require('../server');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { initGraphQL } = require('../graphql');
const { connect, closeDatabase, clearDatabase } = require('./setup/db');

describe('Apollo GraphQL Endpoint (/graphql)', () => {
  let authToken;
  let user;

  beforeAll(async () => {
    await connect();
    await initGraphQL(app);
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();

    await request(app).post('/api/v1/auth/register').send({
      name: 'GraphQL Tester',
      email: 'graphql@example.com',
      password: 'password123',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'graphql@example.com',
      password: 'password123',
    });

    authToken = loginRes.body.accessToken;
    user = await User.findOne({ email: 'graphql@example.com' });
  });

  it('Query { health } should return Apollo GraphQL operational message', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            health
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.health).toContain('Apollo GraphQL API is operational');
  });

  it('Query { publicTrips } should fetch only public trips with requested fields', async () => {
    await Trip.create({
      user: user._id,
      destination: 'Public Jaipur Trip',
      startDate: '2026-12-01',
      endDate: '2026-12-04',
      isPublic: true,
      budget: 'Standard',
    });

    await Trip.create({
      user: user._id,
      destination: 'Private Jaipur Trip',
      startDate: '2026-12-01',
      endDate: '2026-12-04',
      isPublic: false,
    });

    const res = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            publicTrips {
              id
              destination
              startDate
              endDate
              isPublic
              budget
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.publicTrips).toHaveLength(1);
    expect(res.body.data.publicTrips[0].destination).toBe('Public Jaipur Trip');
    expect(res.body.data.publicTrips[0].isPublic).toBe(true);
  });

  it('Query { trip(id) } should fetch a single trip by ID', async () => {
    const created = await Trip.create({
      user: user._id,
      destination: 'Agra Day Trip',
      startDate: '2026-11-20',
      endDate: '2026-11-21',
      isPublic: true,
    });

    const res = await request(app)
      .post('/graphql')
      .send({
        query: `
          query GetTrip($id: ID!) {
            trip(id: $id) {
              id
              destination
              startDate
            }
          }
        `,
        variables: { id: created._id.toString() },
      });

    expect(res.status).toBe(200);
    expect(res.body.data.trip).toBeDefined();
    expect(res.body.data.trip.destination).toBe('Agra Day Trip');
  });

  it('Query { myTrips } should return error when unauthenticated, and user trips when Bearer token is provided', async () => {
    await Trip.create({
      user: user._id,
      destination: 'My Personal Trip',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
    });

    // 1. Unauthenticated query
    const unauthRes = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            myTrips {
              id
              destination
            }
          }
        `,
      });

    expect(unauthRes.status).toBe(200);
    expect(unauthRes.body.errors).toBeDefined();
    expect(unauthRes.body.errors[0].message).toContain('Not authorized');

    // 2. Authenticated query with Bearer token
    const authRes = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          query {
            myTrips {
              id
              destination
            }
          }
        `,
      });

    expect(authRes.status).toBe(200);
    expect(authRes.body.data.myTrips).toHaveLength(1);
    expect(authRes.body.data.myTrips[0].destination).toBe('My Personal Trip');
  });

  it('Query { dashboard } should return composite user profile, unread notification count, and trips in a single query', async () => {
    // Seed 1 completed trip, 1 draft trip
    await Trip.create({
      user: user._id,
      destination: 'Goa Beach Vacation',
      startDate: '2026-11-25',
      endDate: '2026-11-28',
      budget: 'Luxury',
      status: 'completed',
    });
    await Trip.create({
      user: user._id,
      destination: 'Manali Trek',
      startDate: '2026-12-10',
      endDate: '2026-12-15',
      budget: 'Backpacker',
      status: 'draft',
    });

    // Seed 2 notifications (1 unread, 1 read)
    await Notification.create({
      user: user._id,
      title: 'Trip Shared',
      message: 'Someone shared a trip with you',
      read: false,
    });
    await Notification.create({
      user: user._id,
      title: 'Welcome',
      message: 'Welcome to YatrAI',
      read: true,
    });

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          query GetDashboard {
            dashboard {
              user {
                name
                email
              }
              unreadNotificationCount
              stats {
                totalTrips
                completedTrips
                draftTrips
              }
              trips {
                id
                destination
                status
                budget
              }
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    const data = res.body.data.dashboard;
    expect(data.user.name).toBe('GraphQL Tester');
    expect(data.unreadNotificationCount).toBe(1);
    expect(data.stats.totalTrips).toBe(2);
    expect(data.stats.completedTrips).toBe(1);
    expect(data.stats.draftTrips).toBe(1);
    expect(data.trips).toHaveLength(2);
  });
});

