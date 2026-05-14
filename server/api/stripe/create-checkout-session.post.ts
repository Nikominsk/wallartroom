// POST /api/stripe/create-checkout-session
//
// Body: { kind: 'subscription', plan: 'pro' }
//   OR  { kind: 'credit_pack',  packId: 'pack_25'|'pack_100'|'pack_300' }
//
// Returns: { url } — the client redirects to it.
//
// Customer reuse: we cache stripe_customer_id on app_user so users can subscribe
// once, buy a pack later, and Stripe still knows them. The webhook also stamps
// it on first contact, so missing-on-account is recoverable.

import type Stripe from 'stripe'
import type { PlanTier } from '~~/server/utils/credits'
import type { CreditPackId } from '~~/server/utils/stripeConfig'

interface Body {
  kind:    'subscription' | 'credit_pack'
  plan?:   PlanTier
  packId?: CreditPackId
}

export default defineEventHandler(async (event) => {
  const user   = await requireUser(event)
  const body   = await readBody<Body>(event)
  const stripe = getStripe()
  const cfg    = useRuntimeConfig()
  const admin  = serverSupabaseAdmin(event)

  if (!body?.kind) throw createError({ statusCode: 400, statusMessage: 'kind is required' })

  // ─── Look up or create the Stripe customer ─────────────────────────────
  const profile = await admin
    .from('app_user')
    .select('stripe_customer_id, email, name')
    .eq('id', user.id)
    .single()
  if (profile.error || !profile.data) {
    throw createError({ statusCode: 500, statusMessage: 'Could not load user profile' })
  }

  let customerId = profile.data.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    user.email,
      name:     profile.data.name ?? undefined,
      metadata: { app_user_id: user.id },
    })
    customerId = customer.id
    await admin
      .from('app_user')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  // ─── Build the Checkout session ────────────────────────────────────────
  const successUrl = `${cfg.public.siteUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl  = `${cfg.public.siteUrl}/app/billing/cancel`

  let params: Stripe.Checkout.SessionCreateParams

  if (body.kind === 'subscription') {
    if (!body.plan) throw createError({ statusCode: 400, statusMessage: 'plan is required' })
    const priceId = priceForPlan(body.plan)
    params = {
      mode:        'subscription',
      customer:    customerId,
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      // Allow promotion codes during testing/launch
      allow_promotion_codes: true,
      // Metadata read by the webhook to reconcile user + plan
      metadata: {
        app_user_id: user.id,
        kind:        'subscription',
        plan:        body.plan,
      },
      subscription_data: {
        metadata: {
          app_user_id: user.id,
          plan:        body.plan,
        },
      },
    }
  } else if (body.kind === 'credit_pack') {
    if (!body.packId) throw createError({ statusCode: 400, statusMessage: 'packId is required' })
    const priceId = priceForPack(body.packId)
    params = {
      mode:        'payment',
      customer:    customerId,
      line_items:  [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      allow_promotion_codes: true,
      metadata: {
        app_user_id: user.id,
        kind:        'credit_pack',
        pack_id:     body.packId,
      },
      payment_intent_data: {
        metadata: {
          app_user_id: user.id,
          pack_id:     body.packId,
        },
      },
    }
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Invalid kind' })
  }

  const session = await stripe.checkout.sessions.create(params)
  if (!session.url) {
    throw createError({ statusCode: 500, statusMessage: 'Stripe did not return a checkout URL' })
  }

  return { url: session.url }
})
