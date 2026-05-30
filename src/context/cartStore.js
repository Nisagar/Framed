import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
        // For custom posters, each upload is unique — never merge them
        const key = product.isCustom
          ? `custom-${Date.now()}-${Math.random().toString(36).slice(2)}`
          : `${product.id}-${size}`

        const items = get().items

        // For regular products, merge if same key exists
        if (!product.isCustom) {
          const existing = items.find(i => i.key === key)
          if (existing) {
            set({
              items: items.map(i =>
                i.key === key ? { ...i, quantity: i.quantity + quantity } : i
              ),
            })
            return
          }
        }

        set({
          items: [...items, {
            key,
            productId:      product.id,
            title:          product.title,
            price:          product.price,
            image:          product.images?.[0]?.url || product.image_url,
            size,
            quantity,
            slug:           product.slug,
            // Custom poster fields
            isCustom:       product.isCustom       || false,
            customImageUrl: product.customImageUrl || null,
            storagePath:    product.storagePath    || null,
            customNotes:    product.customNotes    || null,
          }],
        })
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
      partialize: (state) => ({ items: state.items }),
    }
  )
)