<template>
  <section class="dash">
    <!-- Welcome / status block ─────────────────────────────────────────────── -->
    <div class="dash__hero">
      <div class="dash__hero-copy">
        <span class="dash__eyebrow">Dashboard</span>
        <h1 class="dash__title">
          {{ greeting }}<span v-if="firstName">, {{ firstName }}</span>
        </h1>
        <p class="dash__sub">See what fits your room — before you buy or hang it.</p>
      </div>

      <div class="dash__hero-cards">
        <div class="dash__stat">
          <span class="dash__stat-label">Plan</span>
          <strong class="dash__stat-num">{{ planLabel }}</strong>
          <NuxtLink to="/pricing" class="dash__stat-link">{{ me?.plan === 'free' ? 'Upgrade' : 'Manage' }}</NuxtLink>
        </div>
        <div class="dash__stat" :class="{ low: lowCredits }">
          <span class="dash__stat-label">Credits</span>
          <strong class="dash__stat-num">{{ me?.wallet.available ?? '·' }}</strong>
          <span class="dash__stat-sub" v-if="me">
            <template v-if="me.wallet.monthlyCreditsTotal > 0">
              {{ me.wallet.monthlyCreditsRemaining }} / {{ me.wallet.monthlyCreditsTotal }} monthly · {{ me.wallet.purchasedCreditsRemaining }} packs
            </template>
            <template v-else>
              {{ me.wallet.purchasedCreditsRemaining }} from purchases
            </template>
          </span>
        </div>
      </div>
    </div>

    <!-- Quick actions ──────────────────────────────────────────────────────── -->
    <div class="dash__actions">
      <NuxtLink to="/app/new" class="dash-action dash-action--primary">
        <span class="dash-action__title">New visualization</span>
        <span class="dash-action__sub">Upload a room and place artwork</span>
      </NuxtLink>
      <NuxtLink to="/gallery" class="dash-action">
        <span class="dash-action__title">Explore gallery</span>
        <span class="dash-action__sub">Browse curated artwork</span>
      </NuxtLink>
      <NuxtLink to="/pricing" class="dash-action">
        <span class="dash-action__title">{{ me?.plan === 'free' ? 'Upgrade plan' : 'Buy more credits' }}</span>
        <span class="dash-action__sub">Get more renders &amp; HD exports</span>
      </NuxtLink>
    </div>

    <!-- Low-credit warning ─────────────────────────────────────────────────── -->
    <div v-if="lowCredits && me" class="dash__warn">
      You only have <strong>{{ me.wallet.available }} credits</strong> left.
      <NuxtLink to="/pricing">Upgrade or buy more credits →</NuxtLink>
    </div>

    <!-- Projects ───────────────────────────────────────────────────────────── -->
    <section class="dash__projects">
      <header class="dash__projects-head">
        <h2>Recent projects</h2>
        <NuxtLink v-if="hasProjects" to="/app/new" class="dash__projects-cta">+ New</NuxtLink>
      </header>

      <div v-if="pending && !me" class="dash__loading">Loading…</div>

      <div v-else-if="!hasProjects" class="dash__empty">
        <div class="dash__empty-art" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <path d="M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h3>Start by uploading a photo of your room</h3>
        <p>Then place an artwork on the wall and let the AI tell you if it fits.</p>
        <NuxtLink to="/app/new" class="dash__empty-cta">Upload your first room →</NuxtLink>
      </div>

      <div v-else class="dash__grid">
        <NuxtLink v-for="p in me.projects" :key="p.id"
                  :to="`/app/editor/${p.id}`"
                  class="proj">
          <div class="proj__thumb" :style="thumbStyle(p)">
            <span v-if="p.bestScore != null" class="proj__score">{{ p.bestScore }}/100</span>
          </div>
          <div class="proj__body">
            <h3 class="proj__title">{{ p.title }}</h3>
            <span class="proj__date">{{ formatDate(p.updatedAt) }}</span>
          </div>
          <div class="proj__actions">
            <span>Open →</span>
            <button class="proj__del" type="button"
                    aria-label="Delete project"
                    @click.prevent.stop="deleteProject(p.id)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M8 6V4h8v2M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </NuxtLink>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })

const { data: me, pending, refresh } = useMe()

async function deleteProject(id: string) {
  if (!confirm('Delete this project? Its visualizations will be removed too.')) return
  try {
    await $fetch(`/api/projects/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    alert(e?.statusMessage || e?.message || 'Could not delete project')
  }
}

const firstName = computed(() => {
  const n = me.value?.name
  if (!n) return ''
  return n.split(/\s+/)[0]
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 5)  return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
})

const planLabel = computed(() => {
  const p = me.value?.plan
  if (!p) return '·'
  return ({ free: 'Free', pro: 'Pro' } as Record<string, string>)[p] ?? p
})

const lowCredits   = computed(() => !!me.value && me.value.wallet.available < 5)
const hasProjects  = computed(() => !!me.value?.projects?.length)

function thumbStyle(p: { roomImageUrl: string | null }) {
  return p.roomImageUrl
    ? { backgroundImage: `url(${p.roomImageUrl})` }
    : { background: 'linear-gradient(135deg, #ede0d0 0%, #d8cab1 100%)' }
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped lang="scss">
.dash {
  display: flex;
  flex-direction: column;
  gap: 36px;

  &__eyebrow {
    display: inline-block;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #c5a059;
    margin-bottom: 8px;
  }

  &__hero {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 36px;
    align-items: end;
  }

  &__hero-copy { max-width: 640px; }

  &__title {
    margin: 0;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }

  &__sub {
    margin: 12px 0 0;
    color: #6b5e52;
    font-size: 16px;
  }

  &__hero-cards {
    display: flex;
    gap: 14px;
  }

  &__stat {
    min-width: 180px;
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 16px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    &.low { border-color: #d97706; background: #fff7ed; }

    &-label {
      font-size: 12px;
      font-weight: 500;
      color: #8a7a6e;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    &-num {
      font-size: 28px;
      font-weight: 700;
      color: #1a1714;
      letter-spacing: -0.02em;
      line-height: 1;
    }
    &-sub  { font-size: 12px; color: #8a7a6e; }
    &-link {
      font-size: 12px;
      font-weight: 600;
      color: #c5a059;
      text-decoration: none;
      &:hover { color: #1a1714; }
    }
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  &__warn {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #92400e;
    padding: 14px 18px;
    border-radius: 12px;
    font-size: 14px;
    a {
      color: #92400e;
      font-weight: 600;
      margin-left: 8px;
      &:hover { text-decoration: underline; }
    }
  }

  &__projects-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 16px;
    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #1a1714;
    }
  }
  &__projects-cta {
    font-size: 14px;
    font-weight: 600;
    color: #c5a059;
    text-decoration: none;
    &:hover { color: #1a1714; }
  }

  &__loading { color: #8a7a6e; padding: 30px 0; }

  &__empty {
    background: #fff;
    border: 1px dashed #d8cab1;
    border-radius: 18px;
    padding: 56px 32px;
    text-align: center;
    color: #6b5e52;

    &-art {
      width: 92px;
      height: 92px;
      margin: 0 auto 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: #faf3e3;
      color: #c5a059;
    }
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1a1714;
    }
    p {
      margin: 8px 0 22px;
      font-size: 14px;
    }
    &-cta {
      display: inline-block;
      padding: 12px 22px;
      background: #1a1714;
      color: #fff;
      border-radius: 999px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: background 0.15s;
      &:hover { background: #2d2926; }
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 18px;
  }
}

.dash-action {
  position: relative;
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 16px;
  padding: 22px 24px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.15s, transform 0.15s;

  &:hover { border-color: #c5a059; transform: translateY(-2px); }

  &--primary {
    background: #1a1714;
    border-color: #1a1714;
    color: #fff;
    .dash-action__sub { color: rgba(255, 255, 255, 0.65); }
    &:hover { background: #2d2926; }
  }

  &__title { font-weight: 600; font-size: 16px; color: inherit; }
  &__sub   { font-size: 13px; color: #8a7a6e; }
}

.proj {
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: #c5a059;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(60, 40, 20, 0.06);
  }

  &__del {
    background: none;
    border: 0;
    padding: 6px;
    border-radius: 6px;
    color: #8a7a6e;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    &:hover { background: #fef2f2; color: #b91c1c; }
  }

  &__thumb {
    aspect-ratio: 4 / 3;
    background-size: cover;
    background-position: center;
    position: relative;
  }

  &__score {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(26, 23, 20, 0.78);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
    backdrop-filter: blur(6px);
  }

  &__body {
    padding: 14px 16px 4px;
  }
  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #1a1714;
  }
  &__date {
    font-size: 12px;
    color: #8a7a6e;
  }

  &__actions {
    padding: 8px 16px 14px;
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    > span {
      font-size: 13px;
      font-weight: 600;
      color: #c5a059;
    }
  }
}

@media (max-width: 900px) {
  .dash__hero { grid-template-columns: 1fr; }
  .dash__actions { grid-template-columns: 1fr; }
}
</style>
