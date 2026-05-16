<template>
  <div class="lp" id="top">

    <!-- ── Cursor follower (hidden on touch/coarse pointer) ────────────────── -->
    <div ref="cursorRef" class="cursor" aria-hidden="true">
      <div class="cursor__inner" />
    </div>


    <!-- ── Nav ─────────────────────────────────────────────────────────────── -->
    <header class="nav">
      <div class="nav__inner">
        <a class="nav__brand" href="#top">Wall<span>Art</span>Room</a>
        <nav class="nav__links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing-section">Pricing</a>
          <a href="#waitlist" class="nav__cta">Start free trial</a>
        </nav>
      </div>
    </header>

    <main>

      <!-- ══ HERO ═════════════════════════════════════════════════════════════ -->
      <section class="hero">
        <div class="hero__orb hero__orb--1" aria-hidden="true" />
        <div class="hero__orb hero__orb--2" aria-hidden="true" />
        <div class="hero__grain" aria-hidden="true" />

        <div class="hero__inner">

          <div class="hero__copy">
            <span class="hero__eyebrow hero-enter">
              <span class="hero__eyebrow-dot" />
              Not another scheduler. A Pinterest Revenue OS.
            </span>

            <h1 class="hero__title hero-enter">
              Turn Pinterest into<br>
              <em>your traffic machine.</em>
            </h1>

            <p class="hero__lead hero-enter">
              <strong>WallArtRoom</strong> doesn't just schedule pins. It tells you which board
              to pick, checks your SEO score, validates every link, guards against duplicates,
              and exports a Pinterest-ready CSV — all in one workspace built for revenue, not vanity metrics.
            </p>

            <form
              class="hero__form hero-enter"
              @submit.prevent="handleSubmit"
            >
              <input
                v-model="honeypot"
                type="text"
                name="company"
                autocomplete="off"
                tabindex="-1"
                aria-hidden="true"
                class="hp-field"
              />
              <div class="hero__form-row">
                <input
                  v-model="email"
                  type="email"
                  required
                  placeholder="you@studio.com"
                  class="hero__input"
                  :disabled="submitting || submitted"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  class="hero__btn"
                  :disabled="submitting || submitted || !email"
                >
                  <template v-if="submitted && alreadyJoined">Already in ✓</template>
                  <template v-else-if="submitted">You're in ✓</template>
                  <template v-else-if="submitting">Saving…</template>
                  <template v-else>
                    Start 14-day free trial
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 7h8m-3-3l3 3-3 3" />
                    </svg>
                  </template>
                </button>
              </div>
              <p class="hero__form-note" :class="{ 'hero__form-note--err': formError }">
                <template v-if="formError">{{ formError }}</template>
                <template v-else-if="submitted && alreadyJoined">Welcome back — we'll let you know.</template>
                <template v-else-if="submitted">We'll send one email when we open the doors.</template>
                <template v-else>No credit card required. Full access for 14 days.</template>
              </p>
            </form>

            <div class="hero__feat-cards hero-enter">
              <div class="hero__feat-card">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121"/>
                </svg>
                <span>Board Intelligence</span>
              </div>
              <div class="hero__feat-card">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>Pinterest SEO Copilot</span>
              </div>
              <div class="hero__feat-card">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <span>Link Health & UTM</span>
              </div>
            </div>
          </div>

          <div class="hero__preview hero-enter">
            <img
              :src="heroImg"
              alt="WallArtRoom Pinterest workspace with board intelligence and SEO scores"
              class="hero__img"
              loading="eager"
              decoding="async"
              draggable="false"
            />
          </div>

        </div>
      </section>


      <!-- ══ DIFFERENTIATOR STRIP ════════════════════════════════════════════ -->
      <section class="diff">
        <div class="container">
          <div class="diff__inner">
            <div class="diff__item" v-for="d in differentiators" :key="d.label">
              <span class="diff__number">{{ d.number }}</span>
              <span class="diff__label">{{ d.label }}</span>
            </div>
          </div>
        </div>
      </section>


      <!-- ══ PROBLEM ══════════════════════════════════════════════════════════ -->
      <section class="problem">
        <div class="container">
          <div class="problem__head">
            <span class="kicker">The problem</span>
            <h2>Generic schedulers treat Pinterest like an afterthought.</h2>
            <p>Buffer, Hootsuite, and Later are built for Twitter-era cross-posting. Pinterest needs board strategy, keyword depth, and link trust — not another queue.</p>
          </div>

          <div class="problem__grid">
            <div
              v-for="p in painPoints"
              :key="p.title"
              class="pain"
            >
              <div class="pain__icon" v-html="p.icon" />
              <h3>{{ p.title }}</h3>
              <p>{{ p.body }}</p>
            </div>
          </div>
        </div>
      </section>


      <!-- ══ VS SECTION ══════════════════════════════════════════════════════ -->
      <section class="versus">
        <div class="container">
          <div class="versus__head">
            <span class="kicker">Why switch</span>
            <h2>What they don't do. <em>What we do.</em></h2>
          </div>

          <div class="versus__table">
            <div class="versus__row versus__row--header">
              <div class="versus__cell">Feature</div>
              <div class="versus__cell">Generic schedulers</div>
              <div class="versus__cell versus__cell--us">WallArtRoom</div>
            </div>
            <div class="versus__row" v-for="v in vsRows" :key="v.feature">
              <div class="versus__cell versus__cell--feature">{{ v.feature }}</div>
              <div class="versus__cell versus__cell--them">{{ v.them }}</div>
              <div class="versus__cell versus__cell--us">{{ v.us }}</div>
            </div>
          </div>
        </div>
      </section>


      <!-- ══ FEATURES ════════════════════════════════════════════════════════ -->
      <section class="features" id="features">
        <div class="container">
          <div class="features__head">
            <span class="kicker">The Pinterest Revenue OS</span>
            <h2>Six layers that turn pins into <em>revenue.</em></h2>
            <p>Not just posting — from upload to ROI, every step is Pinterest-first.</p>
          </div>

          <div class="features__list">
            <div
              v-for="(f, i) in featureList"
              :key="f.title"
              class="feature"
              :class="{ 'feature--reverse': i % 2 === 1 }"
            >
              <div class="feature__copy">
                <span class="feature__num">0{{ i + 1 }}</span>
                <h3>{{ f.title }}</h3>
                <p>{{ f.body }}</p>
                <ul class="feature__bullets">
                  <li v-for="b in f.bullets" :key="b">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 7l3.5 3.5L12 4" />
                    </svg>
                    {{ b }}
                  </li>
                </ul>
              </div>

              <div class="feature__visual">
                <component :is="f.visual" />
              </div>
            </div>
          </div>
        </div>
      </section>


      <!-- ══ HOW IT WORKS ═════════════════════════════════════════════════════ -->
      <section class="how" id="how">
        <div class="container">
          <div class="how__head">
            <span class="kicker">The flow</span>
            <h2>From upload to tracked revenue in four steps.</h2>
          </div>

          <div class="how__steps">
            <div class="how__line" aria-hidden="true" />
            <div
              v-for="(s, idx) in steps"
              :key="s.title"
              class="step"
            >
              <div class="step__num">{{ idx + 1 }}</div>
              <h3>{{ s.title }}</h3>
              <p>{{ s.body }}</p>
            </div>
          </div>
        </div>
      </section>


      <!-- ══ PROOF / SOCIAL PROOF ════════════════════════════════════════════ -->
      <section class="proof">
        <div class="container proof__grid">

          <div class="proof__visual">
            <img
              :src="exampleStatsImg"
              alt="Pinterest analytics from a real creator account showing impressions, saves, and outbound clicks"
              class="proof__img"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
            <a
              class="proof__credit"
              href="https://de.pinterest.com/DigiDesignArt/"
              target="_blank"
              rel="noopener"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6" />
                <path d="M10 2H7M10 2v3M10 2L5 7" />
              </svg>
              View live account
            </a>
          </div>

          <div class="proof__copy">
            <span class="kicker">Real results</span>
            <h2>Built by a creator who <em>does this daily.</em></h2>
            <p class="proof__lead">
              This is a real Pinterest account run by one person using the exact workflow
              WallArtRoom is built around. No team. No agency. Just smart tooling.
            </p>

            <ul class="proof__points">
              <li>
                <span class="proof__bullet-icon">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                </span>
                <div>
                  <strong>Pinterest-first, not an afterthought.</strong>
                  Every feature exists because Pinterest-specific problems demanded it.
                </div>
              </li>
              <li>
                <span class="proof__bullet-icon">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                </span>
                <div>
                  <strong>API-compliant, no risky scraping.</strong>
                  We follow Pinterest's official API guidelines. Your account stays safe.
                </div>
              </li>
              <li>
                <span class="proof__bullet-icon">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                </span>
                <div>
                  <strong>Revenue-focused, not vanity-focused.</strong>
                  Track which pins drive clicks, which boards convert, and which links earn.
                </div>
              </li>
            </ul>
          </div>

        </div>
      </section>


      <!-- ══ PRICING ═════════════════════════════════════════════════════════ -->
      <section class="pricing" id="pricing-section">
        <div class="container">
          <div class="pricing__head">
            <span class="kicker">Pricing</span>
            <h2>Simple plans. Real Pinterest value.</h2>
            <p>No per-channel tricks. No surprise limits. Cancel anytime.</p>
          </div>

          <div class="pricing__grid">
            <div
              v-for="plan in pricingPlans"
              :key="plan.name"
              class="pricing__card"
              :class="{ 'pricing__card--featured': plan.featured }"
            >
              <span v-if="plan.featured" class="pricing__badge">Most popular</span>
              <h3 class="pricing__plan-name">{{ plan.name }}</h3>
              <p class="pricing__plan-for">{{ plan.audience }}</p>
              <div class="pricing__price">
                <span class="pricing__price-amount">{{ plan.price === 0 ? 'Free' : `€${plan.price}` }}</span>
                <span v-if="plan.price > 0" class="pricing__price-per">/mo</span>
              </div>
              <ul class="pricing__features">
                <li v-for="f in plan.features" :key="f">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                  {{ f }}
                </li>
              </ul>
              <a href="#waitlist" class="pricing__cta" :class="{ 'pricing__cta--primary': plan.featured }">
                {{ plan.price === 0 ? 'Start free' : 'Start 14-day trial' }}
              </a>
            </div>
          </div>
        </div>
      </section>


      <!-- ══ USE CASES ════════════════════════════════════════════════════════ -->
      <section class="usecases">
        <div class="container">
          <div class="usecases__head">
            <span class="kicker">Built for</span>
            <h2>Whether you pin 10 or 10,000 a month.</h2>
          </div>

          <div class="usecases__grid">
            <div v-for="uc in useCases" :key="uc.title" class="usecase">
              <div class="usecase__icon" v-html="uc.icon" />
              <h3>{{ uc.title }}</h3>
              <p>{{ uc.body }}</p>
            </div>
          </div>
        </div>
      </section>


      <!-- ══ FINAL CTA ════════════════════════════════════════════════════════ -->
      <section class="cta" id="waitlist">
        <div class="container">
          <div class="cta__inner">
            <span class="kicker kicker--light">Get started</span>
            <h2>Stop scheduling. Start <em>earning.</em></h2>
            <p>14 days free, no credit card. See why creators are switching from generic schedulers to a Pinterest Revenue OS.</p>

            <form class="cta__form" @submit.prevent="handleSubmit">
              <input
                v-model="honeypot"
                type="text"
                name="company"
                autocomplete="off"
                tabindex="-1"
                aria-hidden="true"
                class="hp-field"
              />
              <input
                v-model="email"
                type="email"
                required
                placeholder="you@studio.com"
                class="cta__input"
                :disabled="submitting || submitted"
                aria-label="Email address"
              />
              <button type="submit" class="cta__btn" :disabled="submitting || submitted || !email">
                <template v-if="submitted && alreadyJoined">Already in ✓</template>
                <template v-else-if="submitted">You're in ✓</template>
                <template v-else-if="submitting">Saving…</template>
                <template v-else>Start free trial</template>
              </button>
            </form>
            <p class="cta__note" :class="{ 'cta__note--err': formError }">
              <template v-if="formError">{{ formError }}</template>
              <template v-else>No credit card. No spam. Full access for 14 days.</template>
            </p>
          </div>
        </div>
      </section>


      <!-- ══ FOOTER ══════════════════════════════════════════════════════════ -->
      <footer class="footer">
        <div class="container footer__inner">
          <a class="footer__brand" href="#top">Wall<span>Art</span>Room</a>
          <p class="footer__copy">© {{ year }} · The Pinterest Revenue OS · API-compliant, no risky scraping.</p>
          <div class="footer__links">
            <NuxtLink to="/pricing">Pricing</NuxtLink>
            <NuxtLink to="/privacy">Privacy</NuxtLink>
            <a href="mailto:hello@wallartroom.com">Contact</a>
          </div>
        </div>
      </footer>

    </main>
  </div>
</template>


<script setup>
import { defineComponent, h } from 'vue'
import heroImg from '@@/assets/images/hero.png'
import exampleStatsImg from '@@/assets/images/examplestatistic.png'

// ── Feature visuals ───────────────────────────────────────────────────────────

const FeatureBoardIntel = defineComponent({
  setup: () => () => h('div', { class: 'vis vis--ai' }, [
    h('div', { class: 'vis__panel' }, [
      h('div', { class: 'vis__panel-head' }, [h('span', 'Board Intelligence'), h('span', { class: 'vis__pill' }, 'AI')]),
      h('div', { class: 'vis__row' }, [
        h('div', { class: 'vis__row-img', style: 'background: linear-gradient(135deg,#fde68a,#f59e0b);' }),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'Coastal Prints'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, 'Relevance: 94% — topical match + keyword overlap'),
        ]),
        h('span', { class: 'vis__chip vis__chip--ai' }, '94%'),
      ]),
      h('div', { class: 'vis__row' }, [
        h('div', { class: 'vis__row-img', style: 'background: linear-gradient(135deg,#bbf7d0,#22c55e);' }),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'Minimalist Home'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, 'Relevance: 71% — partial keyword match'),
        ]),
        h('span', { class: 'vis__chip vis__chip--gen' }, '71%'),
      ]),
      h('div', { class: 'vis__row' }, [
        h('div', { class: 'vis__row-img', style: 'background: linear-gradient(135deg,#fecaca,#ef4444);' }),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'DIY Projects'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, 'Low relevance — board health: critical (3 pins)'),
        ]),
        h('span', { class: 'vis__chip vis__chip--pending' }, '22%'),
      ]),
    ]),
  ]),
})

const FeatureSeo = defineComponent({
  setup: () => () => h('div', { class: 'vis vis--ai' }, [
    h('div', { class: 'vis__panel' }, [
      h('div', { class: 'vis__panel-head' }, [h('span', 'SEO Copilot'), h('span', { class: 'vis__pill vis__pill--accent' }, 'Score: 82')]),
      h('div', { class: 'vis__seo-bar' }, [
        h('div', { class: 'vis__seo-fill', style: 'width: 82%;' }),
      ]),
      h('div', { class: 'vis__seo-items' }, [
        h('div', { class: 'vis__seo-item vis__seo-item--good' }, [
          h('span', { class: 'vis__seo-dot vis__seo-dot--green' }),
          h('span', 'Primary keyword in first 3 words'),
        ]),
        h('div', { class: 'vis__seo-item vis__seo-item--warn' }, [
          h('span', { class: 'vis__seo-dot vis__seo-dot--yellow' }),
          h('span', 'Description only 120 chars — use 200+ for reach'),
        ]),
        h('div', { class: 'vis__seo-item vis__seo-item--good' }, [
          h('span', { class: 'vis__seo-dot vis__seo-dot--green' }),
          h('span', 'Board name aligns with pin topic'),
        ]),
      ]),
      h('div', { class: 'vis__seo-keywords' }, [
        h('span', { class: 'vis__seo-kw' }, 'aesthetic room decor'),
        h('span', { class: 'vis__seo-kw' }, 'home office art'),
        h('span', { class: 'vis__seo-kw' }, 'modern prints'),
      ]),
    ]),
  ]),
})

const FeatureLinkHealth = defineComponent({
  setup: () => () => h('div', { class: 'vis vis--ai' }, [
    h('div', { class: 'vis__panel' }, [
      h('div', { class: 'vis__panel-head' }, [h('span', 'Link Health'), h('span', { class: 'vis__pill' }, '47 checked')]),
      h('div', { class: 'vis__row' }, [
        h('span', { class: 'vis__link-status vis__link-status--ok' }, '200'),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'shop.studio.com/coastal-print'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, 'UTM: pinterest / social / summer_sale_2026'),
        ]),
        h('span', { class: 'vis__chip vis__chip--ok' }, 'Healthy'),
      ]),
      h('div', { class: 'vis__row' }, [
        h('span', { class: 'vis__link-status vis__link-status--redirect' }, '301'),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'old-blog.com/post-archive'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, 'Redirects to: new-blog.com/archive'),
        ]),
        h('span', { class: 'vis__chip vis__chip--gen' }, 'Redirect'),
      ]),
      h('div', { class: 'vis__row' }, [
        h('span', { class: 'vis__link-status vis__link-status--broken' }, '404'),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'etsy.com/listing/deleted-item'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, 'Broken link — will waste pin traffic'),
        ]),
        h('span', { class: 'vis__chip vis__chip--broken' }, 'Broken'),
      ]),
    ]),
  ]),
})

const FeatureDuplicateGuard = defineComponent({
  setup: () => () => h('div', { class: 'vis vis--ai' }, [
    h('div', { class: 'vis__panel' }, [
      h('div', { class: 'vis__panel-head' }, [h('span', 'Duplicate Guard'), h('span', { class: 'vis__pill' }, '3 warnings')]),
      h('div', { class: 'vis__row' }, [
        h('div', { class: 'vis__row-img', style: 'background: linear-gradient(135deg,#fecaca,#f87171);' }),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'Near-duplicate: 92% match'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, '"Minimalist Art Print" vs "Minimalist Art Prints"'),
        ]),
        h('span', { class: 'vis__chip vis__chip--broken' }, 'Dupe'),
      ]),
      h('div', { class: 'vis__row' }, [
        h('div', { class: 'vis__row-img', style: 'background: linear-gradient(135deg,#fef3c7,#f59e0b);' }),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'Stale pin (112 days old)'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, 'Create a fresh variant with updated keywords'),
        ]),
        h('span', { class: 'vis__chip vis__chip--gen' }, 'Refresh'),
      ]),
    ]),
  ]),
})

const FeatureBulk = defineComponent({
  setup: () => () => h('div', { class: 'vis vis--bulk' }, [
    h('div', { class: 'vis__panel' }, [
      h('div', { class: 'vis__panel-head' }, [h('span', 'Bulk edit · 42 selected')]),
      h('div', { class: 'vis__field' }, [
        h('label', null, [h('span', { class: 'vis__check vis__check--on' }), 'Apply Pinterest board']),
        h('div', { class: 'vis__input' }, 'Coastal Prints'),
      ]),
      h('div', { class: 'vis__field' }, [
        h('label', null, [h('span', { class: 'vis__check vis__check--on' }), 'Apply UTM preset']),
        h('div', { class: 'vis__input' }, 'Summer Sale 2026 (pinterest/social)'),
      ]),
      h('div', { class: 'vis__field' }, [
        h('label', null, [h('span', { class: 'vis__check vis__check--on' }), 'Apply redirect URL']),
        h('div', { class: 'vis__input' }, 'https://shop.studio.com/collection/coastal'),
      ]),
      h('div', { class: 'vis__applybar' }, [
        h('span', { class: 'vis__hint' }, '3 fields will be applied'),
        h('span', { class: 'vis__btn' }, 'Apply to 42 →'),
      ]),
    ]),
  ]),
})

const FeatureCsv = defineComponent({
  setup: () => () => h('div', { class: 'vis vis--csv' }, [
    h('div', { class: 'vis__panel' }, [
      h('div', { class: 'vis__panel-head' }, [h('span', 'CSV Studio'), h('span', { class: 'vis__pill vis__pill--accent' }, 'Validated')]),
      h('div', { class: 'vis__csv-row' }, [
        h('div', { class: 'vis__csv-icon' }, '✓'),
        h('div', { class: 'vis__csv-body' }, [
          h('div', { class: 'vis__csv-name' }, '120 pins validated · 0 errors'),
          h('div', { class: 'vis__csv-meta' }, 'All links healthy · no duplicates · SEO avg 84'),
        ]),
        h('span', { class: 'vis__chip vis__chip--ok' }, 'Ready'),
      ]),
      h('div', { class: 'vis__csv-modes' }, [
        h('div', { class: 'vis__csv-mode vis__csv-mode--active' }, [
          h('span', '↗'), h('span', 'Direct publish via API'),
        ]),
        h('div', { class: 'vis__csv-mode' }, [
          h('span', '↓'), h('span', 'Export Pinterest-ready CSV'),
        ]),
      ]),
      h('div', { class: 'vis__csv-row' }, [
        h('div', { class: 'vis__csv-icon' }, '📄'),
        h('div', { class: 'vis__csv-body' }, [
          h('div', { class: 'vis__csv-name' }, 'pinterest-export-2026-05-14.csv'),
          h('div', { class: 'vis__csv-meta' }, '120 pins · May 14 → May 28 · UTMs attached'),
        ]),
        h('span', { class: 'vis__chip vis__chip--ok' }, '✓ Exported'),
      ]),
    ]),
  ]),
})

useHead({
  title: 'WallArtRoom — The Pinterest Revenue OS for Creators & Shops',
  meta: [
    { name: 'description', content: 'Not another scheduler. WallArtRoom is a Pinterest Revenue OS with Board Intelligence, SEO Copilot, Link Health, Duplicate Guard, and validated CSV exports. Built for creators who want traffic and sales, not vanity metrics.' },
    { name: 'theme-color', content: '#1a1714' },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap' },
  ],
})

definePageMeta({ layout: false })

const year = new Date().getFullYear()

// ── Waitlist form ──────────────────────────────────────────────────────────
const email = ref('')
const submitting = ref(false)
const submitted = ref(false)
const alreadyJoined = ref(false)
const formError = ref('')

const honeypot = ref('')
const mountedAt = ref(0)
onMounted(() => { mountedAt.value = Date.now() })

async function handleSubmit() {
  if (!email.value || submitting.value || submitted.value) return
  submitting.value = true
  formError.value = ''
  try {
    const res = await $fetch('/api/waitlist/join', {
      method: 'POST',
      body: {
        email: email.value,
        source: 'landing-hero',
        company: honeypot.value,
        delay: mountedAt.value ? Date.now() - mountedAt.value : 0,
      },
    })
    submitted.value = true
    alreadyJoined.value = !!res.alreadyJoined
  } catch (e) {
    formError.value = e?.data?.statusMessage || e?.message || 'Could not save your email. Try again.'
  } finally {
    submitting.value = false
  }
}


// ── Cursor follower ──────────────────────────────────────────────────────────
const cursorRef = ref(null)
const INTERACTIVE_SEL = 'a, button, input, textarea, select, label, [data-cursor]'

const cursorState = { x: -100, y: -100, tx: -100, ty: -100 }
let cursorRaf = null
let cursorActive = false

function onMouseMove(e) {
  cursorState.tx = e.clientX
  cursorState.ty = e.clientY
  if (!cursorActive && cursorRef.value) {
    cursorRef.value.classList.add('cursor--ready')
    cursorActive = true
  }
  if (!cursorRaf) cursorRaf = requestAnimationFrame(cursorLoop)
}

function onMouseOver(e) {
  if (!cursorRef.value) return
  const isHover = !!(e.target?.closest && e.target.closest(INTERACTIVE_SEL))
  cursorRef.value.classList.toggle('cursor--hover', isHover)
}

function cursorLoop() {
  const dx = cursorState.tx - cursorState.x
  const dy = cursorState.ty - cursorState.y
  if (Math.abs(dx) < 0.4 && Math.abs(dy) < 0.4) {
    cursorRaf = null
    return
  }
  cursorState.x += dx * 0.2
  cursorState.y += dy * 0.2
  if (cursorRef.value) {
    cursorRef.value.style.transform =
      `translate3d(${cursorState.x - 18}px, ${cursorState.y - 18}px, 0)`
  }
  cursorRaf = requestAnimationFrame(cursorLoop)
}


onMounted(() => {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseover', onMouseOver, { passive: true })
  }
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  window.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseover', onMouseOver)
  if (cursorRaf) cancelAnimationFrame(cursorRaf)
})


// ── Differentiator strip ──────────────────────────────────────────────────────
const differentiators = [
  { number: '6', label: 'intelligent layers beyond scheduling' },
  { number: '0', label: 'broken links shipped to Pinterest' },
  { number: '92%', label: 'avg SEO score after optimization' },
  { number: '3x', label: 'faster than spreadsheet workflows' },
]


// ── Pain points ─────────────────────────────────────────────────────────────
const painPoints = [
  {
    title: 'Wrong board = invisible pin',
    body: 'Pinterest ranks pins by board relevance. A misplaced pin gets zero distribution — and generic tools never warn you.',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`,
  },
  {
    title: 'Broken links waste your traffic',
    body: 'You get the click, but the page 404s. Generic schedulers never check. By the time you notice, hundreds of clicks are gone.',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/><line x1="4" y1="4" x2="20" y2="20"/></svg>`,
  },
  {
    title: 'Duplicate pins trigger spam flags',
    body: 'Posting the same title twice tanks your reach. Pinterest penalizes repeat content, but no scheduler flags it before you publish.',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="12" height="16" rx="2"/><rect x="4" y="6" width="12" height="16" rx="2"/></svg>`,
  },
  {
    title: 'No SEO feedback before publish',
    body: "You hit schedule, hope the keywords work, and never learn why some pins get 100x more reach than others.",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
  },
]


// ── Vs comparison ──────────────────────────────────────────────────────��───
const vsRows = [
  { feature: 'Board Intelligence (AI)', them: 'No', us: 'Per-pin suggestions with relevance %' },
  { feature: 'Pinterest SEO Score', them: 'No', us: 'Real-time analysis before publish' },
  { feature: 'Link Health Check', them: 'No', us: 'Batch validation of all destination URLs' },
  { feature: 'Duplicate/Freshness Guard', them: 'No', us: 'Warns before you damage reach' },
  { feature: 'UTM Governance', them: 'Basic', us: 'Presets, auto-apply, per-campaign tracking' },
  { feature: 'CSV Studio with validation', them: 'Basic export', us: 'Schema check + dual publish mode' },
  { feature: 'Pinterest-specific AI', them: 'Generic copy', us: 'SEO-optimized, board-aware, unique' },
]


// ── Features ──────────────────────────────────────────────────────────────
const featureList = [
  {
    title: 'Board Intelligence — know where every pin belongs',
    body: 'AI analyzes your pin content against your boards and tells you exactly which one will get the best distribution. Board health scores flag dead boards before they hurt you.',
    bullets: ['Relevance score per board', 'Board health monitoring', 'Dead-board warnings', 'Auto-suggest for bulk uploads'],
    visual: FeatureBoardIntel,
  },
  {
    title: 'Pinterest SEO Copilot — optimize before you publish',
    body: "Real-time SEO scoring for every pin. Not generic 'add more keywords' — specific, Pinterest-algorithm-aware feedback with keyword opportunities you're missing.",
    bullets: ['0-100 SEO score', 'Keyword placement analysis', 'Description length optimization', 'Trending keyword suggestions'],
    visual: FeatureSeo,
  },
  {
    title: 'Link Health & UTM Governance — never waste a click',
    body: 'Batch-check every destination URL before publish. Catch 404s, redirects, and expired links. Auto-apply UTM presets so every click is tracked back to the pin that earned it.',
    bullets: ['Batch URL validation', 'Redirect detection', 'UTM preset library', 'Per-campaign attribution'],
    visual: FeatureLinkHealth,
  },
  {
    title: 'Duplicate & Freshness Guard — protect your reach',
    body: "Pinterest penalizes duplicate content. Our guard scans your entire workspace for near-duplicate titles and flags stale pins that should be refreshed with new variants.",
    bullets: ['92% similarity detection', 'Freshness warnings (90+ days)', 'Variant suggestions', 'Spam-flag prevention'],
    visual: FeatureDuplicateGuard,
  },
  {
    title: 'Bulk operations with safety rails',
    body: "Change boards, URLs, UTM presets, and publish dates across hundreds of pins. With validation that catches errors before they go live — not after.",
    bullets: ['Selective field updates', 'UTM preset bulk-apply', 'Board Intelligence in bulk', 'Undo until you save'],
    visual: FeatureBulk,
  },
  {
    title: 'CSV Studio — validated export, dual publish',
    body: "Not just export. Full validation before download: SEO scores, link health, duplicate checks. Then choose: publish directly via API or export a Pinterest-ready CSV that imports cleanly the first time.",
    bullets: ['Pre-export validation', 'Dual mode: API direct or CSV', 'Pinterest-exact format', 'Export history with audit trail'],
    visual: FeatureCsv,
  },
]


// ── Step-by-step ────────────────────────────────────────────────────────────
const steps = [
  { title: 'Upload & generate', body: 'Drop your images. AI writes Pinterest-optimized titles, descriptions, and keyword sets. Board Intelligence picks the best board.' },
  { title: 'Validate & optimize', body: 'SEO Copilot scores every pin. Link Health checks destinations. Duplicate Guard flags conflicts. Fix issues before they go live.' },
  { title: 'Publish with confidence', body: 'Schedule directly via API or export a validated CSV. UTM presets auto-attach so every click is attributed.' },
  { title: 'Track & refresh', body: 'See which boards perform. Get freshness alerts on aging pins. Create variants to keep reach growing — not decaying.' },
]


// ── Pricing plans ──────────────────────────────────────────────────────────
const pricingPlans = [
  {
    name: 'Solo Traffic',
    audience: 'Bloggers, small shops, side hustles',
    price: 19,
    featured: false,
    features: [
      '1 Pinterest account',
      '500 active pins / month',
      'CSV Studio + validation',
      'Link Health checks',
      'UTM preset library',
      'AI metadata generation',
    ],
  },
  {
    name: 'Growth Commerce',
    audience: 'Growing shops, creator brands',
    price: 49,
    featured: true,
    features: [
      '3 Pinterest accounts',
      '5,000 pins / month',
      'Board Intelligence (AI)',
      'Pinterest SEO Copilot',
      'Duplicate & Freshness Guard',
      'Seasonal content calendar',
      'Everything in Solo',
    ],
  },
  {
    name: 'Agency',
    audience: 'VAs, agencies, multi-client teams',
    price: 99,
    featured: false,
    features: [
      '10 Pinterest accounts',
      '10 workspaces',
      'Approval workflows',
      'White-label CSV exports',
      'Priority support',
      'API access',
      'Everything in Growth',
    ],
  },
]


// ── Use cases ──────────────────────────────────────────────────────────────
const useCases = [
  {
    title: 'Bloggers & Publishers',
    body: 'Turn every post into a pin automatically. Board Intelligence picks placement. SEO Copilot writes discovery-optimized metadata.',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/></svg>`,
  },
  {
    title: 'E-Commerce & Shopify',
    body: 'Product pins with tracked links, UTM governance, and revenue attribution. Know which pin sold which item.',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>`,
  },
  {
    title: 'Pinterest VAs & Agencies',
    body: 'Multi-account workspaces, approval queues, white-label exports. Manage 10 clients from one dashboard with confidence.',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
  },
  {
    title: 'Etsy & Amazon Sellers',
    body: 'Pin your listings with proper link governance. UTM tracking shows exactly which pins drive marketplace sales.',
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  },
]
</script>


<style scoped lang="scss">

$ink-1: #1a1714;
$ink-2: #2d2926;
$ink-3: #6b5e52;
$ink-4: #8a7a6e;
$cream: #faf7f2;
$paper: #ffffff;
$line:  #ede0d0;
$gold:  #c5a059;

.lp {
  background: $cream;
  color: $ink-2;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  font-feature-settings: 'cv11', 'ss01';
  font-synthesis: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

@keyframes heroEnter {
  from { opacity: 0; transform: translate3d(0, 24px, 0); }
  to { opacity: 1; transform: none; }
}

.hero-enter {
  opacity: 0;
  animation: heroEnter 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--enter-delay, 0ms);
}

@media (prefers-reduced-motion: reduce) {
  .hero-enter { opacity: 1; animation: none; }
}

.hp-field {
  position: absolute !important;
  left: -10000px !important;
  top: auto !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
}

.cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 36px;
  height: 36px;
  pointer-events: none;
  z-index: 9998;
  opacity: 0;
  transform: translate3d(-100px, -100px, 0);
  will-change: transform;
  transition: opacity 0.3s ease;
  &--ready { opacity: 1; }
  @media (pointer: coarse), (hover: none) { display: none; }
}

.cursor__inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 107, 53, 0.65);
  background: rgba(255, 107, 53, 0.04);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  transform: scale(1);
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.22s ease, border-color 0.22s ease;
}

.cursor--hover .cursor__inner {
  transform: scale(1.8);
  background: rgba(255, 107, 53, 0.14);
  border-color: rgba(255, 107, 53, 0.9);
}

.container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 32px;
}

.kicker {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: $gold;
  margin-bottom: 18px;
  &--light { color: rgba(255, 255, 255, 0.6); }
}

h2 {
  margin: 0 0 18px;
  font-size: clamp(32px, 4.4vw, 52px);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.05;
  color: $ink-1;
  em {
    font-family: 'Instrument Serif', 'Times New Roman', serif;
    font-style: italic;
    font-weight: 400;
    letter-spacing: -0.01em;
    color: $color-accent;
  }
}

// ── Nav
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: $cream;
  border-bottom: 1px solid rgba(237, 224, 208, 0.6);

  &__inner {
    max-width: 1240px;
    margin: 0 auto;
    padding: 18px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }

  &__brand {
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.04em;
    color: $ink-1;
    text-decoration: none;
    span { color: $color-accent; }
  }

  &__links {
    display: flex;
    align-items: center;
    gap: 32px;
    a {
      font-size: 14px;
      font-weight: 500;
      color: $ink-3;
      text-decoration: none;
      transition: color 0.15s;
      &:hover { color: $ink-1; }
    }
  }

  &__cta {
    padding: 9px 18px;
    background: $ink-1;
    color: #fff !important;
    border-radius: 999px;
    font-weight: 600 !important;
    transition: background 0.15s, transform 0.15s;
    &:hover { background: #2d2926; transform: translateY(-1px); }
  }
}

// ── HERO
.hero {
  position: relative;
  padding: 80px 32px 200px;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: 0;
    height: 240px;
    background: linear-gradient(to bottom, rgba(250, 247, 242, 0) 0%, rgba(250, 247, 242, 0.85) 55%, $cream 100%);
    pointer-events: none;
    z-index: 1;
  }

  &::before {
    content: '';
    position: absolute;
    left: 0; right: 0; top: 0;
    height: 120px;
    background: linear-gradient(to top, rgba(250, 247, 242, 0) 0%, rgba(250, 247, 242, 0.6) 100%);
    pointer-events: none;
    z-index: 1;
  }

  &__inner {
    position: relative;
    z-index: 2;
    max-width: 1240px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.05fr 1fr;
    gap: 64px;
    align-items: center;
  }

  &__copy { max-width: 600px; }

  &__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px 6px 12px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(197, 160, 89, 0.3);
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: $ink-2;
    backdrop-filter: blur(8px);
  }

  &__eyebrow-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: $color-accent;
    box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.18);
    animation: pulse 2.4s ease-in-out infinite;
  }

  &__title {
    margin: 24px 0 22px;
    font-size: clamp(40px, 6.4vw, 72px);
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 0.98;
    color: $ink-1;
    em {
      font-family: 'Instrument Serif', 'Times New Roman', serif;
      font-style: italic;
      font-weight: 400;
      letter-spacing: -0.015em;
      color: $color-accent;
    }
  }

  &__lead {
    max-width: 540px;
    font-size: 17px;
    line-height: 1.6;
    color: $ink-3;
    margin: 0 0 32px;
    strong { color: $ink-1; font-weight: 600; }
  }

  &__form { width: 100%; max-width: 480px; }

  &__form-row {
    display: flex;
    gap: 8px;
    padding: 6px;
    background: $paper;
    border: 1px solid $line;
    border-radius: 14px;
    box-shadow: 0 18px 50px -22px rgba(60, 40, 20, 0.18);
    transition: border-color 0.15s, box-shadow 0.15s;
    &:focus-within {
      border-color: $color-accent;
      box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.12), 0 18px 50px -22px rgba(60, 40, 20, 0.22);
    }
  }

  &__input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    padding: 0 12px;
    font: inherit;
    font-size: 15px;
    color: $ink-1;
    outline: 0;
    &::placeholder { color: $ink-4; }
    &:disabled { color: $ink-3; }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 12px 22px;
    border: 0;
    background: $ink-1;
    color: #fff;
    border-radius: 9px;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, transform 0.15s;
    &:hover:not(:disabled) { background: $color-accent; transform: translateY(-1px); }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }

  &__form-note {
    margin: 12px 4px 0;
    font-size: 13px;
    color: $ink-4;
    transition: color 0.2s;
    &--err { color: #b91c1c; }
  }

  &__feat-cards {
    margin-top: 32px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    max-width: 620px;
  }

  &__feat-card {
    padding: 10px 4px;
    display: flex;
    align-items: center;
    gap: 11px;
    border: 1px solid rgba(223, 193, 156, 0.9);
    border-radius: 11px;
    color: $ink-1;
    backdrop-filter: blur(10px);
    transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
    svg { flex: 0 0 auto; width: 22px; height: 22px; color: $color-accent; stroke: currentColor; }
    span { display: block; font-size: 13px; line-height: 1.18; font-weight: 600; letter-spacing: -0.01em; }
  }

  &__orb {
    position: absolute;
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;
    &--1 {
      width: 620px; height: 620px; top: -180px; right: -160px;
      background: radial-gradient(circle at 50% 50%, rgba(255, 107, 53, 0.55) 0%, rgba(255, 107, 53, 0.18) 35%, transparent 70%);
    }
    &--2 {
      width: 520px; height: 520px; bottom: -200px; left: -140px;
      background: radial-gradient(circle at 50% 50%, rgba(197, 160, 89, 0.5) 0%, rgba(197, 160, 89, 0.15) 35%, transparent 70%);
    }
  }

  &__grain {
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: 0.4;
    pointer-events: none;
    background-image: radial-gradient(rgba(26, 23, 20, 0.04) 1px, transparent 1px), radial-gradient(rgba(26, 23, 20, 0.03) 1px, transparent 1px);
    background-size: 18px 18px, 9px 9px;
    background-position: 0 0, 9px 9px;
  }
}

.hero__preview {
  position: relative;
  perspective: 1600px;
}

.hero__img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 18px;
  border: 1px solid rgba(237, 224, 208, 0.6);
  box-shadow: 0 28px 60px -28px rgba(60, 40, 20, 0.22), 0 12px 22px -16px rgba(60, 40, 20, 0.14);
  transform: rotateX(2deg) rotateY(-4deg);
  user-select: none;
  -webkit-user-drag: none;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.18); }
  50%      { box-shadow: 0 0 0 6px rgba(255, 107, 53, 0.06); }
}

// ── DIFFERENTIATOR STRIP
.diff {
  padding: 40px 0;
  background: $ink-1;

  &__inner {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
    text-align: center;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  &__number {
    font-size: 32px;
    font-weight: 800;
    color: $color-accent;
    letter-spacing: -0.03em;
  }

  &__label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.65);
    font-weight: 500;
  }
}

// ── PROBLEM
.problem {
  padding: 120px 0 100px;
  background: $cream;

  &__head {
    max-width: 720px;
    margin: 0 auto 60px;
    text-align: center;
    p { margin: 18px auto 0; font-size: 18px; line-height: 1.6; color: $ink-3; max-width: 600px; }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
  }
}

.pain {
  padding: 32px 28px;
  background: $paper;
  border: 1px solid $line;
  border-radius: 18px;
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  &:hover {
    transform: translateY(-3px);
    border-color: rgba(197, 160, 89, 0.5);
    box-shadow: 0 18px 40px -20px rgba(60, 40, 20, 0.18);
  }
  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px; height: 44px;
    border-radius: 12px;
    background: #faf3e3;
    color: $color-accent;
    margin-bottom: 18px;
  }
  h3 { margin: 0 0 10px; font-size: 18px; font-weight: 700; color: $ink-1; letter-spacing: -0.01em; }
  p { margin: 0; font-size: 14px; line-height: 1.55; color: $ink-3; }
}

// ── VERSUS
.versus {
  padding: 100px 0;
  background: $paper;
  border-top: 1px solid #f3eadc;
  border-bottom: 1px solid #f3eadc;

  &__head {
    text-align: center;
    margin-bottom: 50px;
  }

  &__table {
    max-width: 900px;
    margin: 0 auto;
    border: 1px solid $line;
    border-radius: 16px;
    overflow: hidden;
  }

  &__row {
    display: grid;
    grid-template-columns: 1.2fr 1fr 1.3fr;
    &--header {
      background: $ink-1;
      .versus__cell { color: #fff; font-weight: 700; font-size: 13px; letter-spacing: 0.02em; }
    }
    &:not(:last-child) { border-bottom: 1px solid #f3eadc; }
  }

  &__cell {
    padding: 16px 20px;
    font-size: 14px;
    color: $ink-2;
    &--feature { font-weight: 600; color: $ink-1; }
    &--them { color: $ink-4; }
    &--us { color: $ink-1; font-weight: 500; background: rgba(255, 107, 53, 0.04); }
  }
}

// ── FEATURES
.features {
  padding: 120px 0 100px;
  background: radial-gradient(ellipse at top left, rgba(255, 107, 53, 0.06), transparent 50%), $cream;

  &__head {
    max-width: 720px;
    margin: 0 auto 80px;
    text-align: center;
    p { margin: 18px auto 0; font-size: 18px; line-height: 1.6; color: $ink-3; max-width: 580px; }
  }

  &__list { display: flex; flex-direction: column; gap: 110px; }
}

.feature {
  display: grid;
  grid-template-columns: 1fr 1.05fr;
  gap: 72px;
  align-items: center;

  &--reverse {
    grid-template-columns: 1.05fr 1fr;
    direction: rtl;
    & > * { direction: ltr; }
  }

  &__copy { max-width: 460px; }

  &__num {
    display: inline-block;
    font-family: 'Instrument Serif', serif;
    font-size: 48px;
    font-style: italic;
    color: $color-accent;
    line-height: 1;
    margin-bottom: 18px;
  }

  h3 { margin: 0 0 16px; font-size: clamp(26px, 2.6vw, 34px); font-weight: 700; color: $ink-1; letter-spacing: -0.025em; line-height: 1.15; }
  p { margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: $ink-3; }

  &__bullets {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    li {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: $ink-2;
      font-weight: 500;
      svg { color: $color-accent; flex-shrink: 0; }
    }
  }

  &__visual { position: relative; }
}

// Feature visual panels
:deep(.vis) {
  position: relative;
  border-radius: 18px;
  padding: 30px;
  background: linear-gradient(135deg, rgba(255, 107, 53, 0.06), rgba(197, 160, 89, 0.08));
  border: 1px solid $line;
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.vis__panel) {
  width: 100%;
  max-width: 380px;
  background: $paper;
  border: 1px solid $line;
  border-radius: 12px;
  padding: 16px 16px 14px;
  box-shadow: 0 18px 50px -22px rgba(60, 40, 20, 0.25);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:deep(.vis__panel-head) { display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 700; color: $ink-1; }
:deep(.vis__pill) { font-size: 10px; font-weight: 600; background: #f6efe2; color: $ink-3; padding: 2px 8px; border-radius: 999px; }
:deep(.vis__pill--accent) { background: $color-accent; color: #fff; }

:deep(.vis__row) { display: flex; align-items: center; gap: 10px; padding: 8px; background: #fafaf7; border-radius: 8px; border: 1px solid #f3eadc; }
:deep(.vis__row-img) { width: 36px; height: 36px; border-radius: 6px; flex-shrink: 0; background-size: cover; }
:deep(.vis__row-body) { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
:deep(.vis__type-line--strong) { height: auto; background: none; font-size: 11px; font-weight: 700; color: $ink-1; }
:deep(.vis__type-line--text) { height: auto !important; width: 100% !important; background: none !important; font-size: 10px; font-weight: 500; color: $ink-3; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

:deep(.vis__chip) { font-size: 9px; font-weight: 700; padding: 3px 7px; border-radius: 4px; white-space: nowrap; }
:deep(.vis__chip--ai) { background: #ede9fe; color: #7c3aed; }
:deep(.vis__chip--gen) { background: #faf3e3; color: $gold; }
:deep(.vis__chip--ok) { background: #dcfce7; color: #16a34a; }
:deep(.vis__chip--pending) { background: #f3f4f6; color: $ink-3; }
:deep(.vis__chip--broken) { background: #fef2f2; color: #dc2626; }

:deep(.vis__link-status) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 800;
  flex-shrink: 0;
  &--ok { background: #dcfce7; color: #16a34a; }
  &--redirect { background: #fef3c7; color: #d97706; }
  &--broken { background: #fef2f2; color: #dc2626; }
}

// SEO visual
:deep(.vis__seo-bar) { height: 6px; background: #f3f4f6; border-radius: 3px; overflow: hidden; }
:deep(.vis__seo-fill) { height: 100%; background: linear-gradient(90deg, $color-accent, #22c55e); border-radius: 3px; }
:deep(.vis__seo-items) { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
:deep(.vis__seo-item) { display: flex; align-items: center; gap: 8px; font-size: 11px; color: $ink-2; }
:deep(.vis__seo-dot) { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
:deep(.vis__seo-dot--green) { background: #22c55e; }
:deep(.vis__seo-dot--yellow) { background: #f59e0b; }
:deep(.vis__seo-keywords) { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
:deep(.vis__seo-kw) { font-size: 10px; padding: 3px 8px; background: #ede9fe; color: #7c3aed; border-radius: 999px; font-weight: 600; }

// Bulk visual
:deep(.vis__field) { display: flex; flex-direction: column; gap: 6px; label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: $ink-2; } }
:deep(.vis__check) { width: 14px; height: 14px; border: 1.5px solid #d1d5db; border-radius: 3px; background: #fff; position: relative; }
:deep(.vis__check--on) { background: $color-accent; border-color: $color-accent; }
:deep(.vis__check--on::after) { content: ''; position: absolute; top: 2px; left: 4px; width: 3px; height: 6px; border-right: 1.5px solid #fff; border-bottom: 1.5px solid #fff; transform: rotate(45deg); }
:deep(.vis__input) { padding: 8px 10px; background: #fafaf7; border: 1px solid #f3eadc; border-radius: 6px; font-size: 12px; color: $ink-1; font-weight: 500; }
:deep(.vis__applybar) { display: flex; align-items: center; justify-content: space-between; padding: 10px 4px 0; margin-top: 6px; border-top: 1px solid #f3eadc; font-size: 11px; }
:deep(.vis__hint) { color: $ink-4; }
:deep(.vis__btn) { padding: 5px 12px; background: $color-accent; color: #fff; border-radius: 5px; font-weight: 600; font-size: 11px; }

// CSV visual
:deep(.vis__csv-row) { display: flex; align-items: center; gap: 10px; padding: 10px; background: #fafaf7; border-radius: 8px; border: 1px solid #f3eadc; }
:deep(.vis__csv-icon) { width: 30px; height: 36px; background: #fff; border: 1px solid $line; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
:deep(.vis__csv-body) { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
:deep(.vis__csv-name) { font-size: 11px; font-weight: 600; color: $ink-1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.vis__csv-meta) { font-size: 10px; color: $ink-4; }
:deep(.vis__csv-modes) { display: flex; gap: 6px; }
:deep(.vis__csv-mode) { flex: 1; display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 8px; border: 1px solid #f3eadc; font-size: 11px; font-weight: 500; color: $ink-3; background: #fafaf7; }
:deep(.vis__csv-mode--active) { border-color: $color-accent; background: rgba(255, 107, 53, 0.06); color: $ink-1; font-weight: 600; }

// ── HOW IT WORKS
.how {
  padding: 120px 0;
  background: $ink-1;
  color: #fff;
  .kicker { color: rgba(255, 255, 255, 0.55); }
  h2 { color: #fff; em { color: #f9b779; } }

  &__head { max-width: 760px; margin: 0 auto 80px; text-align: center; }

  &__steps {
    position: relative;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
  }

  &__line {
    position: absolute;
    top: 28px;
    left: 8%; right: 8%;
    height: 1px;
    background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.18) 50%, transparent 100%);
    z-index: 0;
  }
}

.step {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 0 12px;

  &__num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px; height: 56px;
    margin: 0 auto 24px;
    background: $ink-1;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    font-family: 'Instrument Serif', serif;
    font-style: italic;
    font-size: 28px;
    color: $color-accent;
  }

  h3 { margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #fff; letter-spacing: -0.01em; }
  p { margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.65); max-width: 260px; margin-left: auto; margin-right: auto; }
}

// ── PROOF
.proof {
  padding: 110px 0;
  background: $cream;

  &__grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 72px; align-items: center; }
  &__visual { position: relative; }

  &__img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 14px;
    border: 1px solid $line;
    box-shadow: 0 28px 60px -28px rgba(60, 40, 20, 0.22), 0 12px 24px -16px rgba(60, 40, 20, 0.12);
    user-select: none;
  }

  &__credit {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    padding: 7px 14px;
    background: $cream;
    border: 1px solid $line;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: $ink-3;
    text-decoration: none;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    svg { color: $color-accent; }
    &:hover { background: #fff7ed; border-color: rgba(255, 107, 53, 0.4); color: $ink-1; }
  }

  &__copy { max-width: 480px; h2 { margin: 16px 0 18px; } }
  &__lead { margin: 0 0 24px; font-size: 17px; line-height: 1.6; color: $ink-3; }

  &__points {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    li { display: flex; align-items: flex-start; gap: 12px; font-size: 15px; line-height: 1.55; color: $ink-2; strong { display: block; color: $ink-1; font-weight: 700; margin-bottom: 1px; } }
  }

  &__bullet-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: rgba(255, 107, 53, 0.12);
    color: $color-accent;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

// ── PRICING
.pricing {
  padding: 120px 0;
  background: $paper;
  border-top: 1px solid #f3eadc;

  &__head {
    text-align: center;
    margin-bottom: 60px;
    p { margin: 18px auto 0; font-size: 18px; color: $ink-3; max-width: 500px; }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 22px;
    max-width: 1000px;
    margin: 0 auto;
  }

  &__card {
    position: relative;
    background: $cream;
    border: 1px solid $line;
    border-radius: 18px;
    padding: 32px 28px 28px;
    display: flex;
    flex-direction: column;
    transition: border-color 0.15s, transform 0.15s;
    &:hover { border-color: $gold; transform: translateY(-2px); }
    &--featured { border-color: $ink-1; background: #fff; box-shadow: 0 12px 40px rgba(60, 40, 20, 0.10); }
  }

  &__badge {
    position: absolute;
    top: -11px; left: 50%; transform: translateX(-50%);
    font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
    background: $ink-1; color: #fff; padding: 5px 12px; border-radius: 999px;
  }

  &__plan-name { margin: 0 0 4px; font-size: 22px; font-weight: 700; color: $ink-1; }
  &__plan-for { margin: 0 0 16px; font-size: 13px; color: $ink-4; }

  &__price {
    display: flex; align-items: baseline; gap: 2px; margin-bottom: 22px;
    &-amount { font-size: 42px; font-weight: 700; color: $ink-1; letter-spacing: -0.03em; line-height: 1; }
    &-per { font-size: 14px; color: $ink-3; }
  }

  &__features {
    list-style: none; padding: 0; margin: 0 0 24px;
    display: flex; flex-direction: column; gap: 9px; flex: 1;
    li {
      display: flex; align-items: flex-start; gap: 8px;
      font-size: 13px; color: $ink-2; line-height: 1.5;
      svg { flex-shrink: 0; margin-top: 3px; color: $gold; }
    }
  }

  &__cta {
    display: block;
    width: 100%;
    padding: 14px;
    border: 1px solid $ink-1;
    background: #fff;
    color: $ink-1;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    &:hover { background: $ink-1; color: #fff; }
    &--primary { background: $ink-1; color: #fff; &:hover { background: #2d2926; } }
  }
}

// ── USE CASES
.usecases {
  padding: 100px 0;
  background: $cream;
  border-top: 1px solid #f3eadc;

  &__head { text-align: center; margin-bottom: 60px; }

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 22px;
  }
}

.usecase {
  padding: 28px 24px;
  background: $paper;
  border: 1px solid $line;
  border-radius: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-3px); box-shadow: 0 16px 40px -20px rgba(60, 40, 20, 0.16); }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px; height: 44px;
    border-radius: 12px;
    background: #faf3e3;
    color: $color-accent;
    margin-bottom: 16px;
  }
  h3 { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: $ink-1; }
  p { margin: 0; font-size: 13px; line-height: 1.55; color: $ink-3; }
}

// ── FINAL CTA
.cta {
  padding: 120px 0;
  background: radial-gradient(ellipse at center, rgba(255, 107, 53, 0.18), transparent 60%), linear-gradient(180deg, $ink-1 0%, #0f0d0b 100%);
  color: #fff;

  &__inner {
    max-width: 720px;
    margin: 0 auto;
    text-align: center;
    h2 { color: #fff; em { color: $color-accent; } }
    p { margin: 20px auto 36px; font-size: 17px; line-height: 1.6; color: rgba(255, 255, 255, 0.7); max-width: 540px; }
  }

  &__form {
    display: flex;
    gap: 8px;
    padding: 6px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 14px;
    max-width: 480px;
    margin: 0 auto;
    backdrop-filter: blur(10px);
    &:focus-within { border-color: $color-accent; box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.18); }
  }

  &__input {
    flex: 1; min-width: 0; border: 0; background: transparent;
    padding: 0 14px; font: inherit; font-size: 15px; color: #fff; outline: 0;
    &::placeholder { color: rgba(255, 255, 255, 0.45); }
  }

  &__btn {
    padding: 12px 22px; border: 0; background: $color-accent; color: #fff;
    border-radius: 9px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer;
    transition: background 0.15s, transform 0.15s;
    &:hover:not(:disabled) { background: #ff8451; transform: translateY(-1px); }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }

  &__note { margin: 16px auto 0; font-size: 13px; color: rgba(255, 255, 255, 0.45); &--err { color: #fca5a5; } }
}

// ── FOOTER
.footer {
  padding: 40px 0;
  background: #0f0d0b;
  color: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  &__inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
  &__brand { font-weight: 800; font-size: 16px; color: #fff; text-decoration: none; letter-spacing: -0.03em; span { color: $color-accent; } }
  &__copy { font-size: 13px; color: rgba(255, 255, 255, 0.4); margin: 0; }
  &__links {
    display: flex; gap: 22px;
    a { font-size: 13px; color: rgba(255, 255, 255, 0.55); text-decoration: none; transition: color 0.15s; &:hover { color: #fff; } }
  }
}

// ── Responsive
@media (max-width: 1240px) {
  .hero__inner { gap: 48px; }
  .feature, .feature--reverse { gap: 56px; }
}

@media (max-width: 920px) {
  .hero__inner { grid-template-columns: 1fr; gap: 56px; }
  .hero__preview { max-width: 560px; margin: 0 auto; }

  .feature, .feature--reverse { grid-template-columns: 1fr; direction: ltr; gap: 40px; }
  .proof__grid { grid-template-columns: 1fr; gap: 48px; }
  .proof__copy { max-width: 100%; }
  .pricing__grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
  .versus__table { font-size: 12px; }
  .versus__cell { padding: 12px 12px; }
  .diff__inner { grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .usecases__grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 760px) {
  .container { padding: 0 20px; }
  .nav__inner { padding: 14px 20px; gap: 16px; }
  .nav__links { gap: 16px; a:not(.nav__cta) { display: none; } }

  .hero { padding: 56px 20px 80px; }
  .hero__title { font-size: clamp(36px, 9vw, 56px); }
  .hero__lead { font-size: 16px; }
  .hero__form-row { flex-direction: column; gap: 8px; }
  .hero__btn { width: 100%; justify-content: center; }
  .hero__feat-cards { grid-template-columns: 1fr; }

  .problem, .features, .how, .cta, .pricing, .usecases { padding: 80px 0 70px; }
  .problem__grid { grid-template-columns: 1fr; }
  .features__list { gap: 70px; }
  .feature__num { font-size: 38px; }

  .how__steps { grid-template-columns: 1fr; gap: 48px; }
  .how__line { display: none; }

  .versus__row { grid-template-columns: 1fr; }
  .versus__row--header { display: none; }
  .versus__cell--feature { font-size: 13px; border-bottom: none; padding-bottom: 4px; }
  .versus__cell--them::before { content: 'Others: '; font-weight: 600; }
  .versus__cell--us::before { content: 'WallArtRoom: '; font-weight: 600; }

  .diff__inner { grid-template-columns: repeat(2, 1fr); }
  .usecases__grid { grid-template-columns: 1fr; }

  .cta__form { flex-direction: column; }
  .cta__btn { width: 100%; }
  .footer__inner { flex-direction: column; text-align: center; }
}
</style>
