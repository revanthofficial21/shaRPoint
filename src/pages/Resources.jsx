import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { getResources, uploadFile, uploadResource, deleteResource, incrementDownloads, awardPoints } from '../lib/supabase.js'
import { useUserRole } from '../hooks/useUserRole.js'
import { Tag, Spinner, FilterBar, PageHeader, EmptyState } from '../components/UI.jsx'

const TYPES = ['All', 'PDF', 'Notes', 'Guide', 'Sheet']

export default function Resources() {
  const { profile, isAdmin } = useUserRole()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'PDF', tags: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const fileRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await getResources(search, filter))
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [search, filter])

  useEffect(() => {
    const t = setTimeout(load, 250) // debounce search
    return () => clearTimeout(t)
  }, [load])

  async function handleUpload() {
    if (!profile || !selectedFile || !form.title) return
    setUploading(true)
    try {
      const path = `${profile.id}/${Date.now()}_${selectedFile.name}`
      const fileUrl = await uploadFile('resources', path, selectedFile)
      await uploadResource({
        uploader_id: profile.id,
        title: form.title,
        type: form.type,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        file_url: fileUrl,
        size: `${(selectedFile.size / 1024).toFixed(0)} KB`,
      })
      await awardPoints(profile.id, 25, 'Uploaded a resource')
      toast.success('Resource uploaded! +25 pts')
      setShowUpload(false)
      setForm({ title: '', type: 'PDF', tags: '' })
      setSelectedFile(null)
      await load()
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(item) {
    try {
      await incrementDownloads(item.id)
      if (item.file_url) window.open(item.file_url, '_blank')
      toast.success('Downloading! +5 pts')
      if (profile) await awardPoints(profile.id, 5, 'Downloaded a resource')
    } catch {
      toast.error('Download failed')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this resource?')) return
    try {
      await deleteResource(id)
      toast.success('Deleted')
      await load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6">
      <PageHeader
        gradient="linear-gradient(135deg,#1e3a5f,#1e40af)"
        emoji="📚"
        title="Resource Library"
        subtitle="Resources shared by students across India"
      >
        <div className="flex gap-3 mt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes, PDFs, guides..."
            className="input-field flex-1"
            style={{ background: '#fff', color: '#1e2a3a' }}
          />
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {showUpload ? '✕ Cancel' : '+ Upload'}
          </button>
        </div>
      </PageHeader>

      {showUpload && (
        <div className="card p-5 mb-5">
          <h3 className="font-serif font-bold text-base mb-4 text-gray-900">Upload Resource</h3>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Resource title *"
            className="input-field mb-3"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="input-field mb-3"
          >
            {['PDF', 'Notes', 'Guide', 'Sheet'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags: GATE, DSA, Python..."
            className="input-field mb-3"
          />
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-brand-500"
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0])} />
            <p className="text-gray-400 text-sm">
              {selectedFile ? `📄 ${selectedFile.name}` : '📁 Click to choose file (PDF, DOCX, etc.)'}
            </p>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !form.title || !selectedFile}
            className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', border: 'none', cursor: 'pointer' }}
          >
            {uploading ? <Spinner size={16} color="#fff" /> : 'Upload Resource'}
          </button>
        </div>
      )}

      <FilterBar options={TYPES} active={filter} onChange={setFilter} />

      {loading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>
        {items.map((r) => (
          <div key={r.id} className="card p-5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 uppercase tracking-wide">
                {r.type}
              </span>
              <span className="text-sm font-bold text-yellow-500">⭐ {r.rating || '–'}</span>
            </div>
            <h3 className="font-bold text-sm text-gray-900 leading-snug">{r.title}</h3>
            <p className="text-xs text-gray-400">
              by {r.uploader?.name || 'Unknown'} · {r.uploader?.college}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {(r.tags || []).map((t) => (
                <Tag key={t} text={t} />
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-50 mt-auto">
              <span className="text-xs text-gray-400">
                ⬇️ {r.downloads || 0} · {r.size || '–'}
              </span>
              <div className="flex gap-2 items-center">
                {(isAdmin || r.uploader_id === profile?.id) && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                )}
                <button
                  onClick={() => handleDownload(r)}
                  className="px-3 py-1.5 rounded-lg text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)', border: 'none', cursor: 'pointer' }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="col-span-full">
            <EmptyState icon="📚" title="No resources found" subtitle="Upload the first one!" />
          </div>
        )}
      </div>
    </div>
  )
}
