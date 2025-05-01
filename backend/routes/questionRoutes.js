const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');

router.get('/all', questionController.getAllQuestions);
router.get('/topics', questionController.getAllTopics);
router.get('/companies', questionController.getAllCompanies);
router.post('/companies', auth.authenticateToken, questionController.createCompany); 
router.get('/platforms', questionController.getAllPlatforms);
router.get('/:platformId/:questionId', questionController.getQuestionById);

router.post('/:platformId', auth.authenticateToken, questionController.createQuestion);
router.put('/:platformId/:questionId', auth.authenticateToken, questionController.updateQuestion);
router.delete('/:platformId/:questionId', auth.authenticateToken, questionController.deleteQuestion);

router.post('/:platformId/:questionId/company/:companyId', auth.authenticateToken, questionController.addQuestionCompany);
router.delete('/:platformId/:questionId/company/:companyId', auth.authenticateToken, questionController.removeQuestionCompany);

// Solved questions routes
router.get('/solved', auth.authenticateToken, questionController.getUserSolvedQuestions);
router.post('/:platformId/:questionId/solved', auth.authenticateToken, questionController.markQuestionAsSolved);
router.delete('/:platformId/:questionId/solved', auth.authenticateToken, questionController.markQuestionAsUnsolved);

module.exports = router;