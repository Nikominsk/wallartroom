import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing export id' })

  const client = serverSupabaseServiceRole(event)
  // Deletes only the history row. The per-image `pinterest_image.exported_at`
  // timestamps and statuses set by "Set Exported" are intentionally preserved
  // — those reflect the actual export action, not the audit record.
  const { error } = await client.from('pinterest_csv_export').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true, id }
})
