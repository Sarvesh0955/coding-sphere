const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool, testConnection } = require('./config/database');
const { initDatabase: initSchema } = require('./config/schema');
const profileModel = require('./models/profileModel');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001', // Your React frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Create admin user if not exists
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    
    // Check if admin already exists
    const existingAdmin = await profileModel.getProfileByEmail(adminEmail);
    
    if (!existingAdmin) {
      console.log('Admin user does not exist. Creating admin user...');
      
      // Hash the admin password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
      
      // Create admin user
      await profileModel.createProfile(
        adminUsername,
        hashedPassword,
        adminEmail,
        'Admin',
        'User',
        null, // profile_pic
        true // isAdmin
      );
      
      console.log(`Admin user created successfully with email: ${adminEmail} and username: ${adminUsername}`);
    } else {
      console.log('Admin user already exists');
    }
  } catch (err) {
    console.error('Error creating admin user:', err);
  }
};

// Initialize database with schema
const setupDatabase = async () => {
  await initSchema();
  testConnection();
  await createAdminUser();
};

// Run database setup
setupDatabase();

// Base route
app.get('/', (req, res) => {
    res.send('Hello, World! API is running.');
});

// Routes
app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // For testing purposes