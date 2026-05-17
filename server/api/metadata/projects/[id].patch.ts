// PATCH /api/metadata/projects/[id]  { name }
// Renames a project the signed-in user owns.

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id   = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'project id required' })

  const body = await readBody<{ name?: string }>(event)
  const name = String(body?.name ?? '').trim()
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Project name is required' })
  if (name.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Project name is too long (max 120)' })
  }

  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('metadata_project')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, name, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'You already have a project with that name' })
    }
    if (error.code === 'PGRST116') {
      throw createError({ statusCode: 404, statusMessage: 'Project not found' })
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
