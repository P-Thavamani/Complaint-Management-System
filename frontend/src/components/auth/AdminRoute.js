import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useContext(AuthContext);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if not admin
  if (!isAdmin()) {
<<<<<<< HEAD
    return <Navigate to="/dashboard" replace />; 
=======
    return <Navigate to="/dashboard" replace />;
>>>>>>> ff5d7d2ee5773ae90cf8a051ccc6605ddc57581a
  }

  // Render children if authenticated and admin
  return children;
};

export default AdminRoute;