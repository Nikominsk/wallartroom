// Upserts Pinterest / Adobe metadata for images. Hardened for multi-tenant:
// the caller can only write metadata for images that live in their ACTIVE
// project — any id that isn't in the project is silently dropped so a forged
// image_id can't poison another tenant's data.
export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const body = await readBody(event)
  const imgs = Array.isArray(body) ? body : [body]

  const requestedIds = [...new Set(imgs.map(i => i.id).filter(Boolean))]
  if (requestedIds.length === 0) return { ok: true }

  const { data: owned, error: ownErr } = await client
    .from('image')
    .select('id')
    .eq('project_id', projectId)
    .in('id', requestedIds)
  if (ownErr) throw createError({ statusCode: 500, statusMessage: ownErr.message })

  const allowed = new Set((owned ?? []).map(r => r.id))
  const scoped = imgs.filter(img => allowed.has(img.id))
  if (scoped.length === 0) {
    throw createError({ statusCode: 403, statusMessage: 'No matching images in the active project' })
  }

  const pRows = scoped.map(img => ({
    image_id: img.id,
    project_id: projectId,
    title: img.pinterest.title || null,
    description: img.pinterest.description || null,
    board: img.pinterest.board || null,
    link: img.pinterest.link || null,
    publish_date: img.pinterest.publishDate || null,
    exported_at: img.pinterest.exportedAt || null,
    published_at: img.pinterest.publishedAt || null,
    status: img.pinterest.status ?? 'draft',
  }))

  const aRows = scoped.map(img => ({
    image_id: img.id,
    project_id: projectId,
    title: img.adobeStock.title || null,
    description: img.adobeStock.description || null,
    keywords: img.adobeStock.keywords?.length ? img.adobeStock.keywords : null,
    publish_date: img.adobeStock.publishDate || null,
    status: img.adobeStock.status ?? 'draft',
  }))

  const { error: pe } = await client
    .from('pinterest_image')
    .upsert(pRows, { onConflict: 'image_id' })
  if (pe) throw createError({ statusCode: 500, statusMessage: pe.message })

  const { error: ae } = await client
    .from('adobe_image')
    .upsert(aRows, { onConflict: 'image_id' })
  if (ae) throw createError({ statusCode: 500, statusMessage: ae.message })

  return { ok: true }
})
