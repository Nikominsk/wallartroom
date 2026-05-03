import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const body = await readBody(event)
  const imgs = Array.isArray(body) ? body : [body]

  const pRows = imgs.map(img => ({
    image_id: img.id,
    title: img.pinterest.title || null,
    description: img.pinterest.description || null,
    board: img.pinterest.board || null,
    link: img.pinterest.link || null,
    publish_date: img.pinterest.publishDate || null,
    exported_at: img.pinterest.exportedAt || null,
    published_at: img.pinterest.publishedAt || null,
    status: img.pinterest.status ?? 'draft',
  }))

  const aRows = imgs.map(img => ({
    image_id: img.id,
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
