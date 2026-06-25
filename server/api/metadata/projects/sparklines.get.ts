// GET /api/metadata/projects/sparklines?tz=Europe/Berlin
// Returns per-project daily scheduled-pin counts for the next 30 days.
// Only exported pins are counted — the sparkline reflects what's actually
// been scheduled for publishing, not unexported drafts.
// Used by the project-switcher dropdown to render a mini sparkline per project.

export default defineEventHandler(async (event) => {
  const { user } = await requireMetadataProject(event)
  const admin = serverSupabaseAdmin(event)

  const { tz } = getQuery(event)
  const userTz = typeof tz === 'string' && tz.length > 0 ? tz : 'UTC'

  function toLocalDay(iso: string): string {
    try { return new Date(iso).toLocaleDateString('en-CA', { timeZone: userTz }) }
    catch { return iso.slice(0, 10) }
  }

  // Get all the user's project IDs
  const { data: projectRows, error: projErr } = await admin
    .from('metadata_project')
    .select('id')
    .eq('user_id', user.id)

  if (projErr) throw createError({ statusCode: 500, statusMessage: projErr.message })

  const ids = (projectRows ?? []).map(r => r.id)
  if (ids.length === 0) return {}

  // UTC window with 1-day buffer so timezone-shifted early-morning pins aren't missed
  const utcFrom = new Date(); utcFrom.setDate(utcFrom.getDate() - 1)
  const utcTo   = new Date(); utcTo.setDate(utcTo.getDate() + 31)

  const { data: rows } = await admin
    .from('pinterest_image')
    .select('project_id, publish_date')
    .in('project_id', ids)
    .eq('status', 'exported')
    .not('publish_date', 'is', null)
    .gte('publish_date', utcFrom.toISOString())
    .lt('publish_date', utcTo.toISOString())

  const todayLocal = new Date().toLocaleDateString('en-CA', { timeZone: userTz })
  const limitLocal = (() => {
    const d = new Date(); d.setDate(d.getDate() + 30)
    return d.toLocaleDateString('en-CA', { timeZone: userTz })
  })()

  // Group: projectId → localDay → count (only the 30-day window)
  const result = {} as Record<string, Record<string, number>>
  for (const row of rows ?? []) {
    if (!row.publish_date) continue
    const day = toLocalDay(row.publish_date)
    if (day < todayLocal || day >= limitLocal) continue
    if (!result[row.project_id]) result[row.project_id] = {}
    result[row.project_id][day] = (result[row.project_id][day] ?? 0) + 1
  }

  return result
})
