-- seed_data.sql - Default data insertion
-- This script inserts default data if it doesn't already exist

-- Set client encoding to UTF8
SET client_encoding = 'UTF8';

-- Insert admin user if not exists
DO $$
BEGIN
    -- Checking if admin user exists
    IF NOT EXISTS (SELECT 1 FROM PROFILES WHERE username = 'admin') THEN
        -- Insert admin with bcrypt hashed password ('adminpassword')
        -- In production, you would use environment variables for these values
        INSERT INTO PROFILES (username, password_hash, email, first_name, last_name, is_admin) 
        VALUES ('admin', '$2b$10$rOQIrM7WjE6qhtNLAHbWMeQojtMU.wRHCZ6NJVvS070vCGY92HRMS', 'admin@example.com', 'Admin', 'User', true);
        
        RAISE NOTICE 'Admin user created successfully';
    ELSE
        RAISE NOTICE 'Admin user already exists, skipping insertion';
    END IF;
END;
$$;

-- Insert platform data if not exists
DO $$
BEGIN
    -- Insert Codeforces (ID: 1)
    IF NOT EXISTS (SELECT 1 FROM PLATFORM WHERE platform_name = 'Codeforces') THEN
        INSERT INTO PLATFORM (platform_id, platform_name) 
        VALUES (1, 'Codeforces');
        RAISE NOTICE 'Codeforces platform added successfully';
    ELSE
        RAISE NOTICE 'Codeforces platform already exists, skipping insertion';
    END IF;

    -- Insert LeetCode (ID: 2)
    IF NOT EXISTS (SELECT 1 FROM PLATFORM WHERE platform_name = 'LeetCode') THEN
        INSERT INTO PLATFORM (platform_id, platform_name) 
        VALUES (2, 'LeetCode');
        RAISE NOTICE 'LeetCode platform added successfully';
    ELSE
        RAISE NOTICE 'LeetCode platform already exists, skipping insertion';
    END IF;
END;
$$;

-- Insert sample companies (if not exists)
DO $$
BEGIN
    -- Popular tech companies
    IF NOT EXISTS (SELECT 1 FROM COMPANY WHERE company_name = 'Google') THEN
        INSERT INTO COMPANY (company_name) VALUES ('Google');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM COMPANY WHERE company_name = 'Microsoft') THEN
        INSERT INTO COMPANY (company_name) VALUES ('Microsoft');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM COMPANY WHERE company_name = 'Amazon') THEN
        INSERT INTO COMPANY (company_name) VALUES ('Amazon');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM COMPANY WHERE company_name = 'Facebook') THEN
        INSERT INTO COMPANY (company_name) VALUES ('Facebook');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM COMPANY WHERE company_name = 'Apple') THEN
        INSERT INTO COMPANY (company_name) VALUES ('Apple');
    END IF;
    
    RAISE NOTICE 'Sample companies added successfully';
END;
$$;