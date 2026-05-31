// PATCH /api/me/notify-plans — toggles the "notify me when plans launch" flag.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  if (typeof body?.notify !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: '`notify` must be a boolean.' })
  }
  const admin = serverSupabaseAdmin(event)
  const { error } = await admin
    .from('app_user')
    .update({ notify_plans_launch: body.notify })
    .eq('id', user.id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ok: true, notify: body.notify }
})
