import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// createClient() throws if the URL is missing — which would blank the whole
// app at import time. Fall back to harmless placeholders; main.jsx renders a
// clear "configuration required" screen when the real values are absent.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[shaRPoint] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. " +
      "Copy .env.example to .env and fill them in."
  )
}

/*
 * Auth bridge: Clerk -> Supabase.
 *
 * Supabase has native third-party auth for Clerk. When configured, Clerk
 * mints a JWT (template name: "supabase") whose `sub` claim is the Clerk
 * user id, and Supabase verifies it. Every Supabase request below then runs
 * as that user, so Row-Level-Security policies can identify them.
 *
 * If the template is not configured yet, getToken() throws and we fall back
 * to an anonymous request (null token). With the recommended RLS schema that
 * means the request is denied — which is the safe failure mode. See
 * SETUP_GUIDE.md ("Clerk -> Supabase auth") for the 3 steps to turn it on.
 */
async function clerkAccessToken() {
  try {
    const session = typeof window !== "undefined" ? window.Clerk?.session : null
    if (!session) return null
    return (await session.getToken({ template: "supabase" })) ?? null
  } catch {
    return null
  }
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: { persistSession: false, autoRefreshToken: false },
    accessToken: clerkAccessToken,
  }
)

/* =========================================================================
 * USERS
 * ====================================================================== */

export async function getUserByClerkId(clerkUserId) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createUser(user) {
  const { data, error } = await supabase
    .from("users")
    .insert(user)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()
  if (error) throw error
  return data
}

/* =========================================================================
 * POSTS
 * ====================================================================== */

const POST_SELECT = `
  id, content, tags, created_at, author_id,
  author:users!posts_author_id_fkey ( id, name, avatar_url, college, year, role ),
  post_likes ( user_id ),
  comments ( count )
`

export async function getPosts(tag) {
  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })

  if (tag && tag !== "All") query = query.contains("tags", [tag])

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getPostsByAuthor(authorId) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createPost({ authorId, content, tags = [] }) {
  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: authorId, content, tags })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePost(id) {
  const { error } = await supabase.from("posts").delete().eq("id", id)
  if (error) throw error
}

/** Toggles a like and returns the NEW state: true = liked, false = unliked. */
export async function toggleLike(postId, userId) {
  const { data: existing, error: findErr } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle()
  if (findErr) throw findErr

  if (existing) {
    const { error } = await supabase.from("post_likes").delete().eq("id", existing.id)
    if (error) throw error
    return false
  }

  const { error } = await supabase
    .from("post_likes")
    .insert({ post_id: postId, user_id: userId })
  if (error) throw error
  return true
}

/* =========================================================================
 * COMMENTS
 * ====================================================================== */

export async function getComments(postId) {
  const { data, error } = await supabase
    .from("comments")
    .select("id, content, created_at, author:users!comments_author_id_fkey ( id, name, avatar_url, role )")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
  if (error) throw error
  return data
}

export async function createComment({ postId, authorId, content }) {
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, content })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteComment(id) {
  const { error } = await supabase.from("comments").delete().eq("id", id)
  if (error) throw error
}

/* =========================================================================
 * REWARDS / POINTS
 * ====================================================================== */

/**
 * Awards points to a user: writes an audit row to `rewards` and bumps the
 * denormalised `users.points` counter atomically via RPC.
 */
export async function awardPoints(userId, points, activity, badge = null) {
  const { error: logErr } = await supabase
    .from("rewards")
    .insert({ user_id: userId, points, activity, badge })
  if (logErr) throw logErr

  const { error: rpcErr } = await supabase.rpc("increment_user_points", {
    uid: userId,
    amount: points,
  })
  if (rpcErr) throw rpcErr
}

export async function getUserActivity(userId, limit = 20) {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url, college, role, points")
    .order("points", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

/* =========================================================================
 * OPPORTUNITIES
 * ====================================================================== */

const OPP_SELECT = `
  *,
  poster:users!opportunities_posted_by_fkey ( id, name, avatar_url, college, role )
`

export async function getOpportunities(type) {
  let query = supabase
    .from("opportunities")
    .select(OPP_SELECT)
    .order("created_at", { ascending: false })

  if (type && type !== "All") query = query.eq("type", type)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function postOpportunity(opportunity) {
  const { data, error } = await supabase
    .from("opportunities")
    .insert(opportunity)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteOpportunity(id) {
  const { error } = await supabase.from("opportunities").delete().eq("id", id)
  if (error) throw error
}

export async function incrementApplicants(id) {
  const { error } = await supabase.rpc("increment_applicants", { opp_id: id })
  if (error) throw error
}

/* =========================================================================
 * RESOURCES
 * ====================================================================== */

const RESOURCE_SELECT = `
  *,
  uploader:users!resources_uploader_id_fkey ( id, name, avatar_url, college )
`

export async function getResources(search, type) {
  let query = supabase
    .from("resources")
    .select(RESOURCE_SELECT)
    .order("created_at", { ascending: false })

  if (type && type !== "All") query = query.eq("type", type)
  if (search) query = query.ilike("title", `%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function uploadResource(resource) {
  const { data, error } = await supabase
    .from("resources")
    .insert(resource)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteResource(id) {
  const { error } = await supabase.from("resources").delete().eq("id", id)
  if (error) throw error
}

export async function incrementDownloads(id) {
  const { error } = await supabase.rpc("increment_downloads", { resource_id: id })
  if (error) throw error
}

/* =========================================================================
 * STORAGE
 * ====================================================================== */

/** Uploads a file and returns its public URL (not the raw upload response). */
export async function uploadFile(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/* =========================================================================
 * STUDY GROUPS
 * ====================================================================== */

const GROUP_SELECT = `
  *,
  creator:users!study_groups_created_by_fkey ( id, name ),
  study_group_members ( count )
`

export async function getStudyGroups() {
  const { data, error } = await supabase
    .from("study_groups")
    .select(GROUP_SELECT)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createStudyGroup(group) {
  const { data, error } = await supabase
    .from("study_groups")
    .insert(group)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setStudyGroupActive(groupId, isActive) {
  const { error } = await supabase
    .from("study_groups")
    .update({ is_active: isActive })
    .eq("id", groupId)
  if (error) throw error
}

export async function deleteStudyGroup(id) {
  const { error } = await supabase.from("study_groups").delete().eq("id", id)
  if (error) throw error
}

export async function joinStudyGroup(groupId, userId) {
  const { error } = await supabase
    .from("study_group_members")
    .insert({ group_id: groupId, user_id: userId })
  if (error) throw error
}

export async function leaveStudyGroup(groupId, userId) {
  const { error } = await supabase
    .from("study_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId)
  if (error) throw error
}

export async function getMyGroupIds(userId) {
  const { data, error } = await supabase
    .from("study_group_members")
    .select("group_id")
    .eq("user_id", userId)
  if (error) throw error
  return (data || []).map((r) => r.group_id)
}

/* =========================================================================
 * MESSAGES
 * ====================================================================== */

export async function getConversation(meId, peerId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${meId},receiver_id.eq.${peerId}),` +
        `and(sender_id.eq.${peerId},receiver_id.eq.${meId})`
    )
    .order("timestamp", { ascending: true })
  if (error) throw error
  return data
}

export async function sendMessage(senderId, receiverId, message) {
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: senderId, receiver_id: receiverId, message })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getChatPeers(meId) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, avatar_url, college, role")
    .neq("id", meId)
    .order("name", { ascending: true })
    .limit(100)
  if (error) throw error
  return data
}

/* =========================================================================
 * ADMIN
 * ====================================================================== */

async function countOf(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
  if (error) throw error
  return count || 0
}

export async function getAdminStats() {
  const [users, posts, resources, opportunities, groups, messages] = await Promise.all([
    countOf("users"),
    countOf("posts"),
    countOf("resources"),
    countOf("opportunities"),
    countOf("study_groups"),
    countOf("messages"),
  ])
  return {
    totalUsers: users,
    totalPosts: posts,
    totalResources: resources,
    totalOpportunities: opportunities,
    totalGroups: groups,
    totalMessages: messages,
  }
}

export async function getAllUsers(search = "") {
  let query = supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function setUserRole(userId, role) {
  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getRecentActivity(limit = 20) {
  const { data, error } = await supabase
    .from("rewards")
    .select("id, points, activity, created_at, user:users!rewards_user_id_fkey ( id, name, avatar_url )")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getAdminPosts(limit = 50) {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

/* =========================================================================
 * ACTIVITY LOG  (the audit trail the owner watches)
 * ====================================================================== */

/**
 * Records one action. Never throws — an audit-log failure must not break the
 * action the user was performing.
 */
export async function logActivity({
  userId = null,
  actorName = null,
  actorRole = null,
  action,
  entity = null,
  detail = null,
}) {
  const { error } = await supabase.from("activity_log").insert({
    user_id: userId,
    actor_name: actorName,
    actor_role: actorRole,
    action,
    entity,
    detail,
  })
  if (error) console.warn("[shaRPoint] activity log failed:", error.message)
}

/** Owner console: the full audit feed, newest first. */
export async function getActivityLog({ limit = 150, action = null, role = null } = {}) {
  let query = supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (action && action !== "All") query = query.eq("action", action)
  if (role && role !== "All") query = query.eq("actor_role", role)

  const { data, error } = await query
  if (error) throw error
  return data
}

/** Distinct action types present, for the owner console filter. */
export async function getActivityActions() {
  const { data, error } = await supabase
    .from("activity_log")
    .select("action")
    .limit(1000)
  if (error) throw error
  return [...new Set((data || []).map((r) => r.action))].sort()
}
