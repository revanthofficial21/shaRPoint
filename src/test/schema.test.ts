import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Code-versus-schema guard, for EVERY table.
 *
 * PostgREST fails the whole request if a selected column does not exist, so a
 * typo in a `.select()` string is not a harmless mistake — it takes down the page
 * that made the call. Two real bugs of this shape have already shipped:
 *
 *   - `college` selected from `profiles`, which was never a column (Leaderboard)
 *   - `created_at` selected from `assignment_submissions`, which calls it
 *     `submitted_at` (Teacher dashboard)
 *
 * Neither is visible to TypeScript, to the build, or to a browser smoke test.
 * This parses the migrations for the real column lists and checks every select
 * string in the app against them.
 */

const root = process.cwd()

/** table name -> set of column names, parsed from the migration SQL. */
function parseSchema(): Map<string, Set<string>> {
  const dir = path.join(root, 'supabase', 'migrations')
  const sql = fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => fs.readFileSync(path.join(dir, name), 'utf8'))
    .join('\n')

  const tables = new Map<string, Set<string>>()

  const tableRe = /create table if not exists public\.(\w+)\s*\(([\s\S]*?)\n\);/g
  let match: RegExpExecArray | null
  while ((match = tableRe.exec(sql))) {
    const [, table, body] = match
    const columns = new Set<string>()
    for (const rawLine of body.split('\n')) {
      const line = rawLine.replace(/--.*$/, '').trim()
      if (!line) continue
      const keyword = line.split(/\s+/)[0].toLowerCase()
      if (['constraint', 'primary', 'unique', 'check', 'foreign', 'exclude'].includes(keyword)) {
        continue
      }
      const name = line.split(/\s+/)[0].replace(/[",]/g, '')
      if (/^[a-z_][a-z0-9_]*$/.test(name)) columns.add(name)
    }
    tables.set(table, columns)
  }
  return tables
}

/** Split a select string on top-level commas (commas inside `rel(...)` stay put). */
function splitTopLevel(input: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const char of input) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current)
  return parts
}

/** PostgREST aggregates, which appear inside an embed but are not columns. */
const AGGREGATES = new Set(['count', 'sum', 'avg', 'min', 'max'])

/** Columns referenced by a select string, with the table each belongs to. */
function extractColumns(
  select: string,
  baseTable: string,
  tables: Map<string, Set<string>>,
): { table: string; column: string }[] {
  const found: { table: string; column: string }[] = []

  for (const rawPart of splitTopLevel(select)) {
    const part = rawPart.trim()
    if (!part || part === '*') continue

    // `alias:table!fk(a, b)` or `table!fk(a, b)` or `table(a, b)`
    const embed = part.match(/^(?:(\w+):)?(\w+)(?:!\w+)?\(([\s\S]*)\)$/)
    if (embed) {
      const [, , embedTable, inner] = embed
      if (!tables.has(embedTable)) continue
      for (const nested of splitTopLevel(inner)) {
        const name = nested.trim()
        if (!name || name === '*' || name.includes('(') || name.includes(':')) continue
        if (AGGREGATES.has(name)) continue
        found.push({ table: embedTable, column: name })
      }
      continue
    }

    // `alias:column` — the column is what matters
    const name = (part.includes(':') ? part.split(':').pop()! : part).trim()
    if (!name || name.includes('(') || name.includes('*')) continue
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) continue
    found.push({ table: baseTable, column: name })
  }

  return found
}

/** Every `.from('x')` immediately followed by a `.select('...')`. */
function collectSelects(): { file: string; table: string; select: string }[] {
  const out: { file: string; table: string; select: string }[] = []
  const files: string[] = []

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (/\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)) files.push(full)
    }
  }
  walk(path.join(root, 'src'))

  const chainRe = /\.from\(\s*'(\w+)'\s*\)\s*\.select\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/g
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    let match: RegExpExecArray | null
    while ((match = chainRe.exec(source))) {
      const [, table, single, double, backtick] = match
      const select = single ?? double ?? backtick ?? ''
      if (select) out.push({ file: path.relative(root, file), table, select })
    }
  }
  return out
}

describe('select strings match the database schema', () => {
  const tables = parseSchema()

  it('parsed real column lists (guards against a vacuous pass)', () => {
    expect(tables.size).toBeGreaterThan(20)
    const profiles = tables.get('profiles')
    expect(profiles).toBeDefined()
    expect(profiles!.has('id')).toBe(true)
    expect(profiles!.has('full_name')).toBe(true)
    expect(profiles!.has('college')).toBe(false)
    const submissions = tables.get('assignment_submissions')
    expect(submissions!.has('submitted_at')).toBe(true)
    expect(submissions!.has('created_at')).toBe(false)
  })

  it('every selected column exists on its table', () => {
    const selects = collectSelects()
    // Sanity: if the scanner silently matched nothing, fail rather than pass.
    expect(selects.length).toBeGreaterThan(30)

    const problems: string[] = []
    for (const { file, table, select } of selects) {
      const columns = tables.get(table)
      if (!columns) {
        problems.push(`${file}: unknown table "${table}"`)
        continue
      }
      for (const { table: owner, column } of extractColumns(select, table, tables)) {
        const ownerColumns = tables.get(owner)
        if (!ownerColumns) continue
        if (!ownerColumns.has(column)) {
          problems.push(`${file}: ${owner}.${column} does not exist`)
        }
      }
    }

    expect(problems).toEqual([])
  })
})
