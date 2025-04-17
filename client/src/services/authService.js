import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const removeToken = () => {
  localStorage.removeItem('token');
};

export const getUserFromToken = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const register = async (name, email, password, otp) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, { 
      name, 
      email, 
      password, 
      ...(otp ? { otp } : {}) // Include OTP if provided
    });
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network error' };
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network error' };
  }
};

export const logout = () => {
  removeToken();
};

export const getUserProfile = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error('No token found');
    
    const response = await axios.get(`${API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network error' };
  }
};

export const getAllUsers = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error('No token found');
    
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network error' };
  }
};

export const sendVerificationOTP = async (email, purpose = 'verification') => {
  try {
    const response = await axios.post(`${API_URL}/send-verification-otp`, { 
      email, 
      purpose 
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network error' };
  }
};

export const verifyOTP = async (email, otp, purpose = 'verification') => {
  try {
    const response = await axios.post(`${API_URL}/verify-otp`, {
      email,
      otp,
      purpose
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : { message: 'Network error' };
  }
};

// Update the verifiedRegister function to pass OTP directly to register
export const verifiedRegister = async (name, email, password, otp) => {
  try {
    // Skip separate verification and pass OTP directly to register
    return await register(name, email, password, otp);
  } catch (error) {
    throw error;
  }
};

export const authAxios = axios.create();

authAxios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);