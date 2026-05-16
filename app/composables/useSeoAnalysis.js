export function useSeoAnalysis() {
  const analysis = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function analyze(pinData) {
    loading.value = true
    error.value = null
    analysis.value = null
    try {
      const result = await $fetch('/api/pinterest/seo-analysis', {
        method: 'POST',
        body: {
          title: pinData.title || '',
          description: pinData.description || '',
          board: pinData.board || '',
          keywords: pinData.keywords || '',
        },
      })
      analysis.value = result
    } catch (e) {
      error.value = e?.data?.statusMessage || e?.message || 'SEO analysis failed'
    } finally {
      loading.value = false
    }
  }

  function clear() {
    analysis.value = null
    error.value = null
  }

  return { analysis, loading, error, analyze, clear }
}
