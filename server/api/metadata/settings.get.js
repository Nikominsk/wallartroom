import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = serverSupabaseServiceRole(event)
  const { data, error } = await client
    .from('metadata_settings')
    .select('ai_max_title_length, ai_max_description_length, ai_default_tone, ai_additional_instructions, ai_default_language')
    .eq('id', 1)
    .maybeSingle()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // The row is seeded in the migration but maybeSingle() is defensive: return
  // hard-coded defaults if it disappeared (e.g. local fresh DB).
  return data ?? {
    ai_max_title_length: 100,
    ai_max_description_length: 300,
    ai_default_tone: '',
    ai_additional_instructions: '',
    ai_default_language: 'English',
  }
})
