export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const { filename, row_count, image_ids } = await readBody(event)

  if (!filename || !Array.isArray(image_ids)) {
    throw createError({ statusCode: 400, statusMessage: 'filename and image_ids are required' })
  }

  // Only record ids that actually belong to this project so a forged payload
  // can't reference another tenant's images.
  let scopedIds = image_ids
  if (image_ids.length > 0) {
    const { data: owned, error: ownErr } = await client
      .from('image')
      .select('id')
      .eq('project_id', projectId)
      .in('id', image_ids)
    if (ownErr) throw createError({ statusCode: 500, statusMessage: ownErr.message })
    const allowed = new Set((owned ?? []).map(r => r.id))
    scopedIds = image_ids.filter(id => allowed.has(id))
  }

  const { data, error } = await client
    .from('pinterest_csv_export')
    .insert({
      filename,
      row_count: row_count ?? scopedIds.length,
      image_ids: scopedIds,
      project_id: projectId,
    })
    .select('id, filename, row_count, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data
})
