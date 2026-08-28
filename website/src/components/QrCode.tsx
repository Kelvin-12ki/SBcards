import React from 'react';
import { cn, seededRandom } from '../utils/cn';

const MODULES = 25;

function inFinder(row: number, col: number): boolean {
  const block = (r0: number, c0: number) => row >= r0 && row < r0 + 7 && col >= c0 && col < c0 + 7;
  return block(0, 0) || block(0, MODULES - 7) || block(MODULES - 7, 0);
}

function finderFill(row: number, col: number): boolean {
  const local = (r0: number, c0: number) => {
    const r = row - r0;
    const c = col - c0;
    return r === 0 || r === 6 || c === 0 || c === 6 || r >= 2 && r <= 4 && c >= 2 && c <= 4;
  };
  if (row < 7 && col < 7) return local(0, 0);
  if (row < 7 && col >= MODULES - 7) return local(0, MODULES - 7);
  return local(MODULES - 7, 0);
}

/** Vector QR-style matrix — deterministic from the seed so it never flickers between renders. */
export function QrCode({
  seed = 71,
  className,
  label = 'QR code linking to an NEXAS profile'




}: {seed?: number;className?: string;label?: string;}) {
  const rand = seededRandom(seed);
  const cells: Array<[number, number]> = [];

  for (let row = 0; row < MODULES; row += 1) {
    for (let col = 0; col < MODULES; col += 1) {
      if (inFinder(row, col)) {
        if (finderFill(row, col)) cells.push([row, col]);
        continue;
      }
      const timing = (row === 6 || col === 6) && (row + col) % 2 === 0;
      if (timing || rand() > 0.5) cells.push([row, col]);
    }
  }

  const unit = 100 / MODULES;

  return (
    <svg
      viewBox="-4 -4 108 108"
      role="img"
      aria-label={label}
      className={cn('h-full w-full', className)}>
      
      <rect x="-4" y="-4" width="108" height="108" rx="8" fill="#FFFFFF" />
      {cells.map(([row, col]) =>
      <rect
        key={`${row}-${col}`}
        x={col * unit}
        y={row * unit}
        width={unit}
        height={unit}
        rx={unit * 0.24}
        fill="#0D0D10" />

      )}
    </svg>);

}