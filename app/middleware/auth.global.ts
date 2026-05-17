// Route guard. Three protected zones:
//   /metadata/*  → any authenticated user (now multi-tenant: each user has
//                  their own projects — see requireMetadataProject)
//   /admin/*     → users with role='admin' in app_user
//   /app/*       → any authenticated user
//
// /admin role check happens via /api/me (server-side, role-aware).
// All other routes (landing, /pricing, /gallery, /signup, /login) are public.

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
    // Lazy server check — fast-fails on the dashboard if role≠admin.
    if (import.meta.server) return
    try {
      const me = await $fetch<{ role?: string }>('/api/me')
      if (me?.role !== 'admin') return navigateTo('/metadata')
    } catch {
      return navigateTo('/login?error=auth')
    }
  }
})
