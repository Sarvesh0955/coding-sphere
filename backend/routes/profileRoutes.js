const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, profileController.getProfile);

router.get('/platforms', authenticateToken, profileController.getPlatforms);
router.get('/accounts', authenticateToken, profileController.getUserAccounts);
router.post('/accounts', authenticateToken, profileController.addUserAccount);
router.put('/accounts/:platformId', authenticateToken, profileController.updateUserAccount);
router.delete('/accounts/:platformId', authenticateToken, profileController.deleteUserAccount);

router.get('/admin/profiles', authenticateToken, isAdmin, profileController.getAllProfiles);
router.get('/admin/all', authenticateToken, isAdmin, profileController.getAllProfiles);

// Friend routes
router.get('/search', authenticateToken, profileController.searchUsers);
router.get('/friends', authenticateToken, profileController.getUserFriends);
router.post('/friends/:friendUsername', authenticateToken, profileController.addFriend);
router.delete('/friends/:friendUsername', authenticateToken, profileController.removeFriend);

router.get('/codeforces/:username', profileController.getCodeforcesStats);
router.get('/leetcode/:username', profileController.getLeetcodeStats);
router.get('/combined/:userId', authenticateToken, profileController.getCombinedStats);

router.get('/:userId', profileController.getProfile);

router.put('/:userId', profileController.updateProfile);

module.exports = router;