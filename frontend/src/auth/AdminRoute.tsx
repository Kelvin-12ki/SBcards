import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './useAuth';
import apiClient from '@/api/client';

/**
 * Route guard for admin panel.
 * If no admin exists, shows a "Claim Admin" button.
 * If admin exists but user isn't admin, redirects to dashboard.
 */
const AdminRoute: React.FC = () => {
  const { user, loading, refreshUser } = useAuth();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

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

  if (user.role === 'admin') {
    return <Outlet />;
  }

  // Not admin — offer to claim admin if no admin exists yet
  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { data } = await apiClient.post('/auth/bootstrap-admin');
      if (data.claimed && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        await refreshUser();
        setClaimed(true);
        window.location.reload();
      } else {
        alert('Admin already exists. Contact the existing admin to get access.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to claim admin role');
    } finally {
      setClaiming(false);
    }
  };

  if (claimed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome to SBCards Admin</h2>
        <p className="text-text-secondary">Click below to become the first admin.</p>
      </div>
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-black font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {claiming ? 'Setting up...' : 'Claim Admin Access'}
      </button>
    </div>
  );
};

export default AdminRoute;
