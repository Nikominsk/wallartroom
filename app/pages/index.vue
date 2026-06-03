<template>
  <div class="lp" id="top">

    <!-- ── Nav ──────────────────────────────────────────────────────────────── -->
    <header class="nav">
      <div class="nav__inner">
        <a class="nav__brand" href="#top" aria-label="WallArtRoom home">
          <img class="nav__mark" src="/favicon.ico" alt="" aria-hidden="true" width="26" height="26" />
          <span class="nav__name">Wall<em>Art</em>Room</span>
        </a>
        <nav class="nav__links" aria-label="Site navigation">
          <a href="#features">Features</a>
          <a href="#story">Story</a>
          <a href="#pricing">Pricing</a>
        </nav>
        <a href="#waitlist" class="btn btn--ghost-nav">Join waitlist</a>
      </div>
    </header>

    <main>

      <!-- ══ HERO ══════════════════════════════════════════════════════════════ -->
      <section class="hero">

        <!-- Scrolling gallery wall — your Pinterest art, live -->
        <div class="hero-gallery" aria-hidden="true">
          <div class="hero-gallery__col hero-gallery__col--1">
            <img
              v-for="(img, i) in [...galleryCol1, ...galleryCol1]"
              :key="'c1-' + i"
              :src="img"
              alt=""
              class="hero-gallery__img"
              loading="eager"
              decoding="async"
              draggable="false"
            />
          </div>
          <div class="hero-gallery__col hero-gallery__col--2">
            <img
              v-for="(img, i) in [...galleryCol2, ...galleryCol2]"
              :key="'c2-' + i"
              :src="img"
              alt=""
              class="hero-gallery__img"
              loading="eager"
              decoding="async"
              draggable="false"
            />
          </div>
          <div class="hero-gallery__col hero-gallery__col--3">
            <img
              v-for="(img, i) in [...galleryCol3, ...galleryCol3]"
              :key="'c3-' + i"
              :src="img"
              alt=""
              class="hero-gallery__img"
              loading="eager"
              decoding="async"
              draggable="false"
            />
          </div>
        </div>

        <!-- App screenshot — floats over the gallery like a featured pin -->
        <div class="hero-app" aria-hidden="true">
          <img
            :src="heroLaptopImg"
            alt=""
            class="hero-app__img"
            loading="eager"
            decoding="async"
            draggable="false"
          />
        </div>

        <!-- Copy panel: left-aligned, above gallery -->
        <div class="container hero__inner">
          <div class="hero__copy">

            <div class="hero__eyebrow">
              <!-- Pinterest brand badge — instantly recognisable red P logo -->
              <span class="badge badge--pinterest">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-label="Pinterest" role="img">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
                For Pinterest
              </span>
              <span class="badge">Beta · Free</span>
            </div>

            <h1 class="hero__title">
              From images<br>to <em>published pins</em><br>in minutes.
            </h1>

            <p class="hero__lead">
              Bulk upload your artwork, generate AI-optimized titles and descriptions,
              validate before you publish, and export a Pinterest-ready CSV in one click.
            </p>

            <form
              class="wl-form"
              @submit.prevent="handleSubmit"
              aria-label="Join the waitlist"
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
              <div class="wl-form__row">
                <label for="hero-email" class="sr-only">Email address</label>
                <input
                  id="hero-email"
                  v-model="email"
                  type="email"
                  required
                  placeholder="Enter your email"
                  class="hero-input"
                  :disabled="submitting || submitted"
                />
                <button
                  type="submit"
                  class="btn btn--accent"
                  :disabled="submitting || submitted || !email"
                >
                  <template v-if="submitted && alreadyJoined">Already in ✓</template>
                  <template v-else-if="submitted">You're in ✓</template>
                  <template v-else-if="submitting">Saving…</template>
                  <template v-else>Get early access</template>
                </button>
              </div>
              <p class="wl-form__note" :class="{ 'wl-form__note--error': formError }">
                <template v-if="formError">{{ formError }}</template>
                <template v-else-if="submitted && alreadyJoined">Welcome back. We'll let you know when plans launch.</template>
                <template v-else-if="submitted">We'll send one email when paid plans go live.</template>
                <template v-else>Free during beta. No credit card needed.</template>
              </p>
            </form>

            <ul class="hero__trust" aria-label="Key promises">
              <li v-for="t in trustItems" :key="t">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 7l3.5 3.5L12 4" />
                </svg>
                <span>{{ t }}</span>
              </li>
            </ul>

          </div>
        </div>

      </section>


      <!-- ══ STATS STRIP ════════════════════════════════════════════════════════ -->
      <div class="stats-bar">
        <div class="container stats-bar__inner">
          <div class="stat" v-for="s in stats" :key="s.label">
            <div class="stat__value-row">
              <svg v-if="s.pinterest" width="18" height="18" viewBox="0 0 24 24" fill="#E60023" aria-hidden="true">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
              </svg>
              <span class="stat__value">{{ s.value }}</span>
            </div>
            <span class="stat__label">{{ s.label }}</span>
          </div>
        </div>
      </div>


      <!-- ══ SCHEDULING CALLOUT ════════════════════════════════════════════════ -->
      <section class="scheduling" id="scheduling">
        <img :src="schedCalImg" alt="" class="scheduling__bg" aria-hidden="true" loading="lazy" draggable="false" />
        <div class="scheduling__overlay" aria-hidden="true" />
        <div class="scheduling__content">
          <span class="scheduling__tag">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Built-in scheduling
          </span>
          <h2 class="scheduling__title">
            Plan weeks of pins.<br><em>Publish on autopilot.</em>
          </h2>
          <p class="scheduling__sub">Every pin in your export gets a scheduled date. Upload once to Pinterest and your content goes live exactly when you want it.</p>
          <div class="scheduling__pills">
            <span class="scheduling__pill">Precise publish times</span>
            <span class="scheduling__pill">Weeks planned in one export</span>
            <span class="scheduling__pill">Auto-imported by Pinterest</span>
          </div>
        </div>
      </section>


      <!-- ══ FEATURES ══════════════════════════════════════════════════════════ -->
      <section class="features" id="features">
        <div class="container">

          <div class="features__head">
            <span class="kicker">The workflow</span>
            <h2>Upload to publish,<br>on <em>autopilot.</em></h2>
          </div>

          <!-- Pinterest-style pin card grid -->
          <div class="pin-grid" role="list" aria-label="Key features">
            <article
              v-for="(f, i) in featureList"
              :key="f.title"
              class="pin-card"
              role="listitem"
            >
              <img
                :src="featureImages[i]"
                :alt="f.title"
                class="pin-card__img"
                loading="lazy"
                decoding="async"
                draggable="false"
              />
              <div class="pin-card__overlay" aria-hidden="true" />

              <span class="pin-card__num" aria-hidden="true">0{{ i + 1 }}</span>

              <div class="pin-card__caption">
                <div class="pin-card__icon" v-html="f.icon" aria-hidden="true" />
                <div class="pin-card__text">
                  <h3>{{ f.title }}</h3>
                  <p>{{ f.line }}</p>
                </div>
              </div>
            </article>
          </div>

        </div>
      </section>


      <!-- ══ STORY ══════════════════════════════════════════════════════════════ -->
      <section class="story" id="story">

        <!-- Analytics screenshot: fills the section as atmospheric proof -->
        <img
          :src="exampleStatsImg"
          alt=""
          aria-hidden="true"
          class="story__bg"
          loading="lazy"
          decoding="async"
          draggable="false"
        />
        <!-- Warm dark overlay — darker left for text, lighter right for laptop -->
        <div class="story__overlay" aria-hidden="true" />

        <div class="container story__inner">

          <!-- Left: personal story text -->
          <div class="story__copy">
            <span class="kicker kicker--dim">Why I built this</span>
            <h2 class="story__heading">
              From a personal hack<br>to a tool <em>anyone can use.</em>
            </h2>

            <p>WallArtRoom didn't start as a product. I generated images with MidJourney and needed a faster way to turn them into publish-ready Pinterest pins. So I wrote my own Python script. It automated 75% of the work instantly. I knew the idea was worth taking further.</p>
            <p>Over time I turned it into this: what worked for me should work for every creator facing the same grind. No scripts. No setup. No technical knowledge required.</p>

            <a
              class="story__link"
              href="https://de.pinterest.com/DigiDesignArt/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 2H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V6" />
                <path d="M10 2H7M10 2v3M10 2L5 7" />
              </svg>
              See the live Pinterest account
            </a>
          </div>

          <!-- Right: laptop app screenshot — the tool that produced those stats -->
          <div class="story__visual">
            <img
              :src="heroLaptopImg"
              alt="WallArtRoom dashboard showing the tool behind the analytics results"
              class="story__laptop"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
            <p class="story__caption">Real results. Real account. Built with this tool.</p>
          </div>

        </div>
      </section>


      <!-- ══ PRICING ════════════════════════════════════════════════════════════ -->
      <section class="pricing" id="pricing">
        <div class="container">
          <div class="section-head">
            <span class="kicker">Pricing</span>
            <h2>Pick your plan. Scale when you're ready.</h2>
            <p>All features are free during beta. Paid plans launch later. Waitlist members get first access and keep their history.</p>
          </div>

          <div class="pricing__grid">
            <div
              v-for="plan in plans"
              :key="plan.name"
              class="plan"
              :class="{ 'plan--featured': plan.featured }"
            >
              <div v-if="plan.badge" class="plan__badge">{{ plan.badge }}</div>
              <div class="plan__head">
                <div class="plan__name">{{ plan.name }}</div>
                <div class="plan__price">
                  <span class="plan__amount">{{ plan.price }}</span>
                  <span v-if="plan.period" class="plan__period">{{ plan.period }}</span>
                </div>
                <p v-if="plan.tagline" class="plan__tagline">{{ plan.tagline }}</p>
              </div>
              <ul class="plan__features" :aria-label="plan.name + ' plan features'">
                <li v-for="f in plan.features" :key="f">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2 7l3.5 3.5L12 4" />
                  </svg>
                  <span>{{ f }}</span>
                </li>
              </ul>
              <a
                :href="plan.isFree ? '/login' : '#waitlist'"
                class="btn btn--full"
                :class="plan.featured ? 'btn--accent' : 'btn--outline'"
              >{{ plan.cta }}</a>
            </div>
          </div>

          <p class="pricing__footnote">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            All tiers are available at no cost during the beta period. The prices above reflect future plans after launch.
          </p>
        </div>
      </section>


      <!-- ══ FINAL CTA ══════════════════════════════════════════════════════════ -->
      <section class="cta-dark" id="waitlist">

        <!-- Top marquee strip: artwork streaming right -->
        <div class="cta-marquee" aria-hidden="true">
          <div class="cta-marquee__track">
            <img
              v-for="(img, i) in [...ctaImages, ...ctaImages]"
              :key="'mt-' + i"
              :src="img"
              alt=""
              class="cta-marquee__img"
              loading="lazy"
              decoding="async"
              draggable="false"
            />
          </div>
        </div>

        <!-- Center: inspiring copy + form -->
        <div class="container">
          <div class="cta-dark__inner">

            <span class="cta-dark__label">
              <span class="cta-dark__dot" aria-hidden="true" />
              Beta · Free to join
            </span>

            <h2 class="cta-dark__title">
              Your art deserves<br>to be <em>everywhere.</em>
            </h2>

            <p class="cta-dark__lead">
              Join creators already on the waitlist. Free during beta, no card needed.
            </p>

            <form
              class="cta-form"
              @submit.prevent="handleSubmit"
              aria-label="Join the waitlist"
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
              <label for="cta-email" class="sr-only">Email address</label>
              <input
                id="cta-email"
                v-model="email"
                type="email"
                required
                placeholder="you@studio.com"
                class="cta-form__input"
                :disabled="submitting || submitted"
              />
              <button
                type="submit"
                class="btn btn--accent cta-form__btn"
                :disabled="submitting || submitted || !email"
              >
                <template v-if="submitted">You're on the list ✓</template>
                <template v-else-if="submitting">Saving…</template>
                <template v-else>Get early access →</template>
              </button>
              <p class="cta-form__note" :class="{ 'cta-form__note--error': formError }">
                <template v-if="formError">{{ formError }}</template>
                <template v-else>One email when paid plans launch. No spam, ever.</template>
              </p>
            </form>

          </div>
        </div>

      </section>


      <!-- ══ FOOTER ──────────────────────────────────────────────────────────── -->
      <footer class="footer">
        <div class="container footer__inner">
          <span class="footer__brand">Wall<em>Art</em>Room</span>
          <p class="footer__copy">© {{ year }} · The Pinterest Revenue OS</p>
          <nav class="footer__links" aria-label="Footer links">
            <NuxtLink to="/privacy">Privacy</NuxtLink>
            <a href="mailto:digidesignadobe@gmail.com">Contact</a>
          </nav>
        </div>
      </footer>

    </main>
  </div>
</template>


<script setup>
import heroLaptopImg    from '@@/assets/images/herolaptop.png'
import exampleStatsImg  from '@@/assets/images/examplestatistic.png'
import schedCalImg      from '@@/assets/images/schedulecalender.png'

// Gallery wall — all 14 artwork images
import galImg01 from '@@/assets/images/random/A_cyan_gun_barrel_in_digital_environment_illustrates_power_an_917c10c5-d2fb-4478-ac80-56d091d776d9_1.png'
import galImg02 from '@@/assets/images/random/A_desolate_wasteland_fiery_reds_and_black_shows_consequences__8ca71e6f-c6c7-4685-9441-123b7bc02a9f_1.png'
import galImg03 from '@@/assets/images/random/A_glittering_moon_illuminating_a_tranquil_forest_casting_a_ma_2f8dc470-f8e9-4004-b9d5-1360a71c99b9_0.png'
import galImg04 from '@@/assets/images/random/A_shooting_star_on_a_holiday_card_capturing_the_magic_of_Chri_688247db-cccf-4569-9880-03e4798f0e6d_0.png'
import galImg05 from '@@/assets/images/random/A_shooting_star_on_a_holiday_card_capturing_the_magic_of_Chri_688247db-cccf-4569-9880-03e4798f0e6d_3.png'
import galImg06 from '@@/assets/images/random/A_vibrant_Earth_sunrise_revealing_hope_and_beauty_in_space_--_8361f16c-0472-4da3-bc67-c1495895cc7d_0.png'
import galImg07 from '@@/assets/images/random/A_vibrant_gateway_unveiling_limitless_horizons_in_majestic_bl_5eda492b-c6ef-4433-b15e-3b48d9aa28b3_3.png'
import galImg08 from '@@/assets/images/random/A_vibrant_sunrise_on_an_alien_world_illuminating_a_new_beginn_7c47fac9-4e4a-4652-a2e9-486520ed1b6a_0.png'
import galImg09 from '@@/assets/images/random/Abstract_chaos_of_swirling_colors_on_textured_backdrop_evokes_bae5ebc6-14ca-4abc-adaf-52003e4caa4f_3.png'
import galImg10 from '@@/assets/images/random/An_intense_burst_of_flames_fills_the_sky_with_vibrant_red_and_7819d011-bd82-4b05-87a7-f48fa75efe8e_0.png'
import galImg11 from '@@/assets/images/random/Astronaut_floating_in_endless_universe_vibrant_colors_symboli_eb6b5411-9e78-4782-a509-c0c653e8904c_3.png'
import galImg12 from '@@/assets/images/random/Bright_airy_space_with_minimalist_aesthetic_showcasing_sleek__8cb2ff96-7ea6-4f05-a44d-6faafd292bc4_1.png'
import galImg13 from '@@/assets/images/random/Bright_orange_meteor_blazing_against_dark_space._Intense_ener_d1b94b6c-a580-415d-9f77-e26b7ebe69ef_2.png'
import galImg14 from '@@/assets/images/random/Capture_stunning_celestial_beauty_with_highresolution_moon_mo_f7139598-847c-42ac-a9ee-c80bf9675653_0.png'

// Feature pin cards (still used in features section)
const pinImg2 = galImg03
const pinImg3 = galImg11
const pinImg4 = galImg09

useHead({
  title: 'WallArtRoom: Pinterest AI Workflow for Creators',
  meta: [
    {
      name: 'description',
      content: 'Bulk upload images, generate AI-optimized Pinterest metadata, validate before publishing, and export a Pinterest-ready CSV. Free during beta.',
    },
    { name: 'theme-color', content: '#fafaf8' },
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&display=swap',
    },
  ],
})

definePageMeta({ layout: false })

const year = new Date().getFullYear()

// ── Waitlist form ─────────────────────────────────────────────────────────────
const email         = ref('')
const honeypot      = ref('')
const submitting    = ref(false)
const submitted     = ref(false)
const alreadyJoined = ref(false)
const formError     = ref('')
const mountedAt     = ref(0)

onMounted(() => { mountedAt.value = Date.now() })

async function handleSubmit() {
  if (!email.value || submitting.value || submitted.value) return
  submitting.value = true
  formError.value  = ''
  try {
    const res = await $fetch('/api/waitlist/join', {
      method: 'POST',
      body: {
        email:   email.value,
        source:  'landing',
        company: honeypot.value,
        delay:   mountedAt.value ? Date.now() - mountedAt.value : 0,
      },
    })
    submitted.value     = true
    alreadyJoined.value = !!res.alreadyJoined
  } catch (e) {
    formError.value = e?.data?.statusMessage || e?.message || 'Could not save your email. Try again.'
  } finally {
    submitting.value = false
  }
}

// ── Content ───────────────────────────────────────────────────────────────────
const trustItems = [
  'API-compliant, no risky scraping',
  'Pinterest-native workflow',
  'No setup or technical knowledge needed',
]

const stats = [
  { value: '100%', label: 'Pinterest-native', pinterest: true },
  { value: '3×',   label: 'faster than spreadsheets' },
  { value: '0',    label: 'technical setup required' },
]

// pinImg1 was merged into galImg08 — update featureImages to use gallery refs
const pinImg1 = galImg08
const featureImages = [pinImg1, pinImg2, pinImg3, pinImg4]

// Gallery wall columns — all 14 images per column, each in a shifted rotation
// so columns look distinct. More images = taller column = reset is invisible.
const galleryCol1 = [galImg06, galImg09, galImg11, galImg13, galImg02, galImg08, galImg07, galImg03, galImg04, galImg14, galImg10, galImg12, galImg01, galImg05]
const galleryCol2 = [galImg08, galImg07, galImg03, galImg04, galImg14, galImg10, galImg12, galImg01, galImg05, galImg06, galImg09, galImg11, galImg13, galImg02]
const galleryCol3 = [galImg10, galImg12, galImg01, galImg05, galImg06, galImg09, galImg11, galImg13, galImg02, galImg08, galImg07, galImg03, galImg04, galImg14]

// CTA marquee — all images, ordered for colour variety
const ctaImages = [galImg06, galImg08, galImg10, galImg11, galImg13, galImg07, galImg03, galImg09, galImg14, galImg02, galImg04, galImg12, galImg01, galImg05]

const featureList = [
  {
    title: 'AI Metadata',
    line:  'Titles, descriptions & keywords in seconds.',
    icon:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.6 3.4 3.4 1.6-3.4 1.6L12 13l-1.6-3.4L7 8l3.4-1.6z"/><path d="M19 17l.7 1.5 1.3.5-1.3.5-.7 1.5-.7-1.5-1.3-.5 1.3-.5z"/></svg>`,
  },
  {
    title: 'Board Intelligence',
    line:  'Every pin lands in exactly the right place.',
    icon:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M2 9h20M8 3v6"/></svg>`,
  },
  {
    title: 'Duplicate Guard',
    line:  'Protect your reach before a pin goes live.',
    icon:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>`,
  },
  {
    title: 'CSV Export',
    line:  'Validated. Pinterest-ready. First time, every time.',
    icon:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
  },
]

// Features shared across all plans — only upload/AI/project amounts differ
const sharedFeatures = [
  'CSV export + scheduling',
  'Board intelligence',
  'Duplicate & freshness guard',
  'AI metadata generation',
  'Pinterest API publishing',
]

const plans = [
  {
    name:     'Free',
    price:    '$0',
    period:   '/ forever',
    tagline:  'Try the tool at your own pace.',
    isFree:   true,
    features: ['10 image uploads', '25 AI generations', '1 project', ...sharedFeatures],
    cta:      'Join waitlist',
    featured: false,
    badge:    null,
  },
  {
    name:     'Starter',
    price:    '$9.99',
    period:   '/ mo',
    tagline:  '~2 new images every day of the month.',
    isFree:   false,
    features: ['50 image uploads / month', '200 AI generations / month', '1 project', ...sharedFeatures],
    cta:      'Join waitlist',
    featured: false,
    badge:    null,
  },
  {
    name:     'Plus',
    price:    '$19.99',
    period:   '/ mo',
    tagline:  '~6 images a day. Ideal for active stores.',
    isFree:   false,
    features: ['200 image uploads / month', '1,000 AI generations / month', '3 projects', ...sharedFeatures],
    cta:      'Join waitlist',
    featured: true,
    badge:    'Most popular',
  },
  {
    name:     'Studio',
    price:    '$79.99',
    period:   '/ mo',
    tagline:  '50 images a day. Built for agencies and power creators.',
    isFree:   false,
    features: ['1,500 image uploads / month', '5,000 AI generations / month', '10 projects', ...sharedFeatures],
    cta:      'Join waitlist',
    featured: false,
    badge:    null,
  },
]
</script>


<style scoped lang="scss">

// ── Design tokens ─────────────────────────────────────────────────────────────
$bg:            #fafaf8;
$surface:       #ffffff;
$ink:           #111110;
$ink-2:         #3d3c3a;
$ink-muted:     #6b6860;
$ink-subtle:    #9d9a96;
$accent:        #e25f2c;
$accent-hover:  #c94e1e;
$accent-tint:   #fff4ee;
$border:        #e8e3dc;
$border-strong: #cdc7bf;
$dark:          #111110;
$dark-raised:   #1c1b19;

// ── Base ──────────────────────────────────────────────────────────────────────
.lp {
  background: $bg;
  color: $ink-2;
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: clip;

  *, *::before, *::after { box-sizing: border-box; }
}

.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}

.hp-field {
  position: absolute !important;
  left: -10000px !important;
  width: 1px !important; height: 1px !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 32px;

  @media (max-width: 480px) { padding: 0 20px; }
}

.lp section[id],
.lp div[id] { scroll-margin-top: 80px; }

// ── Global type ───────────────────────────────────────────────────────────────
.kicker {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: $accent;
  margin-bottom: 16px;

  &--dim { color: rgba(255,255,255,0.45); }
}

h2 {
  margin: 0 0 16px;
  font-size: clamp(26px, 3.4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: $ink;
  text-wrap: balance;

  em {
    font-family: 'Instrument Serif', 'Georgia', serif;
    font-style: italic;
    font-weight: 400;
    color: $accent;
    letter-spacing: -0.01em;
  }
}

// ── Buttons ───────────────────────────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 22px;
  border-radius: 10px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  border: 1.5px solid transparent;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.12s ease,
    opacity 0.15s;
  white-space: nowrap;
  min-height: 44px; // touch target

  &:focus-visible {
    outline: 2px solid $accent;
    outline-offset: 2px;
  }

  &--accent {
    background: $accent;
    color: #fff;
    border-color: $accent;

    &:hover:not(:disabled) {
      background: $accent-hover;
      border-color: $accent-hover;
      transform: translateY(-1px);
      box-shadow: 0 6px 18px -4px rgba(226,95,44,0.45);
    }
    &:active:not(:disabled) { transform: none; box-shadow: none; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &--outline {
    background: transparent;
    color: $ink;
    border-color: $border-strong;

    &:hover:not(:disabled) { background: $surface; border-color: $ink-muted; }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  &--ghost-nav {
    background: transparent;
    color: $ink;
    border-color: $border;
    font-size: 13.5px;
    padding: 9px 18px;
    min-height: 40px;

    &:hover { background: $surface; border-color: $border-strong; }
  }

  &--full { width: 100%; }
}

// ── Badge ─────────────────────────────────────────────────────────────────────
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: $accent;
  color: #fff;
  flex-shrink: 0;

  &--pinterest {
    background: #E60023;
    gap: 6px;
  }
}

// ── Section head ──────────────────────────────────────────────────────────────
.section-head {
  max-width: 600px;
  margin: 0 auto 56px;
  text-align: center;

  p {
    margin: 0;
    font-size: 17px;
    line-height: 1.65;
    color: $ink-muted;
    text-wrap: pretty;
  }
}

// ── Nav ───────────────────────────────────────────────────────────────────────
.nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
  height: 68px;
  background: rgba(250,250,248,0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid $border;

  &__inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 32px;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 32px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 9px;
    font-weight: 700;
    font-size: 17px;
    letter-spacing: -0.03em;
    color: $ink;
    text-decoration: none;
    flex-shrink: 0;

    em { font-style: normal; color: $accent; }
  }

  &__mark {
    width: 26px; height: 26px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  &__links {
    display: flex;
    align-items: center;
    gap: 28px;
    margin-left: auto;

    a {
      font-size: 14px;
      font-weight: 500;
      color: $ink-muted;
      text-decoration: none;
      transition: color 0.15s;

      &:hover { color: $ink; }
      &:focus-visible { outline: 2px solid $accent; outline-offset: 2px; border-radius: 2px; }
    }

    @media (max-width: 640px) { display: none; }
  }

  // On mobile __links is hidden — push the CTA button to the far right
  .btn--ghost-nav {
    @media (max-width: 640px) { margin-left: auto; }
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────
// Concept: Living Gallery Wall — the right half is a scrolling Pinterest feed
// of the creator's actual artwork. Left half: clean copy + form. The laptop
// screenshot floats as a product card over the gallery, bridging art ↔ tool.
.hero {
  position: relative;
  padding-top: 68px;
  min-height: 100svh;
  display: flex;
  align-items: center;
  overflow: hidden;
  // Warm cream on the left grades to nothing — gallery colours take over on the right
  background: linear-gradient(105deg, #fffaf5 0%, #fef5ec 38%, #fdeadc 62%, transparent 75%);
  background-color: #fef5ec; // full fallback
}

// ── Scrolling gallery wall ────────────────────────────────────────────────────
.hero-gallery {
  position: absolute;
  top: 0;
  right: 0;
  width: 60%;
  height: 100%;
  display: flex;
  gap: 10px;
  padding: 0 12px;
  z-index: 0;

  // Desktop: fade left edge into cream + top/bottom
  -webkit-mask-image:
    linear-gradient(to right, transparent 0%, black 18%, black 100%),
    linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
  -webkit-mask-composite: destination-in;
  mask-image:
    linear-gradient(to right, transparent 0%, black 18%, black 100%),
    linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
  mask-composite: intersect;

  // Mobile: full-bleed faint background — visible but very muted
  @media (max-width: 860px) {
    width: 100%;
    opacity: 0.18;
    padding: 0 6px;
    gap: 8px;
    // Vertical edge fade only (no left-edge fade needed — full width)
    -webkit-mask-image: linear-gradient(
      to bottom, transparent 0%, black 8%, black 92%, transparent 100%
    );
    mask-image: linear-gradient(
      to bottom, transparent 0%, black 8%, black 92%, transparent 100%
    );
    -webkit-mask-composite: initial;
    mask-composite: initial;
  }
}

// Mobile column sizing — each column is a wide fixed track so images are large.
// 3 × 54vw = 162vw total → overflows ~62vw, clipped by hero overflow:hidden.
// Result: ~2 full columns visible + partial 3rd, images ~54vw × 81vw tall.
.hero-gallery__col {
  @media (max-width: 860px) {
    flex: none;
    width: 54vw;
  }
  @media (max-width: 480px) {
    width: 58vw; // slightly larger on phones
  }
}

.hero-gallery__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  // Hardware-accelerated scroll — only transform, no layout props
  will-change: transform;

  &--1 { animation: heroScroll 26s linear infinite; }
  &--2 { animation: heroScroll 34s linear infinite; margin-top: -90px; }
  &--3 { animation: heroScroll 20s linear infinite; margin-top: -50px; }
}

@keyframes heroScroll {
  0%   { transform: translateY(0); }
  100% { transform: translateY(-50%); } // -50% = exactly one set → seamless loop
}

.hero-gallery__img {
  width: 100%;
  aspect-ratio: 2 / 3;
  object-fit: cover;
  border-radius: 12px;
  display: block;
  flex-shrink: 0;
}

// ── Laptop product card — floats over the gallery ─────────────────────────────
.hero-app {
  position: absolute;
  bottom: 5%;
  right: 1.5%;
  z-index: 10;
  width: clamp(200px, 21vw, 300px);
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 4px 12px rgba(0,0,0,0.10),
    0 20px 60px -12px rgba(0,0,0,0.28),
    0 0 0 1px rgba(255,255,255,0.18);

  @media (max-width: 860px) { display: none; }

  &__img {
    width: 100%;
    height: auto;
    display: block;
    user-select: none;
    -webkit-user-drag: none;
  }
}

// ── Hero copy panel ───────────────────────────────────────────────────────────
.hero__inner {
  position: relative;
  z-index: 20;
  width: 100%;
  padding-top: 80px;
  padding-bottom: 96px;

  @media (max-width: 860px) {
    padding-top: 56px;
    padding-bottom: 72px;
  }

  @media (max-width: 480px) {
    padding-top: 44px;
    padding-bottom: 60px;
  }
}

.hero__copy {
  max-width: 500px;

  @media (max-width: 860px) { max-width: 560px; }
  @media (max-width: 480px) { max-width: 100%; }
}

.hero__eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.hero__eyebrow-text {
  font-size: 13px;
  font-weight: 500;
  color: $ink-muted;
}

.hero__title {
  margin: 0 0 24px;
  font-size: clamp(46px, 6.8vw, 96px);
  font-weight: 900;
  letter-spacing: -0.055em;
  line-height: 0.97;
  color: $ink;
  text-wrap: balance;

  em {
    font-family: 'Instrument Serif', 'Georgia', serif;
    font-style: italic;
    font-weight: 400;
    color: $accent;
    letter-spacing: -0.02em;
  }

  @media (max-width: 860px) { font-size: clamp(40px, 7vw, 72px); }
  @media (max-width: 480px) { font-size: 38px; letter-spacing: -0.045em; line-height: 1.0; }
  @media (max-width: 360px) { font-size: 32px; }
}

.hero__lead {
  margin: 0 0 32px;
  font-size: clamp(15px, 1.1vw, 17px);
  line-height: 1.7;
  color: $ink-muted;
  max-width: 460px;
  text-wrap: pretty;

  @media (max-width: 480px) { font-size: 15px; margin-bottom: 28px; }
}

.hero__trust {
  list-style: none;
  margin: 20px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;

  @media (max-width: 480px) { display: none; } // hide on small screens — keep it uncluttered
}

// ── Trust list items ──────────────────────────────────────────────────────────
.hero__trust li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: $ink-muted;

  svg { color: $accent; flex-shrink: 0; }
}

// ── Pause gallery when user prefers no motion ─────────────────────────────────
@media (prefers-reduced-motion: reduce) {
  .hero-gallery__col { animation-play-state: paused; }
}

// ── Waitlist form ─────────────────────────────────────────────────────────────
.wl-form {
  &__row {
    display: flex;
    gap: 8px;
    background: $surface;
    border: 1.5px solid $border-strong;
    border-radius: 12px;
    padding: 5px;
    box-shadow: 0 2px 8px -4px rgba(0,0,0,0.08);
    transition: border-color 0.18s, box-shadow 0.18s;

    &:focus-within {
      border-color: $accent;
      box-shadow: 0 0 0 3px rgba(226,95,44,0.12), 0 2px 8px -4px rgba(0,0,0,0.08);
    }

    &--col {
      flex-direction: column;
      border-radius: 12px;

      .btn { width: 100%; }
    }
  }

  &__input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    padding: 0 14px;
    height: 46px;
    font: inherit;
    font-size: 15px;
    color: $ink;
    outline: 0;

    &::placeholder { color: $ink-subtle; }
    &:disabled { opacity: 0.6; cursor: not-allowed; }

    &--dark {
      color: rgba(255,255,255,0.9);
      &::placeholder { color: rgba(255,255,255,0.35); }
      &:focus { outline: 0; }
    }

    @media (max-width: 480px) { font-size: 16px; } // prevent iOS zoom
  }

  &__note {
    margin: 10px 2px 0;
    font-size: 13px;
    line-height: 1.4;
    color: $ink-muted;

    &--error { color: #b91c1c; }
    &--dim   { color: rgba(255,255,255,0.4); }
  }

  &--dark {
    .wl-form__row {
      background: $dark-raised;
      border-color: rgba(255,255,255,0.1);

      &:focus-within {
        border-color: $accent;
        box-shadow: 0 0 0 3px rgba(226,95,44,0.2);
      }
    }
  }
}

// ── Hero email input — same dimensions as .cta-form__input, light-mode colours
.hero-input {
  width: 100%;
  height: 54px;
  padding: 0 20px;
  background: $surface;
  border: 1.5px solid $border-strong;
  border-radius: 12px;
  font: inherit;
  font-size: 15px;
  color: $ink;
  outline: 0;
  transition: border-color 0.18s, box-shadow 0.18s;

  &::placeholder { color: $ink-subtle; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }

  &:focus {
    border-color: $accent;
    box-shadow: 0 0 0 3px rgba(226,95,44,0.14);
  }

  @media (max-width: 600px) {
    font-size: 16px; // prevent iOS auto-zoom
    background: rgba(255,255,255,0.97);
  }
}

// ── Hero form: standalone stacked layout on ALL screen sizes ─────────────────
// Matches the CTA section form — input and button are independent elements,
// not a grouped pill. 54px height mirrors the CTA input exactly.
.hero .wl-form__row {
  flex-direction: column;
  gap: 12px;
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
  max-width: 480px;

  &:focus-within { box-shadow: none; border-color: transparent; }
}


.hero .wl-form__row .btn--accent {
  width: 100%;
  height: 54px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
}

// ── Mobile hero: glassmorphic card + large separated form ─────────────────────
@media (max-width: 600px) {

  // Gallery more vibrant on mobile — it glows around the glass card
  .hero-gallery { opacity: 0.24; }

  // Frosted glass card behind the copy — gallery visible around + through it,
  // text fully readable at WCAG AA contrast on the warm semi-opaque surface.
  .hero__copy {
    background: rgba(255, 250, 244, 0.88);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 210, 180, 0.50);
    border-radius: 22px;
    padding: 28px 22px 30px;
    box-shadow:
      0 4px 24px -8px rgba(80, 45, 15, 0.16),
      inset 0 1px 0 rgba(255,255,255,0.70);
  }

  // Headline: clear, bold, dark ink
  .hero__title {
    font-size: 30px;
    letter-spacing: -0.04em;
    color: $ink;
  }

  // Lead: 16px minimum, proper contrast
  .hero__lead {
    font-size: 16px;
    line-height: 1.62;
    color: $ink-2;
    margin-bottom: 24px;
  }

  // Eyebrow: tight for mobile
  .hero__eyebrow {
    margin-bottom: 20px;
    gap: 7px;
  }

  // Mobile: button gets larger touch target (60px); hero-input height handled by .hero-input

  .hero .wl-form__row .btn--accent {
    height: 60px;
    border-radius: 16px;
    font-size: 16px;
    letter-spacing: -0.01em;
  }

  .hero .wl-form__note {
    font-size: 12.5px;
    text-align: center;
    margin-top: 10px;
  }
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
.stats-bar {
  border-top: 1px solid $border;
  border-bottom: 1px solid $border;
  background: $surface;

  &__inner {
    display: flex;
    justify-content: center;
  }
}

.stat {
  flex: 1;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 28px 20px;

  & + & { border-left: 1px solid $border; }

  &__value-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__value {
    font-size: 28px;
    font-weight: 800;
    color: $ink;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: $ink-muted;
    text-align: center;
  }

  @media (max-width: 480px) {
    padding: 20px 12px;
    &__value { font-size: 22px; }
    &__label { font-size: 12px; }
  }
}

// ── Features ──────────────────────────────────────────────────────────────────
.features {
  padding: 100px 0;

  &__head {
    text-align: center;
    margin-bottom: 52px;

    h2 { display: inline-block; }
  }
}

// ── Pinterest pin-card grid ────────────────────────────────────────────────────
.pin-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  align-items: start; // allow staggering

  // Stagger every other card down — authentic masonry feel
  .pin-card:nth-child(2) { margin-top: 36px; }
  .pin-card:nth-child(4) { margin-top: 22px; }

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    .pin-card:nth-child(2),
    .pin-card:nth-child(4) { margin-top: 0; }
    .pin-card:nth-child(2),
    .pin-card:nth-child(4) { margin-top: 0; }
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.pin-card {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  // Pinterest portrait ratio
  aspect-ratio: 2 / 3;
  cursor: default;
  background: $dark; // fallback while image loads

  &:hover .pin-card__img { transform: scale(1.06); }

  &__img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
  }

  // Gradient: subtle dark top (for the step number) + strong dark bottom (for caption)
  &__overlay {
    position: absolute;
    inset: 0;
    background:
      linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 30%),
      linear-gradient(to top,    rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0) 68%);
  }

  // Step number — top-left glass chip
  &__num {
    position: absolute;
    top: 14px;
    left: 14px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.14);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 999px;
    padding: 4px 10px;
    line-height: 1;
  }

  // Feature info — bottom of card
  &__caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 22px 18px;
    display: flex;
    align-items: flex-start;
    gap: 11px;
  }

  &__icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: $accent;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }

  &__text {
    min-width: 0;

    h3 {
      margin: 0 0 5px;
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.015em;
      line-height: 1.2;
    }

    p {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
      color: rgba(255,255,255,0.65);
    }
  }

  @media (max-width: 480px) {
    border-radius: 14px;

    &__caption { padding: 16px 13px; gap: 8px; }
    &__icon { width: 26px; height: 26px; border-radius: 6px; }
    &__text h3 { font-size: 12px; }
    &__text p  { font-size: 11px; }
    &__num { font-size: 10px; padding: 3px 8px; top: 10px; left: 10px; }
  }
}

// ── Scheduling callout — full-bleed image background ─────────────────────────
.scheduling {
  position: relative;
  overflow: hidden;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;

  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    z-index: 0;
  }

  // Dark gradient — heavier at bottom so white text is readable
  &__overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(
      160deg,
      rgba(10, 8, 6, 0.72) 0%,
      rgba(12, 9, 5, 0.80) 50%,
      rgba(14, 10, 5, 0.88) 100%
    );
  }

  &__content {
    position: relative;
    z-index: 2;
    text-align: center;
    max-width: 760px;
    padding: 80px 32px;
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: $accent;
    margin-bottom: 20px;

    svg { flex-shrink: 0; }
  }

  &__title {
    margin: 0 0 20px;
    font-size: clamp(32px, 5vw, 64px);
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1.04;
    color: #fff;
    text-wrap: balance;

    em {
      font-family: 'Instrument Serif', 'Georgia', serif;
      font-style: italic;
      font-weight: 400;
      color: $accent;
    }
  }

  &__sub {
    margin: 0 auto 32px;
    max-width: 520px;
    font-size: 17px;
    line-height: 1.65;
    color: rgba(255,255,255,0.65);
    text-wrap: pretty;
  }

  &__pills {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    padding: 7px 16px;
    background: rgba(255,255,255,0.10);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  @media (max-width: 600px) {
    min-height: 360px;
    &__content { padding: 60px 24px; }
    &__title { font-size: 32px; }
    &__sub { font-size: 15px; }
  }
}

// ── CSV preview card ──────────────────────────────────────────────────────────
.csv-card {
  background: $surface;
  border: 1px solid $border;
  border-radius: 18px;
  overflow: hidden;
  box-shadow:
    0 2px 4px rgba(0,0,0,0.03),
    0 8px 24px -8px rgba(0,0,0,0.10);

  &__topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: $bg;
    border-bottom: 1px solid $border;
    gap: 12px;
  }

  &__filename {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    font-weight: 600;
    color: $ink-muted;
    letter-spacing: -0.01em;

    svg { color: $accent; flex-shrink: 0; }
  }

  &__ready {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #16a34a;
    background: #dcfce7;
    padding: 3px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }

  &__table {
    padding: 0;
  }

  &__thead {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    padding: 9px 18px;
    background: #fafaf8;
    border-bottom: 1px solid $border;
    gap: 8px;

    span {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.10em;
      text-transform: uppercase;
      color: $ink-subtle;
    }
  }

  &__row {
    display: grid;
    grid-template-columns: 1.6fr 1fr 1fr;
    padding: 11px 18px;
    gap: 8px;
    border-bottom: 1px solid $border;
    align-items: center;
    transition: background 0.15s;

    &:last-child { border-bottom: 0; }
    &:hover { background: $bg; }
  }

  &__pin {
    font-size: 13px;
    font-weight: 600;
    color: $ink;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__board {
    font-size: 12px;
    color: $ink-muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__date {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    color: $accent;
    white-space: nowrap;

    svg { flex-shrink: 0; color: $accent; }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 18px;
    background: $bg;
    border-top: 1px solid $border;
    gap: 8px;

    span {
      font-size: 12px;
      color: $ink-subtle;
      font-weight: 500;
    }
  }

  &__count {
    font-size: 11px;
    font-weight: 700;
    color: $ink-muted;
    background: $border;
    padding: 3px 10px;
    border-radius: 999px;
  }
}

// ── Story ─────────────────────────────────────────────────────────────────────
// The exampleStatsImg fills the background as atmospheric proof of real results.
// heroLaptopImg sits prominently in the right column as the product shot.
// A directional warm overlay keeps left-side text at WCAG AA contrast (7:1+).
.story {
  position: relative;
  padding: 110px 0;
  overflow: hidden;

  // ── Background: analytics screenshot ──────────────────────────────────────
  &__bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    z-index: 0;
    pointer-events: none;
    user-select: none;
    // Let the image breathe through the overlay
    opacity: 0.55;
  }

  // Warm directional overlay:
  // - Left: near-opaque dark so white text hits 7:1 contrast
  // - Right: lighter so the laptop screenshot pops against the bg
  &__overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(
      108deg,
      rgba(14, 7, 2, 0.94) 0%,
      rgba(18, 9, 3, 0.88) 30%,
      rgba(16, 8, 2, 0.74) 55%,
      rgba(12, 6, 2, 0.52) 78%,
      rgba(8,  4, 1, 0.32) 100%
    );
  }

  // ── Content grid ──────────────────────────────────────────────────────────
  &__inner {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr 1.08fr;
    gap: 72px;
    align-items: center;

    @media (max-width: 820px) {
      grid-template-columns: 1fr;
      gap: 48px;
    }
  }

  // ── Left: text copy ───────────────────────────────────────────────────────
  &__copy { max-width: 520px; }

  &__heading {
    margin: 0 0 24px;
    font-size: clamp(26px, 3.2vw, 42px);
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: #fff;
    text-wrap: balance;

    em {
      font-family: 'Instrument Serif', 'Georgia', serif;
      font-style: italic;
      font-weight: 400;
      color: $accent;
      letter-spacing: -0.01em;
    }
  }

  &__copy p {
    margin: 0 0 16px;
    font-size: 15.5px;
    line-height: 1.72;
    color: rgba(255, 255, 255, 0.70);
    text-wrap: pretty;

    &:last-of-type { margin-bottom: 28px; }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    font-size: 13px;
    font-weight: 600;
    color: $accent;
    text-decoration: none;
    background: rgba(226, 95, 44, 0.12);
    border: 1px solid rgba(226, 95, 44, 0.32);
    border-radius: 999px;
    transition: background 0.18s, border-color 0.18s;

    &:hover {
      background: rgba(226, 95, 44, 0.22);
      border-color: rgba(226, 95, 44, 0.55);
    }
    &:focus-visible {
      outline: 2px solid $accent;
      outline-offset: 3px;
      border-radius: 999px;
    }
  }

  // ── Right: laptop screenshot ───────────────────────────────────────────────
  &__visual {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  &__laptop {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 16px;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.08),
      0 8px 24px rgba(0, 0, 0, 0.22),
      0 32px 80px -16px rgba(0, 0, 0, 0.55);
    user-select: none;
    -webkit-user-drag: none;
  }

  &__caption {
    margin: 0;
    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.38);
    text-align: center;
    letter-spacing: 0.02em;
  }
}

// ── Pricing ───────────────────────────────────────────────────────────────────
.pricing {
  padding: 100px 0;
  background: $surface;
  border-top: 1px solid $border;

  &__grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    align-items: start;

    @media (max-width: 960px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 540px) { grid-template-columns: 1fr; }
  }

  &__footnote {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    gap: 7px;
    margin: 28px auto 0;
    max-width: 580px;
    font-size: 13px;
    line-height: 1.5;
    color: $ink-muted;
    text-align: center;

    svg { flex-shrink: 0; margin-top: 1px; color: $ink-subtle; }
  }
}

.plan {
  position: relative;
  padding: 28px 22px;
  background: $bg;
  border: 1px solid $border;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &--featured {
    background: $dark;
    border-color: $dark;
    box-shadow: 0 12px 40px -12px rgba(0,0,0,0.30);

    .plan__name   { color: rgba(255,255,255,0.5); }
    .plan__amount { color: #fff; }
    .plan__period { color: rgba(255,255,255,0.4); }
    .plan__tagline{ color: rgba(255,255,255,0.5); }
    .plan__features li { color: rgba(255,255,255,0.72); }
    .plan__features svg { color: $accent; }
  }

  &__badge {
    position: absolute;
    top: -13px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    background: $accent;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 13px;
    border-radius: 999px;
  }

  &__head { display: flex; flex-direction: column; gap: 6px; }

  &__name {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: $ink-muted;
  }

  &__price {
    display: flex;
    align-items: baseline;
    gap: 3px;
  }

  &__amount {
    font-size: 30px;
    font-weight: 800;
    color: $ink;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  &__period {
    font-size: 13px;
    font-weight: 500;
    color: $ink-muted;
  }

  &__tagline {
    margin: 0;
    font-size: 12.5px;
    line-height: 1.45;
    color: $ink-muted;
    text-wrap: pretty;
  }

  &__features {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 9px;
    flex: 1;

    li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      line-height: 1.4;
      color: $ink-2;
    }

    svg {
      flex-shrink: 0;
      margin-top: 1px;
      color: $accent;
    }
  }
}

// ── Dark CTA section ──────────────────────────────────────────────────────────
.cta-dark {
  background: $dark;
  overflow: hidden;

  &__inner {
    max-width: 520px;
    margin: 0 auto;
    text-align: center;
    padding: 72px 0;
  }

  // Pulsing dot + label
  &__label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.45);
    margin-bottom: 22px;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: $accent;
    flex-shrink: 0;
    box-shadow: 0 0 0 0 rgba(226,95,44,0.6);
    animation: ctaDotPulse 2.4s ease-out infinite;
  }

  &__title {
    margin: 0 0 18px;
    font-size: clamp(32px, 4.4vw, 54px);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1.06;
    color: #fff;
    text-wrap: balance;

    em {
      font-family: 'Instrument Serif', 'Georgia', serif;
      font-style: italic;
      font-weight: 400;
      color: $accent;
      letter-spacing: -0.01em;
    }
  }

  &__lead {
    margin: 0 0 40px;
    font-size: 16px;
    line-height: 1.65;
    color: rgba(255,255,255,0.48);
    text-wrap: pretty;
  }
}

@keyframes ctaDotPulse {
  0%   { box-shadow: 0 0 0 0 rgba(226,95,44,0.55); }
  60%  { box-shadow: 0 0 0 7px rgba(226,95,44,0); }
  100% { box-shadow: 0 0 0 0 rgba(226,95,44,0); }
}

// ── Marquee strips ────────────────────────────────────────────────────────────
// True seamless loop: [...images, ...images] → translateX(-50%) = one full set.
// Fade masks at both edges hide the loop point on large screens.
.cta-marquee {
  position: relative;
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  overflow: hidden;
  padding: 12px 0;
  border-top: 1px solid rgba(255,255,255,0.06);

  // Left + right fade — hides the seam, adds depth
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0; bottom: 0;
    width: 140px;
    z-index: 2;
    pointer-events: none;
  }
  &::before {
    left: 0;
    background: linear-gradient(to right, $dark 0%, transparent 100%);
  }
  &::after {
    right: 0;
    background: linear-gradient(to left, $dark 0%, transparent 100%);
  }

  &__track {
    display: flex;
    gap: 10px;
    width: max-content;
    // Loop: translateX(-50%) moves exactly one full set of images offscreen
    // and the second (identical) copy seamlessly fills the gap.
    animation: ctaMarquee 36s linear infinite;
  }

  &__img {
    width: 86px;
    height: 116px;
    object-fit: cover;
    border-radius: 10px;
    flex-shrink: 0;
    opacity: 0.72;
    transition: opacity 0.2s;

    &:hover { opacity: 0.95; }
  }
}

@keyframes ctaMarquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

@media (prefers-reduced-motion: reduce) {
  .cta-marquee__track { animation-play-state: paused; }
  .cta-dark__dot { animation: none; }
}

// ── CTA standalone form ───────────────────────────────────────────────────────
.cta-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;

  &__input {
    width: 100%;
    height: 54px;
    padding: 0 20px;
    background: rgba(255, 255, 255, 0.07);
    border: 1.5px solid rgba(255, 255, 255, 0.14);
    border-radius: 12px;
    font: inherit;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
    outline: 0;
    transition: border-color 0.18s, box-shadow 0.18s;

    &::placeholder { color: rgba(255, 255, 255, 0.32); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &:focus {
      border-color: $accent;
      box-shadow: 0 0 0 3px rgba(226, 95, 44, 0.25);
    }

    @media (max-width: 480px) { font-size: 16px; } // prevent iOS zoom
  }

  &__btn {
    width: 100%;
    height: 54px;
    font-size: 15px;
    font-weight: 700;
    border-radius: 12px;
  }

  &__note {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.35);
    text-align: center;

    &--error { color: #fca5a5; }
  }
}

// ── Footer ────────────────────────────────────────────────────────────────────
.footer {
  background: $dark;
  border-top: 1px solid rgba(255,255,255,0.06);
  padding: 28px 0;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    flex-wrap: wrap;

    @media (max-width: 580px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  }

  &__brand {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: rgba(255,255,255,0.45);

    em { font-style: normal; color: $accent; }
  }

  &__copy {
    margin: 0;
    font-size: 12px;
    color: rgba(255,255,255,0.28);
  }

  &__links {
    display: flex;
    gap: 18px;

    a, :deep(a) {
      font-size: 12px;
      font-weight: 500;
      color: rgba(255,255,255,0.35);
      text-decoration: none;
      transition: color 0.15s;

      &:hover { color: rgba(255,255,255,0.7); }
      &:focus-visible { outline: 2px solid $accent; outline-offset: 2px; border-radius: 2px; }
    }
  }
}

// ── Reduced motion ────────────────────────────────────────────────────────────
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; }
}

</style>
