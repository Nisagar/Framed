/**
 * General utility functions for Framed
 */

/**
 * Format a number as Indian Rupee currency string
 * e.g. 1500 → "₹1,500"
 */
export function formatPrice(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

/**
 * Convert a string to a URL-safe slug
 * e.g. "My Poster Title!" → "my-poster-title"
 */
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

/**
 * Truncate text to a max length with ellipsis
 */
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format a date string to a readable format
 * e.g. "2024-01-15T..." → "15 Jan 2024"
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Calculate shipping cost
 * Free if totalItems >= 2, else ₹99
 */
export function calcShipping(totalItems) {
  return totalItems >= 2 ? 0 : 99
}

/**
 * Get the primary image URL from a product's images array
 */
export function getPrimaryImage(images) {
  if (!images || images.length === 0) return null
  const primary = images.find(img => img.is_primary)
  return (primary || images[0])?.url || null
}

/**
 * Debounce a function call
 */
export function debounce(fn, delay = 300) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Generate a short human-readable order reference
 */
export function shortOrderId(uuid) {
  return uuid?.slice(0, 8).toUpperCase() || 'N/A'
}
