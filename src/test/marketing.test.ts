import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guards the landing page's social proof.
 *
 * The page once shipped with hard-coded "10K+ students / 500+ teachers / 200+
 * courses / 100+ opportunities" while the database held one student. Nobody
 * caught it: it type-checked, linted, built and rendered perfectly. It was simply
 * not true, and the only thing that noticed was a person reading it.
 *
 * So these assert the figures come from the live aggregate endpoint, and that no
 * invented count literal has crept back in.
 */

const root = process.cwd()
const landing = fs.readFileSync(path.join(root, 'src', 'pages', 'LandingPage.tsx'), 'utf8')

describe('landing page social proof', () => {
  it('reads its counts from the live statistics endpoint', () => {
    expect(landing).toContain('usePublicStats')
    expect(landing).toContain('publicStats.data')
    expect(landing).toMatch(/buildStats\(/)
  })

  it('contains no invented count literals', () => {
    // "10K+", "500+", "12,486" — any of these shapes is a fabricated figure.
    const invented = [...landing.matchAll(/['"`](\d[\d,.]*\s*(?:K|M|k|m)?\s*\+?)['"`]/g)]
      .map((m) => m[1])
      .filter((v) => !/^\d+$/.test(v) || Number(v) > 999)
    expect(invented).toEqual([])
  })

  it('drops the figure rather than showing a zero it cannot vouch for', () => {
    expect(landing).toContain('if (value === undefined) return null')
    expect(landing).toMatch(/value !== null && <strong>/)
  })
})
