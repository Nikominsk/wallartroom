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
  const now = new Date().toISOString()

  if (imageIds.length > 0) {
    const { error } = await client
      .from('pinterest_image')
      .update({ status: 'exported', exported_at: now })
      .in('image_id', imageIds)

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Persist on the export row itself so the history view can render the green
  // "Exported" badge across page reloads.
  const { error: markErr } = await client
    .from('pinterest_csv_export')
    .update({ marked_exported_at: now })
    .eq('id', id)

  if (markErr) throw createError({ statusCode: 500, statusMessage: markErr.message })

  return { ok: true, marked_exported_at: now }
})
