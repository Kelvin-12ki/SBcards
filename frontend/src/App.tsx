import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/auth/AuthProvider';
import RoutesTree from '@/routes';
import './index.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutesTree />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#141416',
              color: '#F5F5F7',
              border: '1px solid #2A2A2E',
              borderRadius: '0.75rem',
              fontFamily: 'Urbanist, Inter, system-ui, sans-serif',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
