import React, { useEffect, useState } from 'react';
import { useAuth } from '@/auth/useAuth';
import { getMyQrCode } from '@/api/qrcode';
import MyQRCode from '@/components/qrcode/MyQRCode';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

const QRCodePage: React.FC = () => {
  const { user } = useAuth();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const url = await getMyQrCode();
        setDataUrl(url);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load QR code.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header */}
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-gold">
        My QR Code
      </h1>

      {/* QR Code Display */}
      <div className="max-w-sm mx-auto space-y-6">
        {dataUrl ? (
          <MyQRCode
            dataUrl={dataUrl}
            userName={user?.displayName || user?.email}
          />
        ) : (
          <div className="card-magical rounded-2xl border border-border-subtle p-10 text-center">
            <p className="text-sm text-text-secondary">No QR code available.</p>
          </div>
        )}

        {/* Instructions */}
        <div className="card-magical rounded-2xl border border-border-subtle p-5 text-center">
          <svg
            className="mx-auto h-8 w-8 text-neon-cyan mb-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-text-secondary">
            Show this QR code to connect with others
          </p>
          <p className="text-xs text-text-tertiary mt-2">
            Other SBCards users can scan your code to instantly add you as a connection.
          </p>
        </div>

        {/* User info */}
        <div className="card-magical rounded-2xl border border-border-subtle p-5 space-y-2 text-center">
          <p className="font-display text-lg font-bold text-gradient-gold">
            {user?.displayName || 'Your Name'}
          </p>
          {user?.company && (
            <p className="text-sm text-text-secondary">{user.company}</p>
          )}
          {user?.jobRole && (
            <p className="text-sm text-text-tertiary">{user.jobRole}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
