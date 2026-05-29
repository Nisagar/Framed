import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useCartStore } from '../context/cartStore'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/product/ProductCard'
import { Spinner, Badge } from '../components/ui'
import toast from 'react-hot-toast'

const SIZES = ['A4', 'A3']

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const addItem = useCartStore(s => s.addItem)

  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedSize, setSelectedSize] = useState('A4')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetchProduct()
    window.scrollTo(0, 0)
  }, [slug])

  async function fetchProduct() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(id, url, is_primary),
          category:categories(id, name, slug),
          sizes:product_sizes(id, size, stock_quantity)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        navigate('/products')
        return
      }

      setProduct(data)

      // Increment view count
      await supabase
        .from('products')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id)

      // Fetch related products
      const { data: rel } = await supabase
        .from('products')
        .select('*, images:product_images(url, is_primary), category:categories(name, slug)')
        .eq('category_id', data.category_id)
        .neq('id', data.id)
        .eq('is_active', true)
        .limit(4)

      setRelated(rel || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function getStockForSize(size) {
    const sizeData = product?.sizes?.find(s => s.size === size)
    return sizeData?.stock_quantity || 0
  }

  function handleAddToCart() {
    if (getStockForSize(selectedSize) < 1) {
      toast.error('This size is out of stock')
      return
    }
    addItem(product, selectedSize, quantity)
    toast.success(`Added to cart — ${product.title} (${selectedSize})`)
  }

  function handleBuyNow() {
    if (!user) {
      navigate('/login', { state: { from: `/products/${slug}` } })
      return
    }
    if (getStockForSize(selectedSize) < 1) {
      toast.error('This size is out of stock')
      return
    }
    addItem(product, selectedSize, quantity)
    navigate('/checkout')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!product) return null

  const images = product.images?.length > 0 ? product.images : [{ url: null }]
  const currentStock = getStockForSize(selectedSize)

  return (
    <div className="pt-16 md:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-body text-xs text-brand-muted mb-8">
          <Link to="/" className="hover:text-brand-primary">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-brand-primary">Posters</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link to={`/products?category=${product.category.slug}`} className="hover:text-brand-primary capitalize">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-brand-dark truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="aspect-[3/4] bg-brand-cream overflow-hidden"
            >
              {images[selectedImage]?.url ? (
                <img
                  src={images[selectedImage].url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-muted font-display text-xl">
                  No Image
                </div>
              )}
            </motion.div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-20 overflow-hidden border-2 transition-colors ${
                      i === selectedImage ? 'border-brand-primary' : 'border-transparent'
                    }`}
                  >
                    {img.url && (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Category */}
            {product.category && (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="inline-block font-body text-xs tracking-widest uppercase text-brand-primary hover:text-brand-dark transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            <h1 className="font-display text-3xl md:text-4xl font-medium text-brand-dark leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center gap-4">
              <span className="font-display text-3xl text-brand-dark">
                ₹{product.price?.toLocaleString('en-IN')}
              </span>
              {currentStock > 0 ? (
                <Badge variant="success">In Stock</Badge>
              ) : (
                <Badge variant="error">Out of Stock</Badge>
              )}
            </div>

            {product.description && (
              <p className="font-body text-sm text-brand-dark/70 leading-relaxed">
                {product.description}
              </p>
            )}

            <div className="h-px bg-brand-border" />

            {/* Size selector */}
            <div>
              <p className="font-body text-sm font-medium text-brand-dark mb-3">
                Size: <span className="text-brand-primary">{selectedSize}</span>
              </p>
              <div className="flex gap-3">
                {SIZES.map(size => {
                  const stock = getStockForSize(size)
                  const isOutOfStock = stock < 1
                  return (
                    <button
                      key={size}
                      onClick={() => !isOutOfStock && setSelectedSize(size)}
                      disabled={isOutOfStock}
                      className={`relative px-6 py-3 font-body text-sm font-medium border transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-brand-primary bg-brand-primary text-brand-bg'
                          : isOutOfStock
                          ? 'border-brand-border text-brand-muted cursor-not-allowed opacity-50'
                          : 'border-brand-border text-brand-dark hover:border-brand-primary hover:text-brand-primary'
                      }`}
                    >
                      {size}
                      {isOutOfStock && (
                        <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-red-500 text-white px-1 rounded-full">
                          OUT
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {currentStock > 0 && currentStock <= 5 && (
                <p className="mt-2 font-body text-xs text-amber-600">
                  Only {currentStock} left in {selectedSize}!
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <p className="font-body text-sm font-medium text-brand-dark mb-3">Quantity</p>
              <div className="flex items-center border border-brand-border w-fit">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="px-4 py-2 text-brand-dark hover:bg-brand-cream transition-colors font-body text-lg"
                >
                  −
                </button>
                <span className="px-5 py-2 font-body text-sm text-brand-dark border-x border-brand-border min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                  className="px-4 py-2 text-brand-dark hover:bg-brand-cream transition-colors font-body text-lg"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                disabled={currentStock < 1}
                className="btn-outline flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={currentStock < 1}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Shipping note */}
            <div className="bg-brand-cream p-4 font-body text-xs text-brand-dark/70 leading-relaxed">
              🚚 <strong>Free shipping</strong> when you order 2 or more posters.
              Single poster shipping: ₹99.
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16 md:mt-24">
            <div className="mb-8">
              <p className="section-subtitle mb-2">More to Explore</p>
              <h2 className="section-title text-3xl">Related Posters</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
