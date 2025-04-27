import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Set the authorization header with the JWT token
const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get all users (admin only)
const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error fetching users' };
  }
};

// Delete a user (admin only)
const deleteUser = async (username) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/users/${username}`, {
      headers: authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error deleting user' };
  }
};

// Upload CSV file with questions (admin only)
const uploadCSV = async (formData) => {
  try {
    const response = await axios.post(`${API_URL}/admin/questions/upload-csv`, formData, {
      headers: { 
        ...authHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error uploading CSV' };
  }
};

const adminService = {
  getAllUsers,
  deleteUser,
  uploadCSV
};

export default adminService;