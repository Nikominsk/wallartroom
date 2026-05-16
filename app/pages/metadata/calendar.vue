<template>
  <div class="cal">

    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <header class="cal__head">
      <div class="cal__head-left">
        <h1 class="cal__title">Schedule Calendar</h1>
        <span v-if="data" class="cal__badge">{{ filteredPinCount }} pin{{ filteredPinCount !== 1 ? 's' : '' }}</span>
      </div>
      <div class="cal__head-right">
        <label class="cal__toggle" title="Show only exported pins">
          <input type="checkbox" v-model="showOnlyExported" />
          <span class="cal__toggle-box" :class="{ 'cal__toggle-box--on': showOnlyExported }" />
          <span class="cal__toggle-label">Exported only</span>
        </label>

        <button class="cal__today-btn" type="button" @click="goToday">Today</button>

        <div class="cal__nav" role="group" aria-label="Month navigation">
          <button class="cal__nav-btn" type="button" title="Previous month" @click="prevMonth">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 2L4 6l4 4"/>
            </svg>
          </button>
          <span class="cal__month-label">{{ monthLabel }}</span>
          <button class="cal__nav-btn" type="button" title="Next month" @click="nextMonth">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 2l4 4-4 4"/>
            </svg>
          </button>
        </div>

        <button
          class="cal__refresh-btn"
          :class="{ 'cal__refresh-btn--spin': status === 'pending' }"
          type="button"
          :disabled="status === 'pending'"
          title="Refresh"
          @click="refresh"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4a8 8 0 0 1 12 0M4 16a8 8 0 0 0 12 0"/>
            <polyline points="1 4 4 4 4 7"/>
            <polyline points="19 16 16 16 16 13"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- ── Board legend ───────────────────────────────────────────────────── -->
    <div v-if="legendBoards.length" class="cal__legend">
      <span v-for="b in legendBoards" :key="b.name" class="cal__legend-item">
        <span class="cal__legend-dot" :style="{ background: b.color }" />
        {{ b.name }}
      </span>
    </div>

    <!-- ── Unified grid: weekday headers + day cells ─────────────────────── -->
    <div class="cal__grid" role="grid" :aria-label="monthLabel">

      <!-- Weekday header row (inside the same grid = perfect column alignment) -->
      <div v-for="d in WEEKDAYS" :key="d" class="cal__weekday" role="columnheader" aria-hidden="true">{{ d }}</div>

      <template v-if="status === 'pending'">
        <div v-for="n in 42" :key="n" class="cal__cell cal__cell--skel" role="gridcell" />
      </template>

      <template v-else>
        <div
          v-for="cell in gridCells"
          :key="cell.key"
          class="cal__cell"
          :class="{
            'cal__cell--other': !cell.isCurrentMonth,
            'cal__cell--today': cell.isToday,
          }"
          role="gridcell"
        >
          <div class="cal__date" :class="{ 'cal__date--today': cell.isToday }">
            {{ cell.day }}
          </div>

          <div v-if="cell.chips.length || cell.overflow > 0" class="cal__chips">
            <div
              v-for="pin in cell.chips"
              :key="pin.image_id"
              class="cal__chip"
              :style="{ '--bc': colorForBoard(pin.board) }"
              @mouseenter="showTip($event, pin)"
              @mouseleave="hideTip"
            >
              <span class="cal__chip-time">{{ formatTime(pin.publish_date) }}</span>
            </div>
            <div v-if="cell.overflow > 0" class="cal__chip-more">+{{ cell.overflow }} more</div>
          </div>
        </div>
      </template>

    </div>

    <!-- ── Floating tooltip (Teleport avoids overflow:hidden clipping) ────── -->
    <Teleport to="body">
      <div
        v-if="tip.visible"
        class="cal-tip"
        :style="{ top: tip.y + 'px', left: tip.x + 'px' }"
      >
        <div class="cal-tip__title">{{ tip.title }}</div>
        <div class="cal-tip__meta">
          <span class="cal-tip__dot" :style="{ background: tip.color }" />
          {{ tip.board }}
          <span class="cal-tip__sep">·</span>
          {{ tip.time }}
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
definePageMeta({ layout: 'metadata' })

const WEEKDAYS        = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX_CHIPS       = 30
const FALLBACK_COLOR  = '#6366f1'

const todayDate        = new Date()
const currentYear      = ref(todayDate.getFullYear())
const currentMonth     = ref(todayDate.getMonth() + 1)
const showOnlyExported = ref(true)

const { settings, load: loadSettings } = useMetadataSettings()
const tz = computed(() => settings.value?.csv_timezone || DEFAULT_METADATA_TIMEZONE)

// Use the shared boards composable so colors are stable across month changes
const { chipStyleForName, loadBoards } = usePinterestBoards()
onMounted(() => { loadSettings(); loadBoards() })

const { data, status, refresh } = useAsyncData(
  'schedule-calendar',
  () => $fetch('/api/metadata/calendar', {
    query: { year: currentYear.value, month: currentMonth.value },
  }),
  {
    lazy:    true,
    watch:   [currentYear, currentMonth],
    default: () => ({ pins: [] }),
  }
)

const monthLabel = computed(() => {
  const d = new Date(currentYear.value, currentMonth.value - 1, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

function prevMonth() {
  if (currentMonth.value === 1) { currentYear.value--; currentMonth.value = 12 }
  else currentMonth.value--
}
function nextMonth() {
  if (currentMonth.value === 12) { currentYear.value++; currentMonth.value = 1 }
  else currentMonth.value++
}
function goToday() {
  const now = new Date()
  currentYear.value  = now.getFullYear()
  currentMonth.value = now.getMonth() + 1
}

function colorForBoard(name) {
  return chipStyleForName(name)?.background ?? FALLBACK_COLOR
}

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function formatTime(iso) {
  return timeLabelInZone(iso, tz.value)
}

const todayStr = computed(() => dateKeyInZone(new Date().toISOString(), tz.value))

const filteredPins = computed(() => {
  const pins = data.value?.pins ?? []
  return showOnlyExported.value ? pins.filter(p => p.status === 'exported') : pins
})

const filteredPinCount = computed(() => filteredPins.value.length)

const gridCells = computed(() => {
  const y = currentYear.value
  const m = currentMonth.value

  const firstOfMonth = new Date(y, m - 1, 1)
  const dow          = firstOfMonth.getDay()
  const startOffset  = dow === 0 ? 6 : dow - 1
  const gridStart    = new Date(y, m - 1, 1 - startOffset)
  const gsDay        = gridStart.getDate()

  const byDay = {}
  for (const p of filteredPins.value) {
    const key = dateKeyInZone(p.publish_date, tz.value)
    ;(byDay[key] ??= []).push(p)
  }

  return Array.from({ length: 42 }, (_, i) => {
    const d   = new Date(gridStart.getTime())
    d.setDate(gsDay + i)
    const key = localDateStr(d)
    const pins = byDay[key] ?? []
    return {
      key,
      day:            d.getDate(),
      isCurrentMonth: d.getMonth() === m - 1,
      isToday:        key === todayStr.value,
      chips:          pins.slice(0, MAX_CHIPS),
      overflow:       Math.max(0, pins.length - MAX_CHIPS),
    }
  })
})

const legendBoards = computed(() => {
  const seen = new Map()
  for (const p of filteredPins.value) {
    if (p.board && !seen.has(p.board)) seen.set(p.board, colorForBoard(p.board))
  }
  return [...seen.entries()].map(([name, color]) => ({ name, color }))
})

// ── Tooltip ───────────────────────────────────────────────────────────────
const tip = reactive({ visible: false, x: 0, y: 0, title: '', board: '', time: '', color: '' })

function showTip(event, pin) {
  const r = event.currentTarget.getBoundingClientRect()
  // Position above the chip, centered
  tip.x     = Math.round(r.left + r.width / 2)
  tip.y     = Math.round(r.top - 8)
  tip.title = pin.title || 'Untitled'
  tip.board = pin.board || 'No board'
  tip.time  = formatTime(pin.publish_date)
  tip.color = colorForBoard(pin.board)
  tip.visible = true
}
function hideTip() {
  tip.visible = false
}
</script>

<style scoped lang="scss">
.cal {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px 32px;
  background: $color-bg;
  display: flex;
  flex-direction: column;

  // ── Header ────────────────────────────────────────────────────────
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__head-left {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    color: $color-primary;
    margin: 0;
    line-height: 1;
  }

  &__badge {
    font-size: 12px;
    font-weight: 500;
    background: #f3f4f6;
    color: #6b7280;
    padding: 2px 8px;
    border-radius: 10px;
  }

  &__head-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  // ── Toggle ────────────────────────────────────────────────────────
  &__toggle {
    display: flex;
    align-items: center;
    gap: 7px;
    cursor: pointer;
    user-select: none;

    input { display: none; }
  }

  &__toggle-box {
    position: relative;
    flex-shrink: 0;
    width: 28px;
    height: 16px;
    border: 1.5px solid #d1d5db;
    border-radius: 8px;
    background: #fff;
    transition: background 0.15s, border-color 0.15s;

    &::after {
      content: '';
      position: absolute;
      left: 2px;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #d1d5db;
      transition: left 0.15s, background 0.15s;
    }

    &--on {
      background: $color-accent;
      border-color: $color-accent;

      &::after { left: 14px; background: #fff; }
    }
  }

  &__toggle-label {
    font-size: 13px;
    color: #4b5563;
    white-space: nowrap;
  }

  // ── Buttons ───────────────────────────────────────────────────────
  &__today-btn {
    padding: 5px 12px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    color: $color-primary;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s, border-color 0.12s;

    &:hover { background: #f3f4f6; border-color: #9ca3af; }
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  &__nav-btn,
  &__refresh-btn {
    width: 28px;
    height: 28px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    color: #6b7280;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.12s, color 0.12s, border-color 0.12s;

    &:hover:not(:disabled) { background: #f3f4f6; color: $color-primary; border-color: #d1d5db; }
    &:disabled             { opacity: 0.5; cursor: default; }
  }

  &__month-label {
    font-size: 13.5px;
    font-weight: 600;
    color: $color-primary;
    min-width: 136px;
    text-align: center;
    white-space: nowrap;
  }

  &__refresh-btn--spin svg { animation: cal-spin 0.7s linear infinite; }

  // ── Legend ────────────────────────────────────────────────────────
  &__legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-bottom: 10px;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: #4b5563;
  }

  &__legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  // ── Unified grid (weekday headers + day cells share columns) ──────
  &__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: #e5e7eb;
    border: 1px solid #e5e7eb;
    border-radius: $radius-md;
    overflow: hidden;
    flex: 1;
  }

  // ── Weekday header (first 7 cells of the grid) ────────────────────
  &__weekday {
    background: #f9fafb;
    text-align: center;
    font-size: 10.5px;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 6px 0 7px;
  }

  // ── Cell ──────────────────────────────────────────────────────────
  &__cell {
    background: #fff;
    padding: 5px 4px 6px;
    min-height: 90px;

    &--other { background: #fafafa; }
    &--skel  {
      background: #f3f4f6;
      animation: cal-pulse 1.6s ease-in-out infinite;
    }
  }

  &__date {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 500;
    color: #6b7280;
    margin-bottom: 3px;
    line-height: 1;

    .cal__cell--other & { color: #d1d5db; }

    &--today {
      background: $color-accent;
      color: #fff !important;
      font-weight: 700;
    }
  }

  // ── Chips container (2-column micro-grid) ─────────────────────────
  &__chips {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }

  // ── Chip: board color bg + time only; tooltip via JS ─────────────
  &__chip {
    display: flex;
    align-items: center;
    padding: 1px 4px;
    border-radius: 3px;
    border-left: 2px solid var(--bc, #6366f1);
    background: color-mix(in srgb, var(--bc, #6366f1) 14%, transparent);
    overflow: hidden;
    cursor: default;
    min-width: 0;

    &:hover {
      background: color-mix(in srgb, var(--bc, #6366f1) 26%, transparent);
    }

    &-time {
      flex-shrink: 0;
      font-size: 8.5px;
      font-weight: 700;
      color: color-mix(in srgb, var(--bc, #6366f1) 80%, #111);
      line-height: 1.5;
      white-space: nowrap;
    }
  }

  // "+n more" spans both columns
  &__chip-more {
    grid-column: 1 / -1;
    font-size: 9.5px;
    font-weight: 500;
    color: #9ca3af;
    padding: 1px 2px;
    line-height: 1;
  }
}

@keyframes cal-spin  { to { transform: rotate(360deg); } }
@keyframes cal-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
</style>

<!-- Tooltip lives at body level so overflow:hidden never clips it -->
<style lang="scss">
.cal-tip {
  position: fixed;
  transform: translate(-50%, -100%);
  z-index: 9999;
  pointer-events: none;
  background: #1f2937;
  color: #f9fafb;
  border-radius: 7px;
  padding: 7px 10px 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.22);
  white-space: nowrap;
  max-width: 260px;

  &__title {
    font-size: 12.5px;
    font-weight: 600;
    line-height: 1.35;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #9ca3af;
    line-height: 1;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__sep { color: #4b5563; }
}
</style>
