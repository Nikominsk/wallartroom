// DELETE /api/metadata/projects/[id]
// Deletes a project the user owns AND everything inside it — images, pins,
// boards, CSV-export history, AI templates and settings all cascade via the
// project_id FKs added in migration 014.
//
// Guard: a user must always keep at least one project, so deleting the last
// one is rejected. If the deleted project was the active one, the active
// cookie is repointed at the user's next remaining project.

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id   = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'project id required' })

  const admin = serverSupabaseAdmin(event)

  const { data: owned, error: ownErr } = await admin
    .from('metadata_project')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (ownErr) throw createError({ statusCode: 500, statusMessage: ownErr.message })

  const ids = (owned ?? []).map(p => p.id)
  if (!ids.includes(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  if (ids.length <= 1) {
    throw createError({
      statusCode: 409,
      statusMessage: 'You can’t delete your only project. Create another one first.',
    })
  }

  const { error: delErr } = await admin
    .from('metadata_project')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (delErr) throw createError({ statusCode: 500, statusMessage: delErr.message })

  // Repoint the active-project cookie if it pointed at the deleted one.
  const activeId = getCookie(event, METADATA_PROJECT_COOKIE)
  if (activeId === id) {
    const nextId = ids.find(pid => pid !== id) ?? null
    if (nextId) {
      setCookie(event, METADATA_PROJECT_COOKIE, nextId, {
        path:     '/',
        sameSite: 'lax',
        maxAge:   60 * 60 * 24 * 365,
      })
    }
  }

  return { ok: true, id }
})
