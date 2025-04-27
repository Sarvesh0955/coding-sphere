const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');

// Public routes
router.get('/all', questionController.getAllQuestions);
router.get('/topics', questionController.getAllTopics);
router.get('/companies', questionController.getAllCompanies);
router.post('/companies', auth.authenticateToken, questionController.createCompany); // Fixed middleware function name
router.get('/platforms', questionController.getAllPlatforms);
router.get('/:platformId/:questionId', questionController.getQuestionById);

// Protected routes - require authentication
router.post('/bulk', auth.authenticateToken, questionController.bulkCreateQuestions); // Updated route for bulk creation
router.post('/:platformId', auth.authenticateToken, questionController.createQuestion);
router.put('/:platformId/:questionId', auth.authenticateToken, questionController.updateQuestion);
router.delete('/:platformId/:questionId', auth.authenticateToken, questionController.deleteQuestion);

// Company associations
router.post('/:platformId/:questionId/company/:companyId', auth.authenticateToken, questionController.addQuestionCompany);
router.delete('/:platformId/:questionId/company/:companyId', auth.authenticateToken, questionController.removeQuestionCompany);

module.exports = router;