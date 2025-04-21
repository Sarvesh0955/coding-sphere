const fs = require('fs');
const path = require('path');
const { pool } = require('./database');

// Initialize database by running schema.sql
const initDatabase = async () => {
    try {
        const client = await pool.connect();
        
        // Read schema file
        const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema SQL
        await client.query(schemaSql);
        
        console.log('Database initialized successfully');
        client.release();
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

module.exports = {
    initDatabase
};