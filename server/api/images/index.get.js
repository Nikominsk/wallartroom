import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { page = 1, size = 10 } = getQuery(event)

  const from = (Number(page) - 1) * Number(size)
  const to = from + Number(size) - 1

  const { data, error, count } = await client
    .from('image')
    .select(`
      *,
      primary_color:color!primary_color_id(name,hex),
      secondary_color:color!secondary_color_id(name,hex),
      tertiary_color:color!tertiary_color_id(name,hex),
      pinterest_image(*),
      adobe_image(*)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { data, count }
})
