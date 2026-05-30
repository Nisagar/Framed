import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCartStore } from '../context/cartStore'
import { PageHeader } from '../components/ui'
import toast from 'react-hot-toast'

const SIZES = ['A4', 'A3']
const PRICES = { A4: 299, A3: 399 }
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function CustomUploadPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const addItem   = useCartStore(s => s.addItem)
  const fileInputRef = useRef(null)

  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState(null)
  const [size, setSize]         = useState('A4')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes]       = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver]   = useState(false)

  function handleFileSelect(selectedFile) {
    if (!selectedFile) return
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WEBP)')
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

  // Upload image to Supabase Storage and return the public URL
  async function uploadImage() {
    const ext      = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${ext}`

    const { data, error } = await supabase.storage
      .from('custom-uploads')
      .upload(fileName, file, { cacheControl: '3600', upsert: false })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('custom-uploads')
      .getPublicUrl(data.path)

    return { publicUrl, storagePath: data.path }
  }

  // Add to cart — uploads image first, then adds a "virtual" product to cart
  async function handleAddToCart() {
    if (!file) return toast.error('Please select an image first')
    if (!user) {
      toast.error('Please sign in to continue')
      navigate('/login', { state: { from: '/custom-upload' } })
      return
    }

    setUploading(true)
    try {
      const { publicUrl, storagePath } = await uploadImage()

      // Build a virtual product object that matches ProductCard/CartStore shape
      const customProduct = {
        id:        `custom-${Date.now()}`,
        title:     'Custom Poster',
        price:     PRICES[size],
        slug:      'custom-poster',
        image_url: publicUrl,
        images:    [{ url: publicUrl }],
        // Extra fields stored for checkout
        isCustom:     true,
        customImageUrl: publicUrl,
        storagePath,
        customNotes:  notes.trim(),
      }

      addItem(customProduct, size, quantity)
      toast.success('Custom poster added to cart!')
      navigate('/cart')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Buy Now — upload then go straight to checkout
  async function handleBuyNow() {
    if (!file) return toast.error('Please select an image first')
    if (!user) {
      toast.error('Please sign in to continue')
      navigate('/login', { state: { from: '/custom-upload' } })
      return
    }

    setUploading(true)
    try {
      const { publicUrl, storagePath } = await uploadImage()

      const customProduct = {
        id:        `custom-${Date.now()}`,
        title:     'Custom Poster',
        price:     PRICES[size],
        slug:      'custom-poster',
        image_url: publicUrl,
        images:    [{ url: publicUrl }],
        isCustom:     true,
        customImageUrl: publicUrl,
        storagePath,
        customNotes:  notes.trim(),
      }

      addItem(customProduct, size, quantity)
      navigate('/checkout')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const unitPrice   = PRICES[size]
  const totalPrice  = unitPrice * quantity

  return (
    <div className="pt-16 md:pt-20">
      <PageHeader
        title="Custom Print"
        subtitle="Upload your image — we'll print and deliver it as a premium poster"
        breadcrumb="Custom Upload"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

          {/* ── LEFT: Upload + options ── */}
          <div className="space-y-6">

            {/* Upload area */}
            <div>
              <label className="block font-body text-xs text-brand-dark/60 mb-2 uppercase tracking-wider">
                Your Image *
              </label>

              {preview ? (
                <div className="relative group">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full aspect-[3/4] object-contain bg-brand-cream border border-brand-border"
                  />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null) }}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2
                               border border-brand-border transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 text-brand-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                  <div className="absolute bottom-3 left-3 bg-brand-primary/90 text-brand-bg
                                  font-body text-xs px-3 py-1">
                    ✓ Image ready
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  className={`border-2 border-dashed transition-all cursor-pointer py-16 text-center
                    ${dragOver
                      ? 'border-brand-primary bg-brand-cream scale-[1.01]'
                      : 'border-brand-border hover:border-brand-primary hover:bg-brand-cream/50'
                    }`}
                >
                  <div className="text-5xl mb-3">🖼️</div>
                  <p className="font-body text-sm font-medium text-brand-dark">
                    Click to upload or drag & drop
                  </p>
                  <p className="font-body text-xs text-brand-muted mt-1">
                    JPG, PNG, WEBP — max 10MB
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

            {/* Notes */}
            <div>
              <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                Special Instructions (optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="E.g. crop to top half, add white border, black & white..."
                className="input-field resize-none"
              />
            </div>
          </div>

          {/* ── RIGHT: Size, Qty, Price, CTA ── */}
          <div className="space-y-6">

            {/* Product title */}
            <div>
              <p className="font-body text-xs tracking-widest uppercase text-brand-primary mb-1">
                Custom Print
              </p>
              <h2 className="font-display text-3xl text-brand-dark">Your Custom Poster</h2>
              <p className="font-body text-sm text-brand-muted mt-2">
                Premium quality print of your image. Delivered to your door.
              </p>
            </div>

            {/* Size selector */}
            <div>
              <p className="font-body text-sm font-medium text-brand-dark mb-3">
                Size: <span className="text-brand-primary">{size}</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SIZES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`py-4 border-2 transition-all duration-200 ${
                      size === s
                        ? 'border-brand-primary bg-brand-primary text-brand-bg'
                        : 'border-brand-border text-brand-dark hover:border-brand-primary'
                    }`}
                  >
                    <div className="font-body font-semibold text-sm">{s}</div>
                    <div className="font-body text-xs opacity-70 mt-0.5">
                      {s === 'A4' ? '210 × 297 mm' : '297 × 420 mm'}
                    </div>
                    <div className="font-display text-base mt-1">₹{PRICES[s]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <p className="font-body text-sm font-medium text-brand-dark mb-3">Quantity</p>
              <div className="flex items-center border border-brand-border w-fit">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 py-2.5 text-brand-dark hover:bg-brand-cream transition-colors text-lg"
                >−</button>
                <span className="px-6 py-2.5 font-body text-sm border-x border-brand-border min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="px-4 py-2.5 text-brand-dark hover:bg-brand-cream transition-colors text-lg"
                >+</button>
              </div>
            </div>

            {/* Price summary */}
            <div className="bg-brand-cream border border-brand-border p-4 space-y-2">
              <div className="flex justify-between font-body text-sm text-brand-dark/70">
                <span>Unit Price ({size})</span>
                <span>₹{unitPrice}</span>
              </div>
              <div className="flex justify-between font-body text-sm text-brand-dark/70">
                <span>Quantity</span>
                <span>× {quantity}</span>
              </div>
              <div className="h-px bg-brand-border" />
              <div className="flex justify-between font-body text-sm font-medium text-brand-dark">
                <span>Total</span>
                <span className="font-display text-xl text-brand-dark">₹{totalPrice}</span>
              </div>
              <p className="font-body text-xs text-brand-primary">
                {quantity >= 2 ? '✓ Free shipping applied' : 'Add 1 more item for free shipping'}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <motion.button
                onClick={handleAddToCart}
                disabled={uploading || !file}
                whileTap={{ scale: 0.99 }}
                className="btn-outline w-full flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"/>
                  Uploading...</>
                ) : '🛒 Add to Cart'}
              </motion.button>

              <motion.button
                onClick={handleBuyNow}
                disabled={uploading || !file}
                whileTap={{ scale: 0.99 }}
                className="btn-primary w-full flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"/>
                  Uploading...</>
                ) : 'Buy Now'}
              </motion.button>
            </div>

            {/* Info box */}
            <div className="border border-brand-border p-4 space-y-2 font-body text-xs text-brand-dark/60">
              <p>📦 Processed and shipped within 3–5 business days</p>
              <p>🖨️ Printed on premium 200gsm photo paper</p>
              <p>🔒 Secure payment via Razorpay</p>
              <p>🚚 Free shipping when you order 2 or more items</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}