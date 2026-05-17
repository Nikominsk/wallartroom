const HEX = /^#[0-9a-fA-F]{6}$/

export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const { name, color } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Board name is required' })
  if (color != null && !HEX.test(String(color))) {
    throw createError({ statusCode: 400, statusMessage: 'Color must be a #RRGGBB hex string' })
  }

  const { data, error } = await client
    .from('pinterest_board')
    .insert({ name: name.trim(), color: color ?? null, project_id: projectId })
    .select('id, name, color')
    .single()

  if (error) {
    // Uniqueness is now per (project_id, name) — see migration 014.
    if (error.code === '23505') throw createError({ statusCode: 409, statusMessage: 'Board already exists in this project' })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
