import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { qrConnect } from '@/api/connections';
import { sendPasswordReset, getFirebaseAuthErrorMessage } from '@/api/auth';
import { showApiError } from '@/utils/errorHandler';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import NetworkIllustration from '@/components/ui/NetworkIllustration';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);

  const handlePostLogin = async () => {
    const ref = searchParams.get('ref');
    const redirect = searchParams.get('redirect');

    if (redirect && redirect.includes('/scan?ref=')) {
      navigate(redirect, { replace: true });
    } else if (ref) {
      try {
        await qrConnect(ref);
        toast.success('Connected!');
        navigate('/connections', { replace: true });
      } catch (err: any) {
        showApiError(err, 'Logged in but could not auto-connect.');
        navigate('/dashboard', { replace: true });
      }
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      await handlePostLogin();
    } catch (err: any) {
      console.error('[LoginPage] Login failed:', err);
      const message = getFirebaseAuthErrorMessage(err);
      setError(message);
      setDebugInfo(err?.code || err?.message || 'Unknown error');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    setDebugInfo('');
    try {
      await loginWithGoogle();
      toast.success('Welcome back!');
      await handlePostLogin();
    } catch (err: any) {
      console.error('[LoginPage] Google login failed:', err);
      const message = getFirebaseAuthErrorMessage(err);
      setError(message);
      setDebugInfo(err?.code || err?.message || 'Unknown error');
      toast.error(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Enter your email above, then click "Send Reset Link".');
      return;
    }
    setResetLoading(true);
    setError('');
    setDebugInfo('');
    try {
      await sendPasswordReset(email.trim());
      setResetSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      console.error('[LoginPage] Password reset failed:', err);
      const message = getFirebaseAuthErrorMessage(err);
      setError(message);
      setDebugInfo(err?.code || err?.message || 'Unknown error');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Magical ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-neon-purple/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-neon-cyan/5 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.25] max-md:opacity-[0.12]">
        <NetworkIllustration />
      </div>
      <div className="w-full max-w-sm relative z-10">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
            SB<span className="text-gradient-gold">Cards</span>
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            Digital Business Cards &amp; Smart Networking
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border-subtle bg-surface-1 p-5 sm:p-8 card-magical"
        >
          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          {debugInfo && (
            <div className="rounded-xl bg-surface-2/50 border border-border-subtle px-4 py-2 text-xs text-text-tertiary font-mono">
              Debug: {debugInfo}
            </div>
          )}

          {resetSent && (
            <div className="rounded-xl bg-success/10 border border-success/20 px-4 py-2.5 text-sm text-success">
              Password reset link sent to <strong>{email}</strong>. Check your inbox (and spam folder).
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-[38px] text-text-tertiary hover:text-text-primary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Forgot password link */}
          <div className="flex justify-end -mt-2">
            <button
              type="button"
              onClick={() => {
                setError('');
                setDebugInfo('');
                setResetSent(false);
                setShowResetForm((prev) => !prev);
              }}
              className="text-xs text-neon-cyan hover:text-neon-cyan/80 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Inline password reset form */}
          {showResetForm && (
            <div className="rounded-xl bg-surface-2/50 border border-border-subtle p-4 space-y-3">
              {resetSent ? (
                <p className="text-xs text-success">
                  Reset link sent! Check your inbox.
                </p>
              ) : (
                <>
                  <p className="text-xs text-text-secondary">
                    Enter your email above and we&apos;ll send you a password reset link.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    loading={resetLoading}
                    onClick={handlePasswordReset}
                  >
                    Send Reset Link
                  </Button>
                </>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            Sign In
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface-1 px-2 text-text-tertiary">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleGoogleLogin}
            loading={googleLoading}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-neon-cyan hover:text-neon-cyan/80 font-semibold transition-colors"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
