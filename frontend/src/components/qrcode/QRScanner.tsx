import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const scanningRef = useRef(false);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera and auto-scan
  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (!cancelled) {
          setState('active');
          scanningRef.current = true;
          scanFrame();
        }
      } catch (err: any) {
        if (cancelled) return;
        let message = 'Could not access camera.';
        if (err.name === 'NotAllowedError') {
          message = 'Camera access denied. Please allow camera permissions in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          message = 'No camera found on this device.';
        }
        setErrorMessage(message);
        setState('error');
        onError(message);
      }
    };

    const scanFrame = () => {
      if (!scanningRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            // Extract userId from the QR data
            let userId = code.data;
            try {
              const url = new URL(code.data);
              const segments = url.pathname.split('/').filter(Boolean);
              if (segments.length > 0) {
                userId = segments[segments.length - 1];
              }
            } catch {
              // Not a URL, use the decoded text as-is
            }

            scanningRef.current = false;
            stopCamera();
            onScan(userId);
            return;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [onScan, onError, stopCamera]);

  const handleRetry = () => {
    setErrorMessage('');
    setState('initializing');
    // Force re-mount by reloading
    window.location.reload();
  };

  return (
    <div
      className={cn(
        'relative mx-auto max-w-lg overflow-hidden rounded-2xl bg-black',
        className,
      )}
    >
      {/* Hidden canvas for QR decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full"
        style={{ display: state === 'active' ? 'block' : 'none' }}
      />

      {state === 'initializing' && (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-text-secondary">Starting camera...</p>
        </div>
      )}

      {state === 'active' && (
        <div className="relative">
          {/* Scanning overlay with neon-cyan border */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-neon-cyan rounded-tl-lg" />
            <div className="absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-neon-cyan rounded-tr-lg" />
            <div className="absolute left-4 bottom-4 h-8 w-8 border-l-2 border-b-2 border-neon-cyan rounded-bl-lg" />
            <div className="absolute right-4 bottom-4 h-8 w-8 border-r-2 border-b-2 border-neon-cyan rounded-br-lg" />
            <div className="scan-line" />
          </div>

          {/* Scanning indicator */}
          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            <Spinner size="sm" />
            <span className="text-xs font-medium text-white drop-shadow-lg animate-pulse">
              Scanning...
            </span>
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
