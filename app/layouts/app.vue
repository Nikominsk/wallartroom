<template>
  <div class="appshell">
    <header class="appshell__top">
      <div class="appshell__top-inner">
        <NuxtLink to="/app/dashboard" class="appshell__brand">
          Wall<span>Art</span>Room
        </NuxtLink>

        <nav class="appshell__nav">
          <NuxtLink to="/app/dashboard">Dashboard</NuxtLink>
          <NuxtLink to="/app/new">New visualization</NuxtLink>
          <NuxtLink to="/gallery">Gallery</NuxtLink>
          <NuxtLink to="/pricing">Pricing</NuxtLink>
        </nav>

        <div class="appshell__right">
          <NuxtLink v-if="me" to="/pricing" class="appshell__credits" :class="{ low: me.wallet.available < 5 }">
            <span class="appshell__credits-num">{{ me.wallet.available }}</span>
            <span class="appshell__credits-label">credits</span>
          </NuxtLink>

          <div class="appshell__menu" :class="{ open: menuOpen }">
            <button class="appshell__avatar" @click="menuOpen = !menuOpen" type="button" aria-label="Account menu">
              {{ initials }}
            </button>
            <div v-if="menuOpen" class="appshell__menu-pop" @click.stop>
              <div class="appshell__menu-head">
                <div class="appshell__menu-name">{{ me?.name || 'Loading…' }}</div>
                <div class="appshell__menu-email">{{ me?.email }}</div>
                <div class="appshell__menu-plan">{{ planLabel }}</div>
              </div>
              <NuxtLink to="/app/dashboard" class="appshell__menu-item" @click="menuOpen = false">Dashboard</NuxtLink>
              <NuxtLink to="/pricing" class="appshell__menu-item" @click="menuOpen = false">Plans &amp; credits</NuxtLink>
              <button class="appshell__menu-item appshell__menu-signout" type="button" @click="signOut">Sign out</button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="appshell__main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { data: me } = useMe()

const menuOpen = ref(false)

const initials = computed(() => {
  const name = me.value?.name || me.value?.email || ''
  if (!name) return '·'
  const parts = name.split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0]?.toUpperCase()
})

const planLabel = computed(() => {
  const p = me.value?.plan
  if (!p) return ''
  return { free: 'Free plan', starter: 'Starter', plus: 'Plus', studio: 'Studio' }[p]
})

async function signOut() {
  await supabase.auth.signOut()
  await navigateTo('/')
}

// Close menu on outside click
onMounted(() => {
  const onDoc = (e: MouseEvent) => {
    if (!menuOpen.value) return
    const target = e.target as HTMLElement
    if (!target.closest('.appshell__menu')) menuOpen.value = false
  }
  document.addEventListener('click', onDoc)
  onBeforeUnmount(() => document.removeEventListener('click', onDoc))
})
</script>

<style scoped lang="scss">
.appshell {
  min-height: 100vh;
  background: #faf7f2;
  color: #2d2926;

  &__top {
    position: sticky;
    top: 0;
    z-index: 50;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid #ede0d0;
  }

  &__top-inner {
    max-width: 1320px;
    margin: 0 auto;
    padding: 14px 28px;
    display: flex;
    align-items: center;
    gap: 36px;
  }

  &__brand {
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.04em;
    color: #1a1714;
    text-decoration: none;
    span { color: #c5a059; }
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 28px;
    flex: 1;

    a {
      font-size: 14px;
      font-weight: 500;
      color: #6b5e52;
      text-decoration: none;
      transition: color 0.15s;
      &:hover, &.router-link-active { color: #1a1714; }
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__credits {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    padding: 8px 14px;
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 999px;
    font-size: 13px;
    color: #6b5e52;
    text-decoration: none;
    transition: border-color 0.15s, background 0.15s;

    &:hover { border-color: #c5a059; background: #fdfaf3; }
    &.low { border-color: #d97706; background: #fff7ed; color: #92400e; }

    &-num { font-weight: 700; color: #1a1714; }
    &-label { font-weight: 500; }
  }

  &__menu {
    position: relative;
  }

  &__avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid #ede0d0;
    background: #fff;
    color: #1a1714;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.15s;

    &:hover { border-color: #c5a059; }
  }

  &__menu-pop {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    min-width: 240px;
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 14px;
    box-shadow: 0 12px 40px rgba(60, 40, 20, 0.12);
    overflow: hidden;
  }

  &__menu-head {
    padding: 16px 18px;
    border-bottom: 1px solid #f3eadc;
  }
  &__menu-name {
    font-size: 14px;
    font-weight: 600;
    color: #1a1714;
  }
  &__menu-email {
    font-size: 12px;
    color: #8a7a6e;
    margin-top: 2px;
  }
  &__menu-plan {
    margin-top: 8px;
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 999px;
    background: #faf3e3;
    color: #92400e;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__menu-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 11px 18px;
    border: 0;
    background: none;
    font-family: inherit;
    font-size: 14px;
    color: #2d2926;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s;

    &:hover { background: #faf7f2; }
  }

  &__menu-signout {
    border-top: 1px solid #f3eadc;
    color: #b91c1c;
  }

  &__main {
    max-width: 1320px;
    margin: 0 auto;
    padding: 32px 28px 80px;
  }
}

@media (max-width: 720px) {
  .appshell__top-inner { padding: 12px 16px; gap: 16px; }
  .appshell__nav { display: none; }
  .appshell__main { padding: 20px 16px 60px; }
}
</style>
