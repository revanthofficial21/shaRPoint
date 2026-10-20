import { describe, expect, it } from 'vitest'
import { authErrorMessage } from './auth-errors'

describe('authErrorMessage', () => {
  it('returns null when there is no error', () => {
    expect(authErrorMessage(null)).toBeNull()
    expect(authErrorMessage(undefined)).toBeNull()
  })

  it('explains the email rate limit and how to get past it', () => {
    const message = authErrorMessage({ message: 'email rate limit exceeded' })
    expect(message).toContain('Supabase')
    // It must point at the actual fix, not just report the failure.
    expect(message).toMatch(/Confirm email|SMTP/)
    // ...and must not simply echo the raw string back.
    expect(message).not.toBe('email rate limit exceeded')
  })

  it('recognises the rate limit by code as well as by message', () => {
    const byCode = authErrorMessage({ code: 'over_email_send_rate_limit' })
    expect(byCode).toMatch(/confirmation emails/i)
  })

  it('handles a generic request rate limit distinctly', () => {
    const message = authErrorMessage({ code: 'over_request_rate_limit' })
    expect(message).toMatch(/too many attempts/i)
    expect(message).not.toMatch(/Confirm email/)
  })

  it('tells an existing user to sign in instead', () => {
    expect(authErrorMessage({ message: 'User already registered' })).toMatch(/already exists/i)
  })

  it('does not leak the raw invalid-credentials string', () => {
    const message = authErrorMessage({ message: 'Invalid login credentials' })
    expect(message).toBe("That email and password don't match. Check them and try again.")
  })

  it('tells an unconfirmed user to check their inbox', () => {
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toMatch(/confirm your email/i)
  })

  it('explains a weak password', () => {
    expect(authErrorMessage({ code: 'weak_password' })).toMatch(/stronger password/i)
  })

  it('explains a suspended account', () => {
    expect(authErrorMessage({ code: 'user_banned' })).toMatch(/suspended/i)
  })

  it('explains a network failure', () => {
    expect(authErrorMessage({ message: 'Failed to fetch' })).toMatch(/connection/i)
  })

  it('passes an unrecognised error through instead of masking it', () => {
    expect(authErrorMessage({ message: 'Something unusual happened' })).toBe(
      'Something unusual happened',
    )
  })

  it('falls back when there is neither a code nor a message', () => {
    expect(authErrorMessage({})).toMatch(/something went wrong/i)
  })

  it('is case-insensitive about the message text', () => {
    expect(authErrorMessage({ message: 'EMAIL RATE LIMIT EXCEEDED' })).toMatch(/confirmation emails/i)
  })
})
