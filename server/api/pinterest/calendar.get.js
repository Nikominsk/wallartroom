import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { from, to } = getQuery(event)

  if (!from || !to) {
    throw createError({ statusCode: 400, statusMessage: 'from and to are required' })
  }

  const { data, error } = await client
    .from('pinterest_image')
    .select(`
      image_id,
      title,
      board,
      publish_date,
      status,
      image!image_id(filename, thumbnail_url)
    `)
    .gte('publish_date', `${from}T00:00:00`)
    .lte('publish_date', `${to}T23:59:59`)
    .order('publish_date', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { data: data ?? [] }
})
