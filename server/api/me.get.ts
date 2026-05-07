// GET /api/me — bundled "current user" payload for the dashboard.
// Returns app_user profile, wallet, recent projects, and computed available credits.

export default defineEventHandler(async (event) => {
  const user  = await requireUser(event)
  const admin = serverSupabaseAdmin(event)

  const [profileRes, walletRes, projectsRes] = await Promise.all([
    admin.from('app_user')
      .select('id, email, name, role, plan, subscription_status, subscription_current_period_end, stripe_customer_id, created_at')
      .eq('id', user.id)
      .single(),
    admin.from('credit_wallet')
      .select('monthly_credits_remaining, monthly_credits_total, purchased_credits_remaining, reserved_credits, reset_date')
      .eq('user_id', user.id)
      .single(),
    admin.from('project')
      .select('id, title, room_image_url, best_score, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(12),
  ])

  if (profileRes.error) {
    throw createError({ statusCode: 500, statusMessage: `profile: ${profileRes.error.message}` })
  }
  if (walletRes.error) {
    throw createError({ statusCode: 500, statusMessage: `wallet: ${walletRes.error.message}` })
  }
  if (projectsRes.error) {
    throw createError({ statusCode: 500, statusMessage: `projects: ${projectsRes.error.message}` })
  }

  const w = walletRes.data
  const wallet = {
    monthlyCreditsRemaining:   w.monthly_credits_remaining,
    monthlyCreditsTotal:       w.monthly_credits_total,
    purchasedCreditsRemaining: w.purchased_credits_remaining,
    reservedCredits:           w.reserved_credits,
    resetDate:                 w.reset_date,
    available: availableCredits({
      monthlyCreditsRemaining:   w.monthly_credits_remaining,
      purchasedCreditsRemaining: w.purchased_credits_remaining,
      reservedCredits:           w.reserved_credits,
    }),
  }

  return {
    id:      profileRes.data.id,
    email:   profileRes.data.email,
    name:    profileRes.data.name,
    role:    profileRes.data.role,
    plan:    profileRes.data.plan,
    subscription: {
      status:           profileRes.data.subscription_status,
      currentPeriodEnd: profileRes.data.subscription_current_period_end,
    },
    stripeCustomerId: profileRes.data.stripe_customer_id,
    wallet,
    projects: projectsRes.data.map((p) => ({
      id:           p.id,
      title:        p.title,
      roomImageUrl: p.room_image_url,
      bestScore:    p.best_score,
      createdAt:    p.created_at,
      updatedAt:    p.updated_at,
    })),
  }
})
