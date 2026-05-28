// Route guard. Three protected zones:
//   /metadata/*  → any authenticated user (now multi-tenant: each user has
//                  their own projects — see requireMetadataProject)
//   /admin/*     → users with role='admin' OR the founder email
//   /app/*       → any authenticated user
//
// /admin gate is enforced both client-side (this middleware) and server-side
// (every /api/admin/* endpoint re-checks).
// All other routes (landing, /pricing, /gallery, /signup, /login) are public.

const ADMIN_EMAIL = 'nniko.geuenich@gmail.com'

export default defineNuxtRouteMiddleware(async (to) => {
  const isMetadata = to.path.startsWith('/metadata')
  const isAdmin    = to.path.startsWith('/admin')
  const isApp      = to.path.startsWith('/app')

  if (!isMetadata && !isAdmin && !isApp) return

  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo(`/login?next=${encodeURIComponent(to.fullPath)}`)
  }

  if (isMetadata) {
    // Any signed-in user may use the Pinterest workspace; their data is
    // isolated per-user/per-project on the server.
    return
  }

  if (isAdmin) {
    // Founder email passes immediately even if app_user.role hasn't been
    // promoted in the DB. Anyone else needs role='admin'.
    if (user.value.email?.toLowerCase() === ADMIN_EMAIL) return
    if (import.meta.server) return
    try {
      const me = await $fetch<{ role?: string }>('/api/me')
      if (me?.role !== 'admin') return navigateTo('/metadata')
    } catch {
      return navigateTo('/login?error=auth')
    }
  }
})
