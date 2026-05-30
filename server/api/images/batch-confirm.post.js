// POST /api/images/batch-confirm
// Step 2 of the fast-upload flow.
// Called after the browser has PUT all files directly to R2 via presigned URLs.
// Inserts all image rows in a single bulk INSERT and records quota usage once.
// Body: { confirmed: [{ key, publicUrl, mimeType }] }

export default defineEventHandler(async (event) => {
  const { user, projectId } = await requireMetadataProject(event)
  const body = await readBody(event)

  const confirmed = Array.isArray(body?.confirmed) ? body.confirmed : []
  if (confirmed.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No confirmed uploads provided' })
  }

  const rows = confirmed.map(({ key, publicUrl }) => ({
    filename:   key.split('/').pop(),
    public_url: publicUrl,
    visibility: 'open',
    project_id: projectId,
  }))

  const client = serverSupabaseAdmin(event)
  const { data: images, error } = await client
    .from('image')
    .insert(rows)
    .select(`
      *,
      primary_color:color!primary_color_id(name,hex),
      secondary_color:color!secondary_color_id(name,hex),
      tertiary_color:color!tertiary_color_id(name,hex),
      pinterest_image(*),
      adobe_image(*)
    `)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: `Batch insert failed: ${error.message}` })
  }

  // Record all uploads as a single quota increment.
  await recordUsage(event, user.id, { imageUploads: confirmed.length })

  return { images: images ?? [] }
})
