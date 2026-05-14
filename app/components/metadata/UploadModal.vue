<template>
  <div class="upload-modal" @drop.prevent="onDrop" @dragover.prevent="dragOver = true" @dragleave.prevent="dragOver = false">
    <div class="upload-modal__header">
      <div class="upload-modal__title-row">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 13v3a1 1 0 001 1h12a1 1 0 001-1v-3" />
          <path d="M10 3v10M6 7l4-4 4 4" />
        </svg>
        <h3>Upload images</h3>
      </div>
      <button class="upload-modal__close-btn" @click="$emit('close')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </div>

    <div class="upload-modal__body">
      <div
        class="upload-modal__dropzone"
        :class="{ 'upload-modal__dropzone--active': dragOver }"
        @click="triggerFileInput"
      >
        <input
          ref="fileInputEl"
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          class="upload-modal__file-input"
          @change="onFileInput"
        />
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5M12 3v13M7 8l5-5" />
        </svg>
        <p class="upload-modal__dropzone-title">
          {{ dragOver ? 'Drop to add files' : 'Drag and drop images here' }}
        </p>
        <p class="upload-modal__dropzone-hint">
          or click to select · PNG, JPG, WebP, GIF, AVIF · max 20 MB each
        </p>
      </div>

      <div v-if="items.length" class="upload-modal__list">
        <div class="upload-modal__list-head">
          <span>{{ items.length }} file{{ items.length !== 1 ? 's' : '' }}</span>
          <span>{{ doneCount }} done · {{ errorCount }} failed</span>
        </div>
        <div
          v-for="item in items"
          :key="item.id"
          class="upload-modal__item"
          :class="`upload-modal__item--${item.status}`"
        >
          <div class="upload-modal__item-name" :title="item.file.name">{{ item.file.name }}</div>
          <span class="upload-modal__item-size">{{ formatBytes(item.file.size) }}</span>
          <span class="upload-modal__item-status">
            <svg v-if="item.status === 'uploading'" class="upload-modal__spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="2" stroke-dasharray="20" stroke-dashoffset="10" />
            </svg>
            <svg v-else-if="item.status === 'done'" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 8l4 4 8-8" />
            </svg>
            <svg v-else-if="item.status === 'error'" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
            {{ statusLabel(item) }}
          </span>
          <button v-if="item.status === 'pending'" class="upload-modal__remove" title="Remove" @click="removeItem(item.id)">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="upload-modal__footer">
      <span v-if="isUploading" class="upload-modal__footer-info">
        Uploading {{ uploadingIndex }}/{{ pendingCount }}…
      </span>
      <span v-else-if="items.length === 0" class="upload-modal__footer-info">
        Add at least one image to start.
      </span>
      <span v-else class="upload-modal__footer-info">
        Ready to upload {{ pendingCount }} file{{ pendingCount !== 1 ? 's' : '' }}.
      </span>

      <div class="upload-modal__footer-actions">
        <button
          class="upload-modal__btn upload-modal__btn--primary"
          :disabled="pendingCount === 0 || isUploading"
          @click="startUpload"
        >
          {{ isUploading ? 'Uploading…' : `Upload ${pendingCount || ''}` }}
        </button>
        <button class="upload-modal__btn" @click="$emit('close')">
          {{ doneCount > 0 ? 'Done' : 'Cancel' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  // Optional: files seeded from a page-level drop or other source.
  initialFiles: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'uploaded'])

const fileInputEl = ref(null)
const dragOver = ref(false)
const isUploading = ref(false)
const uploadingIndex = ref(0)

// items: { id, file, status: 'pending'|'uploading'|'done'|'error', error?, image? }
let _nextId = 1
const items = ref([])

const pendingCount = computed(() => items.value.filter(i => i.status === 'pending').length)
const doneCount = computed(() => items.value.filter(i => i.status === 'done').length)
const errorCount = computed(() => items.value.filter(i => i.status === 'error').length)

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/avif'])
const MAX_BYTES = 20 * 1024 * 1024

function isValidType(file) {
  if (file.type && ALLOWED_TYPES.has(file.type.toLowerCase())) return true
  // Some browsers omit the MIME type for unusual files; fall back to the extension.
  return /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name)
}

function addFiles(fileList) {
  for (const file of fileList) {
    if (!isValidType(file)) {
      items.value.push({
        id: _nextId++, file, status: 'error', error: 'Unsupported file type',
      })
      continue
    }
    if (file.size > MAX_BYTES) {
      items.value.push({
        id: _nextId++, file, status: 'error', error: `Too large (max ${MAX_BYTES / 1024 / 1024} MB)`,
      })
      continue
    }
    items.value.push({ id: _nextId++, file, status: 'pending' })
  }
}

function removeItem(id) {
  items.value = items.value.filter(i => i.id !== id)
}

function triggerFileInput() {
  fileInputEl.value?.click()
}

function onFileInput(event) {
  const files = event.target?.files
  if (!files || files.length === 0) return
  addFiles(files)
  // Reset so selecting the same file again still triggers the input.
  event.target.value = ''
}

function onDrop(event) {
  dragOver.value = false
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return
  addFiles(files)
}

if (props.initialFiles.length) addFiles(props.initialFiles)

async function startUpload() {
  if (isUploading.value) return
  const queue = items.value.filter(i => i.status === 'pending')
  if (queue.length === 0) return

  isUploading.value = true
  uploadingIndex.value = 0
  const uploadedImages = []

  for (const item of queue) {
    uploadingIndex.value++
    item.status = 'uploading'
    item.error = null
    try {
      const form = new FormData()
      form.append('file', item.file, item.file.name)
      const res = await $fetch('/api/images/upload', { method: 'POST', body: form })
      item.status = 'done'
      item.image = res.image
      if (res.image) uploadedImages.push(res.image)
    } catch (e) {
      item.status = 'error'
      item.error = e?.data?.statusMessage ?? e?.message ?? 'Upload failed'
    }
  }

  isUploading.value = false
  if (uploadedImages.length > 0) emit('uploaded', uploadedImages)
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function statusLabel(item) {
  if (item.status === 'pending') return 'Pending'
  if (item.status === 'uploading') return 'Uploading'
  if (item.status === 'done') return 'Uploaded'
  return item.error ?? 'Failed'
}
</script>

<style scoped lang="scss">
.upload-modal {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
  width: 100%;
  max-width: 640px;
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

  // ── Drop zone ───────────────────────────────────────────────────────────────

  &__dropzone {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 30px 20px;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    background: #f9fafb;
    color: #6b7280;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    text-align: center;

    svg { color: #9ca3af; }

    &:hover, &--active {
      background: #f0fdf4;
      border-color: #86efac;
      color: #15803d;

      svg { color: #16a34a; }
    }
  }

  &__file-input { display: none; }

  &__dropzone-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }

  &__dropzone-hint {
    margin: 0;
    font-size: 12px;
    color: #9ca3af;
  }

  // ── File list ──────────────────────────────────────────────────────────────

  &__list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
  }

  &__list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__item {
    display: grid;
    grid-template-columns: 1fr auto auto auto;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    font-size: 12px;
    border-bottom: 1px solid #f3f4f6;

    &:last-child { border-bottom: none; }

    &--done { background: #f0fdf4; }
    &--error { background: #fef2f2; }
    &--uploading { background: #f0f4ff; }
  }

  &__item-name {
    color: $color-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    min-width: 0;
  }

  &__item-size {
    color: #9ca3af;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  &__item-status {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #6b7280;
    font-weight: 500;
    white-space: nowrap;

    .upload-modal__item--done & { color: #16a34a; }
    .upload-modal__item--error & { color: #dc2626; }
    .upload-modal__item--uploading & { color: #4f46e5; }
  }

  &__remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
    border-radius: 4px;

    &:hover { background: #fee2e2; color: #dc2626; }
  }

  &__spin {
    animation: upload-spin 0.8s linear infinite;
  }

  @keyframes upload-spin {
    to { transform: rotate(360deg); }
  }

  // ── Footer ─────────────────────────────────────────────────────────────────

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 20px;
    border-top: 1px solid #f3f4f6;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  &__footer-info {
    font-size: 12px;
    color: #6b7280;
  }

  &__footer-actions {
    display: flex;
    gap: 8px;
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

    &:hover { background: #f3f4f6; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

    &--primary {
      background: #16a34a;
      border-color: #16a34a;
      color: #fff;
      font-weight: 600;

      &:hover:not(:disabled) {
        background: #15803d;
        border-color: #15803d;
      }
    }
  }
}
</style>
