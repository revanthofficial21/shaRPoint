import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getOpportunities, postOpportunity, deleteOpportunity, incrementApplicants, awardPoints } from '../lib/supabase.js'
import { useUserRole } from '../hooks/useUserRole.js'
import { Tag, Spinner, FilterBar, PageHeader, EmptyState } from '../components/UI.jsx'

const TYPES = ['All', 'Internship', 'Full-Time', 'Research', 'Fellowship']
const BLANK = { title: '', company: '', type: 'Internship', location: '', stipend: '', deadline: '', link: '', description: '', tags: '' }

export default function Opportunities() {
  const { profile, isAdmin } = useUserRole()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [applied, setApplied] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [posting, setPosting] = useState(false)
  const [form, setForm] = useState(BLANK)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await getOpportunities(filter))
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  async function handleApply(item) {
    setApplied((a) => ({ ...a, [item.id]: true }))
    if (item.link) window.open(item.link, '_blank')
    toast.success('Applied! +20 points')
    if (profile) {
      try {
        await incrementApplicants(item.id)
        await awardPoints(profile.id, 20, 'Applied to an opportunity')
      } catch {
        /* points are best-effort */
      }
    }
  }

  async function handlePost() {
    if (!profile) return
    setPosting(true)
    try {
      await postOpportunity({
        posted_by: profile.id,
        title: form.title,
        company: form.company,
        type: form.type,
        location: form.location,
        stipend: form.stipend,
        deadline: form.deadline || 'Rolling',
        link: form.link,
        description: form.description,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })
      await awardPoints(profile.id, 20, 'Posted an opportunity')
      toast.success('Opportunity posted! +20 pts')
      setShowForm(false)
      setForm(BLANK)
      await load()
    } catch {
      toast.error('Failed to post')
    } finally {
      setPosting(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this opportunity?')) return
    try {
      await deleteOpportunity(id)
      toast.success('Deleted')
      await load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 py-6">
      <PageHeader
        gradient="linear-gradient(135deg,#065f46,#059669)"
        emoji="💼"
        title="Opportunities Board"
        subtitle="Internships, jobs, fellowships & research positions"
      >
        <button
          onClick={() => setShowForm(!showForm)}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          {showForm ? '✕ Cancel' : '+ Post Opportunity'}
        </button>
      </PageHeader>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-serif font-bold text-base mb-4 text-gray-900">Post an Opportunity</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['title', 'Title *'],
              ['company', 'Company *'],
              ['location', 'Location'],
              ['stipend', 'Stipend/Salary'],
              ['deadline', 'Deadline'],
              ['link', 'Apply Link'],
            ].map(([k, p]) => (
              <input
                key={k}
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                placeholder={p}
                className="input-field text-sm"
              />
            ))}
          </div>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="input-field text-sm mt-3"
          >
            {['Internship', 'Full-Time', 'Research', 'Fellowship'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description..."
            className="input-field text-sm mt-3 resize-none"
            style={{ minHeight: 64 }}
          />
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags (comma separated): React, Python..."
            className="input-field text-sm mt-3"
          />
          <button
            onClick={handlePost}
            disabled={posting || !form.title || !form.company}
            className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#065f46,#059669)', border: 'none', cursor: 'pointer' }}
          >
            {posting ? <Spinner size={16} color="#fff" /> : 'Post Opportunity'}
          </button>
        </div>
      )}

      <FilterBar options={TYPES} active={filter} onChange={setFilter} activeColor="#059669" />

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((o) => (
          <div key={o.id} className="card p-5 flex gap-4 items-start">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
              style={{ background: '#059669', fontFamily: "'Playfair Display', serif" }}
            >
              {(o.company || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{o.title}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {o.company} · {o.location}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-base text-green-600">{o.stipend}</p>
                  <p className="text-xs text-gray-300 mt-0.5">Deadline: {o.deadline || 'Rolling'}</p>
                </div>
              </div>
              {o.description && (
                <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">{o.description}</p>
              )}
              <div className="flex gap-2 mt-3 flex-wrap items-center">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                  {o.type}
                </span>
                {(o.tags || []).map((t) => (
                  <Tag key={t} text={t} />
                ))}
                <span className="text-xs text-gray-300 ml-auto">
                  {o.poster?.name ? `by ${o.poster.name}` : ''} · {o.applicants || 0} applied
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => handleApply(o)}
                className="px-4 py-2 rounded-xl text-sm font-bold"
                style={{
                  background: applied[o.id] ? 'transparent' : 'linear-gradient(135deg,#065f46,#059669)',
                  border: applied[o.id] ? '2px solid #059669' : 'none',
                  color: applied[o.id] ? '#059669' : '#fff',
                  cursor: 'pointer',
                }}
              >
                {applied[o.id] ? '✅ Applied' : 'Apply'}
              </button>
              {(isAdmin || o.posted_by === profile?.id) && (
                <button
                  onClick={() => handleDelete(o.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  🗑️ Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <EmptyState icon="💼" title="No opportunities found" subtitle="Be the first to post one." />
        )}
      </div>
    </div>
  )
}
