// POST /api/metadata/projects  { name }
// Creates a new project for the signed-in user and makes it the active one
// (so the client can immediately switch into the fresh, empty workspace).

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody<{ name?: string }>(event)

  const project = await createMetadataProject(event, user.id, body?.name ?? '')

  setCookie(event, METADATA_PROJECT_COOKIE, project.id, {
    path:     '/',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 365,
  })

  return project
})
