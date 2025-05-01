const profileModel = require('../models/profileModel');
const platformModel = require('../models/platformModel');
const axios = require('axios');

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

const getPlatforms = async (req, res) => {
    try {
        const platforms = await platformModel.getAllPlatforms();
        res.status(200).json({ platforms });
    } catch (err) {
        console.error('Error fetching platforms:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserAccounts = async (req, res) => {
    try {
        const accounts = await profileModel.getUserAccounts(req.user.username);
        res.status(200).json({ accounts });
    } catch (err) {
        console.error('Error fetching user accounts:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const addUserAccount = async (req, res) => {
    try {
        const { platformId, platformUsername, profileUrl } = req.body;
        
        if (!platformId || !platformUsername) {
            return res.status(400).json({ message: 'Platform ID and username are required' });
        }
        
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

const updateUserAccount = async (req, res) => {
    try {
        const { platformId } = req.params;
        const { platformUsername, profileUrl } = req.body;
        
        if (!platformUsername) {
            return res.status(400).json({ message: 'Platform username is required' });
        }
        
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

const deleteUserAccount = async (req, res) => {
    try {
        const { platformId } = req.params;
        
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

const getAllProfiles = async (req, res) => {
    try {
        const profiles = await profileModel.getAllProfiles();
        res.status(200).json({ profiles });
    } catch (err) {
        console.error('Error fetching profiles:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getCodeforcesStats = async (req, res) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        
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

const getLeetcodeStats = async (req, res) => {
    try {
        const { username } = req.params;
        
        if (!username) {
            return res.status(400).json({ message: 'Username is required' });
        }
        
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

const getCombinedStats = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const accounts = await profileModel.getUserAccounts(userId);
        
        if (!accounts || accounts.length === 0) {
            return res.status(404).json({ message: 'No accounts found for this user' });
        }
        
        const stats = { platforms: {} };
        
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

const updateProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const { firstName, lastName, email, profilePic } = req.body;
        
        if (!firstName && !lastName && !email && !profilePic) {
            return res.status(400).json({ message: 'No update data provided' });
        }
        
        const existingProfile = await profileModel.getProfileById(userId);
        if (!existingProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
        
        if (req.user && req.user.username !== userId && !req.user.is_admin) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }
        
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

// Search for users by username or name
const searchUsers = async (req, res) => {
    try {
        const { searchTerm } = req.query;
        
        let users;
        // If searchTerm is empty, return all users (except current user)
        if (!searchTerm || searchTerm.trim().length === 0) {
            users = await profileModel.getAllProfiles();
            // Filter out the current user
            users = users.filter(user => user.username !== req.user.username);
        } else {
            users = await profileModel.searchUsers(searchTerm, req.user.username);
        }
        
        // For each user, check if they are already friends with the current user
        const usersWithFriendshipStatus = await Promise.all(users.map(async (user) => {
            const isFriend = await profileModel.checkFriendship(req.user.username, user.username);
            return {
                ...user,
                isFriend
            };
        }));
        
        res.status(200).json({ users: usersWithFriendshipStatus });
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add a friend
const addFriend = async (req, res) => {
    try {
        const { friendUsername } = req.params;
        
        if (!friendUsername) {
            return res.status(400).json({ message: 'Friend username is required' });
        }
        
        // Check if the friend exists
        const friendProfile = await profileModel.getProfileByUsername(friendUsername);
        if (!friendProfile) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Check if they're already friends
        const alreadyFriends = await profileModel.checkFriendship(req.user.username, friendUsername);
        if (alreadyFriends) {
            return res.status(400).json({ message: 'Already friends with this user' });
        }
        
        // Add the friendship
        await profileModel.addFriend(req.user.username, friendUsername);
        
        res.status(200).json({ 
            message: 'Friend added successfully',
            friend: {
                username: friendProfile.username,
                firstName: friendProfile.first_name,
                lastName: friendProfile.last_name,
                profilePic: friendProfile.profile_pic
            }
        });
    } catch (err) {
        console.error('Error adding friend:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove a friend
const removeFriend = async (req, res) => {
    try {
        const { friendUsername } = req.params;
        
        if (!friendUsername) {
            return res.status(400).json({ message: 'Friend username is required' });
        }
        
        // Check if they're friends
        const areFriends = await profileModel.checkFriendship(req.user.username, friendUsername);
        if (!areFriends) {
            return res.status(400).json({ message: 'Not friends with this user' });
        }
        
        // Remove the friendship
        await profileModel.removeFriend(req.user.username, friendUsername);
        
        res.status(200).json({ message: 'Friend removed successfully' });
    } catch (err) {
        console.error('Error removing friend:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all friends
const getUserFriends = async (req, res) => {
    try {
        const friends = await profileModel.getUserFriends(req.user.username);
        res.status(200).json({ friends });
    } catch (err) {
        console.error('Error getting user friends:', err);
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
    updateProfile,
    searchUsers,
    addFriend,
    removeFriend,
    getUserFriends
};