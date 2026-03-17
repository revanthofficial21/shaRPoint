import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/* ---------------- POSTS ---------------- */

export async function getPosts() {
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function createPost(post) {
  const { data, error } = await supabase
    .from("posts")
    .insert(post)

  if (error) throw error
  return data
}

export async function toggleLike(postId, userId) {
  const { data, error } = await supabase
    .from("post_likes")
    .insert({
      post_id: postId,
      user_id: userId
    })

  if (error) throw error
  return data
}

export async function deletePost(id) {
  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", id)

  if (error) throw error
}

/* ---------------- OPPORTUNITIES ---------------- */

export async function getOpportunities() {
  const { data, error } = await supabase
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function postOpportunity(opportunity) {
  const { data, error } = await supabase
    .from("opportunities")
    .insert(opportunity)

  if (error) throw error
  return data
}

/* ---------------- PROFILE ---------------- */

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)

  if (error) throw error
  return data
}

/* ---------------- REWARDS ---------------- */

export async function addReward(userId, points) {
  const { data, error } = await supabase
    .from("rewards")
    .insert({
      user_id: userId,
      points: points
    })

  if (error) throw error
  return data
}

/* ---------------- FILE UPLOAD ---------------- */

export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true })

  if (error) throw error
  return data
}

/* ---------------- LEADERBOARD ---------------- */

export async function getLeaderboard() {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .order("points", { ascending: false })

  if (error) throw error
  return data
}
/* ---------------- RESOURCES ---------------- */

export async function getResources() {
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function uploadResource(resource) {
  const { data, error } = await supabase
    .from("resources")
    .insert(resource)

  if (error) throw error
  return data
}

export async function incrementDownloads(id) {
  const { data, error } = await supabase
    .rpc("increment_downloads", { resource_id: id })

  if (error) throw error
  return data
}
/* ---------------- STUDY GROUPS ---------------- */

export async function getStudyGroups() {
  const { data, error } = await supabase
    .from("study_groups")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function joinStudyGroup(groupId, userId) {
  const { data, error } = await supabase
    .from("study_group_members")
    .insert({
      group_id: groupId,
      user_id: userId
    })

  if (error) throw error
  return data
}

export async function leaveStudyGroup(groupId, userId) {
  const { error } = await supabase
    .from("study_group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId)

  if (error) throw error
}
/* ---------------- ADMIN PANEL ---------------- */

export async function getAdminStats() {
  const { data: users } = await supabase
    .from("users")
    .select("*")

  const { data: posts } = await supabase
    .from("posts")
    .select("*")

  const { data: resources } = await supabase
    .from("resources")
    .select("*")

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("*")

  return {
    users: users?.length || 0,
    posts: posts?.length || 0,
    resources: resources?.length || 0,
    opportunities: opportunities?.length || 0
  }
}

export async function setUserRole(userId, role) {
  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId)

  if (error) throw error
  return data
}