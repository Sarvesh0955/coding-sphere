const { pool } = require('../config/database');
const platformQueries = require('./platformModel');

const questionQueries = {
    getAllQuestions: async (filters = {}) => {
        try {
            let query = `
                SELECT q.*, p.platform_name, 
                    ARRAY(
                        SELECT c.company_name 
                        FROM QUESTION_COMPANY qc
                        JOIN COMPANY c ON qc.company_id = c.company_id
                        WHERE qc.platform_id = q.platform_id AND qc.question_id = q.question_id
                    ) as companies,
                    ARRAY(
                        SELECT t.topic_name
                        FROM QUESTION_TOPIC qt
                        JOIN TOPICS t ON qt.topic_id = t.topic_id
                        WHERE qt.platform_id = q.platform_id AND qt.question_id = q.question_id
                    ) as topics_from_relation
                FROM QUESTION q
                JOIN PLATFORM p ON q.platform_id = p.platform_id
            `;
            
            const queryParams = [];
            const conditions = [];
            
            if (filters.search) {
                queryParams.push(`%${filters.search}%`);
                conditions.push(`(q.title ILIKE $${queryParams.length} OR q.question_id ILIKE $${queryParams.length})`);
            }
            
            if (filters.topic) {
                queryParams.push(filters.topic);
                conditions.push(`EXISTS (
                    SELECT 1 FROM QUESTION_TOPIC qt
                    JOIN TOPICS t ON qt.topic_id = t.topic_id
                    WHERE qt.platform_id = q.platform_id 
                    AND qt.question_id = q.question_id
                    AND t.topic_name = $${queryParams.length}
                )`);
            }
            
            if (filters.difficulty) {
                queryParams.push(filters.difficulty);
                conditions.push(`q.difficulty = $${queryParams.length}`);
            }
            
            if (filters.companyId) {
                queryParams.push(filters.companyId);
                conditions.push(`EXISTS (
                    SELECT 1 FROM QUESTION_COMPANY qc 
                    WHERE qc.platform_id = q.platform_id 
                    AND qc.question_id = q.question_id 
                    AND qc.company_id = $${queryParams.length}
                )`);
            }
            
            if (filters.platformId) {
                queryParams.push(filters.platformId);
                conditions.push(`q.platform_id = $${queryParams.length}`);
            }
        
            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }
            
            query += ` ORDER BY q.platform_id, q.question_id`;
            
            const result = await pool.query(query, queryParams);
            
            return result.rows.map(row => ({
                ...row,
                topics: Array.from(new Set([...(row.topics || []), ...(row.topics_from_relation || [])]))
            }));
        } catch (err) {
            console.error('Error getting questions:', err);
            throw err;
        }
    },
    
    getQuestionById: async (platformId, questionId) => {
        try {
            const query = `
                SELECT q.*, p.platform_name, 
                    ARRAY(
                        SELECT c.company_name 
                        FROM QUESTION_COMPANY qc
                        JOIN COMPANY c ON qc.company_id = c.company_id
                        WHERE qc.platform_id = q.platform_id AND qc.question_id = q.question_id
                    ) as companies,
                    ARRAY(
                        SELECT t.topic_name
                        FROM QUESTION_TOPIC qt
                        JOIN TOPICS t ON qt.topic_id = t.topic_id
                        WHERE qt.platform_id = q.platform_id AND qt.question_id = q.question_id
                    ) as topics_from_relation
                FROM QUESTION q
                JOIN PLATFORM p ON q.platform_id = p.platform_id
                WHERE q.platform_id = $1 AND q.question_id = $2
            `;
            
            const result = await pool.query(query, [platformId, questionId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const row = result.rows[0];
            return {
                ...row,
                topics: Array.from(new Set([...(row.topics || []), ...(row.topics_from_relation || [])]))
            };
        } catch (err) {
            console.error('Error getting question by id:', err);
            throw err;
        }
    },
    
    createQuestion: async (platformId, questionId, title, link, topics, difficulty, companies = []) => {
        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                const questionResult = await client.query(
                    `INSERT INTO QUESTION (platform_id, question_id, title, link, topics, difficulty)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                    [platformId, questionId, title, link, topics, difficulty]
                );

                if (topics && topics.length > 0) {
                    for (const topicName of topics) {
                        const topicResult = await client.query(
                            `SELECT topic_id FROM TOPICS WHERE topic_name = $1`,
                            [topicName]
                        );
                        
                        let topicId;
                        if (topicResult.rows.length === 0) {
                            const newTopicResult = await client.query(
                                `INSERT INTO TOPICS (topic_name) VALUES ($1) RETURNING topic_id`,
                                [topicName]
                            );
                            topicId = newTopicResult.rows[0].topic_id;
                        } else {
                            topicId = topicResult.rows[0].topic_id;
                        }
                        
                        await client.query(
                            `INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
                            VALUES ($1, $2, $3)
                            ON CONFLICT DO NOTHING`,
                            [platformId, questionId, topicId]
                        );
                    }
                }

                if (companies && companies.length > 0) {
                    for (const companyId of companies) {
                        await client.query(
                            `INSERT INTO QUESTION_COMPANY (platform_id, question_id, company_id)
                            VALUES ($1, $2, $3)
                            ON CONFLICT DO NOTHING`,
                            [platformId, questionId, companyId]
                        );
                    }
                }
                
                await client.query('COMMIT');
                return questionResult.rows[0];
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (err) {
            console.error('Error creating question:', err);
            throw err;
        }
    },

    updateQuestion: async (platformId, questionId, title, link, topics, difficulty) => {
        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                const result = await client.query(
                    `UPDATE QUESTION 
                    SET title = $3, link = $4, topics = $5, difficulty = $6
                    WHERE platform_id = $1 AND question_id = $2
                    RETURNING *`,
                    [platformId, questionId, title, link, topics, difficulty]
                );
                
                await client.query(
                    `DELETE FROM QUESTION_TOPIC 
                    WHERE platform_id = $1 AND question_id = $2`,
                    [platformId, questionId]
                );
                
                if (topics && topics.length > 0) {
                    for (const topicName of topics) {
                        const topicResult = await client.query(
                            `SELECT topic_id FROM TOPICS WHERE topic_name = $1`,
                            [topicName]
                        );
                        
                        let topicId;
                        if (topicResult.rows.length === 0) {
                            const newTopicResult = await client.query(
                                `INSERT INTO TOPICS (topic_name) VALUES ($1) RETURNING topic_id`,
                                [topicName]
                            );
                            topicId = newTopicResult.rows[0].topic_id;
                        } else {
                            topicId = topicResult.rows[0].topic_id;
                        }
                        
                        await client.query(
                            `INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
                            VALUES ($1, $2, $3)
                            ON CONFLICT DO NOTHING`,
                            [platformId, questionId, topicId]
                        );
                    }
                }
                
                await client.query('COMMIT');
                return result.rows.length > 0 ? result.rows[0] : null;
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (err) {
            console.error('Error updating question:', err);
            throw err;
        }
    },
    
    deleteQuestion: async (platformId, questionId) => {
        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                await client.query(
                    `DELETE FROM QUESTION_TOPIC 
                    WHERE platform_id = $1 AND question_id = $2`,
                    [platformId, questionId]    
                );
                
                const result = await client.query(
                    'DELETE FROM QUESTION WHERE platform_id = $1 AND question_id = $2 RETURNING *',
                    [platformId, questionId]
                );
                
                await client.query('COMMIT');
                return result.rows.length > 0 ? result.rows[0] : null;
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (err) {
            console.error('Error deleting question:', err);
            throw err;
        }
    },
    
    addQuestionCompany: async (platformId, questionId, companyId) => {
        try {
            const result = await pool.query(
                `INSERT INTO QUESTION_COMPANY (platform_id, question_id, company_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (platform_id, question_id, company_id) DO NOTHING
                RETURNING *`,
                [platformId, questionId, companyId]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error adding question-company association:', err);
            throw err;
        }
    },
    
    removeQuestionCompany: async (platformId, questionId, companyId) => {
        try {
            const result = await pool.query(
                `DELETE FROM QUESTION_COMPANY 
                WHERE platform_id = $1 AND question_id = $2 AND company_id = $3
                RETURNING *`,
                [platformId, questionId, companyId]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error removing question-company association:', err);
            throw err;
        }
    },
    
    getAllTopics: async () => {
        try {
            const result = await pool.query(
                `SELECT topic_name FROM TOPICS ORDER BY topic_name`
            );
            return result.rows.map(row => row.topic_name);
        } catch (err) {
            console.error('Error getting all topics:', err);
            throw err;
        }
    },
    
    addQuestionTopic: async (platformId, questionId, topicName) => {
        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                const topicResult = await client.query(
                    `SELECT topic_id FROM TOPICS WHERE topic_name = $1`,
                    [topicName]
                );
                
                let topicId;
                if (topicResult.rows.length === 0) {
                    const newTopicResult = await client.query(
                        `INSERT INTO TOPICS (topic_name) VALUES ($1) RETURNING topic_id`,
                        [topicName]
                    );
                    topicId = newTopicResult.rows[0].topic_id;
                } else {
                    topicId = topicResult.rows[0].topic_id;
                }
                
                const result = await client.query(
                    `INSERT INTO QUESTION_TOPIC (platform_id, question_id, topic_id)
                    VALUES ($1, $2, $3)
                    ON CONFLICT DO NOTHING
                    RETURNING *`,
                    [platformId, questionId, topicId]
                );
                
                await client.query(
                    `UPDATE QUESTION 
                    SET topics = ARRAY(
                        SELECT t.topic_name
                        FROM QUESTION_TOPIC qt
                        JOIN TOPICS t ON qt.topic_id = t.topic_id
                        WHERE qt.platform_id = $1 AND qt.question_id = $2
                    )
                    WHERE platform_id = $1 AND question_id = $2`,
                    [platformId, questionId]
                );
                
                await client.query('COMMIT');
                return result.rows.length > 0 ? result.rows[0] : null;
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (err) {
            console.error('Error adding question-topic association:', err);
            throw err;
        }
    },
    
    removeQuestionTopic: async (platformId, questionId, topicName) => {
        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                const topicResult = await client.query(
                    `SELECT topic_id FROM TOPICS WHERE topic_name = $1`,
                    [topicName]
                );
                
                if (topicResult.rows.length === 0) {
                    await client.query('COMMIT');
                    return null;
                }
                
                const topicId = topicResult.rows[0].topic_id;
                
                const result = await client.query(
                    `DELETE FROM QUESTION_TOPIC 
                    WHERE platform_id = $1 AND question_id = $2 AND topic_id = $3
                    RETURNING *`,
                    [platformId, questionId, topicId]
                );
                
                await client.query(
                    `UPDATE QUESTION 
                    SET topics = ARRAY(
                        SELECT t.topic_name
                        FROM QUESTION_TOPIC qt
                        JOIN TOPICS t ON qt.topic_id = t.topic_id
                        WHERE qt.platform_id = $1 AND qt.question_id = $2
                    )
                    WHERE platform_id = $1 AND question_id = $2`,
                    [platformId, questionId]
                );
                
                await client.query('COMMIT');
                return result.rows.length > 0 ? result.rows[0] : null;
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (err) {
            console.error('Error removing question-topic association:', err);
            throw err;
        }
    },
    
    getAllCompanies: async () => {
        try {
            const result = await pool.query('SELECT * FROM COMPANY ORDER BY company_name');
            return result.rows;
        } catch (err) {
            console.error('Error getting all companies:', err);
            throw err;
        }
    },
    
    createCompany: async (companyName) => {
        try {
            const existingCompany = await pool.query(
                'SELECT * FROM COMPANY WHERE company_name = $1',
                [companyName]
            );
            
            if (existingCompany.rows.length > 0) {
                return { 
                    exists: true,
                    company: existingCompany.rows[0]
                };
            }
            
            const result = await pool.query(
                'INSERT INTO COMPANY (company_name) VALUES ($1) RETURNING *',
                [companyName]
            );
            
            return { 
                exists: false,
                company: result.rows[0]
            };
        } catch (err) {
            console.error('Error creating company:', err);
            throw err;
        }
    },
    
    getUserSolvedQuestions: async (username) => {
        try {
            const query = `
                SELECT q.*, p.platform_name, s.solved_at,
                    ARRAY(
                        SELECT c.company_name 
                        FROM QUESTION_COMPANY qc
                        JOIN COMPANY c ON qc.company_id = c.company_id
                        WHERE qc.platform_id = q.platform_id AND qc.question_id = q.question_id
                    ) as companies,
                    ARRAY(
                        SELECT t.topic_name
                        FROM QUESTION_TOPIC qt
                        JOIN TOPICS t ON qt.topic_id = t.topic_id
                        WHERE qt.platform_id = q.platform_id AND qt.question_id = q.question_id
                    ) as topics_from_relation
                FROM SOLVED s
                JOIN QUESTION q ON s.platform_id = q.platform_id AND s.question_id = q.question_id
                JOIN PLATFORM p ON q.platform_id = p.platform_id
                WHERE s.username = $1
                ORDER BY s.solved_at DESC
            `;
            
            const result = await pool.query(query, [username]);
            
            return result.rows.map(row => ({
                ...row,
                topics: Array.from(new Set([...(row.topics || []), ...(row.topics_from_relation || [])]))
            }));
        } catch (err) {
            console.error('Error getting solved questions:', err);
            throw err;
        }
    },
    
    isQuestionSolved: async (username, platformId, questionId) => {
        try {
            const result = await pool.query(
                `SELECT * FROM SOLVED
                WHERE username = $1 AND platform_id = $2 AND question_id = $3`,
                [username, platformId, questionId]
            );
            return result.rows.length > 0;
        } catch (err) {
            console.error('Error checking if question is solved:', err);
            throw err;
        }
    },
    
    markQuestionAsSolved: async (username, platformId, questionId) => {
        try {
            // Check if already solved
            const existingResult = await pool.query(
                `SELECT * FROM SOLVED
                WHERE username = $1 AND platform_id = $2 AND question_id = $3`,
                [username, platformId, questionId]
            );
            
            if (existingResult.rows.length > 0) {
                return existingResult.rows[0]; // Already solved
            }
            
            const result = await pool.query(
                `INSERT INTO SOLVED (username, platform_id, question_id)
                VALUES ($1, $2, $3)
                RETURNING *`,
                [username, platformId, questionId]
            );
            
            return result.rows[0];
        } catch (err) {
            console.error('Error marking question as solved:', err);
            throw err;
        }
    },
    
    markQuestionAsUnsolved: async (username, platformId, questionId) => {
        try {
            const result = await pool.query(
                `DELETE FROM SOLVED
                WHERE username = $1 AND platform_id = $2 AND question_id = $3
                RETURNING *`,
                [username, platformId, questionId]
            );
            
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error marking question as unsolved:', err);
            throw err;
        }
    },
    
    getDynamicProblemset: async (username) => {
        try {
            const query = `
                SELECT q.*, p.platform_name, dp.added_at,
                    ARRAY(
                        SELECT c.company_name 
                        FROM QUESTION_COMPANY qc
                        JOIN COMPANY c ON qc.company_id = c.company_id
                        WHERE qc.platform_id = q.platform_id AND qc.question_id = q.question_id
                    ) as companies,
                    ARRAY(
                        SELECT t.topic_name
                        FROM QUESTION_TOPIC qt
                        JOIN TOPICS t ON qt.topic_id = t.topic_id
                        WHERE qt.platform_id = q.platform_id AND qt.question_id = q.question_id
                    ) as topics_from_relation
                FROM DYNAMIC_PROBLEMS dp
                JOIN QUESTION q ON dp.platform_id = q.platform_id AND dp.question_id = q.question_id
                JOIN PLATFORM p ON q.platform_id = p.platform_id
                WHERE dp.username = $1
                ORDER BY dp.added_at DESC
            `;
            
            const result = await pool.query(query, [username]);
            
            return result.rows.map(row => ({
                ...row,
                topics: Array.from(new Set([...(row.topics || []), ...(row.topics_from_relation || [])]))
            }));
        } catch (err) {
            console.error('Error getting dynamic problemset:', err);
            throw err;
        }
    },
    
    addToDynamicProblemset: async (username, platformId, questionId) => {
        try {
            // Check if the problem already exists in the dynamic problemset
            const existingResult = await pool.query(
                `SELECT * FROM DYNAMIC_PROBLEMS
                WHERE username = $1 AND platform_id = $2 AND question_id = $3`,
                [username, platformId, questionId]
            );
            
            if (existingResult.rows.length > 0) {
                // Problem is already in the dynamic problemset
                return existingResult.rows[0];
            }
            
            // Insert the problem into the dynamic problemset
            const result = await pool.query(
                `INSERT INTO DYNAMIC_PROBLEMS (username, platform_id, question_id)
                VALUES ($1, $2, $3)
                RETURNING *`,
                [username, platformId, questionId]
            );
            
            return result.rows[0];
        } catch (err) {
            console.error('Error adding to dynamic problemset:', err);
            throw err;
        }
    },
    
    removeFromDynamicProblemset: async (username, platformId, questionId) => {
        try {
            const result = await pool.query(
                `DELETE FROM DYNAMIC_PROBLEMS
                WHERE username = $1 AND platform_id = $2 AND question_id = $3
                RETURNING *`,
                [username, platformId, questionId]
            );
            
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (err) {
            console.error('Error removing from dynamic problemset:', err);
            throw err;
        }
    },
    
    refreshDynamicProblemset: async (username) => {
        try {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                
                // First, get the count of problems in the dynamic problemset
                const countResult = await client.query(
                    'SELECT COUNT(*) as count FROM DYNAMIC_PROBLEMS WHERE username = $1',
                    [username]
                );
                
                const count = parseInt(countResult.rows[0].count);
                
                // If there are already 10 problems, we don't need to add more
                if (count >= 10) {
                    await client.query('COMMIT');
                    return { refreshed: false, count };
                }
                
                // Find the problems already in the dynamic problemset
                const existingProblems = await client.query(
                    `SELECT platform_id, question_id FROM DYNAMIC_PROBLEMS WHERE username = $1`,
                    [username]
                );
                
                const existingIds = existingProblems.rows.map(p => `(${p.platform_id},${p.question_id})`);
                
                // Get the user's friends
                const friendsResult = await client.query(
                    `SELECT friend_username FROM FRIENDS WHERE username = $1`,
                    [username]
                );
                
                const friends = friendsResult.rows.map(f => f.friend_username);
                
                // If the user has friends, get problems solved by friends (most recent first)
                if (friends.length > 0) {
                    const friendsSolvedQuery = `
                        SELECT s.platform_id, s.question_id
                        FROM SOLVED s
                        WHERE s.username = ANY($1)
                        AND NOT EXISTS (
                            SELECT 1 FROM SOLVED
                            WHERE username = $2
                            AND platform_id = s.platform_id
                            AND question_id = s.question_id
                        )
                        AND NOT EXISTS (
                            SELECT 1 FROM DYNAMIC_PROBLEMS
                            WHERE username = $2
                            AND platform_id = s.platform_id
                            AND question_id = s.question_id
                        )
                        ORDER BY s.solved_at DESC
                        LIMIT $3
                    `;
                    
                    const neededCount = 10 - count;
                    const friendsSolvedResult = await client.query(
                        friendsSolvedQuery,
                        [friends, username, neededCount]
                    );
                    
                    // Add these problems to the dynamic problemset
                    for (const problem of friendsSolvedResult.rows) {
                        await client.query(
                            `INSERT INTO DYNAMIC_PROBLEMS (username, platform_id, question_id)
                            VALUES ($1, $2, $3)`,
                            [username, problem.platform_id, problem.question_id]
                        );
                    }
                    
                    // Check if we still need more problems
                    const newCount = count + friendsSolvedResult.rows.length;
                    if (newCount >= 10) {
                        await client.query('COMMIT');
                        return { refreshed: true, count: newCount, added: friendsSolvedResult.rows.length };
                    }
                    
                    // If we got here, we still need more problems
                    const randomNeededCount = 10 - newCount;
                    
                    // Get random unsolved questions
                    const randomQuery = `
                        SELECT q.platform_id, q.question_id
                        FROM QUESTION q
                        WHERE NOT EXISTS (
                            SELECT 1 FROM SOLVED
                            WHERE username = $1
                            AND platform_id = q.platform_id
                            AND question_id = q.question_id
                        )
                        AND NOT EXISTS (
                            SELECT 1 FROM DYNAMIC_PROBLEMS
                            WHERE username = $1
                            AND platform_id = q.platform_id
                            AND question_id = q.question_id
                        )
                        ORDER BY RANDOM()
                        LIMIT $2
                    `;
                    
                    const randomResult = await client.query(
                        randomQuery,
                        [username, randomNeededCount]
                    );
                    
                    // Add these random problems to the dynamic problemset
                    for (const problem of randomResult.rows) {
                        await client.query(
                            `INSERT INTO DYNAMIC_PROBLEMS (username, platform_id, question_id)
                            VALUES ($1, $2, $3)`,
                            [username, problem.platform_id, problem.question_id]
                        );
                    }
                    
                    await client.query('COMMIT');
                    return { 
                        refreshed: true, 
                        count: newCount + randomResult.rows.length,
                        added: friendsSolvedResult.rows.length + randomResult.rows.length
                    };
                } else {
                    // If the user has no friends, just get random unsolved questions
                    const randomNeededCount = 10 - count;
                    const randomQuery = `
                        SELECT q.platform_id, q.question_id
                        FROM QUESTION q
                        WHERE NOT EXISTS (
                            SELECT 1 FROM SOLVED
                            WHERE username = $1
                            AND platform_id = q.platform_id
                            AND question_id = q.question_id
                        )
                        AND NOT EXISTS (
                            SELECT 1 FROM DYNAMIC_PROBLEMS
                            WHERE username = $1
                            AND platform_id = q.platform_id
                            AND question_id = q.question_id
                        )
                        ORDER BY RANDOM()
                        LIMIT $2
                    `;
                    
                    const randomResult = await client.query(
                        randomQuery,
                        [username, randomNeededCount]
                    );
                    
                    // Add these random problems to the dynamic problemset
                    for (const problem of randomResult.rows) {
                        await client.query(
                            `INSERT INTO DYNAMIC_PROBLEMS (username, platform_id, question_id)
                            VALUES ($1, $2, $3)`,
                            [username, problem.platform_id, problem.question_id]
                        );
                    }
                    
                    await client.query('COMMIT');
                    return { 
                        refreshed: true, 
                        count: count + randomResult.rows.length,
                        added: randomResult.rows.length
                    };
                }
            } catch (err) {
                await client.query('ROLLBACK');
                throw err;
            } finally {
                client.release();
            }
        } catch (err) {
            console.error('Error refreshing dynamic problemset:', err);
            throw err;
        }
    },
    
    getAllPlatforms: async () => {
        return platformQueries.getAllPlatforms();
    }
};

module.exports = questionQueries;