import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { qrConnect } from '@/api/connections';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import NetworkIllustration from '@/components/ui/NetworkIllustration';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, demoLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);

      // Handle QR ref flow
      const ref = searchParams.get('ref');
      const redirect = searchParams.get('redirect');

      if (redirect && redirect.includes('/scan?ref=')) {
        navigate(redirect, { replace: true });
      } else if (ref) {
        try {
          await qrConnect(ref);
          toast.success('Connected!');
          navigate('/connections', { replace: true });
        } catch (connErr: any) {
          toast.error('Logged in but could not auto-connect.');
          navigate('/dashboard', { replace: true });
        }
      } else {
        toast.success('Welcome back!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed. Please check your credentials.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
    // Also handle ref for demo login
    const ref = searchParams.get('ref');
    if (ref) {
      qrConnect(ref).catch(() => {}); // fire-and-forget, user already navigated
    }
    toast.success('Logged in as Demo User');
    navigate('/dashboard', { replace: true });
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
            onClick={handleDemoLogin}
          >
            Demo Login
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
