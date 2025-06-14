
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRole?: 'stakeholder' | 'product_manager' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredRole }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show loading spinner while checking authentication
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-tnq-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if the user has the required role
  if (requiredRole) {
    if (requiredRole === 'admin' && user.role !== 'admin') {
      return <Navigate to="/unauthorized" replace />;
    }

    if (requiredRole === 'product_manager' && 
        user.role !== 'product_manager' && 
        user.role !== 'admin') {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return element;
};

export default ProtectedRoute;
