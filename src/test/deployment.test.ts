import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Hosting invariants.
 *
 * These catch a class of bug that is invisible to every other test: the app
 * builds and boots perfectly in isolation, then 404s on the live host the first
 * time anyone opens a deep link or comes back from a Supabase auth redirect.
 * That is exactly what happened — the confirmation email points at
 * /auth/callback, and without an SPA fallback the host answers with its own 404.
 */

const root = process.cwd()
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8')

interface VercelRoute {
  handle?: string
  src?: string
  dest?: string
}

describe('Vercel configuration', () => {
  const config = JSON.parse(read('vercel.json')) as { routes?: VercelRoute[] }
  const routes = config.routes ?? []

  it('defines routes at all', () => {
    expect(routes.length).toBeGreaterThan(0)
  })

  it('checks the filesystem before falling back', () => {
    // Without this the catch-all would also swallow /assets/*.js and serve
    // index.html for the JavaScript bundle.
    expect(routes.some((route) => route.handle === 'filesystem')).toBe(true)
  })

  it('falls back to index.html so client-side routes resolve', () => {
    const fallback = routes.find((route) => route.dest === '/index.html')
    expect(fallback).toBeDefined()
    expect(fallback?.src).toBe('/.*')
  })

  it('places the filesystem check before the catch-all', () => {
    const filesystemIndex = routes.findIndex((route) => route.handle === 'filesystem')
    const fallbackIndex = routes.findIndex((route) => route.dest === '/index.html')
    expect(filesystemIndex).toBeGreaterThanOrEqual(0)
    expect(filesystemIndex).toBeLessThan(fallbackIndex)
  })
})

describe('Netlify configuration', () => {
  it('ships an SPA fallback in the published directory', () => {
    const redirects = read(path.join('public', '_redirects'))
    expect(redirects).toMatch(/^\/\*\s+\/index\.html\s+200\s*$/m)
  })

  it('publishes the Vite output directory', () => {
    const config = read('netlify.toml')
    expect(config).toContain('publish = "dist"')
    expect(config).toContain('to = "/index.html"')
  })
})

describe('entry document', () => {
  const html = read('index.html')

  it('provides the React mount point', () => {
    expect(html).toContain('id="root"')
  })

  it('applies the theme before first paint', () => {
    // Dark is the default; the class must be set by an inline script in <head>,
    // not by React, or the first paint flashes the wrong theme.
    expect(html).toMatch(/class="light"/)
    expect(html).toContain('sharpoint-theme')
    expect(html).toContain("classList.toggle('dark'")
  })

  it('keeps the boot-failure safety net', () => {
    // A blank page is the worst failure mode; this must stay.
    expect(html).toContain('failed to start')
  })

  it('declares a language', () => {
    expect(html).toMatch(/<html[^>]+lang="en"/)
  })
})

describe('no unfinished routes', () => {
  const app = read(path.join('src', 'app', 'App.tsx'))

  it('has no placeholder component wired up', () => {
    expect(app).not.toContain('ComingSoon')
  })

  it('does not defer any route to a later phase', () => {
    // e.g. "Phase 6 — Realtime messaging" left on a route
    expect(app).not.toMatch(/Phase\s*\d/)
  })

  it('every lazy import names an export the module actually provides', () => {
    // Cheap guard against a route pointing at a component that was renamed.
    const imports = [...app.matchAll(/import\('([^']+)'\),\s*'([A-Za-z]+)'/g)].map(
      ([, specifier, name]) => ({ specifier, name }),
    )
    expect(imports.length).toBeGreaterThan(20)

    const missing: string[] = []
    for (const { specifier, name } of imports) {
      const relative = specifier.replace('@/', 'src/')
      const candidates = [
        `${relative}.tsx`,
        `${relative}.ts`,
        `${relative}/index.tsx`,
        `${relative}/index.ts`,
      ]
      const file = candidates.find((candidate) => fs.existsSync(path.join(root, candidate)))
      if (!file) {
        missing.push(`${specifier} (no file)`)
        continue
      }
      const source = read(file)
      if (!new RegExp(`export\\s+(function|const)\\s+${name}\\b`).test(source)) {
        missing.push(`${specifier} does not export ${name}`)
      }
    }
    expect(missing).toEqual([])
  })
})

describe('auth redirect targets', () => {
  it('only redirects to paths the SPA fallback covers', () => {
    const provider = read(path.join('src', 'features', 'auth', 'AuthProvider.tsx'))
    // allows the slash in `auth/callback`
    const targets = [...provider.matchAll(/origin\}\/([a-z/-]+)/g)].map((match) => match[1])
    expect(targets).toContain('auth/callback')
    expect(targets).toContain('reset-password')
  })
})
