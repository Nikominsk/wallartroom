import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing image id' })

  const client = serverSupabaseServiceRole(event)

  // pinterest_image and adobe_image use `on delete cascade` (migration 001),
  // so removing the image row also removes its metadata rows.
  const { error } = await client.from('image').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true, id }
})
