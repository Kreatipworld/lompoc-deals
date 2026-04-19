/**
 * CategoryPatternBg
 *
 * Subtle tiled SVG background using minimal line-art icons representing
 * local deal categories (food, retail, café, home, auto, health, outdoor,
 * beauty, entertainment, events, music, and deals).
 *
 * Inspired by WhatsApp chat background and Venmo transaction screen.
 * Icons are stroke-only (no fill), scattered at varied positions and
 * rotations to feel organic while still tiling seamlessly.
 *
 * Usage: place inside a `relative overflow-hidden` container. The SVG
 * stretches to fill the container absolutely and sits behind all content.
 */

const G = {
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  fill: "none",
}

interface CategoryPatternBgProps {
  /** Override the icon color via Tailwind text utilities, e.g. "text-primary-foreground/10" */
  className?: string
}

export function CategoryPatternBg({ className }: CategoryPatternBgProps = {}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-full w-full ${className ?? "text-foreground/[0.09]"}`}
        aria-hidden
      >
        <defs>
          <pattern
            id="deal-cat-pattern"
            x="0"
            y="0"
            width="400"
            height="400"
            patternUnits="userSpaceOnUse"
          >
            {/* ── Utensils / Food — top-left ── */}
            <g transform="translate(50,55) rotate(-15)" {...G}>
              {/* Fork: 3 tines */}
              <line x1="-4" y1="-10" x2="-4" y2="-3" />
              <line x1="0" y1="-10" x2="0" y2="-3" />
              <line x1="4" y1="-10" x2="4" y2="-3" />
              <path d="M-4,-3 Q0,0 4,-3" />
              <line x1="0" y1="0" x2="0" y2="10" />
              {/* Knife */}
              <line x1="11" y1="-10" x2="11" y2="10" />
              <path d="M11,-10 Q15,-4 11,-1" />
            </g>

            {/* ── Shopping Bag / Retail — top-center ── */}
            <g transform="translate(185,38) rotate(10)" {...G}>
              <path d="M-10,-3 L-11,10 L11,10 L10,-3 Z" />
              <path d="M-5,-3 C-5,-9 5,-9 5,-3" />
            </g>

            {/* ── Coffee Cup / Café — top-right ── */}
            <g transform="translate(330,68) rotate(-20)" {...G}>
              {/* Cup body */}
              <path d="M-8,0 L-6,11 L6,11 L8,0 Z" />
              {/* Rim */}
              <line x1="-9" y1="0" x2="9" y2="0" />
              {/* Handle */}
              <path d="M8,2 Q13,2 13,6 Q13,10 8,10" />
              {/* Steam */}
              <path d="M-2,-3 Q0,-7 -2,-10" />
              <path d="M3,-3 Q5,-7 3,-10" />
            </g>

            {/* ── Home / Home Services — mid-left ── */}
            <g transform="translate(95,155) rotate(15)" {...G}>
              {/* Roof */}
              <polyline points="-11,1 0,-10 11,1" />
              {/* Walls */}
              <polyline points="-8,1 -8,11 8,11 8,1" />
              {/* Door */}
              <polyline points="-3,5 -3,11 3,11 3,5" />
            </g>

            {/* ── Price Tag / Deals — center ── */}
            <g transform="translate(240,210) rotate(30)" {...G}>
              <path d="M-4,-12 L8,-12 L12,-8 L12,4 L0,12 L-12,4 L-12,-8 Z" />
              <circle cx="5" cy="-8" r="2.5" />
            </g>

            {/* ── Car / Auto — mid-right ── */}
            <g transform="translate(265,140) rotate(-10)" {...G}>
              {/* Roof + body outline */}
              <path d="M-13,1 L-9,-4 L-4,-7 L6,-7 L10,-4 L13,1 Z" />
              <line x1="-13" y1="1" x2="13" y2="1" />
              {/* Wheels */}
              <circle cx="-7" cy="5" r="3" />
              <circle cx="7" cy="5" r="3" />
            </g>

            {/* ── Heart / Health & Wellness — far-right (partial wrap) ── */}
            <g transform="translate(382,200) rotate(25)" {...G}>
              <path d="M0,10 C-12,0 -14,-9 -6,-11 Q-2,-12 0,-8 Q2,-12 6,-11 C14,-9 12,0 0,10 Z" />
            </g>

            {/* ── Leaf / Outdoor & Garden — lower-left ── */}
            <g transform="translate(45,262) rotate(-20)" {...G}>
              <path d="M0,11 C-11,-1 -8,-12 0,-12 C8,-12 11,-1 0,11 Z" />
              <line x1="0" y1="-12" x2="0" y2="11" />
              <line x1="-5" y1="-1" x2="0" y2="-7" />
              <line x1="4" y1="3" x2="0" y2="7" />
            </g>

            {/* ── Scissors / Beauty & Services — lower-center-left ── */}
            <g transform="translate(175,288) rotate(15)" {...G}>
              <circle cx="-5" cy="-7" r="4" />
              <circle cx="-5" cy="7" r="4" />
              <line x1="-2" y1="-4" x2="12" y2="10" />
              <line x1="-2" y1="4" x2="12" y2="-10" />
            </g>

            {/* ── Star / Entertainment — lower-center-right ── */}
            <g transform="translate(310,312) rotate(-5)" {...G}>
              <polygon points="0,-11 2.6,-3.6 10.5,-3.4 4.3,1.4 6.5,8.9 0,4.5 -6.5,8.9 -4.3,1.4 -10.5,-3.4 -2.6,-3.6" />
            </g>

            {/* ── Ticket / Events — lower-left-center ── */}
            <g transform="translate(130,348) rotate(20)" {...G}>
              <rect x="-13" y="-7" width="26" height="14" rx="2" />
              {/* Tear line */}
              <line x1="-3" y1="-7" x2="-3" y2="7" />
              {/* Star on ticket */}
              <circle cx="5" cy="0" r="2" />
            </g>

            {/* ── Music Note / Entertainment — bottom-right ── */}
            <g transform="translate(362,378) rotate(-15)" {...G}>
              {/* Note head */}
              <ellipse cx="-2" cy="7" rx="5" ry="3.5" transform="rotate(-15 -2 7)" />
              {/* Stem */}
              <line x1="3" y1="5" x2="3" y2="-9" />
              {/* Flag + second note */}
              <line x1="3" y1="-9" x2="11" y2="-11" />
              <line x1="11" y1="-11" x2="11" y2="-6" />
              <ellipse cx="7" cy="-4" rx="5" ry="3.5" transform="rotate(-15 7 -4)" />
            </g>

            {/* ── Dumbbell / Fitness — upper-far-right ── */}
            <g transform="translate(380,75) rotate(20)" {...G}>
              <rect x="-12" y="-3" width="24" height="6" rx="1.5" />
              <rect x="-15" y="-6" width="5" height="12" rx="2" />
              <rect x="10" y="-6" width="5" height="12" rx="2" />
            </g>

            {/* ── Camera / Experiences — mid-left-low ── */}
            <g transform="translate(55,165) rotate(-10)" {...G}>
              <rect x="-11" y="-7" width="22" height="16" rx="3" />
              <circle cx="0" cy="2" r="5" />
              <path d="M-4,-7 L-2,-11 L2,-11 L4,-7" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#deal-cat-pattern)" />
      </svg>
    </div>
  )
}
