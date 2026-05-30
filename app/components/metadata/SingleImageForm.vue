<template>
  <div class="single-form">
    <div class="single-form__tabs">
      <button
        v-for="tab in visibleTabs"
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

      <div class="single-form__tab-actions">
        <button
          class="single-form__action-btn single-form__action-btn--save"
          :class="{ 'single-form__action-btn--active': isDirty && !saving }"
          :disabled="!isDirty || saving"
          title="Save changes"
          @click="emit('save')"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 1h8l3 3v9H1V1h1z" />
            <path d="M4 1v4h5V1" />
            <rect x="3" y="8" width="8" height="5" rx="0.5" />
          </svg>
        </button>
        <button
          class="single-form__action-btn single-form__action-btn--discard"
          :disabled="!isDirty || saving"
          title="Discard changes"
          @click="emit('discard')"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11.5 3A6 6 0 1 0 13 7" />
            <path d="M10 1l1.5 2-2 1.5" />
          </svg>
        </button>
        <button
          class="single-form__action-btn single-form__action-btn--delete"
          :disabled="saving"
          title="Delete image"
          @click="emit('delete')"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3.5h10M5.5 3.5v-1a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4.5 3.5l.75 8h4.5l.75-8" />
          </svg>
        </button>
      </div>
    </div>

    <div class="single-form__body">
      <button
        v-if="mode === 'pinterest'"
        class="single-form__ai-cta"
        type="button"
        title="Open the AI generator for this image"
        @click="emit('open-ai')"
      >
        <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
        </svg>
        Generate with AI
      </button>

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
          <div class="single-form__board-head">
            <label class="single-form__label single-form__label--req">Pinterest boards</label>
            <div class="single-form__board-actions">
              <button
                v-if="boards.length"
                class="single-form__suggest-btn"
                type="button"
                title="AI Board Suggestion"
                @click="emit('suggest-board')"
              >
                <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
                </svg>
              </button>
              <button
                class="single-form__manage-btn"
                type="button"
                title="Manage boards"
                @click="emit('manage-boards')"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="10" cy="10" r="2.5"/>
                  <path d="M16.5 10a6.5 6.5 0 0 0-.1-1.1l1.5-1.2-1.5-2.6-1.8.6a6.5 6.5 0 0 0-1.9-1.1L12.4 2.8h-3l-.3 1.8a6.5 6.5 0 0 0-1.9 1.1l-1.8-.6L3.9 7.7l1.5 1.2A6.5 6.5 0 0 0 5.4 10c0 .4 0 .8.1 1.1L4 12.3l1.5 2.6 1.8-.6c.6.5 1.2.9 1.9 1.1l.3 1.8h3l.3-1.8c.7-.2 1.3-.6 1.9-1.1l1.8.6 1.5-2.6-1.5-1.2c.1-.3.1-.7.1-1.1Z"/>
                </svg>
              </button>
            </div>
          </div>

          <div v-if="boards.length" ref="boardDropEl" class="single-form__board-drop">
            <button
              type="button"
              class="single-form__board-trigger"
              :class="{ 'single-form__board-trigger--open': boardDropOpen }"
              @click="boardDropOpen = !boardDropOpen"
            >
              <span class="single-form__board-trigger-text">
                <template v-if="selectedBoardIds.length === 0">Select boards</template>
                <template v-else>{{ selectedBoardNames }}</template>
              </span>
              <svg class="single-form__board-trigger-chev" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 5l4 4 4-4"/>
              </svg>
            </button>

            <div v-if="boardDropOpen" class="single-form__board-menu">
              <label
                v-for="b in boards"
                :key="b.id"
                class="single-form__board-option"
                :class="{ 'single-form__board-option--on': selectedBoardIds.includes(b.id) }"
              >
                <input
                  type="checkbox"
                  class="single-form__board-cb"
                  :checked="selectedBoardIds.includes(b.id)"
                  @change="toggleBoard(b.id)"
                />
                <span class="single-form__board-cb-box" aria-hidden="true">
                  <svg v-if="selectedBoardIds.includes(b.id)" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5l3.5 3.5L12 4"/></svg>
                </span>
                {{ b.name }}
              </label>
            </div>
          </div>
          <p v-else class="single-form__board-empty">
            No boards yet — use "Manage boards" to add some.
          </p>
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
            <option value="exported">Exported</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div v-if="draft.pinterest.exportedAt" class="single-form__field">
          <label class="single-form__label">Exported at</label>
          <input class="single-form__input" :value="fmtDate(draft.pinterest.exportedAt)" readonly />
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
  mode: { type: String, default: 'pinterest' },
  isDirty: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update', 'save', 'discard', 'delete', 'open-ai', 'manage-boards', 'suggest-board'])

const activeTab = ref(props.mode === 'adobe' ? 'adobe' : 'pinterest')

const tabs = [
  { id: 'general',   label: 'General' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'adobe',     label: 'Adobe Stock' },
]

// Hide the tab that belongs to the other platform so the user only sees their
// current mode's fields. Switching mode while the panel is open auto-swaps the
// active tab to the one that matches.
const visibleTabs = computed(() => {
  if (props.mode === 'adobe') return tabs.filter(t => t.id !== 'pinterest')
  return tabs.filter(t => t.id !== 'adobe')
})

watch(() => props.mode, (newMode) => {
  if (newMode === 'pinterest' && activeTab.value === 'adobe') activeTab.value = 'pinterest'
  if (newMode === 'adobe' && activeTab.value === 'pinterest') activeTab.value = 'adobe'
})

function update(key, value) {
  emit('update', { ...props.draft, [key]: value })
}

function updatePinterest(key, value) {
  emit('update', { ...props.draft, pinterest: { ...props.draft.pinterest, [key]: value } })
}

const boardDropEl   = ref(null)
const boardDropOpen = ref(false)

onMounted(() => document.addEventListener('click', onDocClickBoard))
onBeforeUnmount(() => document.removeEventListener('click', onDocClickBoard))
function onDocClickBoard(e) {
  if (boardDropOpen.value && boardDropEl.value && !boardDropEl.value.contains(e.target)) {
    boardDropOpen.value = false
  }
}

const selectedBoardIds = computed(() => {
  const ids = props.draft?.pinterest?.boardIds
  if (Array.isArray(ids)) return ids
  return props.draft?.pinterest?.boardId ? [props.draft.pinterest.boardId] : []
})

const selectedBoardNames = computed(() => {
  if (!selectedBoardIds.value.length) return ''
  return selectedBoardIds.value
    .map(id => props.boards.find(b => b.id === id)?.name)
    .filter(Boolean)
    .join(', ')
})

function toggleBoard(boardId) {
  const current = [...selectedBoardIds.value]
  const idx = current.indexOf(boardId)
  if (idx === -1) current.push(boardId)
  else current.splice(idx, 1)

  // Keep primary boardId/board (first) in sync for single-board displays.
  const primary = current[0] ?? null
  const primaryBoard = props.boards.find(b => b.id === primary)
  const boardObjs = current
    .map(id => props.boards.find(b => b.id === id))
    .filter(Boolean)
    .map(b => ({ id: b.id, name: b.name, color: b.color ?? null }))

  emit('update', {
    ...props.draft,
    pinterest: {
      ...props.draft.pinterest,
      boardIds: current,
      boards: boardObjs,
      boardId: primary,
      board: primaryBoard?.name ?? '',
    },
  })
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
    align-items: center;
    border-bottom: 2px solid #f3f4f6;
    margin-bottom: 16px;
    gap: 2px;
  }

  &__tab-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 3px;
    padding-right: 2px;
    flex-shrink: 0;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 0;
    transition: background 0.12s, color 0.12s, border-color 0.12s;

    &:disabled { opacity: 0.3; cursor: not-allowed; }

    &--save {
      color: #f97316;
      &:not(:disabled):hover { background: #fff7ed; border-color: #fdba74; color: #ea580c; }
      &--active { color: #f97316; }
    }

    &--discard {
      &:not(:disabled):hover { background: #fefce8; border-color: #fde047; color: #92400e; }
    }

    &--delete {
      &:not(:disabled):hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
    }
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

  &__board-row {
    display: flex;
    gap: 6px;
    align-items: center;

    .single-form__select,
    .single-form__input { flex: 1; min-width: 0; }
  }

  &__board-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__board-actions {
    display: flex;
    gap: 6px;
  }

  &__board-drop {
    position: relative;
  }

  &__board-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 32px;
    padding: 0 10px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #fafafa;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s;

    &:hover { border-color: #d1d5db; background: #f3f4f6; }
    &--open { border-color: $color-accent; background: #fff; }
  }

  &__board-trigger-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: inherit;

    &:empty, &:first-child:last-child { color: #9ca3af; }
  }

  &__board-trigger-chev {
    flex-shrink: 0;
    color: #9ca3af;
    transition: transform 0.15s;

    .single-form__board-trigger--open & { transform: rotate(180deg); }
  }

  &__board-menu {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    z-index: 200;
    max-height: 220px;
    overflow-y: auto;
    padding: 4px;
  }

  &__board-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 6px;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
    user-select: none;
    transition: background 0.1s;

    &:hover { background: #f3f4f6; }

    &--on { color: $color-primary; font-weight: 500; }
  }

  &__board-cb {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  &__board-cb-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border-radius: 4px;
    border: 1.5px solid #d1d5db;
    flex-shrink: 0;
    color: #fff;
    transition: background 0.12s, border-color 0.12s;

    .single-form__board-option--on & {
      background: $color-accent;
      border-color: $color-accent;
    }
  }

  &__board-empty {
    margin: 0;
    font-size: 12.5px;
    color: #9ca3af;
  }

  &__suggest-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: #fffbeb;
    color: #f59e0b;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s, border-color 0.12s;

    &:hover { background: #fef3c7; border-color: #fbbf24; }
  }

  &__manage-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #6b7280;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.12s, border-color 0.12s, color 0.12s;

    &:hover { background: #f3f4f6; border-color: #d1d5db; color: $color-primary; }
  }


  &__label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 600;
    color: #1f2937;
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
    border: 1px solid #374151;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    background: #fff;
    transition: border-color 0.15s;
    box-sizing: border-box;

    &:focus { outline: none; border-color: $color-accent; }

    &[readonly] { background: #f5f5f5; color: #6b7280; cursor: default; border-color: #d1d5db; }
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
    border: 1px solid #374151;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    background: #fff;
    box-sizing: border-box;
    cursor: pointer;

    &:focus { outline: none; border-color: $color-accent; }
    &:disabled { color: #9ca3af; cursor: default; background: #f5f5f5; border-color: #d1d5db; }
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

  // ── AI CTA (opens the shared AI modal) ───────────────────────────────────────

  &__ai-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    height: 36px;
    border: 1px solid color-mix(in srgb, #{$color-accent} 35%, #fff);
    border-radius: 9px;
    background: color-mix(in srgb, #{$color-accent} 9%, #fff);
    color: $color-accent;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    svg { flex-shrink: 0; }

    &:hover {
      background: color-mix(in srgb, #{$color-accent} 16%, #fff);
      border-color: $color-accent;
    }

    &:focus-visible { outline: 2px solid $color-accent; outline-offset: 2px; }
  }
}
</style>
