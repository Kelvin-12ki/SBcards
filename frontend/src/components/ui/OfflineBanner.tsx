import React from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { WifiOff } from 'lucide-react';

const OfflineBanner: React.FC = () => {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 text-amber-400 text-sm font-medium backdrop-blur-sm">
      <WifiOff className="h-4 w-4" />
      <span>You're offline — showing cached data</span>
    </div>
  );
};

export default OfflineBanner;
