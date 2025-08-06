import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
// Change this line at the top of the file
import axios from '../services/axios';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Fetch user profile data from the server
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      // Merge the profile data with the basic user data
      setUser(prevUser => ({
        ...prevUser,
        ...response.data
      }));
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.response && error.response.status === 401) {
        // Unauthorized, token might be invalid
        logout();
      } else {
        // For other errors, don't logout but return null and show error
        toast.error('Failed to load profile data. Please try again later.');
      }
      return null;
    }
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwt_decode(token);
        // Check if token is expired
        const currentTime = Date.now() / 1000;
        if (decoded.exp < currentTime) {
          // Token expired, log out user
          logout();
          setLoading(false);
        } else {
          // Set basic user data from token
          setUser(decoded);
          // Set authorization header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          // Fetch complete user profile data
          fetchUserProfile()
            .then(() => {
              setLoading(false);
            })
            .catch(() => {
              setLoading(false);
            });
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/login', { email, password });
      const { token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Decode token and set user
      const decoded = jwt_decode(token);
      setUser(decoded);
      
      // Set authorization header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      toast.success('Login successful!');
      navigate('/dashboard');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/register', userData);
      toast.success('Registration successful! Please log in.');
      navigate('/login');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    toast.info('You have been logged out.');
    navigate('/');
  };

  // Check if user is admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Update user data after profile changes
  const updateUser = (userData) => {
    // Update the user state with the new data
    setUser(prevUser => ({
      ...prevUser,
      name: userData.name,
      phone: userData.phone,
      department: userData.department,
      updatedAt: userData.updatedAt
    }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      isAdmin,
      updateUser,
      fetchUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};