import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '@/api/users';
import { createConnection } from '@/api/connections';
import { reportQrScan } from '@/api/qrcode';
import type { User } from '@/types/user';
import QRScanner from '@/components/qrcode/QRScanner';
import QuickConnectModal from '@/components/connections/QuickConnectModal';
import Spinner from '@/components/ui/Spinner';
import { showApiError } from '@/utils/errorHandler';
import { vibrateSuccess, vibrateError } from '@/utils/haptics';
import toast from 'react-hot-toast';

type ScanPhase = 'scanning' | 'loading_user' | 'connecting' | 'done';

const ScanQRPage: React.FC = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<ScanPhase>('scanning');
  const [scannedUser, setScannedUser] = useState<{
    userId?: string;
    displayName?: string;
    company?: string;
    role?: string;
    avatarUrl?: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleScan = async (userId: string) => {
    setPhase('loading_user');
    try {
      const user: User = await getUser(userId);
      setScannedUser({
        userId: user.id,
        displayName: user.displayName,
        company: user.company,
        role: user.jobRole,
        avatarUrl: user.avatarUrl,
      });
      vibrateSuccess();
      setModalOpen(true);
      setPhase('scanning');
    } catch (err: any) {
      showApiError(err, 'Could not find user. Please try again.');
      vibrateError();
      setPhase('scanning');
    }
  };

  const handleScanError = (error: string) => {
    showApiError(error, 'Could not start the camera. Please check your camera permissions and try again.');
  };

  const handleConnect = async (notes?: string) => {
    if (!scannedUser?.userId) return;
    setPhase('connecting');
    try {
      await createConnection({
        connectedUserId: scannedUser.userId,
        source: 'qr_scan',
        notes,
      });
      await reportQrScan(scannedUser.userId);
      vibrateSuccess();
      toast.success('Connection added!');
      navigate('/connections');
    } catch (err: any) {
      showApiError(err, 'Failed to create connection.');
      vibrateError();
      setPhase('scanning');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-gold">
        Scan QR Code
      </h1>

      {/* Scanner */}
      {phase === 'scanning' && (
        <QRScanner onScan={handleScan} onError={handleScanError} />
      )}

      {/* Loading user info */}
      {phase === 'loading_user' && (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-text-secondary">Looking up user...</p>
        </div>
      )}

      {/* Connecting */}
      {phase === 'connecting' && (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-text-secondary">Creating connection...</p>
        </div>
      )}

      {/* Quick Connect Modal */}
      <QuickConnectModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setScannedUser(null);
        }}
        scannedUser={scannedUser}
        onConnect={handleConnect}
      />
    </div>
  );
};

export default ScanQRPage;
