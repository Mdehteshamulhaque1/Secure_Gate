import { useId } from "react"

/**
 * Full-screen ambient background: aurora gradients + blueprint grid
 * plus a subtle "smart building" network illustration (SOC style).
 */
export function Background() {
  const gid = useId().replace(/[:]/g, "")
  return (
    <>
      <div className="sg-aurora" aria-hidden="true" />
      {/* Smart-building network illustration */}
      <div
        className="pointer-events-none fixed -right-32 -top-24 z-[-1] hidden opacity-60 blur-[1.5px] lg:block"
        aria-hidden="true"
      >
        <svg
          width="820"
          height="560"
          viewBox="0 0 820 560"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`bl-${gid}`} x1="0" y1="0" x2="820" y2="560">
              <stop stopColor="#22d3ee" stopOpacity="0" />
              <stop offset="0.5" stopColor="#22d3ee" stopOpacity="0.14" />
              <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
            <radialGradient id={`orb-${gid}`} cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Buildings */}
          <g stroke="rgba(148,163,184,0.16)" fill="rgba(148,163,184,0.05)" strokeWidth="1">
            <rect x="60" y="120" width="74" height="380" rx="8" />
            <rect x="164" y="200" width="58" height="300" rx="8" />
            <rect x="252" y="90" width="92" height="410" rx="8" />
            <rect x="374" y="170" width="64" height="330" rx="8" />
            <rect x="468" y="60" width="120" height="440" rx="10" />
            <rect x="618" y="140" width="70" height="360" rx="8" />
          </g>

          {/* Window grid on main tower */}
          <g stroke="rgba(148,163,184,0.10)" strokeWidth="1">
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 4 }).map((_, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={490 + c * 22}
                  y={90 + r * 44}
                  width="10"
                  height="16"
                  rx="2"
                />
              )),
            )}
          </g>

          {/* Network links between buildings */}
          <g stroke={`url(#bl-${gid})`} strokeWidth="1.4">
            <path d="M134 240 H164" />
            <path d="M222 260 H252" />
            <path d="M344 200 H374" />
            <path d="M438 180 H468" />
            <path d="M588 220 H618" />
          </g>

          {/* Network nodes */}
          <g fill="#34d399">
            <circle cx="134" cy="240" r="4" />
            <circle cx="222" cy="260" r="4" />
            <circle cx="344" cy="200" r="4" />
            <circle cx="438" cy="180" r="4" />
            <circle cx="588" cy="220" r="4" />
          </g>
          <g fill="url(#orb-${gid})" opacity="0.9">
            <circle cx="134" cy="240" r="14" />
            <circle cx="588" cy="220" r="14" />
          </g>

          {/* Radar sweep */}
          <circle cx="580" cy="210" r="46" stroke="rgba(34,211,238,0.18)" strokeWidth="1" fill="none" />
          <circle cx="580" cy="210" r="4" fill="#22d3ee" opacity="0.7" />
        </svg>
      </div>
    </>
  )
}
