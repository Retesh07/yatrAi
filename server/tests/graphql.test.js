const request = require('supertest');
const app = require('../server');
const Trip = require('../models/Trip');
const User = require('../models/User');
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
});

