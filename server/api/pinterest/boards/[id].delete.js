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

  // board_id on pinterest_image is ON DELETE SET NULL — affected images keep
  // their cached board name text but lose the FK reference. Any tab still
  // holding a stale boardId will get a 422 on next save, prompting the user
  // to reassign the board.
  const { error: deleteErr } = await client
    .from('pinterest_board')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId)

  if (deleteErr) throw createError({ statusCode: 500, statusMessage: deleteErr.message })

  return { ok: true }
})
