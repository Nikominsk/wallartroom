import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next7 = new Date(today)
  next7.setDate(today.getDate() + 7)

  const [
    { data: pins, error: pinsError },
    { data: boards },
    { data: upcomingRaw, error: upcomingError },
  ] = await Promise.all([
    client
      .from('pinterest_image')
      .select('image_id, title, description, board, status, publish_date, updated_at'),
    client
      .from('pinterest_board')
      .select('name, color'),
    client
      .from('pinterest_image')
      .select('image_id, title, board, status, publish_date')
      .gte('publish_date', today.toISOString())
      .lt('publish_date', next7.toISOString())
      .order('publish_date', { ascending: true }),
  ])

  if (pinsError) throw createError({ statusCode: 500, statusMessage: pinsError.message })
  if (upcomingError) console.error('[dashboard] upcomingPins query failed:', upcomingError.message)

  const all = pins ?? []
  const boardColorMap = new Map((boards ?? []).map(b => [b.name, b.color]))

  // Status counts
  const statusCounts = { draft: 0, ready: 0, exported: 0, published: 0, error: 0 }
  for (const p of all) {
    if (p.status in statusCounts) statusCounts[p.status]++
  }

  // Board distribution (top 7 by count)
  const boardMap = new Map()
  for (const p of all) {
    const name = p.board?.trim() || '(No Board)'
    boardMap.set(name, (boardMap.get(name) ?? 0) + 1)
  }
  const boardCounts = [...boardMap.entries()]
    .map(([name, count]) => ({ name, count, color: boardColorMap.get(name) ?? null }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  // Weekly schedule — next 6 weeks, with per-board segments
  const weeklySchedule = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(today)
    start.setDate(today.getDate() + i * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    const label = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const weekPins = all.filter(p => {
      if (!p.publish_date) return false
      const d = new Date(p.publish_date)
      return d >= start && d < end
    })

    const segMap = new Map()
    for (const p of weekPins) {
      const name = p.board?.trim() || '(No Board)'
      segMap.set(name, (segMap.get(name) ?? 0) + 1)
    }
    const segments = [...segMap.entries()]
      .map(([name, cnt]) => ({
        name,
        count: cnt,
        color: name === '(No Board)' ? '#d1d5db' : (boardColorMap.get(name) ?? null),
      }))
      .sort((a, b) => b.count - a.count)

    return { weekLabel: label, count: weekPins.length, segments }
  })

  // Upcoming pins — fetch thumbnails separately to avoid join issues
  const upcoming = upcomingRaw ?? []
  let thumbMap = {}
  if (upcoming.length) {
    const ids = upcoming.map(p => p.image_id)
    const { data: images } = await client
      .from('image')
      .select('id, thumbnail_url, public_url')
      .in('id', ids)
    for (const img of images ?? []) {
      thumbMap[img.id] = img.thumbnail_url ?? img.public_url ?? null
    }
  }

  const upcomingPins = upcoming.map(p => ({
    image_id:      p.image_id,
    title:         p.title,
    board:         p.board,
    status:        p.status,
    publish_date:  p.publish_date,
    thumbnail_url: thumbMap[p.image_id] ?? null,
  }))

  return {
    statusCounts,
    boardCounts,
    weeklySchedule,
    upcomingPins,
  }
})
