import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils/helpers';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

export interface QRScannerProps {
  onScan: (userId: string) => void;
  onError: (error: string) => void;
  className?: string;
}

type ScannerState = 'initializing' | 'active' | 'error';

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, className }) => {
  const [state, setState] = useState<ScannerState>('initializing');
  const [errorMessage, setErrorMessage] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;
        scannerRef.current = new Html5Qrcode('qr-scanner-element');
        if (!cancelled) {
          setState('active');
        }
      } catch (err: any) {
        if (cancelled) return;
        const message = err?.message || 'Failed to initialize QR scanner.';
        setErrorMessage(message);
        setState('error');
        onError(message);
      }
    };

    initScanner();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [onError]);

  const startScanning = async () => {
    if (isScanning || !scannerRef.current) return;
    setIsScanning(true);

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          scannerRef.current?.stop().catch(() => {});
          setIsScanning(false);

          // Extract userId from the QR data
          let userId = decodedText;
          try {
            const url = new URL(decodedText);
            const segments = url.pathname.split('/').filter(Boolean);
            if (segments.length > 0) {
              userId = segments[segments.length - 1];
            }
          } catch {
            // Not a URL, use the decoded text as-is
          }

          onScan(userId);
        },
        () => {
          // Scan failure callback (not fatal)
        },
      );
    } catch (err: any) {
      const message = err?.message || 'Failed to start QR scanner.';
      setErrorMessage(message);
      setState('error');
      onError(message);
      setIsScanning(false);
    }
  };

  const handleRetry = () => {
    setErrorMessage('');
    setIsScanning(false);
    window.location.reload();
  };

  return (
    <div
      className={cn(
        'relative mx-auto max-w-lg overflow-hidden rounded-2xl bg-black',
        className,
      )}
    >
      {/* Div for html5-qrcode to render into - must be visible for the library to work */}
      <div id="qr-scanner-element" className="w-full" />

      {state === 'initializing' && (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-text-secondary">Starting camera...</p>
        </div>
      )}

      {state === 'active' && (
        <div className="relative">
          {/* Scanning overlay with neon-cyan border - CSS positioned on top */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Corner brackets */}
            <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-neon-cyan rounded-tl-lg" />
            <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-neon-cyan rounded-tr-lg" />
            <div className="absolute left-4 bottom-4 h-8 w-8 border-l-2 border-b-2 border-neon-cyan rounded-bl-lg" />
            <div className="absolute right-4 bottom-4 h-8 w-8 border-r-2 border-b-2 border-neon-cyan rounded-br-lg" />

            {/* Scan line animation */}
            <div className="scan-line" />
          </div>

          {/* Start scanning button overlay */}
          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
            {!isScanning ? (
              <Button
                variant="primary"
                size="md"
                onClick={startScanning}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                Start Scanning
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-xs font-medium text-white drop-shadow-lg animate-pulse">
                  Scanning...
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="rounded-full bg-danger/20 p-3">
            <svg className="h-6 w-6 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-sm text-danger font-medium">{errorMessage}</p>
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
