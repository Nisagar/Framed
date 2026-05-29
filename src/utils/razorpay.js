/**
 * Razorpay utilities for Framed
 *
 * NOTE ON SECURITY:
 * In production, the Razorpay order creation and payment
 * signature verification MUST happen on a backend server
 * (e.g. Supabase Edge Functions) using your SECRET key.
 * Never expose your Razorpay secret key in frontend code.
 *
 * The frontend only uses the KEY_ID (public key).
 */

/**
 * Opens the Razorpay checkout modal.
 *
 * @param {Object} options
 * @param {number}   options.amount       - Amount in paise (₹1 = 100 paise)
 * @param {string}   options.orderId      - Razorpay order_id from backend
 * @param {string}   options.name         - Customer name
 * @param {string}   options.email        - Customer email
 * @param {string}   options.phone        - Customer phone
 * @param {string}   options.description  - Order description
 * @param {Function} options.onSuccess    - Called with payment response on success
 * @param {Function} options.onDismiss    - Called when modal is dismissed
 */
export function openRazorpay({
  amount,
  orderId,
  name,
  email,
  phone,
  description = 'Framed Poster Order',
  onSuccess,
  onDismiss,
}) {
  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not loaded. Check index.html script tag.')
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount,
    currency: 'INR',
    name: 'Framed',
    description,
    image: '/favicon.svg',
    order_id: orderId,
    prefill: { name, email, contact: phone },
    theme: { color: '#465940' },
    modal: {
      backdropclose: false,
      escape: false,
      animation: true,
    },
    handler: function (response) {
      // response = { razorpay_payment_id, razorpay_order_id, razorpay_signature }
      if (onSuccess) onSuccess(response)
    },
    modal_options: {
      ondismiss: function () {
        if (onDismiss) onDismiss()
      },
    },
  }

  const rzp = new window.Razorpay(options)

  rzp.on('payment.failed', function (response) {
    console.error('Razorpay payment failed:', response.error)
    if (onDismiss) onDismiss(response.error)
  })

  rzp.open()
  return rzp
}

/**
 * Format amount from rupees to paise for Razorpay
 */
export function toPaise(rupees) {
  return Math.round(rupees * 100)
}

/**
 * Format amount from paise to rupees for display
 */
export function toRupees(paise) {
  return paise / 100
}
