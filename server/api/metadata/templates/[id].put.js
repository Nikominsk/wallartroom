import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event) ?? {}

  const patch = {}
  if (body.name !== undefined) patch.name = String(body.name).trim()
  if (body.options !== undefined) patch.options = body.options

  if (!Object.keys(patch).length)
    throw createError({ statusCode: 400, statusMessage: 'Nothing to update' })
  if (patch.name !== undefined && !patch.name)
    throw createError({ statusCode: 400, statusMessage: 'Name cannot be empty' })

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('ai_generation_templates')
    .update(patch)
    .eq('id', id)
    .select('id, name, options, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
