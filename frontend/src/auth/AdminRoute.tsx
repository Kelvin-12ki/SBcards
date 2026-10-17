import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import apiClient from '@/api/client';

/**
 * Route guard for the admin panel.
 *
 * Admin only. Organizers used to pass here, which is what let a self-approved
 * organizer application reach account bans, the full user list, and event
 * deletion — the backend AdminGuard enforces the same rule, this is just so
 * organizers are not shown a panel that will 403 them.
 */
const AdminRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // The backend rejects these accounts too; catching it here avoids flashing
  // a panel whose first request will bounce.
  if (user.status === 'banned' || user.status === 'suspended') {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Outlet />;
  }

  // Not admin — redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
