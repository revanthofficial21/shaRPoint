import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function initials(name: string | null | undefined) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(value: string | Date | null | undefined) {
  if (!value) return ''
  const diff = Date.now() - new Date(value).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

/** Turns a Supabase/Postgres error into something safe to show a user. */
export function toUserMessage(error: unknown): string {
  if (!error) return 'Something went wrong.'
  const message = error instanceof Error ? error.message : String(error)
  if (/duplicate key|unique constraint/i.test(message)) return 'That already exists.'
  if (/row-level security|permission denied/i.test(message))
    return 'You do not have permission to do that.'
  if (/JWT|not authenticated/i.test(message))
    return 'Your session has expired. Please sign in again.'
  if (/network|fetch/i.test(message)) return 'Network problem — please try again.'
  return message
}
