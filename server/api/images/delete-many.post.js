import { serverSupabaseServiceRole } from '#supabase/server'

const MAX_BATCH = 500

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : []

  if (ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No image ids provided' })
  }
  if (ids.length > MAX_BATCH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Too many ids in one request (max ${MAX_BATCH})`,
    })
  }

  const client = serverSupabaseServiceRole(event)
  // pinterest_image / adobe_image cascade on delete (migration 001), so a
  // single DELETE on `image` removes all related rows in one shot.
  const { error } = await client.from('image').delete().in('id', ids)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true, deleted: ids.length }
})
