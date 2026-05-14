// ── Mapping ───────────────────────────────────────────────────────────────────

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

// ── Module-level cache (singleton; survives component remounts) ───────────────
// We now load *all* images in one fetch so the gallery can filter/paginate
// client-side — total count then naturally reflects the active filter.
let _cachedImages = null // Array | null

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
  }

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
    deleteImage, updateImageUrl,
  }
}
