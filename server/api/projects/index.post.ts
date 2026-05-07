// POST /api/projects — create a new project.
// Body: { title?, roomImageUrl, selectedWallArea?, placementMode? }

interface CreateProjectBody {
  title?:            string
  roomImageUrl:      string
  selectedWallArea?: Record<string, unknown> | null
  placementMode?:    'flat' | 'perspective' | 'replace_existing'
}

export default defineEventHandler(async (event) => {
  const user  = await requireUser(event)
  const body  = await readBody<CreateProjectBody>(event)

  if (!body?.roomImageUrl || typeof body.roomImageUrl !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'roomImageUrl required' })
  }

  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('project')
    .insert({
      user_id:            user.id,
      title:              body.title?.trim() || 'Untitled',
      room_image_url:     body.roomImageUrl,
      selected_wall_area: body.selectedWallArea ?? null,
      placement_mode:     body.placementMode ?? 'flat',
    })
    .select('id, title, room_image_url, selected_wall_area, placement_mode, best_score, created_at, updated_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data
})
