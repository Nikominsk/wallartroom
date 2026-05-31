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
    skipFilled: true,
    overwriteMode: 'missing-only',
  }
}

// 4 concurrent OpenAI calls per user. Safe: JS is single-threaded so the
// shared usedTitles Set updates atomically between awaits. Any title collision
// between parallel workers is resolved by generateUnique's retry loop which
// re-snapshots the set on each attempt.
const CONCURRENCY = 4
const MAX_UNIQUENESS_ATTEMPTS = 3
const DISAMBIGUATOR_SUFFIXES = [
  'Print', 'Wall Art', 'Decor', 'Edition',
  'Style', 'Collection', 'Series', 'Design',
]

function norm(t) {
  return String(t ?? '').trim().toLowerCase()
}

// Only keep fields from the AI's pinterest partial that:
//   a) were actually requested via generateFor, AND
//   b) are allowed to overwrite given overwriteMode
//      ('missing-only' → only write to empty fields; 'replace' → write everything)
function filterPartialPinterest(existing, partial, { generateFor, overwriteMode }) {
  const result = {}
  if (!partial) return result

  if (generateFor.pinterestTitle && partial.title) {
    if (overwriteMode !== 'missing-only' || !existing?.title)
      result.title = partial.title
  }
  if (generateFor.pinterestDescription && partial.description) {
    if (overwriteMode !== 'missing-only' || !existing?.description)
      result.description = partial.description
  }
  if (generateFor.pinterestBoard && partial.board) {
    if (overwriteMode !== 'missing-only' || !existing?.board)
      result.board = partial.board
  }
  return result
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
    lastError: null,   // last error message seen, shown in the UI
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
    progress.lastError = null
  }

  function needsGeneration(img) {
    if (!options.skipFilled) return true
    // Skip the image only when every selected field is already filled.
    const allFilled =
      (!options.generateFor.pinterestTitle        || !!img.pinterest.title) &&
      (!options.generateFor.pinterestDescription  || !!img.pinterest.description) &&
      (!options.generateFor.pinterestBoard        || !!img.pinterest.board) &&
      (!options.generateFor.adobeStockTitle       || !!img.adobeStock.title) &&
      (!options.generateFor.adobeStockDescription || !!img.adobeStock.description) &&
      (!options.generateFor.adobeStockKeywords    || !!img.adobeStock.keywords?.length)
    return !allFilled
  }

  async function generate(images, onUpdate, generateFn) {
    resetProgress()
    progress.status = 'running'
    progress.total = images.length

    // Seed usedTitles with titles already set on the batch so new generations
    // don't collide with pre-existing ones either.
    const usedTitles = new Set()
    for (const img of images) {
      const t = img?.pinterest?.title
      if (t) usedTitles.add(norm(t))
    }

    // Shared queue pointer. Safe: head++ executes synchronously before the
    // next await so no two workers ever claim the same index.
    let head = 0

    async function worker() {
      while (head < images.length) {
        if (progress.status === 'cancelled') break

        const img = images[head++]

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

          // Drop the image's prior title before re-adding so re-runs on the
          // same image don't flag their own old title as a collision.
          const prior = norm(img?.pinterest?.title)
          if (prior) usedTitles.delete(prior)

          // Only track the new title in usedTitles when title generation was requested.
          const newTitle = options.generateFor.pinterestTitle ? partial?.pinterest?.title : null
          if (newTitle) usedTitles.add(norm(newTitle))

          // Apply only the fields that were requested and allowed to overwrite.
          const filteredPinterest = filterPartialPinterest(img.pinterest, partial.pinterest, options)

          const updated = {
            ...img,
            pinterest:  { ...img.pinterest,  ...filteredPinterest },
            adobeStock: { ...img.adobeStock, ...partial.adobeStock },
            updatedAt:  new Date().toISOString(),
          }
          progress.imageStatuses[img.id] = 'done'
          progress.successCount++
          onUpdate(updated)
        } catch (e) {
          progress.imageStatuses[img.id] = 'failed'
          progress.failedCount++
          progress.failedIds.push(img.id)
          progress.lastError = e?.data?.statusMessage ?? e?.message ?? 'Unknown error'
          // Quota exhausted — abort immediately, every remaining call will also fail.
          if (e?.status === 402 || e?.statusCode === 402) {
            progress.status = 'cancelled'
            break
          }
        }
      }
    }

    // Run CONCURRENCY workers; each drains the shared queue until empty.
    await Promise.all(Array.from({ length: CONCURRENCY }, worker))

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
