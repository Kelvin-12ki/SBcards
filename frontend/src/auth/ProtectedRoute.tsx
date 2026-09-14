import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Route guard that redirects unauthenticated users to /login with a returnTo
 * query param so they land on the right page after logging in.
 */
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
