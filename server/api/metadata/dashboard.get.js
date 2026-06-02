export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next7 = new Date(today)
  next7.setDate(today.getDate() + 7)

  const [
    { data: pins, error: pinsError },
    { data: boards },
    { data: upcomingRaw, error: upcomingError },
    { count: totalImages },
  ] = await Promise.all([
    client
      .from('pinterest_image')
      .select('image_id, title, description, board, status, publish_date, updated_at')
      .eq('project_id', projectId),
    client
      .from('pinterest_board')
      .select('name, color')
      .eq('project_id', projectId),
    client
      .from('pinterest_image')
      .select('image_id, title, board, status, publish_date')
      .eq('project_id', projectId)
      .gte('publish_date', today.toISOString())
      .lt('publish_date', next7.toISOString())
      .order('publish_date', { ascending: true }),
    client
      .from('image')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId),
  ])

  if (pinsError) throw createError({ statusCode: 500, statusMessage: pinsError.message })
  if (upcomingError) console.error('[dashboard] upcomingPins query failed:', upcomingError.message)

  const all = pins ?? []
  const boardColorMap = new Map((boards ?? []).map(b => [b.name, b.color]))

  // Status counts — draft is derived from total images so it matches the
  // drafts page (which includes images that have no pinterest_image row yet).
  const exportedCount = all.filter(p => p.status === 'exported').length
  const scheduledCount = all.filter(p => p.publish_date && p.status !== 'exported').length
  const statusCounts = {
    draft:    (totalImages ?? 0) - exportedCount,
    exported: exportedCount,
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

    const exportedWeekPins = weekPins.filter(p => p.status === 'exported')
    const expSegMap = new Map()
    for (const p of exportedWeekPins) {
      const name = p.board?.trim() || '(No Board)'
      expSegMap.set(name, (expSegMap.get(name) ?? 0) + 1)
    }
    const exportedSegments = [...expSegMap.entries()]
      .map(([name, cnt]) => ({
        name,
        count: cnt,
        color: name === '(No Board)' ? '#d1d5db' : (boardColorMap.get(name) ?? null),
      }))
      .sort((a, b) => b.count - a.count)

    return { weekLabel: label, count: weekPins.length, segments, exportedCount: exportedWeekPins.length, exportedSegments }
  })

  // Upcoming pins — fetch thumbnails separately to avoid join issues
  const upcoming = upcomingRaw ?? []
  let thumbMap = {}
  if (upcoming.length) {
    const ids = upcoming.map(p => p.image_id)
    const { data: images } = await client
      .from('image')
      .select('id, thumbnail_url, public_url')
      .eq('project_id', projectId)
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
    scheduled: scheduledCount,
    boardCounts,
    weeklySchedule,
    upcomingPins,
  }
})
