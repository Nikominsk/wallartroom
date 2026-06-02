export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)

  // List page: return only the lightweight export records. We deliberately do
  // NOT load every referenced image's publish date here — that turned one page
  // load into a huge database request. The per-export publish schedule is
  // computed on the client from the images it already loads when a row is
  // expanded (see /csv-exports/[id]/images), so opening this page stays cheap.
  const { data, error } = await client
    .from('pinterest_csv_export')
    .select('id, filename, row_count, created_at, marked_exported_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data ?? []
})
