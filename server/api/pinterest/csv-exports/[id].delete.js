export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing export id' })

  const client = serverSupabaseAdmin(event)
  // Deletes only the history row. The per-image `pinterest_image.exported_at`
  // timestamps and statuses set by "Set Exported" are intentionally preserved
  // — those reflect the actual export action, not the audit record. Scoped to
  // the active project.
  const { data, error } = await client
    .from('pinterest_csv_export')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId)
    .select('id')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data?.length) {
    throw createError({ statusCode: 404, statusMessage: 'Export not found in this project' })
  }

  return { ok: true, id }
})
