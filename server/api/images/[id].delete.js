export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing image id' })

  const client = serverSupabaseAdmin(event)

  // Read the row first so we can delete the backing R2 object after the DB
  // delete (the row holds the only pointer to the storage key via public_url).
  const { data: row, error: selErr } = await client
    .from('image')
    .select('id, public_url')
    .eq('id', id)
    .eq('project_id', projectId)
    .maybeSingle()
  if (selErr) throw createError({ statusCode: 500, statusMessage: selErr.message })
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found in this project' })
  }

  // pinterest_image and adobe_image use `on delete cascade` (migration 001),
  // so removing the image row also removes its metadata rows. The project_id
  // filter scopes the delete to the caller's active project.
  const { error } = await client
    .from('image')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Delete the object from R2. The DB row is already gone (authoritative for
  // the UI), so a rare R2 failure leaves a harmless orphan instead of a 500.
  let r2Warning = null
  try {
    const key = keyFromPublicUrl(row.public_url)
    if (key) await deleteFromR2([key])
  } catch (e) {
    r2Warning = e?.message ?? 'R2 delete failed'
  }

  return { ok: true, id, ...(r2Warning ? { r2Warning } : {}) }
})
