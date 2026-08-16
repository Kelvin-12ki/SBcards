import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Flashlight, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/helpers';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

export interface QRScannerProps {
  onScan: (userId: string) => void;
  onError: (error: string) => void;
  className?: string;
}

type ScannerState = 'initializing' | 'active' | 'error';

const SCAN_INTERVAL_MS = 100; // ~10fps — enough for QR, much less CPU

function extractUserId(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.searchParams.has('ref')) {
      const ref = url.searchParams.get('ref');
      if (ref && /^[a-f0-9]{24}$/i.test(ref)) return ref;
    }
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const last = segments[segments.length - 1];
      if (/^[a-f0-9]{24}$/i.test(last)) return last;
    }
  } catch {
    if (/^[a-f0-9]{24}$/i.test(raw.trim())) return raw.trim();
  }
  return null;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, className }) => {
  const [state, setState] = useState<ScannerState>('initializing');
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const scanningRef = useRef(false);
  const canvasReadyRef = useRef(false);
  const lastScanRef = useRef(0);

  // Torch
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  // File upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    canvasReadyRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      if (videoTrackRef.current) {
        try {
          videoTrackRef.current.applyConstraints({ advanced: [{ torch: false } as any] });
        } catch { /* ignore */ }
      }
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      videoTrackRef.current = null;
    }
  }, []);

  const handleTorchToggle = useCallback(async () => {
    const track = videoTrackRef.current;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as any] });
      setTorchOn(next);
    } catch {
      toast.error('Could not toggle flashlight');
    }
  }, [torchOn]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      let code;
      try {
        code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
      } catch {
        toast.error('Error reading QR code. Please try again.');
        URL.revokeObjectURL(url);
        return;
      }

      URL.revokeObjectURL(url);

      if (!code || !code.data) {
        toast.error('No QR code found in the image. Please try again.');
        return;
      }

      const userId = extractUserId(code.data);
      if (userId) {
        stopCamera();
        onScan(userId);
      } else {
        toast.error('QR code found but it is not a valid SBCards QR code.');
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error('Could not read the selected image.');
    };

    img.src = url;
    e.target.value = '';
  }, [onScan, stopCamera]);

  // Start camera and auto-scan
  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      const constraints = [
        { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } },
        { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } },
        { video: { facingMode: 'environment' } },
      ];

      for (const constraint of constraints) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraint);

          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = stream;

          // Detect torch support
          const track = stream.getVideoTracks()[0];
          videoTrackRef.current = track;
          try {
            const capabilities = track.getCapabilities() as any;
            setTorchSupported(capabilities.torch === true);
          } catch {
            setTorchSupported(false);
          }

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }

          if (!cancelled) {
            setState('active');
            scanningRef.current = true;
            lastScanRef.current = 0;
            canvasReadyRef.current = false;
            scanFrame(performance.now());
          }
          return;
        } catch {
          continue;
        }
      }

      if (!cancelled) {
        onError('Could not access camera. Please allow camera permissions.');
      }
    };

    const scanFrame = (timestamp: number) => {
      if (!scanningRef.current) return;

      // Throttle to ~10fps
      if (timestamp - lastScanRef.current < SCAN_INTERVAL_MS) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }
      lastScanRef.current = timestamp;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Set canvas dimensions once
          if (!canvasReadyRef.current || canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvasReadyRef.current = true;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          let code;
          try {
            code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth',
            });
          } catch {
            // jsQR threw — skip this frame, keep scanning
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
          }

          if (code && code.data) {
            const userId = extractUserId(code.data);
            if (userId) {
              scanningRef.current = false;
              stopCamera();
              onScan(userId);
              return;
            }
            // QR found but not valid userId — keep scanning
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
    // Force re-initialize without full page reload
    canvasReadyRef.current = false;
    lastScanRef.current = 0;
    setTimeout(() => setState('initializing'), 50);
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

      {/* Video element with proper aspect ratio */}
      <div className="relative aspect-[4/3]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ display: state === 'active' ? 'block' : 'none' }}
        />
      </div>

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
            {/* Torch toggle */}
            {torchSupported && (
              <button
                type="button"
                onClick={handleTorchToggle}
                className={`absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full pointer-events-auto transition-all duration-200 ${
                  torchOn
                    ? 'bg-neon-cyan text-background shadow-lg shadow-neon-cyan/50'
                    : 'bg-black/50 text-white/70 hover:bg-black/70 hover:text-white backdrop-blur-sm'
                }`}
                aria-label={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
              >
                <Flashlight className="h-5 w-5" />
              </button>
            )}

            <div className="absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-neon-cyan rounded-tl-lg" />
            <div className="absolute right-4 top-16 h-8 w-8 border-r-2 border-t-2 border-neon-cyan rounded-tr-lg" />
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

      {/* Image upload fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <div className="flex justify-center px-4 py-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold bg-surface-2 text-text-secondary border border-border-subtle hover:bg-surface-3 hover:text-neon-cyan transition-all duration-200"
        >
          <Upload className="h-4 w-4" />
          Upload QR Code
        </button>
      </div>
    </div>
  );
};

export default QRScanner;
