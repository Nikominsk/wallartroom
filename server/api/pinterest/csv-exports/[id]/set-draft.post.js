export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const id = getRouterParam(event, 'id')

  const { data: exportRow, error: exportErr } = await client
    .from('pinterest_csv_export')
    .select('image_ids')
    .eq('id', id)
    .eq('project_id', projectId)
    .single()

  if (exportErr) throw createError({ statusCode: 404, statusMessage: 'Export not found' })

  const imageIds = exportRow.image_ids ?? []

  if (imageIds.length > 0) {
    const { error } = await client
      .from('pinterest_image')
      .update({ status: 'draft', exported_at: null })
      .eq('project_id', projectId)
      .in('image_id', imageIds)

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Clear the exported marker so the history badge resets to "Set Exported".
  const { error: markErr } = await client
    .from('pinterest_csv_export')
    .update({ marked_exported_at: null })
    .eq('id', id)
    .eq('project_id', projectId)

  if (markErr) throw createError({ statusCode: 500, statusMessage: markErr.message })

  return { ok: true }
})
