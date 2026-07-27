import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { qrConnect } from '@/api/connections';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import NetworkIllustration from '@/components/ui/NetworkIllustration';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password.trim(), displayName.trim() || undefined);

      // Check for QR ref from query param or sessionStorage
      const ref = searchParams.get('ref') || sessionStorage.getItem('qr_ref');
      if (ref) {
        try {
          await qrConnect(ref);
          sessionStorage.removeItem('qr_ref');
          toast.success('Account created! You\'re now connected.');
          navigate('/connections', { replace: true });
        } catch (connErr: any) {
          const connMessage =
            connErr?.response?.data?.message ||
            connErr?.message ||
            'Account created but could not auto-connect.';
          toast.error(connMessage);
          navigate('/connections', { replace: true });
        }
      } else {
        toast.success('Account created successfully!');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Registration failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Magical ambient glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-neon-pink/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-neon-blue/5 blur-[120px] pointer-events-none" />

      {/* Network illustration background — full screen */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.25] max-md:opacity-[0.12]">
        <NetworkIllustration />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-text-primary">
            SB<span className="text-gradient-gold">Cards</span>
          </h1>
          <p className="mt-2 text-base text-text-secondary">
            Create your account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border-subtle bg-surface-1 p-8 card-magical"
        >
          {error && (
            <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          <Input
            label="Display Name"
            placeholder="John Doe"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            Create Account
          </Button>

          <p className="text-center text-sm text-text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-neon-cyan hover:text-neon-cyan/80 font-semibold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
