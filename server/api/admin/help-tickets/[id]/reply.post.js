// POST /api/admin/help-tickets/:id/reply
// Admin-only. Saves an admin reply to a help ticket and optionally appends
// new content to the knowledge base so future AI answers improve.
// Body: { reply: string, kbUpdate?: string }

const ADMIN_EMAIL = 'nniko.geuenich@gmail.com'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    const supaAdmin = serverSupabaseAdmin(event)
    const { data: row } = await supaAdmin.from('app_user').select('role').eq('id', user.id).maybeSingle()
    if (row?.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  const id = getRouterParam(event, 'id')
  const { reply, kbUpdate } = await readBody(event)

  if (!reply?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'reply is required' })
  }

  const admin = serverSupabaseAdmin(event)

  const { error: ticketError } = await admin
    .from('help_tickets')
    .update({
      admin_reply:      reply.trim(),
      admin_replied_at: new Date().toISOString(),
      status:           'answered',
    })
    .eq('id', id)

  if (ticketError) {
    throw createError({ statusCode: 500, statusMessage: ticketError.message })
  }

  // Optionally append new knowledge to the KB so future AI answers improve
  if (kbUpdate?.trim()) {
    const { data: kbRow } = await admin
      .from('help_knowledge_base')
      .select('content')
      .eq('id', 1)
      .maybeSingle()

    const existing = kbRow?.content ?? ''
    const appended = existing + '\n\n## Additional Information (added from support)\n' + kbUpdate.trim()

    await admin
      .from('help_knowledge_base')
      .update({ content: appended, updated_at: new Date().toISOString() })
      .eq('id', 1)
  }

  return { ok: true }
})
