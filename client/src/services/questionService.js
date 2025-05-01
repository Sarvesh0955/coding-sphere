import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const questionService = {
  // Get all questions with optional filters
  getAllQuestions: async (filters = {}) => {
    try {
      // Convert filters object to query string parameters
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Updated endpoint to match backend route
      const response = await axios.get(`${API_URL}/questions/all?${params.toString()}`, 
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  // Get question by platform ID and question ID
  getQuestionById: async (platformId, questionId) => {
    try {
      const response = await axios.get(`${API_URL}/questions/${platformId}/${questionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  },

  // Create a new question
  createQuestion: async (questionData) => {
    try {
      const response = await axios.post(
        `${API_URL}/questions`, 
        questionData, 
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },

  // Update an existing question
  updateQuestion: async (platformId, questionId, questionData) => {
    try {
      const response = await axios.put(
        `${API_URL}/questions/${platformId}/${questionId}`, 
        questionData, 
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  // Delete a question
  deleteQuestion: async (platformId, questionId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/questions/${platformId}/${questionId}`, 
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  // Get all available topics
  getAllTopics: async () => {
    try {
      const response = await axios.get(`${API_URL}/questions/topics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching topics:', error);
      throw error;
    }
  },

  // Get all available companies
  getAllCompanies: async () => {
    try {
      const response = await axios.get(`${API_URL}/questions/companies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },
  
  // Create a new company
  createCompany: async (companyName) => {
    try {
      const response = await axios.post(
        `${API_URL}/questions/companies`,
        { companyName },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },
  
  // Get all available platforms
  getAllPlatforms: async () => {
    try {
      const response = await axios.get(`${API_URL}/questions/platforms`);
      return response.data;
    } catch (error) {
      console.error('Error fetching platforms:', error);
      throw error;
    }
  },

  // Get solved questions for the current user
  getSolvedQuestions: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/questions/solved`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching solved questions:', error);
      throw error;
    }
  },
  
  // Mark a question as solved
  markQuestionAsSolved: async (platformId, questionId) => {
    try {
      const response = await axios.post(
        `${API_URL}/questions/${platformId}/${questionId}/solved`,
        {},
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking question as solved:', error);
      throw error;
    }
  },
  
  // Mark a question as unsolved (remove from solved)
  markQuestionAsUnsolved: async (platformId, questionId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/questions/${platformId}/${questionId}/solved`,
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error marking question as unsolved:', error);
      throw error;
    }
  }
};

export default questionService;