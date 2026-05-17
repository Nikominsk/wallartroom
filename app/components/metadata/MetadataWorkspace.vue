<template>
  <div class="meta-page">

    <!-- ── Workspace header: view title + search + refresh ─────────────────── -->
    <header class="meta-page__top-bar">
      <div class="meta-page__heading">
        <h1 class="meta-page__heading-title">{{ viewLabel }}</h1>
        <span class="meta-page__heading-count">{{ filteredImages.length }}</span>
      </div>

      <div class="meta-page__search">
        <svg class="meta-page__search-icon" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="9" r="6" />
          <path d="M15 15l3 3" stroke-linecap="round" />
        </svg>
        <input
          v-model="filters.search"
          type="text"
          placeholder="Search filename, title, keywords..."
          class="meta-page__search-input"
        />
        <button
          v-if="filters.search"
          class="meta-page__search-clear"
          title="Clear search"
          @click="filters.search = ''"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>

      <button
        class="meta-page__icon-btn meta-page__icon-btn--toolbar"
        :disabled="pending"
        title="Refresh"
        @click="handleRefresh"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4a8 8 0 0 1 12 0M4 16a8 8 0 0 0 12 0" />
          <polyline points="1 4 4 4 4 7" />
          <polyline points="19 16 16 16 16 13" />
        </svg>
      </button>
    </header>

    <!-- ── Tool bar: mode + sort + filters + upload + export + more ───────── -->
    <header class="meta-page__toolbar">
      <MetadataImageGalleryToolbar
        :filters="filters"
        :sort-field="sortField"
        :sort-direction="sortDirection"
        :has-filters="hasFilters"
        :selected-count="selectedCount"
        :boards="boards"
        :invalid-count="invalidImages.length"
        :mode="mode"
        :caps="viewCaps"
        @update:sort-field="setSort"
        @toggle-sort-dir="setSort(sortField)"
        @update:filter="onUpdateFilter"
        @reset-filters="resetFilters"
        @clear-selection="clearSelection"
        @time-manager="showTimeManager = true"
        @pinterest-schedule="openPinterestScheduler"
        @export-csv="openExport"
        @show-invalid="showInvalidImages = true"
        @update:mode="setMode"
        @check-links="handleCheckLinks"
        @scan-duplicates="handleScanDuplicates"
      />
    </header>

    <!-- ── Actions bar ───────────────────────────────────────────────────── -->
    <div class="meta-page__actions-bar">
      <div class="meta-page__actions-left">
        <label class="meta-page__select-all" title="Select / deselect all visible">
          <input
            ref="selectAllCheckbox"
            type="checkbox"
            class="meta-page__select-all-input"
            :checked="allVisibleSelected"
            @change="toggleSelectAll"
          />
        </label>
        <div class="meta-page__mode-switch">
          <button
            class="meta-page__mode-btn"
            :class="{ 'meta-page__mode-btn--active': selectionMode === 'single' }"
            @click="selectionMode = 'single'"
          >Single</button>
          <button
            class="meta-page__mode-btn"
            :class="{ 'meta-page__mode-btn--active': selectionMode === 'multi' }"
            @click="selectionMode = 'multi'"
          >Multi</button>
        </div>

        <button
          v-if="viewCaps.ai"
          class="meta-page__btn meta-page__btn--ai"
          :disabled="aiTargetImages.length === 0 || saving"
          :title="aiCtaTitle"
          @click="openAiModal"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
          </svg>
          AI generate
          <span class="meta-page__ai-count">{{ aiTargetImages.length }}</span>
        </button>

        <span v-if="totalUnsavedCount > 0" class="meta-page__unsaved-pill">
          {{ totalUnsavedCount }} unsaved
        </span>
      </div>

      <div class="meta-page__actions-right">
        <button
          v-if="selectedCount > 0"
          class="meta-page__btn meta-page__btn--danger"
          :disabled="saving"
          @click="handleDeleteSelected"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l1 9a1 1 0 001 1h2a1 1 0 001-1l1-9" />
          </svg>
          Delete {{ selectedCount }}
        </button>
        <button
          class="meta-page__btn meta-page__btn--primary"
          :disabled="selectedCount === 0 || saving"
          @click="handleSaveAllSelected"
        >Save {{ selectedCount > 0 ? selectedCount : '' }} selected</button>
        <button
          v-if="totalUnsavedCount > 0"
          class="meta-page__btn meta-page__btn--primary"
          :disabled="saving"
          @click="handleSaveAll"
        >Save all</button>
      </div>
    </div>

    <!-- ── Body (only scrollable area) ────────────────────────────────────── -->
    <div class="meta-page__body">

      <!-- Grid area — scrolls independently -->
      <div class="meta-page__grid-area">
        <div v-if="pending" class="meta-page__skeleton">
          <div v-for="i in 24" :key="i" class="meta-page__skel-card">
            <div class="meta-page__skel-image" />
            <div class="meta-page__skel-info">
              <div class="meta-page__skel-dots">
                <div class="meta-page__skel-dot" />
                <div class="meta-page__skel-dot" />
                <div class="meta-page__skel-dot" />
                <div class="meta-page__skel-dot" />
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="error" class="meta-page__state meta-page__state--error">{{ error }}</div>
        <MetadataImageGrid
          v-else
          :images="pagedImages"
          :selected-ids="selectedIds"
          :active-id="activeId"
          :focused-id="focusedId"
          :unsaved-ids="unsavedIds"
          :panel-open="panelOpen"
          :is-pinterest-complete="isPinterestComplete"
          :is-adobe-stock-complete="isAdobeStockComplete"
          :mode="mode"
          @card-click="handleCardClick"
          @toggle-select="toggle"
        />
      </div>

      <!-- Panel — scrolls independently when content overflows -->
      <aside v-if="panelOpen" class="meta-page__panel">
        <div class="meta-page__panel-header">
          <span class="meta-page__panel-title">{{ panelTitle }}</span>
          <div class="meta-page__panel-actions">
            <span v-if="saving" class="meta-page__save-status">Saving…</span>
            <span v-else-if="saveError" class="meta-page__save-status meta-page__save-status--err">{{ saveError }}</span>
            <span v-else-if="savedAt" class="meta-page__save-status meta-page__save-status--ok">Saved</span>
            <button
              v-if="selectedCount <= 1 && activeDraft?.mediaUrl"
              class="meta-page__icon-btn"
              title="Open image"
              @click="showImagePopup = true"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 2H2v10h10V9M8 2h4v4M14 0L7 7" />
              </svg>
            </button>
            <button class="meta-page__icon-btn" title="Close panel" @click="closePanel">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>
        </div>

        <div class="meta-page__panel-body">
          <template v-if="selectedCount <= 1 && activeDraft">
            <MetadataSingleImageForm
              :draft="activeDraft"
              :is-pinterest-complete="isPinterestComplete(activeDraft)"
              :is-adobe-stock-complete="isAdobeStockComplete(activeDraft)"
              :boards="boards"
              :mode="mode"
              :is-dirty="isDirty"
              :saving="saving"
              @update="onDraftUpdate"
              @save="handleSaveSingle"
              @discard="discardDraft"
              @delete="handleDeleteActive"
              @open-ai="openAiModal"
              @manage-boards="showBoardsManager = true"
              @suggest-board="handleSuggestBoard"
            />
          </template>

          <template v-else-if="selectedCount > 1">
            <MetadataBulkEditForm
              :spec="bulkSpec"
              :count="selectedCount"
              :boards="boards"
              :mode="mode"
              @manage-boards="showBoardsManager = true"
            />
          </template>
        </div>

        <div v-if="selectedCount > 1" class="meta-page__bulk-apply-bar">
          <span class="meta-page__bulk-apply-hint">
            {{ activeFieldCount === 0 ? 'Enable at least one field above' : `${activeFieldCount} field${activeFieldCount !== 1 ? 's' : ''} will be applied` }}
          </span>
          <button
            class="meta-page__btn meta-page__btn--primary"
            :disabled="activeFieldCount === 0 || saving"
            @click="handleApplyBulk"
          >Apply to {{ selectedCount }}</button>
        </div>

      </aside>
    </div>

    <!-- ── Pagination (always visible at bottom) ──────────────────────────── -->
    <nav class="meta-page__pagination">
      <div class="meta-page__page-nav">
        <button class="meta-page__page-btn meta-page__page-btn--jump" :disabled="currentPage <= 1"         title="Back 5 pages"    @click="goToPage(currentPage - 5)">«</button>
        <button class="meta-page__page-btn"                           :disabled="currentPage <= 1"         title="Previous page"   @click="goToPage(currentPage - 1)">‹</button>

        <template v-for="p in pageNumbers" :key="p">
          <span v-if="p === '…'" class="meta-page__page-ellipsis">…</span>
          <button
            v-else
            class="meta-page__page-btn"
            :class="{ 'meta-page__page-btn--active': p === currentPage }"
            @click="goToPage(p)"
          >{{ p }}</button>
        </template>

        <button class="meta-page__page-btn"                           :disabled="currentPage >= totalPages" title="Next page"       @click="goToPage(currentPage + 1)">›</button>
        <button class="meta-page__page-btn meta-page__page-btn--jump" :disabled="currentPage >= totalPages" title="Forward 5 pages" @click="goToPage(currentPage + 5)">»</button>
      </div>

      <div class="meta-page__page-meta">
        <span class="meta-page__page-info">{{ rangeStart }}–{{ rangeEnd }} of {{ totalCount }}</span>
        <select class="meta-page__page-size" :value="pageSize" @change="setPageSize(+$event.target.value)">
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
          <option value="150">150 / page</option>
          <option value="200">200 / page</option>
        </select>
      </div>
    </nav>

    <!-- ── Time Manager modal ───────────────────────────────────────────── -->
    <div v-if="showTimeManager" class="meta-page__overlay" @click.self="showTimeManager = false">
      <MetadataPublishCalendar
        :boards="boards"
        @close="showTimeManager = false"
      />
    </div>

    <!-- ── Pinterest Scheduler modal ─────────────────────────────────────── -->
    <div v-if="showPinterestScheduler" class="meta-page__overlay" @click.self="showPinterestScheduler = false">
      <MetadataPinterestSchedulerModal
        :images="pinterestSchedTargetImages"
        :schedule-info="pinterestScheduleInfo"
        :loading="pinterestScheduleInfoLoading"
        :saving="saving"
        :save-error="saveError"
        :invalid-count="pinterestSchedInvalidCount"
        @apply="handlePinterestScheduleApply"
        @cancel="showPinterestScheduler = false"
      />
    </div>

    <!-- ── Pinterest Boards manager ─────────────────────────────────────── -->
    <div v-if="showBoardsManager" class="meta-page__overlay" @click.self="showBoardsManager = false">
      <MetadataPinterestBoardsManager
        :boards="boards"
        :loading="boardsLoading"
        @close="showBoardsManager = false"
        @add="handleAddBoard"
        @delete="handleDeleteBoard"
      />
    </div>

    <!-- ── Invalid images modal ───────────────────────────────────────────── -->
    <div v-if="showInvalidImages" class="meta-page__overlay" @click.self="showInvalidImages = false">
      <MetadataInvalidImagesModal
        :images="invalidImages"
        :on-save-url="handleSaveInvalidUrl"
        :on-delete-image="handleDeleteInvalidImage"
        @close="showInvalidImages = false"
      />
    </div>

    <!-- ── CSV Export modal ───────────────────────────────────────────────── -->
    <div v-if="showExport" class="meta-page__overlay" @click.self="showExport = false">
      <div class="meta-page__modal meta-page__modal--export">
        <div class="meta-page__modal-header">
          <h3>Export to Pinterest CSV</h3>
          <button class="meta-page__icon-btn" @click="showExport = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
          </button>
        </div>
        <div class="meta-page__modal-body">
          <!-- Summary -->
          <p>
            <strong>{{ exportSelectedImages.length }}</strong> of {{ csvExportImages.length }} image(s) selected for export.
          </p>

          <div class="meta-page__export-tz">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="10" cy="10" r="8" /><path d="M10 5v5l3 2" />
            </svg>
            <span>
              Publish times are written in <strong>{{ exportZoneLabel }}</strong>.
              Set this to your Pinterest account timezone in
              <NuxtLink to="/metadata/settings" class="meta-page__export-tz-link">Settings</NuxtLink>.
            </span>
          </div>

          <!-- Skipped: categorised by missing field -->
          <div v-if="csvValidation.invalid.length" class="meta-page__export-warn">
            <strong>{{ csvValidation.invalid.length }} skipped</strong> — missing required fields:
            <ul>
              <li v-for="[field, count] in csvSkippedByField" :key="field">
                <strong>{{ count }}</strong> × {{ field }}
              </li>
            </ul>
          </div>

          <!-- Optional fields note -->
          <div v-if="csvOptionalSummary.length" class="meta-page__export-note">
            <strong>Optional fields missing</strong>
            <span class="meta-page__export-note-sub">(these images will still export):</span>
            <ul>
              <li v-for="o in csvOptionalSummary" :key="o.key">
                <strong>{{ o.count }}</strong> · {{ o.label }}
              </li>
            </ul>
          </div>

          <!-- Image preview list -->
          <div v-if="csvValidation.valid.length" class="meta-page__export-table-wrap">
            <table class="meta-page__export-table">
              <thead>
                <tr>
                  <th class="meta-page__export-col--check">
                    <input
                      type="checkbox"
                      :checked="exportAllSelected"
                      :indeterminate="exportSomeSelected && !exportAllSelected"
                      @change="toggleExportAll"
                    />
                  </th>
                  <th class="meta-page__export-col--img">Image</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th class="meta-page__export-col--board">Board</th>
                  <th class="meta-page__export-col--date">Publish date</th>
                  <th>Redirect URL</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="img in csvValidation.valid"
                  :key="img.id"
                  class="meta-page__export-row"
                  :class="{ 'meta-page__export-row--unchecked': !exportSelectedIds.has(img.id) }"
                >
                  <td class="meta-page__export-col--check">
                    <input type="checkbox" :checked="exportSelectedIds.has(img.id)" @change="toggleExportImage(img.id)" />
                  </td>
                  <td class="meta-page__export-col--img">
                    <img
                      :src="img.thumbnailUrl || img.mediaUrl"
                      :alt="img.pinterest?.title || img.filename"
                      class="meta-page__export-thumb"
                    />
                  </td>
                  <td><div class="meta-page__export-cell">{{ img.pinterest?.title }}</div></td>
                  <td><div class="meta-page__export-cell">{{ img.pinterest?.description }}</div></td>
                  <td class="meta-page__export-col--board">
                    <span
                      v-if="img.pinterest?.board"
                      class="meta-page__export-board-chip"
                      :style="boardChipStyle(img.pinterest.board)"
                    >{{ img.pinterest.board }}</span>
                    <span v-else class="meta-page__export-board-empty">—</span>
                  </td>
                  <td class="meta-page__export-col--date">
                    <span class="meta-page__export-date">{{ fmtExportDate(img.pinterest?.publishDate) }}</span>
                  </td>
                  <td><div class="meta-page__export-cell meta-page__export-cell--url">{{ img.pinterest?.link }}</div></td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-if="!csvValidation.valid.length" class="meta-page__export-error">No complete images to export.</p>
        </div>
        <div class="meta-page__modal-footer">
          <button class="meta-page__btn meta-page__btn--primary" :disabled="!exportSelectedImages.length" @click="handleDownloadCsv">
            Download {{ exportSelectedImages.length }} as CSV
          </button>
          <button class="meta-page__btn" @click="showExport = false">Cancel</button>
        </div>
      </div>
    </div>

    <!-- ── AI generation modal (single + bulk) ────────────────────────────── -->
    <MetadataAiGenerationModal
      :open="showAiModal"
      :options="aiOptions"
      :progress="aiProgress"
      :image-count="aiTargetImages.length"
      :board-count="boards.length"
      @generate="handleGenerate"
      @cancel="cancelAi"
      @reset-progress="resetAiProgress"
      @close="closeAiModal"
      @manage-boards="showBoardsManager = true"
    />

    <!-- ── Board Intelligence result ───────────────────────────────────────── -->
    <div v-if="showBoardSuggestion" class="meta-page__overlay" @click.self="showBoardSuggestion = false">
      <div class="bi-modal">

        <!-- Header: icon + title flush left, close right -->
        <div class="bi-modal__header">
          <div class="bi-modal__heading">
            <span class="bi-modal__heading-icon">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
              </svg>
            </span>
            <span class="bi-modal__heading-text">Board Suggestion</span>
          </div>
          <button class="meta-page__icon-btn" title="Close" @click="showBoardSuggestion = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="bi-modal__body">
          <!-- Loading state -->
          <div v-if="boardSuggestionLoading" class="bi-modal__loading">
            <svg class="bi-modal__spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Analyzing pin against all boards…
          </div>

          <template v-else-if="boardSuggestionResult">

            <!-- New-board alert: full-width, prominent -->
            <div v-if="boardSuggestionResult.isNewBoard" class="bi-modal__alert">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M10 1l9 17H1L10 1z"/><path d="M10 8v4M10 15h.01"/>
              </svg>
              <div>
                <strong>Board doesn't exist in your Pinterest account.</strong>
                You must create it in Pinterest before importing — otherwise the CSV will fail.
              </div>
            </div>

            <!-- Primary suggestion card -->
            <div class="bi-modal__card">
              <div class="bi-modal__card-eyebrow">Best match</div>
              <div class="bi-modal__card-row">
                <span class="bi-modal__board-name">{{ boardSuggestionResult.suggestedBoard }}</span>
                <span
                  class="bi-modal__badge"
                  :class="{
                    'bi-modal__badge--good': boardSuggestionResult.relevanceScore >= 75,
                    'bi-modal__badge--ok':   boardSuggestionResult.relevanceScore >= 50 && boardSuggestionResult.relevanceScore < 75,
                    'bi-modal__badge--poor': boardSuggestionResult.relevanceScore < 50,
                  }"
                >{{ boardSuggestionResult.relevanceScore }}% match</span>
              </div>
              <p class="bi-modal__reason">{{ boardSuggestionResult.reasoning }}</p>
            </div>

            <!-- Alternative -->
            <div v-if="boardSuggestionResult.alternativeBoard" class="bi-modal__alt">
              <span class="bi-modal__alt-label">Alternative</span>
              <span class="bi-modal__alt-name">{{ boardSuggestionResult.alternativeBoard }}</span>
              <span class="bi-modal__alt-score">{{ boardSuggestionResult.alternativeScore }}%</span>
              <button class="bi-modal__alt-btn" @click="applyBoardSuggestion('alternative')">Use this</button>
            </div>

            <!-- Actions -->
            <div class="bi-modal__footer">
              <button class="meta-page__btn meta-page__btn--primary" @click="applyBoardSuggestion('suggested')">
                Apply board
              </button>
              <button class="meta-page__btn" @click="showBoardSuggestion = false">Cancel</button>
            </div>

          </template>
        </div>

      </div>
    </div>

    <!-- ── Link Health result ──────────────────────────────────────────────── -->
    <div v-if="showLinkHealth" class="meta-page__overlay" @click.self="showLinkHealth = false">
      <div class="meta-page__modal">
        <div class="meta-page__modal-header">
          <h3>Link Health Check</h3>
          <button class="meta-page__icon-btn" @click="showLinkHealth = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
          </button>
        </div>
        <div class="meta-page__modal-body">
          <div v-if="linkHealthLoading" class="meta-page__intelligence-loading">Checking {{ linkHealthTotal }} URLs...</div>
          <template v-else-if="linkHealthResults">
            <div class="meta-page__link-summary">
              <span class="meta-page__link-stat meta-page__link-stat--ok">{{ linkHealthResults.summary.healthy }} healthy</span>
              <span class="meta-page__link-stat meta-page__link-stat--warn">{{ linkHealthResults.summary.redirects }} redirects</span>
              <span class="meta-page__link-stat meta-page__link-stat--err">{{ linkHealthResults.summary.broken }} broken</span>
            </div>
            <div v-if="linkHealthResults.results.filter(r => r.status !== 'healthy').length" class="meta-page__link-list">
              <div v-for="r in linkHealthResults.results.filter(r => r.status !== 'healthy')" :key="r.url" class="meta-page__link-item" :class="'meta-page__link-item--' + r.status">
                <span class="meta-page__link-url">{{ r.url }}</span>
                <span class="meta-page__link-badge">{{ r.status }}{{ r.statusCode ? ` (${r.statusCode})` : '' }}</span>
              </div>
            </div>
            <p v-else class="meta-page__link-allgood">All links are healthy!</p>
          </template>
        </div>
      </div>
    </div>

    <!-- ── Duplicate Guard result ──────────────────────────────────────────── -->
    <div v-if="showDuplicates" class="meta-page__overlay" @click.self="showDuplicates = false">
      <div class="meta-page__modal meta-page__modal--dup">
        <div class="meta-page__modal-header">
          <div class="meta-page__dup-header-left">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="8" height="8" rx="1.5" />
              <rect x="9" y="9" width="8" height="8" rx="1.5" />
            </svg>
            <h3>Duplicate &amp; Freshness Scan</h3>
          </div>
          <button class="meta-page__icon-btn" @click="showDuplicates = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
          </button>
        </div>

        <div class="meta-page__modal-body">
          <div v-if="duplicateLoading" class="meta-page__intelligence-loading">Scanning...</div>
          <template v-else-if="duplicateResult">

            <!-- Summary pills -->
            <div class="meta-page__dup-summary">
              <div class="meta-page__dup-pill" :class="duplicateResult.duplicates.length ? 'meta-page__dup-pill--warn' : 'meta-page__dup-pill--ok'">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="9" y="9" width="8" height="8" rx="1.5" />
                </svg>
                {{ duplicateResult.duplicates.length }} duplicate{{ duplicateResult.duplicates.length !== 1 ? 's' : '' }}
              </div>
              <div class="meta-page__dup-pill" :class="duplicateResult.freshnessWarnings.length ? 'meta-page__dup-pill--stale' : 'meta-page__dup-pill--ok'">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <circle cx="10" cy="10" r="8"/><path d="M10 6v4l2.5 1.5"/>
                </svg>
                {{ duplicateResult.freshnessWarnings.length }} stale{{ duplicateResult.freshnessWarnings.length !== 1 ? ' pins' : ' pin' }}
              </div>
            </div>

            <!-- Duplicates section -->
            <div class="meta-page__dup-block">
              <div class="meta-page__dup-block-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="9" y="9" width="8" height="8" rx="1.5" />
                </svg>
                Near-duplicate titles
                <span class="meta-page__dup-block-count">{{ duplicateResult.duplicates.length }}</span>
              </div>

              <div v-if="duplicateResult.duplicates.length" class="meta-page__dup-list">
                <div
                  v-for="(pair, i) in sortedDuplicates"
                  :key="i"
                  class="meta-page__dup-row"
                >
                  <div class="meta-page__dup-sim-bar">
                    <div class="meta-page__dup-sim-fill" :style="{ width: pair.similarity + '%' }" :class="pair.similarity === 100 ? 'meta-page__dup-sim-fill--exact' : 'meta-page__dup-sim-fill--near'" />
                  </div>
                  <div class="meta-page__dup-row-body">
                    <div class="meta-page__dup-titles">
                      <span class="meta-page__dup-title">{{ pair.imageA.title || '(no title)' }}</span>
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="meta-page__dup-arrow">
                        <path d="M2 7h10M8 3l4 4-4 4"/>
                      </svg>
                      <span class="meta-page__dup-title">{{ pair.imageB.title || '(no title)' }}</span>
                    </div>
                    <div class="meta-page__dup-meta">
                      <span class="meta-page__dup-type" :class="pair.type === 'exact' ? 'meta-page__dup-type--exact' : 'meta-page__dup-type--near'">
                        {{ pair.type === 'exact' ? 'Exact match' : 'Near match' }}
                      </span>
                      <span class="meta-page__dup-pct">{{ pair.similarity }}% similar</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="meta-page__dup-empty">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round">
                  <path d="M5 10l4 4 6-8"/>
                </svg>
                No duplicate titles found
              </div>
            </div>

            <!-- Freshness section -->
            <div class="meta-page__dup-block">
              <div class="meta-page__dup-block-title">
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <circle cx="10" cy="10" r="8"/><path d="M10 6v4l2.5 1.5"/>
                </svg>
                Stale pins (90+ days)
                <span class="meta-page__dup-block-count">{{ duplicateResult.freshnessWarnings.length }}</span>
              </div>

              <div v-if="duplicateResult.freshnessWarnings.length" class="meta-page__dup-list">
                <div
                  v-for="w in sortedFreshness"
                  :key="w.id"
                  class="meta-page__stale-row"
                >
                  <div class="meta-page__stale-age">
                    <span class="meta-page__stale-days">{{ w.daysSince }}d</span>
                    <span class="meta-page__stale-label">old</span>
                  </div>
                  <div class="meta-page__stale-body">
                    <div class="meta-page__stale-title">{{ w.title || '(no title)' }}</div>
                    <div class="meta-page__stale-hint">{{ w.suggestion }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="meta-page__dup-empty">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round">
                  <path d="M5 10l4 4 6-8"/>
                </svg>
                All pins are fresh
              </div>
            </div>

          </template>
        </div>
      </div>
    </div>

    <!-- ── Image lightbox popup ───────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="showImagePopup && activeDraft?.mediaUrl"
        class="img-popup"
        @click.self="showImagePopup = false"
      >
        <button class="img-popup__close" title="Close" @click="showImagePopup = false">
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
        <img
          class="img-popup__img"
          :src="activeDraft.mediaUrl"
          :alt="activeDraft.pinterest?.title || activeDraft.filename"
          @click.stop
        />
      </div>
    </Teleport>

  </div>
</template>

<script setup>
// ── Props ────────────────────────────────────────────────────────────────────
const props = defineProps({
  // Preset Pinterest status filter applied on mount. The status dropdown in
  // the toolbar stays interactive — the preset is the *initial* state, not a
  // hard lock — so users can still drill in further (e.g. drafts → ready only).
  presetStatus: { type: Array, default: () => [] },
  // Heading shown at the top of the workspace.
  viewLabel: { type: String, default: 'Pins' },
  // When true, only images with a Pinterest publish_date are kept (Schedules view).
  requirePublishDate: { type: Boolean, default: false },
  // When true, default sort flips to publish date ascending (Schedules view).
  defaultSortByPublishDate: { type: Boolean, default: false },
})

// ── Data ──────────────────────────────────────────────────────────────────────
const {
  images, pending, error,
  saving, saveError,
  loadImages, saveImage, saveImages, invalidateCache,
  deleteImage, deleteImages, updateImageUrl,
} = useMetadataImages()

onMounted(() => { loadImages(); loadBoards(); loadProjectMeta() })

// CSV-history badge now lives in the sidebar; we just bump the shared count
// after a download here (see handleDownloadCsv).
const { bump: bumpCsvBadge } = useCsvExportBadge()

// ── Pinterest boards ──────────────────────────────────────────────────────────
const { boards, loading: boardsLoading, loadBoards, addBoard, deleteBoard, chipStyleForName } = usePinterestBoards()
// Account-performance brief (from the imported Pinterest analytics CSV) — fed
// to the AI so generated copy leans into proven, high-traffic themes.
const { analyticsBrief, load: loadProjectMeta } = useMetadataProject()
const showBoardsManager = ref(false)

async function handleAddBoard(name) {
  await addBoard(name)
}

async function handleDeleteBoard(id) {
  await deleteBoard(id)
}

// ── Mode (Adobe Stock UI is hidden; the workspace is Pinterest-only for now) ──
const { mode, setMode } = useMetadataMode()
// Force Pinterest mode regardless of any stale persisted preference.
onMounted(() => { if (mode.value !== 'pinterest') setMode('pinterest') })

// ── Selection ─────────────────────────────────────────────────────────────────
const { selectedIds, selectedCount, toggle, selectImages, clearSelection } = useImageSelection()

// ── Filters / Sort ────────────────────────────────────────────────────────────
const {
  filters, sortField, sortDirection, hasFilters,
  filteredImages: baseFilteredImages, validImages, invalidImages,
  isPinterestComplete, isAdobeStockComplete,
  resetFilters, setSort,
} = useGalleryFilters(images, selectedIds, mode)

// Drafts/Posted/Schedules pre-select a sensible Pinterest "exported" filter so
// the toolbar UI stays consistent with what the user sees. Multi-status
// presets and "must have publish date" are layered on top via the wrapping
// computed below — these route views don't fight user drill-downs because
// the layered filter is read-only.
const presetStatusSet = computed(() => new Set(props.presetStatus ?? []))

// Re-apply preset-driven defaults whenever the route preset changes. The
// workspace is now mounted once at the layout level and stays alive across
// /metadata, /drafts, /schedules, /posted — switching routes only flips these
// props, so the watcher is what makes each view feel "fresh."
function applyRoutePreset() {
  // Default the Pinterest "exported" filter to whatever the preset implies so
  // the toolbar UI matches the view (Drafts → hide exported, Posted → only
  // exported, Pins → not-exported by default).
  if (props.presetStatus?.length) {
    const allExported = props.presetStatus.every(s => s === 'exported' || s === 'published')
    const noneExported = props.presetStatus.every(s => s === 'draft' || s === 'ready')
    if (allExported) filters.pinterestExported = 'exported'
    else if (noneExported) filters.pinterestExported = 'not-exported'
  } else {
    filters.pinterestExported = 'not-exported'
  }

  if (props.defaultSortByPublishDate) {
    sortField.value = 'pinterestPublishDate'
    sortDirection.value = 'asc'
  } else {
    sortField.value = 'createdAt'
    sortDirection.value = 'desc'
  }
}

watch(
  () => [props.presetStatus, props.requirePublishDate, props.defaultSortByPublishDate],
  applyRoutePreset,
  { immediate: true },
)

// Wrap the gallery's filtered images so route-level status presets and "must
// have a publish date" (Schedules view) are enforced regardless of what the
// user does in the toolbar.
const filteredImages = computed(() => {
  let list = baseFilteredImages.value
  if (presetStatusSet.value.size > 0) {
    list = list.filter(i => presetStatusSet.value.has(i.pinterest?.status))
  }
  if (props.requirePublishDate) {
    list = list.filter(i => !!i.pinterest?.publishDate)
  }
  return list
})

// ── Invalid images modal ─────────────────────────────────────────────────────
const showInvalidImages = ref(false)

async function handleSaveInvalidUrl({ id, mediaUrl }) {
  await updateImageUrl(id, { mediaUrl })
}

async function handleDeleteInvalidImage(id) {
  await deleteImage(id)
  // Clean up local state if the deleted image was active/selected.
  if (activeId.value === id) activeId.value = null
  if (selectedIds.value.has(id)) toggle(id)
  if (pendingChanges.value.has(id)) {
    const m = new Map(pendingChanges.value)
    m.delete(id)
    pendingChanges.value = m
  }
}

// ── Image lightbox ────────────────────────────────────────────────────────────
const showImagePopup = ref(false)

// Upload now lives in the sidebar (useMetadataUpload + the metadata layout).
// Re-pull the gallery when an upload finishes so new images appear with their
// joined Pinterest / Adobe rows.
const { onUploaded } = useMetadataUpload()
let _offUploaded = null
onMounted(() => {
  _offUploaded = onUploaded(async () => { invalidateCache(); await loadImages() })
})
onUnmounted(() => { _offUploaded?.() })

// ── Delete (individual / bulk) ───────────────────────────────────────────────
async function handleDeleteActive() {
  if (!activeId.value) return
  const img = images.value.find(i => i.id === activeId.value)
  const label = img?.filename ?? activeId.value
  if (!confirm(`Delete "${label}"? This cannot be undone.`)) return

  const id = activeId.value
  try {
    await deleteImage(id)
    if (selectedIds.value.has(id)) toggle(id)
    if (pendingChanges.value.has(id)) {
      const m = new Map(pendingChanges.value)
      m.delete(id)
      pendingChanges.value = m
    }
    activeId.value = null
  } catch { /* error already surfaced via saveError */ }
}

async function handleDeleteSelected() {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return
  if (!confirm(`Delete ${ids.length} image${ids.length !== 1 ? 's' : ''}? This cannot be undone.`)) return

  try {
    await deleteImages(ids)
    // Local cleanup: drop selection, any drafts, and clear active if it was deleted.
    clearSelection()
    const m = new Map(pendingChanges.value)
    for (const id of ids) m.delete(id)
    pendingChanges.value = m
    if (activeId.value && ids.includes(activeId.value)) activeId.value = null
  } catch { /* error already surfaced via saveError */ }
}

function onUpdateFilter(key, val) {
  filters[key] = val
}

// ── Active image / draft ──────────────────────────────────────────────────────
const activeId = ref(null)
const activeImage = computed(() => images.value.find(i => i.id === activeId.value) ?? null)
const activeDraft = ref(null)
const imageAtLoad = ref(null) // saved-state baseline for dirty comparison
const isDirty = ref(false)
const savedAt = ref(null)
const pendingChanges = ref(new Map())

// When the user switches between Pins / Drafts / Schedules / Posted, the
// workspace stays mounted. Clear selection + active id so the detail sidebar
// doesn't keep highlighting an image that's no longer in the active filter.
watch(
  () => [props.viewLabel, props.presetStatus],
  () => {
    clearSelection()
    activeId.value = null
    lastClickedIndex.value = -1
    focusedIndex.value = -1
    currentPage.value = 1
  },
  { flush: 'post' },
)

function draftDiffersFromBaseline(draft) {
  if (!draft || !imageAtLoad.value) return false
  return JSON.stringify(draft) !== JSON.stringify(imageAtLoad.value)
}

watch(activeId, (newId, oldId) => {
  if (oldId && isDirty.value && activeDraft.value) {
    const m = new Map(pendingChanges.value)
    m.set(oldId, activeDraft.value)
    pendingChanges.value = m
  }
  if (newId) {
    const img = images.value.find(i => i.id === newId) ?? null
    imageAtLoad.value = img ? JSON.parse(JSON.stringify(img)) : null
    const pending = pendingChanges.value.get(newId)
    activeDraft.value = pending ?? (img ? JSON.parse(JSON.stringify(img)) : null)
    isDirty.value = !!pending
  } else {
    imageAtLoad.value = null
    activeDraft.value = null
    isDirty.value = false
  }
  savedAt.value = null
})

const totalUnsavedCount = computed(() =>
  pendingChanges.value.size + (isDirty.value ? 1 : 0)
)

const unsavedIds = computed(() => {
  const s = new Set(pendingChanges.value.keys())
  if (isDirty.value && activeId.value) s.add(activeId.value)
  return s
})

function onDraftUpdate(updated) {
  activeDraft.value = updated
  const dirty = draftDiffersFromBaseline(updated)
  isDirty.value = dirty
  if (dirty) {
    savedAt.value = null
  } else if (activeId.value && pendingChanges.value.has(activeId.value)) {
    const m = new Map(pendingChanges.value)
    m.delete(activeId.value)
    pendingChanges.value = m
  }
}

function discardDraft() {
  activeDraft.value = imageAtLoad.value ? JSON.parse(JSON.stringify(imageAtLoad.value)) : null
  isDirty.value = false
  if (activeId.value && pendingChanges.value.has(activeId.value)) {
    const m = new Map(pendingChanges.value)
    m.delete(activeId.value)
    pendingChanges.value = m
  }
}

// ── Panel ─────────────────────────────────────────────────────────────────────
const panelOpen = computed(() => selectedCount.value > 1 || activeId.value !== null)
const panelTitle = computed(() =>
  selectedCount.value > 1 ? `${selectedCount.value} images selected` : (activeImage.value?.filename ?? '')
)

function closePanel() {
  activeId.value = null
  clearSelection()
}

// ── Select-all checkbox ───────────────────────────────────────────────────────
const selectAllCheckbox = ref(null)

const allVisibleSelected = computed(() =>
  pagedImages.value.length > 0 && pagedImages.value.every(img => selectedIds.value.has(img.id))
)

watchEffect(() => {
  if (!selectAllCheckbox.value) return
  const some = pagedImages.value.some(img => selectedIds.value.has(img.id))
  selectAllCheckbox.value.indeterminate = some && !allVisibleSelected.value
})

function toggleSelectAll() {
  if (allVisibleSelected.value) {
    clearSelection()
  } else {
    selectImages(pagedImages.value)
  }
}

// ── Selection mode + card click ───────────────────────────────────────────────
const selectionMode = ref('single')
const lastClickedIndex = ref(-1)
const focusedIndex = ref(-1)
const focusedId = computed(() => pagedImages.value[focusedIndex.value]?.id ?? null)

function handleCardClick(id, index, event) {
  focusedIndex.value = index

  if (event.ctrlKey && lastClickedIndex.value >= 0) {
    const start = Math.min(lastClickedIndex.value, index)
    const end = Math.max(lastClickedIndex.value, index)
    selectImages(pagedImages.value.slice(start, end + 1))
    return
  }

  if (selectionMode.value === 'single') {
    clearSelection()
    if (activeId.value !== id) {
      toggle(id)
      activeId.value = id
    } else {
      activeId.value = null
    }
  } else {
    toggle(id)
    const nowSelected = selectedIds.value.has(id)
    if (nowSelected) {
      activeId.value = id
    } else if (activeId.value === id) {
      activeId.value = null
    }
  }
  lastClickedIndex.value = index
  savedAt.value = null
}

// ── Keyboard navigation ───────────────────────────────────────────────────────
function handleKeydown(event) {
  if (event.key === 'Escape' && showImagePopup.value) {
    showImagePopup.value = false
    return
  }

  const tag = document.activeElement?.tagName?.toLowerCase()
  if (['input', 'textarea', 'select'].includes(tag)) return

  const len = pagedImages.value.length
  if (len === 0) return

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    focusedIndex.value = focusedIndex.value < 0
      ? 0
      : Math.min(len - 1, focusedIndex.value + 1)
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    focusedIndex.value = focusedIndex.value < 0
      ? 0
      : Math.max(0, focusedIndex.value - 1)
  } else if (event.key === ' ') {
    event.preventDefault()
    const img = pagedImages.value[focusedIndex.value]
    if (img) toggle(img.id)
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))

// ── Single image save ─────────────────────────────────────────────────────────
async function handleSaveSingle() {
  if (!activeDraft.value) return
  await saveImage(activeDraft.value)
  if (!saveError.value) {
    imageAtLoad.value = JSON.parse(JSON.stringify(activeDraft.value))
    isDirty.value = false
    savedAt.value = new Date()
    if (activeId.value && pendingChanges.value.has(activeId.value)) {
      const m = new Map(pendingChanges.value)
      m.delete(activeId.value)
      pendingChanges.value = m
    }
  }
}

async function handleSaveAll() {
  const toSave = []
  if (isDirty.value && activeDraft.value) toSave.push(activeDraft.value)
  for (const [id, draft] of pendingChanges.value) {
    if (!toSave.find(d => d.id === id)) toSave.push(draft)
  }
  if (toSave.length === 0) return
  await saveImages(toSave)
  if (!saveError.value) {
    if (activeDraft.value) imageAtLoad.value = JSON.parse(JSON.stringify(activeDraft.value))
    isDirty.value = false
    savedAt.value = new Date()
    pendingChanges.value = new Map()
  }
}

async function handleSaveAllSelected() {
  if (selectedCount.value === 0) return
  const toSave = []
  for (const img of images.value) {
    if (!selectedIds.value.has(img.id)) continue
    if (img.id === activeId.value && isDirty.value && activeDraft.value) {
      toSave.push(activeDraft.value)
    } else if (pendingChanges.value.has(img.id)) {
      toSave.push(pendingChanges.value.get(img.id))
    } else {
      toSave.push(img)
    }
  }
  if (toSave.length === 0) return
  await saveImages(toSave)
  if (!saveError.value) {
    if (activeId.value && selectedIds.value.has(activeId.value) && isDirty.value) {
      if (activeDraft.value) imageAtLoad.value = JSON.parse(JSON.stringify(activeDraft.value))
      isDirty.value = false
      savedAt.value = new Date()
    }
    const m = new Map(pendingChanges.value)
    for (const img of toSave) m.delete(img.id)
    pendingChanges.value = m
  }
}

// ── Bulk edit ─────────────────────────────────────────────────────────────────
const { spec: bulkSpec, reset: resetBulk, applyToImages, activeFieldCount } = useBulkEdit()

async function handleApplyBulk() {
  const selected = images.value.filter(img => selectedIds.value.has(img.id))
  const updated = applyToImages(selected)
  await saveImages(updated)
  if (!saveError.value) {
    resetBulk()
    clearSelection()
    activeId.value = null
  }
}

// ── AI generation ─────────────────────────────────────────────────────────────
const { options: aiOptions, progress: aiProgress, generate, cancel: cancelAi, resetProgress: resetAiProgress } = useAiMetadataGeneration()
const { settings: aiDefaults, load: loadAiDefaults } = useMetadataSettings()

// Seed the per-session AI options from the saved Settings defaults so users
// don't have to re-enter their preferred tone / lengths every visit. Settings
// are loaded lazily — the watcher catches the load and applies once.
let aiDefaultsApplied = false
function applyAiDefaults() {
  if (aiDefaultsApplied || !aiDefaults.value) return
  aiOptions.maxPinterestTitleLength = aiDefaults.value.ai_max_title_length ?? aiOptions.maxPinterestTitleLength
  aiOptions.maxPinterestDescriptionLength = aiDefaults.value.ai_max_description_length ?? aiOptions.maxPinterestDescriptionLength
  if (aiDefaults.value.ai_default_tone) aiOptions.tone = aiDefaults.value.ai_default_tone
  if (aiDefaults.value.ai_default_language) aiOptions.language = aiDefaults.value.ai_default_language
  if (aiDefaults.value.ai_additional_instructions) {
    aiOptions.additionalContext = aiDefaults.value.ai_additional_instructions
  }
  aiDefaultsApplied = true
}
onMounted(async () => { await loadAiDefaults(); applyAiDefaults() })
watch(aiDefaults, applyAiDefaults, { deep: true })

const aiTargetImages = computed(() => {
  // Always run AI generation against valid-URL images only.
  if (selectedCount.value > 0) return validImages.value.filter(i => selectedIds.value.has(i.id))
  if (activeId.value) return validImages.value.filter(i => i.id === activeId.value)
  return filteredImages.value
})

async function handleGenerate() {
  await generate(
    aiTargetImages.value,
    (updated) => {
      const idx = images.value.findIndex(i => i.id === updated.id)
      if (idx !== -1) images.value[idx] = updated
      if (updated.id === activeId.value) {
        activeDraft.value = JSON.parse(JSON.stringify(updated))
        isDirty.value = true
        savedAt.value = null
      } else {
        saveImage(updated)
      }
    },
    async (img, opts, ctx = {}) => {
      return await $fetch('/api/generate-metadata', {
        method: 'POST',
        body: {
          filename: img.filename,
          prompt: img.prompt,
          colors: img.colors,
          additionalContext: opts.additionalContext,
          accountContext: analyticsBrief.value || '',
          options: opts,
          boards: opts.generateFor.pinterestBoard ? boards.value.map(b => b.name) : [],
          existingTitles: ctx.existingTitles ?? [],
        },
      })
    },
  )
}

// ── AI modal (single + bulk share one transparent flow) ──────────────────────
const showAiModal = ref(false)

const aiCtaTitle = computed(() => {
  if (selectedCount.value > 0) return `Generate metadata for ${selectedCount.value} selected image${selectedCount.value !== 1 ? 's' : ''}`
  if (activeId.value) return 'Generate metadata for this image'
  return `Generate metadata for all ${filteredImages.value.length} image${filteredImages.value.length !== 1 ? 's' : ''} in this view`
})

function openAiModal() {
  if (aiProgress.status === 'done' || aiProgress.status === 'cancelled') resetAiProgress()
  showAiModal.value = true
}

function closeAiModal() {
  showAiModal.value = false
  if (aiProgress.status === 'done' || aiProgress.status === 'cancelled') resetAiProgress()
}

// ── Board Intelligence ───────────────────────────────────────────────────────
const { suggestion: boardSuggestionResult, loading: boardSuggestionLoading, suggestBoard } = useBoardIntelligence()
const showBoardSuggestion = ref(false)

async function handleSuggestBoard() {
  if (!activeDraft.value) return
  showBoardSuggestion.value = true
  await suggestBoard(
    {
      title: activeDraft.value.pinterest?.title || '',
      description: activeDraft.value.pinterest?.description || '',
      filename: activeDraft.value.filename || '',
    },
    boards.value,
  )
}

function applyBoardSuggestion(which = 'suggested') {
  if (!boardSuggestionResult.value || !activeDraft.value) return
  const name = which === 'alternative'
    ? boardSuggestionResult.value.alternativeBoard
    : boardSuggestionResult.value.suggestedBoard
  if (!name) return
  onDraftUpdate({
    ...activeDraft.value,
    pinterest: { ...activeDraft.value.pinterest, board: name },
  })
  showBoardSuggestion.value = false
}


// ── Link Health ──────────────────────────────────────────────────────────────
const { checkLinks, results: linkHealthResultsList, summary: linkHealthSummary, loading: linkHealthLoading } = useLinkHealth()
const showLinkHealth = ref(false)
const linkHealthTotal = ref(0)

const linkHealthResults = computed(() => {
  if (!linkHealthSummary.value) return null
  return { results: linkHealthResultsList.value, summary: linkHealthSummary.value }
})

async function handleCheckLinks() {
  const targets = selectedCount.value > 0
    ? validImages.value.filter(i => selectedIds.value.has(i.id))
    : filteredImages.value
  const urls = targets
    .map(i => i.pinterest?.link)
    .filter(Boolean)
  if (urls.length === 0) return
  linkHealthTotal.value = urls.length
  showLinkHealth.value = true
  await checkLinks(urls)
}

// ── Duplicate Guard ──────────────────────────────────────────────────────────
const { scan: scanDuplicates, duplicates: duplicatesList, freshnessWarnings } = useDuplicateGuard()
const showDuplicates = ref(false)
const duplicateLoading = ref(false)

const duplicateResult = computed(() => ({
  duplicates: duplicatesList.value,
  freshnessWarnings: freshnessWarnings.value,
}))

function handleScanDuplicates() {
  const targets = selectedCount.value > 0
    ? validImages.value.filter(i => selectedIds.value.has(i.id))
    : filteredImages.value
  showDuplicates.value = true
  duplicateLoading.value = true
  scanDuplicates(targets)
  duplicateLoading.value = false
}

const sortedDuplicates = computed(() =>
  [...duplicatesList.value].sort((a, b) => b.similarity - a.similarity)
)

const sortedFreshness = computed(() =>
  [...freshnessWarnings.value].sort((a, b) => b.daysSince - a.daysSince)
)

// ── Per-view capabilities ────────────────────────────────────────────────────
// Each route view (Pins / Drafts / Schedules / Posted) only surfaces the
// actions that make sense for that workflow stage, so the top bars stop
// showing buttons that are confusing or irrelevant where you are.
const viewCaps = computed(() => {
  const v = props.viewLabel
  const isPosted = v === 'Posted'
  const isSchedules = v === 'Schedules'
  return {
    // AI generation is useful on every view (re-generate posted pins, fix
    // scheduled ones, draft new ones) — always available.
    ai: true,
    // CSV is the Drafts/Pins → ready-to-post step.
    exportCsv: !isPosted && !isSchedules,
    // Date assignment is irrelevant once everything is posted.
    scheduling: !isPosted,
    timeManager: !isPosted,
  }
})

// ── Time Manager ─────────────────────────────────────────────────────────────
const showTimeManager = ref(false)

// ── Pinterest Bulk Scheduler ───────────────────────────────────────────────────
const showPinterestScheduler = ref(false)
const pinterestScheduleInfo = ref(null)
const pinterestScheduleInfoLoading = ref(false)

const pinterestSchedTargetImages = computed(() =>
  selectedCount.value > 0
    ? validImages.value.filter(i => selectedIds.value.has(i.id))
    : filteredImages.value
)

// Count of invalid images that would have been targets had they been valid —
// shown in the scheduler so the user knows how many were skipped.
const pinterestSchedInvalidCount = computed(() => {
  if (selectedCount.value > 0) {
    return invalidImages.value.filter(i => selectedIds.value.has(i.id)).length
  }
  return invalidImages.value.length
})

async function openPinterestScheduler() {
  showPinterestScheduler.value = true
  pinterestScheduleInfoLoading.value = true
  pinterestScheduleInfo.value = null
  try {
    pinterestScheduleInfo.value = await $fetch('/api/pinterest/schedule-info')
  } catch {
    pinterestScheduleInfo.value = { latestTimestamp: null, existingTimestamps: [] }
  } finally {
    pinterestScheduleInfoLoading.value = false
  }
}

async function handlePinterestScheduleApply(updatedImages) {
  await saveImages(updatedImages)
  if (!saveError.value) showPinterestScheduler.value = false
}

// ── CSV Export ────────────────────────────────────────────────────────────────
const { validate, downloadCsv } = usePinterestCsvExport()
const showExport = ref(false)
const exportSelectedIds = ref(new Set())

// CSV publish dates are written as wall-clock in this zone (set in Settings to
// match the Pinterest account timezone). The preview shows the same string so
// what the user sees is exactly what Pinterest receives.
const exportTimezone = computed(() => aiDefaults.value?.csv_timezone || DEFAULT_METADATA_TIMEZONE)
const exportZoneLabel = computed(() => {
  const off = zoneOffsetLabel(exportTimezone.value)
  return off ? `${exportTimezone.value} (${off})` : exportTimezone.value
})
function fmtExportDate(iso) {
  return iso ? formatWallClockInZone(iso, exportTimezone.value).replace('T', ' ') : '—'
}

const csvExportImages = computed(() =>
  selectedCount.value > 0
    ? validImages.value.filter(i => selectedIds.value.has(i.id))
    : filteredImages.value
)

const csvValidation = computed(() => validate(csvExportImages.value))

const csvOptionalSummary = computed(() => {
  const om = csvValidation.value.optionalMissing ?? {}
  return Object.entries(om)
    .filter(([, v]) => v.count > 0)
    .map(([key, v]) => ({ key, label: v.label, count: v.count, samples: v.samples }))
})

const csvSkippedByField = computed(() => {
  const map = new Map()
  for (const { missing } of csvValidation.value.invalid) {
    for (const field of missing) {
      map.set(field, (map.get(field) ?? 0) + 1)
    }
  }
  return [...map.entries()]
})

const exportSelectedImages = computed(() =>
  csvValidation.value.valid.filter(img => exportSelectedIds.value.has(img.id))
)

const exportAllSelected = computed(() =>
  csvValidation.value.valid.length > 0 &&
  csvValidation.value.valid.every(img => exportSelectedIds.value.has(img.id))
)

const exportSomeSelected = computed(() =>
  csvValidation.value.valid.some(img => exportSelectedIds.value.has(img.id))
)

function boardChipStyle(name) {
  return chipStyleForName(name)
}

function openExport() {
  exportSelectedIds.value = new Set(csvValidation.value.valid.map(img => img.id))
  showExport.value = true
}

function toggleExportAll() {
  exportSelectedIds.value = exportAllSelected.value
    ? new Set()
    : new Set(csvValidation.value.valid.map(img => img.id))
}

function toggleExportImage(id) {
  const next = new Set(exportSelectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  exportSelectedIds.value = next
}

function handleDownloadCsv() {
  // Downloading the CSV only creates the history record. The "exported" status
  // on each pinterest_image is intentionally NOT changed here — flipping that
  // is a deliberate user action via "Set Exported" on the history page or via
  // editing the image directly.
  const filename = downloadCsv(exportSelectedImages.value, exportTimezone.value)
  showExport.value = false
  $fetch('/api/pinterest/csv-exports', {
    method: 'POST',
    body: {
      filename,
      row_count: exportSelectedImages.value.length,
      image_ids: exportSelectedImages.value.map(img => img.id),
    },
  }).then(() => { bumpCsvBadge() }).catch(() => {})
}

// ── Pagination (client-side, driven by filteredImages so totals reflect filters) ──
const pageSize = ref(25)
const currentPage = ref(1)

const totalCount = computed(() => filteredImages.value.length)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

const pagedImages = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredImages.value.slice(start, start + pageSize.value)
})

// When filters shrink the result set, clamp the current page so we never land
// on an empty page past the end.
watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})

const rangeStart = computed(() =>
  totalCount.value === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
)
const rangeEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, totalCount.value)
)

const pageNumbers = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set(
    [1, total, cur - 1, cur, cur + 1].filter(p => p >= 1 && p <= total)
  )
  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
})

async function handleRefresh() {
  invalidateCache()
  await loadImages()
}

function setPageSize(size) {
  pageSize.value = size
  currentPage.value = 1
}

function goToPage(page) {
  page = Math.max(1, Math.min(totalPages.value, page))
  if (page === currentPage.value) return
  clearSelection()
  activeId.value = null
  lastClickedIndex.value = -1
  focusedIndex.value = -1
  currentPage.value = page
  document.querySelector('.meta-page__grid-area')?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped lang="scss">
.meta-page {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // ── Top bar (workspace heading + search + refresh) ──────────────────────────

  &__top-bar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 20px;
    background: #fff;
    border-bottom: 1px solid #ececec;
    min-height: 56px;
    box-sizing: border-box;
  }

  &__heading {
    display: flex;
    align-items: baseline;
    gap: 10px;
    flex-shrink: 0;
    min-width: 0;
  }

  &__heading-title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: $color-primary;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  &__heading-count {
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 999px;
    padding: 2px 9px;
    line-height: 1;
  }

  &__search { max-width: 360px; }

  &__search {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
  }

  &__search-icon {
    position: absolute;
    left: 10px;
    color: #9ca3af;
    pointer-events: none;
  }

  &__search-input {
    width: 100%;
    height: 32px;
    padding: 0 32px 0 32px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    background: #f9fafb;
    color: $color-primary;
    transition: border-color 0.15s, background 0.15s;
    box-sizing: border-box;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }
  }

  &__search-clear {
    position: absolute;
    right: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border: none;
    background: none;
    cursor: pointer;
    color: #9ca3af;
    border-radius: 4px;

    &:hover { color: $color-primary; background: #f3f4f6; }
  }

  // ── Toolbar (mode + sort + filters + actions) ──────────────────────────────

  &__toolbar {
    flex-shrink: 0;
    padding: 8px 16px;
    background: $color-bg;
    border-bottom: 1px solid #e5e7eb;
  }

  :deep(.gallery-toolbar) {
    width: 100%;
    min-width: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    margin: 0;
  }

  // ── Actions bar ──────────────────────────────────────────────────────────────

  &__actions-bar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 16px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    gap: 10px;
  }

  &__mode-switch {
    display: flex;
    background: #e5e7eb;
    border-radius: 7px;
    padding: 2px;
    gap: 2px;
  }

  &__mode-btn {
    height: 26px;
    padding: 0 12px;
    border: none;
    border-radius: 5px;
    font: inherit;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    background: transparent;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &--active {
      background: #fff;
      color: $color-primary;
      font-weight: 600;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }

  &__actions-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__select-all {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 4px;
  }

  &__select-all-input {
    width: 16px;
    height: 16px;
    margin: 0;
    accent-color: $color-accent;
    cursor: pointer;
  }

  &__actions-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__unsaved-pill {
    font-size: 11px;
    font-weight: 700;
    color: #92400e;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 20px;
    padding: 2px 9px;
    white-space: nowrap;
  }

  // ── Body ─────────────────────────────────────────────────────────────────────

  &__body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  // ── Grid area (the only scrollable image list) ────────────────────────────────

  &__grid-area {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 14px 16px;
  }

  &__state {
    padding: 48px 16px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;

    &--error { color: #ef4444; }
  }

  // ── Skeleton loading grid ────────────────────────────────────────────────────

  &__skeleton {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
  }

  &__skel-card {
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
    background: #fff;
  }

  &__skel-image {
    aspect-ratio: 3 / 4;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 400% 100%;
    animation: skel-shimmer 1.4s ease-in-out infinite;
  }

  &__skel-info {
    padding: 5px 7px 6px;
    border-top: 1px solid #f3f4f6;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  &__skel-line {
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 400% 100%;
    animation: skel-shimmer 1.4s ease-in-out infinite;
    width: 75%;
  }

  &__skel-dots {
    display: flex;
    gap: 3px;
  }

  &__skel-dot {
    width: 15px;
    height: 15px;
    border-radius: 3px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 400% 100%;
    animation: skel-shimmer 1.4s ease-in-out infinite;
  }

  @keyframes skel-shimmer {
    0%   { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  // ── Panel (the only other scrollable element) ────────────────────────────────

  &__panel {
    width: 360px;
    flex-shrink: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #e5e7eb;
    background: #fff;
    overflow: hidden;
  }

  &__panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;
    gap: 10px;
  }

  &__panel-title {
    font-size: 13px;
    font-weight: 600;
    color: $color-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__panel-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  &__save-status {
    font-size: 12px;
    color: #6b7280;

    &--ok  { color: #16a34a; }
    &--err { color: #ef4444; }
  }

  &__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s, border-color 0.15s;

    &:hover { background: #f3f4f6; color: $color-primary; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

    // Slightly larger square for use in the top bar.
    &--toolbar {
      width: 32px;
      height: 32px;
      background: #f9fafb;
    }

    &--danger:hover {
      background: #fef2f2;
      border-color: #fecaca;
      color: #ef4444;
    }
  }

  &__panel-body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__save-row { display: flex; gap: 8px; }

  &__bulk-apply-bar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 14px;
    border-top: 1px solid #e5e7eb;
    background: #fafafa;
  }

  &__bulk-apply-hint {
    font-size: 12px;
    color: #9ca3af;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 32px;
    padding: 0 12px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #f9fafb;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover   { background: #f3f4f6; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

    &--primary {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
      font-weight: 600;

      &:hover { background: color-mix(in srgb, #{$color-accent} 94%, #000); border-color: color-mix(in srgb, #{$color-accent} 94%, #000); }
    }

    &--danger {
      background: #fff;
      border-color: #fecaca;
      color: #dc2626;
      font-weight: 600;

      &:hover:not(:disabled) { background: #fef2f2; border-color: #fca5a5; }
    }

    &--ai {
      background: color-mix(in srgb, #{$color-accent} 9%, #fff);
      border-color: color-mix(in srgb, #{$color-accent} 35%, #fff);
      color: $color-accent;
      font-weight: 600;

      svg { color: $color-accent; }

      &:hover:not(:disabled) {
        background: color-mix(in srgb, #{$color-accent} 16%, #fff);
        border-color: $color-accent;
      }
    }

  }

  &__ai-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: $color-accent;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
  }

  // ── Pagination (always visible, never scrolls) ───────────────────────────────

  &__pagination {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 16px;
    background: #fff;
    border-top: 1px solid #e5e7eb;
    flex-wrap: wrap;
  }

  &__page-nav {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-wrap: wrap;
  }

  &__page-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 30px;
    padding: 0 6px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #f9fafb;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    cursor: pointer;
    line-height: 1;
    transition: background 0.15s, border-color 0.15s;

    &:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }
    &:disabled             { opacity: 0.3; cursor: default; }

    &--active {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
      font-weight: 600;
      pointer-events: none;
    }

    &--jump { color: #6b7280; font-size: 12px; }
  }

  &__page-ellipsis {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 30px;
    color: #9ca3af;
    font-size: 12px;
  }

  &__page-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  &__page-info {
    font-size: 12px;
    color: #6b7280;
    white-space: nowrap;
  }

  &__page-size {
    height: 30px;
    padding: 0 6px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font: inherit;
    font-size: 12px;
    background: #f9fafb;
    color: $color-primary;
    cursor: pointer;

    &:focus { outline: none; border-color: $color-accent; }
  }

  // ── Modals ───────────────────────────────────────────────────────────────────

  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 20px;
    box-sizing: border-box;
  }

  &__modal {
    background: #fff;
    border-radius: $radius-md;
    width: 100%;
    max-width: 500px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

    &--export { max-width: 920px; }
  }

  &__modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;

    h3 { margin: 0; font-size: 16px; font-weight: 600; }
  }

  &__modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    font-size: 13px;

    p  { margin: 0; }
    ul { margin: 6px 0 0; padding-left: 20px; }
    li { margin-bottom: 4px; color: #374151; }
  }

  &__modal-footer { display: flex; gap: 8px; padding: 16px 20px; border-top: 1px solid #f3f4f6; }

  &__sched-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;

    label {
      font-size: 11px;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    input, select {
      height: 32px;
      padding: 0 8px;
      border: 1px solid #e5e7eb;
      border-radius: 7px;
      font: inherit;
      font-size: 13px;
      background: #fafafa;
      box-sizing: border-box;

      &:focus { outline: none; border-color: $color-accent; background: #fff; }
    }
  }

  &__check-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    cursor: pointer;
    user-select: none;

    input { accent-color: $color-accent; }
  }

  &__sched-info {
    font-size: 12px;
    color: #6b7280;
    padding: 10px 12px;
    background: #f9fafb;
    border-radius: 8px;
    margin: 0;
  }

  &__export-warn {
    padding: 12px 14px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    font-size: 12px;
    color: #92400e;
    line-height: 1.5;
  }

  &__export-note {
    padding: 10px 14px;
    background: #f0f4ff;
    border: 1px solid #c7d7fd;
    border-radius: 8px;
    font-size: 12px;
    color: #3730a3;
    line-height: 1.5;
  }

  &__export-note-sub {
    margin-left: 4px;
    font-weight: 400;
    color: #4f46e5;
  }

  &__export-error { color: #ef4444; font-weight: 600; }

  // ── Export preview table ─────────────────────────────────────────────────────

  &__export-table-wrap {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    overflow-y: auto;
    max-height: 380px;
  }

  &__export-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;

    thead tr {
      background: #f9fafb;
      position: sticky;
      top: 0;
      z-index: 1;
    }

    th {
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      white-space: nowrap;
      border-bottom: 1px solid #e5e7eb;
    }

    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: middle;
    }

    tbody tr:last-child td { border-bottom: none; }
  }

  &__export-col {
    &--check { width: 36px; text-align: center; }
    &--img   { width: 58px; }
    &--board { width: 130px; }
  }

  &__export-row {
    transition: background 0.1s;
    &:hover { background: #fafafa; }
    &--unchecked { opacity: 0.42; }
  }

  &__export-thumb {
    display: block;
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 5px;
    background: #f3f4f6;
    flex-shrink: 0;
  }

  &__export-cell {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.45;
    color: #374151;
    word-break: break-word;

    &--url {
      color: #6b7280;
      word-break: break-all;
      font-size: 11px;
    }
  }

  &__export-board-chip {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }

  &__export-board-empty { color: #d1d5db; font-size: 13px; }

  &__export-col--date { width: 150px; }

  &__export-date {
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
    color: #374151;
    white-space: nowrap;
  }

  &__export-tz {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    font-size: 12.5px;
    color: #075985;
    line-height: 1.5;

    svg { flex-shrink: 0; margin-top: 1px; color: #0284c7; }
    strong { font-weight: 700; }
  }

  &__export-tz-link {
    color: #0284c7;
    font-weight: 600;
    text-decoration: underline;

    &:hover { color: #075985; }
  }

  // ── Responsive ───────────────────────────────────────────────────────────────

  @media (max-width: 1024px) {
    &__panel { width: 320px; }
  }

  @media (max-width: 768px) {
    &__panel {
      position: fixed;
      inset: auto 0 0;
      width: 100%;
      max-height: 72vh;
      border-left: none;
      border-top: 1px solid #e5e7eb;
      border-radius: $radius-md $radius-md 0 0;
      z-index: 50;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
    }

    &__grid-area { padding: 10px 12px; }

    &__pagination { padding: 6px 12px; }

    &__page-meta { width: 100%; justify-content: space-between; }
  }
}

// ── Image lightbox ──────────────────────────────────────────────────────────────

.img-popup {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  cursor: zoom-out;

  &__img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 6px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
    cursor: default;
  }

  &__close {
    position: fixed;
    top: 16px;
    right: 16px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.25);
    background: rgba(0, 0, 0, 0.55);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: rgba(0, 0, 0, 0.8); border-color: rgba(255, 255, 255, 0.5); }
  }

  // ── Feature modals (Board Intelligence, SEO, Link Health, Duplicates) ──────

  &__modal--sm {
    max-width: 400px;
  }

  &__intelligence-loading {
    padding: 32px 24px;
    text-align: center;
    color: #6b7280;
    font-size: 13px;
  }

  &__link-summary {
    display: flex;
    gap: 12px;
    margin-bottom: 14px;
  }

  &__link-stat {
    font-size: 13px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 10px;

    &--ok { background: #ecfdf5; color: #047857; }
    &--warn { background: #fffbeb; color: #92400e; }
    &--err { background: #fef2f2; color: #dc2626; }
  }

  &__link-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 300px;
    overflow-y: auto;
  }

  &__link-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 6px;
    background: #f9fafb;

    &--redirect { background: #fffbeb; }
    &--broken { background: #fef2f2; }
  }

  &__link-url {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__link-badge {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  &__link-allgood {
    font-size: 13px;
    color: #16a34a;
    text-align: center;
    padding: 16px;
  }

  &__modal--dup {
    max-width: 580px;
    width: 100%;
  }

  &__dup-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #374151;
  }

  &__dup-summary {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  &__dup-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;

    &--ok    { background: #f0fdf4; color: #16a34a; }
    &--warn  { background: #fef2f2; color: #dc2626; }
    &--stale { background: #fffbeb; color: #92400e; }
  }

  &__dup-block {
    margin-bottom: 20px;

    &:last-child { margin-bottom: 0; }
  }

  &__dup-block-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin-bottom: 10px;
  }

  &__dup-block-count {
    margin-left: auto;
    background: #f3f4f6;
    color: #374151;
    font-size: 11px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 10px;
  }

  &__dup-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 260px;
    overflow-y: auto;
  }

  &__dup-row {
    border: 1px solid #fee2e2;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;
  }

  &__dup-sim-bar {
    height: 3px;
    background: #f3f4f6;
  }

  &__dup-sim-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;

    &--exact { background: #dc2626; }
    &--near  { background: #f97316; }
  }

  &__dup-row-body {
    padding: 10px 12px;
  }

  &__dup-titles {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: #111827;
    margin-bottom: 6px;
  }

  &__dup-title {
    flex: 1;
    min-width: 0;
    line-height: 1.4;
  }

  &__dup-arrow {
    flex-shrink: 0;
    color: #9ca3af;
    margin-top: 2px;
  }

  &__dup-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__dup-type {
    font-size: 11px;
    font-weight: 600;
    padding: 1px 7px;
    border-radius: 10px;

    &--exact { background: #fef2f2; color: #dc2626; }
    &--near  { background: #fff7ed; color: #c2410c; }
  }

  &__dup-pct {
    font-size: 11px;
    color: #6b7280;
    margin-left: auto;
    font-weight: 600;
  }

  &__dup-empty {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #16a34a;
    padding: 10px 0;
  }

  &__stale-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid #fde68a;
    border-radius: 8px;
    background: #fffbeb;
  }

  &__stale-age {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    min-width: 36px;
  }

  &__stale-days {
    font-size: 16px;
    font-weight: 700;
    color: #92400e;
    line-height: 1;
  }

  &__stale-label {
    font-size: 10px;
    color: #b45309;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__stale-body {
    flex: 1;
    min-width: 0;
  }

  &__stale-title {
    font-size: 13px;
    font-weight: 500;
    color: #111827;
    margin-bottom: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__stale-hint {
    font-size: 11px;
    color: #92400e;
    line-height: 1.4;
  }
}

// ── Board Intelligence modal (self-contained block) ───────────────────────────
.bi-modal {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.07);
  width: 100%;
  max-width: 420px;
  overflow: hidden;

  // ── Header ──────────────────────────────────────────────────────────────────
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px 16px 18px;
    border-bottom: 1px solid #f3f4f6;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  &__heading-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: #fffbeb;
    color: #f59e0b;
    flex-shrink: 0;
  }

  &__heading-text {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    letter-spacing: -0.01em;
  }

  // ── Body ────────────────────────────────────────────────────────────────────
  &__body {
    padding: 20px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  // Loading
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 24px 0;
    font-size: 13px;
    color: #6b7280;
  }

  &__spinner {
    animation: bi-spin 0.9s linear infinite;
    color: #9ca3af;
    flex-shrink: 0;
  }

  @keyframes bi-spin {
    to { transform: rotate(360deg); }
  }

  // Alert banner (new board)
  &__alert {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 9px;
    font-size: 12px;
    line-height: 1.55;
    color: #b91c1c;

    svg { color: #ef4444; flex-shrink: 0; margin-top: 1px; }

    strong {
      display: block;
      font-size: 12.5px;
      font-weight: 700;
      color: #991b1b;
      margin-bottom: 2px;
    }
  }

  // Primary suggestion card
  &__card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px 16px;
  }

  &__card-eyebrow {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #9ca3af;
    margin-bottom: 8px;
  }

  &__card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  &__board-name {
    font-size: 17px;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
    letter-spacing: -0.02em;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badge {
    font-size: 11.5px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    flex-shrink: 0;
    letter-spacing: 0.01em;

    &--good { background: #dcfce7; color: #15803d; }
    &--ok   { background: #fef9c3; color: #92400e; }
    &--poor { background: #fee2e2; color: #b91c1c; }
  }

  &__reason {
    font-size: 12.5px;
    color: #6b7280;
    line-height: 1.55;
    margin: 0;
  }

  // Alternative row
  &__alt {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 12.5px;
  }

  &__alt-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #9ca3af;
    flex-shrink: 0;
  }

  &__alt-name {
    font-weight: 600;
    color: #374151;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__alt-score {
    font-size: 11px;
    font-weight: 600;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  &__alt-btn {
    font-size: 11.5px;
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
    border: none;
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;

    &:hover { background: #e5e7eb; color: #111827; }
  }

  // Footer buttons
  &__footer {
    display: flex;
    gap: 8px;
    padding-top: 2px;
  }
}
</style>
