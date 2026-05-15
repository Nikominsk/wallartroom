import { serverSupabaseServiceRole } from '#supabase/server'

export default defineCachedEventHandler(async (event) => {
  const { year, month } = getQuery(event)
  const y = parseInt(year)  || new Date().getFullYear()
  const m = parseInt(month) || (new Date().getMonth() + 1)

  // Monday-first calendar: find start of visible grid
  const firstOfMonth = new Date(y, m - 1, 1)
  const dow = firstOfMonth.getDay()               // 0=Sun … 6=Sat
  const startOffset = dow === 0 ? 6 : dow - 1    // days to back up to Monday
  const gridStart = new Date(y, m - 1, 1 - startOffset)

  // Always 42 cells (6 weeks)
  const gridEnd = new Date(gridStart)
  gridEnd.setDate(gridStart.getDate() + 42)

  const client = serverSupabaseServiceRole(event)

  const [{ data: pins, error }, { data: boards }] = await Promise.all([
    client
      .from('pinterest_image')
      .select('image_id, title, board, status, publish_date')
      .gte('publish_date', gridStart.toISOString())
      .lt('publish_date', gridEnd.toISOString())
      .order('publish_date', { ascending: true }),
    client
      .from('pinterest_board')
      .select('name, color'),
  ])

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const boardColors = {}
  for (const b of boards ?? []) {
    if (b.color) boardColors[b.name] = b.color
  }

  return {
    pins: (pins ?? []).map(p => ({
      image_id:     p.image_id,
      title:        p.title,
      board:        p.board,
      status:       p.status,
      publish_date: p.publish_date,
    })),
    boardColors,
  }
}, {
  maxAge: 300, // 5-minute server cache per month
  getKey: (event) => {
    const { year, month } = getQuery(event)
    return `cal-${year ?? 'x'}-${month ?? 'x'}`
  },
})
