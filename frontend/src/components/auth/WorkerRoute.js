import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const WorkerRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

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

    // Redirect to dashboard if not worker
    if (!user.is_worker) {
        return <Navigate to="/dashboard" replace />;
    }

    // Render children if authenticated and worker
    return children;
};

export default WorkerRoute;