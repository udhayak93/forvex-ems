import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader } from './Loader';
import { ShieldAlert } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullScreen message="Authenticating session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-4 m-4 nexus-card text-center">
        <ShieldAlert size={48} color="#ef4444" className="mx-auto mb-3" />
        <h4 className="fw-bold text-danger">Access Restricted</h4>
        <p className="text-muted" style={{ maxWidth: 450, margin: '0 auto' }}>
          Your current role (<strong>{user.role}</strong>) does not have sufficient permission to access this module.
        </p>
      </div>
    );
  }

  return children;
};
