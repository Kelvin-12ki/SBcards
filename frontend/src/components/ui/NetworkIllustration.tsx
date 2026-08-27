import React from 'react';

const NetworkIllustration: React.FC = () => (
  <div className="w-full h-full" aria-hidden="true">
    <style>{`
      @keyframes nf-float1 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
      @keyframes nf-float2 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      @keyframes nf-float3 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
      @keyframes nf-float4 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      @keyframes nf-float5 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
      @keyframes nf-float6 { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-11px); } }
      @keyframes nf-dash { to { stroke-dashoffset: -100; } }
      @keyframes nf-glow { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; } }
      @keyframes nf-linepulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.55; } }

      .nf-f1 { animation: nf-float1 4s ease-in-out infinite; }
      .nf-f2 { animation: nf-float2 4.5s ease-in-out infinite 0.3s; }
      .nf-f3 { animation: nf-float3 3.8s ease-in-out infinite 0.6s; }
      .nf-f4 { animation: nf-float4 5s ease-in-out infinite 0.9s; }
      .nf-f5 { animation: nf-float5 4.2s ease-in-out infinite 1.2s; }
      .nf-f6 { animation: nf-float6 4.7s ease-in-out infinite 1.5s; }

      .nf-dash       { stroke-dasharray: 8 6; animation: nf-dash 2s linear infinite; }
      .nf-dash-rev   { stroke-dasharray: 8 6; animation: nf-dash 2.5s linear infinite reverse; }

      .nf-glow-cyan   { animation: nf-glow 3s ease-in-out infinite; }
      .nf-glow-pink   { animation: nf-glow 3.5s ease-in-out infinite 0.5s; }
      .nf-glow-purple { animation: nf-glow 4s ease-in-out infinite 1s; }
      .nf-glow-gold   { animation: nf-glow 3.2s ease-in-out infinite 1.5s; }

      .nf-lp1 { animation: nf-linepulse 3s ease-in-out infinite; }
      .nf-lp2 { animation: nf-linepulse 3.5s ease-in-out infinite 0.7s; }
    `}</style>

    <svg viewBox="0 0 600 500" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Avatar gradient fills */}
        <linearGradient id="av1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F5FF" />
          <stop offset="100%" stopColor="#BF5FFF" />
        </linearGradient>
        <linearGradient id="av2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6EC7" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="av3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BF5FFF" />
          <stop offset="100%" stopColor="#00F5FF" />
        </linearGradient>
        <linearGradient id="av4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#FF6EC7" />
        </linearGradient>
        <linearGradient id="av5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F5FF" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="av6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6EC7" />
          <stop offset="100%" stopColor="#BF5FFF" />
        </linearGradient>

        {/* Connection line gradients */}
        <linearGradient id="ln1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F5FF" />
          <stop offset="100%" stopColor="#FF6EC7" />
        </linearGradient>
        <linearGradient id="ln2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6EC7" />
          <stop offset="100%" stopColor="#BF5FFF" />
        </linearGradient>
        <linearGradient id="ln3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BF5FFF" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="ln4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#00F5FF" />
        </linearGradient>
      </defs>

      {/* ── Connection Lines ── */}
      <g>
        {/* Spokes: center → outer */}
        <path d="M300 250 L130 110"   className="nf-dash"    stroke="url(#ln1)" strokeWidth="2" fill="none" />
        <path d="M300 250 L470 110"   className="nf-dash-rev" stroke="url(#ln2)" strokeWidth="2" fill="none" />
        <path d="M300 250 L70 300"    className="nf-dash"    stroke="url(#ln3)" strokeWidth="2" fill="none" />
        <path d="M300 250 L530 300"   className="nf-dash-rev" stroke="url(#ln4)" strokeWidth="2" fill="none" />
        <path d="M300 250 L300 430"   className="nf-dash"    stroke="url(#ln1)" strokeWidth="2" fill="none" />

        {/* Outer hexagon edges */}
        <path d="M130 110 L470 110"   className="nf-dash-rev nf-lp1" stroke="url(#ln2)" strokeWidth="2" fill="none" />
        <path d="M130 110 L70 300"    className="nf-dash nf-lp2"    stroke="url(#ln3)" strokeWidth="2" fill="none" />
        <path d="M470 110 L530 300"   className="nf-dash-rev nf-lp1" stroke="url(#ln4)" strokeWidth="2" fill="none" />
        <path d="M70 300 L300 430"    className="nf-dash nf-lp2"    stroke="url(#ln1)" strokeWidth="2" fill="none" />
        <path d="M530 300 L300 430"   className="nf-dash-rev nf-lp1" stroke="url(#ln2)" strokeWidth="2" fill="none" />
      </g>

      {/* ── Avatar 1 — Center ── */}
      <g className="nf-f1" style={{ transformOrigin: '300px 250px' }}>
        <circle cx={300} cy={250} r={38} fill="none" stroke="#00F5FF" strokeWidth="2" className="nf-glow-cyan" />
        <circle cx={300} cy={250} r={32} fill="url(#av1)" />
        <ellipse cx={292} cy={240} rx={14} ry={10} fill="white" opacity="0.10" />
        <circle cx={294} cy={248} r={2.5} fill="#0A0A0B" />
        <circle cx={306} cy={248} r={2.5} fill="#0A0A0B" />
        <circle cx={288} cy={254} r={3} fill="#FF6EC7" opacity="0.25" />
        <circle cx={312} cy={254} r={3} fill="#FF6EC7" opacity="0.25" />
        <path d="M292 256 Q300 264 308 256" fill="none" stroke="#0A0A0B" strokeWidth="2" strokeLinecap="round" />
        <path d="M284 234 Q300 220 316 234" fill="none" stroke="#0A0A0B" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* ── Avatar 2 — Top-left ── */}
      <g className="nf-f2" style={{ transformOrigin: '130px 110px' }}>
        <circle cx={130} cy={110} r={38} fill="none" stroke="#FF6EC7" strokeWidth="2" className="nf-glow-pink" />
        <circle cx={130} cy={110} r={32} fill="url(#av2)" />
        <ellipse cx={122} cy={100} rx={14} ry={10} fill="white" opacity="0.10" />
        <circle cx={123} cy={108} r={2.5} fill="#0A0A0B" />
        <circle cx={137} cy={108} r={2.5} fill="#0A0A0B" />
        <circle cx={118} cy={114} r={3} fill="#FF6EC7" opacity="0.25" />
        <circle cx={142} cy={114} r={3} fill="#FF6EC7" opacity="0.25" />
        <path d="M122 116 Q130 124 138 116" fill="none" stroke="#0A0A0B" strokeWidth="2" strokeLinecap="round" />
        <path d="M113 92 Q121 78 129 78 Q137 78 147 92" fill="none" stroke="#0A0A0B" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* ── Avatar 3 — Top-right ── */}
      <g className="nf-f3" style={{ transformOrigin: '470px 110px' }}>
        <circle cx={470} cy={110} r={38} fill="none" stroke="#BF5FFF" strokeWidth="2" className="nf-glow-purple" />
        <circle cx={470} cy={110} r={32} fill="url(#av3)" />
        <ellipse cx={462} cy={100} rx={14} ry={10} fill="white" opacity="0.10" />
        <circle cx={463} cy={108} r={2} fill="#0A0A0B" />
        <circle cx={477} cy={108} r={2} fill="#0A0A0B" />
        <circle cx={458} cy={114} r={3} fill="#FF6EC7" opacity="0.25" />
        <circle cx={482} cy={114} r={3} fill="#FF6EC7" opacity="0.25" />
        <path d="M462 116 Q470 124 478 116" fill="none" stroke="#0A0A0B" strokeWidth="2" strokeLinecap="round" />
        <path d="M454 92 L462 78 L470 88 L478 78 L486 92" fill="none" stroke="#0A0A0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* ── Avatar 4 — Left ── */}
      <g className="nf-f4" style={{ transformOrigin: '70px 300px' }}>
        <circle cx={70} cy={300} r={38} fill="none" stroke="#2563EB" strokeWidth="2" className="nf-glow-gold" />
        <circle cx={70} cy={300} r={32} fill="url(#av4)" />
        <ellipse cx={62} cy={290} rx={14} ry={10} fill="white" opacity="0.10" />
        <circle cx={64} cy={298} r={3} fill="#0A0A0B" />
        <circle cx={76} cy={298} r={3} fill="#0A0A0B" />
        <circle cx={58} cy={304} r={3} fill="#FF6EC7" opacity="0.25" />
        <circle cx={82} cy={304} r={3} fill="#FF6EC7" opacity="0.25" />
        <path d="M62 306 Q70 312 78 306" fill="none" stroke="#0A0A0B" strokeWidth="2" strokeLinecap="round" />
        <path d="M54 284 Q70 268 86 284" fill="none" stroke="#0A0A0B" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* ── Avatar 5 — Right ── */}
      <g className="nf-f5" style={{ transformOrigin: '530px 300px' }}>
        <circle cx={530} cy={300} r={38} fill="none" stroke="#00F5FF" strokeWidth="2" className="nf-glow-cyan" />
        <circle cx={530} cy={300} r={32} fill="url(#av5)" />
        <ellipse cx={522} cy={290} rx={14} ry={10} fill="white" opacity="0.10" />
        <circle cx={524} cy={298} r={3} fill="#0A0A0B" />
        <circle cx={536} cy={298} r={3} fill="#0A0A0B" />
        <circle cx={518} cy={304} r={3} fill="#FF6EC7" opacity="0.25" />
        <circle cx={542} cy={304} r={3} fill="#FF6EC7" opacity="0.25" />
        <path d="M522 306 Q530 314 538 306" fill="none" stroke="#0A0A0B" strokeWidth="2" strokeLinecap="round" />
        <path d="M514 284 Q530 272 546 284" fill="none" stroke="#0A0A0B" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* ── Avatar 6 — Bottom ── */}
      <g className="nf-f6" style={{ transformOrigin: '300px 430px' }}>
        <circle cx={300} cy={430} r={38} fill="none" stroke="#FF6EC7" strokeWidth="2" className="nf-glow-pink" />
        <circle cx={300} cy={430} r={32} fill="url(#av6)" />
        <ellipse cx={292} cy={420} rx={14} ry={10} fill="white" opacity="0.10" />
        <circle cx={294} cy={428} r={2.5} fill="#0A0A0B" />
        <circle cx={306} cy={428} r={2.5} fill="#0A0A0B" />
        <circle cx={288} cy={434} r={3} fill="#FF6EC7" opacity="0.25" />
        <circle cx={312} cy={434} r={3} fill="#FF6EC7" opacity="0.25" />
        <path d="M292 436 Q300 444 308 436" fill="none" stroke="#0A0A0B" strokeWidth="2" strokeLinecap="round" />
        <path d="M282 414 Q292 398 300 402 Q308 398 318 414" fill="none" stroke="#0A0A0B" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </svg>
  </div>
);

export default NetworkIllustration;
