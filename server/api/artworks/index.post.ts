// POST /api/artworks — register an uploaded artwork file as an artwork_image row.
// Returns { id } so the editor can reference it on /api/visualizations/create.
//
// galleryItemId variant: if `galleryItemId` is provided instead of imageUrl,
// we copy the gallery item into a per-user artwork_image so visualizations
// don't break when an admin retires/rotates the gallery row.

interface CreateArtworkBody {
  imageUrl?:       string
  title?:          string
  galleryItemId?:  string
  aspectRatio?:    string
  dominantColors?: unknown
}

export default defineEventHandler(async (event) => {
  const user  = await requireUser(event)
  const body  = await readBody<CreateArtworkBody>(event)
  const admin = serverSupabaseAdmin(event)

  // Branch: user-uploaded
  if (body.imageUrl) {
    const { data, error } = await admin
      .from('artwork_image')
      .insert({
        user_id:         user.id,
        image_url:       body.imageUrl,
        title:           body.title?.trim() || null,
        source:          'upload',
        aspect_ratio:    body.aspectRatio    ?? null,
        dominant_colors: body.dominantColors ?? null,
      })
      .select('id, image_url, title, source, aspect_ratio, dominant_colors')
      .single()

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data
  }

  // Branch: gallery clone
  if (body.galleryItemId) {
    const g = await admin
      .from('gallery_item')
      .select('id, image_url, title, dominant_colors, format')
      .eq('id', body.galleryItemId)
      .eq('is_active', true)
      .single()
    if (g.error || !g.data) throw createError({ statusCode: 404, statusMessage: 'Gallery item not found' })

    const { data, error } = await admin
      .from('artwork_image')
      .insert({
        user_id:         user.id,
        image_url:       g.data.image_url,
        title:           g.data.title,
        source:          'gallery',
        gallery_item_id: g.data.id,
        aspect_ratio:    g.data.format,
        dominant_colors: g.data.dominant_colors,
      })
      .select('id, image_url, title, source, aspect_ratio, dominant_colors')
      .single()

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    return data
  }

  throw createError({ statusCode: 400, statusMessage: 'imageUrl or galleryItemId required' })
})
