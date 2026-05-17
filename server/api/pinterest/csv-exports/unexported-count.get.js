export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)

  const { count, error } = await client
    .from('pinterest_csv_export')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('marked_exported_at', null)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { count: count ?? 0 }
})
