import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Code-versus-schema guard.
 *
 * PostgREST fails the whole request if a selected column does not exist, so a
 * typo in a `.select()` string is not a harmless mistake — it takes down the
 * page that made the call. That is exactly what happened with `college`, which
 * was selected from `profiles` but was never a column: the Leaderboard page
 * returned an error every time.
 *
 * Nothing else catches this. TypeScript cannot see inside a select string, and
 * the build is perfectly happy.
 */

const root = process.cwd()

/** Column names parsed out of the real table definitions in the migrations. */
function columnsOf(table: string): string[] {
  const migrationsDir = path.join(root, 'supabase', 'migrations')
  const files = fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort()

  const columns = new Set<string>()

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    const start = sql.indexOf(`create table if not exists public.${table} (`)
    if (start === -1) continue

    const body = sql.slice(start)
    const end = body.indexOf('\n);')
    const block = body.slice(0, end === -1 ? undefined : end)

    for (const rawLine of block.split('\n').slice(1)) {
      const line = rawLine.split('--')[0].trim()
      if (!line) continue
      if (/^(constraint|primary|unique|check|foreign|exclude)\b/i.test(line)) continue
      const match = line.match(/^([a-z_][a-z0-9_]*)\s/)
      if (match) columns.add(match[1])
    }
  }

  return [...columns]
}

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...sourceFiles(full))
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(full)
  }
  return out
}

/** Every `profiles!<fk>(a, b, c)` embed in the codebase. */
function profileEmbeds() {
  const found: { file: string; columns: string[] }[] = []
  for (const file of sourceFiles(path.join(root, 'src'))) {
    const source = fs.readFileSync(file, 'utf8')
    for (const match of source.matchAll(/profiles!\w+\(([^)]*)\)/g)) {
      found.push({
        file: path.relative(root, file),
        columns: match[1]
          .split(',')
          .map((column) => column.trim())
          .filter(Boolean),
      })
    }
  }
  return found
}

describe('profiles columns', () => {
  const columns = columnsOf('profiles')

  it('parses the profiles table from the migrations', () => {
    // If the parser breaks, this test would pass vacuously — so assert it found
    // real columns first.
    expect(columns.length).toBeGreaterThan(10)
    expect(columns).toContain('id')
    expect(columns).toContain('full_name')
    expect(columns).toContain('email')
  })

  it('does not contain a "college" column (the bug that broke the leaderboard)', () => {
    expect(columns).not.toContain('college')
  })

  it('every column selected from profiles actually exists', () => {
    const embeds = profileEmbeds()
    expect(embeds.length).toBeGreaterThan(0)

    const bad: string[] = []
    for (const embed of embeds) {
      for (const column of embed.columns) {
        // `*` and aggregate wrappers are not plain column names.
        if (column === '*' || column.includes('(') || column.includes(':')) continue
        if (!columns.includes(column)) bad.push(`${embed.file}: profiles.${column}`)
      }
    }
    expect(bad).toEqual([])
  })
})
