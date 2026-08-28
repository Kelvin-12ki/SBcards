import React from 'react';
import { cn, initials, seededRandom } from '../utils/cn';

const PALETTES: string[][] = [
['#00E5FF', '#0E6C77', '#123340'],
['#EAB308', '#5A4406', '#1A1508'],
['#A78BFA', '#3F2E75', '#15121F'],
['#34D399', '#125943', '#0C1A15']];


/** Deterministic geometric identity mark used in place of photography. */
export function GeometricAvatar({
  seed,
  name,
  size = 44,
  className,
  showInitials = true






}: {seed: number;name: string;size?: number;className?: string;showInitials?: boolean;}) {
  const rand = seededRandom(seed + 3);
  const palette = PALETTES[seed % PALETTES.length];
  const shapes = Array.from({ length: 5 }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    r: 14 + rand() * 36,
    kind: rand(),
    fill: palette[Math.floor(rand() * palette.length)],
    opacity: 0.4 + rand() * 0.5
  }));

  return (
    <span
      className={cn(
        'relative inline-block shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-800',
        className
      )}
      style={{ width: size, height: size }}>
      
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <rect width="100" height="100" fill="#14141A" />
        {shapes.map((shape, index) =>
        shape.kind > 0.6 ?
        <circle
          key={index}
          cx={shape.x}
          cy={shape.y}
          r={shape.r / 1.7}
          fill={shape.fill}
          opacity={shape.opacity} /> :


        <polygon
          key={index}
          points={`${shape.x},${shape.y} ${shape.x + shape.r},${shape.y + shape.r * 0.5} ${
          shape.x - shape.r * 0.4},${
          shape.y + shape.r}`}
          fill={shape.fill}
          opacity={shape.opacity} />


        )}
      </svg>
      {showInitials &&
      <span
        className="absolute inset-0 flex items-center justify-center font-bold tracking-tight text-strong"
        style={{ fontSize: Math.max(10, size * 0.32), textShadow: '0 1px 6px rgba(0,0,0,0.75)' }}>
        
          {initials(name)}
        </span>
      }
    </span>);

}