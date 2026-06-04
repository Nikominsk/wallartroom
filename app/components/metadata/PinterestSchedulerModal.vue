<template>
  <div class="ps-modal">
    <div class="ps-modal__header">
      <div class="ps-modal__title-row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#e60023" class="ps-modal__pin-icon">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
        </svg>
        <h3>Pinterest Bulk Scheduling</h3>
      </div>
      <button class="ps-modal__close-btn" @click="emit('cancel')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </div>

    <div class="ps-modal__body">
      <!-- Config row -->
      <div class="ps-modal__config">
        <div class="ps-modal__field">
          <label class="ps-modal__label">Start date</label>
          <input type="date" v-model="startDate" class="ps-modal__input" />
        </div>
        <div class="ps-modal__field">
          <label class="ps-modal__label">Uploads per day</label>
          <input type="number" v-model.number="perDay" min="1" max="48" class="ps-modal__input ps-modal__input--sm" />
        </div>

        <!-- Queue context stats -->
        <div v-if="props.loading" class="ps-modal__queue">
          <div class="ps-modal__queue-label">Schedule status <a href="/metadata/calendar" target="_blank" class="ps-modal__queue-cal-link">View calendar ↗</a></div>
          <div class="ps-modal__queue-row">
            <svg class="ps-modal__queue-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span class="ps-modal__queue-none">Loading…</span>
          </div>
        </div>
        <div v-else-if="queueStats" class="ps-modal__queue">
          <div class="ps-modal__queue-label">Schedule status <a href="/metadata/calendar" target="_blank" class="ps-modal__queue-cal-link">View calendar ↗</a></div>
          <div class="ps-modal__queue-row">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="6" r="5"/><path d="M6 3v3l2 1.5"/></svg>
            <template v-if="queueStats.denseEnd">
              {{ exportedOnly ? 'Exported' : 'Scheduled' }} through <strong>{{ formatDateDisplay(queueStats.denseEnd) }}</strong>
              <span class="ps-modal__queue-days">{{ queueStats.denseEndDaysAhead }}d from now</span>
              <button class="ps-modal__queue-use" :title="`Set start date to ${formatDateDisplay(queueStats.suggestStart)}`" @click="startDate = queueStats.suggestStart">
                Start {{ formatDateDisplay(queueStats.suggestStart) }} →
              </button>
            </template>
            <template v-else>
              <span class="ps-modal__queue-none">No day has {{ perDay }}+ pins yet</span>
              <template v-if="queueStats.anyEnd">
                · last pin on <strong>{{ formatDateDisplay(queueStats.anyEnd) }}</strong>
              </template>
            </template>
          </div>
          <div v-if="queueStats.outlierCount" class="ps-modal__queue-row ps-modal__queue-row--warn">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 1L1 10h10L6 1z"/><path d="M6 5v2M6 8.5h.01"/></svg>
            {{ queueStats.outlierCount }} single pin{{ queueStats.outlierCount !== 1 ? 's' : '' }} scheduled much later (up to <strong>{{ formatDateDisplay(queueStats.outlierEnd) }}</strong>) — sparse days, not counted above
          </div>
        </div>
        <div v-else class="ps-modal__queue">
          <div class="ps-modal__queue-label">Schedule status <a href="/metadata/calendar" target="_blank" class="ps-modal__queue-cal-link">View calendar ↗</a></div>
          <div class="ps-modal__queue-row ps-modal__queue-none">No exported pins with a date yet</div>
        </div>
      </div>

      <!-- Schedule density sparkline -->
      <div v-if="chartDays" class="ps-modal__chart">
        <div class="ps-modal__chart-head">
          <span class="ps-modal__chart-label">Schedule density</span>
          <label class="ps-modal__chart-toggle">
            <input type="checkbox" v-model="exportedOnly" class="ps-modal__chart-toggle-input" />
            <span class="ps-modal__chart-toggle-box" :class="{ 'ps-modal__chart-toggle-box--on': exportedOnly }" />
            <span class="ps-modal__chart-toggle-label">Exported only</span>
          </label>
        </div>
        <svg class="ps-modal__chart-svg" :viewBox="`0 0 ${CHART_W} ${CHART_H}`" aria-hidden="true">
          <!-- Horizontal grid lines at max and mid -->
          <line :x1="CHART_PAD_L" :y1="CHART_PAD_T" :x2="CHART_W - CHART_PAD_R" :y2="CHART_PAD_T" class="ps-modal__chart-grid" />
          <line :x1="CHART_PAD_L" :y1="CHART_MID_Y" :x2="CHART_W - CHART_PAD_R" :y2="CHART_MID_Y" class="ps-modal__chart-grid" />
          <!-- Area fill under the line -->
          <path :d="chartAreaPath" class="ps-modal__chart-area" />
          <!-- Line -->
          <polyline :points="chartPoints" class="ps-modal__chart-line" fill="none" />
          <!-- Baseline (x-axis) -->
          <line :x1="CHART_PAD_L" :y1="CHART_BOTTOM" :x2="CHART_W - CHART_PAD_R" :y2="CHART_BOTTOM" class="ps-modal__chart-axis" />
          <!-- Y-axis labels: max and mid only -->
          <text :x="CHART_PAD_L - 4" :y="CHART_PAD_T + 1" text-anchor="end" dominant-baseline="hanging" class="ps-modal__chart-ylabel">{{ chartMax }}</text>
          <text v-if="chartMid < chartMax" :x="CHART_PAD_L - 4" :y="CHART_MID_Y" text-anchor="end" dominant-baseline="middle" class="ps-modal__chart-ylabel">{{ chartMid }}</text>
          <!-- X-axis labels: only where the line first hits zero after a run of exports -->
          <template v-for="(d, i) in chartDays" :key="`xl-${i}`">
            <text
              v-if="i > 0 && d.count === 0 && chartDays[i - 1].count > 0"
              :x="chartX(i)"
              :y="CHART_BOTTOM + 13"
              text-anchor="middle"
              class="ps-modal__chart-xlabel"
            >{{ formatChartDate(d.date) }}</text>
          </template>
          <!-- Suggested start marker -->
          <template v-if="suggestStartIdx >= 0">
            <line
              :x1="chartX(suggestStartIdx)"
              :y1="CHART_PAD_T - 2"
              :x2="chartX(suggestStartIdx)"
              :y2="CHART_BOTTOM"
              class="ps-modal__chart-suggest-line"
            />
            <text
              :x="clampedChartX(suggestStartIdx)"
              :y="CHART_PAD_T - 3"
              text-anchor="middle"
              dominant-baseline="auto"
              class="ps-modal__chart-suggest-text"
            >{{ formatChartDate(queueStats.suggestStart) }}</text>
          </template>
        </svg>
      </div>

      <!-- Counts summary -->
      <div class="ps-modal__counts">
        <span class="ps-modal__count-chip ps-modal__count-chip--ok">
          <strong>{{ images.length }}</strong> valid to schedule
        </span>
        <span v-if="invalidCount > 0" class="ps-modal__count-chip ps-modal__count-chip--skip">
          <strong>{{ invalidCount }}</strong> invalid skipped
        </span>
        <span v-if="images.length > 0" class="ps-modal__count-chip ps-modal__count-chip--info">
          spans <strong>{{ daySpan }}</strong> day{{ daySpan !== 1 ? 's' : '' }}
          ({{ formatDateDisplay(scheduleRange.first) }}
          <template v-if="scheduleRange.last !== scheduleRange.first">– {{ formatDateDisplay(scheduleRange.last) }}</template>)
        </span>
      </div>

      <!-- Editable time slots -->
      <div class="ps-modal__slots">
        <div class="ps-modal__slots-header">
          <span class="ps-modal__label">Posting times ({{ slots.length }} per day)</span>
          <div class="ps-modal__slots-actions">
            <button type="button" class="ps-modal__mini-btn" @click="resetSlots">Auto space</button>
          </div>
        </div>
        <div class="ps-modal__slots-grid">
          <div v-for="(slot, i) in slots" :key="i" class="ps-modal__slot">
            <span class="ps-modal__slot-num">#{{ i + 1 }}</span>
            <input
              type="time"
              v-model="slots[i]"
              step="60"
              class="ps-modal__slot-input"
            />
          </div>
        </div>
      </div>

      <!-- Order cards -->
      <div class="ps-modal__order">
        <div class="ps-modal__order-header">
          <span class="ps-modal__label">Image order</span>
          <span class="ps-modal__order-status">{{ orderStatus }}</span>
        </div>
        <div class="ps-modal__order-cards">
          <label
            v-for="opt in ORDER_OPTIONS"
            :key="opt.value"
            class="ps-modal__order-card"
            :class="{ 'ps-modal__order-card--active': orderMode === opt.value }"
          >
            <input
              type="radio"
              name="ps-order"
              :value="opt.value"
              v-model="orderMode"
              class="ps-modal__order-radio"
            />
            <span class="ps-modal__order-card-title">{{ opt.title }}</span>
          </label>
        </div>
      </div>

      <!-- Info box: existing schedule on start date -->
      <div v-if="infoVisible" class="ps-modal__info-box">
        <div class="ps-modal__info-title">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v4M10 14h.01" />
          </svg>
          <strong>{{ formatDateDisplay(startDate) }}</strong>&nbsp;already has
          {{ existingTimesLocal.length }}
          scheduled Pinterest upload{{ existingTimesLocal.length !== 1 ? 's' : '' }}:
        </div>
        <div class="ps-modal__info-times">
          <span v-for="t in existingTimesLocal" :key="t" class="ps-modal__info-time-chip">{{ t }}</span>
        </div>
        <div v-if="remainingSlotsOnDay > 0" class="ps-modal__info-remaining">
          With <strong>{{ perDay }}</strong> uploads per day,
          <strong>{{ remainingSlotsOnDay }}</strong> more
          upload{{ remainingSlotsOnDay !== 1 ? 's' : '' }} can still be scheduled on this day.
        </div>
        <div v-else class="ps-modal__info-full">
          This day is already full at {{ perDay }} uploads per day. Scheduling will start from the next day.
        </div>
      </div>

      <!-- No images warning -->
      <div v-if="images.length === 0" class="ps-modal__empty">
        No valid images to schedule.
        <template v-if="invalidCount > 0">All targeted images have invalid URLs — fix them via "Show invalid" first.</template>
        <template v-else>Select images or filter the gallery first.</template>
      </div>
    </div>

    <div class="ps-modal__footer">
      <button
        class="ps-modal__btn ps-modal__btn--primary"
        :disabled="images.length === 0 || loading || saving"
        @click="handleApply"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="ps-modal__spin" :class="{ 'ps-modal__spin--hidden': !loading && !saving }">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <template v-if="loading">Loading schedule…</template>
        <template v-else-if="saving">Saving…</template>
        <template v-else>Schedule {{ images.length }} image{{ images.length !== 1 ? 's' : '' }}</template>
      </button>
      <button class="ps-modal__btn" @click="emit('cancel')">Cancel</button>
      <span v-if="saveError" class="ps-modal__save-error">{{ saveError }}</span>
    </div>
  </div>
</template>

<script setup>
import { toRaw } from 'vue'

const props = defineProps({
  images: { type: Array, required: true },
  scheduleInfo: { type: Object, default: null },
  // { latestTimestamp: ISO|null, existingTimestamps: ISO[] }
  loading: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  saveError: { type: String, default: null },
  invalidCount: { type: Number, default: 0 },
})

const emit = defineEmits(['apply', 'cancel'])

// ── Config ────────────────────────────────────────────────────────────────────

const startDate = ref(tomorrowLocalDate())
const perDay = ref(5)

function tomorrowLocalDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return localDateStr(d)
}

function todayLocalDate() {
  return localDateStr(new Date())
}

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Time slots (editable, in 24-h "HH:MM" form) ───────────────────────────────

const slots = ref([])

function autoSpacedSlots(n) {
  const rawInterval = (24 * 60) / n
  const interval = Math.max(30, Math.round(rawInterval / 30) * 30)
  return Array.from({ length: n }, (_, i) => {
    const min = (i * interval) % 1440
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  })
}

function resetSlots() {
  slots.value = autoSpacedSlots(Math.max(1, perDay.value))
}

watch(perDay, (n) => {
  n = Math.max(1, n)
  if (slots.value.length === n) return
  if (slots.value.length < n) {
    // Keep existing times, fill the rest using auto-spaced defaults.
    const filler = autoSpacedSlots(n).slice(slots.value.length)
    slots.value = [...slots.value, ...filler]
  } else {
    slots.value = slots.value.slice(0, n)
  }
}, { immediate: false })

// Seed slots on first mount.
slots.value = autoSpacedSlots(perDay.value)

// ── Image ordering ────────────────────────────────────────────────────────────

const ORDER_OPTIONS = [
  {
    value: 'gallery',
    title: 'Gallery order',
    desc: 'Images are scheduled in the same sequence they currently appear in the gallery.',
  },
  {
    value: 'random',
    title: 'Randomize',
    desc: 'Images are shuffled randomly before dates are assigned. Re-select to get a different shuffle.',
  },
  {
    value: 'optimized',
    title: 'Optimized schedule',
    desc: 'Pins from the same board are spread as far apart as possible across all scheduled days.',
  },
]

const orderMode     = ref('gallery')
const orderedImages = ref([...props.images])

watch(() => props.images, (imgs) => {
  if (orderMode.value !== 'gallery') {
    // Re-sync: keep existing order for ids still present, append new ones.
    const known = new Map(imgs.map(i => [i.id, i]))
    const next  = orderedImages.value.map(o => known.get(o.id)).filter(Boolean)
    const seen  = new Set(next.map(i => i.id))
    for (const img of imgs) if (!seen.has(img.id)) next.push(img)
    orderedImages.value = next
  } else {
    orderedImages.value = [...imgs]
  }
}, { immediate: true })

watch(orderMode, (mode) => {
  if (mode === 'gallery') {
    orderedImages.value = [...props.images]
  } else if (mode === 'random') {
    const arr = [...props.images]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    orderedImages.value = arr
  } else if (mode === 'optimized') {
    const bucketMap = new Map()
    for (const img of props.images) {
      const key = img.pinterest?.board || ''
      if (!bucketMap.has(key)) bucketMap.set(key, [])
      bucketMap.get(key).push(img)
    }
    const buckets = [...bucketMap.values()].map(b => [...b])
    const result  = []
    let lastIdx   = -1
    while (true) {
      const nonEmpty = buckets
        .map((b, i) => ({ b, i }))
        .filter(x => x.b.length > 0)
        .sort((a, b) => b.b.length - a.b.length)
      if (nonEmpty.length === 0) break
      const pick = nonEmpty.find(x => x.i !== lastIdx) ?? nonEmpty[0]
      result.push(pick.b.shift())
      lastIdx = pick.i
    }
    orderedImages.value = result
  }
})

const orderStatus = computed(() => {
  if (orderMode.value === 'random')    return 'Randomly shuffled — each time you select this you get a new sequence.'
  if (orderMode.value === 'optimized') return 'Board-optimized — pins from the same board are spaced as far apart as possible across the scheduled days.'
  return 'Dates are assigned following the current gallery order.'
})

// ── Existing-day info ─────────────────────────────────────────────────────────

const latestLocalDateValue = computed(() => {
  if (!props.scheduleInfo?.latestTimestamp) return null
  return localDateStr(new Date(props.scheduleInfo.latestTimestamp))
})

const isStartSameAsLatest = computed(() =>
  !!latestLocalDateValue.value && startDate.value === latestLocalDateValue.value
)

const existingTimesLocal = computed(() => {
  if (!props.scheduleInfo?.existingTimestamps?.length) return []
  return props.scheduleInfo.existingTimestamps.map(ts => fmt12Local(new Date(ts)))
})

const infoVisible = computed(() =>
  isStartSameAsLatest.value && existingTimesLocal.value.length > 0
)

const existingCountOnStartDay = computed(() => {
  if (!isStartSameAsLatest.value) return 0
  const total = props.scheduleInfo?.existingTimestamps?.length ?? 0
  const targetOnStartDay = props.images.filter(img => {
    const pd = img.pinterest?.publishDate
    if (!pd) return false
    return localDateStr(new Date(pd)) === startDate.value
  }).length
  return Math.max(0, total - targetOnStartDay)
})

const remainingSlotsOnDay = computed(() =>
  Math.max(0, perDay.value - existingCountOnStartDay.value)
)

// ── Exported-only toggle ──────────────────────────────────────────────────────

const exportedOnly = ref(true)

// The active day-count map switches between exported-only and all-scheduled
// depending on the checkbox. Both come pre-computed from the server.
const activeDayCounts = computed(() =>
  exportedOnly.value
    ? props.scheduleInfo?.exportedDayCounts
    : props.scheduleInfo?.allDayCounts
)

// ── Exported queue stats ──────────────────────────────────────────────────────

function dateDiffDays(laterStr, earlierStr) {
  const a = new Date(`${laterStr}T00:00:00`)
  const b = new Date(`${earlierStr}T00:00:00`)
  return Math.round((a - b) / 86400000)
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}

const queueStats = computed(() => {
  const dayCounts = activeDayCounts.value
  if (!dayCounts || Object.keys(dayCounts).length === 0) return null

  const n = Math.max(1, perDay.value)
  const today = todayLocalDate()
  const dates = Object.keys(dayCounts).sort()

  // Last date where at least n exports are scheduled — the "dense" end of queue
  let denseEnd = null
  for (const d of dates) {
    if (dayCounts[d] >= n) denseEnd = d
  }

  // Dates beyond denseEnd (sparse — below the perDay threshold)
  const outlierDates = dates.filter(d => denseEnd ? d > denseEnd : false)
  const outlierCount = outlierDates.reduce((s, d) => s + dayCounts[d], 0)
  const outlierEnd   = outlierDates[outlierDates.length - 1] ?? null

  const anyEnd = dates[dates.length - 1]  // absolute latest exported date

  const suggestStart = denseEnd ? (addDays(denseEnd, 1) > tomorrowLocalDate() ? addDays(denseEnd, 1) : tomorrowLocalDate()) : null
  const denseEndDaysAhead = denseEnd ? dateDiffDays(denseEnd, today) : null

  return { denseEnd, denseEndDaysAhead, suggestStart, outlierCount, outlierEnd, anyEnd }
})

// ── Computed schedule (date per image, based on order × slots × start) ────────

const computedSchedule = computed(() => {
  const n = Math.max(1, perDay.value)
  const dayTimes = slots.value.length ? slots.value : autoSpacedSlots(n)
  let curDate = startDate.value
  let slotIdx = existingCountOnStartDay.value

  return orderedImages.value.map(image => {
    if (slotIdx >= n) {
      const d = new Date(`${curDate}T00:00:00`)
      d.setDate(d.getDate() + 1)
      curDate = localDateStr(d)
      slotIdx = 0
    }
    const time = dayTimes[slotIdx] ?? dayTimes[0]
    slotIdx++
    return { image, date: curDate, time }
  })
})

const scheduleRange = computed(() => {
  const sched = computedSchedule.value
  if (sched.length === 0) return { first: startDate.value, last: startDate.value }
  return { first: sched[0].date, last: sched[sched.length - 1].date }
})

const daySpan = computed(() => {
  const sched = computedSchedule.value
  if (sched.length === 0) return 0
  const dates = new Set(sched.map(r => r.date))
  return dates.size
})

// ── Display helpers ───────────────────────────────────────────────────────────

function formatDateDisplay(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}.${m}.${y}`
}

function fmt12Local(date) {
  const h = date.getHours()
  const m = date.getMinutes()
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
}

// ── Schedule density sparkline ────────────────────────────────────────────────

const CHART_W      = 500
const CHART_H      = 74
const CHART_PAD_L  = 28   // left: room for y-axis labels (e.g. "25")
const CHART_PAD_R  = 6
const CHART_PAD_T  = 16   // top: room for "start here" label above the line
const CHART_PAD_B  = 18   // bottom: room for x-axis date labels
const CHART_IW     = CHART_W - CHART_PAD_L - CHART_PAD_R
const CHART_IH     = CHART_H - CHART_PAD_T - CHART_PAD_B
const CHART_BOTTOM = CHART_PAD_T + CHART_IH
const CHART_MID_Y  = CHART_PAD_T + CHART_IH / 2

const chartDays = computed(() => {
  const dayCounts = activeDayCounts.value
  if (!dayCounts || Object.keys(dayCounts).length === 0) return null

  const today  = todayLocalDate()
  const maxEnd = addDays(today, 90)

  const futureDates = Object.keys(dayCounts).filter(d => d >= today).sort()
  if (futureDates.length === 0) return null

  const lastExport = futureDates[futureDates.length - 1]
  const rawEnd     = addDays(lastExport, 2)
  const endDate    = rawEnd > maxEnd ? maxEnd : rawEnd

  const days = []
  let cur = today
  while (cur <= endDate) {
    days.push({ date: cur, count: dayCounts[cur] ?? 0 })
    cur = addDays(cur, 1)
  }
  return days.length >= 2 ? days : null
})

const chartMax = computed(() =>
  Math.max(...(chartDays.value?.map(d => d.count) ?? []), 1)
)
const chartMid = computed(() => {
  const half = chartMax.value / 2
  return half % 1 === 0 ? half : Math.ceil(half)
})

function chartX(i) {
  const total = chartDays.value?.length ?? 1
  return total <= 1 ? CHART_PAD_L : CHART_PAD_L + (i / (total - 1)) * CHART_IW
}
function chartY(count) {
  return CHART_BOTTOM - (count / chartMax.value) * CHART_IH
}
function clampedChartX(i, margin = 22) {
  return Math.max(CHART_PAD_L + margin, Math.min(CHART_W - CHART_PAD_R - margin, chartX(i)))
}

const chartPoints = computed(() =>
  chartDays.value?.map((d, i) => `${chartX(i)},${chartY(d.count)}`).join(' ') ?? ''
)

const chartAreaPath = computed(() => {
  if (!chartDays.value || chartDays.value.length < 2) return ''
  const pts = chartDays.value.map((d, i) => `${chartX(i)},${chartY(d.count)}`).join(' L ')
  const last = chartX(chartDays.value.length - 1)
  return `M ${chartX(0)},${CHART_BOTTOM} L ${pts} L ${last},${CHART_BOTTOM} Z`
})

const suggestStartIdx = computed(() => {
  if (!chartDays.value || !queueStats.value?.suggestStart) return -1
  return chartDays.value.findIndex(d => d.date >= queueStats.value.suggestStart)
})

function formatChartDate(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-')
  return `${d}.${m}`
}

// ── Apply ─────────────────────────────────────────────────────────────────────

function handleApply() {
  const now = new Date().toISOString()
  const updated = computedSchedule.value.map(({ image, date, time }) => {
    const raw = toRaw(image)
    const [hh, mm] = (time ?? '12:00').split(':').map(Number)
    const d = new Date(`${date}T00:00:00`)
    d.setHours(hh || 0, mm || 0, 0, 0)
    return {
      ...raw,
      pinterest: { ...toRaw(raw.pinterest), publishDate: d.toISOString() },
      updatedAt: now,
    }
  })
  emit('apply', updated)
}
</script>

<style scoped lang="scss">
.ps-modal {
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  width: 100%;
  max-width: 640px;
  background: #fff;
  border-radius: $radius-md;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 9px;

    h3 { margin: 0; font-size: 16px; font-weight: 600; color: $color-primary; }
  }

  &__pin-icon { flex-shrink: 0; }

  &__close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    transition: background 0.15s;

    &:hover { background: #f3f4f6; color: $color-primary; }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  // ── Config row ──────────────────────────────────────────────────────────────

  &__config {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__input {
    height: 34px;
    padding: 0 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    background: #fafafa;
    color: $color-primary;
    box-sizing: border-box;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }
    &--sm { width: 90px; }
  }

  // ── Queue stats ─────────────────────────────────────────────────────────────

  &__queue {
    flex: 1;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 8px 12px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    align-self: flex-end;
  }

  &__queue-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 10px;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__queue-cal-link {
    font-size: 10px;
    font-weight: 600;
    color: #9ca3af;
    text-decoration: none;
    text-transform: none;
    letter-spacing: 0;
    transition: color 0.12s;

    &:hover { color: $color-accent; }
  }

  &__queue-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #374151;
    flex-wrap: wrap;

    svg { flex-shrink: 0; color: #6b7280; }

    strong { font-weight: 700; color: $color-primary; }

    &--warn { color: #92400e; svg { color: #d97706; } }
  }

  &__queue-days {
    font-size: 11px;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 1px 6px;
    border-radius: 10px;
  }

  &__queue-use {
    margin-left: 2px;
    background: none;
    border: 1px solid $color-accent;
    border-radius: 5px;
    color: $color-accent;
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    padding: 1px 7px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s;

    &:hover { background: $color-accent; color: #fff; }
  }

  &__queue-none {
    font-size: 12px;
    color: #9ca3af;
  }

  &__queue-spin {
    flex-shrink: 0;
    color: #9ca3af;
    animation: ps-spin 0.9s linear infinite;
  }

  // ── Counts ──────────────────────────────────────────────────────────────────

  &__counts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__count-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    border: 1px solid transparent;

    strong { font-weight: 700; }

    &--ok { background: #f0fdf4; border-color: #86efac; color: #15803d; }
    &--skip { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
    &--info { background: #f0f4ff; border-color: #c7d7fd; color: #3730a3; }
  }

  // ── Slots editor ────────────────────────────────────────────────────────────

  &__slots {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fafafa;
  }

  &__slots-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__slots-actions { display: flex; gap: 6px; }

  &__slots-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  &__slot {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }

  &__slot-num {
    font-size: 11px;
    font-weight: 700;
    color: #9ca3af;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  &__slot-input {
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 6px;
    border: 1px solid transparent;
    border-radius: 6px;
    font: inherit;
    font-size: 13px;
    background: transparent;
    color: $color-primary;
    font-variant-numeric: tabular-nums;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }
  }

  // ── Order section ──────────────────────────────────────────────────────────

  &__order {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px 14px;
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
  }

  &__order-header {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__order-status {
    font-size: 11.5px;
    color: #6b7280;
    line-height: 1.4;
  }

  &__order-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  &__order-card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 9px 10px 9px 28px;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    user-select: none;

    &:hover { border-color: #d1d5db; background: #fafafa; }

    &--active {
      border-color: $color-accent;
      background: color-mix(in srgb, #{$color-accent} 6%, #fff);
    }
  }

  &__order-radio {
    position: absolute;
    top: 10px;
    left: 8px;
    width: 14px;
    height: 14px;
    accent-color: $color-accent;
    cursor: pointer;
    margin: 0;
    flex-shrink: 0;
  }

  &__order-card-title {
    font-size: 12px;
    font-weight: 700;
    color: $color-primary;
    line-height: 1.3;
  }

  &__order-card-desc {
    font-size: 11px;
    color: #6b7280;
    line-height: 1.45;
  }

  &__mini-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    font: inherit;
    font-size: 12px;
    color: $color-primary;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: #f3f4f6; border-color: #d1d5db; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

    &--accent {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
      font-weight: 600;

      &:hover:not(:disabled) { background: color-mix(in srgb, #{$color-accent} 94%, #000); border-color: color-mix(in srgb, #{$color-accent} 94%, #000); }
    }
  }

  // ── Info box ────────────────────────────────────────────────────────────────

  &__info-box {
    padding: 12px 14px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 13px;
    color: #78350f;
    line-height: 1.5;
  }

  &__info-title {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;

    svg { flex-shrink: 0; color: #d97706; }
  }

  &__info-times {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-left: 20px;
  }

  &__info-time-chip {
    padding: 2px 10px;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #92400e;
  }

  &__info-remaining {
    padding-left: 20px;
    color: #065f46;
    background: #ecfdf5;
    border: 1px solid #86efac;
    border-radius: 7px;
    padding: 6px 12px;
    font-size: 12px;
  }

  &__info-full {
    padding: 6px 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 7px;
    font-size: 12px;
    color: #991b1b;
  }

  // ── Empty ───────────────────────────────────────────────────────────────────

  &__empty {
    text-align: center;
    padding: 24px 16px;
    color: #9ca3af;
    font-size: 13px;
    background: #f9fafb;
    border: 1px dashed #e5e7eb;
    border-radius: 8px;
  }

  // ── Footer ──────────────────────────────────────────────────────────────────

  &__footer {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid #f3f4f6;
    flex-shrink: 0;
    align-items: center;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 0 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover   { background: #f3f4f6; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

    &--primary {
      background: #e60023;
      border-color: #e60023;
      color: #fff;
      font-weight: 600;
      gap: 7px;

      &:hover:not(:disabled) { background: #c0001e; border-color: #c0001e; }
    }
  }

  &__spin {
    animation: ps-spin 0.9s linear infinite;
    flex-shrink: 0;

    &--hidden { display: none; }
  }

  @keyframes ps-spin {
    to { transform: rotate(360deg); }
  }

  &__save-error {
    flex: 1;
    font-size: 12px;
    color: #dc2626;
    font-weight: 500;
  }

  // ── Schedule density sparkline ─────────────────────────────────────────────

  &__chart {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 11px 14px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
  }

  &__chart-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__chart-label {
    font-size: 10px;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__chart-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    user-select: none;
  }

  &__chart-toggle-input { display: none; }

  &__chart-toggle-box {
    flex-shrink: 0;
    width: 26px;
    height: 14px;
    border: 1.5px solid #d1d5db;
    border-radius: 7px;
    background: #fff;
    position: relative;
    transition: background 0.15s, border-color 0.15s;

    &::after {
      content: '';
      position: absolute;
      left: 1px;
      top: 50%;
      transform: translateY(-50%);
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #d1d5db;
      transition: left 0.15s, background 0.15s;
    }

    &--on {
      background: $color-accent;
      border-color: $color-accent;
      &::after { left: 13px; background: #fff; }
    }
  }

  &__chart-toggle-label {
    font-size: 10px;
    color: #6b7280;
    white-space: nowrap;
  }

  &__chart-svg {
    width: 100%;
    display: block;
  }

  &__chart-grid {
    stroke: #e5e7eb;
    stroke-width: 0.8;
  }

  &__chart-axis {
    stroke: #d1d5db;
    stroke-width: 1;
  }

  &__chart-area {
    fill: color-mix(in srgb, #{$color-accent} 11%, transparent);
  }

  &__chart-line {
    stroke: $color-accent;
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  &__chart-ylabel {
    font-size: 8px;
    fill: #9ca3af;
    font-variant-numeric: tabular-nums;
  }

  &__chart-xlabel {
    font-size: 8px;
    fill: #6b7280;
    font-variant-numeric: tabular-nums;
  }

  &__chart-suggest-line {
    stroke: $color-accent;
    stroke-width: 1.5;
    stroke-dasharray: 3 2;
    opacity: 0.75;
  }

  &__chart-suggest-text {
    font-size: 8px;
    fill: $color-accent;
    font-weight: 700;
  }
}
</style>
