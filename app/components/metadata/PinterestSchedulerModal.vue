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
        <div class="ps-modal__field ps-modal__field--info">
          <label class="ps-modal__label">Images to schedule</label>
          <span class="ps-modal__count-badge">{{ images.length }}</span>
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

      <!-- Day-spread summary -->
      <div v-if="rows.length > 0" class="ps-modal__spread-summary">
        <span>{{ daySpreadText }}</span>
        <span class="ps-modal__slot-info">{{ intervalText }}</span>
      </div>

      <!-- No images warning -->
      <div v-if="images.length === 0" class="ps-modal__empty">
        No images selected. Select images or filter the gallery first.
      </div>

      <!-- Rows list -->
      <div v-else class="ps-modal__rows-wrap">
        <div class="ps-modal__rows-head">
          <span class="ps-col-idx">#</span>
          <span class="ps-col-name">Filename</span>
          <span class="ps-col-date">Date</span>
          <span class="ps-col-time">Time</span>
        </div>
        <div class="ps-modal__rows-body">
          <div v-for="(row, i) in rows" :key="row.image.id" class="ps-modal__row">
            <span class="ps-col-idx ps-modal__row-num">{{ i + 1 }}</span>
            <span class="ps-col-name ps-modal__row-name" :title="row.image.filename">{{ row.image.filename }}</span>
            <span class="ps-col-date ps-modal__row-date">{{ formatDateDisplay(row.date) }}</span>
            <select v-model="row.time" class="ps-col-time ps-modal__time-select">
              <option v-for="slot in TIME_SLOTS" :key="slot" :value="slot">{{ slot }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div class="ps-modal__footer">
      <button
        class="ps-modal__btn ps-modal__btn--primary"
        :disabled="rows.length === 0 || loading || saving"
        @click="handleApply"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="ps-modal__spin" :class="{ 'ps-modal__spin--hidden': !loading && !saving }">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <template v-if="loading">Loading schedule…</template>
        <template v-else-if="saving">Saving…</template>
        <template v-else>Apply to {{ rows.length }} image{{ rows.length !== 1 ? 's' : '' }}</template>
      </button>
      <button class="ps-modal__btn" @click="emit('cancel')">Cancel</button>
      <span v-if="saveError" class="ps-modal__save-error">{{ saveError }}</span>
    </div>
  </div>
</template>

<script setup>
import { toRaw } from 'vue'
import { TIME_SLOTS } from '~/composables/usePublishScheduler'

const props = defineProps({
  images: { type: Array, required: true },
  scheduleInfo: { type: Object, default: null },
  // { latestTimestamp: ISO|null, existingTimestamps: ISO[] }
  loading: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  saveError: { type: String, default: null },
})

const emit = defineEmits(['apply', 'cancel'])

// ── Config ────────────────────────────────────────────────────────────────────

const startDate = ref(latestLocalDate())
const perDay = ref(5)

function latestLocalDate() {
  if (!props.scheduleInfo?.latestTimestamp) return todayLocalDate()
  return localDateStr(new Date(props.scheduleInfo.latestTimestamp))
}

function todayLocalDate() {
  return localDateStr(new Date())
}

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

watch(() => props.scheduleInfo, (info) => {
  if (info?.latestTimestamp) {
    startDate.value = localDateStr(new Date(info.latestTimestamp))
  }
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
  // Don't count images we're about to reschedule as "already existing"
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

// ── Slot generation ───────────────────────────────────────────────────────────

function generateDaySlots(n) {
  const rawInterval = (24 * 60) / n
  const interval = Math.max(30, Math.round(rawInterval / 30) * 30)

  return Array.from({ length: n }, (_, i) => {
    const min = (i * interval) % 1440
    const h = Math.floor(min / 60)
    const m = min % 60
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12 = h % 12 === 0 ? 12 : h % 12
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
  })
}

// ── Row generation ────────────────────────────────────────────────────────────

const rows = ref([])

function regenerateRows() {
  const n = Math.max(1, perDay.value)
  const slots = generateDaySlots(n)
  let curDate = startDate.value
  let slotIdx = existingCountOnStartDay.value

  rows.value = props.images.map(image => {
    if (slotIdx >= n) {
      const d = new Date(`${curDate}T00:00:00`)
      d.setDate(d.getDate() + 1)
      curDate = localDateStr(d)
      slotIdx = 0
    }
    const date = curDate
    const time = slots[slotIdx] ?? slots[0]
    slotIdx++
    return { image, date, time }
  })
}

watch([startDate, perDay, () => props.scheduleInfo, () => props.images], regenerateRows, { immediate: true })

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

const daySpreadText = computed(() => {
  if (rows.value.length === 0) return ''
  const dates = [...new Set(rows.value.map(r => r.date))]
  if (dates.length === 1) return `All on ${formatDateDisplay(dates[0])}`
  return `Spread across ${dates.length} days (${formatDateDisplay(dates[0])} – ${formatDateDisplay(dates[dates.length - 1])})`
})

const intervalText = computed(() => {
  const n = Math.max(1, perDay.value)
  const rawInterval = (24 * 60) / n
  const interval = Math.max(30, Math.round(rawInterval / 30) * 30)
  const h = Math.floor(interval / 60)
  const m = interval % 60
  if (h === 0) return `${m}min intervals`
  if (m === 0) return `${h}h intervals`
  return `${h}h ${m}min intervals`
})

// ── Apply ─────────────────────────────────────────────────────────────────────

function parseTime12(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!match) return { hours: 0, minutes: 0 }
  let h = parseInt(match[1])
  const min = parseInt(match[2])
  if (match[3].toUpperCase() === 'AM' && h === 12) h = 0
  if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12
  return { hours: h, minutes: min }
}

function handleApply() {
  const now = new Date().toISOString()
  const updated = rows.value.map(({ image, date, time }) => {
    const raw = toRaw(image)
    const d = new Date(`${date}T00:00:00`)
    const { hours, minutes } = parseTime12(time)
    d.setHours(hours, minutes, 0, 0)
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
  max-height: 85vh;
  width: 100%;
  max-width: 720px;
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
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
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

    &--info { justify-content: flex-end; }
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

  &__count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    padding: 0 14px;
    background: #f0fdf4;
    border: 1px solid #86efac;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    color: #16a34a;
  }

  // ── Info box ────────────────────────────────────────────────────────────────

  &__info-box {
    padding: 14px 16px;
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

  // ── Spread summary ──────────────────────────────────────────────────────────

  &__spread-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 12px;
    color: #374151;
  }

  &__slot-info {
    font-size: 11px;
    color: #6b7280;
  }

  // ── Empty ───────────────────────────────────────────────────────────────────

  &__empty {
    text-align: center;
    padding: 32px 16px;
    color: #9ca3af;
    font-size: 13px;
  }

  // ── Rows table ──────────────────────────────────────────────────────────────

  &__rows-wrap {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  &__rows-head {
    display: flex;
    align-items: center;
    padding: 7px 10px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    gap: 8px;
  }

  &__rows-body {
    overflow-y: auto;
    max-height: 340px;
  }

  &__row {
    display: flex;
    align-items: center;
    padding: 7px 10px;
    gap: 8px;
    border-bottom: 1px solid #f3f4f6;
    font-size: 13px;

    &:last-child { border-bottom: none; }
    &:hover { background: #fafafa; }
  }

  &__row-num {
    color: #9ca3af;
    font-size: 11px;
  }

  &__row-name {
    color: $color-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__row-date {
    color: #374151;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  &__time-select {
    height: 28px;
    padding: 0 6px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font: inherit;
    font-size: 12px;
    background: #fff;
    color: $color-primary;
    cursor: pointer;

    &:focus { outline: none; border-color: $color-accent; }
  }

  // Column widths
  .ps-col-idx  { flex: 0 0 28px; text-align: center; }
  .ps-col-name { flex: 1; min-width: 0; }
  .ps-col-date { flex: 0 0 90px; text-align: center; }
  .ps-col-time { flex: 0 0 120px; }

  // ── Footer ──────────────────────────────────────────────────────────────────

  &__footer {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    border-top: 1px solid #f3f4f6;
    flex-shrink: 0;
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
}
</style>
