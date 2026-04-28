import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const WorkerRoute = ({ children }) => {
    const { user, loading, isAdmin, isWorker } = useContext(AuthContext);

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

    // Admins can also access worker dashboard
    if (isAdmin()) {
        return children;
    }

    // Redirect to dashboard if not worker (check both worker and is_worker flags)
    if (!isWorker()) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default WorkerRoute;