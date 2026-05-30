// ── Mapping ───────────────────────────────────────────────────────────────────

function mapRow(row) {
  const colors = [row.primary_color, row.secondary_color, row.tertiary_color]
    .filter(Boolean)
    .map(c => ({ hex: c.hex, label: c.name }))

  const p = (Array.isArray(row.pinterest_image) ? row.pinterest_image[0] : row.pinterest_image) ?? {}
  const a = (Array.isArray(row.adobe_image) ? row.adobe_image[0] : row.adobe_image) ?? {}

  // Multi-board: the join table carries every board the pin belongs to. Each
  // row embeds its pinterest_board (id, name, color). Falls back to the legacy
  // single board_id/board on pinterest_image when the join data isn't present.
  const boardLinks = Array.isArray(row.pinterest_image_board) ? row.pinterest_image_board : []
  let boards = boardLinks
    .map(l => {
      const b = Array.isArray(l.pinterest_board) ? l.pinterest_board[0] : l.pinterest_board
      if (b) return { id: b.id, name: b.name, color: b.color ?? null }
      return l.board_id ? { id: l.board_id, name: '', color: null } : null
    })
    .filter(Boolean)
  if (boards.length === 0 && p.board_id) {
    boards = [{ id: p.board_id, name: p.board ?? '', color: null }]
  }
  const boardIds = boards.map(b => b.id)

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
      // Primary board (first) kept for backward-compatible single-board display.
      boardId: boardIds[0] ?? null,
      board: boards[0]?.name ?? p.board ?? '',
      // Full multi-board set.
      boardIds,
      boards,
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

// ── Module-level cache (singleton; survives component remounts) ───────────────
// We now load *all* images in one fetch so the gallery can filter/paginate
// client-side — total count then naturally reflects the active filter.
let _cachedImages = null // Array | null

// Components that are actively showing images register their loadImages here
// so that any external invalidateCache() call (e.g. from csv-exports) also
// triggers an immediate reload in those components.
const _reloadListeners = new Set()

// ── Composable ────────────────────────────────────────────────────────────────

export function useMetadataImages() {
  const images = ref(_cachedImages ?? [])
  const pending = ref(false)
  const error = ref(null)
  const saving = ref(false)
  const saveError = ref(null)

  async function loadImages() {
    if (_cachedImages) {
      images.value = _cachedImages
      return
    }
    pending.value = true
    error.value = null
    try {
      const { data } = await $fetch('/api/images')
      const mapped = (data ?? []).map(mapRow)
      _cachedImages = mapped
      images.value = mapped
    } catch (e) {
      error.value = e.data?.statusMessage ?? e.message ?? 'Failed to load images'
    } finally {
      pending.value = false
    }
  }

  function invalidateCache() {
    _cachedImages = null
    for (const fn of [..._reloadListeners]) {
      try { fn() } catch { /* stale listener */ }
    }
  }

  // While this instance is mounted, register its loadImages so external
  // invalidations (e.g. marking exports) reload the visible gallery too.
  onMounted(() => _reloadListeners.add(loadImages))
  onUnmounted(() => _reloadListeners.delete(loadImages))

  function applyToCache(updater) {
    if (_cachedImages) _cachedImages = updater(_cachedImages)
  }

  async function saveImage(img) {
    saving.value = true
    saveError.value = null
    try {
      await $fetch('/api/images/save', { method: 'POST', body: img })
      const idx = images.value.findIndex(i => i.id === img.id)
      if (idx !== -1) images.value[idx] = img
      applyToCache(arr => arr.map(i => i.id === img.id ? img : i))
    } catch (e) {
      saveError.value = e.data?.statusMessage ?? e.message ?? 'Save failed'
    } finally {
      saving.value = false
    }
  }

  async function saveImages(imgs) {
    saving.value = true
    saveError.value = null
    try {
      await $fetch('/api/images/save', { method: 'POST', body: imgs })
      const byId = new Map(imgs.map(i => [i.id, i]))
      images.value = images.value.map(i => byId.get(i.id) ?? i)
      applyToCache(arr => arr.map(i => byId.get(i.id) ?? i))
    } catch (e) {
      saveError.value = e.data?.statusMessage ?? e.message ?? 'Save failed'
    } finally {
      saving.value = false
    }
  }

  async function deleteImage(id) {
    saving.value = true
    saveError.value = null
    try {
      await $fetch(`/api/images/${id}`, { method: 'DELETE' })
      images.value = images.value.filter(i => i.id !== id)
      applyToCache(arr => arr.filter(i => i.id !== id))
    } catch (e) {
      saveError.value = e.data?.statusMessage ?? e.message ?? 'Delete failed'
      throw e
    } finally {
      saving.value = false
    }
  }

  async function deleteImages(ids) {
    if (!ids?.length) return
    saving.value = true
    saveError.value = null
    try {
      await $fetch('/api/images/delete-many', { method: 'POST', body: { ids } })
      const idSet = new Set(ids)
      images.value = images.value.filter(i => !idSet.has(i.id))
      applyToCache(arr => arr.filter(i => !idSet.has(i.id)))
    } catch (e) {
      saveError.value = e.data?.statusMessage ?? e.message ?? 'Delete failed'
      throw e
    } finally {
      saving.value = false
    }
  }

  // Move or copy a batch of images into another project owned by the same
  // user. On `move`, the rows leave the active project so we strip them from
  // the local cache; on `copy`, the source rows stay put — the new copies
  // belong to the target project and only appear there after switching.
  async function transferImages(ids, targetProjectId, mode = 'move') {
    if (!ids?.length || !targetProjectId) return null
    saving.value = true
    saveError.value = null
    try {
      const result = await $fetch('/api/images/transfer', {
        method: 'POST',
        body: { ids, targetProjectId, mode },
      })
      if (mode === 'move') {
        const idSet = new Set(result?.movedIds ?? ids)
        images.value = images.value.filter(i => !idSet.has(i.id))
        applyToCache(arr => arr.filter(i => !idSet.has(i.id)))
      }
      return result
    } catch (e) {
      saveError.value = e.data?.statusMessage ?? e.message ?? 'Transfer failed'
      throw e
    } finally {
      saving.value = false
    }
  }

  async function updateImageUrl(id, { mediaUrl, thumbnailUrl } = {}) {
    saving.value = true
    saveError.value = null
    try {
      const body = {}
      if (mediaUrl !== undefined) body.public_url = mediaUrl
      if (thumbnailUrl !== undefined) body.thumbnail_url = thumbnailUrl
      const updated = await $fetch(`/api/images/${id}`, { method: 'PATCH', body })

      const apply = (img) => ({
        ...img,
        mediaUrl: updated.public_url ?? img.mediaUrl,
        thumbnailUrl: updated.thumbnail_url ?? null,
      })
      const idx = images.value.findIndex(i => i.id === id)
      if (idx !== -1) images.value[idx] = apply(images.value[idx])
      applyToCache(arr => arr.map(i => i.id === id ? apply(i) : i))
    } catch (e) {
      saveError.value = e.data?.statusMessage ?? e.message ?? 'Update failed'
      throw e
    } finally {
      saving.value = false
    }
  }

  return {
    images, pending, error,
    saving, saveError,
    loadImages, saveImage, saveImages, invalidateCache,
    deleteImage, deleteImages, updateImageUrl,
    transferImages,
  }
}
