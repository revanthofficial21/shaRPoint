import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guards the landing page's social proof.
 *
 * The page once shipped with hard-coded "10K+ students / 500+ teachers / 200+
 * courses / 100+ opportunities" while the database held one student. Nobody
 * caught it: it type-checks, lints, builds and renders perfectly. It is simply
 * not true, and the only thing that notices is a person reading it.
 *
 * So this asserts two things: the figures come from the live aggregate endpoint,
 * and no invented count literals have crept back in.
 */

const root = process.cwd()
const landing = fs.readFileSync(path.join(root, 'src', 'pages', 'LandingPage.tsx'), 'utf8')

describe('landing page social proof', () => {
  it('reads its counts from the live statistics endpoint', () => {
    expect(landing).toContain('usePublicStats')
    expect(landing).toContain('publicStats.data')
    // and the strip is wired to what the hook returns
    expect(landing).toMatch(/buildStats\(/)
  })

  it('contains no invented count literals', () => {
    // Any of these shapes is a fabricated figure: "10K+", "500+", "12,486",
    // "1.2K users". They must not appear in a string literal on this page.
    const invented = [...landing.matchAll(/['"`](\d[\d,.]*\s*(?:K|M|k|m)?\s*\+?)['"`]/g)]
      .map((m) => m[1])
      // SVG/geometry numbers never appear in quotes; these are the real
      // exceptions: Tailwind-ish values and the counts the formatter returns.
      .filter((v) => !/^\d+$/.test(v) || Number(v) > 999)

    expect(invented).toEqual([])
  })

  it('omits the figure entirely when the counts are unavailable', () => {
    // An unmigrated database or a failed request must not read as "0 students",
    // and four dashes read as a broken page. The render drops the number and the
    // tiles become an icon + label strip.
    expect(landing).toContain('if (value === undefined) return null')
    expect(landing).toMatch(/value !== null && <strong>/)
  })
})
