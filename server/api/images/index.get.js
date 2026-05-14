import { serverSupabaseServiceRole } from '#supabase/server'

// Returns every image with its joined Pinterest / Adobe metadata. The metadata
// gallery does its own filtering and pagination client-side so the visible
// total reflects the active filter set.
export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)

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
    .range(0, 49999) // covers the practical ceiling without hitting PostgREST's default 1000 cap

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { data, count }
})
