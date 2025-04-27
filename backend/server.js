const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { pool, testConnection } = require('./config/database');
const { initDatabase: initSchema } = require('./config/schema');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const questionRoutes = require('./routes/questionRoutes');

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

// Initialize seed data
const initSeedData = async () => {
  try {
    console.log('Initializing seed data...');
    // Read the seed data SQL file
    const seedDataPath = path.join(__dirname, 'models', 'seed_data.sql');
    const seedDataSql = fs.readFileSync(seedDataPath, 'utf8');
    
    // Execute the SQL to insert seed data
    const client = await pool.connect();
    await client.query(seedDataSql);
    client.release();
    
    console.log('Seed data initialized successfully');

    console.log("Username: admin");
    console.log("Password: adminpassword");
  } catch (err) {
    console.error('Error initializing seed data:', err);
  }
};

// Initialize database with schema
const setupDatabase = async () => {
  await initSchema();
  testConnection();
  await initSeedData(); // Add seed data initialization (includes admin user creation)
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
app.use('/api/questions', questionRoutes);

// Start the server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // For testing purposes