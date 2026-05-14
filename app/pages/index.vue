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
          <a href="#waitlist" class="nav__cta">Join the waitlist</a>
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
              Private beta · launching very soon
            </span>

            <h1 class="hero__title hero-enter">
              200 pins to Pinterest<br>
              <em>in four clicks.</em>
            </h1>

            <p class="hero__lead hero-enter">
              Drop in your images. <strong>WallArtRoom</strong> writes the titles and
              descriptions, spreads them across your boards, picks the times, and exports
              a Pinterest-ready CSV. You just upload to Printerest.
            </p>

            <form
              class="hero__form hero-enter"
              @submit.prevent="handleSubmit"
            >
              <!-- Honeypot — visually hidden, off-screen, and excluded from
                   tab order. Real users never see or touch it; bots that auto-
                   fill form fields almost always do, and the server silently
                   drops submissions where this is filled. -->
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
                <template v-else>No spam, ever. One email when we launch.</template>
              </p>
            </form>

            <div class="hero__feat-cards hero-enter">
              <div class="hero__feat-card">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121"/>
                </svg>
                <span>AI metadata generation</span>
              </div>
              <div class="hero__feat-card">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="17" rx="2"/>
                  <path d="M3 9h18M8 2v4M16 2v4"/>
                </svg>
                <span>Bulk publish scheduling</span>
              </div>
              <div class="hero__feat-card">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 3v13M7 12l5 5 5-5"/>
                  <path d="M4 20h16"/>
                </svg>
                <span>One-click CSV export</span>
              </div>
            </div>
          </div>

          <!-- Product preview — static image. Cheap to paint = silky scroll. -->
          <div class="hero__preview hero-enter">
            <img
              :src="heroImg"
              alt="WallArtRoom Pinterest gallery preview"
              class="hero__img"
              loading="eager"
              decoding="async"
              draggable="false"
            />
          </div>

        </div>
      </section>


      <!-- ══ PROBLEM ══════════════════════════════════════════════════════════ -->
      <section class="problem">
        <div class="container">
          <div class="problem__head">
            <span class="kicker">The problem</span>
            <h2>Pinning at scale wasn't designed for creators.</h2>
            <p>If you publish more than a handful of pins a week, you already know the workflow gets ugly fast.</p>
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


      <!-- ══ PROOF / WHAT'S POSSIBLE ═════════════════════════════════════════ -->
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
            <span class="kicker">Real example</span>
            <h2>See what's <em>possible</em>.</h2>
            <p class="proof__lead">
              This is a real Pinterest account run by one person, using the same
              workflow we're building. No team. No agency.
            </p>

            <ul class="proof__points">
              <li>
                <span class="proof__bullet-icon">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                </span>
                <div>
                  <strong>Already pinning at scale?</strong>
                  This is the tool you wish Pinterest gave you.
                </div>
              </li>
              <li>
                <span class="proof__bullet-icon">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                </span>
                <div>
                  <strong>New to Pinterest?</strong>
                  Build a full presence here without writing a single title or
                  touching a spreadsheet.
                </div>
              </li>
              <li>
                <span class="proof__bullet-icon">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                </span>
                <div>
                  <strong>Bring your own images.</strong>
                  Make them in Midjourney, Canva, Photoshop — anywhere. Drop
                  them in, we handle the rest.
                </div>
              </li>
            </ul>

            <p class="proof__future">
              <span class="proof__future-tag">Coming next</span>
              Generate images right inside WallArtRoom — no extra tool needed.
            </p>
          </div>

        </div>
      </section>


      <!-- ══ FEATURES ════════════════════════════════════════════════════════ -->
      <section class="features" id="features">
        <div class="container">
          <div class="features__head">
            <span class="kicker">What's inside</span>
            <h2>Everything you wish Pinterest's editor did.</h2>
            <p>One workspace for managing thousands of pins — without the spreadsheet chaos.</p>
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
            <h2>From upload to published in three steps.</h2>
          </div>

          <div class="how__steps">
            <div class="how__line" aria-hidden="true" />
            <div
              v-for="s in steps"
              :key="s.title"
              class="step"
            >
              <div class="step__num">{{ i + 1 }}</div>
              <h3>{{ s.title }}</h3>
              <p>{{ s.body }}</p>
            </div>
          </div>
        </div>
      </section>


      <!-- ══ FINAL CTA ════════════════════════════════════════════════════════ -->
      <section class="cta" id="waitlist">
        <div class="container">
          <div class="cta__inner">
            <span class="kicker kicker--light">Be first</span>
            <h2>Get an invite when we launch.</h2>
            <p>We're inviting creators in waves — leave your email and we'll send one short message when your slot opens.</p>

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
                <template v-else>Reserve my spot</template>
              </button>
            </form>
            <p class="cta__note" :class="{ 'cta__note--err': formError }">
              <template v-if="formError">{{ formError }}</template>
              <template v-else>One email. No marketing list. Unsubscribe with one click.</template>
            </p>
          </div>
        </div>
      </section>


      <!-- ══ FOOTER ══════════════════════════════════════════════════════════ -->
      <footer class="footer">
        <div class="container footer__inner">
          <a class="footer__brand" href="#top">Wall<span>Art</span>Room</a>
          <p class="footer__copy">© {{ year }} · A Pinterest content studio · Built with care.</p>
          <div class="footer__links">
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

// ── Feature visuals (defined here so script-setup template can reference them) ─

const FeatureAi = defineComponent({
  setup: () => () => h('div', { class: 'vis vis--ai' }, [
    h('div', { class: 'vis__panel' }, [
      h('div', { class: 'vis__panel-head' }, [h('span', 'AI generator'), h('span', { class: 'vis__pill' }, '8 selected')]),
      h('div', { class: 'vis__row' }, [
        h('div', { class: 'vis__row-img', style: 'background: linear-gradient(135deg,#fde68a,#f59e0b);' }),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'Sunlit Coastal Linen Print'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, 'Warm minimalist art for the coastal home.'),
        ]),
        h('span', { class: 'vis__chip vis__chip--ai' }, '✨ AI'),
      ]),
      h('div', { class: 'vis__row' }, [
        h('div', { class: 'vis__row-img', style: 'background: linear-gradient(135deg,#bbf7d0,#22c55e);' }),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--strong' }, 'Forest Calm Botanical Study'),
          h('div', { class: 'vis__type-line vis__type-line--text' }, 'Hand-painted greens for the reading nook.'),
        ]),
        h('span', { class: 'vis__chip vis__chip--ai' }, '✨ AI'),
      ]),
      h('div', { class: 'vis__row' }, [
        h('div', { class: 'vis__row-img', style: 'background: linear-gradient(135deg,#fbcfe8,#ec4899);' }),
        h('div', { class: 'vis__row-body' }, [
          h('div', { class: 'vis__type-line vis__type-line--shimmer' }),
          h('div', { class: 'vis__type-line vis__type-line--shimmer vis__type-line--short' }),
        ]),
        h('span', { class: 'vis__chip vis__chip--gen' }, 'Writing…'),
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
        h('label', null, [h('span', { class: 'vis__check vis__check--on' }), 'Apply redirect URL']),
        h('div', { class: 'vis__input' }, 'https://shop.studio.com/p/...'),
      ]),
      h('div', { class: 'vis__field' }, [
        h('label', null, [h('span', { class: 'vis__check' }), 'Apply Pinterest status']),
      ]),
      h('div', { class: 'vis__applybar' }, [
        h('span', { class: 'vis__hint' }, '2 fields will be applied'),
        h('span', { class: 'vis__btn' }, 'Apply to 42 →'),
      ]),
    ]),
  ]),
})

const FeatureCalendar = defineComponent({
  setup: () => () => h('div', { class: 'vis vis--cal' }, [
    h('div', { class: 'vis__panel' }, [
      h('div', { class: 'vis__panel-head' }, [h('span', 'Publish schedule'), h('span', { class: 'vis__pill' }, '7 days · 28 pins')]),
      h('div', { class: 'vis__cal' },
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => {
          const counts = [4, 3, 5, 4, 6, 3, 3]
          return h('div', { class: 'vis__cal-day', key: i }, [
            h('span', { class: 'vis__cal-day-label' }, label),
            h('div', { class: 'vis__cal-bars' },
              Array.from({ length: counts[i] }, (_, j) =>
                h('span', {
                  class: 'vis__cal-bar',
                  key: j,
                  style: `background: ${['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][j % 6]};`,
                })
              )
            ),
            h('span', { class: 'vis__cal-day-num' }, String(counts[i])),
          ])
        })
      ),
    ]),
  ]),
})

const FeatureCsv = defineComponent({
  setup: () => () => h('div', { class: 'vis vis--csv' }, [
    h('div', { class: 'vis__panel' }, [
      h('div', { class: 'vis__panel-head' }, [h('span', 'CSV exports'), h('span', { class: 'vis__pill vis__pill--accent' }, '12 ready')]),
      h('div', { class: 'vis__csv-row' }, [
        h('div', { class: 'vis__csv-icon' }, '📄'),
        h('div', { class: 'vis__csv-body' }, [
          h('div', { class: 'vis__csv-name' }, 'pinterest-export-2026-05-14.csv'),
          h('div', { class: 'vis__csv-meta' }, '120 pins · May 14 → May 28'),
        ]),
        h('span', { class: 'vis__chip vis__chip--ok' }, '✓ Exported'),
      ]),
      h('div', { class: 'vis__csv-row' }, [
        h('div', { class: 'vis__csv-icon' }, '📄'),
        h('div', { class: 'vis__csv-body' }, [
          h('div', { class: 'vis__csv-name' }, 'pinterest-export-2026-05-07.csv'),
          h('div', { class: 'vis__csv-meta' }, '84 pins · May 7 → May 14'),
        ]),
        h('span', { class: 'vis__chip vis__chip--ok' }, '✓ Exported'),
      ]),
      h('div', { class: 'vis__csv-row' }, [
        h('div', { class: 'vis__csv-icon' }, '📄'),
        h('div', { class: 'vis__csv-body' }, [
          h('div', { class: 'vis__csv-name' }, 'pinterest-export-2026-04-30.csv'),
          h('div', { class: 'vis__csv-meta' }, '156 pins · Apr 30 → May 7'),
        ]),
        h('span', { class: 'vis__chip vis__chip--pending' }, '○ Draft'),
      ]),
    ]),
  ]),
})

useHead({
  title: 'WallArtRoom — The Pinterest content studio for creators',
  meta: [
    { name: 'description', content: 'Generate AI metadata, batch-edit pins, schedule publishing, and export Pinterest-ready CSVs. The control room for pinning at scale.' },
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

// Anti-abuse fields, sent with the request. The server checks both:
// - `honeypot` must be empty (it's a hidden field bots auto-fill)
// - the time between mount and submit must exceed a minimum threshold
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
  // Kick the loop awake only when needed. While idle, the RAF is parked so it
  // doesn't compete with the compositor on every scroll frame.
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
  // Settle threshold: once the ring is within 0.4px of the target, stop the
  // loop entirely. The next mousemove will restart it.
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


// ── Mount / unmount ──────────────────────────────────────────────────────────
// No scroll listeners. No IntersectionObservers. The page is fully static
// during scroll so the compositor has zero JS work to do. Hero entrance is
// pure CSS keyframes fired by mount, not by scroll position.

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


// ── Pain points ─────────────────────────────────────────────────────────────
const painPoints = [
  {
    title: 'Manual metadata, every single pin',
    body: 'Typing titles, descriptions, and links one pin at a time turns a 50-pin batch into a six-hour evening.',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v3H4zM4 11h10v3H4zM4 18h13v3H4z"/></svg>`,
  },
  {
    title: 'Spreadsheets that break on import',
    body: "Pinterest's bulk CSV is unforgiving. One stray comma, one missing column, and your whole upload is rejected.",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>`,
  },
  {
    title: "No view of what's published, scheduled, or stuck",
    body: "You publish, you forget, you re-publish. There's no single dashboard that says: this is what's live, this is what's next.",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>`,
  },
]


// ── Features (each one has an inline SVG-based visual) ──────────────────────
const featureList = [
  {
    title: 'AI titles & descriptions, written like you',
    body: 'Feed it a prompt and your image. Get on-brand titles and SEO-aware descriptions in seconds.',
    bullets: ['Pinterest-tuned tone', 'Unique-title guarantee', 'Bulk-generate for hundreds at once'],
    visual: FeatureAi,
  },
  {
    title: 'Batch-edit hundreds of pins at once',
    body: "Change the board, the redirect URL, the publish date, the status — across your whole selection. The kind of bulk edits a spreadsheet can do, but with safety rails.",
    bullets: ['Selective field updates', 'Clear or replace, your choice', 'Undo until you save'],
    visual: FeatureBulk,
  },
  {
    title: 'Visual scheduler that actually plans your month',
    body: "Spread pins across days at a glance. Drag a date range, auto-distribute times, see your week before you commit.",
    bullets: ['Daily breakdown view', 'Auto-spaced time slots', 'Per-board color coding'],
    visual: FeatureCalendar,
  },
  {
    title: 'One-click Pinterest CSV exports',
    body: "Hit Export and download a file that imports cleanly into Pinterest's bulk uploader the first time. Every time. With a history log of every export you've shipped.",
    bullets: ['Pinterest-exact CSV format', 'Sorted by publish date', 'Export history with diffs'],
    visual: FeatureCsv,
  },
]


// ── Step-by-step ────────────────────────────────────────────────────────────
const steps = [
  { title: 'Upload your pin images', body: 'Drag-drop hundreds at a time. We store them on fast CDN-backed object storage so they load instantly in the gallery.' },
  { title: 'Generate or write metadata', body: 'Use the AI panel to draft titles, descriptions, and keywords — or bulk-paste your own. Edit anything inline.' },
  { title: 'Schedule, export, and publish', body: 'Pick a date range, hit Export CSV, drop the file into Pinterest. Done — and tracked in your history.' },
]
</script>


<style scoped lang="scss">

// ── Tokens (page-local; reuse global $color-accent for the orange) ───────────

$ink-1: #1a1714;   // primary headlines
$ink-2: #2d2926;   // body
$ink-3: #6b5e52;   // secondary
$ink-4: #8a7a6e;   // tertiary
$cream: #faf7f2;   // page bg
$paper: #ffffff;
$line:  #ede0d0;   // warm divider
$gold:  #c5a059;   // secondary accent
$plum:  #4b2e83;   // deep contrast (rare)

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

// ── Hero entrance animation (page-load only, no scroll involvement) ──────────
// Pure CSS keyframes — fire on mount when the browser paints the page, then
// the elements stay at their final state forever. Zero JS, zero observers,
// nothing runs during scroll.

@keyframes heroEnter {
  from {
    opacity: 0;
    transform: translate3d(0, 24px, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.hero-enter {
  opacity: 0;
  animation: heroEnter 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: var(--enter-delay, 0ms);
}

@media (prefers-reduced-motion: reduce) {
  .hero-enter {
    opacity: 1;
    animation: none;
  }
}


// ── Honeypot field ───────────────────────────────────────────────────────────
// Visible to bots that parse the DOM, invisible + non-focusable to humans and
// screen readers. Don't use `display: none` — some bots skip those fields.

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

// ── Cursor follower ──────────────────────────────────────────────────────────
// Outline ring that lerps after the mouse. Hidden on touch / coarse pointer
// devices (phones, tablets) so it doesn't get stranded in the middle of the
// screen. `mix-blend-mode: difference` makes the ring readable on any
// background — light on dark, dark on light — without us picking a color per
// section.

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

  @media (pointer: coarse), (hover: none) {
    display: none;
  }
}

.cursor__inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 107, 53, 0.65);
  background: rgba(255, 107, 53, 0.04);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4) inset;
  transform: scale(1);
  transition:
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    background-color 0.22s ease,
    border-color 0.22s ease;
}

.cursor--hover .cursor__inner {
  transform: scale(1.8);
  background: rgba(255, 107, 53, 0.14);
  border-color: rgba(255, 107, 53, 0.9);
}

// ── Shared ───────────────────────────────────────────────────────────────────

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

// ── Nav ──────────────────────────────────────────────────────────────────────

.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  // Solid background, always. No JS scroll listener, no class toggling —
  // the nav never changes appearance, so scrolling does zero work for it.
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

// ── HERO ─────────────────────────────────────────────────────────────────────

.hero {
  position: relative;
  padding: 80px 32px 200px;
  overflow: hidden;

  // Soft fade INTO the next section. Bleeds the cream background up over the
  // orb edges so they never end on a hard line.
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 240px;
    background: linear-gradient(to bottom, rgba(250, 247, 242, 0) 0%, rgba(250, 247, 242, 0.85) 55%, $cream 100%);
    pointer-events: none;
    z-index: 1;
  }

  // Subtle fade INTO the header (top edge under the sticky nav). Catches the
  // orb top-color before it hits the nav's transparent backdrop.
  &::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
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

  &__copy { max-width: 580px; }

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
    font-size: clamp(40px, 6.4vw, 76px);
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
    max-width: 520px;
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
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;

  svg {
    flex: 0 0 auto;
    width: 22px;
    height: 22px;
    color: $color-accent;
    stroke: currentColor;
  }

  span {
    display: block;
    font-size: 13px;
    line-height: 1.18;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
}

  // Background flourishes. Pure radial-gradient with no filter, no layer hint
  // — they paint once and the browser composites them with the rest of the
  // hero. Forcing layers (`will-change`, `translateZ(0)`) only helped when
  // these were animated; static, they cost more than they saved.
  &__orb {
    position: absolute;
    border-radius: 50%;
    z-index: 0;
    pointer-events: none;

    &--1 {
      width: 620px;
      height: 620px;
      top: -180px;
      right: -160px;
      background: radial-gradient(circle at 50% 50%, rgba(255, 107, 53, 0.55) 0%, rgba(255, 107, 53, 0.18) 35%, transparent 70%);
    }

    &--2 {
      width: 520px;
      height: 520px;
      bottom: -200px;
      left: -140px;
      background: radial-gradient(circle at 50% 50%, rgba(197, 160, 89, 0.5) 0%, rgba(197, 160, 89, 0.15) 35%, transparent 70%);
    }
  }

  &__grain {
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: 0.4;
    pointer-events: none;
    background-image:
      radial-gradient(rgba(26, 23, 20, 0.04) 1px, transparent 1px),
      radial-gradient(rgba(26, 23, 20, 0.03) 1px, transparent 1px);
    background-size: 18px 18px, 9px 9px;
    background-position: 0 0, 9px 9px;
  }
}

// ── Hero preview (fake app screenshot in pure CSS) ───────────────────────────

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
  box-shadow:
    0 28px 60px -28px rgba(60, 40, 20, 0.22),
    0 12px 22px -16px rgba(60, 40, 20, 0.14);
  transform: rotateX(2deg) rotateY(-4deg);
  user-select: none;
  -webkit-user-drag: none;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.18); }
  50%      { box-shadow: 0 0 0 6px rgba(255, 107, 53, 0.06); }
}

// ── PROBLEM ──────────────────────────────────────────────────────────────────

.problem {
  padding: 120px 0 100px;
  background: $cream;

  &__head {
    max-width: 720px;
    margin: 0 auto 60px;
    text-align: center;

    p {
      margin: 18px auto 0;
      font-size: 18px;
      line-height: 1.6;
      color: $ink-3;
      max-width: 580px;
    }
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
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: #faf3e3;
    color: $color-accent;
    margin-bottom: 18px;
  }

  h3 {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 700;
    color: $ink-1;
    letter-spacing: -0.01em;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
    color: $ink-3;
  }
}

// ── PROOF / WHAT'S POSSIBLE ──────────────────────────────────────────────────
// White-background section to differentiate from the cream sections above and
// below. The white frame also lets the Pinterest screenshot read clearly.

.proof {
  padding: 110px 0;
  background: $paper;
  border-top: 1px solid #f3eadc;
  border-bottom: 1px solid #f3eadc;

  &__grid {
    display: grid;
    grid-template-columns: 1.15fr 1fr;
    gap: 72px;
    align-items: center;
  }

  &__visual {
    position: relative;
  }

  &__img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 14px;
    border: 1px solid $line;
    box-shadow:
      0 28px 60px -28px rgba(60, 40, 20, 0.22),
      0 12px 24px -16px rgba(60, 40, 20, 0.12);
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
    &:hover {
      background: #fff7ed;
      border-color: rgba(255, 107, 53, 0.4);
      color: $ink-1;
    }
  }

  &__copy {
    max-width: 480px;

    h2 {
      margin: 16px 0 18px;
    }
  }

  &__lead {
    margin: 0 0 24px;
    font-size: 17px;
    line-height: 1.6;
    color: $ink-3;
  }

  &__points {
    list-style: none;
    padding: 0;
    margin: 0 0 26px;
    display: flex;
    flex-direction: column;
    gap: 14px;

    li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 15px;
      line-height: 1.55;
      color: $ink-2;

      strong {
        display: block;
        color: $ink-1;
        font-weight: 700;
        margin-bottom: 1px;
      }
    }
  }

  &__bullet-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(255, 107, 53, 0.12);
    color: $color-accent;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__future {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    padding: 12px 16px;
    background: #faf3e3;
    border: 1px dashed rgba(197, 160, 89, 0.5);
    border-radius: 12px;
    font-size: 13px;
    color: $ink-2;
  }

  &__future-tag {
    flex-shrink: 0;
    padding: 3px 9px;
    background: $gold;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 999px;
  }
}

// ── FEATURES ─────────────────────────────────────────────────────────────────

.features {
  padding: 120px 0 100px;
  background:
    radial-gradient(ellipse at top left, rgba(255, 107, 53, 0.06), transparent 50%),
    $cream;

  &__head {
    max-width: 720px;
    margin: 0 auto 80px;
    text-align: center;

    p {
      margin: 18px auto 0;
      font-size: 18px;
      line-height: 1.6;
      color: $ink-3;
      max-width: 580px;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 110px;
  }
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

  h3 {
    margin: 0 0 16px;
    font-size: clamp(26px, 2.6vw, 34px);
    font-weight: 700;
    color: $ink-1;
    letter-spacing: -0.025em;
    line-height: 1.15;
  }

  p {
    margin: 0 0 24px;
    font-size: 16px;
    line-height: 1.6;
    color: $ink-3;
  }

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

  &__visual {
    position: relative;
  }
}

// Feature visual panels — shared shell
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

:deep(.vis__panel-head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 700;
  color: $ink-1;
}

:deep(.vis__pill) {
  font-size: 10px;
  font-weight: 600;
  background: #f6efe2;
  color: $ink-3;
  padding: 2px 8px;
  border-radius: 999px;
}
:deep(.vis__pill--accent) { background: $color-accent; color: #fff; }

:deep(.vis__row) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #fafaf7;
  border-radius: 8px;
  border: 1px solid #f3eadc;
}

:deep(.vis__row-img) {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  flex-shrink: 0;
  background-size: cover;
}

:deep(.vis__row-body) {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

:deep(.vis__type-line) {
  height: 8px;
  background: #e5e7eb;
  border-radius: 3px;
}
:deep(.vis__type-line:not(.vis__type-line--strong):nth-child(2)) {
  height: 7px;
  background: #f3f4f6;
  width: 80%;
}
:deep(.vis__type-line--strong) {
  height: auto;
  background: none;
  font-size: 11px;
  font-weight: 700;
  color: $ink-1;
}
:deep(.vis__type-line--short) { width: 60% !important; }
:deep(.vis__type-line--shimmer) {
  background: linear-gradient(90deg, #f3f4f6 0%, #faf3e3 50%, #f3f4f6 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
// Text variant — renders real copy, not a placeholder bar.
// Must override the nth-child(2) placeholder rule, hence the explicit width.
:deep(.vis__type-line--text) {
  height: auto !important;
  width: 100% !important;
  background: none !important;
  font-size: 10px;
  font-weight: 500;
  color: $ink-3;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

:deep(.vis__chip) {
  font-size: 9px;
  font-weight: 700;
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
}
:deep(.vis__chip--ai)      { background: #ede9fe; color: #7c3aed; }
:deep(.vis__chip--gen)     { background: #faf3e3; color: $gold; }
:deep(.vis__chip--ok)      { background: #dcfce7; color: #16a34a; }
:deep(.vis__chip--pending) { background: #f3f4f6; color: $ink-3; }

// Bulk visual
:deep(.vis__field) {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: $ink-2;
  }
}

:deep(.vis__check) {
  width: 14px;
  height: 14px;
  border: 1.5px solid #d1d5db;
  border-radius: 3px;
  background: #fff;
  position: relative;
}
:deep(.vis__check--on) {
  background: $color-accent;
  border-color: $color-accent;
}
:deep(.vis__check--on::after) {
  content: '';
  position: absolute;
  top: 2px;
  left: 4px;
  width: 3px;
  height: 6px;
  border-right: 1.5px solid #fff;
  border-bottom: 1.5px solid #fff;
  transform: rotate(45deg);
}

:deep(.vis__input) {
  padding: 8px 10px;
  background: #fafaf7;
  border: 1px solid #f3eadc;
  border-radius: 6px;
  font-size: 12px;
  color: $ink-1;
  font-weight: 500;
}

:deep(.vis__applybar) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px 0;
  margin-top: 6px;
  border-top: 1px solid #f3eadc;
  font-size: 11px;
}

:deep(.vis__hint) { color: $ink-4; }
:deep(.vis__btn) {
  padding: 5px 12px;
  background: $color-accent;
  color: #fff;
  border-radius: 5px;
  font-weight: 600;
  font-size: 11px;
}

// Calendar visual
:deep(.vis__cal) {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

:deep(.vis__cal-day) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 8px;
  background: #fafaf7;
  border: 1px solid #f3eadc;
  border-radius: 7px;
}

:deep(.vis__cal-day-label) {
  font-size: 10px;
  font-weight: 700;
  color: $ink-4;
  letter-spacing: 0.06em;
}

:deep(.vis__cal-bars) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

:deep(.vis__cal-bar) {
  height: 4px;
  border-radius: 2px;
}

:deep(.vis__cal-day-num) {
  font-size: 13px;
  font-weight: 800;
  color: $ink-1;
  margin-top: 2px;
}

// CSV visual
:deep(.vis__csv-row) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #fafaf7;
  border-radius: 8px;
  border: 1px solid #f3eadc;
}

:deep(.vis__csv-icon) {
  width: 30px;
  height: 36px;
  background: #fff;
  border: 1px solid $line;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

:deep(.vis__csv-body) {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

:deep(.vis__csv-name) {
  font-size: 11px;
  font-weight: 600;
  color: $ink-1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.vis__csv-meta) {
  font-size: 10px;
  color: $ink-4;
}

// ── HOW IT WORKS ─────────────────────────────────────────────────────────────

.how {
  padding: 120px 0;
  background: $ink-1;
  color: #fff;

  .kicker { color: rgba(255, 255, 255, 0.55); }
  h2 { color: #fff; em { color: #f9b779; } }

  &__head {
    max-width: 760px;
    margin: 0 auto 80px;
    text-align: center;
  }

  &__steps {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
  }

  &__line {
    position: absolute;
    top: 28px;
    left: 8%;
    right: 8%;
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
    width: 56px;
    height: 56px;
    margin: 0 auto 24px;
    background: $ink-1;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    font-family: 'Instrument Serif', serif;
    font-style: italic;
    font-size: 28px;
    color: $color-accent;
  }

  h3 {
    margin: 0 0 10px;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
  }

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.65);
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;
  }
}

// ── FINAL CTA ────────────────────────────────────────────────────────────────

.cta {
  padding: 120px 0;
  background:
    radial-gradient(ellipse at center, rgba(255, 107, 53, 0.18), transparent 60%),
    linear-gradient(180deg, $ink-1 0%, #0f0d0b 100%);
  color: #fff;

  &__inner {
    max-width: 720px;
    margin: 0 auto;
    text-align: center;

    h2 { color: #fff; em { color: $color-accent; } }

    p {
      margin: 20px auto 36px;
      font-size: 17px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.7);
      max-width: 540px;
    }
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

    &:focus-within {
      border-color: $color-accent;
      box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.18);
    }
  }

  &__input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    padding: 0 14px;
    font: inherit;
    font-size: 15px;
    color: #fff;
    outline: 0;

    &::placeholder { color: rgba(255, 255, 255, 0.45); }
  }

  &__btn {
    padding: 12px 22px;
    border: 0;
    background: $color-accent;
    color: #fff;
    border-radius: 9px;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, transform 0.15s;

    &:hover:not(:disabled) { background: #ff8451; transform: translateY(-1px); }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }

  &__note {
    margin: 16px auto 0;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.45);

    &--err { color: #fca5a5; }
  }
}

// ── FOOTER ───────────────────────────────────────────────────────────────────

.footer {
  padding: 40px 0;
  background: #0f0d0b;
  color: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 14px;
  }

  &__brand {
    font-weight: 800;
    font-size: 16px;
    color: #fff;
    text-decoration: none;
    letter-spacing: -0.03em;
    span { color: $color-accent; }
  }

  &__copy {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }

  &__links {
    display: flex;
    gap: 22px;

    a {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.55);
      text-decoration: none;
      transition: color 0.15s;
      &:hover { color: #fff; }
    }
  }
}

// ── Responsive ───────────────────────────────────────────────────────────────

// Side-by-side layout stays on desktop. Only collapses on tablet portrait+.
@media (max-width: 1240px) {
  .hero__inner { gap: 48px; }
  .feature, .feature--reverse { gap: 56px; }
}

@media (max-width: 920px) {
  .hero__inner { grid-template-columns: 1fr; gap: 56px; }
  .hero__preview { max-width: 560px; margin: 0 auto; }
  .preview { transform: none; }

  .feature, .feature--reverse {
    grid-template-columns: 1fr;
    direction: ltr;
    gap: 40px;
  }

  .proof__grid {
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .proof__copy { max-width: 100%; }
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

  .problem, .features, .how, .cta { padding: 80px 0 70px; }

  .problem__grid { grid-template-columns: 1fr; }
  .features__list { gap: 70px; }
  .feature__num { font-size: 38px; }

  .how__steps { grid-template-columns: 1fr; gap: 48px; }
  .how__line { display: none; }

  .cta__form { flex-direction: column; }
  .cta__btn { width: 100%; }

  .footer__inner { flex-direction: column; text-align: center; }
}
</style>
