-- Set client encoding to UTF8
SET client_encoding = 'UTF8';

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