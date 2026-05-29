import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/product/ProductCard'
import ProductSkeleton from '../components/product/ProductSkeleton'

// ── Put your actual image paths here ──
// These images come from your /images/ folder that you already have locally.
// Once you upload them to Supabase Storage (product-images bucket),
// replace these with the Supabase public URLs.
const CATEGORIES = [
  {
    id: 'anime',
    label: 'Anime',
    description: 'Icons from the world of anime',
    image: 'images/anime/anime-1.jpg',   // ← change filename to match yours
    accent: '#c0392b',
    textColor: 'text-white',
  },
  {
    id: 'cinema',
    label: 'Cinema',
    description: 'Classic & modern film art',
    image: 'images/cinema/ajith.jpg', // ← change filename to match yours
    accent: '#2c3e50',
    textColor: 'text-white',
  },
  {
    id: 'cricket',
    label: 'Cricket',
    description: "Legends of the gentleman's game",
    image: 'images/cricket/virat.jpg', // ← change filename to match yours
    accent: '#27ae60',
    textColor: 'text-white',
  },
  {
    id: 'football',
    label: 'Football',
    description: 'The beautiful game, framed',
    image: 'images/football/messi.jpg', // ← change filename to match yours
    accent: '#e67e22',
    textColor: 'text-white',
  },
]

const TESTIMONIALS = [
  { name: 'Arjun M.',  city: 'Mumbai',    text: 'The quality is unmatched. My anime wall has never looked better.',      stars: 5 },
  { name: 'Priya S.',  city: 'Bengaluru', text: 'Ordered 3 cricket posters — arrived perfectly packed and crisp.',       stars: 5 },
  { name: 'Rahul K.',  city: 'Chennai',   text: 'Premium feel, great pricing. Framed is my go-to for room decor.',       stars: 5 },
]

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading]   = useState(true)
  // Track which category card is hovered
  const [hoveredCat, setHoveredCat] = useState(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const [{ data: feat }, { data: trend }] = await Promise.all([
          supabase
            .from('products')
            .select('*, images:product_images(url, is_primary), category:categories(name, slug)')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(4),
          supabase
            .from('products')
            .select('*, images:product_images(url, is_primary), category:categories(name, slug)')
            .eq('is_active', true)
            .order('view_count', { ascending: false })
            .limit(4),
        ])
        setFeatured(feat || [])
        setTrending(trend || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return (
    <div className="pt-16 md:pt-20">

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-brand-cream">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 75% 25%, rgba(70,89,64,0.07) 0%, transparent 55%),
              radial-gradient(circle at 25% 75%, rgba(70,89,64,0.05) 0%, transparent 55%)`,
          }}
        />

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <p className="section-subtitle text-brand-primary mb-4">Premium Wall Art</p>
            <h1 className="font-display text-5xl md:text-7xl font-light text-brand-dark leading-[1.05]">
              Your Walls
              <br />
              <em className="italic font-normal">Deserve</em> More
            </h1>
            <p className="mt-5 font-body text-brand-muted text-base max-w-sm leading-relaxed">
              High-quality posters for Anime, Cinema, Cricket & Football fans.
              Printed sharp, delivered safe.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/products" className="btn-primary">Shop Now</Link>
              <Link to="/custom-upload" className="btn-outline">Custom Print</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-xs font-body text-brand-muted">
              <span className="flex items-center gap-1.5"><span className="text-brand-primary">✓</span> Free shipping on 2+ posters</span>
              <span className="flex items-center gap-1.5"><span className="text-brand-primary">✓</span> A3 & A4 sizes</span>
              <span className="flex items-center gap-1.5"><span className="text-brand-primary">✓</span> Secure checkout</span>
            </div>
          </motion.div>

          {/* Right — 4 category cards with IMAGE + hover animation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="hidden lg:grid grid-cols-2 gap-3"
          >
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                onHoverStart={() => setHoveredCat(cat.id)}
                onHoverEnd={() => setHoveredCat(null)}
              >
                <Link
                  to={`/products?category=${cat.id}`}
                  className="group relative overflow-hidden block aspect-[4/5] rounded-sm shadow-card"
                >
                  {/* Background image */}
                  <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${cat.image})` }}
                    animate={{ scale: hoveredCat === cat.id ? 1.08 : 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />

                  {/* Always-on dark gradient at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Hover overlay — extra darkening */}
                  <motion.div
                    className="absolute inset-0 bg-black/0"
                    animate={{ backgroundColor: hoveredCat === cat.id ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0)' }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Animated border highlight on hover */}
                  <motion.div
                    className="absolute inset-0 border-2 border-transparent"
                    animate={{ borderColor: hoveredCat === cat.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0)' }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Text content */}
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <motion.div
                      animate={{ y: hoveredCat === cat.id ? -4 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="font-body text-[10px] tracking-widest uppercase text-white/60 mb-1">
                        {cat.id}
                      </p>
                      <p className="font-display text-2xl font-medium text-white leading-tight">
                        {cat.label}
                      </p>
                      <p className="font-body text-xs text-white/70 mt-0.5">
                        {cat.description}
                      </p>
                    </motion.div>

                    {/* "Explore" arrow — slides in on hover */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{
                        opacity: hoveredCat === cat.id ? 1 : 0,
                        y: hoveredCat === cat.id ? 0 : 8,
                      }}
                      transition={{ duration: 0.25 }}
                      className="mt-2 flex items-center gap-1 text-white font-body text-xs"
                    >
                      <span>Explore collection</span>
                      <span>→</span>
                    </motion.div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CATEGORIES SECTION (below hero)
      ══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="section-subtitle mb-2">Collections</p>
            <h2 className="section-title">Browse by Category</h2>
          </div>
          <Link to="/products" className="hidden sm:block btn-ghost text-sm">View All →</Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={`/products?category=${cat.id}`}
                className="group relative overflow-hidden block aspect-[3/4] rounded-sm shadow-card"
              >
                {/* Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${cat.image})` }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                {/* Hover color wash */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                  style={{ backgroundColor: cat.accent }} />

                {/* Text */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <p className="font-display text-xl md:text-2xl font-medium text-white leading-tight
                                transform group-hover:-translate-y-1 transition-transform duration-300">
                    {cat.label}
                  </p>
                  <p className="font-body text-xs text-white/70 mt-0.5
                                opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
                                transition-all duration-300">
                    {cat.description}
                  </p>
                  <span className="mt-2 inline-block font-body text-xs text-white/80
                                   opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
                                   transition-all duration-300 delay-75">
                    Explore →
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          NEW ARRIVALS
      ══════════════════════════════════════ */}
      <section className="bg-brand-cream py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-subtitle mb-2">Just In</p>
              <h2 className="section-title">New Arrivals</h2>
            </div>
            <Link to="/products" className="hidden sm:block btn-ghost text-sm">View All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading
              ? <ProductSkeleton count={4} />
              : featured.length > 0
                ? featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
                : <div className="col-span-4 text-center py-12 font-body text-brand-muted">No products yet. Add some from the admin panel!</div>
            }
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TRENDING
      ══════════════════════════════════════ */}
      {trending.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-subtitle mb-2">Fan Favourites</p>
              <h2 className="section-title">Trending Now</h2>
            </div>
            <Link to="/products?sort=popular" className="hidden sm:block btn-ghost text-sm">View All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {trending.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="bg-brand-primary py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="font-body text-xs tracking-widest uppercase text-brand-bg/50 mb-4">Custom Posters</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-brand-bg leading-tight">
            Have your own image?
            <br /><em className="italic">We'll print it.</em>
          </h2>
          <p className="mt-4 font-body text-brand-bg/70 text-sm">
            Upload any image and get it printed as a premium A3 or A4 poster.
          </p>
          <Link
            to="/custom-upload"
            className="mt-8 inline-block bg-brand-bg text-brand-primary px-8 py-3 font-body font-medium text-sm tracking-wide hover:bg-brand-cream transition-colors"
          >
            Upload Your Image →
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-2">Reviews</p>
          <h2 className="section-title">What Our Customers Say</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-brand-cream border border-brand-border p-6 md:p-8"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <span key={s} className="text-brand-primary text-sm">★</span>
                ))}
              </div>
              <p className="font-body text-sm text-brand-dark/80 leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="font-body text-sm font-medium text-brand-dark">{t.name}</p>
                <p className="font-body text-xs text-brand-muted">{t.city}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  )
}