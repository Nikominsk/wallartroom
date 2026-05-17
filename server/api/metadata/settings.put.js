const ALLOWED = [
  'ai_max_title_length',
  'ai_max_description_length',
  'ai_default_tone',
  'ai_additional_instructions',
  'ai_default_language',
  'csv_timezone',
]

function isValidTimeZone(tz) {
  if (typeof tz !== 'string' || !tz) return false
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  await ensureProjectSettings(event, projectId)
  const body = await readBody(event)

  const patch = {}
  for (const key of ALLOWED) {
    if (body[key] !== undefined) patch[key] = body[key]
  }
  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  if (patch.ai_max_title_length !== undefined) {
    const n = Number(patch.ai_max_title_length)
    if (!Number.isFinite(n) || n < 10 || n > 255) {
      throw createError({ statusCode: 400, statusMessage: 'Title length must be between 10 and 255' })
    }
    patch.ai_max_title_length = Math.round(n)
  }
  if (patch.ai_max_description_length !== undefined) {
    const n = Number(patch.ai_max_description_length)
    if (!Number.isFinite(n) || n < 10 || n > 800) {
      throw createError({ statusCode: 400, statusMessage: 'Description length must be between 10 and 800' })
    }
    patch.ai_max_description_length = Math.round(n)
  }
  if (patch.csv_timezone !== undefined && !isValidTimeZone(patch.csv_timezone)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid timezone' })
  }

  const { data, error } = await client
    .from('metadata_settings')
    .update(patch)
    .eq('project_id', projectId)
    .select('ai_max_title_length, ai_max_description_length, ai_default_tone, ai_additional_instructions, ai_default_language, csv_timezone')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
