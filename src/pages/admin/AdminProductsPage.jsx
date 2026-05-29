import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Spinner, Badge } from '../../components/ui'
import toast from 'react-hot-toast'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    const { data } = await supabase
      .from('products')
      .select('*, images:product_images(url), category:categories(name), sizes:product_sizes(size, stock_quantity)')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  async function toggleActive(id, current) {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id)
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
      toast.success(`Product ${!current ? 'activated' : 'deactivated'}`)
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product? This cannot be undone.')) return
    setDeleting(id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete product')
    } else {
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success('Product deleted')
    }
    setDeleting(null)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-brand-dark">Products</h1>
          <p className="font-body text-sm text-brand-muted mt-1">{products.length} total products</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white border border-brand-border">
          <p className="font-display text-2xl text-brand-dark mb-2">No products yet</p>
          <Link to="/admin/products/new" className="btn-primary inline-block mt-3">Add First Product</Link>
        </div>
      ) : (
        <div className="bg-white border border-brand-border overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-brand-border bg-brand-cream">
                {['Image', 'Title', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-body text-xs uppercase tracking-wider text-brand-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {products.map(product => {
                const totalStock = product.sizes?.reduce((s, sz) => s + sz.stock_quantity, 0) || 0
                return (
                  <tr key={product.id} className="hover:bg-brand-cream/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-12 bg-brand-cream overflow-hidden">
                        {product.images?.[0]?.url ? (
                          <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-muted text-sm">🖼️</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-body text-sm font-medium text-brand-dark line-clamp-1">{product.title}</p>
                      <p className="font-mono text-xs text-brand-muted">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3 font-body text-xs text-brand-muted capitalize">
                      {product.category?.name || '—'}
                    </td>
                    <td className="px-4 py-3 font-display text-base text-brand-dark">
                      ₹{product.price?.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-body text-xs font-medium ${totalStock === 0 ? 'text-red-600' : totalStock <= 5 ? 'text-amber-600' : 'text-green-700'}`}>
                        {totalStock} units
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className={`text-xs font-body px-2 py-1 rounded-sm ${
                          product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/admin/products/${product.id}/edit`}
                          className="font-body text-xs text-brand-primary hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={deleting === product.id}
                          className="font-body text-xs text-red-500 hover:underline disabled:opacity-50"
                        >
                          {deleting === product.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
