import React from 'react';
import { cn } from '@/utils/helpers';
import type { Card } from '@/types/card';

export interface BoldWaveTemplateProps {
  card: Partial<Card>;
  className?: string;
}

const BoldWaveTemplate: React.FC<BoldWaveTemplateProps> = ({ card, className }) => {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl shadow-2xl',
        'aspect-[1.75/1]',
        className,
      )}
      style={{
        background: '#1A1A2E',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── SVG red wave curves on left side ── */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 500 286"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Large sweeping wave */}
          <path
            d="M0 0 C80 60 120 200 0 286 L160 286 C260 180 220 60 160 0 Z"
            fill="#E63946"
            opacity="0.9"
          />
          {/* Secondary wave behind */}
          <path
            d="M0 40 C120 100 100 200 0 286 L100 286 C200 200 180 80 100 40 Z"
            fill="#E63946"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* ── White panel right ── */}
      <div className="absolute right-0 top-0 bottom-0 w-[42%] bg-white rounded-r-2xl z-10 flex flex-col justify-center px-5 py-5">
        {/* Name */}
        <h3
          className="text-[16px] font-extrabold text-[#E63946] leading-tight truncate"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          {card.fullName || 'Your Name'}
        </h3>
        {(card.role || card.headline) && (
          <p className="text-[11px] font-medium text-[#636366] mt-0.5 truncate">
            {card.role || card.headline}
          </p>
        )}
        {card.company && (
          <p className="text-[10px] text-[#8E8E93] font-medium mt-0.5 truncate">
            {card.company}
          </p>
        )}

        {/* Divider */}
        <div className="h-[2px] w-10 bg-[#E63946] rounded-full my-3" />

        {/* Contact details with icons */}
        <div className="space-y-1.5">
          {card.phone && (
            <div className="flex items-center gap-2">
              <svg className="h-3 w-3 text-[#E63946] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span className="text-[11px] text-[#1c1c1e]/70 font-medium">{card.phone}</span>
            </div>
          )}
          {card.email && (
            <div className="flex items-center gap-2">
              <svg className="h-3 w-3 text-[#E63946] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="text-[11px] text-[#1c1c1e]/70 font-medium truncate">{card.email}</span>
            </div>
          )}
          {card.website && (
            <div className="flex items-center gap-2">
              <svg className="h-3 w-3 text-[#E63946] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              <span className="text-[11px] text-[#1c1c1e]/70 font-medium truncate">{card.website}</span>
            </div>
          )}
        </div>

        {/* QR placeholder */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-[#E63946]/10 flex items-center justify-center border border-[#E63946]/20">
            <svg className="h-4 w-4 text-[#E63946]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
            </svg>
          </div>
          <span className="text-[9px] text-[#8E8E93] font-medium">Scan to share</span>
        </div>
      </div>
    </div>
  );
};

export default BoldWaveTemplate;
