import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '../context/cartStore'
import { useAuth } from '../context/AuthContext'
import { EmptyState, PageHeader } from '../components/ui'
import toast from 'react-hot-toast'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore()
  const subtotal = useCartStore(s => s.items.reduce((sum, i) => sum + i.price * i.quantity, 0))
  const totalItems = useCartStore(s => s.items.reduce((sum, i) => sum + i.quantity, 0))
  const shipping = totalItems >= 2 ? 0 : items.length > 0 ? 99 : 0
  const total = subtotal + shipping
  const { user } = useAuth()
  const navigate = useNavigate()

  function handleCheckout() {
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="pt-16 md:pt-20">
        <PageHeader title="Your Cart" breadcrumb="Cart" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            subtitle="Browse our collection and add some posters to your cart."
            action={<Link to="/products" className="btn-primary">Browse Posters</Link>}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="pt-16 md:pt-20">
      <PageHeader title="Your Cart" subtitle={`${totalItems} ${totalItems === 1 ? 'item' : 'items'}`} breadcrumb="Cart" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence initial={false}>
              {items.map(item => (
                <motion.div
                  key={item.key}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="flex gap-4 bg-white p-4 border border-brand-border shadow-card"
                >
                  {/* Image */}
                  <Link to={`/products/${item.slug}`} className="flex-shrink-0">
                    <div className="w-20 h-24 md:w-24 md:h-32 bg-brand-cream overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-muted text-2xl">🖼️</div>
                      )}
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/products/${item.slug}`}
                          className="font-body text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors line-clamp-2"
                        >
                          {item.title}
                        </Link>
                        <p className="font-body text-xs text-brand-muted mt-0.5">Size: {item.size}</p>
                      </div>
                      <button
                        onClick={() => {
                          removeItem(item.key)
                          toast.success('Item removed')
                        }}
                        className="flex-shrink-0 text-brand-muted hover:text-red-500 transition-colors p-1"
                        aria-label="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center border border-brand-border">
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="px-2.5 py-1 text-brand-dark hover:bg-brand-cream transition-colors text-sm"
                        >
                          −
                        </button>
                        <span className="px-3 py-1 font-body text-xs border-x border-brand-border">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="px-2.5 py-1 text-brand-dark hover:bg-brand-cream transition-colors text-sm"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-display text-lg text-brand-dark">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Clear cart */}
            <button
              onClick={() => {
                clearCart()
                toast.success('Cart cleared')
              }}
              className="font-body text-xs text-brand-muted hover:text-red-500 transition-colors"
            >
              Clear cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-brand-cream border border-brand-border p-6 sticky top-24">
              <h2 className="font-display text-2xl text-brand-dark mb-6">Order Summary</h2>

              <div className="space-y-3 font-body text-sm">
                <div className="flex justify-between text-brand-dark/70">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-brand-dark/70">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-brand-primary font-medium">Free</span>
                    ) : (
                      `₹${shipping}`
                    )}
                  </span>
                </div>

                {shipping > 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2">
                    Add 1 more poster for free shipping!
                  </p>
                )}

                <div className="h-px bg-brand-border" />

                <div className="flex justify-between font-medium text-brand-dark text-base">
                  <span>Total</span>
                  <span className="font-display text-xl">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="btn-primary w-full mt-6 text-center"
              >
                {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
              </button>

              <Link
                to="/products"
                className="block text-center font-body text-xs text-brand-muted mt-4 hover:text-brand-primary transition-colors"
              >
                ← Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
