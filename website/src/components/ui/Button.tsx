import React from 'react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gold text-onaccent hover:bg-[#F5C21B] active:bg-[#D9A607] font-bold',
  accent: 'bg-accent text-onaccent hover:bg-[#5BF0FF] active:bg-[#00C8DE] font-bold',
  outline: 'border border-ink-500 bg-ink-800/70 text-fog-100 hover:border-accent/60 hover:text-strong font-semibold',
  ghost: 'text-fog-300 hover:bg-ink-700 hover:text-strong font-semibold'
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-xl gap-2'
};

const BASE =
'inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50';

export function Button({
  variant = 'outline',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {variant?: Variant;size?: Size;}) {
  return <button type={type} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest} />;
}

export function LinkButton({
  variant = 'outline',
  size = 'md',
  className,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {variant?: Variant;size?: Size;}) {
  return <a className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest} />;
}