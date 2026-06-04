<template>
  <div class="gallery-toolbar">
    <div class="gallery-toolbar__row gallery-toolbar__row--main">
      <!-- Sort group: direction toggle + category select fused as one control -->
      <div class="gallery-toolbar__sort-group">
        <button class="gallery-toolbar__sort-btn" :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'" @click="emit('toggle-sort-dir')">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <template v-if="sortDirection === 'asc'">
              <text x="1" y="7" font-size="5.5" font-family="sans-serif" font-weight="700" fill="currentColor" stroke="none">A</text>
              <text x="1" y="14" font-size="5.5" font-family="sans-serif" font-weight="700" fill="currentColor" stroke="none">Z</text>
              <path d="M11 2v11M8.5 10.5l2.5 2.5 2.5-2.5" />
            </template>
            <template v-else>
              <text x="1" y="7" font-size="5.5" font-family="sans-serif" font-weight="700" fill="currentColor" stroke="none">Z</text>
              <text x="1" y="14" font-size="5.5" font-family="sans-serif" font-weight="700" fill="currentColor" stroke="none">A</text>
              <path d="M11 13V2M8.5 5.5L11 3l2.5 2.5" />
            </template>
          </svg>
        </button>
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
            <option value="pinterestPublishDate">Scheduled date</option>
          </template>
          <template v-else>
            <option value="adobeStockStatus">Adobe status</option>
            <option value="adobeStockPublishDate">Adobe date</option>
          </template>
        </select>
      </div>

      <!-- Filters toggle + reset -->
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
      <button v-if="hasFilters" class="gallery-toolbar__reset" @click="emit('reset-filters')">
        Reset
      </button>

      <!-- Export CSV + Scheduling + More dropdown pushed to the far right -->
      <div class="gallery-toolbar__right">
        <button v-if="mode === 'pinterest' && caps.scheduling !== false" class="gallery-toolbar__btn" :disabled="selectedCount === 0" :title="selectedCount === 0 ? 'Select images to schedule' : ''" @click="emit('pinterest-schedule')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
          Scheduling
        </button>
        <button v-if="mode === 'pinterest' && caps.exportCsv !== false" class="gallery-toolbar__btn gallery-toolbar__btn--accent" :disabled="selectedCount === 0" :title="selectedCount === 0 ? 'Select images to export' : ''" @click="emit('export-csv')">
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
            v-if="mode === 'pinterest' && caps.checkLinks !== false"
            class="gallery-toolbar__menu-item"
            @click="emit('check-links'); moreOpen = false"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M8 11a4 4 0 006 0l3-3a4 4 0 00-6-6l-1 1" />
              <path d="M12 9a4 4 0 00-6 0l-3 3a4 4 0 006 6l1-1" />
            </svg>
            Check Links
          </button>
          <button
            v-if="mode === 'pinterest' && caps.scanDuplicates !== false"
            class="gallery-toolbar__menu-item"
            @click="emit('scan-duplicates'); moreOpen = false"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="8" height="8" rx="1" />
              <rect x="9" y="9" width="8" height="8" rx="1" />
            </svg>
            Scan Duplicates
          </button>
          <button
            v-if="selectedCount > 0"
            class="gallery-toolbar__menu-item"
            @click="emit('download-selected'); moreOpen = false"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 2v10M6 8l4 4 4-4" />
              <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" />
            </svg>
            Download {{ selectedCount }} selected as ZIP
          </button>
          <button
            v-if="selectedCount > 0"
            class="gallery-toolbar__menu-item"
            @click="emit('transfer'); moreOpen = false"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6Z" />
              <path d="M9 11h6M12 8l3 3-3 3" />
            </svg>
            Move / Copy {{ selectedCount }} to project…
          </button>
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
      </div><!-- /.gallery-toolbar__right -->
    </div>

    <div v-if="showFilters" class="gallery-toolbar__filters">
      <template v-if="mode === 'pinterest'">

        <!-- Title -->
        <div v-if="caps.showTitleFilter !== false" class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 2.5h9M6 2.5v7"/></svg>
            <span class="gallery-toolbar__filter-label">Title</span>
          </div>
          <div class="gallery-toolbar__pills">
            <button :class="['gallery-toolbar__pill', !filters.pinterestTitle && 'gallery-toolbar__pill--active']" title="Any" @click="updateFilter('pinterestTitle', '')">All</button>
            <button :class="['gallery-toolbar__pill', filters.pinterestTitle === 'set' && 'gallery-toolbar__pill--active']" title="Has title" @click="updateFilter('pinterestTitle', 'set')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5l2.5 2.5 5.5-5.5"/></svg>
            </button>
            <button :class="['gallery-toolbar__pill', filters.pinterestTitle === 'missing' && 'gallery-toolbar__pill--active']" title="Missing title" @click="updateFilter('pinterestTitle', 'missing')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
            </button>
          </div>
        </div>

        <!-- Description -->
        <div class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M1.5 3h9M1.5 6h9M1.5 9h6"/></svg>
            <span class="gallery-toolbar__filter-label">Description</span>
          </div>
          <div class="gallery-toolbar__pills">
            <button :class="['gallery-toolbar__pill', !filters.pinterestDescription && 'gallery-toolbar__pill--active']" title="Any" @click="updateFilter('pinterestDescription', '')">All</button>
            <button :class="['gallery-toolbar__pill', filters.pinterestDescription === 'set' && 'gallery-toolbar__pill--active']" title="Has description" @click="updateFilter('pinterestDescription', 'set')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5l2.5 2.5 5.5-5.5"/></svg>
            </button>
            <button :class="['gallery-toolbar__pill', filters.pinterestDescription === 'missing' && 'gallery-toolbar__pill--active']" title="Missing description" @click="updateFilter('pinterestDescription', 'missing')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
            </button>
          </div>
        </div>

        <!-- Board -->
        <div v-if="boards.length" class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 1a2.5 2.5 0 012.5 2.5C8.5 5.5 6 10 6 10S3.5 5.5 3.5 3.5A2.5 2.5 0 016 1z"/><circle cx="6" cy="3.5" r="1" fill="currentColor" stroke="none"/></svg>
            <span class="gallery-toolbar__filter-label">Board</span>
          </div>
          <div class="gallery-toolbar__pills">
            <button :class="['gallery-toolbar__pill', !filters.pinterestBoard && 'gallery-toolbar__pill--active']" title="Any" @click="updateFilter('pinterestBoard', '')">All</button>
            <button :class="['gallery-toolbar__pill', filters.pinterestBoard === '__has__' && 'gallery-toolbar__pill--active']" title="Has board" @click="updateFilter('pinterestBoard', '__has__')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5l2.5 2.5 5.5-5.5"/></svg>
            </button>
            <button :class="['gallery-toolbar__pill', filters.pinterestBoard === '__no__' && 'gallery-toolbar__pill--active']" title="No board" @click="updateFilter('pinterestBoard', '__no__')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
            </button>
            <select
              :value="filters.pinterestBoard !== '__has__' && filters.pinterestBoard !== '__no__' ? filters.pinterestBoard : ''"
              class="gallery-toolbar__select gallery-toolbar__select--sm gallery-toolbar__select--narrow"
              style="margin-left:6px"
              @change="updateFilter('pinterestBoard', $event.target.value)"
            >
              <option value="">— board —</option>
              <option v-for="b in boards" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
        </div>

        <!-- Redirect URL -->
        <div class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 2H2.5A1 1 0 001.5 3v6.5A1 1 0 002.5 10.5H9A1 1 0 0010 9.5V7.5"/><path d="M7 1.5h3.5V5M10.5 1.5L6 6"/></svg>
            <span class="gallery-toolbar__filter-label">URL</span>
          </div>
          <div class="gallery-toolbar__pills">
            <button :class="['gallery-toolbar__pill', !filters.pinterestLink && 'gallery-toolbar__pill--active']" title="Any" @click="updateFilter('pinterestLink', '')">All</button>
            <button :class="['gallery-toolbar__pill', filters.pinterestLink === 'set' && 'gallery-toolbar__pill--active']" title="Has redirect URL" @click="updateFilter('pinterestLink', 'set')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5l2.5 2.5 5.5-5.5"/></svg>
            </button>
            <button :class="['gallery-toolbar__pill', filters.pinterestLink === 'missing' && 'gallery-toolbar__pill--active']" title="Missing redirect URL" @click="updateFilter('pinterestLink', 'missing')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
            </button>
          </div>
        </div>

        <!-- Scheduled date + date range (grouped, no second label) -->
        <div class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2" width="10" height="9" rx="1.5"/><path d="M1 5h10M4 1v2M8 1v2"/></svg>
            <span class="gallery-toolbar__filter-label">Scheduled</span>
          </div>
          <div class="gallery-toolbar__pills">
            <button :class="['gallery-toolbar__pill', !filters.pinterestDate && !filters.pinterestDateFrom && !filters.pinterestDateTo && 'gallery-toolbar__pill--active']" title="Any" @click="updateScheduledPill('')">All</button>
            <button :class="['gallery-toolbar__pill', filters.pinterestDate === 'set' && 'gallery-toolbar__pill--active']" title="Date set" @click="updateScheduledPill('set')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5l2.5 2.5 5.5-5.5"/></svg>
            </button>
            <button :class="['gallery-toolbar__pill', filters.pinterestDate === 'missing' && 'gallery-toolbar__pill--active']" title="Missing date" @click="updateScheduledPill('missing')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
            </button>
            <span class="gallery-toolbar__daterange gallery-toolbar__daterange--inline">
              <input type="date" class="gallery-toolbar__date-input" :value="filters.pinterestDateFrom" title="From" @change="updateFilter('pinterestDateFrom', $event.target.value)" />
              <span class="gallery-toolbar__daterange-sep">–</span>
              <input type="date" class="gallery-toolbar__date-input" :value="filters.pinterestDateTo" title="To" @change="updateFilter('pinterestDateTo', $event.target.value)" />
            </span>
          </div>
        </div>

        <!-- Status -->
        <div class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="4.5"/><path d="M6 4v2.5L7.5 8"/></svg>
            <span class="gallery-toolbar__filter-label">Status</span>
          </div>
          <div class="gallery-toolbar__pills">
            <button :class="['gallery-toolbar__pill', !filters.pinterestStatusError && 'gallery-toolbar__pill--active']" title="Any" @click="updateFilter('pinterestStatusError', '')">All</button>
            <button :class="['gallery-toolbar__pill', filters.pinterestStatusError === 'error' && 'gallery-toolbar__pill--active']" title="AI generation failed" @click="updateFilter('pinterestStatusError', filters.pinterestStatusError === 'error' ? '' : 'error')">Error</button>
          </div>
        </div>

        <!-- Unsaved -->
        <div v-if="caps.showUnsavedFilter !== false" class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10V4l4-3 4 3v6"/><path d="M5 10V7h2v3"/></svg>
            <span class="gallery-toolbar__filter-label">Unsaved</span>
          </div>
          <div class="gallery-toolbar__pills">
            <button :class="['gallery-toolbar__pill', !filters.unsaved && 'gallery-toolbar__pill--active']" title="Any" @click="updateFilter('unsaved', '')">All</button>
            <button :class="['gallery-toolbar__pill', filters.unsaved === 'set' && 'gallery-toolbar__pill--active']" title="Has unsaved changes" @click="updateFilter('unsaved', 'set')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5l2.5 2.5 5.5-5.5"/></svg>
            </button>
            <button :class="['gallery-toolbar__pill', filters.unsaved === 'missing' && 'gallery-toolbar__pill--active']" title="No unsaved changes" @click="updateFilter('unsaved', 'missing')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
            </button>
          </div>
        </div>

        <!-- Exported date range (Exported view only) -->
        <div v-if="caps.showExportedDateFilter" class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="2" width="10" height="9" rx="1.5"/><path d="M1 5h10M4 1v2M8 1v2"/></svg>
            <span class="gallery-toolbar__filter-label">Exported date</span>
          </div>
          <div class="gallery-toolbar__pills" style="gap:0">
            <span class="gallery-toolbar__daterange gallery-toolbar__daterange--inline" style="margin-left:0">
              <input
                type="date"
                class="gallery-toolbar__date-input"
                :value="filters.exportedDateFrom"
                title="From"
                @change="updateFilter('exportedDateFrom', $event.target.value)"
              />
              <span class="gallery-toolbar__daterange-sep">–</span>
              <input
                type="date"
                class="gallery-toolbar__date-input"
                :value="filters.exportedDateTo"
                title="To"
                @change="updateFilter('exportedDateTo', $event.target.value)"
              />
            </span>
          </div>
        </div>

        <!-- Export -->
        <div v-if="caps.exportStatus !== false" class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 8.5l3 3 6-6"/></svg>
            <span class="gallery-toolbar__filter-label">Export</span>
          </div>
          <div class="gallery-toolbar__pills">
            <button :class="['gallery-toolbar__pill', !filters.pinterestExported && 'gallery-toolbar__pill--active']" title="Any" @click="updateFilter('pinterestExported', '')">All</button>
            <button :class="['gallery-toolbar__pill', filters.pinterestExported === 'exported' && 'gallery-toolbar__pill--active']" title="Exported" @click="updateFilter('pinterestExported', 'exported')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.5l2.5 2.5 5.5-5.5"/></svg>
            </button>
            <button :class="['gallery-toolbar__pill', filters.pinterestExported === 'not-exported' && 'gallery-toolbar__pill--active']" title="Not exported" @click="updateFilter('pinterestExported', 'not-exported')">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
            </button>
          </div>
        </div>

      </template>

      <template v-else>
        <div class="gallery-toolbar__filter-group">
          <div class="gallery-toolbar__filter-head">
            <span class="gallery-toolbar__filter-label">Adobe metadata</span>
          </div>
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
          <div class="gallery-toolbar__filter-head">
            <span class="gallery-toolbar__filter-label">Adobe date</span>
          </div>
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
  mode: { type: String, default: 'pinterest' },
  // Per-view action capabilities (see viewCaps in MetadataWorkspace).
  caps: {
    type: Object,
    default: () => ({ exportCsv: true, scheduling: true, exportStatus: true, checkLinks: true, scanDuplicates: true }),
  },
})

const emit = defineEmits([
  'update:sort-field',
  'toggle-sort-dir',
  'update:filter',
  'reset-filters',
  'clear-selection',
  'pinterest-schedule',
  'export-csv',
  'show-invalid',
  'update:mode',
  'check-links',
  'scan-duplicates',
  'transfer',
  'download-selected',
])

const showFilters = ref(false)
const moreOpen = ref(false)
const moreEl = ref(null)

const hasAnyMenuItem = computed(() =>
  (props.mode === 'pinterest' && (props.caps.checkLinks !== false || props.caps.scanDuplicates !== false)) ||
  props.invalidCount > 0 ||
  props.selectedCount > 0
)

function updateFilter(key, val) {
  emit('update:filter', key, val)
}

function updateScheduledPill(pinterestDate) {
  emit('update:filter', 'pinterestDate', pinterestDate)
  emit('update:filter', 'pinterestDateFrom', '')
  emit('update:filter', 'pinterestDateTo', '')
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

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
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

    &:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: auto;
    }

    &--active {
      background: #7c2d12; border-color: #7c2d12; color: #fff;
      &:hover:not(:disabled) { background: #6b2410; border-color: #6b2410; }
    }

    &--icon { padding: 0 8px; }

    &--accent {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
      font-weight: 600;

      &:hover:not(:disabled) { background: color-mix(in srgb, #{$color-accent} 94%, #000); border-color: color-mix(in srgb, #{$color-accent} 94%, #000); }

      &:disabled {
        background: #e5e7eb;
        border-color: #e5e7eb;
        color: #9ca3af;
        opacity: 1;
      }
    }

  }

  &__sort-group {
    display: inline-flex;
    align-items: center;

    .gallery-toolbar__sort-btn {
      border-right: none;
      border-radius: 7px 0 0 7px;
      padding: 0 9px;
    }

    .gallery-toolbar__select {
      border-radius: 0 7px 7px 0;
    }
  }

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

  // ── Filters expanded ─────────────────────────────────────────────────────

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: flex-start;
    padding-top: 10px;
    margin-top: 10px;
    border-top: 1px solid #f3f4f6;
  }

  &__filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  &__filter-head {
    display: flex;
    align-items: center;
    gap: 5px;
    color: #6b7280;
  }

  &__filter-label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__pills {
    display: inline-flex;
    align-items: center;

    .gallery-toolbar__pill {
      border-radius: 0;
      border-right: none;

      &:first-child { border-radius: 6px 0 0 6px; }
      // last-of-type targets the last button even when a span (daterange) follows it
      &:last-of-type { border-radius: 0 6px 6px 0; border-right: 1px solid #e5e7eb; }
    }
  }

  &__pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    width: 28px;
    padding: 0;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    font: inherit;
    font-size: 11.5px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s, border-color 0.12s, color 0.12s;

    &:hover:not(&--active) { background: #f3f4f6; border-color: #d1d5db; color: $color-primary; }

    &--active {
      background: #7c2d12;
      border-color: #7c2d12;
      color: #fff;
    }
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

    &--inline {
      margin-left: 6px;
    }
  }

  &__daterange-sep {
    font-size: 12px;
    color: #9ca3af;
    flex-shrink: 0;
  }

  &__date-input {
    height: 28px;
    padding: 0 4px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font: inherit;
    font-size: 11px;
    background: #f9fafb;
    color: $color-primary;
    cursor: pointer;
    width: 94px;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }
  }

  &__select--narrow {
    max-width: 130px;
  }
}
</style>
