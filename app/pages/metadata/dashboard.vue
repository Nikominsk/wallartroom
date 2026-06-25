<template>
  <div class="dash">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <header class="dash__head">
      <div>
        <h1 class="dash__title">Dashboard</h1>
        <p class="dash__sub">{{ totalPins }} pins in your pipeline</p>
      </div>
      <button
        class="dash__refresh"
        :class="{ 'dash__refresh--spin': status === 'pending' }"
        :disabled="status === 'pending'"
        title="Refresh"
        @click="refresh"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4a8 8 0 0 1 12 0M4 16a8 8 0 0 0 12 0"/>
          <polyline points="1 4 4 4 4 7"/>
          <polyline points="19 16 16 16 16 13"/>
        </svg>
      </button>
    </header>

    <!-- ── Skeleton ─────────────────────────────────────────────────────────── -->
    <template v-if="status === 'pending'">
      <div class="dash__skel-pipeline">
        <div v-for="n in 2" :key="n" class="dash__skel-kpi" />
      </div>
      <div class="dash__skel-row">
        <div class="dash__skel-card" style="height:232px" />
        <div class="dash__skel-card" style="height:232px" />
      </div>
      <div class="dash__skel-card" style="height:180px" />
    </template>

    <template v-else-if="data">

      <!-- ── Pipeline KPI cards ─────────────────────────────────────────────── -->
      <section class="dash__pipeline" aria-label="Pin status counts">
        <div
          v-for="s in pipelineCards"
          :key="s.key"
          class="dash__kpi"
          :style="{ '--c': s.color }"
        >
          <div class="dash__kpi-label">
            <div class="dash__kpi-dot" />
            {{ s.label }}
          </div>
          <div class="dash__kpi-count">{{ s.count }}</div>
          <div class="dash__kpi-sub">{{ s.pct }}% of total</div>
          <div v-if="s.note" class="dash__kpi-note">{{ s.note }}</div>
          <div class="dash__kpi-track">
            <div class="dash__kpi-fill" :style="{ width: `${Math.max(s.pct, 2)}%` }" />
          </div>
        </div>
      </section>

      <!-- ── Row 2: Board distribution  +  Publishing schedule ─────────────── -->
      <div class="dash__row2">

        <!-- Board distribution -->
        <div class="dash__card">
          <div class="dash__card-head">
            <span class="dash__card-title">Board Distribution</span>
            <span class="dash__card-meta">{{ data.boardCounts.length }} boards</span>
          </div>
          <template v-if="donutSlices.length">
            <div class="dash__donut-wrap">
              <svg viewBox="0 0 200 200" class="dash__donut-svg" aria-hidden="true">
                <circle cx="100" cy="100" r="70" fill="none" stroke="#f3f4f6" stroke-width="26" />
                <g transform="rotate(-90 100 100)">
                  <circle
                    v-for="(s, i) in donutSlices"
                    :key="i"
                    cx="100" cy="100" r="70"
                    fill="none"
                    :stroke="s.color"
                    stroke-width="24"
                    :stroke-dasharray="s.dasharray"
                    stroke-linecap="butt"
                  />
                </g>
                <text x="100" y="96" text-anchor="middle" class="dash__donut-num">{{ totalPins }}</text>
                <text x="100" y="114" text-anchor="middle" class="dash__donut-lbl">total pins</text>
              </svg>
              <div class="dash__donut-legend">
                <div v-for="s in donutSlices" :key="s.name" class="dash__legend-row">
                  <div class="dash__legend-dot" :style="{ background: s.color }" />
                  <span class="dash__legend-name" :title="s.name">{{ s.name }}</span>
                  <span class="dash__legend-pct">{{ s.pct }}%</span>
                  <span class="dash__legend-n">{{ s.count }}</span>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="dash__empty">No pins yet — upload images to get started.</div>
        </div>

        <!-- Publishing schedule (stacked bars) -->
        <div class="dash__card">
          <div class="dash__card-head">
            <span class="dash__card-title">Publishing Schedule</span>
            <div class="dash__card-head-right">
              <label class="dash__filter-check">
                <input type="checkbox" v-model="showOnlyExportedSchedule" />
                <span>Exported only</span>
              </label>
              <span class="dash__card-meta">next 6 weeks · {{ totalScheduled }} scheduled</span>
            </div>
          </div>
          <svg :viewBox="`0 0 420 ${BAR_BASELINE + 28}`" class="dash__bar-svg" aria-hidden="true">
            <defs>
              <clipPath
                v-for="(w, i) in barData"
                :id="`bc-${i}`"
                :key="`clip-${i}`"
              >
                <rect
                  v-if="w.barH > 0"
                  :x="w.cx - 20"
                  :y="BAR_BASELINE - w.barH"
                  width="40"
                  :height="w.barH"
                  rx="5"
                />
              </clipPath>
            </defs>
            <!-- grid lines at 33% and 66% -->
            <line v-for="pct in [1/3, 2/3]" :key="pct"
              x1="14" :y1="BAR_BASELINE - pct * BAR_MAX_H" x2="406" :y2="BAR_BASELINE - pct * BAR_MAX_H"
              stroke="#f0f0f0" stroke-width="1"
            />
            <line x1="14" :y1="BAR_BASELINE" x2="406" :y2="BAR_BASELINE" stroke="#e5e7eb" stroke-width="1" />
            <g v-for="(w, i) in barData" :key="i">
              <rect :x="w.cx - 20" y="14" width="40" :height="BAR_BASELINE - 14" rx="5" fill="#f9fafb" />
              <g v-if="w.count > 0" :clip-path="`url(#bc-${i})`">
                <rect
                  v-for="(r, ri) in w.rects"
                  :key="ri"
                  :x="r.x"
                  :y="r.y"
                  width="40"
                  :height="r.height"
                  :fill="r.color"
                />
              </g>
              <text
                v-if="w.count > 0"
                :x="w.cx"
                :y="w.barY - 5"
                text-anchor="middle"
                class="dash__bar-val"
              >{{ w.count }}</text>
              <text :x="w.cx" :y="BAR_BASELINE + 20" text-anchor="middle" class="dash__bar-lbl">{{ w.weekLabel }}</text>
            </g>
          </svg>
          <p v-if="totalScheduled === 0" class="dash__no-data">No pins scheduled for the next 6 weeks.</p>
        </div>

      </div>

      <!-- ── Upcoming pins — next 7 days ────────────────────────────────────── -->
      <div class="dash__card">
        <div class="dash__card-head">
          <span class="dash__card-title">Scheduled Next 7 Days</span>
          <div v-if="upcomingVisible" class="dash__card-head-right">
            <label class="dash__filter-check">
              <input type="checkbox" v-model="showOnlyExported" />
              <span>Exported only</span>
            </label>
            <span class="dash__card-meta">{{ filteredUpcomingPins.length }} pin{{ filteredUpcomingPins.length !== 1 ? 's' : '' }}</span>
            <div class="dash__up-arrows">
              <button
                class="dash__up-arrow"
                :disabled="scrollIndex === 0"
                aria-label="Scroll left"
                @click="scrollIndex = Math.max(0, scrollIndex - 3)"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7.5 2L3.5 6l4 4"/>
                </svg>
              </button>
              <button
                class="dash__up-arrow"
                :disabled="scrollIndex + 1 >= maxPinsPerDay"
                aria-label="Scroll right"
                @click="scrollIndex = Math.min(scrollIndex + 3, maxPinsPerDay - 1)"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4.5 2l4 4-4 4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Load gate: shown until the user requests the data -->
        <div v-if="!upcomingVisible" class="dash__up-gate">
          <button class="dash__up-gate-btn" type="button" @click="upcomingVisible = true">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="16" height="13" rx="1.5"/><path d="M2 8h16M6 2v4M14 2v4"/>
            </svg>
            Load next 7 days
          </button>
        </div>

        <template v-else-if="upcomingByDay.length">
          <div
            v-for="day in upcomingByDay"
            :key="day.key"
            class="dash__up-day"
          >
            <div class="dash__up-day-lbl">
              <div class="dash__up-day-name">{{ day.dayName }}</div>
              <div class="dash__up-day-date">{{ day.dateStr }}</div>
            </div>
            <div class="dash__up-strip-outer">
              <div
                class="dash__up-strip-inner"
                :style="{ transform: `translateX(-${scrollIndex * ITEM_W}px)` }"
              >
                <div
                  v-for="pin in day.pins"
                  :key="pin.image_id"
                  class="dash__up-pin"
                  :title="`${pin.title || '(No title)'}\n${pin.board || ''}`"
                >
                  <div class="dash__up-thumb">
                    <template v-if="pin.thumbnail_url">
                      <img
                        :src="pin.thumbnail_url"
                        :alt="pin.title || 'Pin'"
                        loading="lazy"
                        :style="{ opacity: thumbLoaded[pin.image_id] ? 1 : 0 }"
                        @load="thumbLoaded[pin.image_id] = true"
                        @error="thumbLoaded[pin.image_id] = true"
                      />
                      <div v-if="!thumbLoaded[pin.image_id]" class="dash__up-loading" aria-hidden="true">
                        <svg class="dash__up-spinner" width="20" height="20" viewBox="0 0 22 22" fill="none">
                          <circle cx="11" cy="11" r="8" stroke="#e5e7eb" stroke-width="2.5"/>
                          <path d="M11 3a8 8 0 0 1 8 8" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"/>
                        </svg>
                      </div>
                    </template>
                    <div v-else class="dash__up-placeholder">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="3"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                      </svg>
                    </div>
                  </div>
                  <div class="dash__up-time">{{ formatTime(pin.publish_date) }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="dash__empty">
          {{ showOnlyExported ? 'No exported pins scheduled in the next 7 days.' : 'No pins scheduled in the next 7 days.' }}
        </div>
      </div>

    </template>

    <div v-else-if="error" class="dash__error">
      Failed to load dashboard data.
      <button class="dash__error-btn" @click="refresh">Try again</button>
    </div>

    <!-- ── Pinterest API Tester — owner-only ────────────────────────────── -->
    <div v-if="isOwner" class="ptest">
      <div class="ptest__head">
        <div class="ptest__brand">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#E60023"/>
            <path fill="#fff" d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
          <span class="ptest__brand-name">Pinterest API Tester</span>
          <span class="ptest__badge">Trial</span>
        </div>
        <p class="ptest__desc">Test the Pinterest v5 API with your trial access token. Calls are proxied server-side.</p>
      </div>

      <!-- Token + environment row -->
      <div class="ptest__config">
        <div class="ptest__token-wrap">
          <label class="ptest__label">Access Token</label>
          <div class="ptest__token-row">
            <input
              v-model="ptToken"
              :type="ptShowToken ? 'text' : 'password'"
              class="ptest__token-input"
              placeholder="Paste your Pinterest access token…"
              autocomplete="off"
              spellcheck="false"
            />
            <button type="button" class="ptest__eye" :title="ptShowToken ? 'Hide' : 'Show'" @click="ptShowToken = !ptShowToken">
              <svg v-if="ptShowToken" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <div class="ptest__env-wrap">
          <label class="ptest__label">Environment</label>
          <div class="ptest__env-tabs">
            <button
              v-for="e in ['production', 'sandbox']"
              :key="e"
              type="button"
              class="ptest__env-tab"
              :class="{ 'ptest__env-tab--active': ptEnv === e }"
              @click="ptEnv = e"
            >{{ e }}</button>
          </div>
        </div>
      </div>

      <!-- Endpoint buttons -->
      <div class="ptest__actions">
        <button
          v-for="ep in ptEndpoints"
          :key="ep.key"
          type="button"
          class="ptest__action-btn"
          :class="{ 'ptest__action-btn--active': ptActiveEndpoint === ep.key, 'ptest__action-btn--loading': ptLoading && ptActiveEndpoint === ep.key }"
          :disabled="!ptToken.trim() || ptLoading"
          @click="ptRun(ep.key)"
        >
          <span class="ptest__action-method">GET</span>
          <span class="ptest__action-path">{{ ep.path }}</span>
          <svg v-if="ptLoading && ptActiveEndpoint === ep.key" class="ptest__action-spin" width="12" height="12" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#e5e7eb" stroke-width="2.5"/>
            <path d="M11 3a8 8 0 0 1 8 8" stroke="#E60023" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Status bar -->
      <div v-if="ptResult || ptError" class="ptest__status-bar" :class="ptError ? 'ptest__status-bar--err' : (ptResult?.ok ? 'ptest__status-bar--ok' : 'ptest__status-bar--err')">
        <template v-if="ptResult">
          <span class="ptest__status-code">{{ ptResult.status }}</span>
          <span class="ptest__status-text">{{ ptResult.statusText }}</span>
          <span class="ptest__status-sep">·</span>
          <span class="ptest__status-url">{{ ptResult.url }}</span>
          <span class="ptest__status-sep">·</span>
          <span class="ptest__status-ms">{{ ptResult.ms }}ms</span>
        </template>
        <template v-else>
          <span class="ptest__status-code">Error</span>
          <span class="ptest__status-text">{{ ptError }}</span>
        </template>
        <button type="button" class="ptest__status-clear" @click="ptResult = null; ptError = null">✕</button>
      </div>

      <!-- Response viewer -->
      <div v-if="ptResult" class="ptest__response">
        <div class="ptest__response-head">
          <span class="ptest__response-title">Response</span>
          <button type="button" class="ptest__copy-btn" @click="ptCopy">{{ ptCopied ? '✓ Copied' : 'Copy JSON' }}</button>
        </div>
        <pre class="ptest__json" v-html="ptHighlighted" />
      </div>
    </div>

  </div>
</template>

<script setup>
definePageMeta({ layout: 'metadata' })

const currentUser = useSupabaseUser()
const isOwner = computed(() => currentUser.value?.email === 'nniko.geuenich@gmail.com')

const FALLBACK_COLORS = ['#ff6b35', '#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6']
const STATUS_COLORS = {
  draft:    '#94a3b8',
  exported: '#f59e0b',
}

// lazy: navigate to the page immediately and load data async — the template
// already renders a skeleton while `status === 'pending'`.
const { data, status, error, refresh } = useFetch('/api/metadata/dashboard', { lazy: true })

// ── Board color map ────────────────────────────────────────────────────────

function autoColorForName(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % FALLBACK_COLORS.length
  return FALLBACK_COLORS[h]
}

const boardColorMap = computed(() => {
  if (!data.value) return {}
  const map = {}
  data.value.boardCounts.forEach((b) => {
    map[b.name] = b.name === '(No Board)'
      ? '#d1d5db'
      : (b.color ?? autoColorForName(b.name))
  })
  return map
})

function colorForBoard(name) {
  if (!name || name === '(No Board)') return '#d1d5db'
  return boardColorMap.value[name] ?? autoColorForName(name)
}

// ── Pipeline ───────────────────────────────────────────────────────────────

const totalPins = computed(() => {
  if (!data.value) return 0
  const sc = data.value.statusCounts
  return sc.draft + sc.exported
})

const pipelineCards = computed(() => {
  if (!data.value) return []
  const sc = data.value.statusCounts
  const tot = totalPins.value || 1
  return [
    { key: 'draft',    label: 'Draft',    color: STATUS_COLORS.draft,    count: sc.draft,    pct: Math.round(sc.draft    / tot * 100), note: `${data.value.scheduled} scheduled` },
    { key: 'exported', label: 'Exported', color: STATUS_COLORS.exported, count: sc.exported, pct: Math.round(sc.exported / tot * 100), note: null },
  ]
})

// ── Donut chart ────────────────────────────────────────────────────────────

const donutSlices = computed(() => {
  if (!data.value) return []
  const C = 2 * Math.PI * 70
  const boards = data.value.boardCounts
  const tot = boards.reduce((s, b) => s + b.count, 0)
  if (!tot) return []
  const GAP = boards.length > 1 ? 3 : 0
  let cumArc = 0
  return boards.map((b) => {
    const fullArc = (b.count / tot) * C
    const visArc  = Math.max(fullArc - GAP, 1)
    const rest    = Math.max(C - cumArc - visArc, 0)
    const dasharray = `0 ${cumArc.toFixed(2)} ${visArc.toFixed(2)} ${rest.toFixed(2)}`
    const color = boardColorMap.value[b.name] ?? autoColorForName(b.name)
    cumArc += fullArc
    return { name: b.name, count: b.count, color, dasharray, pct: Math.round((b.count / tot) * 100) }
  })
})

// ── Stacked bar chart ──────────────────────────────────────────────────────

// Bar chart layout constants — also used in the SVG template.
const BAR_MAX_H   = 152   // max bar height in SVG units
const BAR_BASELINE = 172  // y position of the zero line

const barData = computed(() => {
  if (!data.value) return []
  const weeks = data.value.weeklySchedule
  const exportedOnly = showOnlyExportedSchedule.value
  const max = Math.max(...weeks.map(w => exportedOnly ? (w.exportedCount ?? 0) : w.count), 1)

  return weeks.map((w, i) => {
    const count = exportedOnly ? (w.exportedCount ?? 0) : w.count
    const segsSource = exportedOnly ? (w.exportedSegments ?? []) : (w.segments ?? [])
    const cx = 52 + i * 64
    const totalBarH = (count / max) * BAR_MAX_H
    const barY = BAR_BASELINE - totalBarH

    const rects = []
    let yBottom = BAR_BASELINE
    const segs = [...segsSource].sort((a, b) => b.count - a.count)
    for (const seg of segs) {
      const segH = count > 0 ? (seg.count / count) * totalBarH : 0
      if (segH < 0.5) continue
      rects.push({ x: cx - 20, y: yBottom - segH, height: segH, color: colorForBoard(seg.name) })
      yBottom -= segH
    }

    return { ...w, count, cx, barY, barH: totalBarH, rects }
  })
})

const totalScheduled = computed(() => {
  if (!data.value) return 0
  const key = showOnlyExportedSchedule.value ? 'exportedCount' : 'count'
  return data.value.weeklySchedule.reduce((s, w) => s + (w[key] ?? 0), 0)
})


// ── Upcoming pins ──────────────────────────────────────────────────────────

const ITEM_W = 80 // 72px thumb + 8px gap

const showOnlyExportedSchedule = ref(true)
const showOnlyExported = ref(true)
const scrollIndex = ref(0)
const thumbLoaded = reactive({})
const upcomingVisible = ref(false)

watch(showOnlyExported, () => { scrollIndex.value = 0 })

const filteredUpcomingPins = computed(() => {
  const pins = data.value?.upcomingPins ?? []
  return showOnlyExported.value ? pins.filter(p => p.status === 'exported') : pins
})

const upcomingByDay = computed(() => {
  const byDay = new Map()
  for (const pin of filteredUpcomingPins.value) {
    const d = new Date(pin.publish_date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!byDay.has(key)) {
      byDay.set(key, {
        key,
        sortMs: d.getTime(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        pins: [],
      })
    }
    byDay.get(key).pins.push(pin)
  }
  return [...byDay.values()].sort((a, b) => a.sortMs - b.sortMs)
})

const maxPinsPerDay = computed(() =>
  upcomingByDay.value.reduce((m, d) => Math.max(m, d.pins.length), 0),
)

const canScrollRight = computed(() => scrollIndex.value < maxPinsPerDay.value - 1)

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ── Pinterest API Tester ───────────────────────────────────────────────────

const ptToken   = ref(import.meta.client ? (localStorage.getItem('pt_token') ?? '') : '')
const ptEnv     = ref('production')
const ptLoading = ref(false)
const ptResult  = ref(null)
const ptError   = ref(null)
const ptCopied  = ref(false)
const ptShowToken       = ref(false)
const ptActiveEndpoint  = ref(null)

watch(ptToken, v => { if (import.meta.client) localStorage.setItem('pt_token', v) })

const ptEndpoints = [
  { key: 'user_account', path: '/v5/user_account',  label: 'User Account' },
  { key: 'boards',       path: '/v5/boards',         label: 'Boards'       },
  { key: 'pins',         path: '/v5/pins',           label: 'Pins'         },
]

async function ptRun(endpoint) {
  ptActiveEndpoint.value = endpoint
  ptResult.value  = null
  ptError.value   = null
  ptLoading.value = true
  try {
    const res = await $fetch('/api/pinterest/api-test', {
      method: 'POST',
      body:   { token: ptToken.value, environment: ptEnv.value, endpoint },
    })
    ptResult.value = res
  } catch (err) {
    ptError.value = err?.data?.statusMessage ?? err?.message ?? 'Request failed'
  } finally {
    ptLoading.value = false
  }
}

const ptHighlighted = computed(() => {
  if (!ptResult.value) return ''
  const json = JSON.stringify(ptResult.value.data, null, 2)
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (m) => {
      let cls = 'pt-num'
      if (/^"/.test(m)) cls = /:$/.test(m) ? 'pt-key' : 'pt-str'
      else if (/true|false/.test(m)) cls = 'pt-bool'
      else if (/null/.test(m)) cls = 'pt-null'
      return `<span class="${cls}">${m}</span>`
    })
})

async function ptCopy() {
  if (!ptResult.value) return
  await navigator.clipboard.writeText(JSON.stringify(ptResult.value.data, null, 2))
  ptCopied.value = true
  setTimeout(() => { ptCopied.value = false }, 1800)
}
</script>

<style lang="scss" scoped>
.dash {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 28px 48px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: $color-bg;

  // ── Header ───────────────────────────────────────────────────────────

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  &__title {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: $color-primary;
    letter-spacing: -0.025em;
  }

  &__sub {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  &__refresh {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    color: #6b7280;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.12s;

    &--spin svg { animation: spin 0.7s linear infinite; }

    &:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #d1d5db;
      color: $color-primary;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) { transform: translateY(0); }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  // ── Skeleton ─────────────────────────────────────────────────────────

  &__skel-pipeline {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  &__skel-kpi {
    height: 110px;
    background: #fff;
    border: 1px solid #ececec;
    border-radius: 12px;
    animation: shimmer 1.6s linear infinite;
    background: linear-gradient(90deg, #f7f7f7 25%, #efefef 50%, #f7f7f7 75%);
    background-size: 200% 100%;
  }

  &__skel-row {
    display: grid;
    grid-template-columns: 5fr 7fr;
    gap: 16px;
  }

  &__skel-card {
    border: 1px solid #ececec;
    border-radius: 12px;
    animation: shimmer 1.6s linear infinite;
    background: linear-gradient(90deg, #f7f7f7 25%, #efefef 50%, #f7f7f7 75%);
    background-size: 200% 100%;
  }

  // ── Pipeline ─────────────────────────────────────────────────────────

  &__pipeline {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  &__kpi {
    position: relative;
    overflow: hidden;
    background: #fff;
    border: 1px solid #ececec;
    border-radius: 12px;
    padding: 16px 18px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    transition: box-shadow 0.15s, border-color 0.15s;

    &:hover {
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      border-color: #e0e0e0;
    }

    &::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--c);
      border-radius: 12px 0 0 12px;
    }
  }

  &__kpi-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__kpi-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--c);
    flex-shrink: 0;
  }

  &__kpi-count {
    font-size: 34px;
    font-weight: 700;
    color: var(--c);
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-top: 7px;
  }

  &__kpi-sub {
    font-size: 11px;
    color: #9ca3af;
  }

  &__kpi-note {
    font-size: 11px;
    color: var(--c);
    opacity: 0.8;
    margin-bottom: 9px;
  }

  &__kpi-track {
    height: 3px;
    background: #f3f4f6;
    border-radius: 2px;
    overflow: hidden;
    margin-top: auto;
  }

  &__kpi-fill {
    height: 100%;
    background: var(--c);
    border-radius: 2px;
    opacity: 0.55;
    transition: width 0.9s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 3px;
  }

  // ── Card base ────────────────────────────────────────────────────────

  &__card {
    background: #fff;
    border: 1px solid #ececec;
    border-radius: 12px;
    padding: 20px 22px;
  }

  &__card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
  }

  &__card-title {
    font-size: 13.5px;
    font-weight: 650;
    color: $color-primary;
    letter-spacing: -0.01em;
  }

  &__card-meta {
    font-size: 11.5px;
    color: #9ca3af;
    font-weight: 500;
  }

  &__card-head-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__filter-check {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;

    input[type='checkbox'] {
      width: 13px;
      height: 13px;
      margin: 0;
      cursor: pointer;
      accent-color: $color-accent;
    }

    span {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
    }
  }

  // ── Layout rows ──────────────────────────────────────────────────────

  &__row2 { display: grid; grid-template-columns: 5fr 7fr; gap: 16px; }

  // ── Donut chart ──────────────────────────────────────────────────────

  &__donut-wrap {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__donut-svg {
    flex-shrink: 0;
    width: 152px;
    height: 152px;
    display: block;
  }

  &__donut-num {
    font-size: 26px;
    font-weight: 700;
    fill: $color-primary;
  }

  &__donut-lbl {
    font-size: 9.5px;
    fill: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__donut-legend {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
    max-height: 180px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #e5e7eb transparent;

    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
  }

  &__legend-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__legend-name {
    flex: 1;
    font-size: 12px;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__legend-pct {
    font-size: 11px;
    color: #9ca3af;
    flex-shrink: 0;
  }

  &__legend-n {
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    flex-shrink: 0;
    min-width: 22px;
    text-align: right;
  }

  // ── Bar chart ────────────────────────────────────────────────────────

  &__bar-svg {
    display: block;
    width: 100%;
    height: auto;
  }

  &__bar-val {
    font-size: 10px;
    font-weight: 600;
    fill: #6b7280;
  }

  &__bar-lbl {
    font-size: 10px;
    fill: #9ca3af;
  }


  &__no-data {
    margin: -2px 0 0;
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
  }

  // ── Upcoming — load gate ─────────────────────────────────────────────

  &__up-gate {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0 24px;
  }

  &__up-gate-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 34px;
    padding: 0 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    color: $color-primary;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, transform 0.12s;

    svg { color: #6b7280; flex-shrink: 0; }

    &:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
      transform: translateY(-1px);
    }
    &:active { transform: translateY(0); }
  }

  // ── Upcoming — day rows ──────────────────────────────────────────────

  &__up-arrows {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  &__up-arrow {
    width: 28px;
    height: 28px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    padding: 0;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.12s;

    &:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #d1d5db;
      color: $color-primary;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) { transform: translateY(0); }
    &:disabled { opacity: 0.3; cursor: not-allowed; }
  }

  &__up-day {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 10px 0;
    border-bottom: 1px solid #f3f4f6;

    &:last-child { border-bottom: none; }
  }

  &__up-day-lbl {
    flex-shrink: 0;
    width: 68px;
    padding-top: 3px;
  }

  &__up-day-name {
    font-size: 11.5px;
    font-weight: 700;
    color: $color-primary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__up-day-date {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 1px;
  }

  &__up-strip-outer {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  &__up-strip-inner {
    display: flex;
    gap: 8px;
    transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
  }

  &__up-pin {
    flex-shrink: 0;
    width: 72px;
    cursor: default;
  }

  &__up-thumb {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: opacity 0.18s ease;
    }
  }

  &__up-loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
  }

  &__up-spinner {
    animation: spin 0.75s linear infinite;
  }

  &__up-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__up-time {
    font-size: 10.5px;
    color: #9ca3af;
    text-align: center;
    margin-top: 5px;
    white-space: nowrap;
  }

  // ── Empty & error ────────────────────────────────────────────────────

  &__empty {
    padding: 28px 0;
    text-align: center;
    font-size: 13px;
    color: #9ca3af;
  }

  &__error {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 14px;
    color: #6b7280;
    padding: 48px 0;
  }

  &__error-btn {
    color: $color-accent;
    background: none;
    border: none;
    cursor: pointer;
    font-size: inherit;
    font-weight: 600;
    padding: 0;
    transition: opacity 0.15s;

    &:hover { opacity: 0.7; }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .dash {
    padding: 20px 20px 40px;

    &__pipeline  { grid-template-columns: 1fr 1fr; }
    &__row2      { grid-template-columns: 1fr; }
    &__skel-row  { grid-template-columns: 1fr; }
  }
}

@media (max-width: 600px) {
  .dash {
    padding: 16px 14px 40px;

    &__head { padding-left: 46px; }

    &__pipeline  { grid-template-columns: 1fr; }
    &__row2      { grid-template-columns: 1fr; }
    &__skel-row  { grid-template-columns: 1fr; }
    &__skel-pipeline { grid-template-columns: 1fr; }
  }
}

// ── Pinterest API Tester ─────────────────────────────────────────────────────
.ptest {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f3f4f6;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__brand-name {
    font-size: 13.5px;
    font-weight: 650;
    color: $color-primary;
    letter-spacing: -0.01em;
  }

  &__badge {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #E60023;
    background: rgba(230, 0, 35, 0.08);
    border-radius: 4px;
    padding: 2px 6px;
  }

  &__desc {
    margin: 0;
    font-size: 12.5px;
    color: #6b7280;
    line-height: 1.5;
  }

  &__config {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__token-wrap {
    flex: 1;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__env-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__token-row {
    display: flex;
    gap: 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: #fafafa;
    transition: border-color 0.15s;

    &:focus-within { border-color: #E60023; background: #fff; }
  }

  &__token-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 8px 12px;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    outline: none;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    min-width: 0;

    &::placeholder { color: #c4c9d4; font-family: inherit; }
  }

  &__eye {
    flex-shrink: 0;
    width: 36px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.15s;

    &:hover { color: $color-primary; }
  }

  &__env-tabs {
    display: flex;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    height: 38px;
  }

  &__env-tab {
    flex: 1;
    border: none;
    background: #fafafa;
    font: inherit;
    font-size: 12.5px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    padding: 0 14px;
    text-transform: capitalize;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;

    & + & { border-left: 1px solid #e5e7eb; }

    &--active {
      background: #E60023;
      color: #fff;
      font-weight: 600;
    }

    &:not(&--active):hover { background: #f3f4f6; color: $color-primary; }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__action-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 34px;
    padding: 0 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    font: inherit;
    font-size: 12.5px;
    font-weight: 500;
    color: $color-primary;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.12s;

    &:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #d1d5db;
      transform: translateY(-1px);
    }
    &:active:not(:disabled) { transform: translateY(0); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

    &--active {
      border-color: #E60023;
      background: rgba(230,0,35,0.04);
    }
  }

  &__action-method {
    font-size: 10px;
    font-weight: 700;
    color: #22c55e;
    letter-spacing: 0.05em;
    background: rgba(34, 197, 94, 0.1);
    padding: 1px 5px;
    border-radius: 4px;
  }

  &__action-path {
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    color: #374151;
  }

  &__action-spin {
    animation: spin 0.75s linear infinite;
    flex-shrink: 0;
  }

  &__status-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    flex-wrap: wrap;

    &--ok  { background: rgba(34,197,94,0.08);  color: #166534; }
    &--err { background: rgba(239,68,68,0.08);  color: #991b1b; }
  }

  &__status-code {
    font-weight: 700;
    font-size: 13px;
  }

  &__status-sep { opacity: 0.4; }

  &__status-url {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0.7;
    font-size: 11px;
  }

  &__status-ms { opacity: 0.6; flex-shrink: 0; }

  &__status-clear {
    margin-left: auto;
    flex-shrink: 0;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 11px;
    opacity: 0.5;
    padding: 0 2px;
    transition: opacity 0.15s;
    color: inherit;

    &:hover { opacity: 1; }
  }

  &__response {
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }

  &__response-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  &__response-title {
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__copy-btn {
    border: none;
    background: none;
    font: inherit;
    font-size: 11.5px;
    font-weight: 600;
    color: #E60023;
    cursor: pointer;
    padding: 0;
    opacity: 0.8;
    transition: opacity 0.15s;

    &:hover { opacity: 1; }
  }

  &__json {
    margin: 0;
    padding: 14px 16px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.65;
    color: #374151;
    background: #fdfdfd;
    overflow-x: auto;
    max-height: 480px;
    overflow-y: auto;
    white-space: pre;
  }
}

// JSON syntax colours
:deep(.pt-key)  { color: #6366f1; }
:deep(.pt-str)  { color: #059669; }
:deep(.pt-num)  { color: #d97706; }
:deep(.pt-bool) { color: #E60023; font-weight: 600; }
:deep(.pt-null) { color: #9ca3af; font-style: italic; }
</style>
