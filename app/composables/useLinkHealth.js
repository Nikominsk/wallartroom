export function useLinkHealth() {
  const results = ref([])
  const summary = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function checkLinks(urls) {
    if (!urls?.length) return
    loading.value = true
    error.value = null
    try {
      const data = await $fetch('/api/pinterest/link-health', {
        method: 'POST',
        body: { urls },
      })
      results.value = data.results
      summary.value = data.summary
    } catch (e) {
      error.value = e?.data?.statusMessage || e?.message || 'Link check failed'
    } finally {
      loading.value = false
    }
  }

  function clear() {
    results.value = []
    summary.value = null
    error.value = null
  }

  return { results, summary, loading, error, checkLinks, clear }
}
