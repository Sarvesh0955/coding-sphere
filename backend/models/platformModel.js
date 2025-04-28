const { pool } = require('../config/database');

const platformQueries = {
    getAllPlatforms: async () => {
        try {
            const result = await pool.query('SELECT * FROM PLATFORM ORDER BY platform_name');
            return result.rows;
        } catch (err) {
            console.error('Error getting all platforms:', err);
            throw err;
        }
    },
    
    getPlatformById: async (platformId) => {
        try {
            const result = await pool.query('SELECT * FROM PLATFORM WHERE platform_id = $1', [platformId]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error getting platform by id:', err);
            throw err;
        }
    },

    getPlatformByName: async (platformName) => {
        try {
            const result = await pool.query('SELECT * FROM PLATFORM WHERE platform_name = $1', [platformName]);
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error getting platform by name:', err);
            throw err;
        }
    },

    createPlatform: async (platformName) => {
        try {
            const existingPlatform = await pool.query(
                'SELECT * FROM PLATFORM WHERE platform_name = $1',
                [platformName]
            );
            
            if (existingPlatform.rows.length > 0) {
                return { 
                    exists: true,
                    platform: existingPlatform.rows[0]
                };
            }
            
            const result = await pool.query(
                'INSERT INTO PLATFORM (platform_name) VALUES ($1) RETURNING *',
                [platformName]
            );
            
            return { 
                exists: false,
                platform: result.rows[0]
            };
        } catch (err) {
            console.error('Error creating platform:', err);
            throw err;
        }
    },

    updatePlatform: async (platformId, platformName) => {
        try {
            const result = await pool.query(
                'UPDATE PLATFORM SET platform_name = $1 WHERE platform_id = $2 RETURNING *',
                [platformName, platformId]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error updating platform:', err);
            throw err;
        }
    },

    deletePlatform: async (platformId) => {
        try {
            const result = await pool.query(
                'DELETE FROM PLATFORM WHERE platform_id = $1 RETURNING *',
                [platformId]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error deleting platform:', err);
            throw err;
        }
    }
};

module.exports = platformQueries;