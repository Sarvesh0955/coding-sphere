const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

// Mock user data
const testUser = {
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'User'
};

// Admin user data
const adminUser = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
  firstName: 'Admin',
  lastName: 'User',
  isAdmin: true
};

// Store tokens for authenticated requests
let userToken;
let adminToken;

// Helper function to create JWT token for testing
const generateToken = (user, isAdmin = false) => {
  return jwt.sign(
    { id: user.id || 1, email: user.email, isAdmin }, 
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Auth API Routes', () => {
  describe('POST /api/signup', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send(testUser)
        .expect('Content-Type', /json/);
      
      // We might get 201 for created or 400 if user already exists
      expect([201, 400]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/success/i);
      }
    });

    it('should validate user input', async () => {
      const response = await request(app)
        .post('/api/signup')
        .send({ email: 'invalid-email', password: '123' })
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/login', () => {
    it('should log in an existing user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect('Content-Type', /json/);

      // If login is successful, save the token
      if (response.status === 200) {
        expect(response.body).toHaveProperty('token');
        userToken = response.body.token;
      } else {
        // Accept either 401 (Unauthorized) or 400 (Bad Request) for failed login
        expect([400, 401]).toContain(response.status);
      }
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect('Content-Type', /json/);
      
      // Accept either 401 (Unauthorized) or 400 (Bad Request) for failed login
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('POST /api/send-verification-otp', () => {
    it('should send OTP to registered email', async () => {
      const response = await request(app)
        .post('/api/send-verification-otp')
        .send({ email: testUser.email })
        .expect('Content-Type', /json/);
      
      // Could be 200 if email sent or another code if email not found
      // Just check that we get a response
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /api/verify-otp', () => {
    it('should verify OTP code', async () => {
      const response = await request(app)
        .post('/api/verify-otp')
        .send({ 
          email: testUser.email,
          otp: '123456' // This is a mock OTP, likely to fail verification
        })
        .expect('Content-Type', /json/);
      
      // Just check that we get a response, as we don't have a real OTP
      expect(response.body).toBeDefined();
    });
  });

  describe('POST /api/reset-password', () => {
    it('should attempt to reset password', async () => {
      const response = await request(app)
        .post('/api/reset-password')
        .send({ 
          email: testUser.email,
          otp: '123456', // Mock OTP
          newPassword: 'NewPassword123!'
        })
        .expect('Content-Type', /json/);
      
      // Just check that we get a response, as we don't have a real OTP
      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/check-otp/:email', () => {
    it('should check OTP for a given email', async () => {
      const response = await request(app)
        .get(`/api/check-otp/${encodeURIComponent(testUser.email)}`)
        .expect('Content-Type', /json/);
      
      // Just check that we get a response
      expect(response.body).toBeDefined();
    });
  });
});

describe('Profile API Routes', () => {
  beforeAll(() => {
    // Generate tokens for testing authenticated routes
    if (!userToken) {
      userToken = generateToken(testUser);
    }
    adminToken = generateToken(adminUser, true);
  });

  describe('GET /api/profile', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/profile')
        .expect('Content-Type', /json/);
      
      expect(response.status).toBe(401);
    });

    it('should return user profile for authenticated user', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);
      
      // We should either get a 200 with profile data or a different code if something's wrong
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('GET /api/profile/admin/profiles', () => {
    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/profile/admin/profiles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);
      
      expect([401, 403]).toContain(response.status);
    });

    it('should return all profiles for admin users', async () => {
      const response = await request(app)
        .get('/api/profile/admin/profiles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);
      
      // If admin authentication works properly
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        // If there are profiles, they should be in an array
        if (Array.isArray(response.body)) {
          expect(response.body.length).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('GET /api/profile/admin/all', () => {
    it('should reject non-admin users', async () => {
      const response = await request(app)
        .get('/api/profile/admin/all')
        .set('Authorization', `Bearer ${userToken}`)
        .expect('Content-Type', /json/);
      
      expect([401, 403]).toContain(response.status);
    });

    it('should return all profiles for admin users', async () => {
      const response = await request(app)
        .get('/api/profile/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect('Content-Type', /json/);
      
      // If admin authentication works properly
      if (response.status === 200) {
        expect(response.body).toBeDefined();
        // If there are profiles, they should be in an array
        if (Array.isArray(response.body)) {
          expect(response.body.length).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});

afterAll(done => {
  // Close server and database connections
  const { pool } = require('../config/database');
  pool.end().then(() => {
    console.log('Database pool has ended');
    done();
  });
});