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
            <span class="dash__card-meta">next 6 weeks · {{ totalScheduled }} scheduled</span>
          </div>
          <svg viewBox="0 0 420 148" class="dash__bar-svg" aria-hidden="true">
            <defs>
              <clipPath
                v-for="(w, i) in barData"
                :id="`bc-${i}`"
                :key="`clip-${i}`"
              >
                <rect
                  v-if="w.barH > 0"
                  :x="w.cx - 20"
                  :y="108 - w.barH"
                  width="40"
                  :height="w.barH"
                  rx="5"
                />
              </clipPath>
            </defs>
            <line x1="14" y1="108" x2="406" y2="108" stroke="#e5e7eb" stroke-width="1" />
            <g v-for="(w, i) in barData" :key="i">
              <rect :x="w.cx - 20" y="14" width="40" height="94" rx="5" fill="#f9fafb" />
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
              <text :x="w.cx" y="130" text-anchor="middle" class="dash__bar-lbl">{{ w.weekLabel }}</text>
            </g>
          </svg>
          <p v-if="totalScheduled === 0" class="dash__no-data">No pins scheduled for the next 6 weeks.</p>
        </div>

      </div>

      <!-- ── Upcoming pins — next 7 days ────────────────────────────────────── -->
      <div class="dash__card">
        <div class="dash__card-head">
          <span class="dash__card-title">Scheduled Next 7 Days</span>
          <div class="dash__card-head-right">
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
                :disabled="!canScrollRight"
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

        <template v-if="upcomingByDay.length">
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
                    <img
                      v-if="pin.thumbnail_url"
                      :src="pin.thumbnail_url"
                      :alt="pin.title || 'Pin'"
                      loading="lazy"
                    />
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

  </div>
</template>

<script setup>
definePageMeta({ layout: 'metadata' })

const FALLBACK_COLORS = ['#ff6b35', '#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6']
const STATUS_COLORS = {
  draft:    '#94a3b8',
  exported: '#f59e0b',
}

const { data, status, error, refresh } = useFetch('/api/metadata/dashboard')

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
  return Object.values(data.value.statusCounts).reduce((s, n) => s + n, 0)
})

const pipelineCards = computed(() => {
  if (!data.value) return []
  const sc = data.value.statusCounts
  const tot = totalPins.value || 1
  return [
    { key: 'draft',    label: 'Draft',    color: STATUS_COLORS.draft,    count: sc.draft,    pct: Math.round(sc.draft    / tot * 100) },
    { key: 'exported', label: 'Exported', color: STATUS_COLORS.exported, count: sc.exported, pct: Math.round(sc.exported / tot * 100) },
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

const barData = computed(() => {
  if (!data.value) return []
  const weeks = data.value.weeklySchedule
  const max = Math.max(...weeks.map(w => w.count), 1)
  const MAX_H = 94
  const BASELINE = 108

  return weeks.map((w, i) => {
    const cx = 52 + i * 64
    const totalBarH = (w.count / max) * MAX_H
    const barY = BASELINE - totalBarH

    const rects = []
    let yBottom = BASELINE
    const segs = [...(w.segments ?? [])].sort((a, b) => b.count - a.count)
    for (const seg of segs) {
      const segH = w.count > 0 ? (seg.count / w.count) * totalBarH : 0
      if (segH < 0.5) continue
      rects.push({ x: cx - 20, y: yBottom - segH, height: segH, color: colorForBoard(seg.name) })
      yBottom -= segH
    }

    return { ...w, cx, barY, barH: totalBarH, rects }
  })
})

const totalScheduled = computed(() =>
  data.value?.weeklySchedule.reduce((s, w) => s + w.count, 0) ?? 0,
)

// ── Upcoming pins ──────────────────────────────────────────────────────────

const ITEM_W = 80 // 72px thumb + 8px gap

const showOnlyExported = ref(true)
const scrollIndex = ref(0)

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
</script>

<style lang="scss" scoped>
.dash {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 32px 48px;
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
    margin: 3px 0 0;
    font-size: 13px;
    color: #9ca3af;
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
    transition: background 0.15s, border-color 0.15s, color 0.15s;

    &--spin svg { animation: spin 0.7s linear infinite; }

    &:hover:not(:disabled) {
      background: #f9fafb;
      border-color: #d1d5db;
      color: $color-primary;
    }

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
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    animation: pulse 1.5s ease-in-out infinite;
  }

  &__skel-row {
    display: grid;
    grid-template-columns: 5fr 7fr;
    gap: 16px;
  }

  &__skel-card {
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    animation: pulse 1.5s ease-in-out infinite;
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
    border: 1px solid #f0f0f0;
    border-radius: 12px;
    padding: 16px 18px 14px;
    display: flex;
    flex-direction: column;
    gap: 3px;

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
    border: 1px solid #f0f0f0;
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
    transition: background 0.15s, border-color 0.15s, color 0.15s;

    &:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #d1d5db;
      color: $color-primary;
    }

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
    }
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

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
</style>
