import React from 'react';
import { cn } from '@/utils/helpers';
import Button from '@/components/ui/Button';

export interface MyQRCodeProps {
  dataUrl: string;
  userName?: string;
  className?: string;
}

const MyQRCode: React.FC<MyQRCodeProps> = ({ dataUrl, userName, className }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        // Convert data URL to a blob for sharing
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'my-qr-code.png', { type: 'image/png' });
        await navigator.share({
          title: 'My NEXAS QR Code',
          text: `Scan my QR code to connect on NEXAS!${userName ? ` - ${userName}` : ''}`,
          files: [file],
        });
      } catch {
        // User cancelled share or sharing failed silently
      }
    } else {
      // Fallback: copy image URL to clipboard
      try {
        await navigator.clipboard.writeText(dataUrl);
      } catch {
        // Clipboard write failed
      }
    }
  };

  return (
    <div
      className={cn(
        'card-magical rounded-2xl border border-border-subtle p-6',
        'flex flex-col items-center gap-4',
        className,
      )}
    >
      {/* Gold gradient title bar */}
      <div className="w-full text-center pb-2 border-b border-border-subtle">
        <h3 className="text-lg font-bold text-gradient-gold">My QR Code</h3>
      </div>

      {/* QR code image */}
      <div className="flex items-center justify-center p-4 bg-white rounded-xl">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="My QR Code"
            className="h-48 w-48 object-contain"
          />
        ) : (
          <div className="h-48 w-48 flex items-center justify-center text-text-tertiary text-sm">
            No QR code available
          </div>
        )}
      </div>

      {/* User name */}
      {userName && (
        <p className="text-sm font-medium text-text-secondary text-center">
          {userName}
        </p>
      )}

      {/* Share button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={handleShare}
        className="w-full"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
          />
        </svg>
        Share QR Code
      </Button>
    </div>
  );
};

export default MyQRCode;
