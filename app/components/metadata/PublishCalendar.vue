<template>
  <div class="pub-cal">

    <!-- Header -->
    <div class="pub-cal__header">
      <div class="pub-cal__title-row">
        <svg class="pub-cal__title-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <rect x="2" y="3" width="16" height="15" rx="2" />
          <path d="M6 1v4M14 1v4M2 8h16" />
        </svg>
        <h3 class="pub-cal__title">Time Manager</h3>
      </div>

      <div class="pub-cal__controls">
        <div class="pub-cal__range">
          <label class="pub-cal__range-label">From</label>
          <input type="date" class="pub-cal__date-input" v-model="fromDate" @change="load" />
          <span class="pub-cal__range-sep">→</span>
          <label class="pub-cal__range-label">To</label>
          <input type="date" class="pub-cal__date-input" v-model="toDate" @change="load" />
        </div>
        <span class="pub-cal__total-badge" v-if="!loading && totalCount > 0">
          {{ totalCount }} pin{{ totalCount !== 1 ? 's' : '' }}
        </span>
      </div>

      <button class="pub-cal__close" title="Close" @click="emit('close')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </div>

    <!-- Legend -->
    <div v-if="legend.length" class="pub-cal__legend">
      <span v-for="entry in legend" :key="entry.board" class="pub-cal__legend-item">
        <span class="pub-cal__legend-dot" :style="{ background: entry.color }" />
        {{ entry.board || 'No board' }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="pub-cal__state">
      <svg class="pub-cal__spinner" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#e5e7eb" stroke-width="2.5" />
        <path d="M11 2a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      Loading…
    </div>

    <!-- Error -->
    <div v-else-if="error" class="pub-cal__state pub-cal__state--error">{{ error }}</div>

    <!-- Calendar -->
    <div v-else class="pub-cal__scroll">
      <div class="pub-cal__grid">
        <div
          v-for="day in days"
          :key="day.dateStr"
          class="pub-cal__day"
          :class="{
            'pub-cal__day--today': day.isToday,
            'pub-cal__day--past': day.isPast,
            'pub-cal__day--empty': day.items.length === 0,
          }"
        >
          <div class="pub-cal__day-head">
            <span class="pub-cal__day-name">{{ day.dayName }}</span>
            <span class="pub-cal__day-date">{{ day.monthDay }}</span>
            <span
              class="pub-cal__day-count"
              :class="{ 'pub-cal__day-count--zero': day.items.length === 0 }"
            >{{ day.items.length }}</span>
          </div>

          <div class="pub-cal__day-body">
            <div
              v-for="item in day.items"
              :key="item.image_id"
              class="pub-cal__item"
              :style="{ '--item-color': getBoardColor(item.board) }"
              :title="`${item.image?.filename ?? item.title ?? item.image_id}\n${formatTime(item.publish_date)}${item.board ? ' · ' + item.board : ''}`"
            >
              <span class="pub-cal__item-time">{{ formatTime(item.publish_date) }}</span>
              <span class="pub-cal__item-name">{{ item.image?.filename ?? item.title ?? '—' }}</span>
            </div>
            <div v-if="day.items.length === 0" class="pub-cal__day-none">—</div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
const props = defineProps({
  boards: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])

// ── Date range (default: today → today+6) ─────────────────────────────────
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function offsetDate(str, days) {
  const [y, m, d] = str.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

const fromDate = ref(todayStr())
const toDate   = ref(offsetDate(todayStr(), 6))

// ── Board colors ───────────────────────────────────────────────────────────
const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#ec4899',
  '#14b8a6', '#a855f7', '#e11d48', '#0ea5e9', '#65a30d',
]
const NO_BOARD_COLOR = '#9ca3af'

const boardColorMap = computed(() => {
  const names = [...new Set([
    ...props.boards.map(b => b.name),
    ...rawData.value.map(r => r.board ?? ''),
  ])].filter((n, i, a) => a.indexOf(n) === i)

  const map = {}
  names.forEach((name, i) => {
    map[name] = name === '' ? NO_BOARD_COLOR : PALETTE[i % PALETTE.length]
  })
  return map
})

function getBoardColor(board) {
  return boardColorMap.value[board ?? ''] ?? NO_BOARD_COLOR
}

// ── Legend ─────────────────────────────────────────────────────────────────
const legend = computed(() => {
  const seen = new Set()
  const entries = []
  for (const item of rawData.value) {
    const k = item.board ?? ''
    if (!seen.has(k)) {
      seen.add(k)
      entries.push({ board: k, color: getBoardColor(k) })
    }
  }
  return entries.sort((a, b) => (a.board || 'zzz').localeCompare(b.board || 'zzz'))
})

// ── Fetch ──────────────────────────────────────────────────────────────────
const rawData = ref([])
const loading = ref(false)
const error   = ref(null)

async function load() {
  if (!fromDate.value || !toDate.value) return
  loading.value = true
  error.value   = null
  rawData.value = []
  try {
    const { data } = await $fetch('/api/pinterest/calendar', {
      query: { from: fromDate.value, to: toDate.value },
    })
    rawData.value = data ?? []
  } catch (e) {
    error.value = e.data?.statusMessage ?? e.message ?? 'Failed to load'
  } finally {
    loading.value = false
  }
}

onMounted(load)

// ── Build day columns ──────────────────────────────────────────────────────
const DAY_NAMES  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function itemLocalDateStr(publishDate) {
  const d = new Date(publishDate)
  return localDateStr(d)
}

const todayDateStr = todayStr()

const days = computed(() => {
  if (!fromDate.value || !toDate.value) return []

  const [fy, fm, fd] = fromDate.value.split('-').map(Number)
  const [ty, tm, td] = toDate.value.split('-').map(Number)
  const start = new Date(fy, fm - 1, fd)
  const end   = new Date(ty, tm - 1, td)

  const grouped = {}
  for (const item of rawData.value) {
    const k = itemLocalDateStr(item.publish_date)
    ;(grouped[k] ??= []).push(item)
  }

  const result = []
  const cur = new Date(start)
  while (cur <= end) {
    const dateStr  = localDateStr(cur)
    const items    = grouped[dateStr] ?? []
    result.push({
      dateStr,
      dayName:  DAY_NAMES[cur.getDay()],
      monthDay: `${MONTH_ABBR[cur.getMonth()]} ${cur.getDate()}`,
      isToday:  dateStr === todayDateStr,
      isPast:   dateStr < todayDateStr,
      items,
    })
    cur.setDate(cur.getDate() + 1)
  }
  return result
})

const totalCount = computed(() => rawData.value.length)

// ── Formatting ─────────────────────────────────────────────────────────────
function formatTime(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="scss">
.pub-cal {
  background: #fff;
  border-radius: $radius-md;
  width: min(96vw, 1000px);
  max-height: 86vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  overflow: hidden;

  // ── Header ───────────────────────────────────────────────────────────────

  &__header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 18px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }

  &__title-icon { color: $color-accent; }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: $color-primary;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    flex-wrap: wrap;
  }

  &__range {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }

  &__range-label {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__range-sep { color: #9ca3af; font-size: 14px; }

  &__date-input {
    height: 32px;
    padding: 0 8px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
    background: #f9fafb;
    color: $color-primary;
    cursor: pointer;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }
  }

  &__total-badge {
    font-size: 12px;
    font-weight: 700;
    color: $color-accent;
    background: color-mix(in srgb, #{$color-accent} 10%, transparent);
    border: 1px solid color-mix(in srgb, #{$color-accent} 25%, transparent);
    border-radius: 20px;
    padding: 2px 9px;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #fff;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    flex-shrink: 0;
    margin-left: auto;
    transition: background 0.15s;

    &:hover { background: #f3f4f6; color: $color-primary; }
  }

  // ── Legend ───────────────────────────────────────────────────────────────

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    padding: 8px 18px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #374151;
  }

  &__legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  // ── Loading / error states ────────────────────────────────────────────────

  &__state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex: 1;
    min-height: 180px;
    font-size: 14px;
    color: #6b7280;

    &--error { color: #ef4444; }
  }

  &__spinner {
    color: $color-accent;
    animation: pub-cal-spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  @keyframes pub-cal-spin {
    to { transform: rotate(360deg); }
  }

  // ── Scroll wrapper ────────────────────────────────────────────────────────

  &__scroll {
    flex: 1;
    overflow-x: auto;
    overflow-y: hidden;
    min-height: 0;
    padding: 14px 18px;
  }

  // ── Day grid (horizontal) ─────────────────────────────────────────────────

  &__grid {
    display: flex;
    gap: 8px;
    height: 100%;
    min-height: 280px;
    align-items: flex-start;
  }

  // ── Day column ────────────────────────────────────────────────────────────

  &__day {
    min-width: 114px;
    width: 114px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;

    &--today {
      border-color: $color-accent;
      box-shadow: 0 0 0 2px color-mix(in srgb, #{$color-accent} 18%, transparent);

      .pub-cal__day-head { background: color-mix(in srgb, #{$color-accent} 8%, transparent); }
    }

    &--past {
      opacity: 0.65;
    }

    &--empty .pub-cal__day-head {
      border-bottom-color: transparent;
    }
  }

  &__day-head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 8px 6px 7px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
    background: #fafafa;
  }

  &__day-name {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #9ca3af;
  }

  &__day-date {
    font-size: 12px;
    font-weight: 600;
    color: $color-primary;
    line-height: 1.3;
  }

  &__day-count {
    font-size: 18px;
    font-weight: 800;
    color: $color-primary;
    line-height: 1.2;

    &--zero { color: #d1d5db; }
  }

  &__day-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px;
    overflow-y: auto;
    max-height: 340px;
    min-height: 40px;
    flex: 1;
  }

  &__day-none {
    font-size: 18px;
    color: #e5e7eb;
    text-align: center;
    padding: 10px 0;
    line-height: 1;
  }

  // ── Item box ──────────────────────────────────────────────────────────────

  &__item {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 4px 7px 5px;
    border-radius: 6px;
    background: var(--item-color);
    cursor: default;
    transition: filter 0.12s;
    overflow: hidden;

    &:hover { filter: brightness(0.9); }
  }

  &__item-time {
    font-size: 10px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.2;
    letter-spacing: 0.02em;
  }

  &__item-name {
    font-size: 11px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ── Responsive ────────────────────────────────────────────────────────────

  @media (max-width: 600px) {
    width: 100%;
    max-height: 90vh;
    border-radius: $radius-md $radius-md 0 0;

    &__day { min-width: 95px; width: 95px; }
    &__header { padding: 12px 14px; }
    &__scroll { padding: 10px 12px; }
    &__legend { padding: 8px 14px; }
  }
}
</style>
