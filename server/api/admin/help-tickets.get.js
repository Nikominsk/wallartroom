// GET /api/admin/help-tickets
// Admin-only. Returns all support tickets with user info, sorted so open ones
// come first (most recent first within each group).

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

  const admin = serverSupabaseAdmin(event)

  const { data, error } = await admin
    .from('help_tickets')
    .select(`
      id, question, ai_response, ai_answered,
      status, admin_reply, admin_replied_at,
      user_read_at, created_at,
      app_user!inner(email, name)
    `)
    .order('status',     { ascending: true })  // 'answered' > 'open' alphabetically — handled client-side
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const tickets = (data ?? []).map(t => ({
    id:               t.id,
    question:         t.question,
    ai_response:      t.ai_response,
    ai_answered:      t.ai_answered,
    status:           t.status,
    admin_reply:      t.admin_reply,
    admin_replied_at: t.admin_replied_at,
    user_read_at:     t.user_read_at,
    created_at:       t.created_at,
    user_email:       t.app_user?.email ?? '',
    user_name:        t.app_user?.name  ?? null,
  }))

  const openCount     = tickets.filter(t => t.status === 'open').length
  const answeredCount = tickets.filter(t => t.status === 'answered').length

  return { tickets, openCount, answeredCount }
})
