<template>
  <div class="lp" id="top">

    <!-- ── Cursor follower (hidden on touch/coarse pointer) ────────────────── -->
    <div ref="cursorRef" class="cursor" aria-hidden="true">
      <div class="cursor__inner" />
    </div>


    <!-- ── Nav ─────────────────────────────────────────────────────────────── -->
    <header class="nav">
      <div class="nav__inner">
        <a class="nav__brand" href="#top">
          <span class="nav__mark" aria-hidden="true">P</span>
          <span class="nav__word">Wall<i>Art</i>Room</span>
        </a>
        <nav class="nav__links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#story">My story</a>
          <a href="#usecases">Use cases</a>
        </nav>
        <a href="#waitlist" class="nav__cta">Join the waitlist</a>
      </div>
    </header>

    <main>

      <!-- ══ HERO ═════════════════════════════════════════════════════════════ -->
      <section class="hero">
        <div class="hero__glow" aria-hidden="true" />
        <div class="hero__rays" aria-hidden="true" />

        <div class="hero__inner">

          <div class="hero__copy">
            <!-- Eyebrow badge -->
            <div class="hero__eyebrow hero-enter" style="--enter-delay:0ms">
              <svg class="hero__eyebrow-pin" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Built for Pinterest. Designed for scale.
            </div>

            <!-- Headline -->
            <h1 class="hero__title hero-enter" style="--enter-delay:80ms">
              From raw images<br>
              to <em>published pins</em><br>
              in minutes.
            </h1>

            <!-- Lead -->
            <p class="hero__lead hero-enter" style="--enter-delay:160ms">
              Bulk uploads, AI optimization, board intelligence,
              validation checks, and automated Pinterest workflows —
              without the manual chaos.
            </p>

            <!-- Email form -->
            <form
              class="hero__form hero-enter"
              style="--enter-delay:240ms"
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
                  placeholder="Enter your email"
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
                    Join the waitlist
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
                <template v-else>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="color:#e56b3a;vertical-align:-1px;margin-right:5px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  Be first to access the Pinterest Revenue OS.
                </template>
              </p>
            </form>

            <!-- Feature pills -->
            <div class="hero__feat-cards hero-enter" style="--enter-delay:320ms">
              <div class="hero__feat-card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                </svg>
                <span>Bulk Uploads</span>
              </div>
              <div class="hero__feat-card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3l1.6 3.4 3.4 1.6-3.4 1.6L12 13l-1.6-3.4L7 8l3.4-1.6z"/><path d="M19 17l.7 1.5 1.3.5-1.3.5-.7 1.5-.7-1.5-1.3-.5 1.3-.5z"/>
                </svg>
                <span>AI Pin Optimization</span>
              </div>
              <div class="hero__feat-card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 9h20M8 3v6"/>
                </svg>
                <span>Board Intelligence</span>
              </div>
              <div class="hero__feat-card">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
                </svg>
                <span>Pinterest Validation</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Laptop + floating cards: full hero height, pinned top-right,
             behind the copy so the headline stays fully readable. -->
        <div class="hero__preview hero-enter" style="--enter-delay:100ms">
            <!-- Floating card: pins ready (top-left of image) -->
            <div class="hero__float hero__float--tl hero__float--stat">
              <div class="hero__float-icon hero__float-icon--orange">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              </div>
              <div class="hero__float-body">
                <strong>96</strong>
                <span>Pins Ready</span>
                <p>Ready to publish</p>
              </div>
            </div>

            <!-- Floating card: validation passed (top-right) -->
            <div class="hero__float hero__float--tr">
              <div class="hero__float-icon hero__float-icon--green">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
              </div>
              <div class="hero__float-body">
                <strong>Pinterest</strong>
                <span>validation passed</span>
                <p>All good to go!</p>
              </div>
            </div>

            <!-- Laptop image -->
            <img
              :src="heroLaptopImg"
              alt="WallArtRoom Pinterest workspace showing bulk pin management"
              class="hero__img"
              loading="eager"
              decoding="async"
              draggable="false"
            />

            <!-- Floating card: AI titles (bottom-right) -->
            <div class="hero__float hero__float--br1">
              <div class="hero__float-icon hero__float-icon--orange">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.6 3.4 3.4 1.6-3.4 1.6L12 13l-1.6-3.4L7 8l3.4-1.6z"/></svg>
              </div>
              <div class="hero__float-body">
                <strong>AI titles</strong>
                <span>generated</span>
                <p>96 optimized</p>
              </div>
            </div>

            <!-- Floating card: CSV export (bottom-right-lower) -->
            <div class="hero__float hero__float--br2">
              <div class="hero__float-icon hero__float-icon--blue">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </div>
              <div class="hero__float-body">
                <strong>CSV export</strong>
                <span>ready</span>
                <p>Download now</p>
              </div>
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
            <h2>Four layers that turn pins into <em>revenue.</em></h2>
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


      <!-- ══ MY STORY ════════════════════════════════════════════════════════ -->
      <section class="story" id="story">
        <div class="container story__inner">
          <div class="story__head">
            <span class="kicker">My story</span>
            <h2>From a personal hack to a tool <em>anyone can use.</em></h2>
            <p class="story__lead">
              WallArtRoom didn't start as a product — it started as my own
              workflow, built to save myself hours every week.
            </p>
          </div>

          <ol class="story__points">
            <li>
              <span class="story__num">1</span>
              <div>
                <strong>It began with MidJourney.</strong>
                I generated a large set of images and needed a faster way to
                turn them into publish-ready pins.
              </div>
            </li>
            <li>
              <span class="story__num">2</span>
              <div>
                <strong>Then I wrote my own Python program.</strong>
                It already automated around 75% of the workflow — the tedious,
                repetitive parts I never wanted to do by hand.
              </div>
            </li>
            <li>
              <span class="story__num">3</span>
              <div>
                <strong>Even then, it already felt amazing.</strong>
                It saved so much time that I knew the idea was worth pushing
                much further.
              </div>
            </li>
            <li>
              <span class="story__num">4</span>
              <div>
                <strong>Over the years, I turned it into a service.</strong>
                What worked for me should work for everyone facing the same
                Pinterest grind.
              </div>
            </li>
            <li>
              <span class="story__num">5</span>
              <div>
                <strong>The goal: a platform anyone can use.</strong>
                Easy to use, with a clean and intuitive interface — no scripts,
                no setup, no technical background required.
              </div>
            </li>
          </ol>
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
import heroLaptopImg from '@@/assets/images/herolaptop.png'
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
          h('div', { class: 'vis__csv-meta' }, 'All links healthy · no duplicates · 0 errors'),
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
    { name: 'description', content: 'Not another scheduler. WallArtRoom is a Pinterest Revenue OS with Board Intelligence, Duplicate Guard, Pinterest-specific AI, and validated CSV exports. Built for creators who want traffic and sales, not vanity metrics.' },
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
  { number: '4', label: 'intelligent layers beyond scheduling' },
  { number: '100%', label: 'Pinterest-native workflow' },
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
    title: 'Duplicate pins trigger spam flags',
    body: 'Posting the same title twice tanks your reach. Pinterest penalizes repeat content, but no scheduler flags it before you publish.',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="12" height="16" rx="2"/><rect x="4" y="6" width="12" height="16" rx="2"/></svg>`,
  },
  {
    title: 'No duplicate or freshness detection',
    body: "Pinterest penalizes repetitive content. Other tools let you pin the same image twice and never warn you when pins go stale and lose reach.",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M13 7h4v4"/></svg>`,
  },
]


// ── Vs comparison ──────────────────────────────────────────────────────��───
const vsRows = [
  { feature: 'Board Intelligence (AI)', them: 'No', us: 'Per-pin suggestions with relevance %' },
  { feature: 'Duplicate Guard', them: 'No', us: 'Warns before you damage reach' },
  { feature: 'Pinterest-specific AI', them: 'Generic copy', us: 'Board-aware, keyword-optimized, unique' },
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
    body: "Not just export. Full validation before download: link health, duplicate checks. Then choose: publish directly via API or export a Pinterest-ready CSV that imports cleanly the first time.",
    bullets: ['Pre-export validation', 'Dual mode: API direct or CSV', 'Pinterest-exact format', 'Export history with audit trail'],
    visual: FeatureCsv,
  },
]


// ── Step-by-step ────────────────────────────────────────────────────────────
const steps = [
  { title: 'Upload & generate', body: 'Drop your images. AI writes Pinterest-optimized titles, descriptions, and keyword sets. Board Intelligence picks the best board.' },
  { title: 'Validate & optimize', body: 'Duplicate Guard flags near-identical titles and stale pins. Board Intelligence confirms the best placement. Fix issues before they go live.' },
  { title: 'Publish with confidence', body: 'Schedule directly via API or export a validated CSV. UTM presets auto-attach so every click is attributed.' },
  { title: 'Track & refresh', body: 'See which boards perform. Get freshness alerts on aging pins. Create variants to keep reach growing — not decaying.' },
]


// ── Use cases ──────────────────────────────────────────────────────────────
const useCases = [
  {
    title: 'Bloggers & Publishers',
    body: 'Turn every post into a pin automatically. Board Intelligence picks placement. AI writes discovery-optimized metadata.',
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
  .hero__float { opacity: 1; animation: none; transform: none; }
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

// Anchored sections clear the now-fixed header when jumped to via nav links.
.lp section[id] { scroll-margin-top: 92px; }

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
  height: 77px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: rgba(250, 247, 242, 0.72);
  backdrop-filter: saturate(160%) blur(14px);
  -webkit-backdrop-filter: saturate(160%) blur(14px);
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
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.04em;
    color: $ink-1;
    text-decoration: none;
  }

  &__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f0814e 0%, #e2603a 100%);
    color: #fff;
    font-size: 16px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: 0;
    box-shadow:
      0 4px 12px -3px rgba(226, 96, 58, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }

  &__word i {
    font-style: normal;
    color: $color-accent;
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
    padding: 10px 22px;
    background: rgba(255, 255, 255, 0.82);
    color: $color-accent !important;
    border: 1px solid rgba(255, 182, 145, 0.65);
    border-radius: 999px;
    font-weight: 700 !important;
    backdrop-filter: blur(6px);
    box-shadow:
      0 4px 16px -7px rgba(150, 90, 50, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.85);
    transition:
      background 0.22s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.16s cubic-bezier(0.16, 1, 0.3, 1);
    &:hover {
      background: #fff;
      transform: translateY(-1px);
      box-shadow:
        0 8px 22px -8px rgba(150, 90, 50, 0.34),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }
    &:active { transform: translateY(0); }
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(229, 107, 58, 0.32);
    }
  }
}

// ── HERO
.hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 32px;
  overflow: hidden;
  isolation: isolate;
  padding-top: 77px;

  // Warm editorial backdrop: a peach bloom behind the laptop, a soft
  // cream lift behind the headline, over a diagonal cream-to-sand base.
  background:
    radial-gradient(
      115% 85% at 80% 36%,
      rgba(255, 199, 165, 0.55) 0%,
      rgba(255, 210, 180, 0.16) 42%,
      rgba(255, 225, 210, 0) 64%
    ),
    radial-gradient(
      70% 70% at 12% 26%,
      rgba(255, 250, 244, 0.85) 0%,
      rgba(255, 250, 244, 0) 58%
    ),
    linear-gradient(
      163deg,
      #fffaf4 0%,
      #fbf4ec 44%,
      #f6e7d6 100%
    );

  // Faint dotted texture — premium paper grain, fading out lower so it
  // never reads as a hard pattern.
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image: radial-gradient(rgba(140, 95, 55, 0.07) 1px, transparent 1.5px);
    background-size: 26px 26px;
    opacity: 0.6;
    -webkit-mask-image: radial-gradient(125% 95% at 50% 4%, #000 0%, transparent 72%);
    mask-image: radial-gradient(125% 95% at 50% 4%, #000 0%, transparent 72%);
  }

  // Warm light bloom behind the laptop (echoes the photo's lighting)
  &__glow {
    position: absolute;
    z-index: 0;
    top: -120px;
    right: -120px;
    width: 760px;
    height: 760px;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(
      circle at 50% 50%,
      rgba(255, 170, 115, 0.26) 0%,
      rgba(255, 152, 95, 0.10) 40%,
      transparent 70%
    );
  }

  // Soft diagonal sun-streaks — echoes the lighting in the desk photo so
  // the copy side shares the same light source as the laptop scene.
  // Deliberately faint: atmosphere, never a pattern that pulls the eye.
  &__rays {
    position: absolute;
    z-index: 0;
    inset: -10% -10% auto -10%;
    height: 78%;
    pointer-events: none;
    mix-blend-mode: soft-light;
    opacity: 0.55;
    background:
      linear-gradient(122deg,
        transparent 0%,
        transparent 46%,
        rgba(255, 244, 230, 0.85) 52%,
        transparent 56%,
        transparent 64%,
        rgba(255, 240, 222, 0.6) 69%,
        transparent 73%,
        transparent 82%,
        rgba(255, 246, 235, 0.5) 86%,
        transparent 90%);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
  }

  // Soft immersive fade-out: the textured warm area dissolves into a
  // clean cream so the hero never ends on a hard edge.
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 280px;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(
      to bottom,
      rgba(251, 244, 236, 0) 0%,
      rgba(251, 244, 236, 0.55) 48%,
      rgba(250, 247, 242, 0.92) 82%,
      $cream 100%
    );
  }

  &__inner {
    position: relative;
    z-index: 2;
    max-width: 1240px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 0.92fr 1.18fr;
    gap: 36px;
    align-items: center;
  }

  &__copy {
    position: relative;
    z-index: 3;
    max-width: 560px;
  }

  // Eyebrow badge
  &__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 7px 16px 7px 12px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 180, 145, 0.6);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    color: $ink-2;
    backdrop-filter: blur(8px);
    box-shadow:
      0 3px 14px -5px rgba(150, 95, 55, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.75);
    margin-bottom: 28px;
  }

  &__eyebrow-pin {
    color: $color-accent;
    flex-shrink: 0;
  }

  // Headline
  &__title {
    margin: 0 0 22px;
    font-size: clamp(46px, 6.6vw, 88px);
    font-weight: 800;
    letter-spacing: -0.045em;
    line-height: 1.03;
    color: $ink-1;
    em {
      position: relative;
      font-family: 'Instrument Serif', 'Georgia', serif;
      font-style: italic;
      font-weight: 400;
      letter-spacing: -0.02em;
      color: $color-accent;
      white-space: nowrap;

      // Hand-drawn underline accent — feathered ends, slight rise to the
      // right so it reads as an ink stroke rather than a CSS rule.
      &::after {
        content: '';
        position: absolute;
        left: -1.5%;
        right: -1.5%;
        bottom: -0.02em;
        height: 0.16em;
        background: linear-gradient(
          90deg,
          transparent 0%,
          color-mix(in srgb, #{$color-accent} 90%, transparent) 12%,
          $color-accent 50%,
          color-mix(in srgb, #{$color-accent} 90%, transparent) 88%,
          transparent 100%
        );
        opacity: 0.42;
        border-radius: 999px;
        transform: rotate(-0.7deg);
      }
    }
  }

  // Lead text
  &__lead {
    max-width: 600px;
    font-size: clamp(17px, 1.15vw, 20px);
    line-height: 1.7;
    color: $ink-3;
    margin: 0 0 34px;
    text-wrap: pretty;
  }

  // Form
  &__form { width: 100%; max-width: 520px; }

  &__form-row {
    display: flex;
    gap: 0;
    background: $paper;
    border: 1.5px solid rgba(255, 188, 152, 0.7);
    border-radius: 14px;
    padding: 5px;
    box-shadow:
      0 10px 30px -12px rgba(150, 90, 50, 0.28),
      0 2px 6px -2px rgba(150, 90, 50, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    transition:
      border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    &:focus-within {
      border-color: $color-accent;
      box-shadow:
        0 0 0 3px rgba(229, 107, 58, 0.16),
        0 12px 30px -12px rgba(150, 90, 50, 0.32),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }
  }

  &__input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    padding: 0 16px;
    height: 50px;
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
    gap: 7px;
    padding: 0 22px;
    height: 50px;
    border: 0;
    background: linear-gradient(135deg, #f5824f 0%, #e7613a 100%);
    color: #fff;
    border-radius: 10px;
    font: inherit;
    font-size: 14.5px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition:
      background 0.2s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.12s cubic-bezier(0.16, 1, 0.3, 1);

    svg {
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #f78a56 0%, #e0592f 100%);
      box-shadow: 0 10px 24px -8px rgba(229, 107, 58, 0.6);
      svg { transform: translateX(3px); }
    }
    &:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 3px 10px -6px rgba(229, 107, 58, 0.5);
    }
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(229, 107, 58, 0.35);
    }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }

  &__form-note {
    margin: 11px 2px 0;
    font-size: 13px;
    color: $ink-4;
    display: flex;
    align-items: center;
    transition: color 0.2s;
    &--err { color: #b91c1c; }
  }

  // Feature cards
  &__feat-cards {
    margin-top: 30px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    max-width: 560px;
  }

  &__feat-card {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 12px 13px;
    background: rgba(255, 255, 255, 0.66);
    border: 1px solid rgba(255, 196, 165, 0.65);
    border-radius: 14px;
    backdrop-filter: blur(8px);
    box-shadow:
      0 4px 14px -8px rgba(150, 95, 55, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    color: $ink-1;
    cursor: default;
    transition:
      background 0.28s cubic-bezier(0.16, 1, 0.3, 1),
      border-color 0.28s cubic-bezier(0.16, 1, 0.3, 1),
      box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    &:hover {
      background: rgba(255, 255, 255, 0.88);
      border-color: rgba(229, 107, 58, 0.4);
      transform: translateY(-3px);
      box-shadow:
        0 10px 22px -12px rgba(120, 80, 40, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.7);
    }
    svg { color: $color-accent; flex-shrink: 0; }
    span {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.2;
      letter-spacing: -0.01em;
    }
  }
}

// Preview area — laptop photo + floating cards. Sits slightly lower
// than the copy and bleeds toward the right edge so the scene feels
// large and built into the page.
// Laptop scene: pinned to the top-right of the hero, full height,
// starting directly under the nav (no hero padding above it). Pulled
// left so it bleeds toward the centre, and held behind the copy.
.hero__preview {
  position: absolute;
  top: 0;
  // Pin the laptop to the centred 1240px container edge (not the raw
  // viewport edge) so it stays visually next to the copy on wide screens.
  // 1304 = 1240 container + 2 × 32px hero padding.
  right: max(0px, calc((100% - 1304px) / 2));
  bottom: 0;
  z-index: 1;
  margin: 0;
  pointer-events: none;
}

.hero__img {
  display: block;
  width: auto;
  height: 100vh;
  max-height: 100vh;
  user-select: none;
  transform: translateX(30px);
  -webkit-user-drag: none;
  // Horizontal fade: the photo stays solid on the right and dissolves
  // toward the copy so the headline and form remain fully readable.
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    transparent 38%,
    rgba(0, 0, 0, 0.55) 52%,
    #000 68%,
    #000 100%
  );

  mask-image: linear-gradient(
    to right,
    transparent 0%,
    transparent 38%,
    rgba(0, 0, 0, 0.75) 52%,
    #000 68%,
    #000 100%
  );
}

// Floating notification cards
.hero__float {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.97);
  border: 1px solid rgba(230, 220, 208, 0.85);
  border-radius: 14px;
  box-shadow:
    0 12px 32px -10px rgba(70, 45, 20, 0.20),
    0 2px 6px rgba(70, 45, 20, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  z-index: 10;
  white-space: nowrap;
  opacity: 0;
  --enter-delay: 450ms;
  // Entrance, then a slow perpetual drift so the scene feels alive.
  // The idle loop starts exactly when the entrance settles, so the
  // hand-off is seamless.
  animation:
    floatIn 650ms cubic-bezier(0.16, 1, 0.3, 1) var(--enter-delay) forwards,
    floatIdle 7s ease-in-out calc(var(--enter-delay) + 650ms) infinite;

  // Positions (relative to the laptop photo) + de-synced drift speeds
  &--tl  { top: 32%;   right: 15%;   --enter-delay: 450ms; }
  &--tr  { top: 14%;    right: 2%;  --enter-delay: 600ms; }
  &--br1 { top: 52%;   right: 1%; --enter-delay: 750ms; animation-duration: 650ms, 8.4s; }
  &--br2 { bottom: 24%; right: 5%; --enter-delay: 880ms; animation-duration: 650ms, 9.6s; }
}

@keyframes floatIn {
  from { opacity: 0; transform: translate3d(0, 12px, 0); }
  to   { opacity: 1; transform: none; }
}

@keyframes floatIdle {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50%      { transform: translate3d(0, -5px, 0); }
}

.hero__float-icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &--orange { background: $color-accent; }
  &--green  { background: #22c55e; }
  &--purple { background: #8b5cf6; }
  &--blue   { background: #3b82f6; }
}

.hero__float-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;

  // strong + span together form the two-line title; p is the muted sub.
  strong {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: $ink-1;
    line-height: 1.18;
    letter-spacing: -0.01em;
  }

  span {
    font-size: 12px;
    font-weight: 700;
    color: $ink-1;
    line-height: 1.18;
    letter-spacing: -0.01em;
  }

  p {
    margin: 2px 0 0;
    font-size: 11px;
    font-weight: 500;
    color: $ink-4;
    line-height: 1.3;
  }
}

// Stat variant — the "96" reads as a number, not a label.
.hero__float--stat .hero__float-body {
  strong {
    font-size: 22px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.03em;
  }
  span { font-size: 12px; }
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
    grid-template-columns: repeat(3, 1fr);
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
    grid-template-columns: repeat(3, 1fr);
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

// ── MY STORY
.story {
  padding: 110px 0;
  background: $paper;
  border-top: 1px solid #f3eadc;

  &__inner { max-width: 760px; }

  &__head {
    text-align: center;
    margin-bottom: 48px;
  }

  &__lead {
    margin: 18px auto 0;
    max-width: 560px;
    font-size: 18px;
    line-height: 1.6;
    color: $ink-3;
  }

  &__points {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 22px;

    li {
      display: flex;
      align-items: flex-start;
      gap: 18px;
      font-size: 16px;
      line-height: 1.62;
      color: $ink-3;
      strong {
        display: block;
        color: $ink-1;
        font-weight: 700;
        margin-bottom: 3px;
        letter-spacing: -0.01em;
      }
    }
  }

  &__num {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: rgba(255, 107, 53, 0.12);
    color: $color-accent;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-top: 1px;
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
  .hero__inner { gap: 28px; }
  .feature, .feature--reverse { gap: 56px; }
}

@media (max-width: 1024px) {
  // Tablet (incl. iPad portrait & landscape): clean stacked hero, copy
  // first then laptop. Extra top padding clears the now-fixed header.
  .hero {
    min-height: auto;
    display: block;
    padding: 104px 32px 120px;
  }
  .hero__inner { grid-template-columns: 1fr; gap: 44px; }
  .hero__copy { max-width: 640px; }
  // Back to a normal stacked image below the copy on tablet/phone.
  .hero__preview {
    position: static;
    inset: auto;
    max-width: 640px;
    margin: 16px auto 0;
    pointer-events: auto;
  }
  .hero__img {
    width: 100%;
    height: auto;
    max-height: none;
    transform: none;
    -webkit-mask-image:
      linear-gradient(to right, transparent 0%, #000 11%, #000 100%),
      linear-gradient(to bottom, #000 0%, #000 74%, transparent 99%);
    -webkit-mask-composite: source-in;
    mask-image:
      linear-gradient(to right, transparent 0%, #000 11%, #000 100%),
      linear-gradient(to bottom, #000 0%, #000 74%, transparent 99%);
    mask-composite: intersect;
  }
  .hero__feat-cards { max-width: 600px; }

  .feature, .feature--reverse { grid-template-columns: 1fr; direction: ltr; gap: 40px; }
  .proof__grid { grid-template-columns: 1fr; gap: 48px; }
  .proof__copy { max-width: 100%; }
  .versus__table { font-size: 12px; }
  .versus__cell { padding: 12px 12px; }
  .diff__inner { grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .usecases__grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 760px) {
  .container { padding: 0 20px; }
  .nav__inner { padding: 14px 20px; gap: 14px; }
  .nav__links { display: none; }
  .nav__cta { padding: 9px 18px; font-size: 13px; }

  // Phone hero: clean single column — copy first, laptop below. The
  // hero grows with its content instead of clipping.
  .hero {
    min-height: auto;
    padding: 92px 22px 80px;
    display: block;
  }
  .hero__inner { grid-template-columns: 1fr; gap: 40px; }
  .hero__copy { max-width: 100%; }

  .hero__title { font-size: clamp(40px, 11vw, 56px); }
  .hero__title em { white-space: normal; }
  .hero__lead { font-size: 16px; }

  // Form stacks vertically on phones.
  .hero__form-row {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    border-radius: 16px;
  }
  .hero__input { width: 100%; height: 50px; padding: 0 14px; }
  .hero__btn {
    width: 100%;
    justify-content: center;
    height: 50px;
    border-radius: 11px;
  }
  .hero__feat-cards { grid-template-columns: repeat(2, 1fr); }

  // Laptop sits below the copy; trim the desktop right-bleed and lift
  // the over-busy floating cards down to just the two key ones.
  .hero__preview {
    margin: 8px auto 0;
    max-width: 540px;
  }
  .hero__float { padding: 8px 11px; gap: 8px; border-radius: 12px; }
  .hero__float-icon { width: 26px; height: 26px; }
  .hero__float--stat .hero__float-body strong { font-size: 18px; }
  .hero__float--br1,
  .hero__float--br2 { display: none; }

  .problem, .features, .how, .story, .cta, .usecases { padding: 80px 0 70px; }
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
