<template>
  <div class="inv-modal">
    <div class="inv-modal__header">
      <div class="inv-modal__title-row">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round">
          <path d="M10 1l9 17H1L10 1z" />
          <path d="M10 8v4M10 15h.01" />
        </svg>
        <h3>Invalid images <span class="inv-modal__count">({{ images.length }})</span></h3>
      </div>
      <div class="inv-modal__header-actions">
        <button
          class="inv-modal__btn inv-modal__btn--ghost"
          :disabled="fixableCount === 0 || bulkBusy"
          :title="fixableCount === 0 ? 'No URLs have extractable prefixes' : `Strip the prefix from ${fixableCount} URL(s)`"
          @click="fixAllPrefixedUrls"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 8l3 3 7-7" />
          </svg>
          Fix prefixed URLs<span v-if="fixableCount"> ({{ fixableCount }})</span>
        </button>
        <button
          class="inv-modal__btn inv-modal__btn--primary"
          :disabled="savableCount === 0 || bulkBusy"
          :title="savableCount === 0 ? 'No rows have a saveable draft URL' : `Save ${savableCount} valid URL(s)`"
          @click="saveAllValid"
        >
          <template v-if="bulkBusy">Saving {{ bulkSavedCount }}/{{ bulkTotal }}…</template>
          <template v-else>Save all valid<span v-if="savableCount"> ({{ savableCount }})</span></template>
        </button>
        <button class="inv-modal__close-btn" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M1 1l12 12M13 1L1 13" />
          </svg>
        </button>
      </div>
    </div>

    <div class="inv-modal__body">
      <p v-if="images.length === 0" class="inv-modal__empty">
        No invalid images. Every image has a well formed URL.
      </p>

      <div v-else class="inv-modal__intro">
        These images have a missing or malformed URL and are hidden from the main grid.
        Fix the URL or delete them so they no longer block exports.
      </div>

      <div
        v-for="row in rows"
        :key="row.image.id"
        class="inv-modal__row"
        :class="{ 'inv-modal__row--saved': row.savedAt }"
      >
        <div class="inv-modal__preview">
          <img
            v-if="row.previewOk && row.draftUrl"
            :src="row.draftUrl"
            :alt="row.image.filename"
            @error="row.previewOk = false"
            @load="row.previewOk = true"
          />
          <div v-else class="inv-modal__preview-placeholder">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        </div>

        <div class="inv-modal__row-main">
          <div class="inv-modal__row-head">
            <span class="inv-modal__filename" :title="row.image.filename">{{ row.image.filename }}</span>
            <span class="inv-modal__id">{{ row.image.id }}</span>
          </div>

          <label class="inv-modal__field-label">Image URL</label>
          <div class="inv-modal__url-field">
            <div class="inv-modal__url-input-row">
              <input
                v-model="row.draftUrl"
                type="url"
                class="inv-modal__url-input"
                :class="{ 'inv-modal__url-input--bad': row.draftUrl && !urlLooksValid(row.draftUrl) }"
                placeholder="https://example.com/image.jpg"
                @input="row.savedAt = null; row.previewOk = true"
              />
              <button
                v-if="canFixPrefix(row.draftUrl)"
                type="button"
                class="inv-modal__inline-btn"
                title="Strip junk before http(s)://"
                @click="fixPrefixedUrl(row)"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 8l3 3 7-7" />
                </svg>
                Fix
              </button>
            </div>
            <span
              v-if="row.draftUrl && !urlLooksValid(row.draftUrl)"
              class="inv-modal__url-hint inv-modal__url-hint--bad"
            >Not a valid http(s) URL</span>
            <span
              v-else-if="row.draftUrl && urlLooksValid(row.draftUrl) && !row.previewOk"
              class="inv-modal__url-hint inv-modal__url-hint--warn"
            >URL parses, but the image failed to load.</span>
          </div>

          <div class="inv-modal__row-actions">
            <button
              class="inv-modal__btn inv-modal__btn--primary"
              :disabled="!urlLooksValid(row.draftUrl) || row.busy || row.draftUrl === row.image.mediaUrl"
              @click="handleSave(row)"
            >
              <template v-if="row.busy && row.busyAction === 'save'">Saving…</template>
              <template v-else>Save URL</template>
            </button>
            <button
              class="inv-modal__btn inv-modal__btn--danger"
              :disabled="row.busy"
              @click="handleDelete(row)"
            >
              <template v-if="row.busy && row.busyAction === 'delete'">Deleting…</template>
              <template v-else>Delete image</template>
            </button>
            <span v-if="row.error" class="inv-modal__row-error">{{ row.error }}</span>
            <span v-else-if="row.savedAt" class="inv-modal__row-ok">Saved</span>
          </div>
        </div>
      </div>
    </div>

    <div class="inv-modal__footer">
      <span class="inv-modal__footer-info">
        {{ images.length }} invalid · {{ savedCount }} fixed · {{ deletedCount }} deleted this session
      </span>
      <button class="inv-modal__btn" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script setup>
import { isWellFormedImageUrl, extractUrlFromString } from '~/composables/useImageUrlValidation.js'

const props = defineProps({
  images: { type: Array, required: true },
  onSaveUrl: { type: Function, required: true },
  onDeleteImage: { type: Function, required: true },
})

const emit = defineEmits(['close'])

// Per-row local UI state (draft URL + save/delete progress). Indexed by image id
// so it survives the prop changing as images get fixed or removed upstream.
const rowState = reactive(new Map())

const rows = computed(() => props.images.map(img => {
  let state = rowState.get(img.id)
  if (!state) {
    state = reactive({
      image: img,
      draftUrl: img.mediaUrl ?? '',
      busy: false,
      busyAction: null,
      error: null,
      savedAt: null,
      previewOk: true,
    })
    rowState.set(img.id, state)
  } else {
    state.image = img
  }
  return state
}))

const savedCount = ref(0)
const deletedCount = ref(0)

// Bulk-save progress state
const bulkBusy = ref(false)
const bulkSavedCount = ref(0)
const bulkTotal = ref(0)

function urlLooksValid(url) {
  return isWellFormedImageUrl(url)
}

// True when the draft contains an extractable http(s) URL but isn't itself a
// valid URL — i.e. there's junk to strip. If the draft is already valid, the
// fix button is hidden.
function canFixPrefix(draft) {
  if (!draft) return false
  if (isWellFormedImageUrl(draft)) return false
  const extracted = extractUrlFromString(draft)
  return !!extracted && extracted !== draft && isWellFormedImageUrl(extracted)
}

function fixPrefixedUrl(row) {
  const extracted = extractUrlFromString(row.draftUrl)
  if (extracted) {
    row.draftUrl = extracted
    row.savedAt = null
    row.previewOk = true
  }
}

const fixableCount = computed(() => rows.value.filter(r => canFixPrefix(r.draftUrl)).length)

const savableCount = computed(() =>
  rows.value.filter(r =>
    !r.busy
    && isWellFormedImageUrl(r.draftUrl)
    && r.draftUrl.trim() !== (r.image.mediaUrl ?? '')
  ).length
)

function fixAllPrefixedUrls() {
  for (const row of rows.value) {
    if (canFixPrefix(row.draftUrl)) fixPrefixedUrl(row)
  }
}

async function saveAllValid() {
  const targets = rows.value.filter(r =>
    !r.busy
    && isWellFormedImageUrl(r.draftUrl)
    && r.draftUrl.trim() !== (r.image.mediaUrl ?? '')
  )
  if (targets.length === 0) return

  bulkBusy.value = true
  bulkSavedCount.value = 0
  bulkTotal.value = targets.length

  // Sequential to keep per-row busy/error indicators meaningful and avoid
  // hammering the API with many simultaneous writes.
  for (const row of targets) {
    await handleSave(row)
    bulkSavedCount.value++
  }

  bulkBusy.value = false
}

async function handleSave(row) {
  row.busy = true
  row.busyAction = 'save'
  row.error = null
  try {
    await props.onSaveUrl({ id: row.image.id, mediaUrl: row.draftUrl.trim() })
    row.savedAt = new Date()
    savedCount.value++
  } catch (e) {
    row.error = e?.data?.statusMessage ?? e?.message ?? 'Save failed'
  } finally {
    row.busy = false
    row.busyAction = null
  }
}

async function handleDelete(row) {
  if (!confirm(`Delete image "${row.image.filename}"? This cannot be undone.`)) return
  row.busy = true
  row.busyAction = 'delete'
  row.error = null
  try {
    await props.onDeleteImage(row.image.id)
    rowState.delete(row.image.id)
    deletedCount.value++
  } catch (e) {
    row.error = e?.data?.statusMessage ?? e?.message ?? 'Delete failed'
  } finally {
    row.busy = false
    row.busyAction = null
  }
}
</script>

<style scoped lang="scss">
.inv-modal {
  display: flex;
  flex-direction: column;
  max-height: 88vh;
  width: 100%;
  max-width: 880px;
  background: #fff;
  border-radius: $radius-md;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);

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

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: $color-primary;
    }
  }

  &__count {
    color: #6b7280;
    font-weight: 500;
    margin-left: 4px;
  }

  &__header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

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

    &:hover { background: #f3f4f6; color: $color-primary; }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__empty {
    margin: 0;
    text-align: center;
    padding: 36px 0;
    color: #6b7280;
    font-size: 14px;
  }

  &__intro {
    padding: 10px 14px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    font-size: 12px;
    color: #78350f;
    line-height: 1.5;
  }

  &__row {
    display: flex;
    gap: 14px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fafafa;
    align-items: flex-start;

    &--saved {
      border-color: #86efac;
      background: #f0fdf4;
    }
  }

  &__preview {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #fff;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__preview-placeholder {
    color: #d1d5db;
  }

  &__row-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__row-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__filename {
    font-size: 13px;
    font-weight: 600;
    color: $color-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__id {
    font-family: monospace;
    font-size: 10px;
    color: #9ca3af;
    flex-shrink: 0;
  }

  &__field-label {
    font-size: 10px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__url-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__url-input {
    width: 100%;
    height: 32px;
    padding: 0 10px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font: inherit;
    font-size: 12px;
    background: #fff;
    color: $color-primary;
    box-sizing: border-box;

    &:focus { outline: none; border-color: $color-accent; }
    &--bad { border-color: #fca5a5; background: #fef2f2; }
  }

  &__url-hint {
    font-size: 11px;

    &--bad { color: #dc2626; }
    &--warn { color: #d97706; }
  }

  &__row-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    flex-wrap: wrap;
  }

  &__row-error {
    font-size: 12px;
    color: #dc2626;
  }

  &__row-ok {
    font-size: 12px;
    color: #16a34a;
    font-weight: 600;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    justify-content: center;
    height: 30px;
    padding: 0 12px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    background: #fff;
    font: inherit;
    font-size: 12px;
    color: $color-primary;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: #f3f4f6; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

    &--primary {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
      font-weight: 600;

      &:hover:not(:disabled) {
        background: color-mix(in srgb, #{$color-accent} 94%, #000);
        border-color: color-mix(in srgb, #{$color-accent} 94%, #000);
      }
    }

    &--ghost {
      background: #fffbeb;
      border-color: #fcd34d;
      color: #92400e;
      font-weight: 600;

      svg { stroke: #d97706; }
      &:hover:not(:disabled) { background: #fef3c7; border-color: #fbbf24; }
    }

    &--danger {
      color: #dc2626;
      border-color: #fecaca;

      &:hover:not(:disabled) {
        background: #fef2f2;
        border-color: #fca5a5;
      }
    }
  }

  &__url-input-row {
    display: flex;
    gap: 6px;
    align-items: stretch;
  }

  &__inline-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 32px;
    padding: 0 9px;
    border: 1px solid #fcd34d;
    border-radius: 7px;
    background: #fffbeb;
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    color: #92400e;
    cursor: pointer;
    white-space: nowrap;
    flex-shrink: 0;

    svg { stroke: #d97706; }
    &:hover { background: #fef3c7; border-color: #fbbf24; }
  }

  &__footer {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-top: 1px solid #f3f4f6;
    flex-shrink: 0;
  }

  &__footer-info {
    font-size: 12px;
    color: #6b7280;
  }
}
</style>
