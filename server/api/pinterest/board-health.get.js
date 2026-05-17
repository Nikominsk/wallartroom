// Board distribution / health for the caller's active project.
// Pin→board association lives on pinterest_image.board, joined off image.
export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)

  const { data: images, error } = await client
    .from('image')
    .select('id, pinterest_image(board)')
    .eq('project_id', projectId)

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load images' })
  }

  const { data: boards, error: boardsErr } = await client
    .from('pinterest_board')
    .select('id, name')
    .eq('project_id', projectId)

  if (boardsErr) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load boards' })
  }

  const boardOf = (img) => {
    const p = Array.isArray(img.pinterest_image) ? img.pinterest_image[0] : img.pinterest_image
    return p?.board || null
  }

  // Calculate distribution
  const boardCounts = {}
  let unassigned = 0

  for (const img of images || []) {
    const b = boardOf(img)
    if (!b) {
      unassigned++
    } else {
      boardCounts[b] = (boardCounts[b] || 0) + 1
    }
  }

  const totalPins = images?.length || 0
  const avgPerBoard = boards?.length ? Math.round(totalPins / boards.length) : 0

  const boardHealth = (boards || []).map(board => {
    const count = boardCounts[board.name] || 0
    const ratio = avgPerBoard > 0 ? count / avgPerBoard : 0
    // Health: 100 = ideal distribution, lower when too empty or too overloaded
    let health = 100
    if (ratio < 0.3) health = Math.round(ratio * 100 / 0.3 * 0.5) // underfed boards
    else if (ratio > 3) health = Math.max(20, Math.round(100 - (ratio - 3) * 20)) // overstuffed boards
    else health = Math.round(70 + (1 - Math.abs(1 - ratio)) * 30) // balanced

    return {
      name: board.name,
      pinCount: count,
      health: Math.min(100, Math.max(0, health)),
      status: health >= 70 ? 'healthy' : health >= 40 ? 'attention' : 'critical',
    }
  })

  return {
    totalPins,
    totalBoards: boards?.length || 0,
    unassignedPins: unassigned,
    averagePinsPerBoard: avgPerBoard,
    boards: boardHealth.sort((a, b) => a.health - b.health),
  }
})
