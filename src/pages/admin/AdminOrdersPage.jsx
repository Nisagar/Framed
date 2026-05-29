import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui'
import toast from 'react-hot-toast'

const ORDER_STATUSES = ['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(quantity, size, price, product:products(title)),
        address:addresses(full_name, phone, city, state)
      `)
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(orderId, newStatus) {
    setUpdating(orderId)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to update status')
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success('Order status updated')
    }
    setUpdating(null)
  }

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus)

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-brand-dark">Orders</h1>
          <p className="font-body text-sm text-brand-muted mt-1">{orders.length} total orders</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {['all', ...ORDER_STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 font-body text-xs capitalize transition-colors ${
              filterStatus === s
                ? 'bg-brand-primary text-brand-bg'
                : 'border border-brand-border text-brand-dark hover:border-brand-primary'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 font-body text-brand-muted">No orders found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white border border-brand-border overflow-hidden">
              {/* Order header */}
              <div
                className="flex flex-wrap items-center justify-between gap-4 p-4 cursor-pointer hover:bg-brand-cream/40 transition-colors"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="font-mono text-xs text-brand-dark font-medium">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="font-body text-xs text-brand-muted">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
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

                  {/* Status dropdown */}
                  <select
                    value={order.status}
                    onChange={e => { e.stopPropagation(); updateStatus(order.id, e.target.value) }}
                    disabled={updating === order.id}
                    className="font-body text-xs border border-brand-border px-2 py-1.5 cursor-pointer bg-white focus:outline-none focus:border-brand-primary"
                    onClick={e => e.stopPropagation()}
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>

                  <span className="font-body text-xs text-brand-muted">
                    {expandedId === order.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === order.id && (
                <div className="border-t border-brand-border p-4 bg-brand-cream/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Items */}
                    <div>
                      <p className="font-body text-xs uppercase tracking-wider text-brand-muted mb-2">Items</p>
                      {order.items?.map((item, i) => (
                        <div key={i} className="font-body text-sm text-brand-dark">
                          {item.product?.title} — {item.size} × {item.quantity}
                          <span className="text-brand-muted ml-2">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>

                    {/* Address & Payment */}
                    <div className="space-y-3">
                      {order.address && (
                        <div>
                          <p className="font-body text-xs uppercase tracking-wider text-brand-muted mb-1">Delivery</p>
                          <p className="font-body text-sm text-brand-dark">
                            {order.address.full_name} · {order.address.phone}
                          </p>
                          <p className="font-body text-xs text-brand-muted">
                            {order.address.city}, {order.address.state}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="font-body text-xs uppercase tracking-wider text-brand-muted mb-1">Payment</p>
                        <p className="font-body text-sm text-brand-dark capitalize">{order.payment_status}</p>
                        {order.razorpay_payment_id && (
                          <p className="font-mono text-xs text-brand-muted">{order.razorpay_payment_id}</p>
                        )}
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
