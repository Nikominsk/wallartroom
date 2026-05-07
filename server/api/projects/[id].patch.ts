// PATCH /api/projects/[id] — update title and/or wall area.

interface PatchBody {
  title?:            string
  selectedWallArea?: Record<string, unknown> | null
  placementMode?:    'flat' | 'perspective' | 'replace_existing'
}

export default defineEventHandler(async (event) => {
  const user  = await requireUser(event)
  const id    = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'project id required' })

  const body = await readBody<PatchBody>(event)
  const admin = serverSupabaseAdmin(event)

  // Ownership check first.
  const own = await admin.from('project').select('user_id').eq('id', id).single()
  if (own.error || !own.data) throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  if (own.data.user_id !== user.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const update: Record<string, unknown> = {}
  if (typeof body.title === 'string')                update.title              = body.title.trim() || 'Untitled'
  if (body.selectedWallArea !== undefined)           update.selected_wall_area = body.selectedWallArea
  if (body.placementMode)                            update.placement_mode     = body.placementMode

  if (!Object.keys(update).length) return { ok: true, updated: 0 }

  const { error } = await admin.from('project').update(update).eq('id', id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true, updated: 1 }
})
