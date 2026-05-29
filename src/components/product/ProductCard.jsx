import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCartStore } from '../../context/cartStore'
import toast from 'react-hot-toast'

export default function ProductCard({ product, index = 0 }) {
  const addItem = useCartStore(s => s.addItem)
  const imageUrl = product.images?.[0]?.url || product.image_url

  function handleQuickAdd(e) {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 'A4', 1)
    toast.success(`${product.title} added to cart`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link to={`/products/${product.slug}`} className="group block">
        <div className="relative overflow-hidden bg-brand-cream aspect-[3/4]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-muted">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span className="bg-brand-bg/90 text-brand-dark font-body text-[10px] tracking-widest uppercase px-2.5 py-1">
              {product.category?.name || product.category}
            </span>
          </div>

          {/* Quick add overlay */}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleQuickAdd}
              className="w-full bg-brand-dark/90 text-brand-bg font-body text-xs tracking-wider uppercase py-3 hover:bg-brand-primary transition-colors"
            >
              Quick Add — A4
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <h3 className="font-body text-sm text-brand-dark font-medium leading-snug line-clamp-1 group-hover:text-brand-primary transition-colors">
            {product.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className="font-display text-lg text-brand-dark">
              ₹{product.price?.toLocaleString('en-IN')}
            </span>
            <span className="font-body text-xs text-brand-muted">A3 · A4</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
