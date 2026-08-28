import React from 'react';

/**
 * Illustrations for the organizer journey.
 *
 * All four share one visual language — 320x180 viewBox, rounded geometry, accent
 * strokes — and paint with `rgb(var(--…))` so they re-theme with the page instead
 * of needing a second set of assets for light mode.
 */

const ACCENT = 'rgb(var(--accent))';
const GOLD = 'rgb(var(--gold))';
const SUCCESS = 'rgb(var(--success))';
const SURFACE = 'rgb(var(--ink-800))';
const SURFACE_HI = 'rgb(var(--ink-700))';
const LINE = 'rgb(var(--ink-500))';
const TEXT = 'rgb(var(--fog-400))';

function Frame({ children }: {children: React.ReactNode;}) {
  return (
    <svg
      viewBox="0 0 320 180"
      className="h-auto w-full"
      role="img"
      aria-hidden="true">

      <rect
        x="0.5"
        y="0.5"
        width="319"
        height="179"
        rx="14"
        fill={SURFACE}
        stroke={LINE} />

      {children}
    </svg>);

}

/** Step 1 — create the event. A form card with a date and a title filling in. */
export function CreateEventArt() {
  return (
    <Frame>
      <rect x="34" y="26" width="252" height="128" rx="10" fill={SURFACE_HI} stroke={LINE} />

      {/* calendar block */}
      <rect x="50" y="42" width="42" height="42" rx="8" fill="none" stroke={ACCENT} strokeWidth="1.6" />
      <path d="M50 54 H92" stroke={ACCENT} strokeWidth="1.6" />
      <circle cx="60" cy="48" r="1.6" fill={ACCENT} />
      <circle cx="82" cy="48" r="1.6" fill={ACCENT} />
      <text
        x="71"
        y="76"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill={ACCENT}>
        12
      </text>

      {/* title + fields */}
      <rect x="104" y="44" width="120" height="8" rx="4" fill={TEXT} opacity="0.75" />
      <rect x="104" y="60" width="76" height="6" rx="3" fill={TEXT} opacity="0.4" />

      <rect x="50" y="98" width="104" height="14" rx="7" fill="none" stroke={LINE} />
      <rect x="56" y="103" width="62" height="4" rx="2" fill={TEXT} opacity="0.5" />
      <rect x="166" y="98" width="104" height="14" rx="7" fill="none" stroke={LINE} />
      <rect x="172" y="103" width="48" height="4" rx="2" fill={TEXT} opacity="0.5" />

      {/* primary action */}
      <rect x="50" y="124" width="88" height="18" rx="9" fill={ACCENT}>
        <animate
          attributeName="opacity"
          values="1;0.72;1"
          dur="2.6s"
          repeatCount="indefinite" />

      </rect>
      <text
        x="94"
        y="136"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="rgb(var(--onaccent))">
        Create event
      </text>
    </Frame>);

}

/** Step 2 — lay out the room. Tables appear one after another. */
export function TableLayoutArt() {
  const tables = [
  { x: 74, y: 62 }, { x: 160, y: 62 }, { x: 246, y: 62 },
  { x: 74, y: 122 }, { x: 160, y: 122 }, { x: 246, y: 122 }];


  return (
    <Frame>
      <text x="24" y="34" fontSize="9" fontWeight="700" fill={TEXT}>
        Room layout · 6 tables · 6 seats
      </text>
      <path d="M20 44 H300" stroke={LINE} strokeDasharray="3 4" />

      {tables.map((table, index) =>
      <g key={index}>
          <circle
          cx={table.x}
          cy={table.y}
          r="22"
          fill="none"
          stroke={index === 4 ? ACCENT : LINE}
          strokeWidth={index === 4 ? 1.8 : 1.2}>

            <animate
            attributeName="r"
            values="0;22"
            dur="0.5s"
            begin={`${index * 0.14}s`}
            fill="freeze" />

          </circle>
          {/* seats */}
          {Array.from({ length: 6 }).map((_, seat) => {
          const angle = seat / 6 * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={seat}
              cx={table.x + Math.cos(angle) * 30}
              cy={table.y + Math.sin(angle) * 30}
              r="3.4"
              fill={index === 4 ? ACCENT : LINE}
              opacity={index === 4 ? 0.9 : 0.55}>

                <animate
                attributeName="opacity"
                values={`0;${index === 4 ? 0.9 : 0.55}`}
                dur="0.4s"
                begin={`${index * 0.14 + seat * 0.04 + 0.2}s`}
                fill="freeze" />

              </circle>);

        })}
          <text
          x={table.x}
          y={table.y + 4}
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill={index === 4 ? ACCENT : TEXT}>
            {index + 1}
          </text>
        </g>
      )}
    </Frame>);

}

/** Step 3 — the check-in desk. A QR scan pulses through the door. */
export function CheckInArt() {
  return (
    <Frame>
      {/* doorway */}
      <path
        d="M96 148 V70 a34 34 0 0 1 68 0 V148"
        fill="none"
        stroke={LINE}
        strokeWidth="1.4" />


      {/* phone with QR */}
      <rect x="196" y="52" width="60" height="96" rx="10" fill={SURFACE_HI} stroke={LINE} />
      <rect x="206" y="70" width="40" height="40" rx="4" fill="rgb(var(--strong))" opacity="0.92" />
      {[0, 1, 2, 3].map((row) =>
      Array.from({ length: 4 }).map((_, col) =>
      (row + col) % 2 === 0 ?
      <rect
        key={`${row}-${col}`}
        x={210 + col * 9}
        y={74 + row * 9}
        width="6"
        height="6"
        rx="1"
        fill="rgb(var(--ink-950))" /> :

      null
      )
      )}
      <rect x="206" y="120" width="40" height="5" rx="2.5" fill={TEXT} opacity="0.5" />

      {/* scan beam sweeping the code */}
      <rect x="206" y="70" width="40" height="2" rx="1" fill={ACCENT}>
        <animate
          attributeName="y"
          values="70;108;70"
          dur="2.4s"
          repeatCount="indefinite" />

      </rect>

      {/* checked-in person */}
      <circle cx="130" cy="86" r="13" fill="none" stroke={SUCCESS} strokeWidth="1.6" />
      <path
        d="M112 140 a18 22 0 0 1 36 0"
        fill="none"
        stroke={SUCCESS}
        strokeWidth="1.6" />

      <circle cx="147" cy="72" r="9" fill={SUCCESS}>
        <animate
          attributeName="opacity"
          values="0;1;1"
          dur="2.4s"
          repeatCount="indefinite" />

      </circle>
      <path
        d="M143 72 l3 3 l5 -6"
        fill="none"
        stroke="rgb(var(--onaccent))"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round" />


      <text x="24" y="34" fontSize="9" fontWeight="700" fill={TEXT}>
        Check-in desk · 128 in the room
      </text>
    </Frame>);

}

/** Step 4 — seat and rotate. Attendees land on tables, then the room rotates. */
export function SeatRotateArt() {
  const seats = [
  { angle: -90, tone: ACCENT },
  { angle: -30, tone: GOLD },
  { angle: 30, tone: SUCCESS },
  { angle: 90, tone: ACCENT },
  { angle: 150, tone: GOLD },
  { angle: 210, tone: SUCCESS }];


  return (
    <Frame>
      <text x="24" y="30" fontSize="9" fontWeight="700" fill={TEXT}>
        Seating · round 2
      </text>

      <g transform="translate(160, 104)">
        {/* rotation ring */}
        <circle r="62" fill="none" stroke={LINE} strokeDasharray="4 6" opacity="0.8">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0"
            to="360"
            dur="26s"
            repeatCount="indefinite" />

        </circle>

        <circle r="34" fill="none" stroke={ACCENT} strokeWidth="1.6" />
        <text
          y="4"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={ACCENT}>
          T4
        </text>

        {seats.map((seat, index) => {
          const rad = seat.angle * Math.PI / 180;
          return (
            <g key={index}>
              <circle
                cx={Math.cos(rad) * 48}
                cy={Math.sin(rad) * 48}
                r="9"
                fill="none"
                stroke={seat.tone}
                strokeWidth="1.8">

                <animate
                  attributeName="r"
                  values="0;9"
                  dur="0.45s"
                  begin={`${index * 0.12}s`}
                  fill="freeze" />

              </circle>
              <circle
                cx={Math.cos(rad) * 48}
                cy={Math.sin(rad) * 48 - 2.5}
                r="2.6"
                fill={seat.tone} />

            </g>);

        })}

        {/* rotation arrows */}
        {[0, 120, 240].map((angle) =>
        <path
          key={angle}
          d="M0 -74 l6 5 l-6 5"
          fill="none"
          stroke={ACCENT}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={`rotate(${angle})`}
          opacity="0.8" />

        )}
      </g>
    </Frame>);

}
