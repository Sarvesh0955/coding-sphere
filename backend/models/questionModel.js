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
    
    getAllPlatforms: async () => {
        return platformQueries.getAllPlatforms();
    }
};

module.exports = questionQueries;