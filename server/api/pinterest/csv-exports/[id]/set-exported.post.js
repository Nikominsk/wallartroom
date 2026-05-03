import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const id = getRouterParam(event, 'id')

  const { data: exportRow, error: exportErr } = await client
    .from('pinterest_csv_export')
    .select('image_ids')
    .eq('id', id)
    .single()

  if (exportErr) throw createError({ statusCode: 404, statusMessage: 'Export not found' })

  const imageIds = exportRow.image_ids ?? []
  if (imageIds.length === 0) return { ok: true, updated: 0 }

  const now = new Date().toISOString()

  const { error } = await client
    .from('pinterest_image')
    .update({ status: 'exported', exported_at: now })
    .in('image_id', imageIds)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true }
})
