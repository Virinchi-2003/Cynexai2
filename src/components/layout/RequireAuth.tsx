import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../lib/auth';
import { checkTeacherAssignment } from '../../lib/api/manager';
import { computeAccessiblePortals } from '../../lib/authUtils';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles }) => {
  const user = getCurrentUser();
  const location = useLocation();
  const [accessLevels, setAccessLevels] = useState<string[] | null>(() => {
    if (!user) return [];
    if (user.role === 'CEO') return ['CEO', 'Manager', 'Teacher', 'Sales/HR', 'DM', 'Student'];
    return computeAccessiblePortals(user.role, false);
  });

  useEffect(() => {
    if (!user) {
      setAccessLevels([]);
      return;
    }

    const checkAccess = async () => {
      const isTeacher = await checkTeacherAssignment(user.id);
      const portals = computeAccessiblePortals(user.role, isTeacher);
      setAccessLevels(portals);
    };

    checkAccess();
  }, [user?.id]);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (accessLevels === null) {
    return (
      <div className="min-h-screen bg-erp-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-erp-primary animate-spin" />
      </div>
    );
  }

  // Check if any of the allowedRoles intersect with accessLevels
  const hasAccess = allowedRoles ? allowedRoles.some(role => accessLevels.includes(role)) : true;

  if (!hasAccess) {
    if (accessLevels.includes('CEO')) return <Navigate to="/ceo/dashboard" replace />;
    if (accessLevels.includes('Manager')) return <Navigate to="/manager" replace />;
    if (accessLevels.includes('Teacher')) return <Navigate to="/teacher" replace />;
    if (accessLevels.includes('Student')) return <Navigate to="/student" replace />;
    if (accessLevels.includes('DM')) return <Navigate to="/dm/dashboard" replace />;
    if (accessLevels.includes('Admin')) return <Navigate to="/admin" replace />;
    return <Navigate to="/sales/pipeline" replace />;
  }

  return <>{children}</>;
};
