// Rich SVG illustrations for the three Home-screen game cards. Lifted from
// the legacy build (git 2ba8484) and re-rendered as React components.
// Each tile is locked to LTR via .gc-art's CSS so the SVG coords + text
// anchoring read identically in both languages.

export function SebeetaArt() {
  return (
    <svg viewBox="0 0 680 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sebeeta">
      <defs>
        <style>{`
          .sa-bg{fill:#FFFFFF;stroke:#0F1A2E;stroke-width:2}
          .sa-shadow{fill:#0F1A2E;opacity:0.15}
          .sa-red{fill:#D72638}.sa-dark{fill:#0F1A2E}
          .sa-y{fill:#F4C430}.sa-g{fill:#2E8B57}.sa-p{fill:#6B3FA0}
          .sa-corner{font-family:Helvetica,Arial,sans-serif;font-weight:800}
          .sa-jtxt{font-family:Helvetica,Arial,sans-serif;font-weight:800;font-size:11px;letter-spacing:1px}
        `}</style>
      </defs>
      {/* Card 1 — red Joker */}
      <g transform="translate(225,50) rotate(-22)">
        <rect className="sa-shadow" x="3" y="4" width="110" height="155" rx="12" />
        <rect className="sa-bg" x="0" y="0" width="110" height="155" rx="12" />
        <text className="sa-jtxt sa-red" x="8" y="20">JOKER</text>
        <g transform="translate(55,82)">
          <path className="sa-red" d="M -28 -10 L -20 -32 L -12 -14 Z" />
          <path className="sa-y" d="M -12 -14 L 0 -36 L 12 -14 Z" />
          <path className="sa-g" d="M 12 -14 L 20 -32 L 28 -10 Z" />
          <path className="sa-red" d="M -28 -10 L -12 -14 L 28 -10 Z" />
          <path className="sa-p" d="M -28 -10 L 28 -10 L 24 -6 L -24 -6 Z" />
          <circle className="sa-y" cx="-20" cy="-32" r="3" />
          <circle className="sa-red" cx="0" cy="-36" r="3" />
          <circle className="sa-y" cx="20" cy="-32" r="3" />
          <ellipse fill="#FFFFFF" stroke="#0F1A2E" strokeWidth="2" cx="0" cy="2" rx="16" ry="18" />
          <circle className="sa-red" cx="-9" cy="6" r="2.5" opacity="0.6" />
          <circle className="sa-red" cx="9" cy="6" r="2.5" opacity="0.6" />
          <path d="M -7 -2 Q -5 -5 -3 -2" fill="none" stroke="#0F1A2E" strokeWidth="2" strokeLinecap="round" />
          <path d="M 3 -2 Q 5 -5 7 -2" fill="none" stroke="#0F1A2E" strokeWidth="2" strokeLinecap="round" />
          <path d="M -6 8 Q 0 14 6 8" fill="none" stroke="#0F1A2E" strokeWidth="2" strokeLinecap="round" />
          <path className="sa-red" d="M -16 22 L -22 30 L -10 28 Z" />
          <path className="sa-y" d="M -10 28 L 0 36 L 10 28 Z" />
          <path className="sa-g" d="M 10 28 L 22 30 L 16 22 Z" />
        </g>
        <text className="sa-jtxt sa-red" x="102" y="143" textAnchor="end" transform="rotate(180 102 143)">JOKER</text>
      </g>

      {/* Card 2 — black Joker */}
      <g transform="translate(285,35) rotate(-8)">
        <rect className="sa-shadow" x="3" y="4" width="110" height="155" rx="12" />
        <rect className="sa-bg" x="0" y="0" width="110" height="155" rx="12" />
        <text className="sa-jtxt sa-dark" x="8" y="20">JOKER</text>
        <g transform="translate(55,82)">
          <path className="sa-dark" d="M -28 -10 L -20 -32 L -12 -14 L 0 -36 L 12 -14 L 20 -32 L 28 -10 Z" />
          <circle className="sa-dark" cx="-20" cy="-32" r="3" />
          <circle className="sa-dark" cx="0" cy="-36" r="3" />
          <circle className="sa-dark" cx="20" cy="-32" r="3" />
          <ellipse fill="#FFFFFF" stroke="#0F1A2E" strokeWidth="2" cx="0" cy="2" rx="16" ry="18" />
          <path d="M -7 -2 Q -5 -5 -3 -2" fill="none" stroke="#0F1A2E" strokeWidth="2" strokeLinecap="round" />
          <path d="M 3 -2 Q 5 -5 7 -2" fill="none" stroke="#0F1A2E" strokeWidth="2" strokeLinecap="round" />
          <path d="M -6 8 Q 0 14 6 8" fill="none" stroke="#0F1A2E" strokeWidth="2" strokeLinecap="round" />
          <path className="sa-dark" d="M -16 22 L -22 30 L -8 28 L 0 36 L 8 28 L 22 30 L 16 22 Z" />
        </g>
        <text className="sa-jtxt sa-dark" x="102" y="143" textAnchor="end" transform="rotate(180 102 143)">JOKER</text>
      </g>

      {/* Card 3 — 10 of diamonds */}
      <g transform="translate(345,35) rotate(8)">
        <rect className="sa-shadow" x="3" y="4" width="110" height="155" rx="12" />
        <rect className="sa-bg" x="0" y="0" width="110" height="155" rx="12" />
        <text className="sa-corner sa-red" x="10" y="26" fontSize="20">10</text>
        <polygon className="sa-red" points="26,32 31,38 26,44 21,38" />
        <g className="sa-red">
          <polygon points="35,42 42,50 35,58 28,50" />
          <polygon points="35,66 42,74 35,82 28,74" />
          <polygon points="35,90 42,98 35,106 28,98" />
          <polygon points="35,114 42,122 35,130 28,122" />
          <polygon points="75,42 82,50 75,58 68,50" />
          <polygon points="75,66 82,74 75,82 68,74" />
          <polygon points="75,90 82,98 75,106 68,98" />
          <polygon points="75,114 82,122 75,130 68,122" />
          <polygon points="55,54 62,62 55,70 48,62" />
          <polygon points="55,102 62,110 55,118 48,110" />
        </g>
        <g transform="translate(100,145) rotate(180)">
          <text className="sa-corner sa-red" x="0" y="0" fontSize="20">10</text>
          <polygon className="sa-red" points="16,8 21,14 16,20 11,14" />
        </g>
      </g>

      {/* Card 4 — queen of spades */}
      <g transform="translate(405,50) rotate(22)">
        <rect className="sa-shadow" x="3" y="4" width="110" height="155" rx="12" />
        <rect className="sa-bg" x="0" y="0" width="110" height="155" rx="12" />
        <text className="sa-corner sa-dark" x="12" y="26" fontSize="20">Q</text>
        <g transform="translate(20,38) scale(0.45)">
          <path className="sa-dark" d="M 0 -26 Q -22 -6 -22 7 Q -22 19 -10 19 Q -4 19 -2 14 L -6 28 L 6 28 L 2 14 Q 4 19 10 19 Q 22 19 22 7 Q 22 -6 0 -26 Z" />
        </g>
        <g transform="translate(55,85)">
          <path className="sa-dark" d="M -20 -25 L -16 -10 L -10 -22 L -4 -10 L 0 -28 L 4 -10 L 10 -22 L 16 -10 L 20 -25 L 20 -4 L -20 -4 Z" />
          <circle className="sa-dark" cx="-20" cy="-25" r="2.5" />
          <circle className="sa-dark" cx="0" cy="-28" r="2.5" />
          <circle className="sa-dark" cx="20" cy="-25" r="2.5" />
          <ellipse className="sa-dark" cx="0" cy="8" rx="14" ry="16" />
          <path className="sa-dark" d="M -20 30 Q 0 18 20 30 L 20 32 L -20 32 Z" />
        </g>
        <g transform="translate(98,145) rotate(180)">
          <text className="sa-corner sa-dark" x="0" y="0" fontSize="20">Q</text>
          <g transform="translate(-10,12) scale(0.4)">
            <path className="sa-dark" d="M 0 -26 Q -22 -6 -22 7 Q -22 19 -10 19 Q -4 19 -2 14 L -6 28 L 6 28 L 2 14 Q 4 19 10 19 Q 22 19 22 7 Q 22 -6 0 -26 Z" />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function KoutArt() {
  // Four Aces — one per suit (clubs, diamonds, hearts, spades)
  return (
    <svg viewBox="0 0 680 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kout">
      <defs>
        <style>{`
          .ka-bg{fill:#FFFFFF;stroke:#0F1A2E;stroke-width:2}
          .ka-shadow{fill:#0F1A2E;opacity:0.15}
          .ka-red{fill:#D72638}.ka-dark{fill:#0F1A2E}
          .ka-corner{font-family:Helvetica,Arial,sans-serif;font-weight:800}
        `}</style>
      </defs>
      {/* A♣ */}
      <g transform="translate(225,50) rotate(-22)">
        <rect className="ka-shadow" x="3" y="4" width="110" height="155" rx="12" />
        <rect className="ka-bg" x="0" y="0" width="110" height="155" rx="12" />
        <text className="ka-corner ka-dark" x="12" y="26" fontSize="20">A</text>
        <g transform="translate(55,80)">
          <circle className="ka-dark" cx="0" cy="-14" r="11" />
          <circle className="ka-dark" cx="-11" cy="5" r="11" />
          <circle className="ka-dark" cx="11" cy="5" r="11" />
          <path className="ka-dark" d="M -5 5 L -9 26 L 9 26 L 5 5 Z" />
        </g>
      </g>
      {/* A♦ */}
      <g transform="translate(285,35) rotate(-8)">
        <rect className="ka-shadow" x="3" y="4" width="110" height="155" rx="12" />
        <rect className="ka-bg" x="0" y="0" width="110" height="155" rx="12" />
        <text className="ka-corner ka-red" x="12" y="26" fontSize="20">A</text>
        <g transform="translate(55,80)">
          <polygon className="ka-red" points="0,-26 20,0 0,26 -20,0" />
        </g>
      </g>
      {/* A♥ */}
      <g transform="translate(345,35) rotate(8)">
        <rect className="ka-shadow" x="3" y="4" width="110" height="155" rx="12" />
        <rect className="ka-bg" x="0" y="0" width="110" height="155" rx="12" />
        <text className="ka-corner ka-red" x="12" y="26" fontSize="20">A</text>
        <g transform="translate(55,82)">
          <path className="ka-red" d="M 0 20 L -22 -6 Q -28 -16 -20 -22 Q -10 -28 0 -14 Q 10 -28 20 -22 Q 28 -16 22 -6 Z" />
        </g>
      </g>
      {/* A♠ */}
      <g transform="translate(405,50) rotate(22)">
        <rect className="ka-shadow" x="3" y="4" width="110" height="155" rx="12" />
        <rect className="ka-bg" x="0" y="0" width="110" height="155" rx="12" />
        <text className="ka-corner ka-dark" x="12" y="26" fontSize="20">A</text>
        <g transform="translate(55,80)">
          <path className="ka-dark" d="M 0 -26 Q -22 -6 -22 7 Q -22 19 -10 19 Q -4 19 -2 14 L -6 28 L 6 28 L 2 14 Q 4 19 10 19 Q 22 19 22 7 Q 22 -6 0 -26 Z" />
        </g>
      </g>
    </svg>
  );
}

export function CustomArt() {
  // Four red card-backs with gold Q seal — "open scorepad"
  return (
    <svg viewBox="0 0 680 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Custom — open scorepad">
      <defs>
        <style>{`
          .cb-bg{fill:#FFFFFF;stroke:#0F1A2E;stroke-width:2}
          .cb-shadow{fill:#0F1A2E;opacity:0.15}
          .cb-back{fill:#7c2528}
          .cb-stripe{stroke:#a83d3f;stroke-width:1.2;fill:none}
          .cb-ring{fill:#f4c430}
          .cb-inner{fill:#7c2528}
          .cb-mark{fill:#f4c430;font-family:Georgia,serif;font-weight:700;font-size:24px}
        `}</style>
      </defs>
      {[
        { x: 225, y: 50, r: -22 },
        { x: 285, y: 35, r: -8 },
        { x: 345, y: 35, r: 8 },
        { x: 405, y: 50, r: 22 },
      ].map((c, i) => (
        <g key={i} transform={`translate(${c.x},${c.y}) rotate(${c.r})`}>
          <rect className="cb-shadow" x="3" y="4" width="110" height="155" rx="12" />
          <rect className="cb-bg" x="0" y="0" width="110" height="155" rx="12" />
          <rect className="cb-back" x="6" y="6" width="98" height="143" rx="9" />
          <g className="cb-stripe">
            <line x1="6" y1="32" x2="104" y2="32" />
            <line x1="6" y1="46" x2="104" y2="46" />
            <line x1="6" y1="108" x2="104" y2="108" />
            <line x1="6" y1="122" x2="104" y2="122" />
          </g>
          <circle className="cb-ring" cx="55" cy="77" r="22" />
          <circle className="cb-inner" cx="55" cy="77" r="17" />
          <text className="cb-mark" x="55" y="86" textAnchor="middle">Q</text>
        </g>
      ))}
    </svg>
  );
}
