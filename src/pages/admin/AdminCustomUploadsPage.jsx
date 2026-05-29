import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui'
import toast from 'react-hot-toast'

const UPLOAD_STATUSES = ['pending', 'reviewing', 'approved', 'printing', 'shipped', 'delivered', 'rejected']

export default function AdminCustomUploadsPage() {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { fetchUploads() }, [])

  async function fetchUploads() {
    const { data } = await supabase
      .from('custom_poster_uploads')
      .select('*, user:profiles(full_name, id)')
      .order('created_at', { ascending: false })

    // For each upload, generate a signed URL so private bucket images load
    const withSignedUrls = await Promise.all(
      (data || []).map(async (upload) => {
        if (!upload.storage_path) return upload
        const { data: signed } = await supabase.storage
          .from('custom-uploads')
          .createSignedUrl(upload.storage_path, 3600) // 1 hour expiry
        return { ...upload, signed_url: signed?.signedUrl || upload.image_url }
      })
    )

    setUploads(withSignedUrls)
    setLoading(false)
  }

  async function updateStatus(uploadId, newStatus) {
    setUpdating(uploadId)
    const { error } = await supabase
      .from('custom_poster_uploads')
      .update({ status: newStatus })
      .eq('id', uploadId)

    if (error) {
      toast.error('Failed to update status')
    } else {
      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: newStatus } : u))
      toast.success('Status updated')
    }
    setUpdating(null)
  }

  const filtered = filterStatus === 'all' ? uploads : uploads.filter(u => u.status === filterStatus)

  const statusColor = {
    pending:   'bg-yellow-100 text-yellow-700',
    reviewing: 'bg-blue-100 text-blue-700',
    approved:  'bg-indigo-100 text-indigo-700',
    printing:  'bg-purple-100 text-purple-700',
    shipped:   'bg-cyan-100 text-cyan-700',
    delivered: 'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-brand-dark">Custom Uploads</h1>
        <p className="font-body text-sm text-brand-muted mt-1">{uploads.length} total uploads</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['all', ...UPLOAD_STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 font-body text-xs capitalize transition-colors ${
              filterStatus === s
                ? 'bg-brand-primary text-brand-bg'
                : 'border border-brand-border text-brand-dark hover:border-brand-primary'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 font-body text-brand-muted">No uploads found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(upload => {
            const imgSrc = upload.signed_url || upload.image_url
            return (
              <div key={upload.id} className="bg-white border border-brand-border overflow-hidden flex flex-col">

                {/* ── Image (fixed small size) ── */}
                <div className="w-full h-44 bg-brand-cream flex items-center justify-center overflow-hidden relative group">
                  {imgSrc ? (
                    <>
                      <img
                        src={imgSrc}
                        alt="Custom upload"
                        className="w-full h-full object-contain p-2"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                      />
                      {/* Fallback if image fails */}
                      <div className="hidden w-full h-full items-center justify-center flex-col gap-2 text-brand-muted absolute inset-0 bg-brand-cream">
                        <span className="text-3xl">🖼️</span>
                        <span className="font-body text-xs">Image unavailable</span>
                      </div>
                      {/* Hover overlay — open full image */}
                      <a
                        href={imgSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <span className="bg-white text-brand-dark font-body text-xs px-3 py-1.5">
                          View Full
                        </span>
                      </a>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-brand-muted">
                      <span className="text-3xl">🖼️</span>
                      <span className="font-body text-xs">No image</span>
                    </div>
                  )}
                </div>

                {/* ── Card details ── */}
                <div className="p-3 flex flex-col gap-2 flex-1">

                  {/* User + size + status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-body text-xs font-semibold text-brand-dark truncate">
                        {upload.user?.full_name || 'Unknown User'}
                      </p>
                      <p className="font-body text-[11px] text-brand-muted">
                        {new Date(upload.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="font-body text-[10px] bg-brand-cream border border-brand-border px-2 py-0.5">
                        {upload.size}
                      </span>
                      <span className={`font-body text-[10px] px-2 py-0.5 capitalize ${statusColor[upload.status] || 'bg-gray-100 text-gray-600'}`}>
                        {upload.status}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {upload.notes && (
                    <p className="font-body text-[11px] text-brand-dark/60 bg-brand-cream px-2 py-1.5 leading-relaxed line-clamp-2">
                      "{upload.notes}"
                    </p>
                  )}

                  {/* Status dropdown */}
                  <select
                    value={upload.status}
                    onChange={e => updateStatus(upload.id, e.target.value)}
                    disabled={updating === upload.id}
                    className="w-full font-body text-xs border border-brand-border px-2 py-1.5 cursor-pointer bg-white focus:outline-none focus:border-brand-primary mt-auto"
                  >
                    {UPLOAD_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  {/* Download */}
                  {imgSrc && (
                    <a
                      href={imgSrc}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center font-body text-[11px] text-brand-primary border border-brand-primary py-1.5 hover:bg-brand-primary hover:text-brand-bg transition-colors"
                    >
                      ↓ Download Image
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}