const profileModel = require('../models/profileModel');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await profileModel.getAllProfiles();
        res.status(200).json({ users });
    } catch (err) {
        console.error('Error getting all users:', err);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};

// Delete a user (admin only)
const deleteUser = async (req, res) => {
    try {
        const { username } = req.params;
        
        // Don't allow deleting the admin itself
        if (req.user.username === username) {
            return res.status(400).json({ message: 'Cannot delete your own admin account' });
        }
        
        const result = await profileModel.deleteUser(username);
        
        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};

module.exports = {
    getAllUsers,
    deleteUser
};