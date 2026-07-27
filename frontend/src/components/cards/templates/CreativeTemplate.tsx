import React from 'react';
import { cn } from '@/utils/helpers';
import type { Card } from '@/types/card';

export interface CreativeTemplateProps {
  card: Partial<Card>;
  className?: string;
}

const CreativeTemplate: React.FC<CreativeTemplateProps> = ({ card, className }) => {
  const initials = card.fullName
    ? card.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl shadow-2xl',
        'aspect-[1.75/1]',
        className,
      )}
      style={{
        background: '#000000',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Left panel (black) + Right panel (white) ── */}
      <div className="absolute inset-0 flex">
        {/* Left half - black */}
        <div className="w-1/2 bg-black relative">
          {/* Orange curved SVG divider */}
          <svg
            className="absolute right-0 top-0 h-full"
            style={{ width: '40px', right: '-20px' }}
            viewBox="0 0 40 286"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 0 C40 70 40 216 0 286 L40 286 L40 0 Z" fill="#F39C12" />
          </svg>

          {/* Circular photo area with orange border */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {card.avatarUrl ? (
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-[#F39C12] shadow-lg">
                <img
                  src={card.avatarUrl}
                  alt={card.fullName || 'Profile'}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-full bg-[#F39C12]/20 border-2 border-[#F39C12] flex items-center justify-center text-lg font-bold text-[#F39C12] shadow-lg">
                {initials}
              </div>
            )}
          </div>
        </div>

        {/* Right half - white */}
        <div className="w-1/2 bg-white relative z-10 flex flex-col justify-center px-5 py-5">
          {/* Name in orange */}
          <h3
            className="text-[15px] font-extrabold text-[#F39C12] leading-tight truncate"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
          >
            {card.fullName || 'Your Name'}
          </h3>
          {(card.role || card.headline) && (
            <p className="text-[11px] font-medium text-[#2D3436] mt-0.5 truncate">
              {card.role || card.headline}
            </p>
          )}
          {card.company && (
            <p className="text-[10px] text-[#636366] font-medium mt-0.5 truncate">
              {card.company}
            </p>
          )}

          {/* Divider */}
          <div className="h-[2px] w-10 bg-[#F39C12] rounded-full my-2.5" />

          {/* Contact details with orange icons */}
          <div className="space-y-1">
            {card.phone && (
              <div className="flex items-center gap-2">
                <svg className="h-3 w-3 text-[#F39C12] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span className="text-[10px] text-[#1c1c1e]/70 font-medium">{card.phone}</span>
              </div>
            )}
            {card.email && (
              <div className="flex items-center gap-2">
                <svg className="h-3 w-3 text-[#F39C12] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-[10px] text-[#1c1c1e]/70 font-medium truncate">{card.email}</span>
              </div>
            )}
          </div>

          {/* QR placeholder bottom-left (inside white area) */}
          <div className="absolute bottom-3 left-3">
            <div className="h-7 w-7 rounded bg-[#F39C12]/10 flex items-center justify-center border border-[#F39C12]/20">
              <svg className="h-3.5 w-3.5 text-[#F39C12]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeTemplate;
