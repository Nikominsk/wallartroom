// POST /api/metadata/projects/[id]/activate
// Sets the active-project cookie after validating the user owns the project.
// The client reloads the workspace afterwards so every cached store re-fetches
// scoped to the new project.

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id   = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'project id required' })

  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('metadata_project')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  if (!data) throw createError({ statusCode: 404, statusMessage: 'Project not found' })

  setCookie(event, METADATA_PROJECT_COOKIE, data.id, {
    path:     '/',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 365,
  })

  return { ok: true, activeProjectId: data.id }
})
