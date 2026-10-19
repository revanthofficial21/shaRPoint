import { useCallback, useEffect, useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { getUserByClerkId, createUser } from "../lib/supabase.js"

/**
 * Single source of truth for "who is this user and what can they do".
 *
 * Previously this hook was a stub that always returned the string "user",
 * so every page that read `profile` got `undefined` and `isAdmin` was never
 * true. It now:
 *   1. reads the signed-in Clerk user,
 *   2. finds (or lazily creates) their row in Supabase `users`,
 *   3. exposes { profile, role, isAdmin, isEarlyAccess, loading, refresh }.
 */
export function useUserRole() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const sync = useCallback(async () => {
    if (!isLoaded) return

    if (!isSignedIn || !user) {
      setProfile(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let row = await getUserByClerkId(user.id)

      if (!row) {
        const email =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress ||
          `${user.id}@users.noreply.clerk`

        const name =
          user.fullName ||
          user.username ||
          email.split("@")[0] ||
          "Student"

        row = await createUser({
          clerk_user_id: user.id,
          name,
          email,
          avatar_url: user.imageUrl || null,
        })
      }

      setProfile(row)
      setError(null)
    } catch (err) {
      // Most commonly: RLS blocked the insert/select because the Clerk ->
      // Supabase token isn't wired up yet. Surface it instead of failing mute.
      setError(err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [isLoaded, isSignedIn, user])

  useEffect(() => {
    sync()
  }, [sync])

  const role = profile?.role || "user"

  return {
    profile,
    role,
    loading,
    error,
    isAdmin: role === "admin",
    isEarlyAccess: role === "early_access",
    refresh: sync,
  }
}
