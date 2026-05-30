// POST /api/help/tickets/:id/read
// Authenticated. Marks a ticket's admin reply as read by the user.

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id   = getRouterParam(event, 'id')

  const admin = serverSupabaseAdmin(event)

  // Verify ticket belongs to this user before updating
  const { data: ticket } = await admin
    .from('help_tickets')
    .select('id, user_id, user_read_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!ticket) {
    throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
  }

  if (!ticket.user_read_at) {
    await admin
      .from('help_tickets')
      .update({ user_read_at: new Date().toISOString() })
      .eq('id', id)
  }

  return { ok: true }
})
