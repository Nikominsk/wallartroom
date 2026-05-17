const MAX_BATCH = 500

export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const body = await readBody(event)
  const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : []

  if (ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No image ids provided' })
  }
  if (ids.length > MAX_BATCH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Too many ids in one request (max ${MAX_BATCH})`,
    })
  }

  const client = serverSupabaseAdmin(event)

  // Read public_urls first so the backing R2 objects can be removed after the
  // DB delete (the rows hold the only pointer to each storage key).
  const { data: rows, error: selErr } = await client
    .from('image')
    .select('public_url')
    .eq('project_id', projectId)
    .in('id', ids)
  if (selErr) throw createError({ statusCode: 500, statusMessage: selErr.message })

  // pinterest_image / adobe_image cascade on delete (migration 001), so a
  // single DELETE on `image` removes all related rows in one shot. The
  // project_id filter guarantees a tenant can only delete their own images.
  const { data, error } = await client
    .from('image')
    .delete()
    .eq('project_id', projectId)
    .in('id', ids)
    .select('id')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Batch-delete the backing R2 objects. Best-effort: a rare storage failure
  // leaves harmless orphans rather than failing an already-applied DB delete.
  let r2Warning = null
  try {
    const keys = (rows ?? []).map(r => keyFromPublicUrl(r.public_url))
    await deleteFromR2(keys)
  } catch (e) {
    r2Warning = e?.message ?? 'R2 delete failed'
  }

  return { ok: true, deleted: data?.length ?? 0, ...(r2Warning ? { r2Warning } : {}) }
})
