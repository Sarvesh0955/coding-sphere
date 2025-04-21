const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get user's own profile
router.get('/', authenticateToken, profileController.getProfile);

// Admin routes
router.get('/admin/profiles', authenticateToken, isAdmin, profileController.getAllProfiles);
router.get('/admin/all', authenticateToken, isAdmin, profileController.getAllProfiles);

module.exports = router;