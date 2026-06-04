import type { H3Event } from 'h3'

// ═══════════════════════════════════════════════════════════════════════════════
//  PLAN LIMITS — single source of truth for all plans.
//
//  free:    lifetime counters (beta allowance, no reset)
//  starter: 50 uploads / 200 AI gens per month  — $9.99/mo
//  plus:    200 uploads / 1 000 AI gens per month — $19.99/mo
//  studio:  1 500 uploads / 5 000 AI gens per month — $79.99/mo
//
//  Paid-plan counters reset monthly via the Stripe subscription-renewed webhook.
//  maxProjects controls how many metadata projects a user may create.
// ═══════════════════════════════════════════════════════════════════════════════

export const FREE_PLAN_LIMITS = {
  imageUploads:   35,
  aiGenerations: 100,
} as const

// Per-plan caps. Paid plans use monthly counters (reset each billing cycle).
const PLAN_LIMITS: Record<string, { imageUploads: number; aiGenerations: number; maxProjects: number }> = {
  free:    { imageUploads:    35, aiGenerations:   100, maxProjects:  1 },
  starter: { imageUploads:    50, aiGenerations:   200, maxProjects:  1 },
  plus:    { imageUploads:   200, aiGenerations: 1_000, maxProjects:  3 },
  studio:  { imageUploads: 1_500, aiGenerations: 5_000, maxProjects: 10 },
}

export type UsageKind = keyof typeof FREE_PLAN_LIMITS // 'imageUploads' | 'aiGenerations'

export interface PlanUsage {
  imageUploads:  number
  aiGenerations: number
}

const UNLIMITED = Number.POSITIVE_INFINITY

export function limitsForPlan(plan: string): { imageUploads: number; aiGenerations: number } {
  const row = PLAN_LIMITS[plan]
  if (!row) return { imageUploads: UNLIMITED, aiGenerations: UNLIMITED }
  return { imageUploads: row.imageUploads, aiGenerations: row.aiGenerations }
}

export function maxProjectsForPlan(plan: string): number {
  return PLAN_LIMITS[plan]?.maxProjects ?? UNLIMITED
}

export const isUnlimited = (n: number) => n === UNLIMITED

// ─── Read the user's plan ('free' | 'pro') ────────────────────────────────────
export async function getUserPlan(event: H3Event, userId: string): Promise<string> {
  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('app_user')
    .select('plan')
    .eq('id', userId)
    .single()
  if (error) throw createError({ statusCode: 500, statusMessage: `plan lookup failed: ${error.message}` })
  return (data as { plan: string }).plan
}

// Postgres codes meaning "the migration hasn't been applied yet". We degrade
// gracefully on these so the app keeps working between deploying this code and
// running 016_free_plan_usage.sql; enforcement simply turns on once it exists.
const MIGRATION_MISSING = new Set(['42P01', '42883', 'PGRST202', 'PGRST205'])

// ─── Read current usage counters (0/0 if the user has no row yet) ─────────────
export async function getPlanUsage(event: H3Event, userId: string): Promise<PlanUsage> {
  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('plan_usage')
    .select('image_uploads, ai_generations')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    if (MIGRATION_MISSING.has((error as { code?: string }).code ?? '')) {
      console.warn('[plan] plan_usage table missing — run migration 016. Treating usage as 0.')
      return { imageUploads: 0, aiGenerations: 0 }
    }
    throw createError({ statusCode: 500, statusMessage: `usage lookup failed: ${error.message}` })
  }
  const row = data as { image_uploads: number; ai_generations: number } | null
  return {
    imageUploads:  row?.image_uploads  ?? 0,
    aiGenerations: row?.ai_generations ?? 0,
  }
}

// ─── How many of `kind` the user may still do (Infinity on paid plans) ────────
export async function remainingQuota(event: H3Event, userId: string, kind: UsageKind): Promise<number> {
  const plan  = await getUserPlan(event, userId)
  const limit = limitsForPlan(plan)[kind]
  if (limit === UNLIMITED) return UNLIMITED
  const usage = await getPlanUsage(event, userId)
  return Math.max(0, limit - usage[kind])
}

// ─── Assert the user can still do at least one of `kind`, else throw 402 ───────
// Returns how many they may actually do now (<= `needed`). On a paid plan this
// is always `needed`. Callers that process a batch should respect the return
// value so a partial batch can be allowed up to the remaining quota.
export async function assertQuota(event: H3Event, userId: string, kind: UsageKind, needed = 1): Promise<number> {
  const remaining = await remainingQuota(event, userId, kind)
  if (remaining === UNLIMITED) return needed
  if (remaining <= 0) {
    throw createError({ statusCode: 402, statusMessage: quotaMessage(kind) })
  }
  return Math.min(remaining, needed)
}

export function quotaMessage(kind: UsageKind): string {
  if (kind === 'imageUploads') {
    return `Upload limit reached for your current plan. Upgrade to a higher plan for more uploads.`
  }
  return `AI generation limit reached for your current plan. Upgrade to a higher plan for more AI generations.`
}

// ─── Atomically add to the usage counters (creates the row on first use) ──────
export async function recordUsage(event: H3Event, userId: string, delta: Partial<PlanUsage>): Promise<void> {
  const images = Math.max(0, delta.imageUploads  ?? 0)
  const ai     = Math.max(0, delta.aiGenerations ?? 0)
  if (images === 0 && ai === 0) return
  const admin = serverSupabaseAdmin(event)
  const { error } = await admin.rpc('increment_plan_usage', {
    p_user_id:        userId,
    p_image_uploads:  images,
    p_ai_generations: ai,
  })
  if (error) {
    if (MIGRATION_MISSING.has((error as { code?: string }).code ?? '')) {
      console.warn('[plan] increment_plan_usage missing — run migration 016. Skipping usage record.')
      return
    }
    throw createError({ statusCode: 500, statusMessage: `usage update failed: ${error.message}` })
  }
}
