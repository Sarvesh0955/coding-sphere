const profileModel = require('../models/profileModel');
const questionModel = require('../models/questionModel');
const csv = require('csv-parser');
const { Readable } = require('stream');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await profileModel.getAllProfiles();
        res.status(200).json({ users });
    } catch (err) {
        console.error('Error getting all users:', err);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

// Delete a user (admin only)
const deleteUser = async (req, res) => {
    try {
        const { username } = req.params;
        
        // Don't allow deleting the admin itself
        if (req.user.username === username) {
            return res.status(400).json({ message: 'Cannot delete your own admin account' });
        }
        
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

// Import questions from CSV file (admin only)
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

        // Create a readable stream from the buffer
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null);

        // Process the CSV data
        await new Promise((resolve, reject) => {
            bufferStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        // Map platform names to IDs (assuming LeetCode is 1, adjust as needed for your system)
        const platformMap = {
            'leetcode': 1,
            'lc': 1,
            'codeforces': 2,
            'cf': 2,
            'hackerrank': 3,
            'hr': 3
        };

        // Process each question from the CSV
        for (const row of results) {
            try {
                // The CSV columns should match the expected format:
                // Difficulty, Title, Link, Topics
                // (we're ignoring Frequency and Acceptance Rate as per requirements)
                
                if (!row.Difficulty || !row.Title || !row.Link || !row.Topics) {
                    console.error('Missing required field:', row);
                    failedCount++;
                    continue;
                }

                // Check if this is a LeetCode question based on the URL
                // Default to platform ID 1 (LeetCode) if not specifiable
                let platformId = row.Link.includes('leetcode.com') ? 1 : 
                                row.Link.includes('codeforces.com') ? 2 : 
                                row.Link.includes('hackerrank.com') ? 3 : 1;
                
                // Extract the question ID from the URL
                let questionId = '';
                try {
                    const url = new URL(row.Link);
                    const pathParts = url.pathname.split('/').filter(Boolean);
                    questionId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || '';
                } catch (e) {
                    // If URL parsing fails, use a random ID or increment a counter
                    questionId = Math.random().toString(36).substring(2, 10);
                }

                // Split topics by comma or other delimiters, clean them up
                const topics = row.Topics.split(/[,;]/).map(topic => topic.trim()).filter(Boolean);

                // Improve extraction of platformId and questionId if needed
                platformId = row.Link.includes('leetcode.com') ? 1 : 
                            row.Link.includes('codeforces.com') ? 2 : 
                            row.Link.includes('hackerrank.com') ? 3 : 1;
                
                // Re-extract questionId with improved logic
                questionId = (() => {
                    try {
                        const url = new URL(row.Link);
                        const pathParts = url.pathname.split('/').filter(Boolean);
                        return pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2] || '';
                    } catch (e) {
                        return Math.random().toString(36).substring(2, 10);
                    }
                })();
                
                const title = row.Title.trim();
                const link = row.Link.trim();
                
                // Extra debugging for difficulty value
                console.log('Original difficulty:', JSON.stringify(row.Difficulty));
                
                // More robust normalization for difficulty
                let rawDifficulty = row.Difficulty || '';
                
                // Convert to string, trim and uppercase
                let difficulty = String(rawDifficulty).trim().toUpperCase();
                
                // Debug the normalized value
                console.log('Normalized difficulty:', JSON.stringify(difficulty));
                
                // // Force it to be one of the exact allowed values
                // if (difficulty.includes('EASY') || difficulty === 'E') {
                //     difficulty = 'EASY';
                // } else if (difficulty.includes('MEDIUM') || difficulty === 'MED' || difficulty === 'M') {
                //     difficulty = 'MEDIUM';
                // } else if (difficulty.includes('HARD') || difficulty === 'H') {
                //     difficulty = 'HARD';
                // } else {
                //     // Default to 'EASY' if not recognized
                //     difficulty = 'EASY';
                //     console.log('Defaulting to EASY for unrecognized difficulty:', rawDifficulty);
                // }
                
                // Final debug check of the value being sent to database
                console.log('Final difficulty value:', JSON.stringify(difficulty));
                
                try {
                    // Call createQuestion with individual parameters (not the entire object)
                    await questionModel.createQuestion(
                        platformId,
                        questionId,
                        title,
                        link,
                        topics,
                        difficulty
                    );
                    
                    // After creating the question, add company association
                    await questionModel.addQuestionCompany(
                        platformId,
                        questionId,
                        parseInt(companyId, 10)
                    );
                    
                    successCount++;
                } catch (err) {
                    console.error(`Error with question "${title}":`, err);
                    console.error('Question data:', { 
                        platformId, 
                        questionId, 
                        title, 
                        link, 
                        topics, 
                        difficulty: JSON.stringify(difficulty)
                    });
                    failedCount++;
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