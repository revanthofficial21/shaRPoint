import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../lib/auth.jsx"
import { getUserById, createUser, logActivity } from "../lib/supabase.js"

/**
 * Single source of truth for "who is this user and what can they do".
 *
 * Identity comes from Supabase Auth; the app profile lives in public.users
 * keyed by the auth user id.
 *
 * Roles (users.role):
 *   user     -> Student   (self-selectable at signup)
 *   teacher  -> Teacher   (self-selectable at signup; more tools)
 *   admin    -> Owner     (granted manually only; console + audit trail)
 *
 * The owner role can never be set from signup metadata — the database
 * rejects it — so nobody can promote themselves.
 */
export function useUserRole() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const sync = useCallback(async () => {
    if (authLoading) return

    if (!user) {
      setProfile(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let row = await getUserById(user.id)

      if (!row) {
        const meta = user.user_metadata || {}
        const requested = meta.role === "teacher" ? "teacher" : "user"
        const name =
          meta.full_name ||
          meta.name ||
          (user.email ? user.email.split("@")[0] : "Student")

        row = await createUser({
          id: user.id,
          name,
          email: user.email || `${user.id}@sharpoint.local`,
          avatar_url: meta.avatar_url || null,
          role: requested,
        })

        logActivity({
          userId: row.id,
          actorName: row.name,
          actorRole: row.role,
          action: "signup",
          entity: "user",
          detail: `New ${requested === "teacher" ? "teacher" : "student"} account created`,
        })
      }

      setProfile(row)
      setError(null)
    } catch (err) {
      setError(err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    sync()
  }, [sync])

  const role = profile?.role || "user"
  const isOwner = role === "admin"
  const isTeacher = role === "teacher"
  const isStudent = role === "user"

  return {
    profile,
    role,
    loading,
    error,
    refresh: sync,
    isStudent,
    isTeacher,
    isOwner,
    isAdmin: isOwner, // backwards-compatible alias
    can: {
      postOpportunity: isTeacher || isOwner,
      createGroup: isTeacher || isOwner,
      uploadResource: true,
      moderate: isOwner,
      viewAudit: isOwner,
    },
  }
}
