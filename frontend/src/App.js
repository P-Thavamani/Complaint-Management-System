<<<<<<< HEAD
import React, { useContext, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Chatbot Interface
import ChatbotInterface from './components/chatbot/ChatbotInterface';

=======
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
<<<<<<< HEAD
import AdminRewardsPage from './pages/AdminRewardsPage';
import ComplaintDetail from './pages/ComplaintDetail';
import ManageComplaint from './pages/ManageComplaint';
=======
import ComplaintDetail from './pages/ComplaintDetail';
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// Protected Route Component
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
<<<<<<< HEAD
import { AuthContext } from './context/AuthContext';

function App() {
  const { user, loading, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleReload = () => {
    if (isAdmin()) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      // If still loading, then wait
      if (loading) {
        return;
      }

      // No user, go to the home page
      if (!user && location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register') {
        navigate('/');
        return;
      }
      
      if (user) {
          // Redirect admin to /admin if not already there
          if (isAdmin() && location.pathname !== '/admin' && !location.pathname.startsWith('/admin/')) {
            navigate('/admin');
            return;
          }

          // Prevent access to the /admin route if not an admin
          if (location.pathname.startsWith('/admin') && !isAdmin()) {
              navigate('/dashboard');
              return;
          }

          // Direct known users to their dashboards
          let destination = isAdmin() ? '/admin' : '/dashboard';
          if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register') {
              navigate(destination);
              return;
          }
        }
    }

    checkAuth();

  }, [user, loading, isAdmin, navigate, location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar onReload={handleReload} />
=======

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar />
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
<<<<<<< HEAD

=======
          
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
<<<<<<< HEAD

=======
          
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
          <Route path="/complaint/:id" element={
            <ProtectedRoute>
              <ComplaintDetail />
            </ProtectedRoute>
          } />
<<<<<<< HEAD

=======
          
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
<<<<<<< HEAD

=======
          
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
<<<<<<< HEAD

          <Route path="/admin/rewards" element={
            <AdminRoute>
              <AdminRewardsPage />
            </AdminRoute>
          } />

          <Route path="/admin/complaints/:id/manage" element={
            <AdminRoute>
              <ManageComplaint />
            </AdminRoute>
          } />

=======
          
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
<<<<<<< HEAD

      {/* Chatbot Interface - available on all pages when user is logged in */}
      <ChatbotInterface />
=======
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
    </div>
  );
}

export default App;