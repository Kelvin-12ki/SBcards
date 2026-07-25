import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import CameraView from '@/components/scanner/CameraView';
import ScanResults from '@/components/scanner/ScanResults';
import Spinner from '@/components/ui/Spinner';
import { preprocessImage, preprocessImageAggressive } from '@/utils/imagePreprocessor';
import { parseCardText, type ParsedCardData } from '@/utils/cardParser';
import { createCard } from '@/api/cards';
import toast from 'react-hot-toast';

type ScanPhase = 'camera' | 'processing' | 'review' | 'saving';

const ScanCardPage: React.FC = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<ScanPhase>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCardData | null>(null);

  /** Convert a data URL string to an HTMLCanvasElement. */
  const dataURLToCanvas = (dataUrl: string): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2d context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = dataUrl;
    });
  };

  // Lazy Tesseract worker — created once, reused for retakes
  const workerRef = useRef<Tesseract.Worker | null>(null);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const getOrCreateWorker = async (): Promise<Tesseract.Worker> => {
    if (!workerRef.current) {
      workerRef.current = await Tesseract.createWorker('eng');
      await workerRef.current.setParameters({ tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK });
    }
    return workerRef.current;
  };

  const handleCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    setPhase('processing');

    try {
      // Convert captured data URL to canvas for preprocessing
      const canvas = await dataURLToCanvas(imageData);

      // First pass — standard preprocessing
      const preprocessed1 = preprocessImage(canvas);
      const worker = await getOrCreateWorker();
      const result1 = await worker.recognize(preprocessed1);
      const text1 = result1.data.text;
      const confidence1 = result1.data.confidence ?? 0;

      let finalText: string;

      // Second pass — aggressive preprocessing if confidence is low
      if (confidence1 < 60) {
        const preprocessed2 = preprocessImageAggressive(canvas);
        const result2 = await worker.recognize(preprocessed2);
        const text2 = result2.data.text;
        const confidence2 = result2.data.confidence ?? 0;

        // Use whichever result has higher confidence
        finalText = confidence2 > confidence1 ? text2 : text1;
      } else {
        finalText = text1;
      }

      const parsed = parseCardText(finalText);
      setParsedData(parsed);
      setPhase('review');
    } catch (err) {
      console.error('OCR error:', err);
      toast.error('Could not read card. Please try again.');
      setPhase('camera');
    }
  };

  const handleCameraError = (error: string) => {
    toast.error(error);
  };

  const handleConfirm = async (data: ParsedCardData) => {
    setPhase('saving');

    try {
      await createCard(data);
      toast.success('Card created from scan!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save card.');
      setPhase('review');
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setParsedData(null);
    setPhase('camera');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <h1 className="mb-8 flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight text-gradient-gold">
        <svg
          className="h-8 w-8 text-gold"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
          />
        </svg>
        Scan Business Card
      </h1>

      {/* Phase: Camera */}
      {phase === 'camera' && (
        <CameraView onCapture={handleCapture} onError={handleCameraError} />
      )}

      {/* Phase: Processing */}
      {phase === 'processing' && capturedImage && (
        <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl">
          <img
            src={capturedImage}
            alt="Captured card"
            className="w-full object-cover"
          />
          {/* Scan line overlay on the frozen image */}
          <div className="absolute inset-0 z-10">
            <div className="scan-line" />
          </div>
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40">
            <Spinner size="lg" />
            <p className="mt-4 text-sm text-text-primary">Analyzing...</p>
          </div>
        </div>
      )}

      {/* Phase: Review */}
      {phase === 'review' && parsedData && capturedImage && (
        <ScanResults
          capturedImage={capturedImage}
          parsedData={parsedData}
          onConfirm={handleConfirm}
          onRetake={handleRetake}
          loading={false}
        />
      )}

      {/* Phase: Saving (shows review with loading spinner on button) */}
      {phase === 'saving' && parsedData && capturedImage && (
        <ScanResults
          capturedImage={capturedImage}
          parsedData={parsedData}
          onConfirm={handleConfirm}
          onRetake={handleRetake}
          loading={true}
        />
      )}
    </div>
  );
};

export default ScanCardPage;
