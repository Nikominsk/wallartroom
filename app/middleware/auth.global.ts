// Route guard. Three protected zones:
//   /metadata/*  → only the existing Pinterest admin email (legacy internal tool)
//   /admin/*     → users with role='admin' in app_user
//   /app/*       → any authenticated user
//
// /admin role check happens via /api/me (server-side, role-aware).
// All other routes (landing, /pricing, /gallery, /signup, /login) are public.

const PINTEREST_ADMIN_EMAIL = 'nniko.geuenich@gmail.com'

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
    if (user.value.email !== PINTEREST_ADMIN_EMAIL) {
      return navigateTo('/login?error=unauthorized')
    }
    return
  }

  if (isAdmin) {
    // Lazy server check — fast-fails on the dashboard if role≠admin.
    if (import.meta.server) return
    try {
      const me = await $fetch<{ role?: string }>('/api/me')
      if (me?.role !== 'admin') return navigateTo('/app/dashboard')
    } catch {
      return navigateTo('/login?error=auth')
    }
  }
})
