import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  getPosts,
  createPost,
  toggleLike,
  deletePost,
  awardPoints,
  getComments,
  createComment,
  deleteComment,
  logActivity,
} from '../lib/supabase.js'
import { useUserRole } from '../hooks/useUserRole.js'
import { Avatar, RoleBadge, Tag, Spinner, FilterBar, EmptyState } from '../components/UI.jsx'
import ChatWidget from '../components/ChatWidget.jsx'

const FILTERS = ['All', 'ML', 'Placement', 'CP', 'GATE', 'Advice', 'Internship']

export default function Dashboard() {
  const { profile, isOwner, loading: profileLoading } = useUserRole()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [filter, setFilter] = useState('All')
  const [tags, setTags] = useState('')
  const [openComments, setOpenComments] = useState(null) // post id
  const [comments, setComments] = useState({}) // postId -> []
  const [commentDraft, setCommentDraft] = useState('')

  const loadPosts = useCallback(async () => {
    setLoading(true)
    try {
      setPosts(await getPosts(filter))
    } catch {
      toast.error('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  async function handlePost() {
    if (!newPost.trim() || !profile) return
    setPosting(true)
    try {
      const tagArr = tags.split(',').map((t) => t.trim()).filter(Boolean)
      await createPost({ authorId: profile.id, content: newPost, tags: tagArr })
      await awardPoints(profile.id, 10, 'Created a post')
      logActivity({
        userId: profile.id, actorName: profile.name, actorRole: profile.role,
        action: 'post_created', entity: 'post',
        detail: newPost.slice(0, 80),
      })
      toast.success('Posted! +10 points earned')
      setNewPost('')
      setTags('')
      await loadPosts()
    } catch {
      toast.error('Failed to post')
    } finally {
      setPosting(false)
    }
  }

  async function handleLike(postId) {
    if (!profile) return
    try {
      const nowLiked = await toggleLike(postId, profile.id)
      if (nowLiked) {
        await awardPoints(profile.id, 1, 'Liked a post')
        logActivity({
          userId: profile.id, actorName: profile.name, actorRole: profile.role,
          action: 'post_liked', entity: 'post', detail: 'Liked a post',
        })
      }
      await loadPosts()
    } catch {
      toast.error('Failed to like')
    }
  }

  async function handleDelete(postId) {
    if (!window.confirm('Delete this post?')) return
    try {
      await deletePost(postId)
      toast.success('Post deleted')
      await loadPosts()
    } catch {
      toast.error('Failed to delete')
    }
  }

  async function toggleComments(postId) {
    if (openComments === postId) {
      setOpenComments(null)
      return
    }
    setOpenComments(postId)
    if (!comments[postId]) {
      try {
        const data = await getComments(postId)
        setComments((c) => ({ ...c, [postId]: data }))
      } catch {
        toast.error('Failed to load comments')
      }
    }
  }

  async function handleComment(postId) {
    if (!commentDraft.trim() || !profile) return
    try {
      await createComment({ postId, authorId: profile.id, content: commentDraft.trim() })
      await awardPoints(profile.id, 5, 'Commented on a post')
      logActivity({
        userId: profile.id, actorName: profile.name, actorRole: profile.role,
        action: 'comment_added', entity: 'comment',
        detail: commentDraft.trim().slice(0, 80),
      })
      const data = await getComments(postId)
      setComments((c) => ({ ...c, [postId]: data }))
      setCommentDraft('')
      await loadPosts()
    } catch {
      toast.error('Failed to comment')
    }
  }

  async function handleDeleteComment(postId, commentId) {
    try {
      await deleteComment(commentId)
      const data = await getComments(postId)
      setComments((c) => ({ ...c, [postId]: data }))
      await loadPosts()
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const isLiked = (post) => post.post_likes?.some((l) => l.user_id === profile?.id)

  if (profileLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6">
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* FEED */}
        <div>
          {/* Compose */}
          <div className="card p-5 mb-5">
            <div className="flex gap-3">
              <Avatar name={profile?.name || '?'} src={profile?.avatar_url} size={42} />
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share something with the community..."
                  className="input-field resize-none"
                  style={{ minHeight: 76 }}
                />
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags (comma separated): ML, Python, GATE..."
                  className="input-field mt-2 text-xs"
                />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400">+10 pts for posting</span>
                  <button
                    onClick={handlePost}
                    disabled={posting || !newPost.trim()}
                    className="px-5 py-2 rounded-lg text-white text-sm font-bold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}
                  >
                    {posting ? <Spinner size={16} color="#fff" /> : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <FilterBar options={FILTERS} active={filter} onChange={setFilter} />

          {loading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {!loading && posts.length === 0 && (
            <EmptyState icon="📝" title="No posts yet" subtitle="Be the first to share something." />
          )}

          {!loading &&
            posts.map((post) => (
              <div key={post.id} className="card p-5 mb-4">
                <div className="flex gap-3">
                  <Avatar name={post.author?.name} src={post.author?.avatar_url} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-gray-900">{post.author?.name}</span>
                      <RoleBadge role={post.author?.role} />
                      <span className="text-xs text-gray-400">
                        · {post.author?.college} · {post.author?.year}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    {post.tags?.length > 0 && (
                      <div className="flex gap-1.5 mt-2.5 flex-wrap">
                        {post.tags.map((t) => (
                          <Tag key={t} text={t} />
                        ))}
                      </div>
                    )}

                    <div className="flex gap-5 mt-3 pt-3 border-t border-gray-50 items-center">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1.5 text-sm font-semibold"
                        style={{
                          color: isLiked(post) ? '#e53e3e' : '#718096',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {isLiked(post) ? '❤️' : '🤍'} {post.post_likes?.length || 0}
                      </button>

                      <button
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1.5 text-sm text-gray-400"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        💬 {post.comments?.[0]?.count || 0}
                      </button>

                      <span className="text-xs text-gray-300 ml-auto">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>

                      {(isOwner || post.author?.id === profile?.id) && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-xs text-red-400 hover:text-red-600 ml-2"
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          🗑️
                        </button>
                      )}
                    </div>

                    {/* Comments */}
                    {openComments === post.id && (
                      <div className="mt-3 pt-3 border-t border-gray-50">
                        {(comments[post.id] || []).map((c) => (
                          <div key={c.id} className="flex gap-2 items-start mb-2">
                            <Avatar name={c.author?.name} src={c.author?.avatar_url} size={26} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-800">
                                  {c.author?.name}
                                </span>
                                {(isOwner || c.author?.id === profile?.id) && (
                                  <button
                                    onClick={() => handleDeleteComment(post.id, c.id)}
                                    className="text-[10px] text-red-300 hover:text-red-500"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                  >
                                    delete
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-gray-600">{c.content}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-2">
                          <input
                            value={commentDraft}
                            onChange={(e) => setCommentDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                            placeholder="Write a comment... (+5 pts)"
                            className="input-field text-xs py-2"
                          />
                          <button
                            onClick={() => handleComment(post.id)}
                            disabled={!commentDraft.trim()}
                            className="px-4 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* SIDEBAR */}
        <div>
          <div className="card p-5 mb-4 text-center">
            <Avatar name={profile?.name || '?'} src={profile?.avatar_url} size={60} />
            <h3 className="font-serif font-bold text-lg mt-3 text-gray-900">{profile?.name}</h3>
            <p className="text-xs text-gray-400 mt-1">
              {profile?.college} · {profile?.year}
            </p>
            <div className="mt-2">
              <RoleBadge role={profile?.role} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ['🏆', profile?.points || 0, 'Points'],
                ['📝', posts.filter((p) => p.author_id === profile?.id).length, 'Your Posts'],
                ['❤️', posts.reduce((n, p) => n + (p.post_likes?.length || 0), 0), 'Feed Likes'],
              ].map(([ic, v, l]) => (
                <div key={l} className="text-center">
                  <div className="font-bold text-base text-gray-900">
                    {ic} {v}
                  </div>
                  <div className="text-[10px] text-gray-400">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 mb-4">
            <h4 className="font-serif font-bold text-sm text-gray-900 mb-3">Trending Tags</h4>
            {['DSA', 'GATE2025', 'PlacementSeason', 'MLProject', 'Hackathon', 'OpenSource'].map((t) => {
              const n = posts.filter((p) => p.tags?.includes(t)).length
              return (
                <button
                  key={t}
                  onClick={() => setFilter(FILTERS.includes(t) ? t : 'All')}
                  className="flex justify-between py-1.5 border-b border-gray-50 last:border-0 w-full text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span className="text-sm font-semibold text-brand-500">#{t}</span>
                  <span className="text-xs text-gray-300">{n} posts</span>
                </button>
              )
            })}
          </div>

          <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#1e3a5f,#1e40af)' }}>
            <h4 className="font-serif font-bold text-sm mb-3">Quick Access</h4>
            {[
              ['💼', 'Opportunities', '/opportunities'],
              ['💬', 'Chat', '/chat'],
              ['🏆', 'Leaderboard', '/leaderboard'],
              ['📚', 'Resources', '/resources'],
            ].map(([ic, l, p]) => (
              <a
                key={p}
                href={p}
                className="flex items-center gap-2 p-2 rounded-lg mb-1.5 no-underline text-white text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,.1)' }}
              >
                <span>{ic}</span>
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      <ChatWidget />
    </div>
  )
}
