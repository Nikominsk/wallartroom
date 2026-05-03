function defaultFilters() {
  return {
    search: '',
    pinterestComplete: '',
    adobeStockComplete: '',
    pinterestDate: '',
    adobeStockDate: '',
    pinterestExported: '',
    pinterestPublished: '',
    pinterestBoard: '',
    onlySelected: false,
  }
}

export function useGalleryFilters(images, selectedIds) {
  const filters = reactive(defaultFilters())
  const sortField = ref('createdAt')
  const sortDirection = ref('desc')

  const hasFilters = computed(() =>
    !!(filters.search || filters.pinterestComplete || filters.adobeStockComplete ||
      filters.pinterestDate || filters.adobeStockDate || filters.pinterestExported ||
      filters.pinterestPublished || filters.pinterestBoard || filters.onlySelected)
  )

  function isPinterestComplete(img) {
    return !!(img.pinterest.title && img.pinterest.description && img.pinterest.board && img.pinterest.link)
  }

  function isAdobeStockComplete(img) {
    return !!(img.adobeStock.title && img.adobeStock.description && img.adobeStock.keywords?.length)
  }

  const filteredImages = computed(() => {
    const q = filters.search.toLowerCase().trim()

    let result = images.value.filter(img => {
      if (q) {
        const hay = [
          img.filename, img.prompt ?? '',
          img.pinterest.title ?? '', img.pinterest.description ?? '',
          img.adobeStock.title ?? '', img.adobeStock.description ?? '',
          ...(img.adobeStock.keywords ?? []),
        ].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }

      if (filters.pinterestComplete) {
        const c = isPinterestComplete(img)
        if (filters.pinterestComplete === 'complete' && !c) return false
        if (filters.pinterestComplete === 'incomplete' && c) return false
      }

      if (filters.adobeStockComplete) {
        const c = isAdobeStockComplete(img)
        if (filters.adobeStockComplete === 'complete' && !c) return false
        if (filters.adobeStockComplete === 'incomplete' && c) return false
      }

      if (filters.pinterestDate) {
        const has = !!img.pinterest.publishDate
        if (filters.pinterestDate === 'set' && !has) return false
        if (filters.pinterestDate === 'missing' && has) return false
      }

      if (filters.adobeStockDate) {
        const has = !!img.adobeStock.publishDate
        if (filters.adobeStockDate === 'set' && !has) return false
        if (filters.adobeStockDate === 'missing' && has) return false
      }

      if (filters.pinterestExported) {
        const exp = !!img.pinterest.exportedAt
          || img.pinterest.status === 'exported'
          || img.pinterest.status === 'published'
        if (filters.pinterestExported === 'exported' && !exp) return false
        if (filters.pinterestExported === 'not-exported' && exp) return false
      }

      if (filters.pinterestPublished) {
        const pub = !!img.pinterest.publishedAt
        if (filters.pinterestPublished === 'published' && !pub) return false
        if (filters.pinterestPublished === 'not-published' && pub) return false
      }

      if (filters.pinterestBoard) {
        if (img.pinterest.board !== filters.pinterestBoard) return false
      }

      if (filters.onlySelected && !selectedIds.value.has(img.id)) return false

      return true
    })

    result = [...result].sort((a, b) => {
      let va, vb
      switch (sortField.value) {
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

  return { filters, sortField, sortDirection, hasFilters, filteredImages, isPinterestComplete, isAdobeStockComplete, resetFilters, setSort }
}
