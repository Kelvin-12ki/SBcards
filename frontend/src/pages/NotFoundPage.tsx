import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Magical ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-neon-purple/8 blur-[150px] pointer-events-none" />
      <div className="text-center relative z-10">
        <div className="mb-6 inline-flex rounded-2xl gradient-magical p-5 text-white animate-glow-pulse">
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="font-display text-6xl font-black tracking-tight text-gradient-magical mb-2">404</h1>
        <h2 className="font-display text-xl font-bold text-gradient-magical mb-3">Page Not Found</h2>
        <p className="text-base text-text-secondary mb-8 max-w-sm mx-auto leading-7">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="lg">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
