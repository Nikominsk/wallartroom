<template>
  <section class="bc">
    <div class="bc__card">
      <h1>Checkout canceled</h1>
      <p>No charge was made. You can pick up where you left off whenever you're ready.</p>
      <div class="bc__actions">
        <NuxtLink to="/pricing" class="bc__cta">Back to pricing →</NuxtLink>
        <NuxtLink to="/app/dashboard" class="bc__cta-ghost">Dashboard</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })
</script>

<style scoped lang="scss">
.bc {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;

  &__card {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 18px;
    padding: 48px 40px;
    max-width: 480px;
    width: 100%;
    text-align: center;
  }
  h1 {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 700;
    color: #1a1714;
  }
  p { color: #6b5e52; margin: 0 0 24px; }

  &__actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
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
}
</style>
