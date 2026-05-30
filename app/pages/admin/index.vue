<template>
  <div class="admin">
    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <header class="admin__head">
      <div class="admin__head-left">
        <NuxtLink to="/metadata" class="admin__brand">
          <span class="admin__brand-mark">W</span>
          <span class="admin__brand-text">Wall<span>Art</span>Room</span>
        </NuxtLink>
        <div class="admin__crumbs">
          <span class="admin__crumb-current">Admin</span>
          <span class="admin__crumb-sep">/</span>
          <span class="admin__crumb-leaf">Overview</span>
        </div>
      </div>

      <div class="admin__head-right">
        <NuxtLink to="/admin/help" class="admin__link admin__link--help">
          Help Tickets
          <span v-if="openTickets > 0" class="admin__help-badge">{{ openTickets }}</span>
        </NuxtLink>
        <NuxtLink to="/metadata" class="admin__link">↳ Metadata workspace</NuxtLink>
        <button
          class="admin__refresh"
          :class="{ 'admin__refresh--spin': status === 'pending' }"
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
      </div>
    </header>

    <!-- ── Range picker ──────────────────────────────────────────────────── -->
    <div class="admin__range" role="tablist" aria-label="Date range">
      <button
        v-for="r in RANGE_PRESETS"
        :key="r.key"
        type="button"
        class="admin__chip"
        :class="{ 'admin__chip--active': activeRange === r.key }"
        @click="selectRange(r.key)"
      >{{ r.label }}</button>

      <div class="admin__range-custom" :class="{ 'admin__range-custom--active': activeRange === 'custom' }">
        <label class="admin__range-label">From
          <input type="date" :value="fromDateInput" @input="onCustomDate('from', $event)" :max="toDateInput" />
        </label>
        <label class="admin__range-label">To
          <input type="date" :value="toDateInput" @input="onCustomDate('to', $event)" :min="fromDateInput" :max="todayInput" />
        </label>
      </div>

      <div class="admin__range-window" v-if="data">
        <span class="admin__range-meta">{{ rangeLabel }}</span>
      </div>
    </div>

    <!-- ── Skeleton ──────────────────────────────────────────────────────── -->
    <template v-if="status === 'pending' && !data">
      <div class="admin__skel-row">
        <div v-for="n in 4" :key="n" class="admin__skel-kpi" />
      </div>
      <div class="admin__skel-card" style="height:240px" />
      <div class="admin__skel-row admin__skel-row--2">
        <div class="admin__skel-card" style="height:300px" />
        <div class="admin__skel-card" style="height:300px" />
      </div>
    </template>

    <template v-else-if="data">

      <!-- ── KPI strip ──────────────────────────────────────────────────── -->
      <section class="admin__kpis" aria-label="KPIs for selected range">
        <div v-for="k in kpiCards" :key="k.label" class="admin__kpi" :style="{ '--c': k.color }">
          <div class="admin__kpi-label">
            <span class="admin__kpi-dot" />
            {{ k.label }}
          </div>
          <div class="admin__kpi-value">{{ k.value }}</div>
          <div class="admin__kpi-sub">{{ k.sub }}</div>
        </div>
      </section>

      <!-- ── Daily activity chart ───────────────────────────────────────── -->
      <section class="admin__card">
        <div class="admin__card-head">
          <div>
            <h2 class="admin__card-title">Daily activity</h2>
            <p class="admin__card-sub">Stacked: uploads, pins created, exported, published, CSV</p>
          </div>
          <div class="admin__legend">
            <span v-for="s in stackSeries" :key="s.key" class="admin__legend-item">
              <span class="admin__legend-swatch" :style="{ background: s.color }"></span>
              {{ s.label }}
            </span>
          </div>
        </div>

        <div v-if="dailyTotal === 0" class="admin__empty">
          No activity recorded in this range.
        </div>
        <div v-else class="admin__chart-wrap">
          <svg :viewBox="`0 0 ${chart.width} ${chart.height}`" class="admin__chart" preserveAspectRatio="none">
            <line :x1="chart.padX" :y1="chart.baseY" :x2="chart.width - chart.padX" :y2="chart.baseY" stroke="#e5e7eb" stroke-width="1" />
            <g v-for="(bar, i) in bars" :key="i">
              <g v-for="(seg, si) in bar.segments" :key="si">
                <rect
                  :x="bar.x"
                  :y="seg.y"
                  :width="chart.barW"
                  :height="seg.h"
                  :fill="seg.color"
                  rx="2"
                >
                  <title>{{ bar.day }} — {{ seg.label }}: {{ seg.count }}</title>
                </rect>
              </g>
              <text
                v-if="bar.total > 0"
                :x="bar.x + chart.barW / 2"
                :y="bar.topY - 4"
                text-anchor="middle"
                class="admin__chart-num"
              >{{ bar.total }}</text>
            </g>
          </svg>
          <div class="admin__chart-axis">
            <div
              v-for="(bar, i) in bars"
              :key="i"
              class="admin__chart-axis-tick"
              :style="{ left: `${(bar.x + chart.barW / 2) / chart.width * 100}%` }"
            >{{ bar.shortLabel }}</div>
          </div>
        </div>
      </section>

      <!-- ── Two-column row ─────────────────────────────────────────────── -->
      <div class="admin__row2">

        <!-- Most active users -->
        <section class="admin__card">
          <div class="admin__card-head">
            <h2 class="admin__card-title">Most active users</h2>
            <span class="admin__card-meta">{{ data.topUsers.length }} of {{ data.inRange.activeUsers }} active</span>
          </div>
          <div v-if="!data.topUsers.length" class="admin__empty">
            No users were active in this range.
          </div>
          <table v-else class="admin__table">
            <thead>
              <tr>
                <th>User</th>
                <th class="num">Uploads</th>
                <th class="num">Pins</th>
                <th class="num">Exported</th>
                <th class="num">CSV</th>
                <th class="num">Projects</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in data.topUsers" :key="u.user_id">
                <td>
                  <div class="admin__user">
                    <div class="admin__user-avatar">{{ initialsOf(u.email) }}</div>
                    <div>
                      <div class="admin__user-name">{{ u.name || u.email.split('@')[0] }}</div>
                      <div class="admin__user-email">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td class="num">{{ u.uploads }}</td>
                <td class="num">{{ u.pins }}</td>
                <td class="num">{{ u.exported }}</td>
                <td class="num">{{ u.csv }}</td>
                <td class="num">{{ u.projects }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Pipeline (lifetime) -->
        <section class="admin__card">
          <div class="admin__card-head">
            <h2 class="admin__card-title">Pipeline snapshot</h2>
            <span class="admin__card-meta">lifetime · {{ pipelineTotal }} pins</span>
          </div>
          <div class="admin__pipeline">
            <div
              v-for="s in pipelineRows"
              :key="s.key"
              class="admin__pipeline-row"
            >
              <div class="admin__pipeline-head">
                <span class="admin__pipeline-dot" :style="{ background: s.color }"></span>
                <span class="admin__pipeline-label">{{ s.label }}</span>
                <span class="admin__pipeline-count">{{ s.count }}</span>
                <span class="admin__pipeline-pct">{{ s.pct }}%</span>
              </div>
              <div class="admin__pipeline-track">
                <div class="admin__pipeline-fill" :style="{ width: `${Math.max(s.pct, 2)}%`, background: s.color }"></div>
              </div>
            </div>
          </div>
        </section>

      </div>

      <!-- ── Top projects + recent CSV exports ──────────────────────────── -->
      <div class="admin__row2">

        <section class="admin__card">
          <div class="admin__card-head">
            <h2 class="admin__card-title">Top projects</h2>
            <span class="admin__card-meta">by activity in range</span>
          </div>
          <div v-if="!data.topProjects.length" class="admin__empty">
            No project activity in this range.
          </div>
          <table v-else class="admin__table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Owner</th>
                <th class="num">Uploads</th>
                <th class="num">Pins</th>
                <th class="num">Exported</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in data.topProjects" :key="p.project_id">
                <td>{{ p.name }}</td>
                <td class="muted">{{ p.user_email }}</td>
                <td class="num">{{ p.uploads }}</td>
                <td class="num">{{ p.pins }}</td>
                <td class="num">{{ p.exported }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="admin__card">
          <div class="admin__card-head">
            <h2 class="admin__card-title">Recent CSV exports</h2>
            <span class="admin__card-meta">{{ data.inRange.csvExports }} in range · {{ data.inRange.csvRows }} rows</span>
          </div>
          <div v-if="!data.recentCsv.length" class="admin__empty">No exports in this range.</div>
          <ul v-else class="admin__list">
            <li v-for="c in data.recentCsv" :key="c.id" class="admin__list-row">
              <div class="admin__list-main">
                <div class="admin__list-title">{{ c.filename }}</div>
                <div class="admin__list-sub">{{ c.project || '—' }} · {{ c.user_email || '—' }}</div>
              </div>
              <div class="admin__list-meta">
                <span class="admin__chip-static">{{ c.row_count }} rows</span>
                <span class="admin__list-time">{{ formatRel(c.created_at) }}</span>
              </div>
            </li>
          </ul>
        </section>

      </div>

      <!-- ── New users (only when range has any) ────────────────────────── -->
      <section v-if="data.newUsers.length" class="admin__card">
        <div class="admin__card-head">
          <h2 class="admin__card-title">New users</h2>
          <span class="admin__card-meta">{{ data.newUsers.length }} signed up in range</span>
        </div>
        <ul class="admin__list">
          <li v-for="u in data.newUsers" :key="u.id" class="admin__list-row">
            <div class="admin__list-main">
              <div class="admin__list-title">{{ u.email }}</div>
            </div>
            <div class="admin__list-meta">
              <span class="admin__list-time">{{ formatRel(u.created_at) }}</span>
            </div>
          </li>
        </ul>
      </section>

    </template>

    <div v-else-if="error" class="admin__error">
      Failed to load admin data.
      <button class="admin__error-btn" @click="refresh">Try again</button>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const RANGE_PRESETS = [
  { key: 'today', label: 'Today',     days: 0 },
  { key: '7d',    label: 'Last 7d',   days: 7 },
  { key: '30d',   label: 'Last 30d',  days: 30 },
  { key: '90d',   label: 'Last 90d',  days: 90 },
  { key: 'all',   label: 'All time',  days: 9999 },
  { key: 'custom', label: 'Custom',   days: null },
]

const STACK_COLORS = {
  uploads:  '#c08457',
  pins:     '#6366f1',
  exported: '#f59e0b',
  csv:      '#0ea5e9',
}

const STATUS_COLORS = {
  draft:    '#94a3b8',
  exported: '#f59e0b',
  error:    '#ef4444',
}

const activeRange = ref('today')
const customFrom  = ref(null)
const customTo    = ref(null)

function todayLocal() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const todayInput = computed(() => toDateInputValue(new Date()))

function toDateInputValue(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const range = computed(() => {
  if (activeRange.value === 'custom' && customFrom.value && customTo.value) {
    const from = new Date(customFrom.value + 'T00:00:00')
    const to   = new Date(customTo.value   + 'T23:59:59.999')
    return { from, to }
  }
  const preset = RANGE_PRESETS.find(r => r.key === activeRange.value) ?? RANGE_PRESETS[0]
  const to = new Date()
  const from = todayLocal()
  if (preset.key === 'all') {
    from.setFullYear(2024, 0, 1)
  } else if (preset.days > 0) {
    from.setDate(from.getDate() - preset.days + 1)
  }
  return { from, to }
})

const fromDateInput = computed(() => toDateInputValue(range.value.from))
const toDateInput   = computed(() => toDateInputValue(range.value.to))

function selectRange(key) {
  activeRange.value = key
  if (key === 'custom') {
    if (!customFrom.value) customFrom.value = toDateInputValue(todayLocal())
    if (!customTo.value)   customTo.value   = toDateInputValue(new Date())
  }
}

function onCustomDate(which, e) {
  activeRange.value = 'custom'
  const val = e.target.value
  if (which === 'from') customFrom.value = val
  else                  customTo.value   = val
}

const query = computed(() => ({
  from: range.value.from.toISOString(),
  to:   range.value.to.toISOString(),
}))

// NOTE: deliberately uses on-demand `$fetch` (client-side) rather than
// `useFetch`. This page is auth-gated and has no SSR benefit, and the reactive
// `useFetch(url, { query, watch })` form was crashing inside Nuxt's
// useAsyncData internals on this route. Plain $fetch + watch is the pattern the
// rest of the app uses and is rock-solid here.
const data    = ref(null)
const status  = ref('pending') // 'pending' | 'success' | 'error'
const error   = ref(null)

async function load() {
  status.value = 'pending'
  error.value  = null
  try {
    data.value   = await $fetch('/api/admin/overview', { query: query.value })
    status.value = 'success'
  } catch (e) {
    error.value  = e
    status.value = 'error'
  }
}

function refresh() {
  return load()
}

watch(query, load)
onMounted(load)

const openTickets = ref(0)
onMounted(async () => {
  try {
    const t = await $fetch('/api/admin/help-tickets')
    openTickets.value = t.openCount ?? 0
  } catch {}
})

// ── KPI cards ────────────────────────────────────────────────────────────

const kpiCards = computed(() => {
  if (!data.value) return []
  const r = data.value.inRange
  const l = data.value.lifetime
  return [
    { label: 'Uploads',     value: r.uploads,       sub: `${l.images} lifetime`,     color: STACK_COLORS.uploads },
    { label: 'Pins created', value: r.pinsCreated,  sub: `${l.pins} lifetime`,        color: STACK_COLORS.pins },
    { label: 'Exported',    value: r.pinsExported,  sub: `${data.value.statusCounts.exported} pending export`, color: STACK_COLORS.exported },
    { label: 'CSV exports', value: r.csvExports,    sub: `${r.csvRows} rows`,         color: STACK_COLORS.csv },
    { label: 'Active users', value: r.activeUsers,  sub: `${r.newUsers} new · ${l.users} total`, color: '#9b5f3d' },
    { label: 'New projects', value: r.newProjects,  sub: `${l.projects} lifetime`,    color: '#8b5cf6' },
    { label: 'New boards',  value: r.newBoards,     sub: `${l.boards} lifetime`,      color: '#14b8a6' },
  ]
})

// ── Stacked bar chart ────────────────────────────────────────────────────

const stackSeries = [
  { key: 'uploads',   label: 'Uploads',   color: STACK_COLORS.uploads },
  { key: 'pins',      label: 'Pins',      color: STACK_COLORS.pins },
  { key: 'exported',  label: 'Exported',  color: STACK_COLORS.exported },
  { key: 'csv',       label: 'CSV',       color: STACK_COLORS.csv },
]

const chart = computed(() => {
  const days = data.value?.daily?.length ?? 1
  const width = 920
  const height = 220
  const padX = 24
  const baseY = height - 28
  const topPad = 22
  const usableW = width - padX * 2
  const slotW = usableW / Math.max(days, 1)
  const barW = Math.max(6, Math.min(40, slotW * 0.7))
  return { width, height, padX, baseY, topPad, slotW, barW }
})

const dailyTotal = computed(() => {
  if (!data.value) return 0
  return data.value.daily.reduce((s, d) => s + d.uploads + d.pins + d.exported + d.published + d.csv, 0)
})

const bars = computed(() => {
  if (!data.value) return []
  const c = chart.value
  const maxStack = Math.max(
    1,
    ...data.value.daily.map(d => d.uploads + d.pins + d.exported + d.published + d.csv),
  )
  const usableH = c.baseY - c.topPad
  return data.value.daily.map((d, i) => {
    const total = d.uploads + d.pins + d.exported + d.published + d.csv
    const totalH = (total / maxStack) * usableH
    const x = c.padX + i * c.slotW + (c.slotW - c.barW) / 2
    let cursorY = c.baseY
    const segments = []
    for (const s of stackSeries) {
      const count = d[s.key] ?? 0
      if (count > 0) {
        const segH = (count / maxStack) * usableH
        cursorY -= segH
        segments.push({ y: cursorY, h: segH, color: s.color, label: s.label, count })
      }
    }
    return {
      x,
      day: d.day,
      total,
      topY: c.baseY - totalH,
      shortLabel: shortDay(d.day),
      segments,
    }
  })
})

function shortDay(iso) {
  // iso is YYYY-MM-DD
  const d = new Date(iso + 'T00:00:00Z')
  const days = data.value?.daily?.length ?? 0
  if (days <= 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  }
  if (days <= 31) {
    const dom = d.getUTCDate()
    return dom % 5 === 0 || dom === 1 ? String(dom) : ''
  }
  if (d.getUTCDate() === 1) return d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })
  return ''
}

// ── Pipeline ─────────────────────────────────────────────────────────────

const pipelineTotal = computed(() => {
  if (!data.value) return 0
  return Object.values(data.value.statusCounts).reduce((s, n) => s + n, 0)
})

const pipelineRows = computed(() => {
  if (!data.value) return []
  const sc = data.value.statusCounts
  const total = pipelineTotal.value || 1
  return [
    { key: 'draft',    label: 'Draft',    color: STATUS_COLORS.draft,    count: sc.draft,    pct: Math.round(sc.draft    / total * 100) },
    { key: 'exported', label: 'Exported', color: STATUS_COLORS.exported, count: sc.exported, pct: Math.round(sc.exported / total * 100) },
    { key: 'error',    label: 'Error',    color: STATUS_COLORS.error,    count: sc.error,    pct: Math.round(sc.error    / total * 100) },
  ]
})

// ── Range label ──────────────────────────────────────────────────────────

const rangeLabel = computed(() => {
  const f = range.value.from
  const t = range.value.to
  const sameDay = f.toDateString() === new Date(t.toDateString()).toDateString()
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return sameDay ? fmt(f) : `${fmt(f)} → ${fmt(t)}`
})

// ── Helpers ──────────────────────────────────────────────────────────────

function initialsOf(email) {
  if (!email) return '·'
  const name = email.split('@')[0]
  const parts = name.split(/[.\-_]/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0]?.toUpperCase() || '·'
}

function formatRel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)        return 'just now'
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped lang="scss">
.admin {
  min-height: 100vh;
  background: #faf7f2;
  color: #3f342c;
  padding: 24px 36px 64px;
  font-family: inherit;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
  }

  &__head-left {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  &__brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
    color: #3f342c;
    font-weight: 700;
    letter-spacing: -0.03em;

    &-mark {
      width: 26px; height: 26px;
      border-radius: 7px;
      background: #3f342c;
      color: #faf7f2;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 13px;
    }
    &-text {
      font-size: 15px;
      span { color: #9b5f3d; }
    }
  }

  &__crumbs {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #8a7a6e;
  }
  &__crumb-current {
    background: #f1e6d4;
    color: #6b4423;
    padding: 3px 9px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  &__crumb-sep   { opacity: 0.4; }
  &__crumb-leaf  { color: #3f342c; font-weight: 500; }

  &__head-right {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }

  &__link {
    font-size: 12.5px;
    color: #8a7a6e;
    text-decoration: none;
    &:hover { color: #6b4423; }

    &--help {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  }

  &__help-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #ef4444;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
  }

  &__refresh {
    width: 32px; height: 32px;
    border-radius: 9px;
    border: 1px solid #ede0d0;
    background: #fff;
    color: #8a7a6e;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    transition: background .15s, color .15s, border-color .15s;
    &:hover:not(:disabled) { background: #f5ecd7; color: #6b4423; border-color: #c8b89f; }
    &--spin svg { animation: admin-spin 0.9s linear infinite; }
    &:disabled { cursor: progress; }
  }

  @keyframes admin-spin { to { transform: rotate(360deg); } }

  // ── Range bar ─────────────────────────────────────────────────────────
  &__range {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 10px;
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 12px;
    margin-bottom: 18px;
  }

  &__chip {
    appearance: none;
    border: 1px solid transparent;
    background: transparent;
    color: #6b6058;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    padding: 6px 13px;
    border-radius: 8px;
    cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;

    &:hover { background: #faf3e8; color: #3f342c; }
    &--active {
      background: #3f342c;
      color: #faf7f2;
      &:hover { background: #2d251f; color: #faf7f2; }
    }
  }

  &__range-custom {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
    padding: 4px 10px;
    border-radius: 8px;
    border: 1px dashed transparent;

    &--active {
      border-color: #c8b89f;
      background: #faf3e8;
    }
  }
  &__range-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #8a7a6e;
    input {
      font-family: inherit;
      font-size: 12.5px;
      padding: 5px 7px;
      border-radius: 6px;
      border: 1px solid #e0d4c8;
      background: #fff;
      color: #3f342c;
    }
  }
  &__range-window { padding-left: 8px; }
  &__range-meta {
    font-size: 12px;
    color: #8a7a6e;
    font-variant-numeric: tabular-nums;
  }

  // ── KPI strip ─────────────────────────────────────────────────────────
  &__kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }

  &__kpi {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 12px;
    padding: 14px 16px;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 14px; left: 0;
      width: 3px; height: 18px;
      background: var(--c);
      border-radius: 0 3px 3px 0;
    }
  }
  &__kpi-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #8a7a6e;
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  &__kpi-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--c);
  }
  &__kpi-value {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.025em;
    margin-top: 4px;
    color: #3f342c;
    font-variant-numeric: tabular-nums;
  }
  &__kpi-sub {
    font-size: 11.5px;
    color: #a89886;
    margin-top: 2px;
  }

  // ── Cards / rows ──────────────────────────────────────────────────────
  &__card {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 14px;
    padding: 20px 22px;
    margin-bottom: 18px;
  }
  &__card-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }
  &__card-title {
    margin: 0;
    font-size: 14.5px;
    font-weight: 700;
    letter-spacing: -0.015em;
    color: #3f342c;
  }
  &__card-sub {
    margin: 4px 0 0;
    font-size: 12px;
    color: #8a7a6e;
  }
  &__card-meta {
    font-size: 12px;
    color: #8a7a6e;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  &__row2 {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 18px;
    margin-bottom: 0;

    .admin__card { margin-bottom: 18px; }

    @media (max-width: 980px) { grid-template-columns: 1fr; }
  }

  &__empty {
    text-align: center;
    padding: 28px 12px;
    color: #a89886;
    font-size: 13px;
    background: #faf3e8;
    border-radius: 10px;
  }

  // ── Chart ─────────────────────────────────────────────────────────────
  &__chart-wrap { position: relative; }
  &__chart {
    width: 100%;
    height: 220px;
    display: block;
  }
  &__chart-num {
    font-size: 9.5px;
    fill: #6b6058;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  &__chart-axis {
    position: relative;
    height: 18px;
    margin-top: 2px;
  }
  &__chart-axis-tick {
    position: absolute;
    transform: translateX(-50%);
    font-size: 10px;
    color: #a89886;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 14px;
    align-items: center;
  }
  &__legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    color: #6b6058;
  }
  &__legend-swatch {
    width: 10px; height: 10px;
    border-radius: 3px;
  }

  // ── Pipeline ──────────────────────────────────────────────────────────
  &__pipeline {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  &__pipeline-row {}
  &__pipeline-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    margin-bottom: 5px;
  }
  &__pipeline-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
  }
  &__pipeline-label {
    color: #3f342c;
    font-weight: 500;
  }
  &__pipeline-count {
    margin-left: auto;
    color: #3f342c;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  &__pipeline-pct {
    color: #a89886;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    min-width: 32px;
    text-align: right;
  }
  &__pipeline-track {
    height: 6px;
    background: #f5ecd7;
    border-radius: 3px;
    overflow: hidden;
  }
  &__pipeline-fill {
    height: 100%;
    border-radius: 3px;
    transition: width .25s ease;
  }

  // ── Tables ────────────────────────────────────────────────────────────
  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;

    th, td {
      padding: 9px 10px;
      text-align: left;
      border-bottom: 1px solid #f1e6d4;
      vertical-align: middle;
    }
    th {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a89886;
      font-weight: 600;
      border-bottom-color: #ede0d0;
    }
    .num {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    td.muted { color: #8a7a6e; font-size: 12.5px; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #faf3e8; }
  }

  &__user {
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  &__user-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: #f1e6d4;
    color: #6b4423;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  &__user-name {
    font-weight: 600;
    color: #3f342c;
    font-size: 13px;
    line-height: 1.2;
  }
  &__user-email {
    color: #8a7a6e;
    font-size: 11.5px;
    line-height: 1.2;
  }

  // ── Lists ─────────────────────────────────────────────────────────────
  &__list {
    list-style: none;
    margin: 0; padding: 0;
    display: flex;
    flex-direction: column;
  }
  &__list-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 11px 4px;
    border-bottom: 1px solid #f1e6d4;
    &:last-child { border-bottom: none; }
  }
  &__list-main { min-width: 0; flex: 1; }
  &__list-title {
    font-size: 13px;
    font-weight: 500;
    color: #3f342c;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &__list-sub {
    font-size: 11.5px;
    color: #8a7a6e;
    margin-top: 2px;
  }
  &__list-meta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }
  &__list-time {
    font-size: 11.5px;
    color: #a89886;
    font-variant-numeric: tabular-nums;
  }
  &__chip-static {
    background: #f5ecd7;
    color: #6b4423;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    font-variant-numeric: tabular-nums;
  }

  // ── Uploads grid ──────────────────────────────────────────────────────
  &__uploads {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  &__upload {
    border: 1px solid #ede0d0;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
  }
  &__upload-thumb {
    aspect-ratio: 1 / 1;
    background: #f1e6d4;
    img {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
    }
  }
  &__upload-placeholder {
    width: 100%; height: 100%;
    background: linear-gradient(135deg, #f5ecd7 0%, #e8dcc5 100%);
  }
  &__upload-meta {
    padding: 8px 10px;
  }
  &__upload-email {
    font-size: 11.5px;
    color: #3f342c;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &__upload-time {
    font-size: 10.5px;
    color: #a89886;
    margin-top: 2px;
  }

  // ── Skeleton ──────────────────────────────────────────────────────────
  &__skel-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 12px;
    margin-bottom: 18px;

    &--2 { grid-template-columns: 1fr 1fr; }
  }
  &__skel-kpi, &__skel-card {
    background: linear-gradient(90deg, #f5ecd7 0%, #faf3e8 50%, #f5ecd7 100%);
    background-size: 200% 100%;
    border-radius: 12px;
    animation: admin-shimmer 1.6s ease-in-out infinite;
  }
  &__skel-kpi  { height: 88px; }
  &__skel-card { width: 100%; margin-bottom: 18px; }

  @keyframes admin-shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  // ── Error ────────────────────────────────────────────────────────────
  &__error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    padding: 18px;
    color: #991b1b;
    font-size: 13.5px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  &__error-btn {
    background: #fff;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: 8px;
    padding: 6px 12px;
    font-family: inherit;
    font-size: 12.5px;
    cursor: pointer;
    &:hover { background: #fef2f2; }
  }
}
</style>
