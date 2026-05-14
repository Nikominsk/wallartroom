import { serverSupabaseServiceRole } from '#supabase/server'

const ALLOWED_FIELDS = new Set(['public_url', 'thumbnail_url', 'filename'])

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing image id' })

  const body = await readBody(event)
  const patch = {}
  for (const [k, v] of Object.entries(body ?? {})) {
    if (ALLOWED_FIELDS.has(k)) patch[k] = v === '' ? null : v
  }
  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No allowed fields in body' })
  }
  if ('public_url' in patch && !patch.public_url) {
    throw createError({ statusCode: 400, statusMessage: 'public_url cannot be empty' })
  }

  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('image')
    .update(patch)
    .eq('id', id)
    .select('id, public_url, thumbnail_url, filename')
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data
})
