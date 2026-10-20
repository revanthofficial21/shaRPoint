/**
 * Night-campus backdrop for the landing hero.
 *
 * WHY THIS IS DRAWN RATHER THAN A PHOTO
 * The reference mockup's hero image is a raster illustration embedded inside a
 * composite screenshot. It cannot be extracted cleanly (the student figure and
 * baked-in captions sit over it), and its licence is unknown, so shipping a crop
 * of it would be both low-resolution and legally shaky. This is an SVG instead:
 * it scales to any viewport, weighs a few KB, retints with the accent preset,
 * and belongs to you.
 *
 * To use a real photograph instead, drop the file in /public and swap this
 * component for an <img> — see the note in the README.
 *
 * Purely decorative: aria-hidden, and it never intercepts pointer events.
 */
export function CampusBackdrop({ className }: { className?: string }) {
  // Deterministic lit-window pattern — no Math.random, so the scene is stable
  // between renders and identical on every machine.
  const buildings = [
    { x: -40, w: 190, h: 430, cols: 6, rows: 13 },
    { x: 170, w: 130, h: 330, cols: 4, rows: 10 },
    { x: 320, w: 230, h: 520, cols: 7, rows: 16 },
    { x: 570, w: 150, h: 380, cols: 5, rows: 12 },
    { x: 740, w: 210, h: 460, cols: 6, rows: 14 },
    { x: 970, w: 140, h: 300, cols: 4, rows: 9 },
    { x: 1130, w: 250, h: 540, cols: 8, rows: 17 },
    { x: 1400, w: 180, h: 400, cols: 5, rows: 12 },
  ]

  const trees = [
    { x: 120, r: 60 },
    { x: 300, r: 78 },
    { x: 520, r: 52 },
    { x: 700, r: 70 },
    { x: 900, r: 58 },
    { x: 1080, r: 74 },
    { x: 1290, r: 56 },
    { x: 1480, r: 68 },
  ]

  return (
    <svg
      className={className}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="campus-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(222 96% 6%)" />
          <stop offset="45%" stopColor="hsl(222 90% 11%)" />
          <stop offset="100%" stopColor="hsl(224 80% 16%)" />
        </linearGradient>

        {/* the glow a lit campus throws into the sky */}
        <radialGradient id="campus-glow" cx="50%" cy="88%" r="62%">
          <stop offset="0%" stopColor="hsl(231 92% 59% / 0.42)" />
          <stop offset="55%" stopColor="hsl(256 95% 57% / 0.16)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>

        <linearGradient id="campus-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(222 70% 9%)" />
          <stop offset="100%" stopColor="hsl(222 96% 5%)" />
        </linearGradient>

        <linearGradient id="campus-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="65%" stopColor="transparent" />
          <stop offset="100%" stopColor="hsl(var(--background))" />
        </linearGradient>

        <filter id="campus-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <rect width="1600" height="900" fill="url(#campus-sky)" />

      {/* stars */}
      {Array.from({ length: 46 }).map((_, i) => {
        const x = ((i * 137) % 1600) + ((i % 3) * 11)
        const y = ((i * 89) % 380) + 20
        const r = i % 5 === 0 ? 1.8 : 1.1
        return <circle key={`star-${i}`} cx={x} cy={y} r={r} fill="white" opacity={0.14 + (i % 4) * 0.07} />
      })}

      <rect width="1600" height="900" fill="url(#campus-glow)" />

      {/* distant skyline, softened */}
      <g filter="url(#campus-blur)" opacity="0.55">
        {buildings.map((b, i) => (
          <rect
            key={`far-${i}`}
            x={b.x * 0.8 + 200}
            y={900 - b.h * 0.62}
            width={b.w * 1.3}
            height={b.h * 0.62}
            fill="hsl(222 80% 12%)"
          />
        ))}
      </g>

      {/* the campus itself */}
      <g>
        {buildings.map((b, bi) => {
          const top = 900 - b.h - 150
          const pad = 14
          const cellW = (b.w - pad * 2) / b.cols
          const cellH = (b.h - pad * 2) / b.rows
          return (
            <g key={`b-${bi}`}>
              <rect x={b.x} y={top} width={b.w} height={b.h + 160} fill="hsl(222 88% 8%)" />
              <rect x={b.x} y={top} width={b.w} height={3} fill="hsl(231 92% 59% / 0.35)" />
              {Array.from({ length: b.rows }).map((_, r) =>
                Array.from({ length: b.cols }).map((__, c) => {
                  // deterministic: roughly a third of the windows are lit
                  const lit = (r * 7 + c * 13 + bi * 5) % 5 !== 0
                  if (!lit) return null
                  const warm = (r + c + bi) % 3 === 0
                  return (
                    <rect
                      key={`w-${bi}-${r}-${c}`}
                      x={b.x + pad + c * cellW + cellW * 0.18}
                      y={top + pad + r * cellH + cellH * 0.2}
                      width={cellW * 0.56}
                      height={cellH * 0.5}
                      rx={1.5}
                      fill={warm ? 'hsl(38 95% 62%)' : 'hsl(199 90% 62%)'}
                      opacity={warm ? 0.5 : 0.34}
                    />
                  )
                }),
              )}
            </g>
          )
        })}
      </g>

      {/* treeline */}
      <g>
        {trees.map((t, i) => (
          <g key={`t-${i}`}>
            <rect x={t.x - 5} y={760} width={10} height={90} fill="hsl(222 88% 7%)" />
            <circle cx={t.x} cy={760 - t.r * 0.5} r={t.r} fill="hsl(222 80% 8%)" />
          </g>
        ))}
      </g>

      <rect x="0" y="840" width="1600" height="60" fill="url(#campus-ground)" />
      <rect x="0" y="0" width="1600" height="900" fill="url(#campus-fade)" />
    </svg>
  )
}
