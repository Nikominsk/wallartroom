// DELETE /api/projects/[id] — delete a project (cascades to visualizations).

export default defineEventHandler(async (event) => {
  const user  = await requireUser(event)
  const id    = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'project id required' })

  const admin = serverSupabaseAdmin(event)

  const own = await admin.from('project').select('user_id').eq('id', id).single()
  if (own.error || !own.data) throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  if (own.data.user_id !== user.id) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const { error } = await admin.from('project').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true }
})
