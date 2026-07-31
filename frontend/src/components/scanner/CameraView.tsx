import React, { useEffect, useRef, useState } from 'react';
import CardOverlay from './CardOverlay';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onError: (error: string) => void;
}

type CameraState = 'initializing' | 'active' | 'captured';

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onError }) => {
  const [state, setState] = useState<CameraState>('initializing');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera on mount
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

        if (!cancelled) {
          setState('active');
        }
      } catch (err: any) {
        if (cancelled) return;

        let message = 'Could not access camera.';
        if (err.name === 'NotAllowedError') {
          message = 'Camera access denied. Please allow camera permissions in your browser settings.';
        } else if (err.name === 'NotFoundError') {
          message = 'No camera found on this device.';
        }

        onError(message);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [onError]);

  // Attach stream to video element once both are ready
  useEffect(() => {
    if (state === 'active' && streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [state]);

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      setIsCapturing(false);
      return;
    }

    // Resolution check — reject if too low
    if (video.videoWidth < 800) {
      setIsCapturing(false);
      onError('Camera resolution too low. Please use a device with at least 800px width.');
      return;
    }

    // 300ms delay to reduce motion blur
    await new Promise((resolve) => setTimeout(resolve, 300));

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    setState('captured');
    setIsCapturing(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setState('active');
  };

  const handleUsePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  return (
    <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl bg-black">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {state === 'initializing' && (
        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-text-secondary">Starting camera...</p>
        </div>
      )}

      {state === 'active' && (
        <div className="relative aspect-[4/3]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          <CardOverlay />

          {/* Capture button */}
          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
            <button
              onClick={handleCapture}
              disabled={isCapturing}
              className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-white transition-transform hover:scale-105 active:scale-95 ${
                isCapturing ? 'cursor-not-allowed opacity-60' : ''
              }`}
              aria-label="Capture photo"
            >
              <div className="h-14 w-14 rounded-full bg-white/20" />
            </button>
            {isCapturing && (
              <span className="animate-pulse text-xs font-medium text-white drop-shadow-lg">
                Hold still...
              </span>
            )}
          </div>
        </div>
      )}

      {state === 'captured' && capturedImage && (
        <div className="relative">
          <img
            src={capturedImage}
            alt="Captured business card"
            className="w-full object-cover"
          />
          <div className="flex justify-center gap-4 p-4">
            <Button variant="secondary" onClick={handleRetake}>
              Retake
            </Button>
            <Button variant="primary" onClick={handleUsePhoto}>
              Use Photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;
