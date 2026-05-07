import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

// Service-role Supabase client for trusted server work (bypasses RLS).
// Only call from server/api/* and server/utils/* — never expose to the client.
export function serverSupabaseAdmin(event: H3Event) {
  return serverSupabaseServiceRole(event)
}
