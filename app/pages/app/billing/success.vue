<template>
  <section class="bs">
    <div class="bs__card">
      <div class="bs__icon" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4 10-10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <h1>Thanks — you're all set</h1>
      <p v-if="me">
        You're now on the <strong>{{ planLabel }}</strong> plan with
        <strong>{{ me.wallet.available }} credits</strong> ready to use.
      </p>
      <p v-else>Loading your account…</p>

      <div class="bs__actions">
        <NuxtLink to="/app/dashboard" class="bs__cta">Go to dashboard →</NuxtLink>
        <NuxtLink to="/app/new" class="bs__cta-ghost">Create a visualization</NuxtLink>
      </div>

      <p class="bs__hint">
        Stripe sometimes takes a few seconds to confirm. If your plan doesn't update,
        refresh the dashboard in a moment.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })

// Stripe webhook is what actually grants credits & updates plan. We refresh
// /api/me on this page (and again after a short delay) to catch the update.
const { data: me, refresh } = useMe()

const planLabel = computed(() => {
  const p = me.value?.plan
  if (!p) return ''
  return ({ free: 'Free', pro: 'Pro' } as Record<string, string>)[p] ?? p
})

onMounted(async () => {
  await refresh()
  // Webhook can take a beat — try once more after 3s if the plan still says free.
  setTimeout(async () => {
    if (me.value?.plan === 'free' || (me.value?.wallet?.available ?? 0) === 0) {
      await refresh()
    }
  }, 3000)
})
</script>

<style scoped lang="scss">
.bs {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;

  &__card {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 18px;
    padding: 48px 40px;
    max-width: 520px;
    width: 100%;
    text-align: center;
  }

  &__icon {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: #faf3e3;
    color: #c5a059;
    margin: 0 auto 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  h1 {
    margin: 0 0 12px;
    font-size: 26px;
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.02em;
  }
  > .bs__card > p {
    color: #6b5e52;
    font-size: 15px;
    line-height: 1.55;
    margin: 0 0 28px;
  }

  &__actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }
  &__cta {
    background: #1a1714;
    color: #fff;
    text-decoration: none;
    padding: 12px 22px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 14px;
    &:hover { background: #2d2926; }
  }
  &__cta-ghost {
    background: #fff;
    border: 1px solid #ede0d0;
    color: #1a1714;
    text-decoration: none;
    padding: 12px 22px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 14px;
    &:hover { border-color: #c5a059; }
  }

  &__hint {
    font-size: 12px;
    color: #8a7a6e;
    margin: 0;
  }
}
</style>
