export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/metadata')) return

  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo('/login')
  }

  if (user.value.email !== 'nniko.geuenich@gmail.com') {
    return navigateTo('/login?error=unauthorized')
  }
})
