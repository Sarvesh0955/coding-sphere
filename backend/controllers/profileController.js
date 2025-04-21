const profileModel = require('../models/profileModel');

// Get user's own profile
const getProfile = async (req, res) => {
    try {
        const profile = await profileModel.getProfileByUsername(req.user.username);
        
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        res.status(200).json({
            username: profile.username,
            email: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            profilePic: profile.profile_pic,
            is_admin: profile.is_admin,
            created_at: profile.created_at
        });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all available platforms
const getPlatforms = async (req, res) => {
    try {
        const platforms = await profileModel.getAllPlatforms();
        res.status(200).json({ platforms });
    } catch (err) {
        console.error('Error fetching platforms:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all user accounts
const getUserAccounts = async (req, res) => {
    try {
        const accounts = await profileModel.getUserAccounts(req.user.username);
        res.status(200).json({ accounts });
    } catch (err) {
        console.error('Error fetching user accounts:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add a user account
const addUserAccount = async (req, res) => {
    try {
        const { platformId, platformUsername, profileUrl } = req.body;
        
        if (!platformId || !platformUsername) {
            return res.status(400).json({ message: 'Platform ID and username are required' });
        }
        
        // Check if account already exists
        const existingAccount = await profileModel.getUserAccountByPlatform(req.user.username, platformId);
        if (existingAccount) {
            return res.status(409).json({ message: 'Account for this platform already exists' });
        }
        
        const account = await profileModel.addUserAccount(
            req.user.username,
            platformId,
            platformUsername,
            profileUrl
        );
        
        res.status(201).json({ message: 'Account added successfully', account });
    } catch (err) {
        console.error('Error adding user account:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a user account
const updateUserAccount = async (req, res) => {
    try {
        const { platformId } = req.params;
        const { platformUsername, profileUrl } = req.body;
        
        if (!platformUsername) {
            return res.status(400).json({ message: 'Platform username is required' });
        }
        
        // Check if account exists
        const existingAccount = await profileModel.getUserAccountByPlatform(req.user.username, platformId);
        if (!existingAccount) {
            return res.status(404).json({ message: 'Account not found' });
        }
        
        const account = await profileModel.updateUserAccount(
            req.user.username,
            platformId,
            platformUsername,
            profileUrl
        );
        
        res.status(200).json({ message: 'Account updated successfully', account });
    } catch (err) {
        console.error('Error updating user account:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a user account
const deleteUserAccount = async (req, res) => {
    try {
        const { platformId } = req.params;
        
        // Check if account exists
        const existingAccount = await profileModel.getUserAccountByPlatform(req.user.username, platformId);
        if (!existingAccount) {
            return res.status(404).json({ message: 'Account not found' });
        }
        
        await profileModel.deleteUserAccount(req.user.username, platformId);
        
        res.status(200).json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Error deleting user account:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all profiles (admin only)
const getAllProfiles = async (req, res) => {
    try {
        const profiles = await profileModel.getAllProfiles();
        res.status(200).json({ profiles });
    } catch (err) {
        console.error('Error fetching profiles:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getProfile,
    getPlatforms,
    getUserAccounts,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    getAllProfiles
};