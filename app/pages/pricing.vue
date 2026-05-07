<template>
  <div class="pricing-page">
    <header class="pp-top">
      <div class="pp-top-inner">
        <NuxtLink to="/" class="pp-brand">Wall<span>Art</span>Room</NuxtLink>
        <nav class="pp-nav">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/gallery">Gallery</NuxtLink>
          <NuxtLink to="/pricing">Pricing</NuxtLink>
          <NuxtLink v-if="isAuthed" to="/app/dashboard" class="pp-nav-cta">Dashboard</NuxtLink>
          <NuxtLink v-else to="/login" class="pp-nav-cta">Sign in</NuxtLink>
        </nav>
      </div>
    </header>

    <main class="pp-main">
      <section class="pp-hero">
        <span class="pp-eyebrow">Pricing</span>
        <h1>Plans that scale with your wall</h1>
        <p>Pay monthly for steady output. Top up with credit packs when a project demands it. No hidden fees.</p>

        <div class="pp-toggle">
          <button :class="{ active: billing === 'monthly' }" @click="billing = 'monthly'">Monthly</button>
          <button :class="{ active: billing === 'yearly' }" @click="billing = 'yearly'" disabled title="Coming soon">
            Yearly <span class="pp-save">−20%</span>
          </button>
        </div>
      </section>

      <!-- ─── Subscription plans ──────────────────────────────────────────── -->
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
            <span v-if="plan.price > 0" class="pp-price-cur">€</span>
            <span class="pp-price-num">{{ plan.price }}</span>
            <span v-if="plan.price > 0" class="pp-price-per">/mo</span>
          </div>

          <div class="pp-credits">
            <strong>{{ plan.credits }}</strong>
            <span>{{ plan.credits === 0 ? 'one-time signup credits' : 'credits / month' }}</span>
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
            :disabled="ctaDisabled(plan)"
            @click="onPlanCta(plan)"
          >
            {{ ctaLabel(plan) }}
          </button>
        </article>
      </section>

      <!-- ─── Credit packs ────────────────────────────────────────────────── -->
      <section class="pp-packs">
        <header class="pp-packs-head">
          <h2>Need a top-up?</h2>
          <p>Buy credit packs anytime. Purchased credits never expire while your account is active.</p>
        </header>
        <div class="pp-packs-grid">
          <article v-for="pack in creditPacks" :key="pack.id" class="pp-pack">
            <div class="pp-pack-credits">{{ pack.credits }}</div>
            <div class="pp-pack-label">credits</div>
            <div class="pp-pack-price">€{{ pack.price }}</div>
            <div class="pp-pack-meta">€{{ (pack.price / pack.credits).toFixed(2) }} / credit</div>
            <button class="pp-pack-cta" @click="onPackCta(pack)">Buy pack</button>
          </article>
        </div>
      </section>

      <!-- ─── FAQ-ish strip ──────────────────────────────────────────────── -->
      <section class="pp-faq">
        <div>
          <h3>How does a credit work?</h3>
          <p>1 credit = 1 standard preview. Realistic renders cost 2, HD exports cost 3. Failed generations are never charged.</p>
        </div>
        <div>
          <h3>What happens to unused credits?</h3>
          <p>Monthly credits reset each billing cycle. Purchased credits don't expire while your account is active.</p>
        </div>
        <div>
          <h3>Can I cancel anytime?</h3>
          <p>Yes. You keep access until the end of your billing period, then drop to the Free tier automatically.</p>
        </div>
      </section>
    </main>

    <footer class="pp-footer">
      <div class="pp-footer-inner">
        <div>WallArtRoom · See what fits your room before you buy or hang it.</div>
        <div>© 2026 WallArtRoom</div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

interface Plan {
  id:       'free' | 'starter' | 'plus' | 'studio'
  name:     string
  tagline:  string
  price:    number
  credits:  number
  featured?: boolean
  features: string[]
}

interface CreditPack {
  id:      string
  credits: number
  price:   number
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try it on one wall.',
    price: 0,
    credits: 5,
    features: [
      '5 one-time signup credits',
      'Up to 3 projects',
      'Watermarked low-res preview',
      'Basic AI tips',
      'Gallery access',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For one home, casual use.',
    price: 9,
    credits: 50,
    features: [
      '50 credits / month',
      'Up to 20 projects',
      'No watermark',
      'Standard visualizations',
      'Gallery color filters',
      'Basic Style Match Scores',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'For frequent re-styling.',
    price: 19,
    credits: 150,
    featured: true,
    features: [
      '150 credits / month',
      'Unlimited projects',
      'HD exports, no watermark',
      'AI Style Reports (PDF)',
      'Smarter recommendations',
      'Before / after exports',
      'Saved variants',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'For designers and shops.',
    price: 49,
    credits: 500,
    features: [
      '500 credits / month',
      'Everything in Plus',
      'Commercial usage rights',
      'Client share links',
      'PDF style reports',
      'Own gallery uploads',
      'Remove WallArtRoom branding',
      'Priority generations',
    ],
  },
]

const creditPacks: CreditPack[] = [
  { id: 'pack_25',  credits: 25,  price: 5  },
  { id: 'pack_100', credits: 100, price: 15 },
  { id: 'pack_300', credits: 300, price: 39 },
]

const billing = ref<'monthly' | 'yearly'>('monthly')
const supabaseUser = useSupabaseUser()
const isAuthed = computed(() => !!supabaseUser.value)

const { data: me } = useMe()
const isCurrentPlan = (planId: Plan['id']) => me.value?.plan === planId

function ctaLabel(plan: Plan) {
  if (plan.id === 'free') return isAuthed.value ? 'Current plan' : 'Get started — free'
  if (isCurrentPlan(plan.id)) return 'Current plan'
  return `Choose ${plan.name}`
}

function ctaDisabled(plan: Plan) {
  if (plan.id === 'free' && isAuthed.value) return true
  return isCurrentPlan(plan.id)
}

async function onPlanCta(plan: Plan) {
  if (!isAuthed.value) {
    return navigateTo(`/signup?next=${encodeURIComponent('/pricing')}`)
  }
  if (plan.id === 'free' || isCurrentPlan(plan.id)) return
  // Stripe Checkout wiring lands in Phase 3.
  alert(`Stripe Checkout for "${plan.name}" lands in Phase 3 (billing).`)
}

async function onPackCta(pack: CreditPack) {
  if (!isAuthed.value) {
    return navigateTo(`/signup?next=${encodeURIComponent('/pricing')}`)
  }
  alert(`Stripe Checkout for ${pack.credits}-credit pack lands in Phase 3 (billing).`)
}
</script>

<style scoped lang="scss">
.pricing-page {
  min-height: 100vh;
  background: #faf7f2;
  color: #2d2926;
  display: flex;
  flex-direction: column;
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
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 60px 28px 80px;
}

.pp-hero {
  text-align: center;
  margin-bottom: 50px;

  h1 {
    margin: 8px 0 16px;
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.03em;
    line-height: 1.05;
  }
  p {
    max-width: 580px;
    margin: 0 auto 30px;
    color: #6b5e52;
    font-size: 17px;
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
  display: inline-flex;
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 999px;
  padding: 4px;

  button {
    padding: 8px 22px;
    border: 0;
    background: none;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #6b5e52;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &.active { background: #1a1714; color: #fff; }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }
}

.pp-save {
  background: #faf3e3;
  color: #92400e;
  font-size: 11px;
  padding: 2px 7px;
  border-radius: 999px;
  margin-left: 6px;
}

.pp-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 80px;
}

.pp-card {
  position: relative;
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 18px;
  padding: 28px 24px 26px;
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
  margin-bottom: 18px;

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.02em;
  }
}
.pp-card-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #8a7a6e;
}

.pp-price {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;

  &-cur { font-size: 22px; font-weight: 600; color: #6b5e52; }
  &-num { font-size: 44px; font-weight: 700; color: #1a1714; letter-spacing: -0.04em; line-height: 1; }
  &-per { font-size: 14px; color: #6b5e52; margin-left: 4px; }
}

.pp-credits {
  font-size: 13px;
  color: #6b5e52;
  margin-bottom: 22px;
  padding-bottom: 22px;
  border-bottom: 1px solid #f3eadc;
  strong {
    color: #1a1714;
    font-weight: 700;
    font-size: 15px;
    margin-right: 6px;
  }
}

.pp-features {
  list-style: none;
  padding: 0;
  margin: 0 0 26px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: #2d2926;
    line-height: 1.45;

    svg { flex-shrink: 0; margin-top: 3px; color: #c5a059; }
  }
}

.pp-cta {
  width: 100%;
  padding: 12px 18px;
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

.pp-packs {
  margin-bottom: 70px;
}
.pp-packs-head {
  text-align: center;
  margin-bottom: 28px;

  h2 {
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.02em;
  }
  p {
    margin: 0;
    color: #6b5e52;
    font-size: 15px;
  }
}
.pp-packs-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 880px;
  margin: 0 auto;
}
.pp-pack {
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 16px;
  padding: 26px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;

  &-credits {
    font-size: 38px;
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.03em;
    line-height: 1;
  }
  &-label {
    font-size: 12px;
    font-weight: 500;
    color: #8a7a6e;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    margin-bottom: 14px;
  }
  &-price {
    font-size: 22px;
    font-weight: 600;
    color: #c5a059;
  }
  &-meta {
    font-size: 12px;
    color: #8a7a6e;
    margin-bottom: 16px;
  }
  &-cta {
    width: 100%;
    padding: 10px 16px;
    border: 1px solid #ede0d0;
    background: #faf7f2;
    color: #1a1714;
    border-radius: 10px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: #1a1714; color: #fff; border-color: #1a1714; }
  }
}

.pp-faq {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 36px 0 0;
  border-top: 1px solid #ede0d0;

  h3 {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 600;
    color: #1a1714;
  }
  p {
    margin: 0;
    color: #6b5e52;
    font-size: 13px;
    line-height: 1.55;
  }
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

@media (max-width: 1080px) {
  .pp-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 720px) {
  .pp-grid, .pp-packs-grid, .pp-faq { grid-template-columns: 1fr; }
  .pp-footer-inner { flex-direction: column; gap: 6px; }
}
</style>
