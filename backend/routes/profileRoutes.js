const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Get user's own profile
router.get('/', authenticateToken, profileController.getProfile);

// Platform accounts routes
router.get('/platforms', authenticateToken, profileController.getPlatforms);
router.get('/accounts', authenticateToken, profileController.getUserAccounts);
router.post('/accounts', authenticateToken, profileController.addUserAccount);
router.put('/accounts/:platformId', authenticateToken, profileController.updateUserAccount);
router.delete('/accounts/:platformId', authenticateToken, profileController.deleteUserAccount);

// Admin routes
router.get('/admin/profiles', authenticateToken, isAdmin, profileController.getAllProfiles);
router.get('/admin/all', authenticateToken, isAdmin, profileController.getAllProfiles);

// Platform specific stats routes
router.get('/codeforces/:username', profileController.getCodeforcesStats);
router.get('/leetcode/:username', profileController.getLeetcodeStats);
router.get('/combined/:userId', authenticateToken, profileController.getCombinedStats);

// Get user profile - keep this after platform routes to avoid conflicts
router.get('/:userId', profileController.getProfile);

// Update user profile
router.put('/:userId', profileController.updateProfile);

module.exports = router;