<template>
  <div class="single-form">
    <div class="single-form__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="single-form__tab"
        :class="{ 'single-form__tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="single-form__tab-label">{{ tab.label }}</span>
        <span v-if="tab.id === 'pinterest'" class="single-form__tab-dot"
          :class="isPinterestComplete ? 'single-form__tab-dot--ok' : 'single-form__tab-dot--warn'" />
        <span v-if="tab.id === 'adobe'" class="single-form__tab-dot"
          :class="isAdobeStockComplete ? 'single-form__tab-dot--ok' : 'single-form__tab-dot--warn'" />
      </button>
    </div>

    <div class="single-form__body">
      <!-- General tab -->
      <template v-if="activeTab === 'general'">
        <div class="single-form__field">
          <label class="single-form__label">Filename</label>
          <input class="single-form__input" :value="draft.filename" readonly />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Image ID</label>
          <input class="single-form__input single-form__input--mono" :value="draft.id" readonly />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Media URL</label>
          <input class="single-form__input" :value="draft.mediaUrl" readonly
            @input="update('mediaUrl', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Thumbnail URL</label>
          <input class="single-form__input" :value="draft.thumbnailUrl ?? ''"
            @input="update('thumbnailUrl', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Prompt</label>
          <textarea class="single-form__textarea" rows="3" :value="draft.prompt ?? ''"
            @input="update('prompt', $event.target.value)" />
        </div>
        <div v-if="draft.colors?.length" class="single-form__field">
          <label class="single-form__label">Main colors</label>
          <div class="single-form__colors">
            <div v-for="c in draft.colors" :key="c.hex" class="single-form__color">
              <span class="single-form__swatch" :style="{ background: c.hex }" />
              <span class="single-form__hex">{{ c.hex }}</span>
              <span v-if="c.label" class="single-form__color-label">{{ c.label }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Pinterest tab -->
      <template v-if="activeTab === 'pinterest'">
        <div class="single-form__field">
          <label class="single-form__label single-form__label--req">Title
            <span class="single-form__char-count"
              :class="(draft.pinterest.title?.length ?? 0) > 100 ? 'single-form__char-count--over' : ''">
              {{ draft.pinterest.title?.length ?? 0 }}/100
            </span>
          </label>
          <input class="single-form__input" :value="draft.pinterest.title ?? ''"
            @input="updatePinterest('title', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label single-form__label--req">Description
            <span class="single-form__char-count"
              :class="(draft.pinterest.description?.length ?? 0) > 500 ? 'single-form__char-count--over' : ''">
              {{ draft.pinterest.description?.length ?? 0 }}/500
            </span>
          </label>
          <textarea class="single-form__textarea" rows="4" :value="draft.pinterest.description ?? ''"
            @input="updatePinterest('description', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label single-form__label--req">Pinterest board</label>
          <select
            v-if="boards.length"
            class="single-form__select"
            :value="draft.pinterest.board ?? ''"
            @change="updatePinterest('board', $event.target.value)"
          >
            <option value="">— select board —</option>
            <option v-for="b in boards" :key="b.id" :value="b.name">{{ b.name }}</option>
          </select>
          <input
            v-else
            class="single-form__input"
            :value="draft.pinterest.board ?? ''"
            @input="updatePinterest('board', $event.target.value)"
          />
        </div>
        <div class="single-form__field">
          <label class="single-form__label single-form__label--req">Redirect URL</label>
          <input class="single-form__input" type="url" :value="draft.pinterest.link ?? ''"
            @input="updatePinterest('link', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Pinterest publish date</label>
          <div class="single-form__datetime">
            <input
              class="single-form__input single-form__input--date"
              type="date"
              :value="toDatePart(draft.pinterest.publishDate)"
              @change="onPinDateChange($event.target.value)"
            />
            <select
              class="single-form__select single-form__select--time"
              :value="toTimePart(draft.pinterest.publishDate)"
              :disabled="!draft.pinterest.publishDate"
              @change="onPinTimeChange($event.target.value)"
            >
              <option v-if="!draft.pinterest.publishDate" value="" disabled selected>— time —</option>
              <option v-for="s in TIME_SLOTS_30" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button v-if="draft.pinterest.publishDate" class="single-form__clear-btn" type="button" title="Clear" @click="updatePinterest('publishDate', null)">×</button>
          </div>
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Status</label>
          <select class="single-form__select" :value="draft.pinterest.status ?? 'draft'"
            @change="updatePinterest('status', $event.target.value)">
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="exported">Exported</option>
            <option value="published">Published</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div v-if="draft.pinterest.exportedAt" class="single-form__field">
          <label class="single-form__label">Exported at</label>
          <input class="single-form__input" :value="fmtDate(draft.pinterest.exportedAt)" readonly />
        </div>
        <div v-if="draft.pinterest.publishedAt" class="single-form__field">
          <label class="single-form__label">Published at</label>
          <input class="single-form__input" :value="fmtDate(draft.pinterest.publishedAt)" readonly />
        </div>
      </template>

      <!-- Adobe Stock tab -->
      <template v-if="activeTab === 'adobe'">
        <div class="single-form__field">
          <label class="single-form__label">Title
            <span class="single-form__char-count"
              :class="(draft.adobeStock.title?.length ?? 0) > 200 ? 'single-form__char-count--over' : ''">
              {{ draft.adobeStock.title?.length ?? 0 }}/200
            </span>
          </label>
          <input class="single-form__input" :value="draft.adobeStock.title ?? ''"
            @input="updateAdobe('title', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Description
            <span class="single-form__char-count"
              :class="(draft.adobeStock.description?.length ?? 0) > 500 ? 'single-form__char-count--over' : ''">
              {{ draft.adobeStock.description?.length ?? 0 }}/500
            </span>
          </label>
          <textarea class="single-form__textarea" rows="4" :value="draft.adobeStock.description ?? ''"
            @input="updateAdobe('description', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Keywords
            <span class="single-form__char-count"
              :class="(draft.adobeStock.keywords?.length ?? 0) > 49 ? 'single-form__char-count--over' : ''">
              {{ draft.adobeStock.keywords?.length ?? 0 }}/49
            </span>
          </label>
          <textarea class="single-form__textarea" rows="3"
            :value="(draft.adobeStock.keywords ?? []).join(', ')"
            placeholder="keyword1, keyword2, keyword3..."
            @input="updateAdobe('keywords', $event.target.value.split(',').map(k => k.trim()).filter(Boolean))" />
          <span class="single-form__hint">Comma-separated</span>
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Adobe Stock publish date</label>
          <div class="single-form__datetime">
            <input
              class="single-form__input single-form__input--date"
              type="date"
              :value="toDatePart(draft.adobeStock.publishDate)"
              @change="onAdobeDateChange($event.target.value)"
            />
            <select
              class="single-form__select single-form__select--time"
              :value="toTimePart(draft.adobeStock.publishDate)"
              :disabled="!draft.adobeStock.publishDate"
              @change="onAdobeTimeChange($event.target.value)"
            >
              <option v-if="!draft.adobeStock.publishDate" value="" disabled selected>— time —</option>
              <option v-for="s in TIME_SLOTS_30" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button v-if="draft.adobeStock.publishDate" class="single-form__clear-btn" type="button" title="Clear" @click="updateAdobe('publishDate', null)">×</button>
          </div>
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Status</label>
          <select class="single-form__select" :value="draft.adobeStock.status ?? 'draft'"
            @change="updateAdobe('status', $event.target.value)">
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="scheduled">Scheduled</option>
            <option value="submitted">Submitted</option>
            <option value="error">Error</option>
          </select>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  draft: Object,
  isPinterestComplete: Boolean,
  isAdobeStockComplete: Boolean,
  boards: { type: Array, default: () => [] },
})

const emit = defineEmits(['update'])

const activeTab = ref('pinterest')

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'adobe', label: 'Adobe Stock' },
]

function update(key, value) {
  emit('update', { ...props.draft, [key]: value })
}

function updatePinterest(key, value) {
  emit('update', { ...props.draft, pinterest: { ...props.draft.pinterest, [key]: value } })
}

function updateAdobe(key, value) {
  emit('update', { ...props.draft, adobeStock: { ...props.draft.adobeStock, [key]: value } })
}

const TIME_SLOTS_30 = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const hh = String(h).padStart(2, '0')
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { value: `${hh}:${m}`, label: `${h12}:${m} ${period}` }
})

const pad = n => String(n).padStart(2, '0')

function toDatePart(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  } catch { return '' }
}

function toTimePart(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return `${pad(d.getHours())}:${d.getMinutes() >= 30 ? '30' : '00'}`
  } catch { return '' }
}

function combineDatetime(datePart, timePart) {
  if (!datePart) return null
  try { return new Date(`${datePart}T${timePart || '00:00'}`).toISOString() } catch { return null }
}

function onPinDateChange(datePart) {
  if (!datePart) { updatePinterest('publishDate', null); return }
  updatePinterest('publishDate', combineDatetime(datePart, toTimePart(props.draft.pinterest.publishDate) || '12:00'))
}
function onPinTimeChange(timePart) {
  updatePinterest('publishDate', combineDatetime(toDatePart(props.draft.pinterest.publishDate), timePart))
}
function onAdobeDateChange(datePart) {
  if (!datePart) { updateAdobe('publishDate', null); return }
  updateAdobe('publishDate', combineDatetime(datePart, toTimePart(props.draft.adobeStock.publishDate) || '12:00'))
}
function onAdobeTimeChange(timePart) {
  updateAdobe('publishDate', combineDatetime(toDatePart(props.draft.adobeStock.publishDate), timePart))
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}
</script>

<style scoped lang="scss">
.single-form {
  &__tabs {
    display: flex;
    border-bottom: 2px solid #f3f4f6;
    margin-bottom: 16px;
    gap: 2px;
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    background: none;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color 0.15s, border-color 0.15s;

    &:hover { color: $color-primary; }

    &--active { color: $color-accent; border-bottom-color: $color-accent; }
  }

  &__tab-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;

    &--ok { background: #16a34a; }
    &--warn { background: #d97706; }
  }

  &__body { display: flex; flex-direction: column; gap: 14px; }

  &__field { display: flex; flex-direction: column; gap: 5px; }

  &__label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__char-count {
    font-size: 11px;
    font-weight: 400;
    color: #9ca3af;
    text-transform: none;
    letter-spacing: 0;

    &--over { color: #ef4444; }
  }

  &__input,
  &__select,
  &__textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    background: #fafafa;
    transition: border-color 0.15s, background 0.15s;
    box-sizing: border-box;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }

    &[readonly] { background: #f9fafb; color: #6b7280; cursor: default; }
  }

  &__input--mono { font-family: monospace; font-size: 11px; }

  &__textarea { resize: vertical; line-height: 1.5; }

  &__hint { font-size: 11px; color: #9ca3af; }

  &__datetime {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  &__input--date { flex: 1; min-width: 0; }

  &__select--time {
    width: 108px;
    flex-shrink: 0;
    padding: 8px 6px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    background: #fafafa;
    box-sizing: border-box;
    cursor: pointer;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }
    &:disabled { color: #9ca3af; cursor: default; background: #f9fafb; }
  }

  &__clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 36px;
    flex-shrink: 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    color: #6b7280;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s, border-color 0.15s, color 0.15s;

    &:hover { background: #fee2e2; border-color: #fecaca; color: #ef4444; }
  }

  &__colors { display: flex; flex-wrap: wrap; gap: 8px; }

  &__color {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    font-size: 12px;
  }

  &__swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  &__hex { font-family: monospace; color: #374151; }

  &__color-label { color: #6b7280; }
}
</style>
