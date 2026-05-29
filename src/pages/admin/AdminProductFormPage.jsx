import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui'
import toast from 'react-hot-toast'

function slugify(text) {
  return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-')
}

export default function AdminProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [imageFiles, setImageFiles] = useState([])
  const [existingImages, setExistingImages] = useState([])

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    category_id: '',
    is_active: true,
    stock_a4: '',
    stock_a3: '',
  })

  useEffect(() => {
    fetchCategories()
    if (isEdit) fetchProduct()
  }, [id])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
  }

  async function fetchProduct() {
    const { data } = await supabase
      .from('products')
      .select('*, images:product_images(*), sizes:product_sizes(*)')
      .eq('id', id)
      .single()

    if (data) {
      const a4 = data.sizes?.find(s => s.size === 'A4')
      const a3 = data.sizes?.find(s => s.size === 'A3')
      setForm({
        title: data.title,
        slug: data.slug,
        description: data.description || '',
        price: data.price,
        category_id: data.category_id || '',
        is_active: data.is_active,
        stock_a4: a4?.stock_quantity ?? '',
        stock_a3: a3?.stock_quantity ?? '',
      })
      setExistingImages(data.images || [])
    }
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'title' && !isEdit ? { slug: slugify(value) } : {}),
    }))
  }

  async function uploadImages(productId) {
    const urls = []
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop()
      const path = `products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from('product-images').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(data.path)
        urls.push({ url: publicUrl, storage_path: data.path, is_primary: urls.length === 0 })
      }
    }
    return urls
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.price || !form.category_id) {
      return toast.error('Please fill title, price and category')
    }

    setSaving(true)
    try {
      const productData = {
        title: form.title,
        slug: form.slug || slugify(form.title),
        description: form.description,
        price: parseFloat(form.price),
        category_id: form.category_id,
        is_active: form.is_active,
      }

      let productId = id

      if (isEdit) {
        const { error } = await supabase.from('products').update(productData).eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('products').insert(productData).select().single()
        if (error) throw error
        productId = data.id
      }

      // Handle stock/sizes
      const sizes = [
        { product_id: productId, size: 'A4', stock_quantity: parseInt(form.stock_a4) || 0 },
        { product_id: productId, size: 'A3', stock_quantity: parseInt(form.stock_a3) || 0 },
      ]

      if (isEdit) {
        for (const sizeData of sizes) {
          await supabase
            .from('product_sizes')
            .upsert(sizeData, { onConflict: 'product_id,size' })
        }
      } else {
        await supabase.from('product_sizes').insert(sizes)
      }

      // Upload new images
      if (imageFiles.length > 0) {
        const imageData = await uploadImages(productId)
        if (imageData.length > 0) {
          await supabase.from('product_images').insert(
            imageData.map((img, i) => ({
              product_id: productId,
              url: img.url,
              storage_path: img.storage_path,
              is_primary: i === 0 && existingImages.length === 0,
            }))
          )
        }
      }

      toast.success(isEdit ? 'Product updated!' : 'Product created!')
      navigate('/admin/products')
    } catch (err) {
      console.error(err)
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function deleteImage(imageId, storagePath) {
    await supabase.storage.from('product-images').remove([storagePath])
    await supabase.from('product_images').delete().eq('id', imageId)
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
    toast.success('Image removed')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-brand-dark">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">Title *</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} className="input-field" placeholder="Poster title" required />
        </div>

        {/* Slug */}
        <div>
          <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">Slug *</label>
          <input type="text" name="slug" value={form.slug} onChange={handleChange} className="input-field font-mono text-sm" placeholder="url-friendly-slug" required />
        </div>

        {/* Description */}
        <div>
          <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Short product description..." />
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">Price (₹) *</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} className="input-field" placeholder="299" min="0" step="1" required />
          </div>
          <div>
            <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">Category *</label>
            <select name="category_id" value={form.category_id} onChange={handleChange} className="input-field cursor-pointer" required>
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock per size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">A4 Stock</label>
            <input type="number" name="stock_a4" value={form.stock_a4} onChange={handleChange} className="input-field" placeholder="0" min="0" />
          </div>
          <div>
            <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">A3 Stock</label>
            <input type="number" name="stock_a3" value={form.stock_a3} onChange={handleChange} className="input-field" placeholder="0" min="0" />
          </div>
        </div>

        {/* Images */}
        <div>
          <label className="block font-body text-xs text-brand-dark/60 mb-2 uppercase tracking-wider">Product Images</label>

          {existingImages.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {existingImages.map(img => (
                <div key={img.id} className="relative group w-20 h-24">
                  <img src={img.url} alt="" className="w-full h-full object-cover border border-brand-border" />
                  <button
                    type="button"
                    onClick={() => deleteImage(img.id, img.storage_path)}
                    className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => setImageFiles(Array.from(e.target.files))}
            className="input-field cursor-pointer file:mr-3 file:font-body file:text-xs file:border-0 file:bg-brand-primary file:text-brand-bg file:px-3 file:py-1"
          />
          {imageFiles.length > 0 && (
            <p className="font-body text-xs text-brand-primary mt-1">{imageFiles.length} file(s) selected</p>
          )}
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="w-4 h-4 accent-brand-primary"
          />
          <label htmlFor="is_active" className="font-body text-sm text-brand-dark">
            Active (visible on store)
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-outline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
