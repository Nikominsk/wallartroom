function bf(val) {
  return { enabled: false, value: val, clear: false }
}

function freshSpec() {
  return {
    pinterestTitle: bf(''),
    pinterestDescription: bf(''),
    // boardIds = selected board UUIDs; boards = [{id,name}] for display. A pin
    // can belong to multiple boards, so this applies the whole set.
    pinterestBoard: { enabled: false, boardIds: [], boards: [], clear: false },
    pinterestLink: bf(''),
    pinterestPublishDate: bf(''),
    pinterestStatus: bf(''),
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
      if (spec.pinterestBoard.enabled) {
        const ids  = spec.pinterestBoard.clear ? [] : [...(spec.pinterestBoard.boardIds ?? [])]
        const objs = spec.pinterestBoard.clear ? [] : [...(spec.pinterestBoard.boards ?? [])]
        p.boardIds = ids
        p.boards   = objs
        p.boardId  = ids[0] ?? null
        p.board    = objs[0]?.name ?? ''
      }
      if (spec.pinterestLink.enabled)
        p.link = spec.pinterestLink.clear ? undefined : spec.pinterestLink.value || undefined
      if (spec.pinterestPublishDate.enabled)
        p.publishDate = spec.pinterestPublishDate.clear ? undefined : spec.pinterestPublishDate.value || undefined
      if (spec.pinterestStatus.enabled)
        p.status = spec.pinterestStatus.clear ? undefined : spec.pinterestStatus.value || undefined
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
