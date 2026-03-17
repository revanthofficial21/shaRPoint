import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getOpportunities, postOpportunity } from '../lib/supabase.js'
import { addReward } from '../lib/supabase.js'
import { useUserRole } from '../hooks/useUserRole.js'
import { Tag, Spinner, FilterBar, PageHeader } from '../components/UI.jsx'

const TYPES = ['All','Internship','Full-Time','Research','Fellowship']

export default function Opportunities() {
  const { profile } = useUserRole()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('All')
  const [applied, setApplied] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [posting, setPosting] = useState(false)
  const [form, setForm] = useState({ title:'',company:'',type:'Internship',location:'',stipend:'',deadline:'',link:'',description:'',tags:'' })

  useEffect(() => { load() }, [filter])

  async function load() {
    setLoading(true)
    try { setItems(await getOpportunities(filter === 'All' ? '' : filter)) }
    catch (e) { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  function handleApply(item) {
    setApplied(a => ({ ...a, [item.id]: true }))
    if (item.link) window.open(item.link, '_blank')
    toast.success('✅ Applied! +20 points')
    if (profile) addReward({ userId: profile.id, points: 20, activity: 'Applied to opportunity' })
  }

  async function handlePost() {
    if (!profile) return
    setPosting(true)
    try {
      await postOpportunity({
        postedBy: profile.id,
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      await addReward({ userId: profile.id, points: 20, activity: 'Posted an opportunity' })
      toast.success('✅ Opportunity posted! +20 pts')
      setShowForm(false)
      setForm({ title:'',company:'',type:'Internship',location:'',stipend:'',deadline:'',link:'',description:'',tags:'' })
      await load()
    } catch (e) { toast.error('Failed to post') }
    finally { setPosting(false) }
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 py-6">
      <PageHeader gradient="linear-gradient(135deg,#065f46,#059669)" emoji="💼" title="Opportunities Board"
        subtitle="2,100+ internships, jobs, fellowships & research positions">
        <button onClick={() => setShowForm(!showForm)}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background:'rgba(255,255,255,.2)', color:'#fff', border:'none', cursor:'pointer' }}>
          {showForm ? '✕ Cancel' : '+ Post Opportunity'}
        </button>
      </PageHeader>

      {showForm && (
        <div className="card p-5 mb-5">
          <h3 className="font-serif font-bold text-base mb-4 text-gray-900">Post an Opportunity</h3>
          <div className="grid grid-cols-2 gap-3">
            {[['title','Title *'],['company','Company *'],['location','Location'],['stipend','Stipend/Salary'],['deadline','Deadline'],['link','Apply Link']].map(([k,p]) => (
              <input key={k} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})}
                placeholder={p} className="input-field text-sm" />
            ))}
          </div>
          <select value={form.type} onChange={e => setForm({...form,type:e.target.value})} className="input-field text-sm mt-3">
            {['Internship','Full-Time','Research','Fellowship'].map(t => <option key={t}>{t}</option>)}
          </select>
          <textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})}
            placeholder="Description..." className="input-field text-sm mt-3 resize-none" style={{ minHeight:64 }} />
          <input value={form.tags} onChange={e => setForm({...form,tags:e.target.value})}
            placeholder="Tags (comma separated): React, Python..." className="input-field text-sm mt-3" />
          <button onClick={handlePost} disabled={posting || !form.title || !form.company}
            className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background:'linear-gradient(135deg,#065f46,#059669)', border:'none', cursor:'pointer' }}>
            {posting ? <Spinner size={16} color="#fff" /> : 'Post Opportunity'}
          </button>
        </div>
      )}

      <FilterBar options={TYPES} active={filter} onChange={setFilter} activeColor="#059669" />

      {loading && <div className="flex justify-center py-8"><Spinner /></div>}

      <div className="flex flex-col gap-3">
        {items.map(o => (
          <div key={o.id} className="card p-5 flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                 style={{ background: '#059669', fontFamily:"'Playfair Display', serif" }}>
              {(o.company || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <h3 className="font-bold text-base text-gray-900">{o.title}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{o.company} · {o.location}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-base text-green-600">{o.stipend}</p>
                  <p className="text-xs text-gray-300 mt-0.5">Deadline: {o.deadline || 'Rolling'}</p>
                </div>
              </div>
              {o.description && <p className="text-sm text-gray-500 mt-2 leading-relaxed line-clamp-2">{o.description}</p>}
              <div className="flex gap-2 mt-3 flex-wrap items-center">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">{o.type}</span>
                {(o.tags || []).map(t => <Tag key={t} text={t} />)}
              </div>
            </div>
            <button
              onClick={() => handleApply(o)}
              className="px-4 py-2 rounded-xl text-white text-sm font-bold flex-shrink-0"
              style={{ background: applied[o.id] ? 'transparent' : 'linear-gradient(135deg,#065f46,#059669)', border: applied[o.id] ? '2px solid #059669' : 'none', color: applied[o.id] ? '#059669' : '#fff', cursor:'pointer' }}>
              {applied[o.id] ? '✅ Applied' : 'Apply'}
            </button>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-center py-12 text-gray-300 text-sm">No opportunities found. Be the first to post!</div>
        )}
      </div>
    </div>
  )
}
