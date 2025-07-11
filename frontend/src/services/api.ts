import axios from 'axios';

// In development, use relative URLs to go through Vite proxy
// In production, use the full URL
const API_BASE_URL = import.meta.env.DEV 
  ? '/api'  // Relative URL for Vite proxy
  : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout for AI model responses
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      // Rate limiting
      return Promise.reject(new Error('Rate limit exceeded. Please try again later.'));
    }
    
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    return Promise.reject(error);
  }
);

export default api; 