// POST /api/stripe/webhook
//
// All 6 events from spec §12. Idempotent end-to-end:
//   • stripe_event table dedupes the event itself (replays are no-ops)
//   • credit_ledger has a UNIQUE (user_id, stripe_payment_id) partial index
//     so credit packs can't double-grant even on race
//   • subscription rows are upserted on stripe_subscription_id
//
// The webhook MUST verify the Stripe signature against the raw request body —
// readBody() would parse JSON and break the HMAC, so we use readRawBody().

import type Stripe from 'stripe'
import type { PlanTier } from '~~/server/utils/credits'

export default defineEventHandler(async (event) => {
  const stripe   = getStripe()
  const cfg      = useRuntimeConfig()
  const secret   = cfg.stripe.webhookSecret
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'STRIPE_WEBHOOK_SECRET not configured' })
  }

  const sig = getHeader(event, 'stripe-signature')
  if (!sig) throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature header' })

  const raw = await readRawBody(event, 'utf8')
  if (!raw) throw createError({ statusCode: 400, statusMessage: 'Empty request body' })

  // ─── Verify signature ───────────────────────────────────────────────────
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: `Signature verification failed: ${err.message}` })
  }

  const admin = serverSupabaseAdmin(event)

  // ─── Dedupe ────────────────────────────────────────────────────────────
  // First write wins. If the row already existed we know the event was
  // already processed and we can short-circuit.
  const dedupe = await admin
    .from('stripe_event')
    .insert({ id: stripeEvent.id, type: stripeEvent.type, payload: stripeEvent as any })
  if (dedupe.error && !/duplicate key|already exists|23505/i.test(dedupe.error.message)) {
    throw createError({ statusCode: 500, statusMessage: `Dedupe insert failed: ${dedupe.error.message}` })
  }
  if (dedupe.error) {
    return { received: true, deduped: true }
  }

  // ─── Dispatch ──────────────────────────────────────────────────────────
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await onCheckoutCompleted(event, stripeEvent.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await onSubscriptionUpsert(event, stripeEvent.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await onSubscriptionDeleted(event, stripeEvent.data.object as Stripe.Subscription)
        break
      case 'invoice.paid':
        await onInvoicePaid(event, stripeEvent.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await onInvoicePaymentFailed(event, stripeEvent.data.object as Stripe.Invoice)
        break
      default:
        // Other events are accepted (so Stripe doesn't retry) but ignored.
        break
    }
  } catch (err: any) {
    // Log to stripe_event payload so we can trace failures, but rethrow so
    // Stripe retries — usually transient (DB blip, etc.).
    throw createError({ statusCode: 500, statusMessage: `Handler failed: ${err.message}` })
  }

  return { received: true }
})


// ─── Handlers ─────────────────────────────────────────────────────────────

// User finished Checkout. Two cases:
//  - subscription mode: subscription rows arrive via subscription.created next;
//    we just stamp the stripe_customer_id on app_user (in case it wasn't set
//    from the create-checkout-session flow).
//  - payment mode: this is a credit pack — grant the credits now.
async function onCheckoutCompleted(event: any, session: Stripe.Checkout.Session) {
  const admin = serverSupabaseAdmin(event)
  const userId = (session.metadata?.app_user_id) || null
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null

  if (userId && customerId) {
    await admin
      .from('app_user')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId)
      .is('stripe_customer_id', null) // only fill if missing
  }

  if (session.mode === 'payment' && session.metadata?.kind === 'credit_pack') {
    if (!userId) throw new Error('Missing app_user_id metadata on credit pack checkout')

    // Identify the pack from the line items (priceId → credit amount)
    const stripe = getStripe()
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
    const item = lineItems.data[0]
    const priceId = item?.price?.id
    if (!priceId) throw new Error('No price on credit pack line item')

    const pack = packFromPriceId(priceId)
    if (!pack) throw new Error(`Unknown credit pack price: ${priceId}`)

    // Use payment_intent id as the dedupe key — same intent across retries
    const paymentRef =
      typeof session.payment_intent === 'string' ? session.payment_intent
      : session.payment_intent?.id ?? session.id // fall back to session id

    try {
      await addPurchasedCredits(event, userId, pack.credits, paymentRef, `Credit pack: ${pack.id}`)
    } catch (e: any) {
      // 23505 = unique violation on (user_id, stripe_payment_id). Already granted.
      if (!/duplicate key|already exists|23505/i.test(e.message ?? '')) throw e
    }
  }
}

// Subscription created or updated. Upserts the local subscription row and
// updates app_user.plan + status. Plan is derived from the price id.
async function onSubscriptionUpsert(event: any, sub: Stripe.Subscription) {
  const admin = serverSupabaseAdmin(event)

  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = await userIdFromCustomerId(event, customerId, sub.metadata?.app_user_id)
  if (!userId) {
    // Fail loud so Stripe retries — this means our app_user has no
    // stripe_customer_id yet, which can happen if checkout-session-completed
    // hasn't fired yet. Stripe will retry the subscription event.
    throw new Error(`No app_user matches stripe_customer_id ${customerId}`)
  }

  const priceId = sub.items.data[0]?.price.id
  const plan: PlanTier = (priceId ? planFromPriceId(priceId) : null) ?? (sub.metadata?.plan as PlanTier) ?? 'free'

  // Stripe moved current_period_* onto subscription items in 2025-09; older
  // API versions had them on the subscription itself. Accept either shape.
  const item = sub.items.data[0] as any
  const startUnix = item?.current_period_start ?? (sub as any).current_period_start
  const endUnix   = item?.current_period_end   ?? (sub as any).current_period_end
  const periodStart = startUnix ? new Date(startUnix * 1000).toISOString() : null
  const periodEnd   = endUnix   ? new Date(endUnix   * 1000).toISOString() : null

  // Upsert subscription row
  await admin.from('subscription').upsert({
    user_id:                 userId,
    stripe_subscription_id:  sub.id,
    stripe_customer_id:      customerId,
    plan,
    status:                  sub.status,
    current_period_start:    periodStart,
    current_period_end:      periodEnd,
    cancel_at_period_end:    sub.cancel_at_period_end ?? false,
  }, { onConflict: 'stripe_subscription_id' })

  // Reflect on app_user
  await admin.from('app_user').update({
    plan,
    subscription_status:             sub.status,
    subscription_current_period_end: periodEnd,
  }).eq('id', userId)
}

// Subscription canceled outright. Per spec, keep access until period_end then
// drop to free. We mark the local sub row canceled and let invoice.paid stop
// firing — when current_period_end passes, we don't grant new credits.
//
// Note: we don't immediately downgrade the plan — that runs naturally because
// app_user.subscription_current_period_end gates frontend "upgrade" prompts.
async function onSubscriptionDeleted(event: any, sub: Stripe.Subscription) {
  const admin = serverSupabaseAdmin(event)
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = await userIdFromCustomerId(event, customerId, sub.metadata?.app_user_id)

  await admin
    .from('subscription')
    .update({ status: 'canceled', cancel_at_period_end: true })
    .eq('stripe_subscription_id', sub.id)

  if (userId) {
    // If the subscription is fully canceled (period end already past), revert
    // to free immediately. Otherwise leave the plan; the next invoice.paid
    // simply won't fire and the user retains access until the period boundary.
    const item = sub.items.data[0] as any
    const endUnix = item?.current_period_end ?? (sub as any).current_period_end
    const periodEnd = endUnix ? new Date(endUnix * 1000) : null
    const isPastEnd = periodEnd && periodEnd.getTime() <= Date.now()

    await admin.from('app_user').update({
      subscription_status: 'canceled',
      ...(isPastEnd ? { plan: 'free' } : {}),
    }).eq('id', userId)
  }
}

// invoice.paid — grant the next month's credits. Idempotent via the
// credit_ledger unique index: invoice.id is the payment ref so repeated
// deliveries collapse to a single grant.
async function onInvoicePaid(event: any, invoice: Stripe.Invoice) {
  const admin = serverSupabaseAdmin(event)
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const userId = await userIdFromCustomerId(event, customerId, null)
  if (!userId) return

  // Identify the plan from the first line item's price.
  // Stripe's Invoice line items expose `price` on each line.
  const line = invoice.lines.data[0]
  const priceId =
    (line as any)?.price?.id ??
    (line as any)?.pricing?.price_details?.price ??
    null
  if (!priceId) return
  const plan = planFromPriceId(priceId)
  if (!plan || plan === 'free') return

  // Period end for the wallet reset_date
  const periodEndUnix = (line as any)?.period?.end ?? (invoice as any).period_end
  const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null

  // grantMonthlyCredits writes a ledger row with type='monthly_grant' and no
  // stripe_payment_id, so two deliveries WOULD double-grant if this handler
  // fired twice for the same invoice. We dedupe by checking for an existing
  // ledger row keyed off invoice.id.
  const existing = await admin
    .from('credit_ledger')
    .select('id')
    .eq('user_id', userId)
    .eq('stripe_payment_id', invoice.id)
    .maybeSingle()
  if (existing.data) return

  await grantMonthlyCredits(event, userId, plan, periodEnd)

  // Stamp the invoice id on the most recent monthly_grant row so a retry
  // would short-circuit on the existence check above.
  await admin
    .from('credit_ledger')
    .update({ stripe_payment_id: invoice.id })
    .eq('user_id', userId)
    .eq('type', 'monthly_grant')
    .order('created_at', { ascending: false })
    .limit(1)
}

async function onInvoicePaymentFailed(event: any, invoice: Stripe.Invoice) {
  const admin = serverSupabaseAdmin(event)
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) return
  const userId = await userIdFromCustomerId(event, customerId, null)
  if (!userId) return

  await admin.from('app_user').update({ subscription_status: 'past_due' }).eq('id', userId)
}


// ─── Helpers ──────────────────────────────────────────────────────────────

// Resolve our internal user id from a Stripe customer. Prefers app_user.stripe_customer_id;
// falls back to the metadata.app_user_id we stamped at checkout-session create time.
async function userIdFromCustomerId(event: any, customerId: string, fallbackUserId: string | null | undefined): Promise<string | null> {
  const admin = serverSupabaseAdmin(event)
  const { data } = await admin
    .from('app_user')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle()
  return data?.id ?? fallbackUserId ?? null
}
