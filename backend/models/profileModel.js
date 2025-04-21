const { pool } = require('../config/database');

const profileQueries = {
    // Check if a profile exists by email
    getProfileByEmail: async (email) => {
        try {
            const result = await pool.query('SELECT * FROM PROFILES WHERE email = $1', [email]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error finding profile by email:', err);
            throw err;
        }
    },

    // Create a new profile
    createProfile: async (username, passwordHash, email, firstName = null, lastName = null, profilePic = null, isAdmin = false) => {
        try {
            const result = await pool.query(
                'INSERT INTO PROFILES (username, password_hash, email, first_name, last_name, profile_pic, is_admin) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING username, email, first_name, last_name, is_admin',
                [username, passwordHash, email, firstName, lastName, profilePic, isAdmin]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error creating profile:', err);
            throw err;
        }
    },

    // Get profile by username - Include password_hash for login authentication
    getProfileByUsername: async (username, includePassword = false) => {
        try {
            let query;
            if (includePassword) {
                // Include password_hash for authentication
                query = 'SELECT username, email, password_hash, first_name, last_name, profile_pic, is_admin, created_at FROM PROFILES WHERE username = $1';
            } else {
                // Exclude password_hash for general profile access
                query = 'SELECT username, email, first_name, last_name, profile_pic, is_admin, created_at FROM PROFILES WHERE username = $1';
            }
            
            const result = await pool.query(query, [username]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error finding profile by username:', err);
            throw err;
        }
    },

    // Get all profiles (for admin)
    getAllProfiles: async () => {
        try {
            const result = await pool.query('SELECT username, email, first_name, last_name, is_admin, created_at FROM PROFILES');
            return result.rows;
        } catch (err) {
            console.error('Error getting all profiles:', err);
            throw err;
        }
    },

    // Update a user's password
    updatePassword: async (email, passwordHash) => {
        try {
            const result = await pool.query(
                'UPDATE PROFILES SET password_hash = $1 WHERE email = $2 RETURNING username, email',
                [passwordHash, email]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error updating password:', err);
            throw err;
        }
    }
};

module.exports = profileQueries;