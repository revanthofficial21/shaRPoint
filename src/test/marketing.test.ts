import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Guards the landing page against fabricated figures.
 *
 * The page once shipped with hard-coded "10K+ students / 500+ teachers / 200+
 * courses / 100+ opportunities" while the database held one student. Nobody caught
 * it: it type-checked, linted, built and rendered perfectly. It was simply not
 * true, and the only thing that noticed was a person reading it.
 *
 * The statistics strip has since been removed from the hero by request, so there
 * is no figure on this page at all. This keeps the guard in place for whenever one
 * is added back.
 */

const root = process.cwd()
const landing = fs.readFileSync(path.join(root, 'src', 'pages', 'LandingPage.tsx'), 'utf8')

describe('landing page claims', () => {
  it('shows no count of its own', () => {
    // Nothing on the hero asserts a number about the platform.
    expect(landing).not.toContain('usePublicStats')
    expect(landing).not.toMatch(/\b\d[\d,.]*\s*(?:K|M)\+?/)
  })

  it('contains no invented count literals', () => {
    const invented = [...landing.matchAll(/['"`](\d[\d,.]*\s*(?:K|M|k|m)?\s*\+?)['"`]/g)]
      .map((m) => m[1])
      .filter((v) => !/^\d+$/.test(v) || Number(v) > 999)
    expect(invented).toEqual([])
  })
})
