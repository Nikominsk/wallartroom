import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const id = getRouterParam(event, 'id')

  // Fetch export record to get image_ids
  const { data: exportRow, error: exportErr } = await client
    .from('pinterest_csv_export')
    .select('image_ids')
    .eq('id', id)
    .single()

  if (exportErr) throw createError({ statusCode: 404, statusMessage: 'Export not found' })

  const imageIds = exportRow.image_ids ?? []
  if (imageIds.length === 0) return { data: [] }

  const { data, error } = await client
    .from('image')
    .select(`
      *,
      primary_color:color!primary_color_id(name,hex),
      secondary_color:color!secondary_color_id(name,hex),
      tertiary_color:color!tertiary_color_id(name,hex),
      pinterest_image(*),
      adobe_image(*)
    `)
    .in('id', imageIds)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { data: data ?? [] }
})
