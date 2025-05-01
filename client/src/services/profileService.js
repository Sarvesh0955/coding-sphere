import axios from 'axios';
import { getToken } from './authService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Set the authorization header with the JWT token
const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all available platforms
export const getAllPlatforms = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile/platforms`, {
      headers: authHeader()
    });
    return response.data.platforms;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching platforms' };
  }
};

// Get user's platform accounts
export const getUserAccounts = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile/accounts`, {
      headers: authHeader()
    });
    return response.data.accounts;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching accounts' };
  }
};

// Add a platform account
export const addUserAccount = async (platformId, platformUsername, profileUrl) => {
  try {
    const response = await axios.post(
      `${API_URL}/profile/accounts`, 
      { platformId, platformUsername, profileUrl }, 
      {
        headers: authHeader()
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error adding account' };
  }
};

// Update a platform account
export const updateUserAccount = async (platformId, platformUsername, profileUrl) => {
  try {
    const response = await axios.put(
      `${API_URL}/profile/accounts/${platformId}`, 
      { platformUsername, profileUrl }, 
      {
        headers: authHeader()
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error updating account' };
  }
};

// Delete a platform account
export const deleteUserAccount = async (platformId) => {
  try {
    const response = await axios.delete(`${API_URL}/profile/accounts/${platformId}`, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error deleting account' };
  }
};

// Function to get the authenticated user profile
export const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Function to update profile
export const updateProfile = async (username, profileData) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/profile/${username}`, profileData, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Function to get platforms
export const getPlatforms = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/profile/platforms`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Function to search for users
export const searchUsers = async (searchTerm) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/profile/search`, {
    params: { searchTerm },
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Function to get current user's friends
export const getUserFriends = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/profile/friends`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Function to add a friend
export const addFriend = async (friendUsername) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/profile/friends/${friendUsername}`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// Function to remove a friend
export const removeFriend = async (friendUsername) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`${API_URL}/profile/friends/${friendUsername}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

const profileService = {
  getAllPlatforms,
  getUserAccounts,
  addUserAccount,
  updateUserAccount,
  deleteUserAccount,
  getProfile,
  updateProfile,
  getPlatforms,
  searchUsers,
  getUserFriends,
  addFriend,
  removeFriend
};

export default profileService;