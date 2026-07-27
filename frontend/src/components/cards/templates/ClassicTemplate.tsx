import React from 'react';
import { cn } from '@/utils/helpers';
import type { Card } from '@/types/card';

export interface ClassicTemplateProps {
  card: Partial<Card>;
  className?: string;
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({ card, className }) => {
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
        background: '#ffffff',
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Left geometric design ── */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 500 286"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon points="0,286 0,120 200,286" fill="#1B2A4A" />
          <polygon points="0,200 160,80 200,110 60,230" fill="#00BCD4" />
          <polygon points="80,250 220,130 250,155 130,270" fill="#F5A623" />
          <polygon points="0,260 60,210 90,235 30,286" fill="#FF6B00" />
          <polygon points="500,286 340,160 500,130" fill="#1B2A4A" />
          <polygon points="0,60 40,30 70,60 30,90" fill="#00BCD4" opacity="0.7" />
          <rect x="30" y="110" width="14" height="14" fill="#F5A623" transform="rotate(15 37 117)" />
          <rect x="15" y="150" width="10" height="10" fill="#00BCD4" opacity="0.6" transform="rotate(-10 20 155)" />
        </svg>
      </div>

      {/* ── Right content area ── */}
      <div className="absolute right-0 top-0 bottom-0 w-[58%] flex flex-col justify-center px-6 py-5 z-10">
        <div className="flex items-start gap-3 mb-4">
          {card.avatarUrl ? (
            <div className="relative flex-shrink-0">
              <img
                src={card.avatarUrl}
                alt={card.fullName || 'Profile'}
                className="h-14 w-14 rounded-lg object-cover border-2 border-[#1B2A4A]/20 shadow-md"
              />
            </div>
          ) : (
            <div className="relative flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-lg bg-[#1B2A4A] text-lg font-bold text-white shadow-md border-2 border-[#1B2A4A]/20">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h3
              className="text-[15px] font-bold text-[#1B2A4A] leading-tight tracking-tight truncate"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {card.fullName || 'Your Name'}
            </h3>
            {(card.role || card.headline) && (
              <p className="text-[11px] font-medium text-[#00BCD4] leading-snug mt-0.5 truncate">
                {card.role || card.headline}
              </p>
            )}
            {card.company && (
              <p className="text-[10px] text-[#1B2A4A]/50 font-medium mt-0.5 truncate">
                {card.company}
              </p>
            )}
          </div>
        </div>

        <div className="h-[2px] w-full mb-3 rounded-full overflow-hidden">
          <div className="h-full w-full flex">
            <div className="h-full bg-[#00BCD4]" style={{ width: '55%' }} />
            <div className="h-full bg-[#F5A623]" style={{ width: '30%' }} />
            <div className="h-full bg-[#FF6B00]" style={{ width: '15%' }} />
          </div>
        </div>

        <div className="space-y-1.5">
          {card.phone && (
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1B2A4A]">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
              </div>
              <span className="text-[11px] text-[#1B2A4A]/70 font-medium">{card.phone}</span>
            </div>
          )}
          {card.email && (
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1B2A4A]">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <span className="text-[11px] text-[#1B2A4A]/70 font-medium truncate">{card.email}</span>
            </div>
          )}
          {card.website && (
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1B2A4A]">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <span className="text-[11px] text-[#1B2A4A]/70 font-medium truncate">{card.website}</span>
            </div>
          )}
          {card.linkedinUrl && (
            <div className="flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[#1B2A4A]">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <span className="text-[11px] text-[#1B2A4A]/70 font-medium truncate">{card.linkedinUrl}</span>
            </div>
          )}
        </div>

        {card.skills && card.skills.length > 0 && (
          <div className="mt-2.5">
            <div className="flex flex-wrap gap-1">
              {card.skills.slice(0, 4).map((skill, i) => (
                <span
                  key={skill.id || i}
                  className="inline-block rounded-full bg-[#00BCD4]/10 px-2 py-0.5 text-[9px] font-semibold text-[#00BCD4]"
                >
                  {skill.name}
                </span>
              ))}
              {card.skills.length > 4 && (
                <span className="inline-block rounded-full bg-[#F5A623]/10 px-2 py-0.5 text-[9px] font-semibold text-[#F5A623]">
                  +{card.skills.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassicTemplate;
