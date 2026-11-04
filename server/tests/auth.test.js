const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const { connect, closeDatabase, clearDatabase } = require('./setup/db');

describe('Auth Endpoints & Token Security', () => {
  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  const validUserData = {
    name: 'Retesh Sharma',
    email: 'retesh@example.com',
    password: 'password123',
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully with 201 status', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Account created successfully');

      const user = await User.findOne({ email: validUserData.email });
      expect(user).not.toBeNull();
      expect(user.name).toBe(validUserData.name);
      expect(user.password).not.toBe(validUserData.password); // must be hashed
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: validUserData.email, password: validUserData.password });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Please provide name, email and password');
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: validUserData.name, password: validUserData.password });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: validUserData.name, email: validUserData.email });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration if email is already registered', async () => {
      await request(app).post('/api/v1/auth/register').send(validUserData);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validUserData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Email already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUserData);
    });

    it('should login successfully and return access token and set httpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user).toMatchObject({
        name: validUserData.name,
        email: validUserData.email,
      });

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('refreshToken='))).toBe(true);
      expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);

      // Verify token decoded id matches user
      const decoded = jwt.verify(res.body.accessToken, process.env.JWT_SECRET);
      expect(decoded.id).toBe(res.body.user.id);
    });

    it('should reject login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should reject login with non-existent email (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'unknown@example.com',
          password: validUserData.password,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/v1/auth/refresh (Token Rotation)', () => {
    let refreshTokenCookie;
    let userId;

    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUserData);
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
        });

      userId = loginRes.body.user.id;
      const cookies = loginRes.headers['set-cookie'];
      refreshTokenCookie = cookies.find((c) => c.startsWith('refreshToken='));
    });

    it('should rotate tokens and return a new access token when valid cookie is present', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshTokenCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();

      // Check rotated cookie
      const newCookies = res.headers['set-cookie'];
      expect(newCookies).toBeDefined();
      const newCookie = newCookies.find((c) => c.startsWith('refreshToken='));
      expect(newCookie).toBeDefined();

      // Verify rotated token saved in DB
      const user = await User.findById(userId);
      const newRefreshToken = newCookie.split(';')[0].replace('refreshToken=', '');
      expect(user.refreshToken).toBe(newRefreshToken);
    });

    it('should return 401 when no refresh token cookie is sent', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('No refresh token');
    });

    it('should return 401 when refresh token is malformed/invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['refreshToken=invalid.token.payload; Path=/']);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Refresh token expired or invalid');
    });

    it('should return 401 when refresh token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${expiredToken}; Path=/`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Refresh token expired or invalid');
    });

    it('should return 401 if refresh token does not match stored DB token (token reuse/revocation)', async () => {
      // Simulate token rotation or logout by changing the stored token in DB
      await User.findByIdAndUpdate(userId, { refreshToken: 'other-token' });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshTokenCookie]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid or reused refresh token');
    });
  });

  describe('Protected Routes & Authorization Middleware', () => {
    let validAccessToken;
    let registeredUser;

    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validUserData);
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
        });

      validAccessToken = loginRes.body.accessToken;
      registeredUser = loginRes.body.user;
    });

    it('should return 401 if protected route is accessed without any token', async () => {
      const res = await request(app).get('/api/v1/protected');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, no token');
    });

    it('should return 401 if Authorization header lacks Bearer prefix', async () => {
      const res = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', validAccessToken);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, no token');
    });

    it('should return 401 if token is invalid or malformed', async () => {
      const res = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', 'Bearer invalid.token.signature');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, token failed');
    });

    it('should return 401 if token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: registeredUser.id },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, token failed');
    });

    it('should return 401 if token is signed with a different secret', async () => {
      const bogusToken = jwt.sign(
        { id: registeredUser.id },
        'wrong-secret-key-12345',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', `Bearer ${bogusToken}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Not authorized, token failed');
    });

    it('should return 200 and authorized user greeting with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/protected')
        .set('Authorization', `Bearer ${validAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(`Hello ${registeredUser.name}, you are authorized!`);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout, clear refreshToken in DB and clear cookie', async () => {
      await request(app).post('/api/v1/auth/register').send(validUserData);
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password,
        });

      const token = loginRes.body.accessToken;

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
      expect(logoutRes.body.message).toBe('Logged out successfully');

      const user = await User.findOne({ email: validUserData.email });
      expect(user.refreshToken).toBeNull();
    });
  });
});
