export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const id = getRouterParam(event, 'id')
  const client = serverSupabaseAdmin(event)

  const { data, error } = await client
    .from('ai_generation_templates')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId)
    .select('id')

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data?.length) {
    throw createError({ statusCode: 404, statusMessage: 'Template not found in this project' })
  }
  return { ok: true }
})
