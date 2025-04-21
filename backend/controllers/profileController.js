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
    getAllProfiles
};