import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import ProductCard from '../components/product/ProductCard'
import ProductSkeleton from '../components/product/ProductSkeleton'
import { PageHeader, EmptyState } from '../components/ui'

const SORT_OPTIONS = [
  { value: 'latest',     label: 'Latest'              },
  { value: 'popular',    label: 'Most Popular'         },
  { value: 'price-asc',  label: 'Price: Low to High'  },
  { value: 'price-desc', label: 'Price: High to Low'  },
]

const CATEGORIES = ['all', 'anime', 'cinema', 'cricket', 'football']

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts]         = useState([])
  const [categoryMap, setCategoryMap]   = useState({}) // { slug -> id }
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')

  const activeCategory = searchParams.get('category') || 'all'
  const activeSort     = searchParams.get('sort')     || 'latest'

  // ── Step 1: load all categories once so we can map slug → id ──
  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from('categories')
        .select('id, slug')
      if (data) {
        const map = {}
        data.forEach(c => { map[c.slug] = c.id })
        setCategoryMap(map)
      }
    }
    loadCategories()
  }, [])

  // ── Step 2: fetch products whenever category / sort changes ──
  useEffect(() => {
    // Wait until categoryMap is ready before filtering by category
    if (activeCategory !== 'all' && Object.keys(categoryMap).length === 0) return
    fetchProducts()
  }, [activeCategory, activeSort, categoryMap])

  async function fetchProducts() {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          images:product_images(url, is_primary),
          category:categories(name, slug),
          sizes:product_sizes(size, stock_quantity)
        `)
        .eq('is_active', true)

      // ── KEY FIX: filter by category_id (UUID), not by joined slug ──
      if (activeCategory !== 'all') {
        const catId = categoryMap[activeCategory]
        if (catId) {
          query = query.eq('category_id', catId)
        } else {
          // Category slug not found → return empty
          setProducts([])
          setLoading(false)
          return
        }
      }

      // Sorting
      switch (activeSort) {
        case 'price-asc':  query = query.order('price',      { ascending: true  }); break
        case 'price-desc': query = query.order('price',      { ascending: false }); break
        case 'popular':    query = query.order('view_count', { ascending: false }); break
        default:           query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query
      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('fetchProducts error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Client-side search filter ──
  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.name?.toLowerCase().includes(q)
    )
  }, [products, search])

  function setParam(key, value) {
    const params = new URLSearchParams(searchParams)
    if (key === 'category' && value === 'all') params.delete('category')
    else params.set(key, value)
    setSearchParams(params)
  }

  // Label for the page header
  const categoryLabel = activeCategory === 'all'
    ? 'All Posters'
    : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) + ' Posters'

  return (
    <div className="pt-16 md:pt-20">
      <PageHeader
        title={categoryLabel}
        subtitle={loading ? 'Loading...' : `${filtered.length} premium print${filtered.length !== 1 ? 's' : ''} available`}
        breadcrumb="Shop"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Filter bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search posters..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 flex-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setParam('category', cat)}
                className={`flex-shrink-0 px-4 py-2 font-body text-xs tracking-widest uppercase
                  transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-brand-primary text-brand-bg'
                    : 'border border-brand-border text-brand-dark hover:border-brand-primary hover:text-brand-primary'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={activeSort}
            onChange={e => setParam('sort', e.target.value)}
            className="input-field max-w-[200px] cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Results count */}
        {!loading && (
          <p className="font-body text-xs text-brand-muted mb-6">
            Showing {filtered.length} {filtered.length === 1 ? 'poster' : 'posters'}
            {activeCategory !== 'all' && (
              <span className="ml-1 text-brand-primary capitalize">in {activeCategory}</span>
            )}
            {search && <span className="ml-1">for "{search}"</span>}
          </p>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          <AnimatePresence>
            {loading ? (
              <ProductSkeleton count={8} />
            ) : filtered.length > 0 ? (
              filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))
            ) : (
              <div className="col-span-4">
                <EmptyState
                  icon="🖼️"
                  title="No posters found"
                  subtitle={
                    search
                      ? `No results for "${search}" — try a different keyword`
                      : `No ${activeCategory !== 'all' ? activeCategory : ''} posters added yet`
                  }
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}