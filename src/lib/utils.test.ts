import { describe, expect, it } from 'vitest'
import { cn, formatDate, initials, relativeTime, toUserMessage } from './utils'

describe('cn', () => {
  it('joins class names and lets later Tailwind classes win', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('drops falsy values', () => {
    const hidden = false
    expect(cn('text-sm', hidden && 'hidden', undefined, null, 'font-medium')).toBe(
      'text-sm font-medium',
    )
  })
})

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Revanth Kumar')).toBe('RK')
  })

  it('handles a single name', () => {
    expect(initials('Revanth')).toBe('R')
  })

  it('collapses extra whitespace and ignores words beyond the second', () => {
    expect(initials('  Revanth   Kumar   Reddy ')).toBe('RK')
  })

  it('returns a placeholder for missing names', () => {
    expect(initials(null)).toBe('?')
    expect(initials(undefined)).toBe('?')
    expect(initials('')).toBe('?')
  })
})

describe('formatDate', () => {
  it('renders a dash when there is no value', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('formats a date without throwing', () => {
    expect(formatDate('2026-03-04T10:00:00Z')).toMatch(/2026/)
  })
})

describe('relativeTime', () => {
  const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString()

  it('returns an empty string when there is no value', () => {
    expect(relativeTime(null)).toBe('')
  })

  it('describes very recent times as just now', () => {
    expect(relativeTime(ago(10))).toBe('just now')
  })

  it('counts minutes, hours and days', () => {
    expect(relativeTime(ago(5 * 60))).toBe('5m ago')
    expect(relativeTime(ago(2 * 60 * 60))).toBe('2h ago')
    expect(relativeTime(ago(3 * 24 * 60 * 60))).toBe('3d ago')
  })

  it('falls back to a date once the gap passes a month', () => {
    const result = relativeTime(ago(40 * 24 * 60 * 60))
    expect(result).not.toContain('ago')
    expect(result).toMatch(/2026/)
  })
})

describe('toUserMessage', () => {
  it('handles a missing error', () => {
    expect(toUserMessage(null)).toBe('Something went wrong.')
  })

  it('translates a duplicate key error', () => {
    expect(toUserMessage(new Error('duplicate key value violates unique constraint'))).toBe(
      'That already exists.',
    )
  })

  it('translates an RLS denial without leaking the policy', () => {
    const message = toUserMessage(
      new Error('new row violates row-level security policy for table "posts"'),
    )
    expect(message).toBe('You do not have permission to do that.')
    expect(message).not.toContain('policy')
  })

  it('translates an expired session', () => {
    expect(toUserMessage(new Error('JWT expired'))).toBe(
      'Your session has expired. Please sign in again.',
    )
  })

  it('translates a network failure', () => {
    expect(toUserMessage(new Error('Failed to fetch'))).toBe('Network problem — please try again.')
  })

  it('passes an unrecognised message through unchanged', () => {
    expect(toUserMessage(new Error('Assignment is closed'))).toBe('Assignment is closed')
  })

  it('accepts non-Error values', () => {
    expect(toUserMessage('plain string')).toBe('plain string')
  })
})
