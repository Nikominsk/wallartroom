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

  // Multi-board memberships fetched separately (not embedded) so a missing
  // migration / stale PostgREST cache can never take down the whole gallery.
  // Degrades gracefully: if the join table isn't there yet, boards are empty.
  try {
    const { data: links } = await client
      .from('pinterest_image_board')
      .select('image_id, board_id, pinterest_board(id, name, color)')
      .eq('project_id', projectId)

    const byImage = new Map()
    for (const l of links ?? []) {
      if (!byImage.has(l.image_id)) byImage.set(l.image_id, [])
      byImage.get(l.image_id).push({ board_id: l.board_id, pinterest_board: l.pinterest_board })
    }
    for (const img of data ?? []) {
      img.pinterest_image_board = byImage.get(img.id) ?? []
    }
  } catch (e) {
    console.warn('[images] could not load board memberships — run migration 019.', e?.message ?? e)
  }

  return { data, count }
})
