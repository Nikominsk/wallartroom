export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const id = getRouterParam(event, 'id')

  const { data: board, error: fetchErr } = await client
    .from('pinterest_board')
    .select('id')
    .eq('id', id)
    .eq('project_id', projectId)
    .single()

  if (fetchErr || !board) throw createError({ statusCode: 404, statusMessage: 'Board not found' })

  // Clear board_id + board text from all images BEFORE deleting the board row.
  // The FK ON DELETE SET NULL would handle board_id, but it never clears the
  // denormalised `board` text column — leaving that set causes card indicators
  // to stay lit even after the board is gone.
  await client
    .from('pinterest_image')
    .update({ board_id: null, board: '' })
    .eq('board_id', id)

  const { error: deleteErr } = await client
    .from('pinterest_board')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId)

  if (deleteErr) throw createError({ statusCode: 500, statusMessage: deleteErr.message })

  return { ok: true }
})
