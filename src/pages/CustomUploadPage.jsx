import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PageHeader } from '../components/ui'
import toast from 'react-hot-toast'

const SIZES = ['A4', 'A3']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function CustomUploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [size, setSize] = useState('A4')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error('File size must be under 10MB')
      return
    }
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files[0])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return toast.error('Please select an image')

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('custom-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('custom-uploads')
        .getPublicUrl(uploadData.path)

      // Save metadata to DB
      const { error: dbError } = await supabase
        .from('custom_poster_uploads')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          storage_path: uploadData.path,
          size,
          notes: notes.trim(),
          status: 'pending',
        })

      if (dbError) throw dbError

      toast.success('Upload successful! We\'ll process your custom poster soon.')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="pt-16 md:pt-20">
      <PageHeader
        title="Custom Print"
        subtitle="Upload your image and we'll print it as a premium poster"
        breadcrumb="Custom Upload"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload area */}
          <div>
            <label className="block font-body text-xs text-brand-dark/60 mb-2 uppercase tracking-wider">
              Your Image *
            </label>

            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-80 object-contain bg-brand-cream border border-brand-border"
                />
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(null) }}
                  className="absolute top-2 right-2 bg-white/90 p-1.5 hover:bg-white transition-colors"
                >
                  <svg className="w-4 h-4 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                className={`border-2 border-dashed transition-colors cursor-pointer py-16 text-center ${
                  dragOver
                    ? 'border-brand-primary bg-brand-cream'
                    : 'border-brand-border hover:border-brand-primary'
                }`}
              >
                <div className="text-4xl mb-3">📁</div>
                <p className="font-body text-sm font-medium text-brand-dark">
                  Click to upload or drag & drop
                </p>
                <p className="font-body text-xs text-brand-muted mt-1">
                  JPG, PNG, WEBP up to 10MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleFileSelect(e.target.files[0])}
            />
          </div>

          {/* Size */}
          <div>
            <label className="block font-body text-xs text-brand-dark/60 mb-3 uppercase tracking-wider">
              Poster Size *
            </label>
            <div className="flex gap-4">
              {SIZES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`flex-1 py-4 font-body text-sm font-medium border-2 transition-all ${
                    size === s
                      ? 'border-brand-primary bg-brand-primary text-brand-bg'
                      : 'border-brand-border text-brand-dark hover:border-brand-primary'
                  }`}
                >
                  <div className="text-lg mb-1">{s === 'A4' ? '📄' : '🗒️'}</div>
                  {s}
                  <div className="font-body text-xs opacity-70 mt-0.5">
                    {s === 'A4' ? '210 × 297 mm' : '297 × 420 mm'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
              Special Instructions (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="E.g. crop to show only the top half, add a white border, make it black & white..."
              className="input-field resize-none"
            />
          </div>

          <div className="bg-brand-cream border border-brand-border p-4 font-body text-xs text-brand-dark/70 space-y-1">
            <p>📋 <strong>What happens next:</strong></p>
            <p>• Your image will be reviewed within 24 hours</p>
            <p>• We'll confirm the print quality before processing</p>
            <p>• You'll receive an update via email once ready</p>
          </div>

          <motion.button
            type="submit"
            disabled={uploading || !file}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.99 }}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : 'Submit Custom Print Request'}
          </motion.button>
        </form>
      </div>
    </div>
  )
}
