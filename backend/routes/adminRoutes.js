const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const multer = require('multer');

// Set up multer for memory storage (files stay in memory as buffers)
const upload = multer({ storage: multer.memoryStorage() });

// Apply authentication and admin check to all routes
router.use(authenticateToken, isAdmin);

// Get all users - Admin only
router.get('/users', adminController.getAllUsers);

// Delete a user - Admin only
router.delete('/users/:username', adminController.deleteUser);

// Upload questions from CSV - Admin only
router.post('/questions/upload-csv', upload.single('csvFile'), adminController.importQuestionsFromCSV);

module.exports = router;