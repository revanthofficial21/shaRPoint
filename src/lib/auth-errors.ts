/**
 * Turns Supabase auth errors into something a person can act on.
 *
 * Supabase returns terse machine strings ("email rate limit exceeded",
 * "Invalid login credentials"). Showing those raw is both unhelpful and, in the
 * rate-limit case, misleading — it reads like the user did something wrong when
 * it is actually a platform setting.
 *
 * Supabase sets a stable `code` on newer errors, so prefer that and fall back to
 * matching the message text for older/edge cases.
 */

interface AuthErrorLike {
  message?: string
  code?: string
  status?: number
}

export function authErrorMessage(error: AuthErrorLike | null | undefined): string | null {
  if (!error) return null

  const code = (error.code ?? '').toLowerCase()
  const message = (error.message ?? '').toLowerCase()
  const matches = (...needles: string[]) =>
    needles.some((needle) => code === needle || message.includes(needle))

  // ── email delivery limits ────────────────────────────────────────────────
  if (matches('over_email_send_rate_limit', 'email rate limit exceeded')) {
    return (
      "Too many confirmation emails have been sent from this project recently. Supabase's " +
      "built-in email service allows only a couple per hour. Wait a few minutes, or — for " +
      "testing — turn off “Confirm email” in Supabase → Authentication → Providers → Email. " +
      'For production, connect your own SMTP provider so this limit does not apply.'
    )
  }

  if (matches('over_request_rate_limit', 'rate limit')) {
    return 'Too many attempts in a short time. Please wait a moment and try again.'
  }

  // ── sign up ──────────────────────────────────────────────────────────────
  if (matches('user_already_exists', 'user already registered', 'already been registered')) {
    return 'An account with that email already exists. Try signing in instead.'
  }

  if (matches('signup_disabled', 'signups not allowed')) {
    return 'New sign-ups are currently disabled for this platform. Contact an administrator.'
  }

  if (matches('email_address_invalid', 'unable to validate email')) {
    return "That email address doesn't look valid. Please check it and try again."
  }

  if (matches('weak_password', 'password should be at least')) {
    return 'Please choose a stronger password — at least 8 characters.'
  }

  // ── sign in ──────────────────────────────────────────────────────────────
  if (matches('invalid_credentials', 'invalid login credentials')) {
    return "That email and password don't match. Check them and try again."
  }

  if (matches('email_not_confirmed', 'email not confirmed')) {
    return 'Please confirm your email address first — check your inbox for the confirmation link.'
  }

  if (matches('user_banned', 'banned')) {
    return 'This account has been suspended. Contact a platform administrator.'
  }

  if (matches('provider_disabled', 'provider is not enabled')) {
    return "That sign-in method isn't enabled. Please use email and password."
  }

  if (matches('same_password', 'should be different from the old password')) {
    return "That's your current password — please choose a different one."
  }

  // ── transport ────────────────────────────────────────────────────────────
  if (matches('failed to fetch', 'networkerror', 'network request failed')) {
    return 'Could not reach the server. Check your connection and try again.'
  }

  // Anything unrecognised is passed through rather than swallowed, so a new
  // Supabase error is still visible instead of being masked by a generic line.
  return error.message || 'Something went wrong. Please try again.'
}
