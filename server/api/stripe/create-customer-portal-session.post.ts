// POST /api/stripe/create-customer-portal-session
//
// Returns { url } — caller redirects there. Used by the "Manage billing"
// menu item in the app shell. Subscription cancel / payment-method update /
// invoices all live behind this URL.

export default defineEventHandler(async (event) => {
  const user   = await requireUser(event)
  const stripe = getStripe()
  const cfg    = useRuntimeConfig()
  const admin  = serverSupabaseAdmin(event)

  const profile = await admin
    .from('app_user')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (profile.error || !profile.data?.stripe_customer_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No active billing — subscribe first to access the customer portal.',
    })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer:   profile.data.stripe_customer_id,
    return_url: `${cfg.public.siteUrl}/app/dashboard`,
  })

  return { url: session.url }
})
