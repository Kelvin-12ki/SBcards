import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraView from '@/components/scanner/CameraView';
import ScanResults from '@/components/scanner/ScanResults';
import { parseCardText, type ParsedCardData } from '@/utils/cardParser';
import { createCard } from '@/api/cards';
import { showApiError } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

type ScanPhase = 'camera' | 'review' | 'saving';

const ScanCardPage: React.FC = () => {
  const navigate = useNavigate();

  const [phase, setPhase] = useState<ScanPhase>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCardData | null>(null);

  const handleCapture = async (imageData: string) => {
    setCapturedImage(imageData);
    // Skip OCR — go straight to review with empty data for manual entry
    setParsedData({
      fullName: '',
      email: '',
      phone: '',
      company: '',
      role: '',
      website: '',
      linkedin: '',
      twitter: '',
      notes: '',
    });
    setPhase('review');
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
      showApiError(err, 'Failed to save card.');
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
