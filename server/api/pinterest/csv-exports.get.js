import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

  const { data, error } = await client
    .from('pinterest_csv_export')
    .select('id, filename, row_count, created_at, marked_exported_at, image_ids')
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const rows = data ?? []
  if (rows.length === 0) return []

  // Collect every image id referenced by any export, then fetch their publish
  // dates in a single round-trip and index by id.
  const allIds = new Set()
  for (const r of rows) {
    for (const id of r.image_ids ?? []) allIds.add(id)
  }

  let publishDateById = new Map()
  if (allIds.size > 0) {
    const { data: pinRows, error: pinErr } = await client
      .from('pinterest_image')
      .select('image_id, publish_date')
      .in('image_id', [...allIds])

    if (pinErr) throw createError({ statusCode: 500, statusMessage: pinErr.message })
    for (const row of pinRows ?? []) {
      if (row.publish_date) publishDateById.set(row.image_id, row.publish_date)
    }
  }

  return rows.map(({ image_ids, ...rest }) => ({
    ...rest,
    publish_summary: summarisePublishDates(image_ids ?? [], publishDateById),
  }))
})

function summarisePublishDates(imageIds, publishDateById) {
  const perDay = {}
  let earliest = null
  let latest = null
  let scheduled = 0

  for (const id of imageIds) {
    const ts = publishDateById.get(id)
    if (!ts) continue
    scheduled++

    if (!earliest || ts < earliest) earliest = ts
    if (!latest || ts > latest) latest = ts

    const dayKey = ts.slice(0, 10) // YYYY-MM-DD from ISO timestamp
    perDay[dayKey] = (perDay[dayKey] ?? 0) + 1
  }

  const dayCount = Object.keys(perDay).length
  return {
    scheduled,
    unscheduled: imageIds.length - scheduled,
    earliest,
    latest,
    dayCount,
    perDay, // { 'YYYY-MM-DD': count }
  }
}
