import { serverSupabaseServiceRole } from '#supabase/server'

const HEX = /^#[0-9a-fA-F]{6}$/

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const patch = {}
  if (body.name !== undefined) {
    if (!body.name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Board name cannot be empty' })
    patch.name = body.name.trim()
  }
  if (body.color !== undefined) {
    if (body.color !== null && !HEX.test(String(body.color))) {
      throw createError({ statusCode: 400, statusMessage: 'Color must be a #RRGGBB hex string' })
    }
    patch.color = body.color
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No fields to update' })
  }

  // If the name is changing, mirror it onto every pinterest_image.board reference
  // so existing pins keep their board association.
  let oldName
  if (patch.name !== undefined) {
    const { data: current, error: fetchErr } = await client
      .from('pinterest_board')
      .select('name')
      .eq('id', id)
      .single()
    if (fetchErr || !current) throw createError({ statusCode: 404, statusMessage: 'Board not found' })
    oldName = current.name
  }

  const { data, error } = await client
    .from('pinterest_board')
    .update(patch)
    .eq('id', id)
    .select('id, name, color')
    .single()

  if (error) {
    if (error.code === '23505') throw createError({ statusCode: 409, statusMessage: 'Board name already exists' })
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  if (patch.name !== undefined && oldName && oldName !== patch.name) {
    const { error: rebindErr } = await client
      .from('pinterest_image')
      .update({ board: patch.name })
      .eq('board', oldName)
    if (rebindErr) throw createError({ statusCode: 500, statusMessage: rebindErr.message })
  }

  return data
})
