/**
 * Timeline model for the product walkthrough.
 *
 * Every scene renders as a pure function of its local progress `p` (0..1), so the
 * player can scrub, pause, and jump chapters without any scene holding its own
 * animation state.
 */

export interface Chapter {
  id: string;
  /** Short label for the chapter rail. */
  label: string;
  /** Caption shown under the phone while this chapter plays. */
  caption: string;
  /** Milliseconds this chapter occupies on the timeline. */
  duration: number;
}

export const chapters: Chapter[] = [
{
  id: 'signup',
  label: 'Sign up',
  caption: 'Create an account with a name, email, and password.',
  duration: 5600
},
{
  id: 'login',
  label: 'Sign in',
  caption: 'Sign back in and land on your home screen.',
  duration: 4000
},
{
  id: 'card',
  label: 'Build your card',
  caption: 'Fill in your details, add skills, pick an accent — the card builds as you type.',
  duration: 7600
},
{
  id: 'share',
  label: 'Show your QR',
  caption: 'Your card becomes a QR code anyone can scan — app or no app.',
  duration: 4400
},
{
  id: 'scan',
  label: 'Scan a member',
  caption: 'Scan another member’s code to send a connection request.',
  duration: 6000
},
{
  id: 'connected',
  label: 'Connected',
  caption: 'They accept, and the connection lands in your list with context attached.',
  duration: 5400
}];


export const totalDuration = chapters.reduce((sum, chapter) => sum + chapter.duration, 0);

/** Start offset of each chapter on the global timeline, in milliseconds. */
export const chapterOffsets = chapters.reduce<number[]>((acc, _chapter, index) => {
  acc.push(index === 0 ? 0 : acc[index - 1] + chapters[index - 1].duration);
  return acc;
}, []);

export function chapterIndexAt(elapsed: number): number {
  for (let index = chapters.length - 1; index >= 0; index -= 1) {
    if (elapsed >= chapterOffsets[index]) return index;
  }
  return 0;
}

/** Local 0..1 progress within the chapter containing `elapsed`. */
export function localProgress(elapsed: number, index: number): number {
  const start = chapterOffsets[index];
  return clamp((elapsed - start) / chapters[index].duration);
}

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Progress of a sub-window inside a scene: `seg(p, 0.2, 0.5)` is 0 before 20%,
 * ramps to 1 by 50%, and stays 1 after. The building block for all choreography.
 */
export function seg(p: number, start: number, end: number): number {
  if (end <= start) return p >= end ? 1 : 0;
  return clamp((p - start) / (end - start));
}

/** Ease-out cubic — the default for anything entering the screen. */
export function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Reveals `text` one character at a time across the given window. */
export function typed(text: string, p: number, start: number, end: number): string {
  const count = Math.round(seg(p, start, end) * text.length);
  return text.slice(0, count);
}

/** True while `p` sits inside the window — for taps, flashes, and other blips. */
export function pulse(p: number, start: number, end: number): boolean {
  return p >= start && p <= end;
}
