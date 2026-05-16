import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { name, options } = await readBody(event) ?? {}

  if (!name?.trim())
    throw createError({ statusCode: 400, statusMessage: 'Template name is required' })

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('ai_generation_templates')
    .insert({ name: name.trim(), options: options ?? {} })
    .select('id, name, options, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
