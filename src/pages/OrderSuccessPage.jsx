import { useLocation, Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function OrderSuccessPage() {
  const { state } = useLocation()
  const orderId = state?.orderId

  return (
    <div className="pt-16 md:pt-20 min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full mx-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-20 h-20 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <svg className="w-10 h-10 text-brand-bg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>

        <h1 className="font-display text-4xl text-brand-dark mb-3">Order Confirmed!</h1>
        <p className="font-body text-sm text-brand-muted mb-2">
          Your posters are on their way!
        </p>
        {orderId && (
          <p className="font-mono text-xs text-brand-muted mb-8">
            Order ID: {orderId.slice(0, 8).toUpperCase()}
          </p>
        )}

        <div className="bg-brand-cream border border-brand-border p-6 mb-8 text-left space-y-2">
          <p className="font-body text-sm text-brand-dark/70">✓ Order placed successfully</p>
          <p className="font-body text-sm text-brand-dark/70">✓ Payment confirmed</p>
          <p className="font-body text-sm text-brand-dark/70">✓ We'll pack and ship your posters</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/dashboard" className="btn-outline flex-1 text-center">
            View Orders
          </Link>
          <Link to="/products" className="btn-primary flex-1 text-center">
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
