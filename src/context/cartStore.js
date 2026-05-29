import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Shipping: free if 2+ total items, else ₹99
const SHIPPING_CHARGE = 99
const FREE_SHIPPING_THRESHOLD = 2

function calcShipping(items) {
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0)
  return totalQty >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem(product, size, quantity = 1) {
        const key = `${product.id}-${size}`
        const items = get().items
        const existing = items.find(i => i.key === key)

        if (existing) {
          set({
            items: items.map(i =>
              i.key === key ? { ...i, quantity: i.quantity + quantity } : i
            ),
          })
        } else {
          set({
            items: [...items, {
              key,
              productId: product.id,
              title: product.title,
              price: product.price,
              image: product.images?.[0]?.url || product.image_url,
              size,
              quantity,
              slug: product.slug,
            }],
          })
        }
      },

      removeItem(key) {
        set({ items: get().items.filter(i => i.key !== key) })
      },

      updateQuantity(key, quantity) {
        if (quantity < 1) {
          get().removeItem(key)
          return
        }
        set({
          items: get().items.map(i => i.key === key ? { ...i, quantity } : i),
        })
      },

      clearCart() {
        set({ items: [] })
      },

      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      },

      get shipping() {
        return calcShipping(get().items)
      },

      get total() {
        return get().subtotal + get().shipping
      },

      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    {
      name: 'framed-cart',
      // Only persist items array
      partialize: (state) => ({ items: state.items }),
    }
  )
)
