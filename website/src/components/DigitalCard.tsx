import React from 'react';
import { MailIcon, PhoneIcon, GlobeIcon } from 'lucide-react';
import { GeometricAvatar } from './GeometricAvatar';
import { cn, seededRandom } from '../utils/cn';

export interface CardData {
  name: string;
  role: string;
  company: string;
  phone: string;
  email: string;
  website?: string;
  accent: 'cyan' | 'gold' | 'violet' | 'mint';
  seed: number;
  isDefault?: boolean;
}

const ACCENT_HEX: Record<CardData['accent'], string> = {
  cyan: '#00E5FF',
  gold: '#EAB308',
  violet: '#A78BFA',
  mint: '#34D399'
};

function CardArt({ seed, color }: {seed: number;color: string;}) {
  const rand = seededRandom(seed + 11);
  const shapes = Array.from({ length: 7 }, () => ({
    x: 150 + rand() * 180,
    y: -20 + rand() * 190,
    size: 20 + rand() * 64,
    kind: rand()
  }));
  return (
    <svg
      viewBox="0 0 320 170"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true">
      
      {shapes.map((shape, index) =>
      shape.kind > 0.55 ?
      <polygon
        key={index}
        points={`${shape.x},${shape.y} ${shape.x + shape.size},${shape.y + shape.size * 0.55} ${
        shape.x - shape.size * 0.3},${
        shape.y + shape.size}`}
        fill="none"
        stroke={color}
        strokeWidth="0.9"
        opacity="0.45" /> :


      <circle
        key={index}
        cx={shape.x}
        cy={shape.y}
        r={shape.size / 2}
        fill="none"
        stroke={color}
        strokeWidth="0.9"
        opacity="0.28" />


      )}
      <rect x="152" y="0" width="0.9" height="170" fill={color} opacity="0.3" />
    </svg>);

}

export function DigitalCard({
  card,
  className,
  size = 'md'




}: {card: CardData;className?: string;size?: 'sm' | 'md';}) {
  const color = ACCENT_HEX[card.accent];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-ink-500/80 bg-ink-850',
        className
      )}>
      
      <CardArt seed={card.seed} color={color} />
      <div className={cn('relative flex flex-col gap-3.5', size === 'sm' ? 'p-4' : 'p-5')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <GeometricAvatar seed={card.seed} name={card.name} size={size === 'sm' ? 36 : 46} />
            <div className="min-w-0">
              <p
                className={cn(
                  'truncate font-bold leading-tight text-strong',
                  size === 'sm' ? 'text-sm' : 'text-base'
                )}>
                
                {card.name}
              </p>
              <p className="truncate text-xs font-semibold" style={{ color }}>
                {card.role}
              </p>
              <p className="truncate text-xs text-fog-400">{card.company}</p>
            </div>
          </div>
          {card.isDefault &&
          <span className="shrink-0 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
              Default
            </span>
          }
        </div>
        <dl className="space-y-1.5 text-xs text-fog-300">
          <div className="flex items-center gap-2">
            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-fog-500" aria-hidden="true" />
            <dt className="sr-only">Phone</dt>
            <dd className="truncate">{card.phone}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MailIcon className="h-3.5 w-3.5 shrink-0 text-fog-500" aria-hidden="true" />
            <dt className="sr-only">Email</dt>
            <dd className="truncate">{card.email}</dd>
          </div>
          {card.website &&
          <div className="flex items-center gap-2">
              <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-fog-500" aria-hidden="true" />
              <dt className="sr-only">Website</dt>
              <dd className="truncate">{card.website}</dd>
            </div>
          }
        </dl>
      </div>
    </div>);

}