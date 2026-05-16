<template>
  <div class="pub-cal">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <div class="pub-cal__header">
      <div class="pub-cal__title-row">
        <svg class="pub-cal__title-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <rect x="2" y="3" width="16" height="15" rx="2" />
          <path d="M6 1v4M14 1v4M2 8h16" />
        </svg>
        <h3 class="pub-cal__title">Schedule overview</h3>
        <span v-if="!loading && totalCount > 0" class="pub-cal__total-badge">
          {{ totalCount }} pin{{ totalCount !== 1 ? 's' : '' }}
        </span>
      </div>

      <div class="pub-cal__controls">
        <div class="pub-cal__ranges" role="group" aria-label="Quick ranges">
          <button
            v-for="r in QUICK_RANGES"
            :key="r.days"
            type="button"
            class="pub-cal__range-chip"
            :class="{ 'pub-cal__range-chip--active': activeRange === r.days }"
            @click="applyQuickRange(r.days)"
          >{{ r.label }}</button>
        </div>

        <div class="pub-cal__range">
          <input type="date" class="pub-cal__date-input" v-model="fromDate" aria-label="From date" @change="onCustomRange" />
          <span class="pub-cal__range-sep">→</span>
          <input type="date" class="pub-cal__date-input" v-model="toDate" aria-label="To date" @change="onCustomRange" />
        </div>

        <label class="pub-cal__check-label">
          <input type="checkbox" v-model="showOnlyExported" />
          <span class="pub-cal__check-box" />
          Exported only
        </label>
      </div>

      <button class="pub-cal__close" type="button" title="Close" aria-label="Close" @click="emit('close')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </div>

    <!-- ── Sub-bar: legend + timezone note ─────────────────────────────────── -->
    <div class="pub-cal__subbar">
      <div v-if="legend.length" class="pub-cal__legend">
        <span v-for="entry in legend" :key="entry.board" class="pub-cal__legend-item">
          <span class="pub-cal__legend-dot" :style="{ background: entry.color }" />
          {{ entry.board || 'No board' }}
        </span>
      </div>
      <span v-else />
      <span class="pub-cal__tz-note" :title="`Times shown in ${tz}`">
        Times in {{ tzShort }}
      </span>
    </div>

    <!-- ── Loading ─────────────────────────────────────────────────────────── -->
    <div v-if="loading" class="pub-cal__state">
      <svg class="pub-cal__spinner" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#e5e7eb" stroke-width="2.5" />
        <path d="M11 2a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      Loading…
    </div>

    <!-- ── Error ───────────────────────────────────────────────────────────── -->
    <div v-else-if="error" class="pub-cal__state pub-cal__state--error">{{ error }}</div>

    <!-- ── Calendar (wraps into weeks — never scrolls horizontally) ─────────── -->
    <div v-else class="pub-cal__scroll">
      <div class="pub-cal__grid" :style="{ '--cols': cols }">
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
            <div class="pub-cal__day-when">
              <span class="pub-cal__day-name">{{ day.dayName }}</span>
              <span class="pub-cal__day-date">{{ day.monthDay }}</span>
            </div>
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
              :style="{ '--item-color': itemColor(item.board) }"
              :title="`${formatTime(item.publish_date)} · ${item.title ?? item.image_id}${item.board ? ' · ' + item.board : ''}`"
            >
              <span class="pub-cal__item-time">{{ formatTime(item.publish_date) }}</span>
              <span class="pub-cal__item-name">{{ item.title ?? '—' }}</span>
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

// Saved board colours win over the hash fallback (single source of truth).
const { chipStyleForName } = usePinterestBoards()

// Render times in the same zone the CSV export uses so the overview matches
// exactly what Pinterest will post.
const { settings, load: loadSettings } = useMetadataSettings()
const tz = computed(() => settings.value?.csv_timezone || DEFAULT_METADATA_TIMEZONE)
const tzShort = computed(() => zoneOffsetLabel(tz.value) || tz.value)

// ── Date range ─────────────────────────────────────────────────────────────
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function offsetDate(str, days) {
  const [y, m, d] = str.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

const QUICK_RANGES = [
  { days: 7,  label: 'Week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: 'Month' },
]

const fromDate = ref(todayStr())
const toDate = ref(offsetDate(todayStr(), 6))
const activeRange = ref(7)

function applyQuickRange(n) {
  activeRange.value = n
  fromDate.value = todayStr()
  toDate.value = offsetDate(todayStr(), n - 1)
  load()
}
function onCustomRange() {
  activeRange.value = 0
  load()
}

// ── Fetch ───────────────────────────────────────────────────────────────────
const rawData = ref([])
const loading = ref(false)
const error = ref(null)
const showOnlyExported = ref(true)

const displayData = computed(() =>
  showOnlyExported.value
    ? rawData.value.filter(i => i.status === 'exported' || i.status === 'published')
    : rawData.value
)

async function load() {
  if (!fromDate.value || !toDate.value) return
  loading.value = true
  error.value = null
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

onMounted(() => { loadSettings(); load() })

// ── Colours ─────────────────────────────────────────────────────────────────
const NO_BOARD_COLOR = '#9ca3af'
function itemColor(board) {
  if (!board) return NO_BOARD_COLOR
  return chipStyleForName(board)?.background ?? NO_BOARD_COLOR
}

const legend = computed(() => {
  const seen = new Set()
  const entries = []
  for (const item of displayData.value) {
    const k = item.board ?? ''
    if (!seen.has(k)) {
      seen.add(k)
      entries.push({ board: k, color: itemColor(k) })
    }
  }
  return entries.sort((a, b) => (a.board || 'zzz').localeCompare(b.board || 'zzz'))
})

// ── Day columns ─────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const todayKey = computed(() => dateKeyInZone(new Date().toISOString(), tz.value))

const days = computed(() => {
  if (!fromDate.value || !toDate.value) return []

  const [fy, fm, fd] = fromDate.value.split('-').map(Number)
  const [ty, tm, td] = toDate.value.split('-').map(Number)
  const start = new Date(fy, fm - 1, fd)
  const end = new Date(ty, tm - 1, td)

  // Bucket pins by their day *in the configured zone* so a 23:30 CET pin lands
  // on the same column the CSV will post it on.
  const grouped = {}
  for (const item of displayData.value) {
    const k = dateKeyInZone(item.publish_date, tz.value)
    ;(grouped[k] ??= []).push(item)
  }
  for (const list of Object.values(grouped)) {
    list.sort((a, b) => (a.publish_date ?? '').localeCompare(b.publish_date ?? ''))
  }

  const result = []
  const cur = new Date(start)
  let guard = 0
  while (cur <= end && guard++ < 400) {
    const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
    result.push({
      dateStr,
      dayName: DAY_NAMES[cur.getDay()],
      monthDay: `${MONTH_ABBR[cur.getMonth()]} ${cur.getDate()}`,
      isToday: dateStr === todayKey.value,
      isPast: dateStr < todayKey.value,
      items: grouped[dateStr] ?? [],
    })
    cur.setDate(cur.getDate() + 1)
  }
  return result
})

// One row per week so a long range wraps vertically instead of forcing a
// horizontal scrollbar (the laptop pain point).
const cols = computed(() => Math.min(7, Math.max(1, days.value.length)))

const totalCount = computed(() => displayData.value.length)

function formatTime(iso) {
  return timeLabelInZone(iso, tz.value)
}
</script>

<style scoped lang="scss">
.pub-cal {
  background: #fff;
  border-radius: $radius-md;
  width: min(1240px, 95vw);
  height: min(820px, 92vh);
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
  overflow: hidden;

  // ── Header ───────────────────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;
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
    gap: 12px;
    flex: 1;
    flex-wrap: wrap;
  }

  &__ranges {
    display: flex;
    background: #f3f4f6;
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
  }

  &__range-chip {
    height: 28px;
    padding: 0 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    font: inherit;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover { color: $color-primary; }

    &--active {
      background: #fff;
      color: $color-primary;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    &:focus-visible { outline: 2px solid $color-accent; outline-offset: 1px; }
  }

  &__range {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
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

  &__check-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    user-select: none;
    flex-shrink: 0;

    input[type='checkbox'] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;

      &:checked + .pub-cal__check-box {
        background: $color-accent;
        border-color: $color-accent;

        &::after { opacity: 1; }
      }

      &:focus-visible + .pub-cal__check-box {
        outline: 2px solid $color-accent;
        outline-offset: 2px;
      }
    }
  }

  &__check-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s;

    &::after {
      content: '';
      display: block;
      width: 4px;
      height: 6px;
      border-right: 2px solid #fff;
      border-bottom: 2px solid #fff;
      transform: rotate(45deg) translateY(-1px);
      opacity: 0;
      transition: opacity 0.1s;
    }
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
    &:focus-visible { outline: 2px solid $color-accent; outline-offset: 2px; }
  }

  // ── Sub-bar ──────────────────────────────────────────────────────────────
  &__subbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 16px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
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

  &__tz-note {
    flex-shrink: 0;
    font-size: 11.5px;
    font-weight: 600;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 20px;
    padding: 3px 10px;
    white-space: nowrap;
  }

  // ── States ───────────────────────────────────────────────────────────────
  &__state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex: 1;
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

  // ── Scroll wrapper (vertical only) ───────────────────────────────────────
  &__scroll {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
    padding: 14px 16px;
  }

  // ── Day grid: equal columns that fill the width, wrapping per week ────────
  &__grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 7), minmax(0, 1fr));
    gap: 8px;
  }

  &__day {
    display: flex;
    flex-direction: column;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    min-height: 150px;

    &--today {
      border-color: $color-accent;
      box-shadow: 0 0 0 2px color-mix(in srgb, #{$color-accent} 18%, transparent);

      .pub-cal__day-head { background: color-mix(in srgb, #{$color-accent} 8%, transparent); }
    }

    &--past { opacity: 0.6; }
  }

  &__day-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding: 7px 10px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
    background: #fafafa;
  }

  &__day-when {
    display: flex;
    align-items: baseline;
    gap: 6px;
    min-width: 0;
  }

  &__day-name {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #9ca3af;
  }

  &__day-date {
    font-size: 12.5px;
    font-weight: 700;
    color: $color-primary;
  }

  &__day-count {
    flex-shrink: 0;
    min-width: 20px;
    height: 18px;
    padding: 0 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: color-mix(in srgb, #{$color-accent} 12%, #fff);
    color: $color-accent;
    font-size: 11px;
    font-weight: 800;

    &--zero { background: #f3f4f6; color: #d1d5db; }
  }

  &__day-body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px;
    overflow-y: auto;
    flex: 1;
    max-height: 260px;
  }

  &__day-none {
    font-size: 16px;
    color: #e5e7eb;
    text-align: center;
    padding: 12px 0;
    line-height: 1;
  }

  // ── Item ─────────────────────────────────────────────────────────────────
  &__item {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 4px 7px 5px;
    border-radius: 6px;
    border-left: 3px solid var(--item-color);
    background: color-mix(in srgb, var(--item-color) 12%, #fff);
    overflow: hidden;
    transition: background 0.12s;

    &:hover { background: color-mix(in srgb, var(--item-color) 20%, #fff); }
  }

  &__item-time {
    font-size: 10px;
    font-weight: 800;
    color: color-mix(in srgb, var(--item-color) 70%, #000);
    line-height: 1.2;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
  }

  &__item-name {
    font-size: 11px;
    font-weight: 500;
    color: #374151;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ── Responsive ───────────────────────────────────────────────────────────
  // Laptops (≤1366) — slightly tighter so 7 columns still breathe.
  @media (max-width: 1366px) {
    width: min(1140px, 96vw);

    &__day { min-height: 132px; }
    &__day-body { max-height: 220px; }
  }

  @media (max-width: 900px) {
    &__grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
  }

  @media (max-width: 600px) {
    width: 100%;
    height: 92vh;
    border-radius: $radius-md $radius-md 0 0;

    &__grid { grid-template-columns: 1fr 1fr; }
    &__header { padding: 10px 12px; }
    &__scroll { padding: 10px 12px; }
    &__subbar { padding: 8px 12px; }
  }

  @media (prefers-reduced-motion: reduce) {
    &__spinner { animation: none; }
    &__range-chip,
    &__close,
    &__item { transition: none; }
  }
}
</style>
