// Per-project AI / CSV settings. ensureProjectSettings self-heals a missing
// row (e.g. a project created before this code, or a fresh DB).
export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)

  await ensureProjectSettings(event, projectId)

  const { data, error } = await client
    .from('metadata_settings')
    .select('ai_max_title_length, ai_max_description_length, ai_default_tone, ai_additional_instructions, ai_default_language, csv_timezone')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data ?? {
    ai_max_title_length: 100,
    ai_max_description_length: 300,
    ai_default_tone: '',
    ai_additional_instructions: '',
    ai_default_language: 'English',
    csv_timezone: 'Europe/Berlin',
  }
})
