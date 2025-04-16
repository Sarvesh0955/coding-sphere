const { Pool } = require('pg');
const dotenv = require('dotenv');

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

// Initialize database and create users table
const initDatabase = async () => {
    try {
        const client = await pool.connect();
        
        // Create users table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(100) NOT NULL,
                isadmin BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Database initialized successfully');
        client.release();
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

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

// User queries
const userQueries = {
    // Check if a user exists by email
    getUserByEmail: async (email) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error finding user by email:', err);
            throw err;
        }
    },

    // Create a new user
    createUser: async (name, email, hashedPassword, isAdmin = false) => {
        try {
            const result = await pool.query(
                'INSERT INTO users (name, email, password, isadmin) VALUES ($1, $2, $3, $4) RETURNING id, name, email, isadmin',
                [name, email, hashedPassword, isAdmin]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error creating user:', err);
            throw err;
        }
    },

    // Get user by ID
    getUserById: async (userId) => {
        try {
            const result = await pool.query('SELECT id, name, email, isadmin, created_at FROM users WHERE id = $1', [userId]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error finding user by ID:', err);
            throw err;
        }
    },

    // Get all users (for admin)
    getAllUsers: async () => {
        try {
            const result = await pool.query('SELECT id, name, email, isadmin, created_at FROM users');
            return result.rows;
        } catch (err) {
            console.error('Error getting all users:', err);
            throw err;
        }
    }
};

module.exports = {
    pool,
    initDatabase,
    testConnection,
    userQueries
};