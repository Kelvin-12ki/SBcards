import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import apiClient from '@/api/client';

/**
 * Route guard for admin panel.
 * If user is admin → show panel.
 * Otherwise → redirect to dashboard.
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

  if (user.role === 'admin' || user.role === 'organizer') {
    return <Outlet />;
  }

  // Not admin — redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
