const { pool } = require('../config/database');

const profileQueries = {
    getProfileByEmail: async (email) => {
        try {
            const result = await pool.query('SELECT * FROM PROFILES WHERE email = $1', [email]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error finding profile by email:', err);
            throw err;
        }
    },

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

    //both general and protected access
    getProfileByUsername: async (username, includePassword = false) => {
        try {
            let query;
            if (includePassword) {
                query = 'SELECT username, email, password_hash, first_name, last_name, profile_pic, is_admin, created_at FROM PROFILES WHERE username = $1';
            } else {
                query = 'SELECT username, email, first_name, last_name, profile_pic, is_admin, created_at FROM PROFILES WHERE username = $1';
            }
            
            const result = await pool.query(query, [username]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error finding profile by username:', err);
            throw err;
        }
    },

    getAllProfiles: async () => {
        try {
            const result = await pool.query('SELECT username, email, first_name, last_name, is_admin, created_at FROM PROFILES');
            return result.rows;
        } catch (err) {
            console.error('Error getting all profiles:', err);
            throw err;
        }
    },

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
    },
    
    deleteUser: async (username) => {
        try {
            const result = await pool.query(
                'DELETE FROM PROFILES WHERE username = $1 RETURNING username',
                [username]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error deleting user:', err);
            throw err;
        }
    },

    getUserAccounts: async (username) => {
        try {
            const result = await pool.query(
                `SELECT ua.*, p.platform_name 
                FROM USER_ACCOUNTS ua 
                JOIN PLATFORM p ON ua.platform_id = p.platform_id 
                WHERE ua.username = $1`,
                [username]
            );
            return result.rows;
        } catch (err) {
            console.error('Error getting user accounts:', err);
            throw err;
        }
    },

    getUserAccountByPlatform: async (username, platformId) => {
        try {
            const result = await pool.query(
                'SELECT * FROM USER_ACCOUNTS WHERE username = $1 AND platform_id = $2',
                [username, platformId]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error getting user account by platform:', err);
            throw err;
        }
    },

    addUserAccount: async (username, platformId, platformUsername, profileUrl = null) => {
        try {
            const result = await pool.query(
                'INSERT INTO USER_ACCOUNTS (username, platform_id, platform_username, profile_url) VALUES ($1, $2, $3, $4) RETURNING *',
                [username, platformId, platformUsername, profileUrl]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error adding user account:', err);
            throw err;
        }
    },

    updateUserAccount: async (username, platformId, platformUsername, profileUrl = null) => {
        try {
            const result = await pool.query(
                'UPDATE USER_ACCOUNTS SET platform_username = $1, profile_url = $2 WHERE username = $3 AND platform_id = $4 RETURNING *',
                [platformUsername, profileUrl, username, platformId]
            );
            return result.rows[0];
        } catch (err) {
            console.error('Error updating user account:', err);
            throw err;
        }
    },

    deleteUserAccount: async (username, platformId) => {
        try {
            await pool.query(
                'DELETE FROM USER_ACCOUNTS WHERE username = $1 AND platform_id = $2',
                [username, platformId]
            );
            return true;
        } catch (err) {
            console.error('Error deleting user account:', err);
            throw err;
        }
    }
};

module.exports = profileQueries;