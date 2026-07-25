import React, { useState } from 'react';
import type { ParsedCardData } from '@/utils/cardParser';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface ScanResultsProps {
  capturedImage: string;
  parsedData: ParsedCardData;
  onConfirm: (data: ParsedCardData) => void;
  onRetake: () => void;
  loading?: boolean;
}

const fieldLabels: Record<keyof ParsedCardData, string> = {
  fullName: 'Full Name',
  headline: 'Headline',
  company: 'Company',
  role: 'Role',
  email: 'Email',
  phone: 'Phone',
  website: 'Website',
  linkedinUrl: 'LinkedIn URL',
  twitterUrl: 'Twitter URL',
};

const ScanResults: React.FC<ScanResultsProps> = ({
  capturedImage,
  parsedData,
  onConfirm,
  onRetake,
  loading = false,
}) => {
  const [fields, setFields] = useState<ParsedCardData>({ ...parsedData });

  const handleChange = (key: keyof ParsedCardData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((prev) => ({ ...prev, [key]: e.target.value || undefined }));
  };

  const handleConfirm = () => {
    onConfirm(fields);
  };

  return (
    <div className="mx-auto max-w-lg">
      {/* Thumbnail + retake */}
      <div className="mb-6 flex items-center gap-4">
        <img
          src={capturedImage}
          alt="Captured card"
          className="max-h-40 rounded-xl object-cover"
        />
        <button
          onClick={onRetake}
          className="text-sm font-medium text-neon-cyan underline-offset-2 hover:underline"
        >
          Retake
        </button>
      </div>

      {/* Editable fields */}
      <div className="space-y-4">
        {(Object.keys(fieldLabels) as Array<keyof ParsedCardData>).map((key) => (
          <Input
            key={key}
            label={fieldLabels[key]}
            value={fields[key] || ''}
            onChange={handleChange(key)}
            placeholder="Not detected"
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onClick={handleConfirm}
          className="flex-1"
        >
          Create Card
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={onRetake}
          disabled={loading}
          className="flex-1"
        >
          Scan Again
        </Button>
      </div>
    </div>
  );
};

export default ScanResults;
