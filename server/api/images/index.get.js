// Returns every image (with joined Pinterest / Adobe metadata) that belongs to
// the caller's ACTIVE project. The gallery does its own filtering/pagination
// client-side so the visible total reflects the active filter set.
export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)

  const { data, error, count } = await client
    .from('image')
    .select(`
      *,
      primary_color:color!primary_color_id(name,hex),
      secondary_color:color!secondary_color_id(name,hex),
      tertiary_color:color!tertiary_color_id(name,hex),
      pinterest_image(*),
      adobe_image(*)
    `, { count: 'exact' })
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(0, 49999) // covers the practical ceiling without hitting PostgREST's default 1000 cap

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { data, count }
})
