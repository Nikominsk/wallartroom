<template>
  <div class="login-page">
    <div class="login-page__card">
      <div class="login-page__logo">Wall<span>Vision</span></div>

      <h1 class="login-page__title">Admin Access</h1>
      <p class="login-page__sub">Sign in with your Google account to continue.</p>

      <div v-if="error" class="login-page__error">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style="flex-shrink:0">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        {{ error }}
      </div>

      <button class="login-page__btn" :disabled="loading" @click="signIn">
        <svg v-if="loading" class="login-page__spinner" width="18" height="18" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="currentColor" stroke-width="2.5" stroke-dasharray="28" stroke-dashoffset="14" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {{ loading ? 'Redirecting…' : 'Sign in with Google' }}
      </button>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const client = useSupabaseClient()
const route  = useRoute()
const loading = ref(false)

const error = computed(() => {
  if (route.query.error === 'unauthorized') return 'This Google account does not have access.'
  if (route.query.error === 'auth')         return 'Authentication failed. Please try again.'
  return null
})

async function signIn() {
  loading.value = true
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/confirm` },
  })
  if (error) loading.value = false
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #faf7f2;
  padding: 24px;

  &__card {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 20px;
    padding: 48px 44px;
    width: 100%;
    max-width: 380px;
    box-shadow: 0 8px 32px rgba(60, 40, 20, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  &__logo {
    font-weight: 800;
    font-size: 22px;
    letter-spacing: -0.04em;
    color: #3f342c;
    margin-bottom: 32px;

    span { color: #9b5f3d; }
  }

  &__title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 700;
    color: #3f342c;
    letter-spacing: -0.03em;
  }

  &__sub {
    margin: 0 0 28px;
    font-size: 14px;
    color: #8a7a6e;
    text-align: center;
    line-height: 1.5;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    font-size: 13px;
    color: #991b1b;
    margin-bottom: 16px;
    line-height: 1.4;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    height: 46px;
    padding: 0 20px;
    border: 1px solid #e0d4c8;
    border-radius: 12px;
    background: #fff;
    font-family: inherit;
    font-size: 15px;
    font-weight: 600;
    color: #3f342c;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

    &:hover:not(:disabled) {
      background: #faf7f2;
      border-color: #c8b89f;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
    }

    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }

  &__spinner {
    animation: login-spin 0.8s linear infinite;
  }

  @keyframes login-spin { to { transform: rotate(360deg); } }
}
</style>
