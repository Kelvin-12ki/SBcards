import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { qrConnect } from '@/api/connections';
import { showApiError } from '@/utils/errorHandler';
import { vibrateSuccess, vibrateError } from '@/utils/haptics';
import toast from 'react-hot-toast';

const ScanLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const ref = searchParams.get('ref') || sessionStorage.getItem('qr_ref');

    if (!ref) {
      navigate('/login', { replace: true });
      return;
    }

    if (user) {
      // Logged in — auto-connect
      qrConnect(ref)
        .then(() => {
          vibrateSuccess();
          toast.success('Connected!');
          sessionStorage.removeItem('qr_ref');
          navigate('/connections', { replace: true });
        })
        .catch((err: any) => {
          showApiError(err, 'Failed to connect. Please try again.');
          vibrateError();
          navigate('/connections', { replace: true });
        });
    } else {
      // Not logged in — store ref, redirect to register
      sessionStorage.setItem('qr_ref', ref);
      navigate(`/register?ref=${ref}`, { replace: true });
    }
  }, [user, loading, searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-neon-cyan/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-neon-purple/5 blur-[120px] pointer-events-none" />

      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary">
          SB<span className="text-gradient-gold">Cards</span>
        </h1>
        <p className="text-sm text-text-secondary">Setting up your connection...</p>
      </div>
    </div>
  );
};

export default ScanLandingPage;
