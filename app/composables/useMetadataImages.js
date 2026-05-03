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

function mapPinterestRow(img) {
  return {
    image_id: img.id,
    title: img.pinterest.title || null,
    description: img.pinterest.description || null,
    board: img.pinterest.board || null,
    link: img.pinterest.link || null,
    publish_date: img.pinterest.publishDate || null,
    exported_at: img.pinterest.exportedAt || null,
    published_at: img.pinterest.publishedAt || null,
    status: img.pinterest.status ?? 'draft',
  }
}

function mapAdobeRow(img) {
  return {
    image_id: img.id,
    title: img.adobeStock.title || null,
    description: img.adobeStock.description || null,
    keywords: img.adobeStock.keywords?.length ? img.adobeStock.keywords : null,
    publish_date: img.adobeStock.publishDate || null,
    status: img.adobeStock.status ?? 'draft',
  }
}

// ── Module-level state (persists across component remounts) ───────────────────
// Cache key includes page size so switching sizes doesn't serve stale data.
export const pageSize = ref(10)
const pageCache = new Map()
const cacheKey = (size, page) => `${size}:${page}`

// ── Composable ────────────────────────────────────────────────────────────────

export function useMetadataImages() {
  const images = ref([])
  const pending = ref(false)
  const error = ref(null)
  const saving = ref(false)
  const saveError = ref(null)
  const currentPage = ref(1)
  const totalCount = ref(0)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

  async function loadImages(page = 1) {
    page = Math.max(1, page)
    currentPage.value = page

    const key = cacheKey(pageSize.value, page)
    if (pageCache.has(key)) {
      const hit = pageCache.get(key)
      images.value = hit.images
      totalCount.value = hit.total
      return
    }

    pending.value = true
    error.value = null
    try {
      const { data, count } = await $fetch('/api/images', {
        query: { page, size: pageSize.value },
      })

      const mapped = (data ?? []).map(mapRow)
      pageCache.set(key, { images: mapped, total: count ?? 0 })
      images.value = mapped
      totalCount.value = count ?? 0
    } catch (e) {
      error.value = e.data?.statusMessage ?? e.message ?? 'Failed to load images'
    } finally {
      pending.value = false
    }
  }

  async function setPageSize(size) {
    pageSize.value = size
    return loadImages(1)
  }

  function invalidateCache() {
    pageCache.clear()
  }

  async function saveImage(img) {
    saving.value = true
    saveError.value = null
    try {
      await $fetch('/api/images/save', { method: 'POST', body: img })

      const idx = images.value.findIndex(i => i.id === img.id)
      if (idx !== -1) images.value[idx] = img

      const cached = pageCache.get(cacheKey(pageSize.value, currentPage.value))
      if (cached) {
        const ci = cached.images.findIndex(i => i.id === img.id)
        if (ci !== -1) cached.images[ci] = img
      }
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

      const cached = pageCache.get(cacheKey(pageSize.value, currentPage.value))
      for (const img of imgs) {
        const idx = images.value.findIndex(i => i.id === img.id)
        if (idx !== -1) images.value[idx] = img
        if (cached) {
          const ci = cached.images.findIndex(i => i.id === img.id)
          if (ci !== -1) cached.images[ci] = img
        }
      }
    } catch (e) {
      saveError.value = e.data?.statusMessage ?? e.message ?? 'Save failed'
    } finally {
      saving.value = false
    }
  }

  return {
    images, pending, error,
    saving, saveError,
    currentPage, totalCount, totalPages, pageSize,
    loadImages, setPageSize, saveImage, saveImages, invalidateCache,
  }
}
