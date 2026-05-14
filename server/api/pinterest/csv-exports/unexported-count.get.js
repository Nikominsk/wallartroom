import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  const { count, error } = await client
    .from('pinterest_csv_export')
    .select('id', { count: 'exact', head: true })
    .is('marked_exported_at', null)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { count: count ?? 0 }
})
