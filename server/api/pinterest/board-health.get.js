import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  // Get all images with their board assignments
  const { data: images, error } = await client
    .from('image')
    .select('id, pinterest_board')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load images' })
  }

  // Get all boards
  const { data: boards, error: boardsErr } = await client
    .from('pinterest_board')
    .select('id, name')

  if (boardsErr) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to load boards' })
  }

  // Calculate distribution
  const boardCounts = {}
  let unassigned = 0

  for (const img of images || []) {
    if (!img.pinterest_board) {
      unassigned++
    } else {
      boardCounts[img.pinterest_board] = (boardCounts[img.pinterest_board] || 0) + 1
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
