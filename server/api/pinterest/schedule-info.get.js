export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)

  const [
    { data: maxRow,      error: maxErr },
    { data: exportedRows },
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

    // Per-day counts for EXPORTED images only (for queue stats)
    client
      .from('pinterest_image')
      .select('publish_date')
      .eq('project_id', projectId)
      .eq('status', 'exported')
      .not('publish_date', 'is', null),
  ])

  if (maxErr) throw createError({ statusCode: 500, statusMessage: maxErr.message })

  // Build a day → count map for exported images
  const exportedDayCounts = {}
  for (const row of exportedRows ?? []) {
    const day = row.publish_date.slice(0, 10)
    exportedDayCounts[day] = (exportedDayCounts[day] ?? 0) + 1
  }
  const exportedDates = Object.keys(exportedDayCounts).sort()
  const latestExportedDate = exportedDates[exportedDates.length - 1] ?? null

  if (!maxRow) {
    return { latestTimestamp: null, existingTimestamps: [], exportedDayCounts, latestExportedDate }
  }

  const latestTs = maxRow.publish_date
  const utcDate = latestTs.slice(0, 10)
  const dayStart = `${utcDate}T00:00:00.000Z`
  const dayEnd   = `${utcDate}T23:59:59.999Z`

  const { data: dayRows, error: dayErr } = await client
    .from('pinterest_image')
    .select('publish_date')
    .eq('project_id', projectId)
    .gte('publish_date', dayStart)
    .lte('publish_date', dayEnd)
    .order('publish_date', { ascending: true })

  if (dayErr) throw createError({ statusCode: 500, statusMessage: dayErr.message })

  return {
    latestTimestamp:  latestTs,
    existingTimestamps: (dayRows ?? []).map(r => r.publish_date),
    exportedDayCounts,
    latestExportedDate,
  }
})
