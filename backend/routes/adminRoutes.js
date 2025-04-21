const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Apply authentication and admin check to all routes
router.use(authenticateToken, isAdmin);

// Get all users - Admin only
router.get('/users', adminController.getAllUsers);

// Delete a user - Admin only
router.delete('/users/:username', adminController.deleteUser);

module.exports = router;