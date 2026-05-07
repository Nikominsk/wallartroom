import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

// In @nuxtjs/supabase v2, serverSupabaseUser returns JWT *claims* — the user
// UUID lives in `sub`, not `id`. Normalize to a stable shape so call sites can
// reliably read .id / .email without worrying which field actually exists.
export interface AuthedUser {
  id:    string
  email: string
  name:  string | null
}

// Throws 401 if the request is not authenticated. Returns a normalized user.
// Idempotently provisions the corresponding app_user + credit_wallet rows so
// the app keeps working even if the auth.users trigger ever fails to fire.
export async function requireUser(event: H3Event): Promise<AuthedUser> {
  const claims = await serverSupabaseUser(event)
  if (!claims) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // JWT claims expose the user UUID as `sub`. Older callers (or future SDK
  // versions) may use `id` directly — accept either.
  const id    = (claims as any).sub ?? (claims as any).id
  const email = (claims as any).email ?? ''
  if (!id) {
    throw createError({ statusCode: 401, statusMessage: 'Auth token has no subject' })
  }

  const meta = (claims as any).user_metadata ?? {}
  const name = (meta.full_name ?? meta.name ?? null) as string | null

  await ensureUserProvisioned(event, { id, email, name })

  return { id, email, name }
}

// Throws 403 if the requesting user is not an admin.
export async function requireAdmin(event: H3Event): Promise<AuthedUser> {
  const user = await requireUser(event)
  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('app_user')
    .select('role')
    .eq('id', user.id)
    .single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (data?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}

// Idempotent: creates app_user + credit_wallet (5 free signup credits) +
// signup_grant ledger entry if any are missing. Cheap fast-path: when the
// user is already provisioned, returns after a single PK lookup.
async function ensureUserProvisioned(
  event: H3Event,
  u: { id: string; email: string; name: string | null },
) {
  const admin = serverSupabaseAdmin(event)

  const existing = await admin
    .from('app_user')
    .select('id')
    .eq('id', u.id)
    .maybeSingle()

  if (existing.data) return // already provisioned, hot path

  const fallbackName = u.name || (u.email ? u.email.split('@')[0] : null)

  await admin.from('app_user').upsert(
    { id: u.id, email: u.email, name: fallbackName, role: 'user', plan: 'free' },
    { onConflict: 'id' },
  )

  await admin.from('credit_wallet').upsert(
    { user_id: u.id, purchased_credits_remaining: 5 },
    { onConflict: 'user_id' },
  )

  const ledger = await admin
    .from('credit_ledger')
    .select('id')
    .eq('user_id', u.id)
    .eq('type', 'signup_grant')
    .maybeSingle()
  if (!ledger.data) {
    await admin.from('credit_ledger').insert({
      user_id: u.id,
      type:    'signup_grant',
      amount:  5,
      reason:  'Welcome — Free plan signup',
    })
  }
}
