const questionModel = require('../models/questionModel');
const platformModel = require('../models/platformModel');

const questionController = {
    
    getAllQuestions: async (req, res) => {
        try {
            const filters = {
                search: req.query.search,
                topic: req.query.topic,
                difficulty: req.query.difficulty,
                companyId: req.query.companyId ? parseInt(req.query.companyId) : null,
                platformId: req.query.platformId ? parseInt(req.query.platformId) : null
            };
   
            const questions = await questionModel.getAllQuestions(filters);
            
            // If user is authenticated, mark solved questions
            let solvedQuestionIds = [];
            if (req.user) {
                const solvedQuestions = await questionModel.getUserSolvedQuestions(req.user.username);
                solvedQuestionIds = solvedQuestions.map(q => `${q.platform_id}-${q.question_id}`);
            }
            
            // Add solved status to each question
            const questionsWithSolvedStatus = questions.map(q => ({
                ...q,
                solved: solvedQuestionIds.includes(`${q.platform_id}-${q.question_id}`)
            }));
            
            res.status(200).json(questionsWithSolvedStatus);
        } catch (err) {
            console.error('Error in getAllQuestions controller:', err);
            res.status(500).json({ error: 'Failed to fetch questions' });
        }
    },
    
    getQuestionById: async (req, res) => {
        try {
            const { platformId, questionId } = req.params;
            const question = await questionModel.getQuestionById(parseInt(platformId), questionId);
            
            if (!question) {
                return res.status(404).json({ error: 'Question not found' });
            }
            
            res.status(200).json(question);
        } catch (err) {
            console.error('Error in getQuestionById controller:', err);
            res.status(500).json({ error: 'Failed to fetch question' });
        }
    },
    
    createQuestion: async (req, res) => {
        try {
            const { platformId } = req.params;
            const { title, link, topics, difficulty } = req.body;
            
            const questionId = `Q${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
            
            const createdQuestion = await questionModel.createQuestion(
                parseInt(platformId),
                questionId,
                title,
                link,
                topics || [],
                difficulty
            );
            
            res.status(201).json(createdQuestion);
        } catch (err) {
            console.error('Error in createQuestion controller:', err);
            res.status(500).json({ error: 'Failed to create question' });
        }
    },
    
    updateQuestion: async (req, res) => {
        try {
            const { platformId, questionId } = req.params;
            const { title, link, topics, difficulty } = req.body;
            
            const updatedQuestion = await questionModel.updateQuestion(
                parseInt(platformId),
                questionId,
                title,
                link,
                topics || [],
                difficulty
            );
            
            if (!updatedQuestion) {
                return res.status(404).json({ error: 'Question not found' });
            }
            
            res.status(200).json(updatedQuestion);
        } catch (err) {
            console.error('Error in updateQuestion controller:', err);
            res.status(500).json({ error: 'Failed to update question' });
        }
    },
    
    deleteQuestion: async (req, res) => {
        try {
            const { platformId, questionId } = req.params;
            
            const deletedQuestion = await questionModel.deleteQuestion(parseInt(platformId), questionId);
            
            if (!deletedQuestion) {
                return res.status(404).json({ error: 'Question not found' });
            }
            
            res.status(200).json({ message: 'Question deleted successfully' });
        } catch (err) {
            console.error('Error in deleteQuestion controller:', err);
            res.status(500).json({ error: 'Failed to delete question' });
        }
    },
    
    getAllTopics: async (req, res) => {
        try {
            const topics = await questionModel.getAllTopics();
            res.status(200).json(topics);
        } catch (err) {
            console.error('Error in getAllTopics controller:', err);
            res.status(500).json({ error: 'Failed to fetch topics' });
        }
    },
    
    getAllCompanies: async (req, res) => {
        try {
            const companies = await questionModel.getAllCompanies();
            res.status(200).json(companies);
        } catch (err) {
            console.error('Error in getAllCompanies controller:', err);
            res.status(500).json({ error: 'Failed to fetch companies' });
        }
    },
    
    createCompany: async (req, res) => {
        try {
            const { companyName } = req.body;
            
            if (!companyName) {
                return res.status(400).json({ error: 'Company name is required' });
            }
            
            const result = await questionModel.createCompany(companyName);
            
            const statusCode = result.exists ? 200 : 201;
            res.status(statusCode).json(result);
        } catch (err) {
            console.error('Error in createCompany controller:', err);
            res.status(500).json({ error: 'Failed to create company' });
        }
    },
    
    getAllPlatforms: async (req, res) => {
        try {
            const platforms = await platformModel.getAllPlatforms();
            res.status(200).json(platforms);
        } catch (err) {
            console.error('Error in getAllPlatforms controller:', err);
            res.status(500).json({ error: 'Failed to fetch platforms' });
        }
    },
    
    addQuestionCompany: async (req, res) => {
        try {
            const { platformId, questionId, companyId } = req.params;
            
            const association = await questionModel.addQuestionCompany(
                parseInt(platformId),
                questionId,
                parseInt(companyId)
            );
            
            if (!association) {
                return res.status(404).json({ error: 'Failed to associate question with company' });
            }
            
            res.status(201).json(association);
        } catch (err) {
            console.error('Error in addQuestionCompany controller:', err);
            res.status(500).json({ error: 'Failed to associate question with company' });
        }
    },
    
    removeQuestionCompany: async (req, res) => {
        try {
            const { platformId, questionId, companyId } = req.params;
            
            const removed = await questionModel.removeQuestionCompany(
                parseInt(platformId),
                questionId,
                parseInt(companyId)
            );
            
            if (!removed) {
                return res.status(404).json({ error: 'Association not found' });
            }
            
            res.status(200).json({ message: 'Company association removed successfully' });
        } catch (err) {
            console.error('Error in removeQuestionCompany controller:', err);
            res.status(500).json({ error: 'Failed to remove company association' });
        }
    },
    
    getUserSolvedQuestions: async (req, res) => {
        try {
            const solvedQuestions = await questionModel.getUserSolvedQuestions(req.user.username);
            res.status(200).json(solvedQuestions);
        } catch (err) {
            console.error('Error in getUserSolvedQuestions controller:', err);
            res.status(500).json({ error: 'Failed to fetch solved questions' });
        }
    },
    
    markQuestionAsSolved: async (req, res) => {
        try {
            const { platformId, questionId } = req.params;
            
            const result = await questionModel.markQuestionAsSolved(
                req.user.username,
                parseInt(platformId),
                questionId
            );
            
            res.status(200).json({ 
                message: 'Question marked as solved',
                solved: true,
                result
            });
        } catch (err) {
            console.error('Error in markQuestionAsSolved controller:', err);
            res.status(500).json({ error: 'Failed to mark question as solved' });
        }
    },
    
    markQuestionAsUnsolved: async (req, res) => {
        try {
            const { platformId, questionId } = req.params;
            
            const result = await questionModel.markQuestionAsUnsolved(
                req.user.username,
                parseInt(platformId),
                questionId
            );
            
            if (!result) {
                return res.status(404).json({ error: 'Question was not marked as solved' });
            }
            
            res.status(200).json({ 
                message: 'Question marked as unsolved',
                solved: false,
                result
            });
        } catch (err) {
            console.error('Error in markQuestionAsUnsolved controller:', err);
            res.status(500).json({ error: 'Failed to mark question as unsolved' });
        }
    },
    
    getDynamicProblemset: async (req, res) => {
        try {
            const username = req.user.username;
            
            // Check if the dynamic problemset needs to be refreshed
            const result = await questionModel.refreshDynamicProblemset(username);
            
            // Get the dynamic problemset
            const dynamicProblemset = await questionModel.getDynamicProblemset(username);
            
            // Get the user's solved questions
            const solvedQuestions = await questionModel.getUserSolvedQuestions(username);
            const solvedQuestionIds = solvedQuestions.map(q => `${q.platform_id}-${q.question_id}`);
            
            // Add solved status to each question
            const problemsetWithSolvedStatus = dynamicProblemset.map(q => ({
                ...q,
                solved: solvedQuestionIds.includes(`${q.platform_id}-${q.question_id}`)
            }));
            
            res.status(200).json({
                problemset: problemsetWithSolvedStatus,
                refreshResult: result
            });
        } catch (err) {
            console.error('Error in getDynamicProblemset controller:', err);
            res.status(500).json({ error: 'Failed to fetch dynamic problemset' });
        }
    },
    
    refreshDynamicProblemset: async (req, res) => {
        try {
            const username = req.user.username;
            
            // Refresh the dynamic problemset
            const result = await questionModel.refreshDynamicProblemset(username);
            
            res.status(200).json({ 
                message: 'Dynamic problemset refreshed successfully',
                result 
            });
        } catch (err) {
            console.error('Error in refreshDynamicProblemset controller:', err);
            res.status(500).json({ error: 'Failed to refresh dynamic problemset' });
        }
    },
    
    addToDynamicProblemset: async (req, res) => {
        try {
            const { platformId, questionId } = req.params;
            const username = req.user.username;
            
            const result = await questionModel.addToDynamicProblemset(username, parseInt(platformId), questionId);
            
            res.status(200).json({ 
                message: 'Question added to dynamic problemset successfully',
                result
            });
        } catch (err) {
            console.error('Error in addToDynamicProblemset controller:', err);
            res.status(500).json({ error: 'Failed to add question to dynamic problemset' });
        }
    },
    
    removeFromDynamicProblemset: async (req, res) => {
        try {
            const { platformId, questionId } = req.params;
            const username = req.user.username;
            
            const result = await questionModel.removeFromDynamicProblemset(username, parseInt(platformId), questionId);
            
            if (!result) {
                return res.status(404).json({ error: 'Question not found in dynamic problemset' });
            }
            
            res.status(200).json({ 
                message: 'Question removed from dynamic problemset successfully',
                result
            });
        } catch (err) {
            console.error('Error in removeFromDynamicProblemset controller:', err);
            res.status(500).json({ error: 'Failed to remove question from dynamic problemset' });
        }
    }
};

module.exports = questionController;