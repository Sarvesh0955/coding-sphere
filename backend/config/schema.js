const fs = require('fs');
const path = require('path');
const { pool } = require('./database');
const bcrypt = require('bcrypt');

const initDatabase = async () => {
    try {
        const client = await pool.connect();
        
        const schemaPath = path.join(__dirname, '..', 'models', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        await client.query(schemaSql);
        
        console.log('Database initialized successfully');
        client.release();
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};

const initDatabasefunc = async () => {
  try {
      const client = await pool.connect();
      
      const schemaPath = path.join(__dirname, '..', 'models', 'function.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      await client.query(schemaSql);

      console.log('Database functions initialized successfully');
      client.release();
  } catch (err) {
      console.error('Error initializing database triggers:', err);
  }
};

const initSeedData = async () => {
    try {
        const client = await pool.connect();
        
        const seedPath = path.join(__dirname, '..', 'models', 'seed_data.sql');
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        
        await client.query(seedSql);
        
        console.log('Seed data initialized successfully');
        client.release();
    } catch (err) {
        console.error('Error initializing seed data:', err);
    }
};

const ensureAdminExists = async () => {
  try {
    console.log('Checking for admin user...');
    
    const result = await pool.query('SELECT * FROM PROFILES WHERE username = $1', ['admin']);
    const adminExists = result.rows.length > 0;
    
    if (!adminExists) {
      console.log('Admin user not found. Creating admin user...');
      
      const saltRounds = 10;
      const adminPassword = 'adminpassword';
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
      
      await pool.query(
        'INSERT INTO PROFILES (username, password_hash, email, is_admin) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'admin@example.com', true]
      );
      
      console.log('Admin user created successfully:');
    } 

    console.log('Username: admin');
    console.log('Password: adminpassword');
  } catch (err) {
    console.error('Error ensuring admin user exists:', err);
  }
};

const init = async () => {
    await initDatabase();
    await initDatabasefunc();
    await initDatabaseTriggers();
    await initSeedData();
    await ensureAdminExists();
};

module.exports = {
    initDatabase,
    initDatabasefunc,
    initDatabaseTriggers,
    initSeedData,
    ensureAdminExists,
    init
};