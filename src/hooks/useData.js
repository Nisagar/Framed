import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetch all products with optional filters
 */
export function useProducts({ category, sort = 'latest', limit } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      try {
        let query = supabase
          .from('products')
          .select('*, images:product_images(url, is_primary), category:categories(name, slug), sizes:product_sizes(size, stock_quantity)')
          .eq('is_active', true)

        if (category && category !== 'all') {
          // Join through categories table
          query = query.eq('categories.slug', category)
        }

        switch (sort) {
          case 'price-asc':  query = query.order('price', { ascending: true });  break
          case 'price-desc': query = query.order('price', { ascending: false }); break
          case 'popular':    query = query.order('view_count', { ascending: false }); break
          default:           query = query.order('created_at', { ascending: false })
        }

        if (limit) query = query.limit(limit)

        const { data, error: err } = await query
        if (err) throw err
        setProducts(data || [])
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [category, sort, limit])

  return { products, loading, error }
}

/**
 * Fetch a single product by slug
 */
export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    async function fetch() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('products')
        .select('*, images:product_images(id, url, is_primary), category:categories(id, name, slug), sizes:product_sizes(id, size, stock_quantity)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (err) setError(err)
      else setProduct(data)
      setLoading(false)
    }
    fetch()
  }, [slug])

  return { product, loading, error }
}

/**
 * Fetch orders for the current user
 */
export function useOrders(userId) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function fetch() {
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(id, quantity, size, price, product:products(title, slug))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      setOrders(data || [])
      setLoading(false)
    }
    fetch()
  }, [userId])

  return { orders, loading }
}

/**
 * Fetch categories
 */
export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data || [])
      setLoading(false)
    })
  }, [])

  return { categories, loading }
}
