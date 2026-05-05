<template>
  <section class="page-root">

    <header class="site-header">
      <div class="container nav">
        <a class="brand" href="#">Wall<span>Art</span>Room</a>
        <nav class="nav-links">
          <a href="#how">How it works</a>
          <a href="#visualizer">Visualizer</a>
          <a href="#journal">Journal</a>
        </nav>
        <a class="btn btn-nav" href="#visualizer">Try free</a>
      </div>
    </header>

    <main>

      <!-- ════ 1 · HERO · BEFORE/AFTER ════ -->
      <section class="hero" id="showcase">
        <div class="hero-orb hero-orb-1" aria-hidden="true"></div>
        <div class="hero-orb hero-orb-2" aria-hidden="true"></div>

        <div class="container hero-grid">
          <div class="hero-copy">
            <span class="eyebrow">Wall Art Visualizer</span>
            <h1>See your art on your wall<br><em>before you hang it</em></h1>
            <p class="hero-lead">
              Upload your room, drop in any piece, and preview a true-to-scale render in seconds —
              with palette analysis baked in.
            </p>
            <div class="actions">
              <a class="btn btn-primary" href="#visualizer">
                Try the Visualizer
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
              <a class="btn btn-ghost" href="#how">How it works</a>
            </div>
            <ul class="hero-feats">
              <li><span class="hf-dot"></span>True-to-scale rendering</li>
              <li><span class="hf-dot"></span>Smart palette harmony</li>
              <li><span class="hf-dot"></span>Any room, any wall</li>
            </ul>
          </div>

          <div
            class="hero-compare"
            ref="compareEl"
            @pointerdown="startDrag"
            @pointermove="onDrag"
            @pointerup="endDrag"
            @pointercancel="endDrag"
            @pointerleave="endDrag"
          >
            <div class="hc-stage">
              <!-- BEFORE: empty wall -->
              <div class="hc-layer hc-before" aria-hidden="true">
                <img class="hc-room" src="@@/assets/images/showcase-empty-wall.png" alt="" />
                <div class="hc-tag hc-tag-before">Before</div>
              </div>

              <!-- AFTER: artwork placed -->
              <div class="hc-layer hc-after" :style="{ clipPath: `inset(0 0 0 ${pos}%)` }" aria-hidden="true">
                <img class="hc-room" src="@@/assets/images/showcase.png" alt="" />
                <div class="hc-tag hc-tag-after">After</div>
              </div>

              <!-- Divider + handle -->
              <div class="hc-divider" :style="{ left: `${pos}%` }">
                <button class="hc-handle" type="button" aria-label="Drag to compare">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 6l-5 6 5 6M15 6l5 6-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>

              <div class="hc-hint" v-if="!hasInteracted">Drag to compare</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ════ 2 · MARQUEE ════ -->
      <div class="marquee-strip" aria-hidden="true">
        <div class="marquee-track">
          <span class="mq-item">Photorealistic Preview</span><span class="mq-sep">✦</span>
          <span class="mq-item">Instant Placement</span><span class="mq-sep">✦</span>
          <span class="mq-item">Color Harmony</span><span class="mq-sep">✦</span>
          <span class="mq-item">True to Scale</span><span class="mq-sep">✦</span>
          <span class="mq-item">Any Room</span><span class="mq-sep">✦</span>
          <span class="mq-item">Zero Guesswork</span><span class="mq-sep">✦</span>
          <span class="mq-item">18-Second Previews</span><span class="mq-sep">✦</span>
          <span class="mq-item">Decide with Confidence</span><span class="mq-sep">✦</span>
          <span class="mq-item">Photorealistic Preview</span><span class="mq-sep">✦</span>
          <span class="mq-item">Instant Placement</span><span class="mq-sep">✦</span>
          <span class="mq-item">Color Harmony</span><span class="mq-sep">✦</span>
          <span class="mq-item">True to Scale</span><span class="mq-sep">✦</span>
          <span class="mq-item">Any Room</span><span class="mq-sep">✦</span>
          <span class="mq-item">Zero Guesswork</span><span class="mq-sep">✦</span>
          <span class="mq-item">18-Second Previews</span><span class="mq-sep">✦</span>
          <span class="mq-item">Decide with Confidence</span><span class="mq-sep">✦</span>
        </div>
      </div>

      <!-- ════ 3 · STATS ════ -->
      <div class="stats-strip">
        <div class="container stats-row">
          <div class="stat reveal">
            <span class="stat-num" data-target="2400" data-suffix="+" data-comma>0</span>
            <span class="stat-label">Rooms visualized</span>
          </div>
          <div class="stat-sep" aria-hidden="true"></div>
          <div class="stat reveal" style="--delay:80ms">
            <span class="stat-num" data-target="18" data-suffix=" sec">0</span>
            <span class="stat-label">Avg. to first preview</span>
          </div>
          <div class="stat-sep" aria-hidden="true"></div>
          <div class="stat reveal" style="--delay:160ms">
            <span class="stat-num" data-target="4.8" data-suffix=" / 5" data-decimal>0</span>
            <span class="stat-label">Collector satisfaction</span>
          </div>
        </div>
      </div>

      <!-- ════ 4 · HOW IT WORKS ════ -->
      <section class="section how-section" id="how">
        <div class="container">
          <div class="how-layout">

            <div class="how-left reveal">
              <span class="eyebrow">The Process</span>
              <h2>From blank wall<br>to <em>perfect placement</em></h2>
              <p class="how-sub">Three steps. Zero guesswork.</p>
            </div>

            <div class="how-steps">
              <div class="how-step reveal">
                <div class="step-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div class="step-content">
                  <span class="step-num">01</span>
                  <div class="step-body">
                    <h3>Upload your room</h3>
                    <p>Photograph your wall or choose from sample interiors. The visualizer adapts to any space.</p>
                  </div>
                </div>
              </div>
              <div class="how-step reveal" style="--delay:80ms">
                <div class="step-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0-5 5M4 16v4m0 0h4m-4 0 5-5m11 5-5-5m5 5v-4m0 4h-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div class="step-content">
                  <span class="step-num">02</span>
                  <div class="step-body">
                    <h3>Place the artwork</h3>
                    <p>Browse the collection or upload your own piece. Drag, scale, and reposition in real time.</p>
                  </div>
                </div>
              </div>
              <div class="how-step reveal" style="--delay:160ms">
                <div class="step-ico">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div class="step-content">
                  <span class="step-num">03</span>
                  <div class="step-body">
                    <h3>Commit with confidence</h3>
                    <p>See the piece at real scale with accurate proportions. Order once. Get it right.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ════ 5 · PLACEMENT DEMO ════ -->
      <section class="section placement-section" id="visualizer">
        <div class="container">
          <div class="placement-layout">

            <div class="placement-content reveal">
              <span class="eyebrow">Live Demo</span>
              <h2>Watch artwork<br><em>find its place</em></h2>
              <p>Place any piece on your wall in real proportions — accounting for scale, lighting, and color harmony with your existing interior.</p>
              <ul class="placement-feats">
                <li><span class="pf-dot"></span>True-to-life scale rendering</li>
                <li><span class="pf-dot"></span>Drag, resize, and reposition freely</li>
                <li><span class="pf-dot"></span>Instant color harmony analysis</li>
              </ul>
              <div class="actions" style="margin-top:32px">
                <a class="btn btn-primary" href="#visualizer">
                  Open Visualizer
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </a>
              </div>
            </div>

            <div class="placement-demo reveal" style="--delay:120ms">
              <div class="demo-shell">
                <div class="demo-bar">
                  <div class="demo-dots"><span></span><span></span><span></span></div>
                  <div class="demo-bar-title">WallArtRoom · Visualizer</div>
                  <div class="demo-chips">
                    <span class="demo-chip">Upload Room</span>
                    <span class="demo-chip demo-chip--active">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 4v16m-8-8h16" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
                      Place Art
                    </span>
                  </div>
                </div>
                <div class="demo-canvas">
                  <img class="demo-room" src="@@/assets/images/image.png" alt="" />
                  <!-- <div class="demo-gl demo-gl-h"></div>
                  <div class="demo-gl demo-gl-v"></div>
                  <div class="demo-art">
                    <img src="@@/assets/images/showcase.png" alt="" />
                    <span class="da-handle da-tl"></span>
                    <span class="da-handle da-tr"></span>
                    <span class="da-handle da-bl"></span>
                    <span class="da-handle da-br"></span>
                    <div class="da-badge">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      Perfect fit
                    </div>
                  </div> -->
                  <div class="demo-palette">
                    <div class="dp-head">Palette match</div>
                    <div class="dp-swatches">
                      <span class="dp-sw" style="--c:#8b7355;--i:0"></span>
                      <span class="dp-sw" style="--c:#c5a059;--i:1"></span>
                      <span class="dp-sw" style="--c:#4a3f35;--i:2"></span>
                      <span class="dp-sw" style="--c:#d4b896;--i:3"></span>
                    </div>
                    <div class="dp-match">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#7dc97d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      Harmonious
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ════ 6 · BENTO ════ -->
      <section class="section bento-section">
        <div class="container">
          <div class="bento-header reveal">
            <span class="eyebrow">Features</span>
            <h2>Built for the moment<br>of <em>decision</em></h2>
          </div>
          <div class="bento-grid">

            <div class="bento-card bento-tall reveal">
              <span class="bento-tag">Visualization</span>
              <h3>Photorealistic wall preview in your actual space</h3>
              <p>Accurate lighting, scale, and shadow rendered from your room photo.</p>
              <div class="bento-visual">
                <img src="@@/assets/images/showcase.png" alt="Wall visualization preview"/>
                <div class="bv-live"><span class="bv-dot"></span>Rendered live</div>
              </div>
            </div>

            <div class="bento-card bento-speed reveal" style="--delay:80ms">
              <span class="bento-tag">Speed</span>
              <h3>First preview under 30 seconds</h3>
              <p>Upload a photo, choose a piece. The result appears before doubt sets in.</p>
              <div class="speed-demo">
                <div class="sd-track"><div class="sd-fill"></div></div>
                <div class="sd-labels">
                  <span>Upload</span>
                  <span class="sd-ready">✦ Preview ready</span>
                </div>
                <div class="sd-time">18 sec avg.</div>
              </div>
            </div>

            <div class="bento-card bento-color reveal" style="--delay:160ms">
              <span class="bento-tag">Color</span>
              <h3>Palette harmony</h3>
              <p>See how each artwork's tones interact with your existing interior.</p>
              <div class="color-row">
                <span class="cr-sw" style="--c:#8b7355;--i:0"></span>
                <span class="cr-sw" style="--c:#c5a059;--i:1"></span>
                <span class="cr-sw" style="--c:#4a3f35;--i:2"></span>
                <span class="cr-sw" style="--c:#d4b896;--i:3"></span>
                <span class="cr-sw" style="--c:#f0e8da;--i:4"></span>
                <span class="cr-sw" style="--c:#2d2926;--i:5"></span>
              </div>
            </div>

            <div class="bento-card bento-sm reveal" style="--delay:240ms">
              <span class="bento-tag">Scale</span>
              <h3>Any room, any wall</h3>
              <p>Textured plaster, painted brick, white linen — the tool adapts.</p>
            </div>

          </div>
        </div>
      </section>

      <!-- ════ 7 · QUOTE ════ -->
      <section class="quote-section" id="journal">
        <div class="container quote-wrap">
          <div class="quote-star reveal">✦</div>
          <blockquote class="reveal" style="--delay:60ms">"Art is not just a visual filler; it is the atmospheric anchor of a home. We believe the future of curation lies in the fusion of human intent and digital precision."</blockquote>
          <div class="quote-source reveal" style="--delay:120ms">— The WallArtRoom</div>
        </div>
      </section>

      <!-- ════ 8 · CTA ════ -->
      <section class="cta-section">
        <div class="cta-orb cta-orb-1" aria-hidden="true"></div>
        <div class="cta-orb cta-orb-2" aria-hidden="true"></div>
        <div class="container">
          <div class="cta-inner reveal">
            <div class="cta-content">
              <span class="eyebrow cta-eyebrow">Get started</span>
              <h2>Your wall deserves a decision,<br><em>not a guess</em></h2>
              <p>Free to use. No account needed to preview your first artwork.</p>
              <div class="actions">
                <a class="btn btn-primary-inv" href="#visualizer">
                  Open the Visualizer
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-5-5l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </a>
                <a class="btn btn-outline-inv" href="#how">See how it works</a>
              </div>
            </div>
            <div class="cta-deco" aria-hidden="true">
              <div class="cta-ring r1"></div>
              <div class="cta-ring r2"></div>
              <div class="cta-ring r3"></div>
              <span class="cta-glyph">✦</span>
            </div>
          </div>
        </div>
      </section>

    </main>

    <footer>
      <div class="container footer-grid">
        <div class="tmp-grid">
          <div class="w50">
            <div class="footer-brand">WallArtRoom</div>
            <div class="footer-copy footer-left">
              Refining the digital art landscape through sophisticated curation and architectural visualization.
            </div>
          </div>
          <div class="footer-copy">© 2026 The WallArtRoom. All rights reserved. Crafted for the modern collector.</div>
        </div>
      </div>
    </footer>

  </section>
</template>


<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const compareEl     = ref(null)
const pos           = ref(100)         // 100 = fully "before", 0 = fully "after"
const hasInteracted = ref(false)

let observer = null
let dragging = false
let introRaf = null

const setFromX = (clientX) => {
  const el = compareEl.value
  if (!el) return
  const r = el.getBoundingClientRect()
  const p = ((clientX - r.left) / r.width) * 100
  pos.value = Math.max(0, Math.min(100, p))
}

const startDrag = (e) => {
  if (introRaf) { cancelAnimationFrame(introRaf); introRaf = null }
  hasInteracted.value = true
  dragging = true
  compareEl.value?.setPointerCapture?.(e.pointerId)
  setFromX(e.clientX)
}
const onDrag = (e) => { if (dragging) setFromX(e.clientX) }
const endDrag = (e) => {
  dragging = false
  try { compareEl.value?.releasePointerCapture?.(e.pointerId) } catch {}
}

onMounted(() => {
  // ── Scroll-reveal ─────────────────────────────────────────────────
  observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-revealed')
        observer.unobserve(e.target)
      }
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' })
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

  // ── Animated counters ─────────────────────────────────────────────
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return
      const el      = e.target
      const target  = parseFloat(el.dataset.target)
      const suffix  = el.dataset.suffix || ''
      const decimal = 'decimal' in el.dataset
      const comma   = 'comma' in el.dataset
      let startTs   = null
      const duration = 1600
      const tick = ts => {
        if (!startTs) startTs = ts
        const p     = Math.min((ts - startTs) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        const cur   = target * eased
        if (decimal)     el.textContent = cur.toFixed(1) + suffix
        else if (comma)  el.textContent = Math.floor(cur).toLocaleString() + suffix
        else             el.textContent = Math.floor(cur) + suffix
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      counterObs.unobserve(el)
    })
  }, { threshold: 0.6 })
  document.querySelectorAll('.stat-num[data-target]').forEach(el => counterObs.observe(el))

  // ── Compare-slider intro: sweep 100 → 50 (easeOutCubic) ──────────
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) { pos.value = 50; return }

  const from = 100, to = 50, duration = 1500
  let startTs = null
  const tick = (ts) => {
    if (hasInteracted.value) { introRaf = null; return }
    if (!startTs) startTs = ts + 600   // brief delay before sweep
    const elapsed = ts - startTs
    if (elapsed < 0) { introRaf = requestAnimationFrame(tick); return }
    const p = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - p, 3)
    pos.value = from + (to - from) * eased
    if (p < 1) introRaf = requestAnimationFrame(tick)
    else introRaf = null
  }
  introRaf = requestAnimationFrame(tick)
})

onUnmounted(() => {
  if (introRaf) cancelAnimationFrame(introRaf)
  observer?.disconnect()
})
</script>


<style lang="scss">

/* ─── Design tokens ──────────────────────────────────────────────── */
:root {
  --primary:    #c5a059;
  --secondary:  #2d2926;
  --neutral:    #f5f2ed;
  --neutral-2:  #ece7df;
  --text:       #2d2926;
  --muted:      #7d7367;
  --white:      #ffffff;
  --border:     #d8d0c5;
  --shadow:     0 18px 40px rgba(45,41,38,.09);
  --radius:     24px;
  --container:  min(1180px, calc(100vw - 40px));
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
}

/* ─── Reset ──────────────────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: "Manrope", system-ui, sans-serif;
  color: var(--text);
  background: var(--neutral);
  line-height: 1.55;
}
img { max-width: 100%; display: block; }
a { text-decoration: none; color: inherit; }
button, input { font: inherit; }

/* ─── Utilities ──────────────────────────────────────────────────── */
.container { width: var(--container); margin: 0 auto; }

.eyebrow {
  display: inline-block;
  letter-spacing: .26em;
  text-transform: uppercase;
  font-size: .66rem;
  color: #9a8c77;
  margin-bottom: 14px;
}

.section { padding: 96px 0; }

/* ─── Reveal ─────────────────────────────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(26px);
  transition:
    opacity  0.72s var(--ease-out) var(--delay, 0ms),
    transform 0.72s var(--ease-out) var(--delay, 0ms);
}
.reveal.is-revealed { opacity: 1; transform: translateY(0); }

/* ─── Navigation ─────────────────────────────────────────────────── */
.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  background: rgba(245,242,237,.84);
  border-bottom: 1px solid rgba(216,208,197,.65);
}
.nav {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.brand {
  font-family: "Noto Serif", Georgia, serif;
  font-size: 1.38rem;
  white-space: nowrap;
  letter-spacing: -.01em;
  span { color: #c5a059; }
}
.nav-links {
  display: flex;
  gap: 26px;
  color: var(--muted);
  font-size: .9rem;
  a { transition: color .2s ease; &:hover { color: var(--secondary); } }
}
.btn-nav {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: .84rem;
  font-weight: 600;
  color: var(--secondary);
  background: rgba(255,255,255,.5);
  transition: background .22s ease, color .22s ease, border-color .22s ease;
  &:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
}

/* ─── Buttons ────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 24px;
  border-radius: 13px;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: .93rem;
  cursor: pointer;
  transition: transform .22s var(--ease-out), box-shadow .22s ease;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,.12) 50%, transparent 60%);
    transform: translateX(-100%);
    transition: transform 0s;
  }
  &:hover::after {
    transform: translateX(200%);
    transition: transform 0.55s ease;
  }
}
.btn-primary {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 8px 24px rgba(140,108,37,.2);
  &:hover { transform: translateY(-2px); box-shadow: 0 14px 32px rgba(140,108,37,.28); }
}
.btn-primary-inv {
  background: #f5f2ed;
  color: var(--secondary);
  box-shadow: 0 8px 24px rgba(45,41,38,.14);
  &:hover { transform: translateY(-2px); }
}
.btn-outline-inv {
  background: transparent;
  color: rgba(245,242,237,.65);
  border-color: rgba(245,242,237,.18);
  &:hover { background: rgba(245,242,237,.08); color: #f5f2ed; transform: translateY(-2px); }
}
.actions { display: flex; gap: 12px; flex-wrap: wrap; }


/* ════════════════════════════════════════════════════════════════════
   1 · HERO · BEFORE/AFTER COMPARE
═══════════════════════════════════════════════════════════════════ */
.hero {
  position: relative;
  padding: 72px 0 96px;
  overflow: hidden;
}
.hero-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(2px);
}
.hero-orb-1 {
  width: 520px; height: 520px;
  top: -180px; right: -120px;
  background: radial-gradient(circle, rgba(197,160,89,.18), transparent 70%);
}
.hero-orb-2 {
  width: 360px; height: 360px;
  bottom: -140px; left: -80px;
  background: radial-gradient(circle, rgba(197,160,89,.08), transparent 70%);
}

.hero-grid {
  display: grid;
  grid-template-columns: 1fr 1.18fr;
  gap: 64px;
  align-items: center;
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 200px);
}

.hero-copy {
  h1 {
    font-family: "Noto Serif", Georgia, serif;
    font-size: clamp(2.4rem, 4.4vw, 4.2rem);
    line-height: .98;
    font-weight: 500;
    letter-spacing: -.03em;
    margin: 14px 0 22px;
    color: var(--secondary);
    em { font-style: italic; font-weight: 400; color: var(--primary); }
  }
  .hero-lead {
    font-size: 1.02rem;
    line-height: 1.65;
    color: var(--muted);
    margin: 0 0 28px;
    max-width: 460px;
  }
}

.btn-ghost {
  background: transparent;
  color: var(--secondary);
  border-color: var(--border);
  &:hover { background: rgba(255,255,255,.6); transform: translateY(-2px); }
}

.hero-feats {
  list-style: none;
  padding: 0;
  margin: 32px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: .82rem;
    color: var(--secondary);
  }
}
.hf-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}

/* ── Compare slider ── */
.hero-compare {
  position: relative;
  width: 100%;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 36px 80px rgba(45,41,38,.18), 0 0 0 1px rgba(45,41,38,.06);
  background: #1c1814;
  touch-action: none;
  user-select: none;
  cursor: ew-resize;
}
.hc-stage {
  position: relative;
  aspect-ratio: 4 / 5;
  width: 100%;
}
.hc-layer {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.hc-layer .hc-room {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}
.hc-after { will-change: clip-path; }

.hc-tag {
  position: absolute;
  top: 14px;
  font-size: .56rem;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: rgba(255,255,255,.92);
  background: rgba(18,15,12,.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,.14);
}
.hc-tag-before { left: 14px; }
.hc-tag-after  { right: 14px; }

.hc-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255,255,255,.92);
  transform: translateX(-50%);
  pointer-events: none;
  box-shadow: 0 0 14px rgba(0,0,0,.35);
}
.hc-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px; height: 44px;
  border-radius: 50%;
  background: var(--primary);
  border: 3px solid #fff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ew-resize;
  pointer-events: auto;
  box-shadow: 0 8px 22px rgba(0,0,0,.35);
  transition: transform .2s var(--ease-out);

  &:hover { transform: translate(-50%, -50%) scale(1.06); }
  &:active { transform: translate(-50%, -50%) scale(.96); }
}

.hc-hint {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: .58rem;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: rgba(255,255,255,.7);
  background: rgba(18,15,12,.55);
  backdrop-filter: blur(8px);
  padding: 6px 12px;
  border-radius: 100px;
  border: 1px solid rgba(255,255,255,.12);
  pointer-events: none;
  animation: hc-hint-pulse 2.4s ease-in-out infinite;
}
@keyframes hc-hint-pulse {
  0%, 100% { opacity: .6; }
  50%      { opacity: 1; }
}


/* ════════════════════════════════════════════════════════════════════
   2 · MARQUEE
═══════════════════════════════════════════════════════════════════ */
.marquee-strip {
  background: var(--secondary);
  overflow: hidden;
  padding: 15px 0;
  border-top: 1px solid rgba(255,255,255,.04);
}
.marquee-track {
  display: flex;
  white-space: nowrap;
  width: max-content;
  animation: marquee 40s linear infinite;
}
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.mq-item {
  padding: 0 30px;
  font-size: .67rem;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: rgba(245,242,237,.3);
}
.mq-sep {
  color: rgba(197,160,89,.45);
  font-size: .7rem;
  align-self: center;
}


/* ════════════════════════════════════════════════════════════════════
   3 · STATS
═══════════════════════════════════════════════════════════════════ */
.stats-strip {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 44px 0;
  background: rgba(255,255,255,.3);
}
.stats-row {
  display: flex;
  align-items: center;
}
.stat {
  flex: 1;
  text-align: center;
  padding: 4px 16px;
}
.stat-num {
  display: block;
  font-family: "Noto Serif", Georgia, serif;
  font-size: clamp(2rem, 3vw, 3rem);
  font-weight: 500;
  letter-spacing: -.04em;
  color: var(--secondary);
  line-height: 1;
  margin-bottom: 8px;
}
.stat-label {
  display: block;
  font-size: .68rem;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--muted);
}
.stat-sep {
  width: 1px; height: 46px;
  background: var(--border);
  flex-shrink: 0;
}


/* ════════════════════════════════════════════════════════════════════
   4 · HOW IT WORKS
═══════════════════════════════════════════════════════════════════ */
.how-section {
  .how-layout {
    display: grid;
    grid-template-columns: 1fr 1.65fr;
    gap: 72px;
    align-items: start;
  }

  .how-left {
    position: sticky;
    top: calc(72px + 48px);

    h2 {
      font-family: "Noto Serif", Georgia, serif;
      font-size: clamp(2rem, 3.2vw, 3.2rem);
      line-height: 1.06;
      font-weight: 500;
      letter-spacing: -.03em;
      margin: 0 0 14px;
      em { font-style: italic; font-weight: 400; color: var(--primary); }
    }
    .how-sub { font-size: .9rem; color: var(--muted); margin: 0; }
  }

  .how-steps { border-top: 1px solid var(--border); }

  .how-step {
    display: grid;
    grid-template-columns: 48px 1fr;
    gap: 20px;
    padding: 28px 0;
    border-bottom: 1px solid var(--border);
    align-items: start;
    cursor: default;
    transition: padding-left .3s var(--ease-out);

    &:hover {
      padding-left: 6px;
      .step-ico {
        border-color: var(--primary);
        color: var(--primary);
        background: rgba(197,160,89,.08);
        box-shadow: 0 0 0 4px rgba(197,160,89,.1);
      }
      .step-num { color: var(--primary); }
    }
  }

  .step-ico {
    width: 44px; height: 44px;
    border-radius: 12px;
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    background: rgba(255,255,255,.5);
    transition: border-color .28s ease, color .28s ease, background .28s ease, box-shadow .28s ease;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .step-content { display: flex; flex-direction: column; gap: 4px; }

  .step-num {
    font-family: "Noto Serif", Georgia, serif;
    font-size: .74rem;
    font-weight: 400;
    color: var(--muted);
    letter-spacing: .14em;
    transition: color .28s ease;
  }

  .step-body {
    h3 {
      font-family: "Noto Serif", Georgia, serif;
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0 0 7px;
      letter-spacing: -.01em;
    }
    p {
      font-size: .9rem;
      color: var(--muted);
      margin: 0;
      max-width: 380px;
      line-height: 1.65;
    }
  }
}


/* ════════════════════════════════════════════════════════════════════
   5 · PLACEMENT DEMO
═══════════════════════════════════════════════════════════════════ */
.placement-section {
  background: var(--neutral-2);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.placement-layout {
  display: grid;
  grid-template-columns: 1fr 1.35fr;
  gap: 72px;
  align-items: center;
}

.placement-content {
  h2 {
    font-family: "Noto Serif", Georgia, serif;
    font-size: clamp(1.9rem, 3vw, 3rem);
    font-weight: 500;
    line-height: 1.04;
    letter-spacing: -.03em;
    margin: 0 0 18px;
    em { font-style: italic; font-weight: 400; color: var(--primary); }
  }
  p {
    font-size: .95rem;
    color: var(--muted);
    line-height: 1.7;
    margin: 0 0 24px;
  }
}

.placement-feats {
  list-style: none;
  padding: 0; margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: .88rem;
    color: var(--secondary);
  }
}
.pf-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--primary);
  flex-shrink: 0;
}

/* Demo shell (app mockup) */
.demo-shell {
  background: #1c1814;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.07);
  box-shadow: 0 40px 80px rgba(0,0,0,.28), 0 0 0 1px rgba(0,0,0,.2);
}

.demo-bar {
  background: #241f1b;
  padding: 11px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}
.demo-dots {
  display: flex; gap: 5px;
  span {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(255,255,255,.13);
    &:first-child { background: rgba(255,96,89,.5); }
    &:nth-child(2) { background: rgba(255,190,46,.5); }
    &:nth-child(3) { background: rgba(36,201,60,.5); }
  }
}
.demo-bar-title {
  flex: 1;
  font-size: .64rem;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: rgba(255,255,255,.25);
  text-align: center;
}
.demo-chips { display: flex; gap: 6px; }
.demo-chip {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: .6rem;
  letter-spacing: .07em;
  color: rgba(255,255,255,.35);
  border: 1px solid rgba(255,255,255,.08);
  display: flex; align-items: center; gap: 4px;

  &--active {
    background: var(--primary);
    color: #fff;
    border-color: transparent;
  }
}

.demo-canvas {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16/10;
  background: #0e0c0a;
}
.demo-room {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
  opacity: .85;
}

/* Artwork frame */
.demo-art {
  position: absolute;
  width: 32%;
  aspect-ratio: 3/4;
  top: 10%;
  left: 50%;
  border: 2px solid rgba(255,255,255,.75);
  border-radius: 2px;
  overflow: visible;
  cursor: move;
  img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    border-radius: 1px;
  }
}
.da-handle {
  position: absolute;
  width: 8px; height: 8px;
  border: 2px solid var(--primary);
  background: #fff;
  border-radius: 2px;
}
.da-tl { top: -4px; left: -4px; }
.da-tr { top: -4px; right: -4px; }
.da-bl { bottom: -4px; left: -4px; }
.da-br { bottom: -4px; right: -4px; }

.da-badge {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--primary);
  color: #fff;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: .58rem;
  white-space: nowrap;
  display: flex; align-items: center; gap: 4px;
  letter-spacing: .06em;
  font-weight: 600;
}

/* Guide lines */
.demo-gl {
  position: absolute;
  background: rgba(197,160,89,.4);
  pointer-events: none;
}
.demo-gl-h { width: 100%; height: 1px; top: 38%; }
.demo-gl-v { width: 1px; height: 100%; left: 50%; top: 0; }

/* Palette panel */
.demo-palette {
  position: absolute;
  bottom: 12px; right: 12px;
  background: rgba(18,15,12,.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  padding: 10px 12px;
  min-width: 118px;
}
.dp-head {
  font-size: .54rem;
  letter-spacing: .15em;
  text-transform: uppercase;
  color: rgba(255,255,255,.32);
  margin-bottom: 7px;
}
.dp-swatches { display: flex; gap: 4px; margin-bottom: 7px; }
.dp-sw {
  width: 16px; height: 16px;
  border-radius: 4px;
  background: var(--c);
}
.dp-match {
  font-size: .58rem;
  color: #7dc97d;
  display: flex; align-items: center; gap: 3px;
  letter-spacing: .06em;
}

/* ── Desktop-only demo animations (triggered on reveal) ── */
@media (min-width: 769px) {
  .demo-art {
    opacity: 0;
    transform: translateX(-80%) translateY(-30%) scale(0.55) rotate(-4deg);
  }
  .demo-gl { opacity: 0; }
  .da-badge { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.85); }
  .demo-palette { opacity: 0; transform: translateY(10px); }
  .dp-sw { transform: scale(0) rotate(-15deg); }

  .placement-demo.is-revealed {
    .demo-art {
      animation: da-enter 1.8s cubic-bezier(0.16,1,0.3,1) 0.7s both;
    }
    .demo-gl {
      animation: gl-appear 0.4s ease 2.1s both;
    }
    .da-badge {
      animation: badge-appear 0.5s cubic-bezier(0.16,1,0.3,1) 2.3s both;
    }
    .demo-palette {
      animation: palette-appear 0.6s cubic-bezier(0.16,1,0.3,1) 2.5s both;
    }
    .dp-sw {
      animation: swatch-pop 0.5s cubic-bezier(0.16,1,0.3,1) calc(2.7s + var(--i) * 0.1s) both;
    }
  }
}

/* Show static state on mobile */
@media (max-width: 768px) {
  .demo-art { opacity: 1; transform: translateX(-50%) !important; }
  .demo-gl { opacity: 0.5; }
  .da-badge { opacity: 1; transform: translateX(-50%) !important; }
  .demo-palette { opacity: 1; transform: none !important; }
  .dp-sw { transform: scale(1) !important; }
}

@keyframes da-enter {
  from { opacity: 0; transform: translateX(-80%) translateY(-30%) scale(0.55) rotate(-4deg); }
  60%  { transform: translateX(-50%) translateY(2px) scale(1.04) rotate(0deg); opacity: 1; }
  to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1) rotate(0deg); }
}
@keyframes gl-appear {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes badge-appear {
  from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.85); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}
@keyframes palette-appear {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes swatch-pop {
  from { transform: scale(0) rotate(-15deg); }
  70%  { transform: scale(1.15) rotate(2deg); }
  to   { transform: scale(1) rotate(0); }
}


/* ════════════════════════════════════════════════════════════════════
   6 · BENTO
═══════════════════════════════════════════════════════════════════ */
.bento-section {
  .bento-header {
    margin-bottom: 40px;

    h2 {
      font-family: "Noto Serif", Georgia, serif;
      font-size: clamp(2rem, 3.4vw, 3.4rem);
      font-weight: 500;
      line-height: 1.04;
      letter-spacing: -.03em;
      margin: 0;
      em { font-style: italic; font-weight: 400; color: var(--primary); }
    }
  }

  .bento-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 14px;

    .bento-card:nth-child(1) { grid-column: 1; grid-row: 1 / 3; }
    .bento-card:nth-child(2) { grid-column: 2 / 4; grid-row: 1; }
    .bento-card:nth-child(3) { grid-column: 2; grid-row: 2; }
    .bento-card:nth-child(4) { grid-column: 3; grid-row: 2; }
  }

  .bento-card {
    background: rgba(255,255,255,.52);
    border: 1px solid rgba(216,208,197,.7);
    border-radius: var(--radius);
    padding: 28px;
    overflow: hidden;
    position: relative;
    transition: box-shadow .32s var(--ease-out), transform .32s var(--ease-out), border-color .32s ease;

    &:hover {
      box-shadow: 0 22px 52px rgba(45,41,38,.09);
      transform: translateY(-3px);
      border-color: rgba(197,160,89,.3);
    }

    .bento-tag {
      display: inline-block;
      font-size: .62rem;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 12px;
    }
    h3 {
      font-family: "Noto Serif", Georgia, serif;
      font-size: 1.15rem;
      font-weight: 500;
      line-height: 1.22;
      letter-spacing: -.02em;
      margin: 0 0 10px;
    }
    p { font-size: .87rem; color: var(--muted); margin: 0; line-height: 1.65; }
  }

  /* Tall card */
  .bento-tall {
    display: flex;
    flex-direction: column;
    h3 { font-size: 1.38rem; max-width: 260px; margin-bottom: 12px; }
    .bento-visual {
      flex: 1;
      margin-top: 22px;
      border-radius: 14px;
      overflow: hidden;
      min-height: 160px;
      position: relative;
      img { width: 100%; height: 100%; object-fit: cover; display: block; }
    }
  }

  .bv-live {
    position: absolute;
    bottom: 10px; left: 10px;
    background: rgba(18,15,12,.82);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 100px;
    padding: 5px 10px;
    font-size: .58rem;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: rgba(255,255,255,.7);
    display: flex; align-items: center; gap: 6px;
  }
  .bv-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #7dc97d;
    animation: bv-pulse 1.8s ease-in-out infinite;
  }
  @keyframes bv-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: .5; transform: scale(1.4); }
  }

  /* Speed card */
  .bento-speed {
    h3 { font-size: 1.22rem; max-width: 320px; }
  }
  .speed-demo { margin-top: 20px; }
  .sd-track {
    height: 5px;
    background: rgba(45,41,38,.08);
    border-radius: 100px;
    overflow: hidden;
    margin-bottom: 8px;
    position: relative;
  }
  .sd-fill {
    height: 100%;
    width: 0;
    background: linear-gradient(90deg, var(--primary), #e8c07a);
    border-radius: 100px;
    transition: width 1.4s cubic-bezier(0.16,1,0.3,1);
  }
  .bento-card.is-revealed .sd-fill { width: 72%; }
  .sd-labels {
    display: flex;
    justify-content: space-between;
    font-size: .6rem;
    letter-spacing: .09em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .sd-ready { color: var(--primary); }
  .sd-time {
    font-family: "Noto Serif", Georgia, serif;
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--secondary);
    margin-top: 12px;
    letter-spacing: -.04em;
  }

  /* Color card */
  .color-row {
    display: flex;
    gap: 7px;
    margin-top: 16px;
    flex-wrap: wrap;
  }
  .cr-sw {
    width: 34px; height: 34px;
    border-radius: 9px;
    background: var(--c);
    transform: scale(0) rotate(-18deg);
    transition: transform 0.5s cubic-bezier(0.16,1,0.3,1) calc(var(--i) * 70ms + 200ms);
  }
  .bento-card.is-revealed .cr-sw { transform: scale(1) rotate(0); }
}


/* ════════════════════════════════════════════════════════════════════
   7 · QUOTE
═══════════════════════════════════════════════════════════════════ */
.quote-section {
  background: #ded8d0;
  padding: 120px 0;
  position: relative;
  overflow: hidden;

  &::before, &::after {
    content: '✦';
    position: absolute;
    font-size: 12rem;
    color: rgba(197,160,89,.07);
    pointer-events: none;
    line-height: 1;
  }
  &::before { top: -40px; left: -40px; }
  &::after  { bottom: -40px; right: -40px; }
}
.quote-wrap {
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  padding: 0 8px;
  position: relative;
  z-index: 1;
}
.quote-star { color: #c8a96a; font-size: 1.4rem; margin-bottom: 24px; }
blockquote {
  margin: 0 auto 32px;
  font-family: "Noto Serif", Georgia, serif;
  font-style: italic;
  font-size: clamp(1.55rem, 2.8vw, 2.7rem);
  line-height: 1.16;
  letter-spacing: -.02em;
  max-width: 820px;
  color: #3a342d;
}
.quote-source {
  font-size: .76rem;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: #6d655b;
}


/* ════════════════════════════════════════════════════════════════════
   8 · CTA
═══════════════════════════════════════════════════════════════════ */
.cta-section {
  background: var(--secondary);
  padding: 96px 0;
  position: relative;
  overflow: hidden;

  .cta-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 40px;
  }

  .cta-content {
    max-width: 560px;
    position: relative;
    z-index: 1;

    h2 {
      font-family: "Noto Serif", Georgia, serif;
      font-size: clamp(2.2rem, 3.8vw, 3.8rem);
      font-weight: 500;
      line-height: .96;
      letter-spacing: -.03em;
      color: #f5f2ed;
      margin: 0 0 18px;
      em { font-style: italic; font-weight: 400; color: var(--primary); }
    }
    p {
      font-size: .96rem;
      color: rgba(245,242,237,.5);
      margin: 0 0 32px;
      max-width: 380px;
    }
  }

  .cta-eyebrow { color: rgba(197,160,89,.65); }
}

/* Ambient orbs */
.cta-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}
.cta-orb-1 {
  width: 560px; height: 560px;
  top: -160px; right: -100px;
  background: radial-gradient(circle, rgba(197,160,89,.12), transparent 70%);
}
.cta-orb-2 {
  width: 320px; height: 320px;
  bottom: -80px; left: 5%;
  background: radial-gradient(circle, rgba(197,160,89,.09), transparent 70%);
  animation: orb-drift 14s ease-in-out infinite;
}
@keyframes orb-drift {
  0%, 100% { transform: translateY(0) scale(1); }
  50%       { transform: translateY(-22px) scale(1.06); }
}

/* Animated rings decoration */
.cta-deco {
  flex-shrink: 0;
  position: relative;
  width: 160px; height: 160px;
  display: flex; align-items: center; justify-content: center;
}
.cta-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(197,160,89,.2);
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  animation: ring-pulse 4s ease-out infinite;
}
.r1 { width: 80px;  height: 80px; }
.r2 { width: 120px; height: 120px; animation-delay: .9s; }
.r3 { width: 160px; height: 160px; animation-delay: 1.8s; }
@keyframes ring-pulse {
  0%   { transform: translate(-50%,-50%) scale(1); opacity: .6; }
  100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
}
.cta-glyph {
  font-size: 2.2rem;
  color: rgba(197,160,89,.45);
  line-height: 1;
  position: relative;
  z-index: 1;
  animation: glyph-spin 20s linear infinite;
}
@keyframes glyph-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}


/* ════════════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════════ */
footer { padding: 36px 0 52px; }
.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr .9fr .9fr;
  gap: 30px;
  align-items: start;

  .tmp-grid {
    display: flex;
    grid-column: 1 / 4;

    .w50 {
      width: 50%;
      .footer-left {
        margin-top: 0;
        max-width: 360px;
        text-transform: none;
        letter-spacing: .05em;
        line-height: 1.7;
      }
    }
  }
}
.footer-brand { font-family: "Noto Serif", serif; font-style: italic; margin-bottom: 18px; }
.footer-copy { margin-top: 28px; font-size: .74rem; letter-spacing: .08em; text-transform: uppercase; color: #6f665b; }


/* ════════════════════════════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════════════════════════ */
@media (max-width: 1024px) {
  .bento-section {
    .bento-grid {
      grid-template-columns: 1.4fr 1fr;
      .bento-card:nth-child(1) { grid-column: 1; grid-row: 1 / 3; }
      .bento-card:nth-child(2) { grid-column: 2; grid-row: 1; }
      .bento-card:nth-child(3) { grid-column: 2; grid-row: 2; }
      .bento-card:nth-child(4) { grid-column: 1 / 3; grid-row: 3; }
    }
  }
}

@media (max-width: 900px) {
  .how-section {
    .how-layout { grid-template-columns: 1fr; gap: 40px; }
    .how-left { position: static; }
  }

  .placement-layout { grid-template-columns: 1fr; gap: 40px; }

  .cta-section .cta-deco { display: none; }
}

@media (max-width: 900px) {
  .hero {
    padding: 48px 0 72px;
    .hero-grid {
      grid-template-columns: 1fr;
      gap: 40px;
      min-height: auto;
    }
  }
  .hero-compare { max-width: 560px; margin: 0 auto; }
}

@media (max-width: 768px) {
  .section { padding: 68px 0; }

  .bento-section {
    .bento-grid {
      grid-template-columns: 1fr;
      .bento-card:nth-child(n) { grid-column: 1 !important; grid-row: auto !important; }
    }
  }

  .stats-row { flex-direction: column; gap: 24px; }
  .stat-sep { width: 48px; height: 1px; }

  .marquee-track { animation-duration: 26s; }

  .hc-handle { width: 38px; height: 38px; }
  .hc-tag { font-size: .52rem; padding: 5px 10px; }
}

@media (max-width: 640px) {
  :root { --container: min(100vw - 28px, 100vw - 28px); }
  .site-header { position: static; }
  .nav { min-height: auto; padding: 14px 0; flex-wrap: wrap; gap: 12px; }
  .nav-links { order: 3; width: 100%; justify-content: flex-start; flex-wrap: wrap; gap: 12px 16px; font-size: .88rem; }
  .btn-nav { display: none; }
  .actions { flex-direction: column; align-items: stretch; }
  .btn { width: 100%; }
  .footer-grid .tmp-grid { flex-direction: column; .w50 { width: 100%; } }
  .cta-section .cta-inner { flex-direction: column; }

  .demo-shell { border-radius: 14px; }
  .demo-bar-title { display: none; }
}

/* ── Reduced motion overrides ── */
@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
  .hc-hint, .marquee-track, .cta-orb-2, .cta-ring, .cta-glyph,
  .bv-dot { animation: none !important; }
  .demo-art { animation: none !important; opacity: 1 !important; transform: translateX(-50%) !important; }
  .demo-gl { opacity: .5 !important; animation: none !important; }
  .da-badge { animation: none !important; opacity: 1 !important; transform: translateX(-50%) !important; }
  .demo-palette { animation: none !important; opacity: 1 !important; transform: none !important; }
  .dp-sw, .cr-sw { animation: none !important; transform: scale(1) !important; }
  .sd-fill { transition: none !important; }
}

</style>
