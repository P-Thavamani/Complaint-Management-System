import axios from 'axios';

// Configure axios defaults
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://complaint-management-system-fcaz.onrender.com'
    : 'http://localhost:5000');

axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = 10000; // 10 seconds timeout

// Add request interceptor for auth header
axios.interceptors.request.use(
	config => {
		const token = localStorage.getItem('token');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	error => Promise.reject(error)
);

// Add response interceptor for error handling
axios.interceptors.response.use(
	response => {
		// Log successful responses for debugging
		console.log(`API Success [${response.config.method?.toUpperCase()}] ${response.config.url}:`, response.status);
		return response;
	},
	error => {
		console.error('API Error:', {
			url: error.config?.url,
			method: error.config?.method?.toUpperCase(),
			status: error.response?.status,
			data: error.response?.data,
			message: error.message
		});
		if (error.response?.status === 401) {
			console.warn('Authentication error detected');
		}
		return Promise.reject(error);
	}
);

export default axios;