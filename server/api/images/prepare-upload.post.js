// POST /api/images/prepare-upload
// Step 1 of the fast-upload flow.
// Accepts metadata for a batch of files, validates them, checks the user's
// quota for the whole batch, then returns a presigned R2 PUT URL per file.
// The browser uses those URLs to upload directly to R2 — the Nuxt server is
// not in the data path, so uploads are much faster.
// Step 2 is /api/images/batch-confirm.

const ALLOWED_MIME = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/avif',
])
const MAX_BYTES = 20 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const { user, projectId } = await requireMetadataProject(event)
  const body = await readBody(event)

  const files = Array.isArray(body?.files) ? body.files : []
  if (files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files provided' })
  }

  // Validate every file before spending any quota or generating URLs.
  for (const f of files) {
    const mime = (f.type || '').toLowerCase()
    if (!ALLOWED_MIME.has(mime)) {
      throw createError({ statusCode: 415, statusMessage: `Unsupported type: ${mime} (${f.name})` })
    }
    if (f.size > MAX_BYTES) {
      throw createError({
        statusCode: 413,
        statusMessage: `File too large: ${f.name} (${Math.round(f.size / 1024 / 1024)} MB, max 20 MB)`,
      })
    }
  }

  // Check quota once for the whole batch — returns how many are actually allowed
  // (may be less than files.length if the user is near their limit).
  const allowed = await assertQuota(event, user.id, 'imageUploads', files.length)
  const filesToProcess = files.slice(0, allowed)

  // Generate presigned PUT URLs and derive the public URL for each file.
  const uploads = await Promise.all(filesToProcess.map(async (f) => {
    const mime = f.type.toLowerCase()
    const ext  = extensionForMime(mime)
    if (!ext) throw createError({ statusCode: 415, statusMessage: `Cannot derive extension for ${mime}` })

    const key = buildPinterestUserKey({ ext, userId: user.id, projectId })
    const presignedUrl = await generatePresignedPutUrl({ key, contentType: mime })
    const publicBase   = (process.env.R2_PUBLIC_BASE_URL ?? '').replace(/\/+$/, '')
    const publicUrl    = `${publicBase}/${key.replace(/^\/+/, '')}`

    return {
      clientId: f.clientId,  // echoed back so the client can match responses to files
      key,
      presignedUrl,
      publicUrl,
      mimeType: mime,
    }
  }))

  return { uploads, skipped: files.length - filesToProcess.length }
})
