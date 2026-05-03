<template>
  <div class="gallery-toolbar">
    <div class="gallery-toolbar__row gallery-toolbar__row--main">
      <div class="gallery-toolbar__search">
        <svg class="gallery-toolbar__search-icon" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="9" r="6" />
          <path d="M15 15l3 3" stroke-linecap="round" />
        </svg>
        <input
          v-model="localSearch"
          type="text"
          placeholder="Search filename, title, keywords..."
          class="gallery-toolbar__input"
          @input="emit('update:search', localSearch)"
        />
        <button v-if="localSearch" class="gallery-toolbar__clear-btn" @click="localSearch = ''; emit('update:search', '')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 1l12 12M13 1L1 13" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="gallery-toolbar__controls">
        <select
          :value="sortField"
          class="gallery-toolbar__select"
          @change="emit('update:sort-field', $event.target.value)"
        >
          <option value="createdAt">Date created</option>
          <option value="updatedAt">Date updated</option>
          <option value="filename">Filename</option>
          <option value="pinterestStatus">Pinterest status</option>
          <option value="adobeStockStatus">Adobe status</option>
          <option value="pinterestPublishDate">Pinterest date</option>
          <option value="adobeStockPublishDate">Adobe date</option>
        </select>

        <button class="gallery-toolbar__sort-btn" :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'" @click="emit('toggle-sort-dir')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path v-if="sortDirection === 'asc'" d="M2 10l4-7 4 7M4 7h4" />
            <path v-else d="M2 4l4 7 4-7M4 7h4" />
          </svg>
        </button>

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

        <button class="gallery-toolbar__btn gallery-toolbar__btn--calendar" @click="emit('time-manager')">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <rect x="2" y="3" width="16" height="15" rx="2" />
            <path d="M6 1v4M14 1v4M2 8h16" />
          </svg>
          Time Manager
        </button>

        <button class="gallery-toolbar__btn gallery-toolbar__btn--pinterest" @click="emit('pinterest-schedule')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
          Pinterest Scheduling
        </button>

        <button class="gallery-toolbar__btn gallery-toolbar__btn--accent" @click="emit('export-csv')">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <path d="M8 1v8M5 6l3 3 3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" />
          </svg>
          Export CSV
        </button>

        <NuxtLink to="/metadata/csv-exports" class="gallery-toolbar__btn gallery-toolbar__btn--history">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z" />
            <path d="M8 4v4l3 2" />
          </svg>
          History
        </NuxtLink>
      </div>
    </div>

    <div v-if="showFilters" class="gallery-toolbar__filters">
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
})

const emit = defineEmits([
  'update:search',
  'update:sort-field',
  'toggle-sort-dir',
  'update:filter',
  'reset-filters',
  'clear-selection',
  'time-manager',
  'pinterest-schedule',
  'export-csv',
])

const showFilters = ref(false)
const localSearch = ref(props.filters.search)

function updateFilter(key, val) {
  emit('update:filter', key, val)
}
</script>

<style scoped lang="scss">
.gallery-toolbar {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: $radius-md;
  padding: 14px 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;

    &--main { flex-wrap: wrap; }
  }

  &__search {
    position: relative;
    flex: 1;
    min-width: 220px;
    display: flex;
    align-items: center;
  }

  &__search-icon {
    position: absolute;
    left: 10px;
    color: #9ca3af;
    pointer-events: none;
  }

  &__input {
    width: 100%;
    height: 36px;
    padding: 0 32px 0 34px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    background: #f9fafb;
    color: $color-primary;
    transition: border-color 0.15s, background 0.15s;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }
  }

  &__clear-btn {
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 0;

    &:hover { color: $color-primary; }
  }

  &__controls { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

  &__select {
    height: 36px;
    padding: 0 8px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    background: #f9fafb;
    color: $color-primary;
    cursor: pointer;

    &--sm { height: 32px; font-size: 12px; }
    &:focus { outline: none; border-color: $color-accent; }
  }

  &__sort-btn,
  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 36px;
    padding: 0 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: #f3f4f6; border-color: #d1d5db; }

    &--active { background: #fef3c7; border-color: #fbbf24; color: #92400e; }

    &--accent {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;

      &:hover { background: color-mix(in srgb, #{$color-accent} 94%, #000); border-color: color-mix(in srgb, #{$color-accent} 94%, #000); }
    }

    &--calendar {
      background: #f0f4ff;
      border-color: #c7d7fd;
      color: #3730a3;

      svg { stroke: #4f46e5; }
      &:hover { background: #e0e7ff; border-color: #a5b4fc; }
    }

    &--history {
      text-decoration: none;
      background: #f9fafb;
      border-color: #e5e7eb;
      color: #6b7280;

      &:hover { background: #f3f4f6; border-color: #d1d5db; color: $color-primary; }
    }

    &--pinterest {
      background: #fff0f1;
      border-color: #fecdd3;
      color: #be123c;

      svg { fill: #e60023; }
      &:hover { background: #ffe4e6; border-color: #fda4af; }
    }
  }

  &__sort-btn { padding: 0 10px; }

  &__filter-badge {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: $color-accent;
    margin-left: 1px;
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-end;
    padding-top: 12px;
    margin-top: 12px;
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
    height: 32px;
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

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 12px;
    margin-top: 12px;
    border-top: 1px solid #f3f4f6;
  }

  &__selected-label { font-size: 12px; font-weight: 600; color: $color-accent; }

  &__action-btn {
    height: 28px;
    padding: 0 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    font: inherit;
    font-size: 12px;
    color: $color-primary;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #f9fafb; }

    &--danger {
      color: #ef4444;
      border-color: #fecaca;

      &:hover { background: #fef2f2; border-color: #ef4444; }
    }
  }
}
</style>
