const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

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

const createTrigger = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
        DROP TRIGGER IF EXISTS before_password_update ON PROFILES;
        DROP FUNCTION IF EXISTS check_password_update();
    `);

    await client.query(`
      CREATE OR REPLACE FUNCTION check_password_update()
    RETURNS TRIGGER AS $$
    BEGIN
        -- Use IS NOT DISTINCT FROM for better NULL handling
        IF NEW.password_hash IS NOT DISTINCT FROM OLD.password_hash THEN
            RAISE EXCEPTION 'New password cannot be the same as the old password';
        END IF;
        
        -- Additional validation
        IF NEW.password_hash IS NULL OR NEW.password_hash = '' THEN
            RAISE EXCEPTION 'Password hash cannot be empty';
        END IF;
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `);
    await client.query(`
        CREATE TRIGGER before_password_update
        BEFORE UPDATE OF password_hash ON PROFILES
        FOR EACH ROW
        EXECUTE FUNCTION check_password_update();
    `);

    console.log("Trigger created successfully.");
  } catch (err) {
    console.error("Error creating trigger:", err);
  } finally {
    client.release();
  }
};

module.exports = {
    pool,
    testConnection,
    createTrigger
};