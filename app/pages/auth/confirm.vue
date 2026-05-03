<template>
  <div class="confirm-page">
    <svg class="confirm-page__spinner" width="26" height="26" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke="#e5e7eb" stroke-width="2.5" />
      <path d="M11 2a9 9 0 0 1 9 9" stroke="#9b5f3d" stroke-width="2.5" stroke-linecap="round" />
    </svg>
    <p>Completing sign in…</p>
  </div>
</template>

<script setup>
definePageMeta({ layout: false, ssr: false })

const client = useSupabaseClient()

onMounted(async () => {
  const { data: { session } } = await client.auth.getSession()

  if (!session?.user) {
    return navigateTo('/login?error=auth')
  }

  if (session.user.email !== 'nniko.geuenich@gmail.com') {
    await client.auth.signOut()
    return navigateTo('/login?error=unauthorized')
  }

  window.location.href = '/metadata'
})
</script>

<style scoped>
.confirm-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #faf7f2;
  color: #8a7a6e;
  font-size: 14px;
  font-family: inherit;
}

.confirm-page__spinner {
  animation: confirm-spin 0.8s linear infinite;
}

@keyframes confirm-spin { to { transform: rotate(360deg); } }
</style>
