import { serverSupabaseServiceRole } from '#supabase/server'

// One file per request. The client uploads files sequentially so it can render
// per-file progress and a single failure doesn't roll back the rest.

const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/avif',
])
const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  const filePart = parts?.find(p => p.name === 'file' && p.filename && p.data)
  if (!filePart) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided (expected multipart field "file")' })
  }

  const mime = (filePart.type || '').toLowerCase()
  if (!ALLOWED_MIME.has(mime)) {
    throw createError({
      statusCode: 415,
      statusMessage: `Unsupported file type: ${mime || 'unknown'}. Allowed: PNG, JPG, WebP, GIF, AVIF.`,
    })
  }
  if (filePart.data.length > MAX_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: `File too large (${Math.round(filePart.data.length / 1024 / 1024)} MB). Max ${MAX_BYTES / 1024 / 1024} MB.`,
    })
  }

  const ext = extensionForMime(mime)
  if (!ext) {
    throw createError({ statusCode: 415, statusMessage: `Could not derive file extension from MIME: ${mime}` })
  }

  // Upload to R2 first. If the R2 write fails, no DB row is created.
  const key = buildPinterestLandscapeKey(ext)
  let publicUrl
  try {
    const result = await uploadToR2({ key, body: filePart.data, contentType: mime })
    publicUrl = result.publicUrl
  } catch (e) {
    throw createError({
      statusCode: 502,
      statusMessage: `R2 upload failed: ${e?.message ?? 'unknown error'}`,
    })
  }

  // Derive the canonical filename from the R2 key (last path segment),
  // e.g. "20260514-550e8400-e29b-41d4-a716-446655440000.png".
  const filename = key.split('/').pop()

  // Then insert the Supabase row pointing at the R2 object.
  const client = serverSupabaseServiceRole(event)
  const { data: imageRow, error } = await client
    .from('image')
    .insert({
      filename,
      public_url: publicUrl,
      visibility: 'open',
    })
    .select(`
      *,
      primary_color:color!primary_color_id(name,hex),
      secondary_color:color!secondary_color_id(name,hex),
      tertiary_color:color!tertiary_color_id(name,hex),
      pinterest_image(*),
      adobe_image(*)
    `)
    .single()

  if (error) {
    // Surface the R2 key so the caller can clean it up manually if it ever
    // matters; the orphan won't affect the gallery (no DB row referencing it).
    throw createError({
      statusCode: 500,
      statusMessage: `Supabase insert failed: ${error.message}. (R2 key: ${key})`,
    })
  }

  return { image: imageRow, key }
})
