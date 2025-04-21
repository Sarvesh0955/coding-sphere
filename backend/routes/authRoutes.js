const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/send-verification-otp', authController.sendVerificationOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);

// Debug route
router.get('/check-otp/:email', authController.checkOTP);

// Export router without /api prefix (it's added in server.js)
module.exports = router;