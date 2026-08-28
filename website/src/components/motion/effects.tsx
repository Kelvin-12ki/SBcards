import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

/** Thin accent bar across the top of the page showing scroll position. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollable =
      document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
    };
    const onScroll = () => {
      // Coalesce to one read per frame; scroll fires far more often than that.
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">

      <div
        className="h-full origin-left bg-gradient-to-r from-accent via-accent to-gold"
        style={{ transform: `scaleX(${progress})` }} />

    </div>);

}

/** True once the page has scrolled past `offset` — used to condense the header. */
export function useScrolled(offset = 12): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > offset);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [offset]);
  return scrolled;
}

/**
 * Drifts its children against the scroll direction. `strength` is how far the
 * element travels across a full viewport of scrolling, in pixels.
 */
export function Parallax({
  children,
  strength = 40,
  className




}: {children: React.ReactNode;strength?: number;className?: string;}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      // -1 when the element sits below the fold, +1 once it has passed above.
      const centred =
      (rect.top + rect.height / 2 - window.innerHeight / 2) /
      (window.innerHeight / 2 + rect.height / 2);
      setOffset(Math.max(-1, Math.min(1, centred)) * strength);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [strength]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ transform: `translate3d(0, ${offset}px, 0)`, willChange: 'transform' }}>

      {children}
    </div>);

}

/**
 * Tilts toward the pointer. Kept subtle — a few degrees reads as depth, more
 * reads as a gimmick.
 */
export function Tilt({
  children,
  max = 6,
  className




}: {children: React.ReactNode;max?: number;className?: string;}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const onMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = node.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setStyle({
      transform: `perspective(1000px) rotateX(${-y * max}deg) rotateY(${
      x * max
      }deg) translate3d(0,-2px,0)`
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setStyle({})}
      className={cn('transition-transform duration-500 ease-smooth', className)}
      style={{ ...style, willChange: 'transform', transformStyle: 'preserve-3d' }}>

      {children}
    </div>);

}

/** Seamless horizontal rail. Children are rendered twice so the loop is invisible. */
export function Marquee({
  children,
  className



}: {children: React.ReactNode;className?: string;}) {
  return (
    <div className={cn('edge-fade overflow-hidden', className)}>
      <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
        <div className="flex shrink-0 items-center gap-10">{children}</div>
        <div className="flex shrink-0 items-center gap-10" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>);

}

/** Decorative moving colour wash plus a faint grid. */
export function Ambience({ grid = true }: {grid?: boolean;}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="aurora" />
      {grid && <div className="grid-veil" />}
    </div>);

}
