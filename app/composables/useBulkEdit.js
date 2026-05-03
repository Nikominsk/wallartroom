function bf(val) {
  return { enabled: false, value: val, clear: false }
}

function freshSpec() {
  return {
    pinterestTitle: bf(''),
    pinterestDescription: bf(''),
    pinterestBoard: bf(''),
    pinterestLink: bf(''),
    pinterestPublishDate: bf(''),
    adobeStockTitle: bf(''),
    adobeStockDescription: bf(''),
    adobeStockKeywords: bf([]),
    adobeStockPublishDate: bf(''),
  }
}

export function useBulkEdit() {
  const spec = reactive(freshSpec())

  function reset() {
    Object.assign(spec, freshSpec())
  }

  function applyToImages(images) {
    return images.map(img => {
      const p = { ...img.pinterest }
      const a = { ...img.adobeStock, keywords: [...(img.adobeStock.keywords ?? [])] }

      if (spec.pinterestTitle.enabled)
        p.title = spec.pinterestTitle.clear ? undefined : spec.pinterestTitle.value || undefined
      if (spec.pinterestDescription.enabled)
        p.description = spec.pinterestDescription.clear ? undefined : spec.pinterestDescription.value || undefined
      if (spec.pinterestBoard.enabled)
        p.board = spec.pinterestBoard.clear ? undefined : spec.pinterestBoard.value || undefined
      if (spec.pinterestLink.enabled)
        p.link = spec.pinterestLink.clear ? undefined : spec.pinterestLink.value || undefined
      if (spec.pinterestPublishDate.enabled)
        p.publishDate = spec.pinterestPublishDate.clear ? undefined : spec.pinterestPublishDate.value || undefined
      if (spec.adobeStockTitle.enabled)
        a.title = spec.adobeStockTitle.clear ? undefined : spec.adobeStockTitle.value || undefined
      if (spec.adobeStockDescription.enabled)
        a.description = spec.adobeStockDescription.clear ? undefined : spec.adobeStockDescription.value || undefined
      if (spec.adobeStockKeywords.enabled)
        a.keywords = spec.adobeStockKeywords.clear ? [] : [...spec.adobeStockKeywords.value]
      if (spec.adobeStockPublishDate.enabled)
        a.publishDate = spec.adobeStockPublishDate.clear ? undefined : spec.adobeStockPublishDate.value || undefined

      return { ...img, pinterest: p, adobeStock: a, updatedAt: new Date().toISOString() }
    })
  }

  const activeFieldCount = computed(() =>
    Object.values(spec).filter(f => f.enabled).length
  )

  return { spec, reset, applyToImages, activeFieldCount }
}
