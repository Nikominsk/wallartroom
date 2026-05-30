// POST /api/metadata/projects/:id/move-images
// Reassigns all images in the source project to a target project.
// Both projects must belong to the authenticated user.
// Body: { targetProjectId: string }

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const sourceId = getRouterParam(event, 'id')
  if (!sourceId) throw createError({ statusCode: 400, statusMessage: 'project id required' })

  const { targetProjectId } = await readBody(event)
  if (!targetProjectId) throw createError({ statusCode: 400, statusMessage: 'targetProjectId required' })
  if (targetProjectId === sourceId) throw createError({ statusCode: 400, statusMessage: 'source and target must differ' })

  const admin = serverSupabaseAdmin(event)

  // Verify user owns both projects
  const { data: owned } = await admin
    .from('metadata_project')
    .select('id')
    .eq('user_id', user.id)
    .in('id', [sourceId, targetProjectId])

  const ownedIds = (owned ?? []).map(p => p.id)
  if (!ownedIds.includes(sourceId))    throw createError({ statusCode: 404, statusMessage: 'Source project not found' })
  if (!ownedIds.includes(targetProjectId)) throw createError({ statusCode: 404, statusMessage: 'Target project not found' })

  const { error, count } = await admin
    .from('image')
    .update({ project_id: targetProjectId })
    .eq('project_id', sourceId)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { moved: count ?? 0 }
})
