import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Asset-reference guard.
 *
 * A `url('/missing.png')` in a stylesheet, or a hard-coded `<img src="/x.png">`,
 * is a silent 404. Nothing catches it: TypeScript does not type-check string
 * paths, ESLint has no rule for it, `vite build` is happy, and the page still
 * renders — just without the image. That is exactly how the landing page shipped
 * with a hero whose background photograph was never added to the repository.
 *
 * This resolves every local asset reference in `src/` against the real contents
 * of `public/`.
 */

const root = process.cwd()
const publicDir = path.join(root, 'public')

function publicFiles(): Set<string> {
  const out = new Set<string>()
  const walk = (dir: string, prefix: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) walk(path.join(dir, entry.name), rel)
      else out.add(rel)
    }
  }
  walk(publicDir, '')
  return out
}

function sourceFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.(tsx?|css)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full)
    }
  }
  walk(path.join(root, 'src'))
  return out
}

const PATTERNS = [
  // url('/x.png')  |  url("/x.png")  |  url(/x.png)
  /url\(\s*['"]?(\/[^'")]+)['"]?\s*\)/g,
  // src="/x.png"   |  href="/x.png"
  /(?:src|href)=["'](\/[^"']+\.(?:png|jpe?g|svg|webp|gif|ico|css|js|json))["']/g,
  // '/avatars/...' inside a string literal
  /["'](\/(?:avatars|images|img|assets)\/[^"']+)["']/g,
]

describe('asset references resolve to real files', () => {
  const available = publicFiles()

  it('found the public assets (guards against a vacuous pass)', () => {
    expect(available.size).toBeGreaterThan(0)
    expect(available.has('avatars/owner.png')).toBe(true)
  })

  it('every local asset reference exists in public/', () => {
    const missing: string[] = []

    for (const file of sourceFiles()) {
      const text = fs.readFileSync(file, 'utf8')
      for (const pattern of PATTERNS) {
        pattern.lastIndex = 0
        let match: RegExpExecArray | null
        while ((match = pattern.exec(text))) {
          const ref = match[1]
          if (!ref || ref.startsWith('//') || ref.startsWith('/_')) continue
          const name = ref.replace(/^\//, '').split(/[?#]/)[0]
          if (!available.has(name)) {
            missing.push(`${path.relative(root, file)}: ${ref}`)
          }
        }
      }
    }

    expect(missing).toEqual([])
  })
})
