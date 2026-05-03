<template>
  <div class="meta-page">

    <!-- ── Toolbar ─────────────────────────────────────────────────────────── -->
    <header class="meta-page__toolbar">
      <MetadataImageGalleryToolbar
        :filters="filters"
        :sort-field="sortField"
        :sort-direction="sortDirection"
        :has-filters="hasFilters"
        :selected-count="selectedCount"
        :boards="boards"
        @update:search="filters.search = $event"
        @update:sort-field="setSort"
        @toggle-sort-dir="setSort(sortField)"
        @update:filter="onUpdateFilter"
        @reset-filters="resetFilters"
        @clear-selection="clearSelection"
        @time-manager="showTimeManager = true"
        @pinterest-schedule="openPinterestScheduler"
        @export-csv="openExport"
      />
      <button class="meta-page__signout" title="Sign out" @click="handleSignOut">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 3h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M9 14l5-4-5-4M14 10H3" />
        </svg>
      </button>
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
        <span v-if="totalUnsavedCount > 0" class="meta-page__unsaved-pill">
          {{ totalUnsavedCount }} unsaved
        </span>
      </div>

      <div class="meta-page__actions-right">
        <button class="meta-page__btn" :disabled="pending" @click="handleRefresh">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
            <path d="M4 4a8 8 0 0 1 12 0M4 16a8 8 0 0 0 12 0" />
            <polyline points="1 4 4 4 4 7" />
            <polyline points="19 16 16 16 16 13" />
          </svg>
          Refresh
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
              <div class="meta-page__skel-line" />
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
          :images="filteredImages"
          :selected-ids="selectedIds"
          :active-id="activeId"
          :focused-id="focusedId"
          :unsaved-ids="unsavedIds"
          :panel-open="panelOpen"
          :is-pinterest-complete="isPinterestComplete"
          :is-adobe-stock-complete="isAdobeStockComplete"
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
              @update="onDraftUpdate"
            />
            <div class="meta-page__save-row">
              <button
                class="meta-page__btn meta-page__btn--primary"
                :disabled="!isDirty || saving"
                @click="handleSaveSingle"
              >Save changes</button>
              <button class="meta-page__btn" :disabled="!isDirty" @click="discardDraft">Discard</button>
            </div>
          </template>

          <template v-else-if="selectedCount > 1">
            <MetadataBulkEditForm :spec="bulkSpec" :count="selectedCount" />
            <div class="meta-page__save-row">
              <button
                class="meta-page__btn meta-page__btn--primary"
                :disabled="activeFieldCount === 0 || saving"
                @click="handleApplyBulk"
              >Apply to {{ selectedCount }} images</button>
            </div>
          </template>
        </div>

        <div class="meta-page__panel-footer">
          <MetadataAiGenerationPanel
            :options="aiOptions"
            :progress="aiProgress"
            :image-count="aiTargetImages.length"
            :board-count="boards.length"
            @generate="handleGenerate"
            @cancel="cancelAi"
            @reset-progress="resetAiProgress"
            @manage-boards="showBoardsManager = true"
          />
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

    <!-- ── CSV Export modal ───────────────────────────────────────────────── -->
    <div v-if="showExport" class="meta-page__overlay" @click.self="showExport = false">
      <div class="meta-page__modal">
        <div class="meta-page__modal-header">
          <h3>Export to Pinterest CSV</h3>
          <button class="meta-page__icon-btn" @click="showExport = false">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
          </button>
        </div>
        <div class="meta-page__modal-body">
          <p>Exporting <strong>{{ csvExportImages.length }}</strong> image(s).</p>
          <div v-if="csvValidation.invalid.length" class="meta-page__export-warn">
            <strong>{{ csvValidation.invalid.length }} incomplete:</strong>
            <ul>
              <li v-for="iv in csvValidation.invalid.slice(0, 8)" :key="iv.image.id">
                {{ iv.image.filename }} — {{ iv.missing.join(', ') }}
              </li>
              <li v-if="csvValidation.invalid.length > 8">… +{{ csvValidation.invalid.length - 8 }} more</li>
            </ul>
          </div>
          <p v-if="!csvValidation.valid.length" class="meta-page__export-error">No complete images to export.</p>
        </div>
        <div class="meta-page__modal-footer">
          <button class="meta-page__btn meta-page__btn--primary" :disabled="!csvValidation.valid.length" @click="handleDownloadCsv">
            Download {{ csvValidation.valid.length }} as CSV
          </button>
          <button class="meta-page__btn" @click="showExport = false">Cancel</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
// ── Data ──────────────────────────────────────────────────────────────────────
const {
  images, pending, error,
  saving, saveError,
  currentPage, totalCount, totalPages, pageSize,
  loadImages, setPageSize, saveImage, saveImages, invalidateCache,
} = useMetadataImages()

onMounted(() => { loadImages(1); loadBoards() })

// ── Auth ──────────────────────────────────────────────────────────────────────
const supabase = useSupabaseClient()

async function handleSignOut() {
  await supabase.auth.signOut()
  navigateTo('/login')
}

// ── Pinterest boards ──────────────────────────────────────────────────────────
const { boards, loading: boardsLoading, loadBoards, addBoard, deleteBoard } = usePinterestBoards()
const showBoardsManager = ref(false)

async function handleAddBoard(name) {
  await addBoard(name)
}

async function handleDeleteBoard(id) {
  await deleteBoard(id)
}

// ── Selection ─────────────────────────────────────────────────────────────────
const { selectedIds, selectedCount, toggle, selectImages, clearSelection } = useImageSelection()

// ── Filters / Sort ────────────────────────────────────────────────────────────
const {
  filters, sortField, sortDirection, hasFilters,
  filteredImages, isPinterestComplete, isAdobeStockComplete,
  resetFilters, setSort,
} = useGalleryFilters(images, selectedIds)

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
  filteredImages.value.length > 0 && filteredImages.value.every(img => selectedIds.value.has(img.id))
)

watchEffect(() => {
  if (!selectAllCheckbox.value) return
  const some = filteredImages.value.some(img => selectedIds.value.has(img.id))
  selectAllCheckbox.value.indeterminate = some && !allVisibleSelected.value
})

function toggleSelectAll() {
  if (allVisibleSelected.value) {
    clearSelection()
  } else {
    selectImages(filteredImages.value)
  }
}

// ── Selection mode + card click ───────────────────────────────────────────────
const selectionMode = ref('single')
const lastClickedIndex = ref(-1)
const focusedIndex = ref(-1)
const focusedId = computed(() => filteredImages.value[focusedIndex.value]?.id ?? null)

function handleCardClick(id, index, event) {
  focusedIndex.value = index

  if (event.ctrlKey && lastClickedIndex.value >= 0) {
    const start = Math.min(lastClickedIndex.value, index)
    const end = Math.max(lastClickedIndex.value, index)
    selectImages(filteredImages.value.slice(start, end + 1))
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
  const tag = document.activeElement?.tagName?.toLowerCase()
  if (['input', 'textarea', 'select'].includes(tag)) return

  const len = filteredImages.value.length
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
    const img = filteredImages.value[focusedIndex.value]
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

const aiTargetImages = computed(() => {
  if (selectedCount.value > 0) return images.value.filter(i => selectedIds.value.has(i.id))
  if (activeId.value) return images.value.filter(i => i.id === activeId.value)
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
    async (img, opts) => {
      return await $fetch('/api/generate-metadata', {
        method: 'POST',
        body: {
          filename: img.filename,
          prompt: img.prompt,
          colors: img.colors,
          additionalContext: opts.additionalContext,
          options: opts,
          boards: opts.generateFor.pinterestBoard ? boards.value.map(b => b.name) : [],
        },
      })
    },
  )
}

// ── Time Manager ─────────────────────────────────────────────────────────────
const showTimeManager = ref(false)

// ── Pinterest Bulk Scheduler ───────────────────────────────────────────────────
const showPinterestScheduler = ref(false)
const pinterestScheduleInfo = ref(null)
const pinterestScheduleInfoLoading = ref(false)

const pinterestSchedTargetImages = computed(() =>
  selectedCount.value > 0
    ? images.value.filter(i => selectedIds.value.has(i.id))
    : filteredImages.value
)

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

const csvExportImages = computed(() =>
  selectedCount.value > 0
    ? images.value.filter(i => selectedIds.value.has(i.id))
    : filteredImages.value
)

const csvValidation = computed(() => validate(csvExportImages.value))

function openExport() { showExport.value = true }

function handleDownloadCsv() {
  const filename = downloadCsv(csvValidation.value.valid)
  showExport.value = false
  $fetch('/api/pinterest/csv-exports', {
    method: 'POST',
    body: {
      filename,
      row_count: csvValidation.value.valid.length,
      image_ids: csvValidation.value.valid.map(img => img.id),
    },
  }).catch(() => {})
}

// ── Pagination ────────────────────────────────────────────────────────────────
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
  await loadImages(currentPage.value)
}

async function goToPage(page) {
  page = Math.max(1, Math.min(totalPages.value, page))
  if (page === currentPage.value) return
  clearSelection()
  activeId.value = null
  lastClickedIndex.value = -1
  focusedIndex.value = -1
  await loadImages(page)
  // Grid area scrolls to top instead of window
  document.querySelector('.meta-page__grid-area')?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<style scoped lang="scss">
.meta-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // ── Toolbar ─────────────────────────────────────────────────────────────────

  &__toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 20px;
    background: $color-bg;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  :deep(.gallery-toolbar) {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    margin: 0;
  }

  &__signout {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-top: 2px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    color: #9ca3af;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;

    &:hover {
      background: #fef2f2;
      border-color: #fecaca;
      color: #ef4444;
    }
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
    transition: background 0.15s;

    &:hover { background: #f3f4f6; color: $color-primary; }
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

  &__panel-footer {
    flex-shrink: 0;
    border-top: 1px solid #e5e7eb;
    overflow-y: auto;
    max-height: 55vh;
  }

  &__save-row { display: flex; gap: 8px; }

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

  &__export-error { color: #ef4444; font-weight: 600; }

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
</style>
