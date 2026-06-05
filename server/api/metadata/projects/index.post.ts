// POST /api/metadata/projects  { name }
// Creates a new project for the signed-in user and makes it the active one
// (so the client can immediately switch into the fresh, empty workspace).

export default defineEventHandler(async (event) => {
  const user  = await requireUser(event)
  const admin = serverSupabaseAdmin(event)
  const body  = await readBody<{ name?: string; language?: string; boardLanguage?: string; timezone?: string }>(event)

  const project = await createMetadataProject(event, user.id, body?.name ?? '')

  // Persist the chosen settings into this project's settings row.
  // ensureProjectSettings (called inside createMetadataProject) already
  // created the row, so a plain update is safe here.
  const patch: Record<string, string> = {}
  const lang = typeof body?.language === 'string' ? body.language.trim() : ''
  if (lang) patch.ai_default_language = lang
  const boardLang = typeof body?.boardLanguage === 'string' ? body.boardLanguage.trim() : ''
  if (boardLang) patch.ai_board_language = boardLang
  const tz = typeof body?.timezone === 'string' ? body.timezone.trim() : ''
  if (tz) patch.csv_timezone = tz
  if (Object.keys(patch).length) {
    await admin
      .from('metadata_settings')
      .update(patch)
      .eq('project_id', project.id)
  }

  setCookie(event, METADATA_PROJECT_COOKIE, project.id, {
    path:     '/',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 365,
  })

  return project
})
