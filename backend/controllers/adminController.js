const profileModel = require('../models/profileModel');
const questionModel = require('../models/questionModel');
const { pool } = require('../config/database');
const csv = require('csv-parser');
const { Readable } = require('stream');

const getAllUsers = async (req, res) => {
    try {
        const users = await profileModel.getAllProfiles();
        res.status(200).json({ users });
    } catch (err) {
        console.error('Error getting all users:', err);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { username } = req.params;
        const result = await profileModel.deleteUser(username);
        
        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};

const importQuestionsFromCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No CSV file uploaded' });
        }

        const companyId = req.body.companyId;
        if (!companyId) {
            return res.status(400).json({ message: 'Company ID is required' });
        }

        const results = [];
        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let onlyCompanyAssociationCount = 0;

        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        await new Promise((resolve, reject) => {
            bufferStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        for (const row of results) {
            try {
                if (!row.Difficulty || !row.Title || !row.Link || !row.Topics) {
                    console.error('Missing required field:', row);
                    failedCount++;
                    continue;
                }

                let platformId = 2;
                
                let questionId = '';
                try {
                    const url = new URL(row.Link);
                    const pathParts = url.pathname.split('/').filter(Boolean);
                    questionId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || '';
                } catch (e) {
                    questionId = Math.random().toString(36).substring(2, 10);
                }

                const topics = row.Topics.split(/[,;]/).map(topic => topic.trim()).filter(Boolean);
                const title = row.Title.trim();
                const link = row.Link.trim();
                let difficulty = String(row.Difficulty).trim().toUpperCase();
                
                const existingQuestion = await questionModel.getQuestionById(platformId, questionId);
                
                let companyAssociationExists = false;
                if (existingQuestion) {
                    const companies = existingQuestion.companies || [];
                    try {
                        const companyResult = await pool.query(
                            'SELECT company_name FROM COMPANY WHERE company_id = $1',
                            [parseInt(companyId, 10)]
                        );
                        
                        if (companyResult.rows.length > 0) {
                            const companyName = companyResult.rows[0].company_name;
                            companyAssociationExists = companies.includes(companyName);
                        }
                    } catch (err) {
                        console.error('Error getting company name:', err);
                    }
                }
                
                if (existingQuestion && companyAssociationExists) {
                    skippedCount++;
                    continue;
                } else if (existingQuestion) {
                    try {
                        await questionModel.addQuestionCompany(
                            platformId,
                            questionId,
                            parseInt(companyId, 10)
                        );
                        onlyCompanyAssociationCount++;
                    } catch (err) {
                        console.error(`Error adding company association for "${title}":`, err);
                        failedCount++;
                    }
                } else {
                    try {
                        await questionModel.createQuestion(
                            platformId,
                            questionId,
                            title,
                            link,
                            topics,
                            difficulty
                        );
                        
                        await questionModel.addQuestionCompany(
                            platformId,
                            questionId,
                            parseInt(companyId, 10)
                        );
                        
                        successCount++;
                    } catch (err) {
                        console.error(`Error with question "${title}":`, err);
                        failedCount++;
                    }
                }
            } catch (err) {
                console.error('Error processing row:', err, row);
                failedCount++;
            }
        }

        res.status(201).json({ 
            message: 'CSV import completed',
            successCount,
            failedCount
        });
    } catch (err) {
        console.error('Error importing questions from CSV:', err);
        res.status(500).json({ message: 'Server error while importing questions' });
    }
};

module.exports = {
    getAllUsers,
    deleteUser,
    importQuestionsFromCSV
};