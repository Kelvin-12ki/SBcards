import React from 'react';
import { cn } from '@/utils/helpers';
import type { Card } from '@/types/card';

export interface NeonTemplateProps {
  card: Partial<Card>;
  className?: string;
}

const NeonTemplate: React.FC<NeonTemplateProps> = ({ card, className }) => {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-2xl shadow-2xl',
        'aspect-[1.75/1]',
        className,
      )}
      style={{
        background: '#0D1B2A',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── SVG gradient swooshes ── */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 500 286"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="neonStreak1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF6EC7" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#00F5FF" />
            </linearGradient>
            <linearGradient id="neonStreak2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F5FF" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#FF6EC7" />
            </linearGradient>
            <linearGradient id="neonStreak3" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#FF6EC7" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.2" />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Large flowing streak 1 */}
          <path
            d="M-20 60 C100 20 180 160 320 100 C420 60 480 180 520 140 L520 0 L-20 0 Z"
            fill="url(#neonStreak1)"
            opacity="0.7"
            filter="url(#neonGlow)"
          />
          {/* Large flowing streak 2 */}
          <path
            d="M-20 286 C120 220 200 120 380 200 C450 230 500 180 520 200 L520 286 Z"
            fill="url(#neonStreak2)"
            opacity="0.6"
            filter="url(#neonGlow)"
          />
          {/* Subtle background streak */}
          <path
            d="M-20 180 C150 140 250 220 400 160 C480 130 500 160 520 150 L520 286 L-20 286 Z"
            fill="url(#neonStreak3)"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* ── Additional glow streaks behind content ── */}
      <div
        className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,110,199,0.25) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <div
        className="absolute bottom-[10%] right-[5%] w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,245,255,0.2) 0%, transparent 70%)',
          filter: 'blur(25px)',
        }}
      />

      {/* ── Content ── */}
      <div className="absolute inset-0 z-10 flex flex-col justify-center px-8 py-6">
        {/* Name in white */}
        <h3
          className="text-[18px] font-extrabold text-white leading-tight tracking-tight truncate drop-shadow-lg"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          {card.fullName || 'Your Name'}
        </h3>

        {/* Role in gradient pill badge */}
        {(card.role || card.headline) && (
          <span
            className="inline-block self-start mt-2 rounded-full px-3 py-0.5 text-[10px] font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #FF6EC7, #3B82F6)',
            }}
          >
            {card.role || card.headline}
          </span>
        )}

        {card.company && (
          <p className="text-[11px] text-[#8E8E93] font-medium mt-1.5 truncate">
            {card.company}
          </p>
        )}

        {/* Divider with gradient */}
        <div className="h-[2px] w-20 rounded-full my-3 overflow-hidden">
          <div
            className="h-full w-full"
            style={{
              background: 'linear-gradient(90deg, #FF6EC7, #3B82F6, #00F5FF)',
            }}
          />
        </div>

        {/* Contact info with colored icons */}
        <div className="space-y-1.5">
          {card.phone && (
            <div className="flex items-center gap-2.5">
              <svg className="h-3.5 w-3.5 text-[#00F5FF] flex-shrink-0 drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span className="text-[11px] text-white/80 font-medium drop-shadow-md">{card.phone}</span>
            </div>
          )}
          {card.email && (
            <div className="flex items-center gap-2.5">
              <svg className="h-3.5 w-3.5 text-[#FF6EC7] flex-shrink-0 drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="text-[11px] text-white/80 font-medium truncate drop-shadow-md">{card.email}</span>
            </div>
          )}
          {card.website && (
            <div className="flex items-center gap-2.5">
              <svg className="h-3.5 w-3.5 text-[#3B82F6] flex-shrink-0 drop-shadow-lg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              <span className="text-[11px] text-white/80 font-medium truncate drop-shadow-md">{card.website}</span>
            </div>
          )}
        </div>

        {/* QR placeholder */}
        <div className="absolute bottom-5 right-6">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeonTemplate;
