export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const { data, error } = await client
    .from('pinterest_board')
    .select('id, name, color, stat_impressions, stat_engagement, stat_pin_clicks, stat_outbound_clicks, stat_saves, stats_updated_at')
    .eq('project_id', projectId)
    .order('name', { ascending: true })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
