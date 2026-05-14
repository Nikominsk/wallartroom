<template>
  <div class="gallery-toolbar">
    <div class="gallery-toolbar__row gallery-toolbar__row--main">
      <!-- Platform mode dropdown -->
      <div class="gallery-toolbar__mode">
        <select
          :value="mode"
          class="gallery-toolbar__select gallery-toolbar__select--mode"
          :class="{
            'gallery-toolbar__select--mode-pinterest': mode === 'pinterest',
            'gallery-toolbar__select--mode-adobe': mode === 'adobe',
          }"
          @change="emit('update:mode', $event.target.value)"
        >
          <option value="pinterest">Pinterest</option>
          <option value="adobe">Adobe Stock</option>
        </select>
      </div>

      <!-- Sort -->
      <select
        :value="sortField"
        class="gallery-toolbar__select"
        @change="emit('update:sort-field', $event.target.value)"
      >
        <option value="createdAt">Date created</option>
        <option value="updatedAt">Date updated</option>
        <option value="filename">Filename</option>
        <template v-if="mode === 'pinterest'">
          <option value="pinterestStatus">Pinterest status</option>
          <option value="pinterestPublishDate">Pinterest date</option>
        </template>
        <template v-else>
          <option value="adobeStockStatus">Adobe status</option>
          <option value="adobeStockPublishDate">Adobe date</option>
        </template>
      </select>

      <button class="gallery-toolbar__sort-btn" :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'" @click="emit('toggle-sort-dir')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path v-if="sortDirection === 'asc'" d="M2 10l4-7 4 7M4 7h4" />
          <path v-else d="M2 4l4 7 4-7M4 7h4" />
        </svg>
      </button>

      <!-- Filters toggle -->
      <button
        class="gallery-toolbar__btn"
        :class="{ 'gallery-toolbar__btn--active': showFilters }"
        @click="showFilters = !showFilters"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M2 4h12M4 8h8M6 12h4" />
        </svg>
        Filters
        <span v-if="hasFilters" class="gallery-toolbar__filter-badge" />
      </button>

      <!-- Upload (primary, always visible) -->
      <button class="gallery-toolbar__btn gallery-toolbar__btn--upload" @click="emit('upload')">
        <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 13v3a1 1 0 001 1h12a1 1 0 001-1v-3" />
          <path d="M10 3v10M6 7l4-4 4 4" />
        </svg>
        Upload
      </button>

      <!-- Export CSV (Pinterest only, prominent) -->
      <button v-if="mode === 'pinterest'" class="gallery-toolbar__btn gallery-toolbar__btn--accent" @click="emit('export-csv')">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M8 1v8M5 6l3 3 3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
        </svg>
        Export CSV
      </button>

      <!-- More dropdown: less-frequent actions live here -->
      <div ref="moreEl" class="gallery-toolbar__more">
        <button
          class="gallery-toolbar__btn gallery-toolbar__btn--icon"
          :class="{ 'gallery-toolbar__btn--active': moreOpen }"
          title="More actions"
          @click="moreOpen = !moreOpen"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.6" />
            <circle cx="8" cy="8" r="1.6" />
            <circle cx="13" cy="8" r="1.6" />
          </svg>
        </button>

        <div v-if="moreOpen" class="gallery-toolbar__menu">
          <button
            v-if="mode === 'pinterest'"
            class="gallery-toolbar__menu-item"
            @click="emit('time-manager'); moreOpen = false"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <rect x="2" y="3" width="16" height="15" rx="2" />
              <path d="M6 1v4M14 1v4M2 8h16" />
            </svg>
            Time Manager
          </button>
          <button
            v-if="mode === 'pinterest'"
            class="gallery-toolbar__menu-item"
            @click="emit('pinterest-schedule'); moreOpen = false"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
            Pinterest Scheduling
          </button>
          <NuxtLink
            v-if="mode === 'pinterest'"
            to="/metadata/csv-exports"
            class="gallery-toolbar__menu-item"
            @click="moreOpen = false"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z" />
              <path d="M8 4v4l3 2" />
            </svg>
            CSV Exports History
            <span v-if="unexportedHistoryCount > 0" class="gallery-toolbar__history-badge">{{ unexportedHistoryCount }}</span>
          </NuxtLink>
          <button
            v-if="invalidCount > 0"
            class="gallery-toolbar__menu-item gallery-toolbar__menu-item--warn"
            @click="emit('show-invalid'); moreOpen = false"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M10 1l9 17H1L10 1z" />
              <path d="M10 8v4M10 15h.01" />
            </svg>
            Show invalid ({{ invalidCount }})
          </button>
          <div v-if="!hasAnyMenuItem" class="gallery-toolbar__menu-empty">
            No additional actions.
          </div>
        </div>
      </div>
    </div>

    <div v-if="showFilters" class="gallery-toolbar__filters">
      <template v-if="mode === 'pinterest'">
        <div class="gallery-toolbar__filter-group">
          <label class="gallery-toolbar__filter-label">Pinterest metadata</label>
          <select
            :value="filters.pinterestComplete"
            class="gallery-toolbar__select gallery-toolbar__select--sm"
            @change="updateFilter('pinterestComplete', $event.target.value)"
          >
            <option value="">Any</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>

        <div class="gallery-toolbar__filter-group">
          <label class="gallery-toolbar__filter-label">Pinterest date</label>
          <select
            :value="filters.pinterestDate"
            class="gallery-toolbar__select gallery-toolbar__select--sm"
            @change="updateFilter('pinterestDate', $event.target.value)"
          >
            <option value="">Any</option>
            <option value="set">Date set</option>
            <option value="missing">Missing date</option>
          </select>
        </div>

        <div class="gallery-toolbar__filter-group">
          <label class="gallery-toolbar__filter-label">Pinterest export</label>
          <select
            :value="filters.pinterestExported"
            class="gallery-toolbar__select gallery-toolbar__select--sm"
            @change="updateFilter('pinterestExported', $event.target.value)"
          >
            <option value="">Any</option>
            <option value="exported">Exported</option>
            <option value="not-exported">Not exported</option>
          </select>
        </div>

        <div class="gallery-toolbar__filter-group">
          <label class="gallery-toolbar__filter-label">Pinterest published</label>
          <select
            :value="filters.pinterestPublished"
            class="gallery-toolbar__select gallery-toolbar__select--sm"
            @change="updateFilter('pinterestPublished', $event.target.value)"
          >
            <option value="">Any</option>
            <option value="published">Published</option>
            <option value="not-published">Not published</option>
          </select>
        </div>

        <div v-if="boards.length" class="gallery-toolbar__filter-group">
          <label class="gallery-toolbar__filter-label">Pinterest board</label>
          <select
            :value="filters.pinterestBoard"
            class="gallery-toolbar__select gallery-toolbar__select--sm"
            @change="updateFilter('pinterestBoard', $event.target.value)"
          >
            <option value="">Any</option>
            <option v-for="b in boards" :key="b.id" :value="b.name">{{ b.name }}</option>
          </select>
        </div>

        <div class="gallery-toolbar__filter-group gallery-toolbar__filter-group--daterange">
          <label class="gallery-toolbar__filter-label">Publish date range</label>
          <div class="gallery-toolbar__daterange">
            <input
              type="date"
              class="gallery-toolbar__date-input"
              :value="filters.pinterestDateFrom"
              title="From"
              @change="updateFilter('pinterestDateFrom', $event.target.value)"
            />
            <span class="gallery-toolbar__daterange-sep">–</span>
            <input
              type="date"
              class="gallery-toolbar__date-input"
              :value="filters.pinterestDateTo"
              title="To"
              @change="updateFilter('pinterestDateTo', $event.target.value)"
            />
          </div>
        </div>
      </template>

      <template v-else>
        <div class="gallery-toolbar__filter-group">
          <label class="gallery-toolbar__filter-label">Adobe metadata</label>
          <select
            :value="filters.adobeStockComplete"
            class="gallery-toolbar__select gallery-toolbar__select--sm"
            @change="updateFilter('adobeStockComplete', $event.target.value)"
          >
            <option value="">Any</option>
            <option value="complete">Complete</option>
            <option value="incomplete">Incomplete</option>
          </select>
        </div>

        <div class="gallery-toolbar__filter-group">
          <label class="gallery-toolbar__filter-label">Adobe date</label>
          <select
            :value="filters.adobeStockDate"
            class="gallery-toolbar__select gallery-toolbar__select--sm"
            @change="updateFilter('adobeStockDate', $event.target.value)"
          >
            <option value="">Any</option>
            <option value="set">Date set</option>
            <option value="missing">Missing date</option>
          </select>
        </div>
      </template>

      <div class="gallery-toolbar__filter-group gallery-toolbar__filter-group--check">
        <label class="gallery-toolbar__check-label">
          <input type="checkbox" :checked="filters.onlySelected" @change="updateFilter('onlySelected', $event.target.checked)" />
          Show selected only
        </label>
      </div>

      <button v-if="hasFilters" class="gallery-toolbar__reset" @click="emit('reset-filters')">
        Reset filters
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  filters: Object,
  sortField: String,
  sortDirection: String,
  hasFilters: Boolean,
  selectedCount: Number,
  boards: { type: Array, default: () => [] },
  invalidCount: { type: Number, default: 0 },
  unexportedHistoryCount: { type: Number, default: 0 },
  mode: { type: String, default: 'pinterest' },
})

const emit = defineEmits([
  'update:sort-field',
  'toggle-sort-dir',
  'update:filter',
  'reset-filters',
  'clear-selection',
  'time-manager',
  'pinterest-schedule',
  'export-csv',
  'show-invalid',
  'upload',
  'update:mode',
])

const showFilters = ref(false)
const moreOpen = ref(false)
const moreEl = ref(null)

const hasAnyMenuItem = computed(() =>
  props.mode === 'pinterest' || props.invalidCount > 0
)

function updateFilter(key, val) {
  emit('update:filter', key, val)
}

// Close the More menu when clicking anywhere outside it.
function handleDocMouseDown(e) {
  if (!moreOpen.value) return
  if (moreEl.value && !moreEl.value.contains(e.target)) moreOpen.value = false
}
onMounted(() => document.addEventListener('mousedown', handleDocMouseDown))
onUnmounted(() => document.removeEventListener('mousedown', handleDocMouseDown))
</script>

<style scoped lang="scss">
.gallery-toolbar {
  background: #fff;

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;

    &--main { flex-wrap: wrap; }
  }

  // ── Mode dropdown ─────────────────────────────────────────────────────────

  &__mode { flex-shrink: 0; }

  &__select {
    height: 32px;
    padding: 0 26px 0 10px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font: inherit;
    font-size: 12px;
    background: #f9fafb;
    color: $color-primary;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path fill='none' stroke='%236b7280' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M2 4l3 3 3-3'/></svg>");
    background-repeat: no-repeat;
    background-position: right 8px center;

    &:focus { outline: none; border-color: $color-accent; }

    &--sm { height: 28px; font-size: 11px; }

    &--mode {
      font-weight: 700;
      padding-left: 12px;
    }

    &--mode-pinterest {
      background-color: #fff0f1;
      border-color: #fecdd3;
      color: #be123c;
    }

    &--mode-adobe {
      background-color: #fff7ed;
      border-color: #fed7aa;
      color: #c2410c;
    }
  }

  // ── Buttons ──────────────────────────────────────────────────────────────

  &__sort-btn,
  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 32px;
    padding: 0 11px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #f9fafb;
    font: inherit;
    font-size: 12px;
    color: $color-primary;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: #f3f4f6; border-color: #d1d5db; }

    &--active { background: #fef3c7; border-color: #fbbf24; color: #92400e; }

    &--icon { padding: 0 8px; }

    &--accent {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
      font-weight: 600;

      &:hover { background: color-mix(in srgb, #{$color-accent} 94%, #000); border-color: color-mix(in srgb, #{$color-accent} 94%, #000); }
    }

    &--upload {
      background: #f0fdf4;
      border-color: #86efac;
      color: #15803d;
      font-weight: 600;

      svg { stroke: #16a34a; }
      &:hover { background: #dcfce7; border-color: #4ade80; }
    }
  }

  &__sort-btn { padding: 0 9px; }

  &__filter-badge {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: $color-accent;
  }

  // ── More dropdown ─────────────────────────────────────────────────────────

  &__more {
    position: relative;
    margin-left: auto;
  }

  &__menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 30;
    min-width: 220px;
    padding: 4px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: none;
    background: transparent;
    text-align: left;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    cursor: pointer;
    border-radius: 6px;
    text-decoration: none;

    svg { flex-shrink: 0; color: #6b7280; }

    &:hover { background: #f3f4f6; }

    &--warn {
      color: #92400e;

      svg { color: #d97706; }

      &:hover { background: #fffbeb; }
    }
  }

  &__menu-empty {
    padding: 12px 10px;
    font-size: 12px;
    color: #9ca3af;
    text-align: center;
  }

  &__history-badge {
    margin-left: auto;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #7c3aed;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    flex-shrink: 0;
  }

  // ── Filters expanded ─────────────────────────────────────────────────────

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-end;
    padding-top: 10px;
    margin-top: 10px;
    border-top: 1px solid #f3f4f6;
  }

  &__filter-group {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &--check { justify-content: flex-end; padding-bottom: 2px; }
  }

  &__filter-label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__check-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
  }

  &__reset {
    height: 28px;
    padding: 0 10px;
    border: none;
    background: none;
    font: inherit;
    font-size: 12px;
    color: #6b7280;
    cursor: pointer;
    align-self: flex-end;

    &:hover { color: $color-accent; }
  }

  &__daterange {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &__daterange-sep {
    font-size: 12px;
    color: #9ca3af;
    flex-shrink: 0;
  }

  &__date-input {
    height: 28px;
    padding: 0 6px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font: inherit;
    font-size: 11px;
    background: #f9fafb;
    color: $color-primary;
    cursor: pointer;
    width: 126px;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }
  }
}
</style>
