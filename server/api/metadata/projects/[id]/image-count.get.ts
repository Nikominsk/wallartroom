// GET /api/metadata/projects/:id/image-count
// Returns the number of images in a project the caller owns.

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id   = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'project id required' })

  const admin = serverSupabaseAdmin(event)

  // Verify ownership
  const { data: proj } = await admin
    .from('metadata_project')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!proj) throw createError({ statusCode: 404, statusMessage: 'Project not found' })

  const { count, error } = await admin
    .from('image')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { count: count ?? 0 }
})
