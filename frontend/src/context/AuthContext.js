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
<<<<<<< HEAD

=======
  
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
  // Fetch user profile data from the server
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      // Merge the profile data with the basic user data
      setUser(prevUser => ({
        ...prevUser,
        ...response.data
      }));
<<<<<<< HEAD
      if (process.env.NODE_ENV === 'development') {
        console.log("user profile data: ", response.data);
      }
=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
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

<<<<<<< HEAD
   // Load user function
   const loadUser = async () => {
=======
  // Check if user is already logged in on component mount
  useEffect(() => {
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
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
<<<<<<< HEAD
           // Set authorization header for all requests
           axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              // Fetch complete user profile data - only if user is not already set
              fetchUserProfile()
                .then(() => {
                  setLoading(false);
                })
                .catch(() => {
                  setLoading(false);
                });
          setLoading(false);
=======
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
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
        }
      } catch (error) {
        console.error('Invalid token:', error);
        logout();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
<<<<<<< HEAD
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    loadUser();
=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
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
<<<<<<< HEAD
      // Redirect based on user role
      if (decoded.is_admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
=======
      navigate('/dashboard');
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
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
<<<<<<< HEAD
    return user && user.is_admin === true;
=======
    return user && user.role === 'admin';
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
  };

  // Update user data after profile changes
  const updateUser = (userData) => {
<<<<<<< HEAD
    if (process.env.NODE_ENV === 'development') {
      console.log('Updating user with data:', userData);
    }
    // Update the user state with the new data
    setUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        name: userData.name,
        phone: userData.phone,
        department: userData.department,
        updatedAt: userData.updatedAt
      };
      console.log('Updated user state:', updatedUser);
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
=======
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
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
      logout,
      isAdmin,
      updateUser,
      fetchUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};