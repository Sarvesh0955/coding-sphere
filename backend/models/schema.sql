-- PROFILES table 
CREATE TABLE IF NOT EXISTS PROFILES (
    username VARCHAR PRIMARY KEY,
    password_hash VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_pic VARCHAR,
    email VARCHAR UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PLATFORM Table
CREATE TABLE IF NOT EXISTS PLATFORM (
    platform_id SERIAL PRIMARY KEY,
    platform_name VARCHAR UNIQUE NOT NULL
);

-- TOPICS Table
CREATE TABLE IF NOT EXISTS TOPICS (
    topic_id SERIAL PRIMARY KEY,
    topic_name VARCHAR UNIQUE NOT NULL
);

-- USER_ACCOUNTS Table
CREATE TABLE IF NOT EXISTS USER_ACCOUNTS (
    username VARCHAR REFERENCES PROFILES(username) ON DELETE CASCADE,
    platform_id INT REFERENCES PLATFORM(platform_id) ON DELETE CASCADE,
    platform_username VARCHAR NOT NULL,
    profile_url VARCHAR,
    PRIMARY KEY (username, platform_id)
);

-- QUESTION Table
CREATE TABLE IF NOT EXISTS QUESTION (
    platform_id INT REFERENCES PLATFORM(platform_id) ON DELETE CASCADE,
    question_id VARCHAR NOT NULL,
    title VARCHAR,
    link TEXT,
    topics TEXT[], -- Keep the array for backward compatibility
    difficulty VARCHAR CHECK (difficulty IN ('EASY','MEDIUM', 'HARD')),
    PRIMARY KEY (platform_id, question_id)
);

-- COMPANY Table
CREATE TABLE IF NOT EXISTS COMPANY (
    company_id SERIAL PRIMARY KEY,
    company_name VARCHAR UNIQUE
);

-- QUESTION_COMPANY Table
CREATE TABLE IF NOT EXISTS QUESTION_COMPANY (
    platform_id INT,
    question_id VARCHAR,
    company_id INT,
    PRIMARY KEY (platform_id, question_id, company_id),
    FOREIGN KEY (platform_id, question_id) REFERENCES QUESTION(platform_id, question_id),
    FOREIGN KEY (company_id) REFERENCES COMPANY(company_id)
);

-- QUESTION_TOPIC Table
CREATE TABLE IF NOT EXISTS QUESTION_TOPIC (
    platform_id INT,
    question_id VARCHAR,
    topic_id INT REFERENCES TOPICS(topic_id) ON DELETE CASCADE,
    PRIMARY KEY (platform_id, question_id, topic_id),
    FOREIGN KEY (platform_id, question_id) REFERENCES QUESTION(platform_id, question_id)
);

-- SOLVED Table
CREATE TABLE IF NOT EXISTS SOLVED (
    username VARCHAR REFERENCES PROFILES(username) ON DELETE CASCADE,
    platform_id INT,
    question_id VARCHAR,
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (username, platform_id, question_id),
    FOREIGN KEY (platform_id, question_id) REFERENCES QUESTION(platform_id, question_id) ON DELETE CASCADE
);

-- FRIENDS Table
CREATE TABLE IF NOT EXISTS FRIENDS (
    username VARCHAR REFERENCES PROFILES(username) ON DELETE CASCADE,
    friend_username VARCHAR REFERENCES PROFILES(username) ON DELETE CASCADE,
    PRIMARY KEY (username, friend_username)
);

-- DUEL_HISTORY Table
CREATE TABLE IF NOT EXISTS DUEL_HISTORY (
    duel_id SERIAL PRIMARY KEY,
    platform_id INT REFERENCES PLATFORM(platform_id) ON DELETE CASCADE,
    question_id VARCHAR,
    host_username VARCHAR REFERENCES PROFILES(username) ON DELETE SET NULL,
    challenged_username VARCHAR REFERENCES PROFILES(username) ON DELETE SET NULL,
    date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    winner_is_host BOOLEAN,
    winner_username VARCHAR REFERENCES PROFILES(username),
    FOREIGN KEY (platform_id, question_id) REFERENCES QUESTION(platform_id, question_id) ON DELETE CASCADE
);

-- DYNAMIC_PROBLEMS Table
CREATE TABLE IF NOT EXISTS DYNAMIC_PROBLEMS (
    username VARCHAR REFERENCES PROFILES(username) ON DELETE CASCADE,
    platform_id INT,
    question_id VARCHAR,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (username, platform_id, question_id),
    FOREIGN KEY (platform_id, question_id) REFERENCES QUESTION(platform_id, question_id)
);