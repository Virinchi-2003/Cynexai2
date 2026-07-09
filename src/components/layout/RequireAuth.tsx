import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If they are logged in but don't have permission, send them to their own dashboard
    if (user.role === 'Manager' || user.role === 'CEO') {
      return <Navigate to="/manager" replace />;
    } else if (user.role === 'Teacher') {
      return <Navigate to="/teacher" replace />;
    } else if (user.role === 'Student') {
      return <Navigate to="/student" replace />;
    } else if (user.role === 'DM') {
      return <Navigate to="/dm/dashboard" replace />;
    } else if (user.role === 'Admin') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/sales/pipeline" replace />;
    }
  }

  return <>{children}</>;
};
