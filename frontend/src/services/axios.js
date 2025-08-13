import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000';
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
<<<<<<< HEAD
axios.defaults.timeout = 10000; // 10 seconds timeout
=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a

// Add request interceptor for error handling
axios.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
<<<<<<< HEAD
  response => {
    // Log successful responses for debugging
    console.log(`API Success [${response.config.method.toUpperCase()}] ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    // Log detailed error information
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - could handle token refresh or logout here
      console.warn('Authentication error detected');
    }
    
=======
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
    return Promise.reject(error);
  }
);

export default axios;