const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { pool, testConnection} = require('./config/database');
const { initDatabase: initSchema, initSeedData: initSeed, ensureAdminExists,initDatabasefunc } = require('./config/schema');
const { pool, testConnection } = require('./config/database');
const { init } = require('./config/schema');

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

// Initialize database with schema
const setupDatabase = async () => {
  await initSchema();
  testConnection();
  await initSeed(); 
  await initDatabasefunc();
  await ensureAdminExists(); 
  await init();
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