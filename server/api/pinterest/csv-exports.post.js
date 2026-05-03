import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { filename, row_count, image_ids } = await readBody(event)

  if (!filename || !Array.isArray(image_ids)) {
    throw createError({ statusCode: 400, statusMessage: 'filename and image_ids are required' })
  }

  const { data, error } = await client
    .from('pinterest_csv_export')
    .insert({ filename, row_count: row_count ?? image_ids.length, image_ids })
    .select('id, filename, row_count, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data
})
