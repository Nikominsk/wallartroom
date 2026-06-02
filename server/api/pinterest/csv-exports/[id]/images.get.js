export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const id = getRouterParam(event, 'id')

  // Fetch export record (scoped to project) to get image_ids
  const { data: exportRow, error: exportErr } = await client
    .from('pinterest_csv_export')
    .select('image_ids')
    .eq('id', id)
    .eq('project_id', projectId)
    .single()

  if (exportErr) throw createError({ statusCode: 404, statusMessage: 'Export not found' })

  const imageIds = exportRow.image_ids ?? []
  if (imageIds.length === 0) return { data: [] }

  // Fetch in batches. Passing every id into a single `.in(...)` builds one huge
  // request URL that can overflow the HTTP connection ("Headers Overflow
  // Error") when an export references a lot of images. Chunking keeps each
  // request small no matter how big the export is.
  const CHUNK_SIZE = 100
  const all = []
  for (let i = 0; i < imageIds.length; i += CHUNK_SIZE) {
    const chunk = imageIds.slice(i, i + CHUNK_SIZE)
    const { data, error } = await client
      .from('image')
      .select(`
        *,
        primary_color:color!primary_color_id(name,hex),
        secondary_color:color!secondary_color_id(name,hex),
        tertiary_color:color!tertiary_color_id(name,hex),
        pinterest_image(*),
        adobe_image(*)
      `)
      .eq('project_id', projectId)
      .in('id', chunk)

    if (error) throw createError({ statusCode: 500, statusMessage: error.message })
    if (data) all.push(...data)
  }

  // Newest first, matching the original single-query ordering.
  all.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))

  return { data: all }
})
