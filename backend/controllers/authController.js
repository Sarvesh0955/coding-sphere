const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const profileModel = require('../models/profileModel');
const emailService = require('../services/emailService');
const { JWT_SECRET } = require('../middleware/auth');

// User signup
const signup = async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, otp } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email and password are required' });
        }
        
        const existingProfile = await profileModel.getProfileByEmail(email);
        if (existingProfile) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // Check if username is already taken
        const existingUsername = await profileModel.getProfileByUsername(username);
        if (existingUsername) {
            return res.status(409).json({ message: 'Username is already taken' });
        }

        // Check if OTP is provided and verify it
        if (otp) {
            console.log(`Verifying OTP for signup: ${email}, ${otp}`);
            const otpResult = emailService.verifyOTP(email, otp, 'signup');
            if (!otpResult.valid) {
                return res.status(400).json({ message: otpResult.message });
            }
            console.log(`OTP verification successful for ${email}`);
        } else {
            console.log(`No OTP provided for signup: ${email}`);
            // Make OTP required
            return res.status(400).json({ message: 'Verification code is required' });
        }
        
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log(`Creating profile: ${username}, ${email}`);
        const profile = await profileModel.createProfile(
            username, 
            hashedPassword, 
            email, 
            firstName || null, 
            lastName || null, 
            null, // profile_pic
            false // isAdmin
        );
        
        const token = jwt.sign(
            { 
                username: profile.username, 
                email: profile.email, 
                is_admin: profile.is_admin 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(201).json({
            message: 'User registered successfully',
            profile: {
                username: profile.username,
                email: profile.email,
                firstName: profile.first_name,
                lastName: profile.last_name,
                is_admin: profile.is_admin
            },
            token
        });
    } catch (err) {
        console.error('Error in signup:', err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
};

// User login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        // Include password_hash for authentication
        const profile = await profileModel.getProfileByUsername(username, true);
        if (!profile) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, profile.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { 
                username: profile.username, 
                email: profile.email, 
                is_admin: profile.is_admin 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.status(200).json({
            message: 'Login successful',
            profile: {
                username: profile.username,
                email: profile.email,
                firstName: profile.first_name,
                lastName: profile.last_name,
                is_admin: profile.is_admin
            },
            token
        });
    } catch (err) {
        console.error('Error in login:', err);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Send OTP for verification
const sendVerificationOTP = async (req, res) => {
    try {
        const { email, purpose = 'verification' } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        const result = await emailService.sendOTP(email, purpose);
        
        if (!result.success) {
            return res.status(500).json({ message: 'Failed to send OTP', error: result.error });
        }
        
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error('Error sending OTP:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Verify OTP
const verifyOTP = async (req, res) => {
    try {
        const { email, otp, purpose = 'verification' } = req.body;
        
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }
        
        const result = emailService.verifyOTP(email, otp, purpose);
        
        if (!result.valid) {
            return res.status(400).json({ message: result.message });
        }
        
        res.status(200).json({ message: 'OTP verified successfully' });
    } catch (err) {
        console.error('Error verifying OTP:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reset password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP and new password are required' });
        }
        
        // Check if user exists with this email
        const user = await profileModel.getProfileByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Verify OTP
        const otpResult = emailService.verifyOTP(email, otp, 'reset-password');
        if (!otpResult.valid) {
            return res.status(400).json({ message: otpResult.message || 'Invalid or expired verification code' });
        }
        
        // Hash new password and update
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        const result = await profileModel.updatePassword(email, hashedPassword);
        
        if (!result) {
            return res.status(500).json({ message: 'Failed to update password' });
        }
        
        res.status(200).json({ 
            message: 'Password reset successful',
            username: result.username
        });
    } catch (err) {
        console.error('Error in password reset:', err);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};

// Check OTP status (debugging route)
const checkOTP = (req, res) => {
    try {
        const email = req.params.email;
        const info = emailService.getStoredOTPInfo(email);
        res.status(200).json(info);
    } catch (err) {
        console.error('Error checking OTP:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    signup,
    login,
    sendVerificationOTP,
    verifyOTP,
    resetPassword,
    checkOTP
};