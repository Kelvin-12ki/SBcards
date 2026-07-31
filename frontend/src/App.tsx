import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { AuthProvider } from '@/auth/AuthProvider';
import RoutesTree from '@/routes';

const App: React.FC = () => {
  const { needRefresh, updateServiceWorker } = useRegisterSW();
  const [showRefreshPrompt] = needRefresh;

  React.useEffect(() => {
    if (!showRefreshPrompt) return;

    toast(
      () => (
        <div className="flex items-center gap-3">
          <span>New version available</span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded-lg bg-gold px-3 py-1 text-sm font-bold text-gold-ink"
          >
            Refresh
          </button>
        </div>
      ),
      { duration: Infinity },
    );
  }, [showRefreshPrompt, updateServiceWorker]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutesTree />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#141416',
              color: '#F5F5F7',
              border: '1px solid #2A2A2E',
              borderRadius: '0.75rem',
              fontFamily: 'Urbanist, Inter, system-ui, sans-serif',
            },
            error: {
              style: {
                background: '#1C1C1F',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#FCA5A5',
              },
              iconTheme: {
                primary: '#EF4444',
                secondary: '#1C1C1F',
              },
            },
          }}
        />
        <SpeedInsights />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
