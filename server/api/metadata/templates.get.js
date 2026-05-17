export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const { data, error } = await client
    .from('ai_generation_templates')
    .select('id, name, options, created_at')
    .eq('project_id', projectId)
    .order('name')

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data ?? []
})
