/**
 * Illustrated avatars, drawn in SVG and generated deterministically from a name.
 *
 * WHY THIS EXISTS
 * There is no image-generation model available here, so a photograph cannot be
 * converted into a cartoon. What this does instead is give every account a
 * distinctive illustrated face — the same person always gets the same avatar,
 * and two people in the same list almost never collide.
 *
 * Everything is code: no binary assets, nothing to load, scales to any size,
 * and it works offline. Replace it with a real image wherever a user has
 * uploaded one — see UserAvatar.
 */

const SKIN = ['#f6d9c0', '#eec1a0', '#dda87c', '#c98a5a', '#a96a3f', '#8a5230']
const HAIR = ['#241c16', '#3d2b1f', '#5c4028', '#141418', '#6d4c33', '#8a6a45']
const SHIRT = ['#3755f7', '#5e27fa', '#44bdf5', '#1f9d6b', '#e0821a', '#d94f6e', '#7c5cff', '#0f766e']
const BACKDROP = [
  ['#e6ecff', '#c9d6ff'],
  ['#efe6ff', '#d9c9ff'],
  ['#e0f4ff', '#c2e6ff'],
  ['#e2f7ee', '#c2ecdb'],
  ['#fff1dd', '#ffe0bd'],
  ['#ffe6ee', '#ffccdb'],
]

/** FNV-1a — small, stable, and good enough to spread names across the palettes. */
function hash(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

type HairStyle = 'short' | 'side' | 'curly' | 'long' | 'bun'

function Hair({ style, colour }: { style: HairStyle; colour: string }) {
  switch (style) {
    case 'side':
      return (
        <path
          d="M27 45 Q28 18 50 18 Q72 18 73 45 Q68 33 55 32 Q44 31 38 38 Q33 43 27 45 Z"
          fill={colour}
        />
      )
    case 'curly':
      return (
        <g fill={colour}>
          <path d="M28 46 Q28 20 50 20 Q72 20 72 46 Q64 34 50 34 Q36 34 28 46 Z" />
          <circle cx="32" cy="26" r="7" />
          <circle cx="46" cy="19" r="8" />
          <circle cx="62" cy="22" r="7.5" />
          <circle cx="70" cy="33" r="6" />
        </g>
      )
    case 'long':
      return (
        <g fill={colour}>
          <path d="M25 46 Q25 17 50 17 Q75 17 75 46 L75 66 Q70 60 70 44 Q64 32 50 32 Q36 32 30 44 Q30 60 25 66 Z" />
        </g>
      )
    case 'bun':
      return (
        <g fill={colour}>
          <circle cx="50" cy="14" r="8" />
          <path d="M28 45 Q28 20 50 20 Q72 20 72 45 Q66 33 50 33 Q34 33 28 45 Z" />
        </g>
      )
    default:
      return (
        <path
          d="M28 45 Q29 19 50 19 Q71 19 72 45 Q66 32 50 32 Q34 32 28 45 Z"
          fill={colour}
        />
      )
  }
}

export function CartoonAvatar({
  name,
  size = 40,
  className,
  title,
}: {
  name: string
  size?: number
  className?: string
  title?: string
}) {
  const seed = name.trim().toLowerCase() || 'sharpoint'
  const h = hash(seed)

  const skin = SKIN[h % SKIN.length]
  const hairColour = HAIR[(h >> 3) % HAIR.length]
  const shirt = SHIRT[(h >> 6) % SHIRT.length]
  const [bgA, bgB] = BACKDROP[(h >> 9) % BACKDROP.length]
  const styles: HairStyle[] = ['short', 'side', 'curly', 'long', 'bun']
  const style = styles[(h >> 12) % styles.length]
  const glasses = (h >> 15) % 5 === 0
  const beard = (h >> 17) % 6 === 0
  const gradientId = `av-bg-${(h % 100000).toString(36)}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={title ?? `${name}'s avatar`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bgA} />
          <stop offset="100%" stopColor={bgB} />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />

      {/* shoulders */}
      <path d="M14 100 Q16 76 50 74 Q84 76 86 100 Z" fill={shirt} />
      <path d="M42 75 Q50 84 58 75 L58 100 L42 100 Z" fill="#ffffff" opacity="0.22" />

      {/* neck + head */}
      <rect x="43" y="60" width="14" height="16" rx="6" fill={skin} />
      <ellipse cx="28.5" cy="49" rx="4.6" ry="5.6" fill={skin} />
      <ellipse cx="71.5" cy="49" rx="4.6" ry="5.6" fill={skin} />
      <ellipse cx="50" cy="46" rx="21.5" ry="25" fill={skin} />

      <Hair style={style} colour={hairColour} />

      {/* brows */}
      <path d="M39 40.5 Q43 38.5 47 40" stroke={hairColour} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d="M53 40 Q57 38.5 61 40.5" stroke={hairColour} strokeWidth="1.7" fill="none" strokeLinecap="round" />

      {/* eyes */}
      <ellipse cx="43" cy="46.5" rx="3" ry="3.4" fill="#ffffff" />
      <ellipse cx="57" cy="46.5" rx="3" ry="3.4" fill="#ffffff" />
      <circle cx="43" cy="46.8" r="1.7" fill="#2b2118" />
      <circle cx="57" cy="46.8" r="1.7" fill="#2b2118" />
      <circle cx="43.5" cy="46.1" r="0.55" fill="#ffffff" />
      <circle cx="57.5" cy="46.1" r="0.55" fill="#ffffff" />

      {/* nose + mouth */}
      <path d="M50 49.5 Q48.6 54 50 55.4" stroke="#00000022" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M45.6 60 Q50 63.4 54.4 60" stroke="#8d3f3f" strokeWidth="1.9" fill="none" strokeLinecap="round" />

      {beard && (
        <path
          d="M32 50 Q33 72 50 73 Q67 72 68 50 Q64 63 50 63 Q36 63 32 50 Z"
          fill={hairColour}
          opacity="0.85"
        />
      )}

      {glasses && (
        <g stroke="#2f3a4a" strokeWidth="1.9" fill="none">
          <rect x="36" y="42.5" width="14" height="9.5" rx="4.5" />
          <rect x="50" y="42.5" width="14" height="9.5" rx="4.5" />
          <path d="M50 47 h0" />
          <path d="M36 46 h-6" strokeLinecap="round" />
          <path d="M64 46 h6" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}
