<template>
  <div class="csv-page">

    <!-- ── Header ────────────────────────────────────────────────────────── -->
    <header class="csv-page__header">
      <NuxtLink to="/metadata" class="csv-page__back">
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
        Metadata
      </NuxtLink>
      <h1 class="csv-page__title">CSV Export History</h1>
      <span v-if="!loading && exports.length" class="csv-page__count-badge">
        {{ exports.length }} export{{ exports.length !== 1 ? 's' : '' }}
      </span>
    </header>

    <!-- ── States ────────────────────────────────────────────────────────── -->
    <div v-if="loading" class="csv-page__state">
      <svg class="csv-page__spinner" width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="#e5e7eb" stroke-width="2.5" />
        <path d="M11 2a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
      </svg>
      Loading exports…
    </div>

    <div v-else-if="error" class="csv-page__state csv-page__state--error">{{ error }}</div>

    <div v-else-if="exports.length === 0" class="csv-page__state csv-page__state--empty">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="8" y="4" width="24" height="32" rx="3" />
        <path d="M14 14h12M14 20h12M14 26h8" stroke-linecap="round" />
      </svg>
      No CSV exports yet. Export from the metadata page to see history here.
    </div>

    <!-- ── Export list ────────────────────────────────────────────────────── -->
    <div v-else class="csv-page__list">
      <div
        v-for="exp in exports"
        :key="exp.id"
        class="csv-item"
        :class="{ 'csv-item--open': expandedId === exp.id }"
      >
        <!-- Row -->
        <div class="csv-item__row">
          <div class="csv-item__icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 2h9l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
              <path d="M13 2v4h4" />
            </svg>
          </div>

          <div class="csv-item__info">
            <span class="csv-item__filename">{{ exp.filename }}</span>
            <span class="csv-item__meta">{{ formatDate(exp.created_at) }}</span>
          </div>

          <span class="csv-item__count">{{ exp.row_count }} pin{{ exp.row_count !== 1 ? 's' : '' }}</span>

          <div class="csv-item__actions">
            <button
              class="csv-item__btn csv-item__btn--exported"
              :disabled="settingIds.has(exp.id)"
              @click="handleSetExported(exp)"
            >
              <svg v-if="settingIds.has(exp.id)" class="csv-item__btn-spinner" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="2" stroke-dasharray="20" stroke-dashoffset="10" />
              </svg>
              <svg v-else width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M2 8l4 4 8-8" />
              </svg>
              Set Exported
            </button>

            <button
              class="csv-item__btn"
              :class="{ 'csv-item__btn--active': expandedId === exp.id }"
              @click="toggleImages(exp.id)"
            >
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                :style="{ transform: expandedId === exp.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }"
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
              {{ expandedId === exp.id ? 'Hide images' : `Show ${exp.row_count} images` }}
            </button>
          </div>
        </div>

        <!-- Expanded image grid -->
        <div v-if="expandedId === exp.id" class="csv-item__body">
          <div v-if="imageState(exp.id).loading" class="csv-item__img-state">
            <svg class="csv-page__spinner" width="18" height="18" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="#e5e7eb" stroke-width="2.5" />
              <path d="M11 2a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            </svg>
            Loading images…
          </div>
          <div v-else-if="imageState(exp.id).error" class="csv-item__img-state csv-item__img-state--error">
            {{ imageState(exp.id).error }}
          </div>
          <div v-else-if="imageState(exp.id).data.length === 0" class="csv-item__img-state">
            No images found.
          </div>
          <MetadataImageGrid
            v-else
            :images="imageState(exp.id).data"
            :selected-ids="EMPTY_SET"
            :active-id="null"
            :focused-id="null"
            :unsaved-ids="EMPTY_SET"
            :panel-open="false"
            :is-pinterest-complete="isPinterestComplete"
            :is-adobe-stock-complete="isAdobeStockComplete"
            @card-click="() => {}"
            @toggle-select="() => {}"
          />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
// ── Helpers ───────────────────────────────────────────────────────────────────
const EMPTY_SET = new Set()

function isPinterestComplete(img) {
  return !!(img.pinterest.title && img.pinterest.description && img.pinterest.board && img.pinterest.link)
}
function isAdobeStockComplete(img) {
  return !!(img.adobeStock.title && img.adobeStock.description && img.adobeStock.keywords?.length)
}

// ── Row mapping (matches useMetadataImages.js) ────────────────────────────────
function mapRow(row) {
  const colors = [row.primary_color, row.secondary_color, row.tertiary_color]
    .filter(Boolean)
    .map(c => ({ hex: c.hex, label: c.name }))

  const p = (Array.isArray(row.pinterest_image) ? row.pinterest_image[0] : row.pinterest_image) ?? {}
  const a = (Array.isArray(row.adobe_image) ? row.adobe_image[0] : row.adobe_image) ?? {}

  return {
    id: row.id,
    filename: row.filename,
    mediaUrl: row.public_url,
    thumbnailUrl: row.thumbnail_url ?? null,
    prompt: row.prompt ?? null,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    colors,
    pinterest: {
      pinId: p.pin_id ?? null,
      title: p.title ?? '',
      description: p.description ?? '',
      board: p.board ?? '',
      link: p.link ?? '',
      publishDate: p.publish_date ?? null,
      exportedAt: p.exported_at ?? null,
      publishedAt: p.published_at ?? null,
      status: p.status ?? 'draft',
    },
    adobeStock: {
      adobeId: a.adobe_id ?? null,
      title: a.title ?? '',
      description: a.description ?? '',
      keywords: Array.isArray(a.keywords) ? a.keywords : [],
      publishDate: a.publish_date ?? null,
      status: a.status ?? 'draft',
    },
  }
}

// ── Export list ───────────────────────────────────────────────────────────────
const exports = ref([])
const loading = ref(true)
const error   = ref(null)

async function loadExports() {
  loading.value = true
  error.value   = null
  try {
    exports.value = await $fetch('/api/pinterest/csv-exports')
  } catch (e) {
    error.value = e.data?.statusMessage ?? e.message ?? 'Failed to load'
  } finally {
    loading.value = false
  }
}

onMounted(loadExports)

// ── Date formatting ───────────────────────────────────────────────────────────
function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    + ' at '
    + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ── Image expand / lazy load ──────────────────────────────────────────────────
const expandedId = ref(null)
const imagesCache = reactive({})

function imageState(id) {
  return imagesCache[id] ?? { loading: false, error: null, data: [] }
}

async function toggleImages(id) {
  if (expandedId.value === id) {
    expandedId.value = null
    return
  }
  expandedId.value = id
  if (imagesCache[id]) return  // already loaded

  imagesCache[id] = { loading: true, error: null, data: [] }
  try {
    const { data } = await $fetch(`/api/pinterest/csv-exports/${id}/images`)
    imagesCache[id] = { loading: false, error: null, data: (data ?? []).map(mapRow) }
  } catch (e) {
    imagesCache[id] = { loading: false, error: e.data?.statusMessage ?? e.message ?? 'Failed to load images', data: [] }
  }
}

// ── Set exported action ───────────────────────────────────────────────────────
const settingIds = reactive(new Set())
const { invalidateCache } = useMetadataImages()

async function handleSetExported(exp) {
  const ok = confirm(
    `Mark all ${exp.row_count} image${exp.row_count !== 1 ? 's' : ''} from "${exp.filename}" as exported?\n\nThis sets the Pinterest status to "exported" and records the exported_at timestamp for each pin.`
  )
  if (!ok) return

  settingIds.add(exp.id)
  try {
    await $fetch(`/api/pinterest/csv-exports/${exp.id}/set-exported`, { method: 'POST' })

    // Update locally in the images cache so the badges refresh immediately
    const state = imagesCache[exp.id]
    if (state?.data?.length) {
      const now = new Date().toISOString()
      for (const img of state.data) {
        img.pinterest.status     = 'exported'
        img.pinterest.exportedAt = now
      }
    }

    // Bust the metadata page cache so navigating back shows fresh data
    invalidateCache()
  } catch (e) {
    alert(`Failed to set exported: ${e.data?.statusMessage ?? e.message}`)
  } finally {
    settingIds.delete(exp.id)
  }
}
</script>

<style scoped lang="scss">
.csv-page {
  min-height: 100vh;
  background: $color-bg;

  // ── Header ──────────────────────────────────────────────────────────────────

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 24px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    position: sticky;
    top: 0;
    z-index: 10;
    flex-wrap: wrap;
  }

  &__back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    text-decoration: none;
    padding: 5px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #f9fafb;
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;

    &:hover { background: #f3f4f6; color: $color-primary; }
  }

  &__title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: $color-primary;
    flex: 1;
  }

  &__count-badge {
    font-size: 12px;
    font-weight: 700;
    color: #6b7280;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 2px 9px;
    flex-shrink: 0;
  }

  // ── Loading / empty states ───────────────────────────────────────────────────

  &__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    min-height: 300px;
    color: #6b7280;
    font-size: 14px;
    text-align: center;
    padding: 24px;

    svg { color: #d1d5db; }

    &--error { color: #ef4444; }
    &--empty { gap: 12px; }
  }

  &__spinner {
    color: $color-accent;
    animation: csv-spin 0.8s linear infinite;
  }

  @keyframes csv-spin { to { transform: rotate(360deg); } }

  // ── List ──────────────────────────────────────────────────────────────────────

  &__list {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 1400px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    &__list { padding: 14px 14px; }
    &__header { padding: 12px 14px; }
  }
}

// ── Export item ──────────────────────────────────────────────────────────────────

.csv-item {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: $radius-md;
  overflow: hidden;
  transition: box-shadow 0.15s;

  &:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06); }

  &--open {
    border-color: color-mix(in srgb, #{$color-accent} 35%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, #{$color-accent} 10%, transparent);
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    flex-wrap: wrap;
  }

  &__icon {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    background: #f0f4ff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4f46e5;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 200px;
  }

  &__filename {
    font-size: 14px;
    font-weight: 600;
    color: $color-primary;
    word-break: break-all;
    line-height: 1.3;
  }

  &__meta {
    font-size: 12px;
    color: #9ca3af;
  }

  &__count {
    font-size: 13px;
    font-weight: 700;
    color: #374151;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    padding: 3px 11px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
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
    white-space: nowrap;
    transition: background 0.15s, border-color 0.15s;

    &:hover   { background: #f3f4f6; border-color: #d1d5db; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &--exported {
      background: #f5f3ff;
      border-color: #ddd6fe;
      color: #6d28d9;

      &:hover:not(:disabled) { background: #ede9fe; border-color: #c4b5fd; }
    }

    &--active {
      background: color-mix(in srgb, #{$color-accent} 10%, #fff);
      border-color: color-mix(in srgb, #{$color-accent} 40%, transparent);
      color: $color-accent;
      font-weight: 600;
    }

    &-spinner {
      animation: csv-spin 0.7s linear infinite;
    }
  }

  // ── Expanded images ────────────────────────────────────────────────────────

  &__body {
    border-top: 1px solid #f3f4f6;
    padding: 14px 16px;
    background: #fafafa;
  }

  &__img-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 40px 0;
    font-size: 14px;
    color: #6b7280;

    &--error { color: #ef4444; }
  }
}
</style>
