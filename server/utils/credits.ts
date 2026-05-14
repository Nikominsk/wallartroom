import type { H3Event } from 'h3'

// ─── Plan → monthly credit allowance ──────────────────────────────────────────
// Used by Stripe webhook on invoice.paid to grant the next month's credits.
//
// Single paid tier ("pro") plus the always-on "free" tier. Monthly credits
// reset on each billing cycle (no rollover); purchased credit packs persist
// independently as a top-up bucket.

export type PlanTier = 'free' | 'pro'

export const PLAN_MONTHLY_CREDITS: Record<PlanTier, number> = {
  free: 0,
  pro:  100,
}

// ─── Credit cost table for paid actions ───────────────────────────────────────

export type CreditAction = 'quick_preview' | 'realistic_render' | 'high_quality_export' | 'ai_style_report'

export const CREDIT_COSTS: Record<CreditAction, number> = {
  quick_preview:       1,
  realistic_render:    2,
  high_quality_export: 3,
  ai_style_report:     2,
}


// ─── Wallet shape ─────────────────────────────────────────────────────────────

export interface WalletState {
  monthlyCreditsRemaining:   number
  monthlyCreditsTotal:       number
  purchasedCreditsRemaining: number
  reservedCredits:           number
  resetDate:                 string | null
}

// Convenience: how many credits the user can actually spend right now.
export function availableCredits(w: Pick<WalletState, 'monthlyCreditsRemaining' | 'purchasedCreditsRemaining' | 'reservedCredits'>) {
  return Math.max(0, w.monthlyCreditsRemaining + w.purchasedCreditsRemaining - w.reservedCredits)
}


// ─── Wallet read ──────────────────────────────────────────────────────────────

export async function getWallet(event: H3Event, userId: string): Promise<WalletState> {
  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('credit_wallet')
    .select('monthly_credits_remaining, monthly_credits_total, purchased_credits_remaining, reserved_credits, reset_date')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Wallet should exist via the auth.users trigger; surface the real error rather than silently returning zeros.
    throw createError({ statusCode: 500, statusMessage: `wallet lookup failed: ${error.message}` })
  }

  return {
    monthlyCreditsRemaining:   data.monthly_credits_remaining,
    monthlyCreditsTotal:       data.monthly_credits_total,
    purchasedCreditsRemaining: data.purchased_credits_remaining,
    reservedCredits:           data.reserved_credits,
    resetDate:                 data.reset_date,
  }
}


// ─── Reserve credits (start of a paid job) ────────────────────────────────────
// Atomically increments reserved_credits if available balance covers `amount`.
// Spec rule: monthly credits first, purchased credits second.
//
// Returns the ledger-ready breakdown: how many to debit from each bucket on
// finalize. We don't deduct from the buckets here (only "reserve") so that
// refund-on-failure is a simple counter decrement.

export interface CreditReservation {
  amount:           number
  fromMonthly:      number
  fromPurchased:    number
  visualizationId?: string
  projectId?:       string
}

export async function reserveCredits(
  event: H3Event,
  userId: string,
  amount: number,
  ctx: { visualizationId?: string; projectId?: string } = {}
): Promise<CreditReservation> {
  if (amount <= 0) throw createError({ statusCode: 400, statusMessage: 'amount must be > 0' })

  const wallet = await getWallet(event, userId)
  if (availableCredits(wallet) < amount) {
    throw createError({ statusCode: 402, statusMessage: 'Insufficient credits' })
  }

  const fromMonthly   = Math.min(wallet.monthlyCreditsRemaining, amount)
  const fromPurchased = amount - fromMonthly

  const admin = serverSupabaseAdmin(event)
  const { error } = await admin
    .from('credit_wallet')
    .update({ reserved_credits: wallet.reservedCredits + amount })
    .eq('user_id', userId)
    // Optimistic concurrency: only update if reserved_credits hasn't moved.
    .eq('reserved_credits', wallet.reservedCredits)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { amount, fromMonthly, fromPurchased, ...ctx }
}


// ─── Finalize spend (job succeeded) ───────────────────────────────────────────
// Deducts the reservation from the actual buckets and writes a ledger row.

export async function finalizeSpend(
  event: H3Event,
  userId: string,
  reservation: CreditReservation,
  reason: string
) {
  const admin = serverSupabaseAdmin(event)
  const wallet = await getWallet(event, userId)

  const { error: walletErr } = await admin
    .from('credit_wallet')
    .update({
      monthly_credits_remaining:   wallet.monthlyCreditsRemaining   - reservation.fromMonthly,
      purchased_credits_remaining: wallet.purchasedCreditsRemaining - reservation.fromPurchased,
      reserved_credits:            Math.max(0, wallet.reservedCredits - reservation.amount),
    })
    .eq('user_id', userId)
  if (walletErr) throw createError({ statusCode: 500, statusMessage: walletErr.message })

  const { error: ledgerErr } = await admin
    .from('credit_ledger')
    .insert({
      user_id:          userId,
      type:             'spend',
      amount:           -reservation.amount,
      reason,
      project_id:       reservation.projectId        ?? null,
      visualization_id: reservation.visualizationId  ?? null,
    })
  if (ledgerErr) throw createError({ statusCode: 500, statusMessage: ledgerErr.message })
}


// ─── Refund reserved credits (job failed) ─────────────────────────────────────
// Decrements reserved_credits; nothing was actually spent. Writes a ledger row
// with amount=0 so the failure is auditable but the user balance is unchanged.

export async function refundReserved(
  event: H3Event,
  userId: string,
  reservation: CreditReservation,
  reason: string
) {
  const admin = serverSupabaseAdmin(event)
  const wallet = await getWallet(event, userId)

  const { error: walletErr } = await admin
    .from('credit_wallet')
    .update({ reserved_credits: Math.max(0, wallet.reservedCredits - reservation.amount) })
    .eq('user_id', userId)
  if (walletErr) throw createError({ statusCode: 500, statusMessage: walletErr.message })

  const { error: ledgerErr } = await admin
    .from('credit_ledger')
    .insert({
      user_id:          userId,
      type:             'refund',
      amount:           0,
      reason,
      project_id:       reservation.projectId        ?? null,
      visualization_id: reservation.visualizationId  ?? null,
    })
  if (ledgerErr) throw createError({ statusCode: 500, statusMessage: ledgerErr.message })
}


// ─── Add purchased credits (Stripe credit-pack checkout completed) ────────────

export async function addPurchasedCredits(
  event: H3Event,
  userId: string,
  amount: number,
  stripePaymentId: string,
  reason = 'Credit pack purchase'
) {
  if (amount <= 0) return
  const admin = serverSupabaseAdmin(event)
  const wallet = await getWallet(event, userId)

  const { error: walletErr } = await admin
    .from('credit_wallet')
    .update({ purchased_credits_remaining: wallet.purchasedCreditsRemaining + amount })
    .eq('user_id', userId)
  if (walletErr) throw createError({ statusCode: 500, statusMessage: walletErr.message })

  const { error: ledgerErr } = await admin
    .from('credit_ledger')
    .insert({
      user_id:           userId,
      type:              'purchase',
      amount,
      reason,
      stripe_payment_id: stripePaymentId,
    })
  if (ledgerErr) throw createError({ statusCode: 500, statusMessage: ledgerErr.message })
}


// ─── Grant monthly credits (Stripe invoice.paid) ──────────────────────────────
// Replaces the monthly bucket with the plan's allowance. Purchased credits are
// untouched so they don't expire month-to-month.

export async function grantMonthlyCredits(
  event: H3Event,
  userId: string,
  plan: PlanTier,
  periodEnd: Date | null
) {
  const allowance = PLAN_MONTHLY_CREDITS[plan]
  if (allowance <= 0) return
  const admin = serverSupabaseAdmin(event)

  const { error: walletErr } = await admin
    .from('credit_wallet')
    .update({
      monthly_credits_remaining: allowance,
      monthly_credits_total:     allowance,
      reset_date:                periodEnd ? periodEnd.toISOString() : null,
    })
    .eq('user_id', userId)
  if (walletErr) throw createError({ statusCode: 500, statusMessage: walletErr.message })

  const { error: ledgerErr } = await admin
    .from('credit_ledger')
    .insert({
      user_id: userId,
      type:    'monthly_grant',
      amount:  allowance,
      reason:  `Monthly grant — ${plan}`,
    })
  if (ledgerErr) throw createError({ statusCode: 500, statusMessage: ledgerErr.message })
}
