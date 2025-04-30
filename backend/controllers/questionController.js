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
            res.status(200).json(questions);
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
    }
};

module.exports = questionController;