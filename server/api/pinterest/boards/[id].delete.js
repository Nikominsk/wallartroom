export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const id = getRouterParam(event, 'id')

  const { data: board, error: fetchErr } = await client
    .from('pinterest_board')
    .select('name')
    .eq('id', id)
    .eq('project_id', projectId)
    .single()

  if (fetchErr || !board) throw createError({ statusCode: 404, statusMessage: 'Board not found' })

  const { count, error: countErr } = await client
    .from('pinterest_image')
    .select('image_id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('board', board.name)

  if (countErr) throw createError({ statusCode: 500, statusMessage: countErr.message })
  if (count > 0) throw createError({ statusCode: 409, statusMessage: `In use by ${count} image${count !== 1 ? 's' : ''}` })

  const { error: deleteErr } = await client
    .from('pinterest_board')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId)

  if (deleteErr) throw createError({ statusCode: 500, statusMessage: deleteErr.message })

  return { ok: true }
})
