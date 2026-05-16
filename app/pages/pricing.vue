<template>
  <div class="pricing-page">
    <header class="pp-top">
      <div class="pp-top-inner">
        <NuxtLink to="/" class="pp-brand">Wall<span>Art</span>Room</NuxtLink>
        <nav class="pp-nav">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/pricing">Pricing</NuxtLink>
          <NuxtLink v-if="isAuthed" to="/metadata" class="pp-nav-cta">Dashboard</NuxtLink>
          <NuxtLink v-else to="/login" class="pp-nav-cta">Sign in</NuxtLink>
        </nav>
      </div>
    </header>

    <main class="pp-main">
      <section class="pp-hero">
        <span class="pp-eyebrow">Pricing</span>
        <h1>The Pinterest Revenue OS.<br>Simple pricing.</h1>
        <p>Not per-channel. Not per-seat. Three plans that grow with your Pinterest traffic. Cancel anytime.</p>
      </section>

      <!-- Toggle -->
      <div class="pp-toggle">
        <button :class="{ active: !annual }" @click="annual = false">Monthly</button>
        <button :class="{ active: annual }" @click="annual = true">
          Annual <span class="pp-toggle-save">Save 20%</span>
        </button>
      </div>

      <!-- Checkout error toast -->
      <div v-if="checkoutErr" class="pp-error">{{ checkoutErr }}</div>

      <!-- ─── Plans ─────────────────────────────────────────────────────── -->
      <section class="pp-grid">
        <article
          v-for="plan in plans"
          :key="plan.id"
          class="pp-card"
          :class="{ featured: plan.featured }"
        >
          <header class="pp-card-head">
            <span v-if="plan.featured" class="pp-badge">Most popular</span>
            <h2>{{ plan.name }}</h2>
            <p class="pp-card-sub">{{ plan.tagline }}</p>
          </header>

          <div class="pp-price">
            <span v-if="displayPrice(plan) > 0" class="pp-price-cur">€</span>
            <span class="pp-price-num">{{ displayPrice(plan) === 0 ? 'Free' : displayPrice(plan) }}</span>
            <span v-if="displayPrice(plan) > 0" class="pp-price-per">/mo</span>
          </div>
          <p v-if="annual && plan.price > 0" class="pp-billed">
            Billed €{{ Math.round(plan.price * 0.8 * 12) }} / year
          </p>

          <div class="pp-limits">
            <div v-for="l in plan.limits" :key="l" class="pp-limit">{{ l }}</div>
          </div>

          <ul class="pp-features">
            <li v-for="f in plan.features" :key="f">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4 10-10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ f }}
            </li>
          </ul>

          <button
            class="pp-cta"
            :class="{ primary: plan.featured }"
            :disabled="ctaDisabled(plan) || checkoutBusy === `plan-${plan.id}`"
            @click="onPlanCta(plan)"
          >
            {{ checkoutBusy === `plan-${plan.id}` ? 'Redirecting…' : ctaLabel(plan) }}
          </button>
        </article>
      </section>

      <!-- ─── Feature comparison ────────────────────────────────────────── -->
      <section class="pp-compare">
        <h2>Full feature comparison</h2>
        <div class="pp-compare-table">
          <div class="pp-compare-row pp-compare-row--header">
            <div class="pp-compare-cell">Feature</div>
            <div class="pp-compare-cell">Solo Traffic</div>
            <div class="pp-compare-cell">Growth Commerce</div>
            <div class="pp-compare-cell">Agency</div>
          </div>
          <div v-for="row in comparisonRows" :key="row.feature" class="pp-compare-row">
            <div class="pp-compare-cell pp-compare-cell--feature">{{ row.feature }}</div>
            <div class="pp-compare-cell">{{ row.solo }}</div>
            <div class="pp-compare-cell">{{ row.growth }}</div>
            <div class="pp-compare-cell">{{ row.agency }}</div>
          </div>
        </div>
      </section>

      <!-- ─── FAQ ───────────────────────────────────────────────────────── -->
      <section class="pp-faq">
        <h2>Frequently asked</h2>
        <div class="pp-faq-grid">
          <div v-for="q in faq" :key="q.q">
            <h3>{{ q.q }}</h3>
            <p>{{ q.a }}</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="pp-footer">
      <div class="pp-footer-inner">
        <div>WallArtRoom · The Pinterest Revenue OS</div>
        <div>© 2026 WallArtRoom · API-compliant, no risky scraping</div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

interface Plan {
  id: 'solo' | 'growth' | 'agency'
  name: string
  tagline: string
  price: number
  featured?: boolean
  limits: string[]
  features: string[]
}

const annual = ref(false)

function displayPrice(plan: Plan) {
  if (plan.price === 0) return 0
  return annual.value ? Math.round(plan.price * 0.8) : plan.price
}

const plans: Plan[] = [
  {
    id: 'solo',
    name: 'Solo Traffic',
    tagline: 'For bloggers, small shops, and side hustles.',
    price: 19,
    limits: ['1 Pinterest account', '1 domain / shop', '500 active pins / month'],
    features: [
      'CSV Studio with validation',
      'AI metadata generation',
      'Bulk scheduling & editing',
      'Link Health checks',
      'UTM preset library',
      'Export history & audit trail',
      '14-day free trial',
    ],
  },
  {
    id: 'growth',
    name: 'Growth Commerce',
    tagline: 'For growing shops and creator brands.',
    price: 49,
    featured: true,
    limits: ['3 Pinterest accounts', '3 domains / shops', '5,000 pins / month'],
    features: [
      'Board Intelligence (AI)',
      'Pinterest SEO Copilot',
      'Duplicate & Freshness Guard',
      'Seasonal content calendar',
      'Advanced analytics',
      'Everything in Solo Traffic',
      '14-day free trial',
    ],
  },
  {
    id: 'agency',
    name: 'Agency',
    tagline: 'For VAs, agencies, and multi-client teams.',
    price: 99,
    limits: ['10 Pinterest accounts', '10 client workspaces', 'Unlimited pins'],
    features: [
      'Approval workflows',
      'White-label CSV exports',
      'Client workspace isolation',
      'Role management',
      'API access',
      'Priority support',
      'Everything in Growth',
    ],
  },
]

const comparisonRows = [
  { feature: 'Pinterest accounts', solo: '1', growth: '3', agency: '10' },
  { feature: 'Pins / month', solo: '500', growth: '5,000', agency: 'Unlimited' },
  { feature: 'AI metadata generation', solo: '✓', growth: '✓', agency: '✓' },
  { feature: 'CSV Studio + validation', solo: '✓', growth: '✓', agency: '✓' },
  { feature: 'Link Health checks', solo: '✓', growth: '✓', agency: '✓' },
  { feature: 'UTM presets', solo: '✓', growth: '✓', agency: '✓' },
  { feature: 'Board Intelligence (AI)', solo: '—', growth: '✓', agency: '✓' },
  { feature: 'Pinterest SEO Copilot', solo: '—', growth: '✓', agency: '✓' },
  { feature: 'Duplicate & Freshness Guard', solo: '—', growth: '✓', agency: '✓' },
  { feature: 'Seasonal calendar', solo: '—', growth: '✓', agency: '✓' },
  { feature: 'Approval workflows', solo: '—', growth: '—', agency: '✓' },
  { feature: 'White-label exports', solo: '—', growth: '—', agency: '✓' },
  { feature: 'API access', solo: '—', growth: '—', agency: '✓' },
]

const faq = [
  { q: 'Is there a free trial?', a: 'Yes — 14 days, full access, no credit card required. You get the full Growth plan experience during trial.' },
  { q: 'What counts as an "active pin"?', a: 'Any pin in your workspace with a scheduled or published status. Drafts and archived pins don\'t count toward your limit.' },
  { q: 'Can I switch plans?', a: 'Anytime. Upgrading is instant. Downgrading takes effect at the end of your billing cycle. No penalties.' },
  { q: 'Do you store my Pinterest login?', a: 'No. We use Pinterest\'s official OAuth flow. We never see or store your password. API-compliant, no scraping.' },
  { q: 'What happens when my trial ends?', a: 'Your workspace stays intact. You just can\'t publish or export until you pick a plan. No surprise charges.' },
  { q: 'Is there an annual discount?', a: 'Yes — save 20% with annual billing. That\'s €15/mo for Solo, €39/mo for Growth, €79/mo for Agency.' },
]

const supabaseUser = useSupabaseUser()
const isAuthed = computed(() => !!supabaseUser.value)

const checkoutBusy = ref<string | null>(null)
const checkoutErr = ref<string | null>(null)

function ctaLabel(plan: Plan) {
  if (!isAuthed.value) return 'Start 14-day free trial'
  return `Subscribe — €${displayPrice(plan)}/mo`
}

function ctaDisabled(plan: Plan) {
  return false
}

async function onPlanCta(plan: Plan) {
  if (!isAuthed.value) {
    return navigateTo(`/signup?next=${encodeURIComponent('/pricing')}`)
  }
  await goToCheckout(`plan-${plan.id}`, { kind: 'subscription', plan: plan.id, annual: annual.value })
}

async function goToCheckout(key: string, body: Record<string, unknown>) {
  checkoutBusy.value = key
  checkoutErr.value = null
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/create-checkout-session', {
      method: 'POST',
      body,
    })
    window.location.href = url
  } catch (e: any) {
    checkoutErr.value = e?.statusMessage || e?.data?.statusMessage || e?.message || 'Could not start checkout'
    checkoutBusy.value = null
  }
}
</script>

<style scoped lang="scss">
.pricing-page {
  min-height: 100vh;
  background: #faf7f2;
  color: #2d2926;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}

.pp-top {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #ede0d0;
}
.pp-top-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 14px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.pp-brand {
  font-weight: 800;
  font-size: 18px;
  letter-spacing: -0.04em;
  color: #1a1714;
  text-decoration: none;
  span { color: #c5a059; }
}
.pp-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  a {
    font-size: 14px;
    color: #6b5e52;
    text-decoration: none;
    &:hover { color: #1a1714; }
  }
  &-cta {
    padding: 8px 16px;
    background: #1a1714;
    color: #fff !important;
    border-radius: 999px;
    font-weight: 600;
  }
}

.pp-main {
  flex: 1;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 60px 28px 80px;
}

.pp-hero {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    margin: 8px 0 16px;
    font-size: clamp(32px, 5vw, 48px);
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }
  p {
    max-width: 560px;
    margin: 0 auto;
    color: #6b5e52;
    font-size: 17px;
    line-height: 1.5;
  }
}

.pp-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: #c5a059;
}

.pp-toggle {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 40px;
  padding: 4px;
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 12px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;

  button {
    padding: 10px 20px;
    border: none;
    background: transparent;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #6b5e52;
    border-radius: 9px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &.active {
      background: #1a1714;
      color: #fff;
    }
  }

  &-save {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    background: #22c55e;
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 6px;
    vertical-align: middle;
  }
}

.pp-error {
  max-width: 720px;
  margin: 0 auto 24px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 12px;
  font-size: 14px;
  text-align: center;
}

.pp-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  margin: 0 auto 80px;
}

.pp-card {
  position: relative;
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 18px;
  padding: 32px 28px 28px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s, transform 0.15s;

  &:hover { border-color: #c5a059; transform: translateY(-2px); }

  &.featured {
    border-color: #1a1714;
    box-shadow: 0 12px 40px rgba(60, 40, 20, 0.10);
  }
}

.pp-badge {
  position: absolute;
  top: -11px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  background: #1a1714;
  color: #fff;
  padding: 5px 12px;
  border-radius: 999px;
}

.pp-card-head {
  margin-bottom: 16px;
  h2 { margin: 0; font-size: 22px; font-weight: 700; color: #1a1714; letter-spacing: -0.02em; }
}
.pp-card-sub { margin: 4px 0 0; font-size: 13px; color: #8a7a6e; }

.pp-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
  &-cur { font-size: 20px; font-weight: 600; color: #6b5e52; }
  &-num { font-size: 44px; font-weight: 700; color: #1a1714; letter-spacing: -0.04em; line-height: 1; }
  &-per { font-size: 14px; color: #6b5e52; margin-left: 4px; }
}

.pp-billed {
  margin: 0 0 12px;
  font-size: 12px;
  color: #8a7a6e;
}

.pp-limits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3eadc;
}

.pp-limit {
  font-size: 11px;
  font-weight: 600;
  color: #1a1714;
  padding: 4px 10px;
  background: #faf3e3;
  border-radius: 999px;
}

.pp-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    color: #2d2926;
    line-height: 1.5;
    svg { flex-shrink: 0; margin-top: 4px; color: #c5a059; }
  }
}

.pp-cta {
  width: 100%;
  padding: 14px 18px;
  border: 1px solid #1a1714;
  background: #fff;
  color: #1a1714;
  border-radius: 12px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, opacity 0.15s;

  &:hover:not(:disabled) { background: #1a1714; color: #fff; }
  &.primary { background: #1a1714; color: #fff; }
  &.primary:hover:not(:disabled) { background: #2d2926; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// ── Feature comparison
.pp-compare {
  margin-bottom: 70px;

  h2 {
    text-align: center;
    margin: 0 0 30px;
    font-size: 28px;
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.02em;
  }
}

.pp-compare-table {
  border: 1px solid #ede0d0;
  border-radius: 14px;
  overflow: hidden;
}

.pp-compare-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  &:not(:last-child) { border-bottom: 1px solid #f3eadc; }

  &--header {
    background: #1a1714;
    .pp-compare-cell { color: #fff; font-weight: 700; font-size: 12px; letter-spacing: 0.02em; }
  }
}

.pp-compare-cell {
  padding: 13px 16px;
  font-size: 13px;
  color: #2d2926;
  &--feature { font-weight: 600; color: #1a1714; }
}

// ── FAQ
.pp-faq {
  h2 {
    text-align: center;
    margin: 0 0 30px;
    font-size: 28px;
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.02em;
  }
}

.pp-faq-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  h3 { margin: 0 0 6px; font-size: 15px; font-weight: 600; color: #1a1714; }
  p { margin: 0; color: #6b5e52; font-size: 13px; line-height: 1.55; }
}

.pp-footer {
  border-top: 1px solid #ede0d0;
  background: #fff;
  padding: 24px 0;
}
.pp-footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 28px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #8a7a6e;
}

@media (max-width: 860px) {
  .pp-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; }
  .pp-compare-row { grid-template-columns: 1fr; }
  .pp-compare-row--header { display: none; }
  .pp-compare-cell--feature { font-weight: 700; background: #faf7f2; }
  .pp-faq-grid { grid-template-columns: 1fr; }
  .pp-footer-inner { flex-direction: column; gap: 6px; }
}
</style>
