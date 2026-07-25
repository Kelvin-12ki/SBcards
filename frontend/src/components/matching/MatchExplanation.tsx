import React from 'react';
import { cn } from '@/utils/helpers';
import type { RecommendationFactor } from '@/types/recommendation';

export interface MatchExplanationProps {
  explanation: string[];
  factors: RecommendationFactor[];
  compact?: boolean;
  className?: string;
}

const FACTOR_COLORS: Record<string, string> = {
  industry: 'bg-gold',
  skills: 'bg-neon-cyan',
  interests: 'bg-neon-pink',
  complementarity: 'bg-neon-purple',
  seniority: 'bg-neon-blue',
  location: 'bg-success',
};

const FACTOR_BG_COLORS: Record<string, string> = {
  industry: 'bg-gold/20',
  skills: 'bg-neon-cyan/20',
  interests: 'bg-neon-pink/20',
  complementarity: 'bg-neon-purple/20',
  seniority: 'bg-neon-blue/20',
  location: 'bg-success/20',
};

const ExplanationIcon: React.FC<{ factorName: string }> = ({ factorName }) => {
  const key = factorName.toLowerCase().replace(/\s+/g, '');
  const iconClass = 'h-4 w-4 flex-shrink-0';

  switch (key) {
    case 'industry':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      );
    case 'skills':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      );
    case 'interests':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      );
    case 'complementarity':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75a2.25 2.25 0 01-2.25 2.25h-4.5a2.25 2.25 0 01-2.25-2.25z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75a2.25 2.25 0 002.25 2.25h4.5a2.25 2.25 0 002.25-2.25z" />
        </svg>
      );
    case 'seniority':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    case 'location':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const getFactorKey = (name: string): string => name.toLowerCase().replace(/\s+/g, '');

const MatchExplanation: React.FC<MatchExplanationProps> = ({
  explanation,
  factors,
  compact = false,
  className,
}) => {
  if (!explanation || explanation.length === 0) return null;

  const factorMap = new Map<string, RecommendationFactor>();
  factors.forEach((f) => {
    factorMap.set(getFactorKey(f.name), f);
  });

  // Try to associate each explanation with a factor by keyword matching
  const factorKeywords = [
    { key: 'industry', keywords: ['industry', 'sector', 'field'] },
    { key: 'skills', keywords: ['skill', 'expertise', 'technical'] },
    { key: 'interests', keywords: ['interest', 'passion', 'hobby'] },
    { key: 'complementarity', keywords: ['complement', 'opposite', 'balanced', 'gap'] },
    { key: 'seniority', keywords: ['senior', 'level', 'experience', 'seniority'] },
    { key: 'location', keywords: ['location', 'local', 'area', 'region'] },
  ];

  const getFactorForExplanation = (exp: string): string => {
    const lower = exp.toLowerCase();
    for (const fk of factorKeywords) {
      if (fk.keywords.some((kw) => lower.includes(kw))) {
        return fk.key;
      }
    }
    return 'general';
  };

  return (
    <div className={cn(className)}>
      {!compact && (
        <h4 className="mb-3 font-display text-base font-bold text-gradient-magical">
          Why You Match
        </h4>
      )}
      <ul className={cn('space-y-2', compact ? 'text-xs' : 'text-sm')}>
        {explanation.map((exp, i) => {
          const factorKey = getFactorForExplanation(exp);
          const factor = factorMap.get(factorKey);
          const colorClass = FACTOR_COLORS[factorKey] || 'bg-neon-cyan';
          const bgClass = FACTOR_BG_COLORS[factorKey] || 'bg-surface-3';

          return (
            <li
              key={i}
              className="flex items-start gap-2.5 rounded-lg bg-surface-2/50 p-2.5 transition-colors hover:bg-surface-2"
            >
              <span className={cn('mt-0.5 rounded-full p-1 text-white', colorClass)}>
                <ExplanationIcon factorName={factorKey} />
              </span>
              <span className="flex-1 leading-5 text-text-primary">{exp}</span>
              {factor && (
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <div className={cn('h-2 w-12 rounded-full', bgClass)}>
                    <div
                      className={cn('h-full rounded-full', colorClass)}
                      style={{
                        width: `${Math.round((factor.score || 0) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-secondary">
                    {Math.round((factor.score || 0) * 100)}%
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MatchExplanation;
