import React from 'react';
import { cn } from '../../utils/cn';
import { clamp, easeOut } from './timeline';

/** Fades and lifts a block into place as `t` runs 0 -> 1. */
export function Rise({
  t,
  children,
  y = 14,
  className




}: {t: number;children: React.ReactNode;y?: number;className?: string;}) {
  const eased = easeOut(clamp(t));
  return (
    <div
      className={className}
      style={{
        opacity: eased,
        transform: `translateY(${(1 - eased) * y}px)`
      }}>

      {children}
    </div>);

}

/** Screen title bar inside the phone. */
export function AppBar({
  title,
  trailing



}: {title: string;trailing?: React.ReactNode;}) {
  return (
    <div className="flex items-center gap-2 px-5 pb-3 pt-2">
      <p className="text-[13px] font-bold text-strong">{title}</p>
      {trailing && <span className="ml-auto">{trailing}</span>}
    </div>);

}

/**
 * A text input in mid-typing. `value` is the already-truncated string; the caret
 * shows only while the field is actively receiving characters.
 */
export function Field({
  label,
  value,
  active,
  masked = false,
  valid = false




}: {label: string;value: string;active: boolean;masked?: boolean;valid?: boolean;}) {
  const shown = masked ? '•'.repeat(value.length) : value;
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-fog-400">
        {label}
      </span>
      <span
        className={cn(
          'flex h-9 items-center rounded-lg border px-2.5 text-[11px] transition-colors',
          active ?
          'border-accent/60 bg-accent/[0.06] text-strong shadow-glow' :
          'border-ink-500 bg-ink-800 text-fog-200'
        )}>

        <span className="truncate">{shown}</span>
        {active && <Caret />}
        {valid && !active &&
        <span className="ml-auto text-[10px] font-bold text-success" aria-hidden="true">
            ✓
          </span>}

      </span>
    </label>);

}

export function Caret() {
  return (
    <span
      aria-hidden="true"
      className="ml-px inline-block h-3.5 w-px animate-pulse bg-accent" />);


}

/** Primary action button; `press` squashes it to depict a tap. */
export function PrimaryButton({
  children,
  press = false,
  loading = false,
  className




}: {children: React.ReactNode;press?: boolean;loading?: boolean;className?: string;}) {
  return (
    <span
      className={cn(
        'flex h-9 w-full items-center justify-center rounded-lg bg-accent text-[11px] font-bold text-onaccent transition-transform',
        press && 'scale-[0.97] brightness-90',
        className
      )}>

      {loading ?
      <span
        aria-hidden="true"
        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" /> :

      children}
    </span>);

}

/** Small chip used for skills and interests. */
export function Chip({
  children,
  tone = 'default'



}: {children: React.ReactNode;tone?: 'default' | 'accent';}) {
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-[9px] font-semibold',
        tone === 'accent' ?
        'border-accent/40 bg-accent/10 text-accent' :
        'border-ink-500 bg-ink-800 text-fog-200'
      )}>

      {children}
    </span>);

}

/**
 * A touch point — the ring that expands where the finger lands. Rendered above
 * the screen content at an absolute position.
 */
export function Tap({
  t,
  x,
  y




}: {t: number;x: number | string;y: number | string;}) {
  if (t <= 0 || t >= 1) return null;
  const eased = easeOut(t);
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute z-30 rounded-full border-2 border-accent"
      style={{
        left: x,
        top: y,
        width: 34,
        height: 34,
        marginLeft: -17,
        marginTop: -17,
        opacity: 1 - eased,
        transform: `scale(${0.4 + eased * 1.1})`
      }} />);


}

/** Full-screen success flash used between chapters. */
export function Toast({
  t,
  children



}: {t: number;children: React.ReactNode;}) {
  if (t <= 0) return null;
  // fade in over the first 25% of the window, hold, fade out over the last 25%
  const opacity = t < 0.25 ? t / 0.25 : t > 0.75 ? (1 - t) / 0.25 : 1;
  return (
    <div
      className="pointer-events-none absolute inset-x-4 bottom-8 z-30 rounded-xl border border-success/40 bg-ink-850/95 px-3 py-2.5 text-[11px] font-semibold text-success shadow-panel"
      style={{ opacity: clamp(opacity) }}>

      {children}
    </div>);

}
