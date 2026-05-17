// DELETE /api/me — permanently delete the signed-in user: every R2 object
// they own plus their entire DB footprint.
//
// Order matters: R2 first (we need image.public_url to compute storage keys;
// once the user row is gone those pointers are gone too), then the auth user.
//
// One DB delete suffices: app_user.id → auth.users(id) ON DELETE CASCADE
// (migration 004), and everything hangs off app_user via ON DELETE CASCADE —
// metadata_project → image → pinterest_image / adobe_image, plus credit_wallet,
// credit_ledger, etc. Deleting the Supabase auth user unwinds all of it.

export default defineEventHandler(async (event) => {
  const user  = await requireUser(event)
  const admin = serverSupabaseAdmin(event)

  // 1. Collect every R2 key this user owns, across all their projects. Reading
  //    public_url covers BOTH layouts — old flat `pinterest/landscape/...`
  //    objects and the new `pinterest/user/...` ones.
  const { data: projects, error: projErr } = await admin
    .from('metadata_project')
    .select('id')
    .eq('user_id', user.id)
  if (projErr) {
    throw createError({ statusCode: 500, statusMessage: `Lookup failed: ${projErr.message}` })
  }

  const projectIds = (projects ?? []).map(p => p.id)
  let keys: (string | null)[] = []
  if (projectIds.length) {
    const { data: images, error: imgErr } = await admin
      .from('image')
      .select('public_url')
      .in('project_id', projectIds)
    if (imgErr) {
      throw createError({ statusCode: 500, statusMessage: `Lookup failed: ${imgErr.message}` })
    }
    keys = (images ?? []).map(i => keyFromPublicUrl(i.public_url))
  }

  // 2. Delete storage: the DB-tracked keys (any layout) + a sweep of the
  //    user's dedicated prefix to also catch anything not tracked in the DB.
  //    This must succeed before we drop the DB (we can't recover keys after).
  try {
    await deleteFromR2(keys)
    const prefix = (process.env.R2_PINTEREST_USER_PREFIX || 'pinterest/user')
      .replace(/^\/+|\/+$/g, '')
    await deleteR2Prefix(`${prefix}/${user.id}/`)
  } catch (e: any) {
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to delete stored images: ${e?.message ?? 'unknown error'}. Account not deleted.`,
    })
  }

  // 3. Delete the Supabase auth user (hard delete) → cascades the whole DB.
  const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
  if (authErr) {
    throw createError({
      statusCode: 500,
      statusMessage: `Account deletion failed: ${authErr.message}`,
    })
  }

  return { ok: true }
})
