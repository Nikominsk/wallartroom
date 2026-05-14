// Stripe SDK singleton. We import lazily so the module isn't loaded on routes
// that don't use it (Stripe ships a fairly chunky bundle).

import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripe(): Stripe {
  if (cached) return cached
  const key = useRuntimeConfig().stripe.secretKey
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'STRIPE_SECRET_KEY is not configured',
    })
  }
  cached = new Stripe(key, {
    // Pin the API version so Stripe API changes don't silently break us.
    // Matches the version this SDK build was generated against.
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
  })
  return cached
}
