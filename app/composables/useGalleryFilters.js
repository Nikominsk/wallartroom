import { isInvalidImage } from './useImageUrlValidation.js'

function defaultFilters() {
  return {
    search: '',
    pinterestComplete: '',
    adobeStockComplete: '',
    pinterestDate: '',
    adobeStockDate: '',
    // Default: hide already-exported pins so the grid focuses on work still to
    // be done. The user can flip it to "Any" or "Exported" via the filter UI.
    pinterestExported: 'not-exported',
    pinterestPublished: '',
    pinterestBoard: '',
    pinterestDateFrom: '',
    pinterestDateTo: '',
    onlySelected: false,
  }
}

// `mode` is an optional Ref<'pinterest' | 'adobe'>. When provided, filters that
// belong to the inactive platform are skipped so e.g. a "not-exported" Pinterest
// filter doesn't bleed into Adobe view.
export function useGalleryFilters(images, selectedIds, mode = ref('pinterest')) {
  const filters = reactive(defaultFilters())
  const sortField = ref('createdAt')
  const sortDirection = ref('desc')

  const isPinterestMode = computed(() => mode.value === 'pinterest')
  const isAdobeMode = computed(() => mode.value === 'adobe')

  // Invalid-URL images never appear in the main grid; they're managed via the
  // separate "Show invalid images" modal so they can be fixed or deleted.
  const validImages = computed(() => images.value.filter(img => !isInvalidImage(img)))
  const invalidImages = computed(() => images.value.filter(isInvalidImage))

  // "Has filters" really means "any filter differs from its default." That way
  // the default not-exported filter doesn't trip the badge dot / reset button.
  // Filters belonging to the inactive mode are ignored — they're hidden in the
  // UI for that mode, so showing a non-default state would be misleading.
  const defaultsSnapshot = defaultFilters()
  const PINTEREST_KEYS = new Set(['pinterestComplete', 'pinterestDate', 'pinterestExported', 'pinterestPublished', 'pinterestBoard', 'pinterestDateFrom', 'pinterestDateTo'])
  const ADOBE_KEYS = new Set(['adobeStockComplete', 'adobeStockDate'])
  const hasFilters = computed(() => {
    for (const key of Object.keys(defaultsSnapshot)) {
      if (isAdobeMode.value && PINTEREST_KEYS.has(key)) continue
      if (isPinterestMode.value && ADOBE_KEYS.has(key)) continue
      if (filters[key] !== defaultsSnapshot[key]) return true
    }
    return false
  })

  function isPinterestComplete(img) {
    return !!(img.pinterest.title && img.pinterest.description && img.pinterest.board && img.pinterest.link)
  }

  function isAdobeStockComplete(img) {
    return !!(img.adobeStock.title && img.adobeStock.description && img.adobeStock.keywords?.length)
  }

  const filteredImages = computed(() => {
    const q = filters.search.toLowerCase().trim()

    let result = validImages.value.filter(img => {
      if (q) {
        const hay = [
          img.filename, img.prompt ?? '',
          img.pinterest.title ?? '', img.pinterest.description ?? '',
          img.adobeStock.title ?? '', img.adobeStock.description ?? '',
          ...(img.adobeStock.keywords ?? []),
        ].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }

      if (isPinterestMode.value && filters.pinterestComplete) {
        const c = isPinterestComplete(img)
        if (filters.pinterestComplete === 'complete' && !c) return false
        if (filters.pinterestComplete === 'incomplete' && c) return false
      }

      if (isAdobeMode.value && filters.adobeStockComplete) {
        const c = isAdobeStockComplete(img)
        if (filters.adobeStockComplete === 'complete' && !c) return false
        if (filters.adobeStockComplete === 'incomplete' && c) return false
      }

      if (isPinterestMode.value && filters.pinterestDate) {
        const has = !!img.pinterest.publishDate
        if (filters.pinterestDate === 'set' && !has) return false
        if (filters.pinterestDate === 'missing' && has) return false
      }

      if (isAdobeMode.value && filters.adobeStockDate) {
        const has = !!img.adobeStock.publishDate
        if (filters.adobeStockDate === 'set' && !has) return false
        if (filters.adobeStockDate === 'missing' && has) return false
      }

      if (isPinterestMode.value && filters.pinterestExported) {
        const exp = !!img.pinterest.exportedAt
          || img.pinterest.status === 'exported'
          || img.pinterest.status === 'published'
        if (filters.pinterestExported === 'exported' && !exp) return false
        if (filters.pinterestExported === 'not-exported' && exp) return false
      }

      if (isPinterestMode.value && filters.pinterestPublished) {
        const pub = !!img.pinterest.publishedAt
        if (filters.pinterestPublished === 'published' && !pub) return false
        if (filters.pinterestPublished === 'not-published' && pub) return false
      }

      if (isPinterestMode.value && filters.pinterestBoard) {
        if (img.pinterest.board !== filters.pinterestBoard) return false
      }

      if (isPinterestMode.value && (filters.pinterestDateFrom || filters.pinterestDateTo)) {
        // Compare YYYY-MM-DD prefix so time-of-day doesn't affect the boundary.
        const d = img.pinterest.publishDate?.slice(0, 10) ?? ''
        if (!d) return false  // no date → excluded when a range is active
        if (filters.pinterestDateFrom && d < filters.pinterestDateFrom) return false
        if (filters.pinterestDateTo   && d > filters.pinterestDateTo)   return false
      }

      if (filters.onlySelected && !selectedIds.value.has(img.id)) return false

      return true
    })

    // Pick the effective sort. If sortField belongs to the inactive mode (e.g.
    // user sorted by Pinterest date then switched to Adobe), fall back to
    // createdAt so we don't sort by an irrelevant field.
    const sf = sortField.value
    const effectiveSort =
      (isAdobeMode.value && (sf === 'pinterestStatus' || sf === 'pinterestPublishDate')) ||
      (isPinterestMode.value && (sf === 'adobeStockStatus' || sf === 'adobeStockPublishDate'))
        ? 'createdAt'
        : sf

    result = [...result].sort((a, b) => {
      let va, vb
      switch (effectiveSort) {
        case 'filename': va = a.filename; vb = b.filename; break
        case 'createdAt': va = a.createdAt; vb = b.createdAt; break
        case 'updatedAt': va = a.updatedAt; vb = b.updatedAt; break
        case 'pinterestStatus': va = a.pinterest.status; vb = b.pinterest.status; break
        case 'adobeStockStatus': va = a.adobeStock.status; vb = b.adobeStock.status; break
        case 'pinterestPublishDate': va = a.pinterest.publishDate; vb = b.pinterest.publishDate; break
        case 'adobeStockPublishDate': va = a.adobeStock.publishDate; vb = b.adobeStock.publishDate; break
      }
      const cmp = (va ?? '').localeCompare(vb ?? '')
      return sortDirection.value === 'asc' ? cmp : -cmp
    })

    return result
  })

  function resetFilters() {
    Object.assign(filters, defaultFilters())
  }

  function setSort(field) {
    if (sortField.value === field) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortDirection.value = 'desc'
    }
  }

  return {
    filters, sortField, sortDirection, hasFilters,
    filteredImages, validImages, invalidImages,
    isPinterestComplete, isAdobeStockComplete,
    resetFilters, setSort,
  }
}
