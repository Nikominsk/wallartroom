export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)

  // Timezone passed from the client (the user's csv_timezone setting) so that
  // publish_dates are bucketed by local calendar day, not UTC day. Without this
  // an image at 00:30 CEST appears as the previous UTC day and inflates that
  // day's count while deflating the intended day.
  const { tz } = getQuery(event)
  const userTz = typeof tz === 'string' && tz.length > 0 ? tz : 'UTC'

  function toLocalDay(isoStr) {
    try {
      // en-CA produces the ISO YYYY-MM-DD format natively
      return new Date(isoStr).toLocaleDateString('en-CA', { timeZone: userTz })
    } catch {
      return isoStr.slice(0, 10)
    }
  }

  const [
    { data: maxRow,       error: maxErr },
    { data: scheduledRows },
  ] = await Promise.all([
    // Latest scheduled date across ALL statuses (for start-date defaulting)
    client
      .from('pinterest_image')
      .select('publish_date')
      .eq('project_id', projectId)
      .not('publish_date', 'is', null)
      .order('publish_date', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // All images with a publish_date — fetch status so we can split into
    // two maps (exported-only + all) in one round-trip.
    client
      .from('pinterest_image')
      .select('publish_date, status')
      .eq('project_id', projectId)
      .not('publish_date', 'is', null),
  ])

  if (maxErr) throw createError({ statusCode: 500, statusMessage: maxErr.message })

  // Build both day-count maps using the user's local timezone
  const exportedDayCounts = {}   // status = 'exported' only
  const allDayCounts      = {}   // all pins that have a publish_date

  for (const row of scheduledRows ?? []) {
    const day = toLocalDay(row.publish_date)
    allDayCounts[day] = (allDayCounts[day] ?? 0) + 1
    if (row.status === 'exported') {
      exportedDayCounts[day] = (exportedDayCounts[day] ?? 0) + 1
    }
  }

  const exportedDates    = Object.keys(exportedDayCounts).sort()
  const latestExportedDate = exportedDates[exportedDates.length - 1] ?? null

  if (!maxRow) {
    return { latestTimestamp: null, existingTimestamps: [], exportedDayCounts, allDayCounts, latestExportedDate }
  }

  // Fetch all timestamps on the same LOCAL day as the latest scheduled pin
  // (used for the "this day is already full" info box).
  const latestTs       = maxRow.publish_date
  const latestLocalDay = toLocalDay(latestTs)
  const [latestY, latestM, latestD] = latestLocalDay.split('-').map(Number)
  // Midnight-to-midnight in the user's timezone expressed as UTC bounds
  const dayStartLocal  = new Date(latestTs)
  dayStartLocal.setFullYear(latestY, latestM - 1, latestD)
  dayStartLocal.setHours(0, 0, 0, 0)
  const dayEndLocal = new Date(dayStartLocal)
  dayEndLocal.setDate(dayEndLocal.getDate() + 1)

  const { data: dayRows, error: dayErr } = await client
    .from('pinterest_image')
    .select('publish_date')
    .eq('project_id', projectId)
    .gte('publish_date', dayStartLocal.toISOString())
    .lt('publish_date', dayEndLocal.toISOString())
    .order('publish_date', { ascending: true })

  if (dayErr) throw createError({ statusCode: 500, statusMessage: dayErr.message })

  return {
    latestTimestamp:    latestTs,
    existingTimestamps: (dayRows ?? []).map(r => r.publish_date),
    exportedDayCounts,
    allDayCounts,
    latestExportedDate,
  }
})
