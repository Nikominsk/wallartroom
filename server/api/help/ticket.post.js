// POST /api/help/ticket
// Authenticated. Submits a support question to the admin (founder) queue.
// Body: { question, aiResponse, aiAnswered }

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { question, aiResponse, aiAnswered } = await readBody(event)

  if (!question?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'question is required' })
  }

  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('help_tickets')
    .insert({
      user_id:      user.id,
      question:     question.trim().slice(0, 1000),
      ai_response:  aiResponse?.trim()?.slice(0, 2000) ?? null,
      ai_answered:  aiAnswered ?? false,
      status:       'open',
    })
    .select('id')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { id: data.id }
})
