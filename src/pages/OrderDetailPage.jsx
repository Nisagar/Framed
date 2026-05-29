import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { PageHeader, Badge, Spinner } from '../components/ui'

const STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'delivered']

export default function OrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrder() {
      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*, product:products(title, slug, images:product_images(url))),
          address:addresses(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()
      setOrder(data)
      setLoading(false)
    }
    if (user) fetchOrder()
  }, [id, user])

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-20"><Spinner /></div>
  if (!order) return <div className="pt-20 text-center py-20 font-body text-brand-muted">Order not found</div>

  const stepIndex = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="pt-16 md:pt-20">
      <PageHeader
        title={`Order #${order.id.slice(0, 8).toUpperCase()}`}
        breadcrumb="Dashboard → Orders"
        subtitle={new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-8">
        {/* Status tracker */}
        {stepIndex >= 0 && (
          <div className="bg-brand-cream border border-brand-border p-6">
            <h3 className="font-body text-xs uppercase tracking-widest text-brand-muted mb-5">Order Status</h3>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-3 left-0 right-0 h-0.5 bg-brand-border" />
              <div
                className="absolute top-3 left-0 h-0.5 bg-brand-primary transition-all duration-500"
                style={{ width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="relative flex flex-col items-center gap-2 z-10">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    i <= stepIndex ? 'bg-brand-primary border-brand-primary' : 'bg-brand-bg border-brand-border'
                  }`}>
                    {i < stepIndex && (
                      <svg className="w-3 h-3 text-brand-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-body text-[10px] text-brand-muted capitalize">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div>
          <h3 className="font-display text-2xl text-brand-dark mb-4">Items Ordered</h3>
          <div className="space-y-3">
            {order.items?.map(item => (
              <div key={item.id} className="flex gap-4 border border-brand-border bg-white p-4">
                <div className="w-14 h-18 bg-brand-cream overflow-hidden flex-shrink-0">
                  {item.product?.images?.[0]?.url && (
                    <img src={item.product.images[0].url} alt={item.product.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <Link to={`/products/${item.product?.slug}`} className="font-body text-sm font-medium text-brand-dark hover:text-brand-primary">
                    {item.product?.title}
                  </Link>
                  <p className="font-body text-xs text-brand-muted">{item.size} × {item.quantity}</p>
                </div>
                <span className="font-display text-lg text-brand-dark">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Delivery address */}
          {order.address && (
            <div className="bg-brand-cream border border-brand-border p-5">
              <h4 className="font-body text-xs uppercase tracking-widest text-brand-muted mb-3">Delivery Address</h4>
              <p className="font-body text-sm text-brand-dark font-medium">{order.address.full_name}</p>
              <p className="font-body text-sm text-brand-dark/70 mt-1 leading-relaxed">
                {order.address.address_line1}
                {order.address.address_line2 && `, ${order.address.address_line2}`}
                <br />
                {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
              <p className="font-body text-sm text-brand-dark/70">{order.address.phone}</p>
            </div>
          )}

          {/* Payment summary */}
          <div className="bg-brand-cream border border-brand-border p-5">
            <h4 className="font-body text-xs uppercase tracking-widest text-brand-muted mb-3">Payment</h4>
            <div className="space-y-1.5 font-body text-sm">
              <div className="flex justify-between text-brand-dark/70">
                <span>Subtotal</span>
                <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-brand-dark/70">
                <span>Shipping</span>
                <span>{order.shipping_charge === 0 ? 'Free' : `₹${order.shipping_charge}`}</span>
              </div>
              <div className="flex justify-between font-medium text-brand-dark pt-1 border-t border-brand-border">
                <span>Total</span>
                <span>₹{order.total_amount?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-brand-muted pt-1">
                <span>Payment Status</span>
                <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                  {order.payment_status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Link to="/dashboard" className="inline-block font-body text-sm text-brand-primary hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
