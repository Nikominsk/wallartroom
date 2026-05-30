const HEX = /^#[0-9a-fA-F]{6}$/

export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const patch = {}
  if (body.name !== undefined) {
    if (!body.name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Board name cannot be empty' })
    patch.name = body.name.trim()
  }
  if (body.color !== undefined) {
    if (body.color !== null && !HEX.test(String(body.color))) {
      throw createError({ statusCode: 400, statusMessage: 'Color must be a #RRGGBB hex string' })
    }
    patch.color = body.color
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  if (patch.name !== undefined) {
    const { data: current, error: fetchErr } = await client
      .from('pinterest_board')
      .select('name')
      .eq('id', id)
      .eq('project_id', projectId)
      .single()
    if (fetchErr || !current) throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }

  const { data, error } = await client
    .from('pinterest_board')
    .update(patch)
    .eq('id', id)
    .eq('project_id', projectId)
    .select('id, name, color')
    .single()

  if (error) {
    if (error.code === '23505') throw createError({ statusCode: 409, statusMessage: 'Board name already exists in this project' })
    if (error.code === 'PGRST116') throw createError({ statusCode: 404, statusMessage: 'Board not found' })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  // Keep the denormalized board name in sync for all images that reference
  // this board by ID (reliable regardless of what name the client had cached).
  if (patch.name !== undefined) {
    const { error: rebindErr } = await client
      .from('pinterest_image')
      .update({ board: patch.name })
      .eq('project_id', projectId)
      .eq('board_id', id)
    if (rebindErr) throw createError({ statusCode: 500, statusMessage: rebindErr.message })
  }

  return data
})
