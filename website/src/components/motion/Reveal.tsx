import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

/** Shared observer — one instance for the whole page instead of one per element. */
let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function observe(node: Element, onEnter: () => void) {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          callbacks.get(entry.target)?.();
          observer?.unobserve(entry.target);
          callbacks.delete(entry.target);
        }
      },
      // Fire slightly before the element reaches the viewport edge so the motion
      // reads as "already arriving" rather than starting late.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    );
  }
  callbacks.set(node, onEnter);
  observer.observe(node);
  return () => {
    observer?.unobserve(node);
    callbacks.delete(node);
  };
}

function prefersReduced(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

}

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<Direction, string> = {
  up: 'translate3d(0, 22px, 0)',
  down: 'translate3d(0, -22px, 0)',
  left: 'translate3d(26px, 0, 0)',
  right: 'translate3d(-26px, 0, 0)',
  none: 'none'
};

/**
 * Fades and slides its children in the first time they scroll into view.
 * Animates transform/opacity only, so it never triggers layout.
 */
export function Reveal({
  children,
  delay = 0,
  direction = 'up',
  scale = false,
  duration = 700,
  className,
  as: Tag = 'div'








}: {children: React.ReactNode;delay?: number;direction?: Direction;scale?: boolean;duration?: number;className?: string;as?: 'div' | 'section' | 'li' | 'article' | 'span';}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (prefersReduced()) {
      setShown(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    return observe(node, () => setShown(true));
  }, []);

  const hidden = `${OFFSET[direction]}${scale ? ' scale(0.96)' : ''}`;

  return (
    <Tag
      ref={ref as never}
      className={cn(className)}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : hidden,
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: shown ? undefined : 'transform, opacity'
      }}>

      {children}
    </Tag>);

}

/**
 * Reveals children one after another. `step` is the gap between each child, in
 * milliseconds.
 */
export function RevealGroup({
  children,
  step = 70,
  delay = 0,
  direction = 'up',
  className






}: {children: React.ReactNode;step?: number;delay?: number;direction?: Direction;className?: string;}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) =>
      <Reveal delay={delay + index * step} direction={direction}>
          {child}
        </Reveal>
      )}
    </div>);

}
