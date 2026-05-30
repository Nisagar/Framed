import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui'
import toast from 'react-hot-toast'

const ORDER_STATUSES = ['pending_payment','confirmed','processing','shipped','delivered','cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [updating, setUpdating]     = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCustom, setFilterCustom] = useState(false)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          id, quantity, size, price, is_custom,
          custom_image_url, custom_notes, storage_path, title,
          product:products(title, slug)
        ),
        address:addresses(full_name, phone, city, state, address_line1, pincode)
      `)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(orderId, newStatus) {
    setUpdating(orderId)
    const { error } = await supabase
      .from('orders').update({ status: newStatus }).eq('id', orderId)
    if (error) {
      toast.error('Failed to update status')
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success('Order status updated')
    }
    setUpdating(null)
  }

  // Get signed URL for private custom upload images
  async function getSignedUrl(storagePath) {
    if (!storagePath) return null
    const { data } = await supabase.storage
      .from('custom-uploads')
      .createSignedUrl(storagePath, 3600)
    return data?.signedUrl || null
  }

  let filtered = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus)

  if (filterCustom) {
    filtered = filtered.filter(o => o.has_custom_poster)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner/></div>

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-brand-dark">Orders</h1>
          <p className="font-body text-sm text-brand-muted mt-1">{orders.length} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', ...ORDER_STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 font-body text-xs capitalize transition-colors ${
              filterStatus === s
                ? 'bg-brand-primary text-brand-bg'
                : 'border border-brand-border text-brand-dark hover:border-brand-primary'
            }`}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
        <button onClick={() => setFilterCustom(!filterCustom)}
          className={`px-3 py-1.5 font-body text-xs transition-colors border ${
            filterCustom
              ? 'bg-amber-500 text-white border-amber-500'
              : 'border-brand-border text-brand-dark hover:border-amber-500 hover:text-amber-600'
          }`}>
          🎨 Custom Only
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 font-body text-brand-muted">No orders found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white border border-brand-border overflow-hidden">

              {/* Order row */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 p-4 cursor-pointer hover:bg-brand-cream/40 transition-colors"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs text-brand-dark font-medium">
                    #{order.id.slice(0,8).toUpperCase()}
                  </span>
                  {order.has_custom_poster && (
                    <span className="bg-amber-100 text-amber-700 font-body text-[10px] px-2 py-0.5">
                      🎨 CUSTOM
                    </span>
                  )}
                  <span className="font-body text-xs text-brand-muted">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day:'numeric', month:'short', year:'numeric'
                    })}
                  </span>
                  {order.address && (
                    <span className="font-body text-xs text-brand-muted">
                      {order.address.full_name} · {order.address.city}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-display text-base text-brand-dark">
                    ₹{order.total_amount?.toLocaleString('en-IN')}
                  </span>
                  <select
                    value={order.status}
                    onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value) }}
                    disabled={updating === order.id}
                    onClick={e => e.stopPropagation()}
                    className="font-body text-xs border border-brand-border px-2 py-1.5 cursor-pointer bg-white focus:outline-none focus:border-brand-primary"
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                    ))}
                  </select>
                  <span className="font-body text-xs text-brand-muted">
                    {expandedId === order.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === order.id && (
                <div className="border-t border-brand-border p-4 bg-brand-cream/20 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Items list */}
                    <div>
                      <p className="font-body text-xs uppercase tracking-wider text-brand-muted mb-3">Items</p>
                      <div className="space-y-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            {/* Thumbnail */}
                            {item.is_custom && item.custom_image_url ? (
                              <CustomImageThumb
                                imageUrl={item.custom_image_url}
                                storagePath={item.storage_path}
                                getSignedUrl={getSignedUrl}
                              />
                            ) : null}

                            <div className="flex-1">
                              <p className="font-body text-sm text-brand-dark font-medium">
                                {item.is_custom ? '🎨 Custom Poster' : (item.product?.title || item.title)}
                              </p>
                              <p className="font-body text-xs text-brand-muted">
                                {item.size} × {item.quantity} — ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </p>
                              {item.is_custom && item.custom_notes && (
                                <p className="font-body text-xs text-brand-dark/60 mt-1 italic">
                                  Note: {item.custom_notes}
                                </p>
                              )}
                              {/* Download button for custom items */}
                              {item.is_custom && item.custom_image_url && (
                                <DownloadButton
                                  imageUrl={item.custom_image_url}
                                  storagePath={item.storage_path}
                                  getSignedUrl={getSignedUrl}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address + payment */}
                    <div className="space-y-4">
                      {order.address && (
                        <div>
                          <p className="font-body text-xs uppercase tracking-wider text-brand-muted mb-2">Delivery</p>
                          <p className="font-body text-sm text-brand-dark font-medium">{order.address.full_name}</p>
                          <p className="font-body text-sm text-brand-dark/70">{order.address.phone}</p>
                          <p className="font-body text-xs text-brand-muted">
                            {order.address.address_line1}, {order.address.city}, {order.address.state} - {order.address.pincode}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="font-body text-xs uppercase tracking-wider text-brand-muted mb-2">Payment</p>
                        <p className="font-body text-sm text-brand-dark capitalize">{order.payment_status}</p>
                        {order.razorpay_payment_id && (
                          <p className="font-mono text-xs text-brand-muted">{order.razorpay_payment_id}</p>
                        )}
                        <div className="mt-1 text-xs font-body text-brand-muted space-y-0.5">
                          <div>Subtotal: ₹{order.subtotal?.toLocaleString('en-IN')}</div>
                          <div>Shipping: {order.shipping_charge === 0 ? 'Free' : `₹${order.shipping_charge}`}</div>
                          <div className="font-medium text-brand-dark">Total: ₹{order.total_amount?.toLocaleString('en-IN')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Thumbnail that loads signed URL for private bucket images
function CustomImageThumb({ imageUrl, storagePath, getSignedUrl }) {
  const [src, setSrc] = useState(imageUrl)
  useEffect(() => {
    if (storagePath) {
      getSignedUrl(storagePath).then(url => { if (url) setSrc(url) })
    }
  }, [storagePath])

  return (
    <div className="w-14 h-16 bg-brand-cream border border-brand-border overflow-hidden flex-shrink-0">
      <img src={src} alt="Custom" className="w-full h-full object-cover"
        onError={() => setSrc(imageUrl)} />
    </div>
  )
}

// Download button with signed URL
function DownloadButton({ imageUrl, storagePath, getSignedUrl }) {
  const [url, setUrl] = useState(null)

  async function handleClick() {
    let downloadUrl = imageUrl
    if (storagePath) {
      const signed = await getSignedUrl(storagePath)
      if (signed) downloadUrl = signed
    }
    setUrl(downloadUrl)
    window.open(downloadUrl, '_blank')
  }

  return (
    <button
      onClick={handleClick}
      className="mt-1.5 inline-flex items-center gap-1 font-body text-xs text-brand-primary
                 border border-brand-primary px-2.5 py-1 hover:bg-brand-primary hover:text-brand-bg transition-colors"
    >
      ↓ Download Image
    </button>
  )
}