const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// PostgreSQL connection configuration
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Test database connection
const testConnection = () => {
    pool.connect((err, client, done) => {
        if (err) {
            console.error('Error connecting to PostgreSQL database:', err);
        } else {
            console.log('Connected to PostgreSQL database');
            done();
        }
    });
};

module.exports = {
    pool,
    testConnection
};