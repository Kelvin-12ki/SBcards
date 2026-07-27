import React from 'react';
import { cn } from '@/utils/helpers';
import type { Card } from '@/types/card';

export interface CorporateTemplateProps {
  card: Partial<Card>;
  className?: string;
}

const CorporateTemplate: React.FC<CorporateTemplateProps> = ({ card, className }) => {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl shadow-2xl',
        'aspect-[1.75/1]',
        className,
      )}
      style={{
        background: '#2D3436',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Angular blue accent strips ── */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 500 286"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-left blue polygon */}
          <polygon points="0,0 180,0 0,100" fill="#0984E3" opacity="0.8" />
          {/* Bottom-right blue polygon */}
          <polygon points="500,286 320,286 500,186" fill="#0984E3" opacity="0.8" />
          {/* Thin accent line top */}
          <rect x="0" y="0" width="500" height="4" fill="#0984E3" />
          {/* Thin accent line bottom */}
          <rect x="0" y="282" width="500" height="4" fill="#0984E3" />
          {/* Vertical accent bar */}
          <rect x="45" y="0" width="3" height="286" fill="#0984E3" opacity="0.6" />
        </svg>
      </div>

      {/* ── Content ── */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-10 py-6">
        {/* Name */}
        <h3
          className="text-[18px] font-bold text-white leading-tight tracking-tight truncate"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          {card.fullName || 'Your Name'}
        </h3>
        {(card.role || card.headline) && (
          <p className="text-[12px] font-medium text-[#B0BEC5] mt-1 truncate">
            {card.role || card.headline}
          </p>
        )}
        {card.company && (
          <p className="text-[11px] text-[#78909C] font-medium mt-0.5 truncate">
            {card.company}
          </p>
        )}

        {/* Divider */}
        <div className="h-[2px] w-16 bg-[#0984E3] rounded-full my-3" />

        {/* Contact info with white icons */}
        <div className="space-y-1.5 max-w-[70%]">
          {card.phone && (
            <div className="flex items-center gap-2.5">
              <svg className="h-3.5 w-3.5 text-[#0984E3] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span className="text-[11px] text-[#ECEFF1] font-medium">{card.phone}</span>
            </div>
          )}
          {card.email && (
            <div className="flex items-center gap-2.5">
              <svg className="h-3.5 w-3.5 text-[#0984E3] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="text-[11px] text-[#ECEFF1] font-medium truncate">{card.email}</span>
            </div>
          )}
          {card.website && (
            <div className="flex items-center gap-2.5">
              <svg className="h-3.5 w-3.5 text-[#0984E3] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              <span className="text-[11px] text-[#ECEFF1] font-medium truncate">{card.website}</span>
            </div>
          )}
        </div>

        {/* QR placeholder */}
        <div className="absolute bottom-5 right-6">
          <div className="h-9 w-9 rounded bg-[#0984E3]/10 flex items-center justify-center border border-[#0984E3]/30">
            <svg className="h-5 w-5 text-[#0984E3]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateTemplate;
