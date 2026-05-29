import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../context/cartStore'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/ui'
import toast from 'react-hot-toast'

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi',
]

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore()
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const shipping = totalItems >= 2 ? 0 : items.length > 0 ? 99 : 0
  const total = subtotal + shipping

  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [processing, setProcessing] = useState(false)

  const [address, setAddress] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
  })

  function handleChange(e) {
    setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function validateForm() {
    const required = ['full_name', 'phone', 'address_line1', 'city', 'state', 'pincode']
    for (const field of required) {
      if (!address[field]?.trim()) {
        toast.error(`Please fill in ${field.replace(/_/g, ' ')}`)
        return false
      }
    }
    if (!/^[0-9]{10}$/.test(address.phone)) {
      toast.error('Please enter a valid 10-digit phone number')
      return false
    }
    if (!/^[0-9]{6}$/.test(address.pincode)) {
      toast.error('Please enter a valid 6-digit pincode')
      return false
    }
    return true
  }

  async function handlePlaceOrder() {
    if (!validateForm()) return
    if (items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setProcessing(true)

    try {
      // 1. Save address to DB
      const { data: savedAddress, error: addrError } = await supabase
        .from('addresses')
        .insert({ user_id: user.id, ...address })
        .select()
        .single()

      if (addrError) throw addrError

      // 2. Create order in DB (pending payment)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          address_id: savedAddress.id,
          subtotal,
          shipping_charge: shipping,
          total_amount: total,
          status: 'pending_payment',
          payment_status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      // 3. Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) throw itemsError

      // 4. Initiate Razorpay
      const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID

      if (!razorpayKeyId || razorpayKeyId === 'rzp_test_xxxxxxxxxxxx') {
        // Demo mode - simulate payment success
        toast('Demo mode: simulating payment...', { icon: 'ℹ️' })
        await simulatePaymentSuccess(order.id)
        return
      }

      // Real Razorpay flow
      // NOTE: In production, create order via a backend/edge function for security
      const options = {
        key: razorpayKeyId,
        amount: total * 100, // paise
        currency: 'INR',
        name: 'Framed',
        description: `Order #${order.id.slice(0, 8)}`,
        order_id: order.razorpay_order_id, // set by backend
        prefill: {
          name: address.full_name,
          contact: address.phone,
          email: user.email,
        },
        theme: { color: '#465940' },
        handler: async function (response) {
          await handlePaymentSuccess(order.id, response)
        },
        modal: {
          ondismiss: async function () {
            // Mark order as payment failed
            await supabase
              .from('orders')
              .update({ status: 'payment_failed', payment_status: 'failed' })
              .eq('id', order.id)
            toast.error('Payment cancelled')
            setProcessing(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Please try again.')
      setProcessing(false)
    }
  }

  async function simulatePaymentSuccess(orderId) {
    try {
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          razorpay_payment_id: 'demo_' + Date.now(),
        })
        .eq('id', orderId)

      clearCart()
      navigate('/order-success', { state: { orderId } })
    } catch (err) {
      toast.error('Error confirming order')
    } finally {
      setProcessing(false)
    }
  }

  async function handlePaymentSuccess(orderId, response) {
    try {
      await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
        })
        .eq('id', orderId)

      clearCart()
      navigate('/order-success', { state: { orderId } })
    } catch (err) {
      toast.error('Payment received but order confirmation failed. Contact support.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="pt-16 md:pt-20">
      <PageHeader title="Checkout" breadcrumb="Cart → Checkout" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Address Form */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="font-display text-2xl text-brand-dark">Delivery Address</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={address.full_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="As per ID"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={address.phone}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={address.address_line1}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="House/Flat No., Street"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="address_line2"
                  value={address.address_line2}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Landmark, Area (optional)"
                />
              </div>

              <div>
                <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={address.pincode}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-body text-xs text-brand-dark/60 mb-1.5 uppercase tracking-wider">
                  State *
                </label>
                <select
                  name="state"
                  value={address.state}
                  onChange={handleChange}
                  className="input-field cursor-pointer"
                >
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-brand-cream border border-brand-border p-6 sticky top-24">
              <h2 className="font-display text-2xl text-brand-dark mb-5">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {items.map(item => (
                  <div key={item.key} className="flex gap-3">
                    <div className="w-12 h-14 bg-white border border-brand-border overflow-hidden flex-shrink-0">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-xs text-brand-dark font-medium line-clamp-1">{item.title}</p>
                      <p className="font-body text-xs text-brand-muted">{item.size} × {item.quantity}</p>
                    </div>
                    <span className="font-body text-xs font-medium text-brand-dark">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-brand-border mb-4" />

              <div className="space-y-2 font-body text-sm">
                <div className="flex justify-between text-brand-dark/70">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-brand-dark/70">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0
                      ? <span className="text-brand-primary font-medium">Free</span>
                      : `₹${shipping}`
                    }
                  </span>
                </div>
                <div className="h-px bg-brand-border" />
                <div className="flex justify-between font-medium text-brand-dark text-base">
                  <span>Total</span>
                  <span className="font-display text-xl">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-bg border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ₹${total.toLocaleString('en-IN')}`
                )}
              </button>

              <p className="mt-3 text-center font-body text-[10px] text-brand-muted">
                Secure payment via Razorpay. SSL encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
