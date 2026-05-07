import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

// Throws 401 if the request is not authenticated. Returns the supabase auth user.
// Idempotently provisions the corresponding app_user + credit_wallet rows so the
// app keeps working even if the auth.users trigger ever fails to fire (e.g. for
// users who signed up before the trigger existed).
export async function requireUser(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  await ensureUserProvisioned(event, {
    id:    user.id,
    email: user.email ?? '',
    name:  (user.user_metadata?.full_name ?? user.user_metadata?.name ?? null) as string | null,
  })

  return user
}

// Throws 403 if the requesting user is not an admin.
export async function requireAdmin(event: H3Event) {
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
// signup_grant ledger entry if any are missing. Used by requireUser() so any
// authenticated request self-heals; cheap because the existence check uses a
// covering primary key.
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

  // Insert app_user (use derived name if metadata missing)
  const fallbackName = u.name || (u.email ? u.email.split('@')[0] : null)
  await admin.from('app_user').upsert(
    { id: u.id, email: u.email, name: fallbackName, role: 'user', plan: 'free' },
    { onConflict: 'id' },
  )

  // Insert credit_wallet
  await admin.from('credit_wallet').upsert(
    { user_id: u.id, purchased_credits_remaining: 5 },
    { onConflict: 'user_id' },
  )

  // Add ledger entry only if none exists for this user
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
