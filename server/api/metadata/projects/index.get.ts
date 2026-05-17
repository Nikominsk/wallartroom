// GET /api/metadata/projects
// Lists the signed-in user's projects and the currently active one.
// requireMetadataProject() guarantees the user always has at least one
// project (auto-creates "My Project" on first visit) and pins the active
// id into the cookie.
//
// Also returns a compact `analyticsBrief` for the active project — a
// token-cheap account-performance summary the workspace passes into
// generate-metadata so descriptions lean into proven themes WITHOUT a DB
// hit per generated image.

export default defineEventHandler(async (event) => {
  const { user, projectId } = await requireMetadataProject(event)
  const admin = serverSupabaseAdmin(event)

  const [{ data, error }, { data: active }] = await Promise.all([
    admin
      .from('metadata_project')
      .select('id, name, created_at, updated_at, pinterest_handle')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
    admin
      .from('metadata_project')
      .select('pinterest_analytics')
      .eq('id', projectId)
      .maybeSingle(),
  ])

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return {
    activeProjectId: projectId,
    projects: data ?? [],
    analyticsBrief: analyticsBriefForAI(active?.pinterest_analytics ?? null),
  }
})
