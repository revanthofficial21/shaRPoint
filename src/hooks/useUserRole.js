import { useCallback, useEffect, useState } from "react"
import { useUser } from "@clerk/clerk-react"
import { getUserByClerkId, createUser, logActivity } from "../lib/supabase.js"

/**
 * Single source of truth for "who is this user and what can they do".
 *
 * Roles (stored in users.role):
 *   user     -> Student   (self-selectable at signup)
 *   teacher  -> Teacher   (self-selectable at signup; more tools)
 *   admin    -> Owner     (granted manually only; full console + audit trail)
 *
 * The owner role can NEVER be set from signup metadata — that would be a
 * privilege-escalation hole. It is assigned by hand in the database.
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

        const name = user.fullName || user.username || email.split("@")[0] || "Student"

        // Only student/teacher are self-selectable. Anything else -> student.
        const requested = user.unsafeMetadata?.role === "teacher" ? "teacher" : "user"

        row = await createUser({
          clerk_user_id: user.id,
          name,
          email,
          avatar_url: user.imageUrl || null,
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
      // Most commonly: RLS blocked the insert/select. Surface it, don't fail mute.
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
