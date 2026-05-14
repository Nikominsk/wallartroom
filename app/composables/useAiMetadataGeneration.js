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
    // The configured max is sent to the AI as the target ceiling. It is NOT
    // used to truncate the response — see server/api/generate-metadata.post.js.
    maxPinterestDescriptionLength: 300,
    maxAdobeStockTitleLength: 200,
    maxAdobeStockDescriptionLength: 500,
    adobeStockKeywordCount: 49,
    usePromptAsContext: true,
    useColorsAsContext: true,
    overwriteMode: 'missing-only',
  }
}

const MAX_UNIQUENESS_ATTEMPTS = 3
const DISAMBIGUATOR_SUFFIXES = [
  'Print', 'Wall Art', 'Decor', 'Edition',
  'Style', 'Collection', 'Series', 'Design',
]

function norm(t) {
  return String(t ?? '').trim().toLowerCase()
}

// When the model keeps returning duplicates despite the prompt warning, force
// uniqueness in code by appending a small disambiguator (or as a last resort,
// a numeric suffix). Stays within maxLen.
function disambiguateTitle(title, used, maxLen) {
  const base = String(title ?? '').trim()
  if (!base) return base

  for (const suffix of DISAMBIGUATOR_SUFFIXES) {
    const trimmed = base.length + 1 + suffix.length <= maxLen
      ? base
      : base.slice(0, Math.max(0, maxLen - suffix.length - 1)).trim()
    const candidate = `${trimmed} ${suffix}`.trim()
    if (!used.has(norm(candidate))) return candidate
  }
  for (let n = 2; n < 1000; n++) {
    const suffix = ` ${n}`
    const trimmed = base.length + suffix.length <= maxLen
      ? base
      : base.slice(0, Math.max(0, maxLen - suffix.length)).trim()
    const candidate = `${trimmed}${suffix}`
    if (!used.has(norm(candidate))) return candidate
  }
  return base
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
    duplicateRetryCount: 0,
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
    progress.duplicateRetryCount = 0
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

    // Track titles used in this run (case-insensitive). Seed with titles that
    // already exist on the batch — those are still "taken" relative to new
    // generations, even though they were set before this run.
    const usedTitles = new Set()
    for (const img of images) {
      const t = img?.pinterest?.title
      if (t) usedTitles.add(norm(t))
    }

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
        const partial = await generateUnique(img, generateFn, usedTitles)

        // Drop the image's prior title from the used set before re-adding,
        // otherwise re-running on the same image flags its own old title as
        // a collision.
        const prior = norm(img?.pinterest?.title)
        if (prior) usedTitles.delete(prior)

        const newTitle = partial?.pinterest?.title
        if (newTitle) usedTitles.add(norm(newTitle))

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

  async function generateUnique(img, generateFn, usedTitles) {
    const wantsTitle = options.generateFor.pinterestTitle
    const maxLen = Math.max(10, Math.min(100, Number(options.maxPinterestTitleLength) || 100))

    let last
    for (let attempt = 0; attempt < MAX_UNIQUENESS_ATTEMPTS; attempt++) {
      last = await generateFn(img, options, {
        existingTitles: [...usedTitles],
        attempt,
      })

      // No title requested in this run — no uniqueness check needed.
      if (!wantsTitle) return last

      const t = norm(last?.pinterest?.title)
      if (!t) return last
      if (!usedTitles.has(t)) return last

      // Duplicate — retry with the same prompt (the server already includes the
      // updated list of existing titles). The composable bumps a counter for
      // visibility in the UI.
      progress.duplicateRetryCount++
    }

    // The AI couldn't produce a unique title after several tries — disambiguate
    // programmatically as a last-resort. This guarantees uniqueness regardless
    // of model behavior.
    if (wantsTitle && last?.pinterest?.title) {
      last = {
        ...last,
        pinterest: {
          ...last.pinterest,
          title: disambiguateTitle(last.pinterest.title, usedTitles, maxLen),
        },
      }
    }
    return last
  }

  function cancel() {
    progress.status = 'cancelled'
  }

  function resetOptions() {
    Object.assign(options, defaultOptions())
  }

  return { options, progress, generate, cancel, resetProgress, resetOptions }
}
