const profileModel = require('../models/profileModel');
const platformModel = require('../models/platformModel');
const axios = require('axios');

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
        const platforms = await platformModel.getAllPlatforms();
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

// Get Codeforces stats for a user
const getCodeforcesStats = async (req, res) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        
        // Call Codeforces API
        const userInfo = await axios.get(`https://codeforces.com/api/user.info?handles=${username}`);
        const submissions = await axios.get(`https://codeforces.com/api/user.status?handle=${username}`);
        const ratings = await axios.get(`https://codeforces.com/api/user.rating?handle=${username}`);
        
        res.status(200).json({
            platform: 'codeforces',
            username,
            userInfo: userInfo.data,
            submissions: submissions.data,
            ratings: ratings.data
        });
    } catch (err) {
        console.error('Error fetching Codeforces stats:', err);
        
        if (err.response && err.response.status === 404) {
            return res.status(404).json({ message: 'Codeforces user not found' });
        }
        
        res.status(500).json({ message: 'Error fetching Codeforces stats' });
    }
};

// Get LeetCode stats for a user
const getLeetcodeStats = async (req, res) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        
        // Call LeetCode API
        const response = await axios.get(`https://leetcode-stats-api.herokuapp.com/${username}`);
        
        if (response.data.status === 'error') {
            return res.status(404).json({ message: 'LeetCode user not found' });
        }
        
        res.status(200).json({
            platform: 'leetcode',
            username,
            ...response.data
        });
    } catch (err) {
        console.error('Error fetching LeetCode stats:', err);
        
        if (err.response && err.response.status === 404) {
            return res.status(404).json({ message: 'LeetCode user not found' });
        }
        
        res.status(500).json({ message: 'Error fetching LeetCode stats' });
    }
};

// Get combined stats for a user
const getCombinedStats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user accounts
        const accounts = await profileModel.getUserAccounts(userId);
        
        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ message: 'No accounts found for this user' });
        }
        
        const stats = { platforms: {} };
        
        // Fetch stats for each platform account
        for (const account of accounts) {
            if (account.platform_name.toLowerCase() === 'codeforces') {
                try {
                    const userInfo = await axios.get(`https://codeforces.com/api/user.info?handles=${account.platform_username}`);
                    const submissions = await axios.get(`https://codeforces.com/api/user.status?handle=${account.platform_username}`);
                    const ratings = await axios.get(`https://codeforces.com/api/user.rating?handle=${account.platform_username}`);
                    
                    stats.platforms.codeforces = {
                        username: account.platform_username,
                        userInfo: userInfo.data,
                        submissions: submissions.data,
                        ratings: ratings.data
                    };
                } catch (error) {
                    console.error('Error fetching Codeforces stats:', error);
                    stats.platforms.codeforces = { error: 'Failed to fetch data' };
                }
            } else if (account.platform_name.toLowerCase() === 'leetcode') {
                try {
                    const response = await axios.get(`https://leetcode-stats-api.herokuapp.com/${account.platform_username}`);
                    
                    stats.platforms.leetcode = {
                        username: account.platform_username,
                        ...response.data
                    };
                } catch (error) {
                    console.error('Error fetching LeetCode stats:', error);
                    stats.platforms.leetcode = { error: 'Failed to fetch data' };
                }
            }
        }
        
        res.status(200).json(stats);
    } catch (err) {
        console.error('Error fetching combined stats:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, email, profilePic } = req.body;
        
        // Validate request
        if (!firstName && !lastName && !email && !profilePic) {
            return res.status(400).json({ message: 'No update data provided' });
        }
        
        // Check if profile exists
        const existingProfile = await profileModel.getProfileById(userId);
        if (!existingProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        // Check if user has permission to update this profile
        if (req.user && req.user.username !== userId && !req.user.is_admin) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }
        
        // Update the profile
        const updatedProfile = await profileModel.updateProfile(
            userId,
            { first_name: firstName, last_name: lastName, email, profile_pic: profilePic }
        );
        
        res.status(200).json({
            message: 'Profile updated successfully',
            profile: {
                username: updatedProfile.username,
                email: updatedProfile.email,
                firstName: updatedProfile.first_name,
                lastName: updatedProfile.last_name,
                profilePic: updatedProfile.profile_pic,
                created_at: updatedProfile.created_at
            }
        });
    } catch (err) {
        console.error('Error updating profile:', err);
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
    getAllProfiles,
    getCodeforcesStats,
    getLeetcodeStats,
    getCombinedStats,
    updateProfile
};