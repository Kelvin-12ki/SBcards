import React from 'react';

/**
 * Visual scanning guide overlay with a card-shaped cutout and corner brackets.
 * Purely presentational — no props needed.
 */
const CardOverlay: React.FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Dark semi-transparent backdrop with card-shaped cutout */}
      {/* Top band */}
      <div className="absolute inset-x-0 top-0 h-[calc(50%-100px)] bg-black/60" />
      {/* Bottom band */}
      <div className="absolute inset-x-0 bottom-0 h-[calc(50%-100px)] bg-black/60" />
      {/* Left band */}
      <div className="absolute left-0 top-[calc(50%-100px)] h-[200px] w-[calc(50%-175px)] bg-black/60" />
      {/* Right band */}
      <div className="absolute right-0 top-[calc(50%-100px)] h-[200px] w-[calc(50%-175px)] bg-black/60" />

      {/* Card outline */}
      <div
        className="absolute left-1/2 top-1/2 h-[200px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2"
        style={{
          borderColor: '#00F5FF',
          boxShadow: '0 0 20px rgba(0, 245, 255, 0.4), 0 0 40px rgba(0, 245, 255, 0.15)',
          animation: 'glow-pulse 2s ease-in-out infinite',
        }}
      >
        {/* Scan line */}
        <div className="scan-line" />
      </div>

      {/* Corner bracket accents — gold L-shapes */}
      {/* Top-left */}
      <div className="absolute left-1/2 top-1/2 -translate-x-[175px] -translate-y-[100px]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 4H4v16" />
        </svg>
      </div>
      {/* Top-right */}
      <div className="absolute left-1/2 top-1/2 translate-x-[151px] -translate-y-[100px]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 4h16v16" />
        </svg>
      </div>
      {/* Bottom-left */}
      <div className="absolute left-1/2 top-1/2 -translate-x-[175px] translate-y-[76px]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 20H4V4" />
        </svg>
      </div>
      {/* Bottom-right */}
      <div className="absolute left-1/2 top-1/2 translate-x-[151px] translate-y-[76px]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4A853" strokeWidth="2.5" strokeLinecap="round">
          <path d="M4 20h16V4" />
        </svg>
      </div>

      {/* Instruction text */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-sm text-text-secondary">Position card within the frame</p>
      </div>
    </div>
  );
};

export default CardOverlay;
