import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '@/components/ui/Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('customer' | 'vendor' | 'both')[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, activeRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loading /></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const effectiveRole = user.role || activeRole || 'customer';

  if (allowedRoles && !allowedRoles.includes(effectiveRole) && !allowedRoles.includes('both')) {
    // Redirect based on role if they try to access a page they don't have access to
    return <Navigate to={effectiveRole === 'vendor' ? '/vendedor/dashboard' : '/cliente/home'} replace />;
  }

  return <>{children}</>;
};
