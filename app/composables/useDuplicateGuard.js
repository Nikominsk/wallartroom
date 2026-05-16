function normalizeForComparison(text) {
  return String(text || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ')
}

function similarity(a, b) {
  if (!a || !b) return 0
  const na = normalizeForComparison(a)
  const nb = normalizeForComparison(b)
  if (na === nb) return 1

  // Simple token overlap (Jaccard similarity)
  const tokensA = new Set(na.split(' '))
  const tokensB = new Set(nb.split(' '))
  const intersection = [...tokensA].filter(t => tokensB.has(t)).length
  const union = new Set([...tokensA, ...tokensB]).size
  return union > 0 ? intersection / union : 0
}

export function useDuplicateGuard() {
  const duplicates = ref([])
  const freshnessWarnings = ref([])

  function scan(images) {
    const dupes = []
    const stale = []
    const checked = new Set()

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const title = img?.pinterest?.title || ''

      // Freshness check: if published more than 90 days ago and low engagement
      if (img.status === 'published' && img.publishedAt) {
        const daysSince = Math.floor((Date.now() - new Date(img.publishedAt).getTime()) / (1000 * 60 * 60 * 24))
        if (daysSince > 90) {
          stale.push({
            id: img.id,
            title: title || img.filename,
            daysSince,
            suggestion: 'Consider creating a fresh variant with updated title and description',
          })
        }
      }

      // Duplicate title detection
      if (!title || checked.has(img.id)) continue

      for (let j = i + 1; j < images.length; j++) {
        const other = images[j]
        const otherTitle = other?.pinterest?.title || ''
        if (!otherTitle) continue

        const sim = similarity(title, otherTitle)
        if (sim >= 0.85) {
          dupes.push({
            imageA: { id: img.id, title },
            imageB: { id: other.id, title: otherTitle },
            similarity: Math.round(sim * 100),
            type: sim === 1 ? 'exact' : 'near-duplicate',
          })
          checked.add(other.id)
        }
      }
    }

    duplicates.value = dupes
    freshnessWarnings.value = stale
  }

  function clear() {
    duplicates.value = []
    freshnessWarnings.value = []
  }

  return { duplicates, freshnessWarnings, scan, clear }
}
