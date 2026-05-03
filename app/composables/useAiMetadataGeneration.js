function defaultOptions() {
  return {
    generateFor: {
      pinterestTitle: true,
      pinterestDescription: true,
      pinterestBoard: true,
      adobeStockTitle: false,
      adobeStockDescription: false,
      adobeStockKeywords: false,
    },
    additionalContext: '',
    tone: '',
    targetAudience: '',
    niche: '',
    includeKeywords: '',
    excludeKeywords: '',
    language: 'English',
    maxPinterestTitleLength: 100,
    maxPinterestDescriptionLength: 500,
    maxAdobeStockTitleLength: 200,
    maxAdobeStockDescriptionLength: 500,
    adobeStockKeywordCount: 49,
    usePromptAsContext: true,
    useColorsAsContext: true,
    overwriteMode: 'missing-only',
  }
}

export function useAiMetadataGeneration() {
  const options = reactive(defaultOptions())

  const progress = reactive({
    status: 'idle',
    current: 0,
    total: 0,
    imageStatuses: {},
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    failedIds: [],
  })

  function resetProgress() {
    progress.status = 'idle'
    progress.current = 0
    progress.total = 0
    progress.imageStatuses = {}
    progress.successCount = 0
    progress.failedCount = 0
    progress.skippedCount = 0
    progress.failedIds = []
  }

  function needsGeneration(img) {
    if (options.overwriteMode !== 'missing-only') return true
    return (
      (options.generateFor.pinterestTitle && !img.pinterest.title) ||
      (options.generateFor.pinterestDescription && !img.pinterest.description) ||
      (options.generateFor.pinterestBoard && !img.pinterest.board) ||
      (options.generateFor.adobeStockTitle && !img.adobeStock.title) ||
      (options.generateFor.adobeStockDescription && !img.adobeStock.description) ||
      (options.generateFor.adobeStockKeywords && !img.adobeStock.keywords?.length)
    )
  }

  async function generate(images, onUpdate, generateFn) {
    resetProgress()
    progress.status = 'running'
    progress.total = images.length

    for (const img of images) {
      if (progress.status === 'cancelled') break

      if (!needsGeneration(img)) {
        progress.imageStatuses[img.id] = 'skipped'
        progress.skippedCount++
        progress.current++
        continue
      }

      progress.imageStatuses[img.id] = 'generating'
      progress.current++

      try {
        const partial = await generateFn(img, options)
        const updated = {
          ...img,
          pinterest: { ...img.pinterest, ...partial.pinterest },
          adobeStock: { ...img.adobeStock, ...partial.adobeStock },
          updatedAt: new Date().toISOString(),
        }
        progress.imageStatuses[img.id] = 'done'
        progress.successCount++
        onUpdate(updated)
      } catch {
        progress.imageStatuses[img.id] = 'failed'
        progress.failedCount++
        progress.failedIds.push(img.id)
      }
    }

    if (progress.status !== 'cancelled') progress.status = 'done'
  }

  function cancel() {
    progress.status = 'cancelled'
  }

  function resetOptions() {
    Object.assign(options, defaultOptions())
  }

  return { options, progress, generate, cancel, resetProgress, resetOptions }
}
