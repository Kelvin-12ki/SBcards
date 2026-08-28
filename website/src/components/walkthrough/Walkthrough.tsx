import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, RotateCcwIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PhoneFrame } from './PhoneFrame';
import { sceneById } from './scenes';
import {
  chapterIndexAt,
  chapterOffsets,
  chapters,
  localProgress,
  totalDuration } from
'./timeline';

/**
 * Chaptered walkthrough of the NEXAS mobile app: sign up, sign in, build a
 * card, share it, scan another member, connect.
 *
 * A single requestAnimationFrame loop advances `elapsed`; every scene derives
 * its whole appearance from that number, so pausing, scrubbing, and jumping
 * chapters all work without any per-scene state.
 */
export function Walkthrough() {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  /** Set once the section has been scrolled into view, so it autoplays in place. */
  const [armed, setArmed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number>();
  const lastRef = useRef<number>();

  const index = chapterIndexAt(elapsed);
  const chapter = chapters[index];
  const Scene = sceneById[chapter.id];
  const p = localProgress(elapsed, index);

  // Autoplay once visible; pause when scrolled away so it isn't running unseen.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          if (!prefersReduced) setPlaying(true);
        } else {
          setPlaying(false);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) {
      lastRef.current = undefined;
      return;
    }
    const step = (now: number) => {
      const last = lastRef.current ?? now;
      lastRef.current = now;
      // Cap the delta so a backgrounded tab doesn't jump the timeline forward.
      const delta = Math.min(now - last, 64);
      setElapsed((current) => {
        const next = current + delta;
        return next >= totalDuration ? next % totalDuration : next;
      });
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [playing]);

  const jumpTo = useCallback((chapterIndex: number) => {
    setElapsed(chapterOffsets[chapterIndex]);
    setPlaying(true);
  }, []);

  const restart = useCallback(() => {
    setElapsed(0);
    setPlaying(true);
  }, []);

  return (
    <div ref={containerRef} className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-14">
      {/* device */}
      <div className="flex flex-col items-center gap-5">
        <PhoneFrame screenLabel={`${chapter.label}: ${chapter.caption}`}>
          {armed ?
          <Scene p={p} /> :

          <div className="grid h-full place-items-center px-8 text-center">
              <p className="text-[11px] text-fog-400">
                Scroll into view to play the walkthrough.
              </p>
            </div>}

        </PhoneFrame>

        {/* transport */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            aria-label={playing ? 'Pause walkthrough' : 'Play walkthrough'}
            className="grid h-9 w-9 place-items-center rounded-full border border-ink-500 bg-ink-800 text-fog-200 transition-colors hover:border-accent/50 hover:text-strong">

            {playing ?
            <PauseIcon className="h-4 w-4" aria-hidden="true" /> :
            <PlayIcon className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={restart}
            aria-label="Restart walkthrough"
            className="grid h-9 w-9 place-items-center rounded-full border border-ink-500 bg-ink-800 text-fog-200 transition-colors hover:border-accent/50 hover:text-strong">

            <RotateCcwIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="ml-1 text-[11px] tabular-nums text-fog-500">
            {formatTime(elapsed)} / {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* chapter rail */}
      <div>
        <ol className="space-y-1.5">
          {chapters.map((item, itemIndex) => {
            const active = itemIndex === index;
            const done = itemIndex < index;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => jumpTo(itemIndex)}
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'group relative w-full overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors',
                    active ?
                    'border-accent/40 bg-accent/[0.06]' :
                    'border-ink-600 bg-ink-850/60 hover:border-ink-500'
                  )}>

                  {/* progress fill for the active chapter */}
                  {active &&
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 bg-accent/[0.07]"
                    style={{ width: `${p * 100}%` }} />}


                  <span className="relative flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                        active ?
                        'bg-accent text-onaccent' :
                        done ?
                        'bg-success/20 text-success' :
                        'bg-ink-700 text-fog-500'
                      )}>

                      {done ? '✓' : itemIndex + 1}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          'block text-[13px] font-bold',
                          active ? 'text-strong' : 'text-fog-200'
                        )}>

                        {item.label}
                      </span>
                      <span
                        className={cn(
                          'mt-0.5 block text-[11px] leading-relaxed',
                          active ? 'text-fog-300' : 'text-fog-500'
                        )}>

                        {item.caption}
                      </span>
                    </span>
                  </span>
                </button>
              </li>);

          })}
        </ol>

        <p className="mt-5 text-[11px] leading-relaxed text-fog-500">
          Screens are rendered from the app’s real field names and flows. Numbers
          and people shown are sample data.
        </p>
      </div>
    </div>);

}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
