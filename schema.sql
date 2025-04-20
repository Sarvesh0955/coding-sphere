-- Database schema for the application

-- Create PROFILES table if it doesn't exist
CREATE TABLE IF NOT EXISTS PROFILES (
    username VARCHAR PRIMARY KEY,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_pic VARCHAR,
    email VARCHAR UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create any additional tables below as needed