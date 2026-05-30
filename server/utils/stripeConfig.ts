// Single source of truth for billing IDs.
//
// Internal ids (plan tier, credit pack id) ↔ Stripe price ids ↔ credit amounts.
// The Checkout endpoint and the webhook both read from here, so we only ever
// have to update three Stripe IDs in one place when prices change.

import { PLAN_MONTHLY_CREDITS } from './credits'

export type CreditPackId = 'pack_25' | 'pack_100' | 'pack_300'
export type BillingPlan  = 'free' | 'pro' | 'starter' | 'plus' | 'studio'

interface PlanRow {
  plan:          BillingPlan
  priceIdEnv:    string      // env var name (read at request time so dev/prod can differ)
  monthlyCredits: number
}

interface PackRow {
  id:          CreditPackId
  priceIdEnv:  string
  credits:     number
  priceEur:    number          // for display only
}

// Plans
const PLAN_ROWS: PlanRow[] = [
  { plan: 'pro',     priceIdEnv: 'pricePro',     monthlyCredits: PLAN_MONTHLY_CREDITS.pro },
  { plan: 'starter', priceIdEnv: 'priceStarter',  monthlyCredits: 0 },
  { plan: 'plus',    priceIdEnv: 'pricePlus',     monthlyCredits: 0 },
  { plan: 'studio',  priceIdEnv: 'priceStudio',   monthlyCredits: 0 },
]

// Credit packs
const PACK_ROWS: PackRow[] = [
  { id: 'pack_25',  priceIdEnv: 'pricePack25',  credits: 25,  priceEur: 5  },
  { id: 'pack_100', priceIdEnv: 'pricePack100', credits: 100, priceEur: 15 },
  { id: 'pack_300', priceIdEnv: 'pricePack300', credits: 300, priceEur: 39 },
]


// ─── Lookups ────────────────────────────────────────────────────────────────

function envPrice(field: keyof ReturnType<typeof useRuntimeConfig>['stripe']): string {
  return (useRuntimeConfig().stripe as any)[field] as string
}

export function priceForPlan(plan: BillingPlan): string {
  if (plan === 'free') {
    throw createError({ statusCode: 400, statusMessage: 'Free plan has no Stripe price' })
  }
  const row = PLAN_ROWS.find((r) => r.plan === plan)
  if (!row) throw createError({ statusCode: 400, statusMessage: `Unknown plan: ${plan}` })
  const price = envPrice(row.priceIdEnv as any)
  if (!price) throw createError({ statusCode: 500, statusMessage: `Stripe price for plan ${plan} is not configured (set STRIPE_PRICE_${plan.toUpperCase()})` })
  return price
}

export function priceForPack(packId: CreditPackId): string {
  const row = PACK_ROWS.find((r) => r.id === packId)
  if (!row) throw createError({ statusCode: 400, statusMessage: `Unknown credit pack: ${packId}` })
  const price = envPrice(row.priceIdEnv as any)
  if (!price) throw createError({ statusCode: 500, statusMessage: `Stripe price for ${packId} is not configured` })
  return price
}

// Reverse lookup used by the webhook: a Stripe price id arrives, we need to
// know which plan/pack it corresponds to.
export function planFromPriceId(priceId: string): BillingPlan | null {
  for (const row of PLAN_ROWS) {
    if (envPrice(row.priceIdEnv as any) === priceId) return row.plan
  }
  return null
}

export function packFromPriceId(priceId: string): { id: CreditPackId; credits: number } | null {
  for (const row of PACK_ROWS) {
    if (envPrice(row.priceIdEnv as any) === priceId) return { id: row.id, credits: row.credits }
  }
  return null
}

export const PACKS_PUBLIC = PACK_ROWS.map(({ id, credits, priceEur }) => ({ id, credits, priceEur }))
export const PLANS_PUBLIC = PLAN_ROWS.map(({ plan, monthlyCredits }) => ({ plan, monthlyCredits }))
