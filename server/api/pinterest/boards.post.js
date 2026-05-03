import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { name } = await readBody(event)
  if (!name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Board name is required' })

  const { data, error } = await client
    .from('pinterest_board')
    .insert({ name: name.trim() })
    .select('id, name')
    .single()

  if (error) {
    if (error.code === '23505') throw createError({ statusCode: 409, statusMessage: 'Board already exists' })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
