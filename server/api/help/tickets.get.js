// GET /api/help/tickets
// Authenticated. Returns the current user's help tickets that are still
// "visible" — read replies older than 3 days are excluded (auto-expiry).
// Also returns unreadCount (tickets with admin_reply not yet read by user).

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const admin = serverSupabaseAdmin(event)

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch tickets that aren't yet expired:
  // - open tickets always shown
  // - answered+unread always shown
  // - answered+read only if read within the last 3 days
  const { data, error } = await admin
    .from('help_tickets')
    .select('id, question, ai_response, ai_answered, status, admin_reply, admin_replied_at, user_read_at, created_at')
    .eq('user_id', user.id)
    .or(`status.eq.open,user_read_at.is.null,user_read_at.gte.${threeDaysAgo}`)
    .order('created_at', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const tickets = data ?? []
  const unreadCount = tickets.filter(t => t.status === 'answered' && !t.user_read_at).length

  return { tickets, unreadCount }
})
