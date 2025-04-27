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

-- Insert common coding topics
DO $$
BEGIN
    -- Data Structures
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Array') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Array');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'String') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('String');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Hash Table') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Hash Table');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Linked List') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Linked List');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Stack') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Stack');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Queue') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Queue');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Tree') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Tree');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Binary Tree') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Binary Tree');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Binary Search Tree') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Binary Search Tree');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Heap') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Heap');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Graph') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Graph');
    END IF;
    
    -- Algorithms
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Dynamic Programming') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Dynamic Programming');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Greedy') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Greedy');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Backtracking') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Backtracking');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Binary Search') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Binary Search');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'DFS') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('DFS');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'BFS') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('BFS');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Sorting') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Sorting');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Two Pointers') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Two Pointers');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Sliding Window') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Sliding Window');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Recursion') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Recursion');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Divide and Conquer') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Divide and Conquer');
    END IF;
    
    -- Math & Logic
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Math') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Math');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Bit Manipulation') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Bit Manipulation');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Brute Force') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Brute Force');
    END IF;
    
    -- Advanced Topics
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Design') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Design');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Trie') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Trie');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Union Find') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Union Find');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM TOPICS WHERE topic_name = 'Topological Sort') THEN
        INSERT INTO TOPICS (topic_name) VALUES ('Topological Sort');
    END IF;
    
    RAISE NOTICE 'Topics added successfully';
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

-- Insert sample questions with topics
DO $$
DECLARE
    array_topic_id INT;
    hash_table_topic_id INT;
    dfs_topic_id INT;
    bfs_topic_id INT;
    graph_topic_id INT;
    array_tp_topic_id INT;
    dp_topic_id INT;
    math_topic_id INT;
    brute_force_topic_id INT;
BEGIN
    -- Get topic IDs first
    SELECT topic_id INTO array_topic_id FROM TOPICS WHERE topic_name = 'Array' LIMIT 1;
    SELECT topic_id INTO hash_table_topic_id FROM TOPICS WHERE topic_name = 'Hash Table' LIMIT 1;
    SELECT topic_id INTO dfs_topic_id FROM TOPICS WHERE topic_name = 'DFS' LIMIT 1;
    SELECT topic_id INTO bfs_topic_id FROM TOPICS WHERE topic_name = 'BFS' LIMIT 1;
    SELECT topic_id INTO graph_topic_id FROM TOPICS WHERE topic_name = 'Graph' LIMIT 1;
    SELECT topic_id INTO array_tp_topic_id FROM TOPICS WHERE topic_name = 'Two Pointers' LIMIT 1;
    SELECT topic_id INTO dp_topic_id FROM TOPICS WHERE topic_name = 'Dynamic Programming' LIMIT 1;
    SELECT topic_id INTO math_topic_id FROM TOPICS WHERE topic_name = 'Math' LIMIT 1;
    SELECT topic_id INTO brute_force_topic_id FROM TOPICS WHERE topic_name = 'Brute Force' LIMIT 1;
    
    -- Insert some sample questions with topics array (for backward compatibility)
    IF NOT EXISTS (SELECT 1 FROM QUESTION WHERE platform_id = 2 AND question_id = '1') THEN
        INSERT INTO QUESTION (platform_id, question_id, title, link, topics, difficulty)
        VALUES (2, '1', 'Two Sum', 'https://leetcode.com/problems/two-sum/', 
                ARRAY['Array', 'Hash Table'], 'Easy');
                
        -- Add question-topic relationships
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (2, '1', array_topic_id);
        
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (2, '1', hash_table_topic_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM QUESTION WHERE platform_id = 2 AND question_id = '200') THEN
        INSERT INTO QUESTION (platform_id, question_id, title, link, topics, difficulty)
        VALUES (2, '200', 'Number of Islands', 'https://leetcode.com/problems/number-of-islands/',
                ARRAY['DFS', 'BFS', 'Graph'], 'Medium');
                
        -- Add question-topic relationships
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (2, '200', dfs_topic_id);
        
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (2, '200', bfs_topic_id);
        
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (2, '200', graph_topic_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM QUESTION WHERE platform_id = 2 AND question_id = '42') THEN
        INSERT INTO QUESTION (platform_id, question_id, title, link, topics, difficulty)
        VALUES (2, '42', 'Trapping Rain Water', 'https://leetcode.com/problems/trapping-rain-water/',
                ARRAY['Array', 'Two Pointers', 'Dynamic Programming'], 'Hard');
                
        -- Add question-topic relationships
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (2, '42', array_topic_id);
        
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (2, '42', array_tp_topic_id);
        
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (2, '42', dp_topic_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM QUESTION WHERE platform_id = 1 AND question_id = '4A') THEN
        INSERT INTO QUESTION (platform_id, question_id, title, link, topics, difficulty)
        VALUES (1, '4A', 'Watermelon', 'https://codeforces.com/problemset/problem/4/A',
                ARRAY['Math', 'Brute Force'], 'Easy');
                
        -- Add question-topic relationships
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (1, '4A', math_topic_id);
        
        INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
        VALUES (1, '4A', brute_force_topic_id);
    END IF;
    
    RAISE NOTICE 'Sample questions with topics added successfully';
END;
$$;

-- Associate questions with companies
DO $$
DECLARE
    google_id INT;
    microsoft_id INT;
    amazon_id INT;
    facebook_id INT;
BEGIN
    -- Get company IDs
    SELECT company_id INTO google_id FROM COMPANY WHERE company_name = 'Google' LIMIT 1;
    SELECT company_id INTO microsoft_id FROM COMPANY WHERE company_name = 'Microsoft' LIMIT 1;
    SELECT company_id INTO amazon_id FROM COMPANY WHERE company_name = 'Amazon' LIMIT 1;
    SELECT company_id INTO facebook_id FROM COMPANY WHERE company_name = 'Facebook' LIMIT 1;
    
    -- Associate questions with companies
    IF NOT EXISTS (SELECT 1 FROM QUESTION_COMPANY WHERE platform_id = 2 AND question_id = '1' AND company_id = google_id) THEN
        INSERT INTO QUESTION_COMPANY (platform_id, question_id, company_id)
        VALUES (2, '1', google_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM QUESTION_COMPANY WHERE platform_id = 2 AND question_id = '1' AND company_id = microsoft_id) THEN
        INSERT INTO QUESTION_COMPANY (platform_id, question_id, company_id)
        VALUES (2, '1', microsoft_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM QUESTION_COMPANY WHERE platform_id = 2 AND question_id = '200' AND company_id = amazon_id) THEN
        INSERT INTO QUESTION_COMPANY (platform_id, question_id, company_id)
        VALUES (2, '200', amazon_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM QUESTION_COMPANY WHERE platform_id = 2 AND question_id = '42' AND company_id = facebook_id) THEN
        INSERT INTO QUESTION_COMPANY (platform_id, question_id, company_id)
        VALUES (2, '42', facebook_id);
    END IF;
    
    RAISE NOTICE 'Questions associated with companies successfully';
END;
$$;