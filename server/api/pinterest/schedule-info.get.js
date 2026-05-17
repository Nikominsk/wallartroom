export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)

  const { data: maxRow, error: maxErr } = await client
    .from('pinterest_image')
    .select('publish_date')
    .eq('project_id', projectId)
    .not('publish_date', 'is', null)
    .order('publish_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (maxErr) throw createError({ statusCode: 500, statusMessage: maxErr.message })

  if (!maxRow) {
    return { latestTimestamp: null, existingTimestamps: [] }
  }

  const latestTs = maxRow.publish_date
  const utcDate = latestTs.slice(0, 10)
  const dayStart = `${utcDate}T00:00:00.000Z`
  const dayEnd = `${utcDate}T23:59:59.999Z`

  const { data: dayRows, error: dayErr } = await client
    .from('pinterest_image')
    .select('publish_date')
    .eq('project_id', projectId)
    .gte('publish_date', dayStart)
    .lte('publish_date', dayEnd)
    .order('publish_date', { ascending: true })

  if (dayErr) throw createError({ statusCode: 500, statusMessage: dayErr.message })

  return {
    latestTimestamp: latestTs,
    existingTimestamps: (dayRows ?? []).map(r => r.publish_date),
  }
})
