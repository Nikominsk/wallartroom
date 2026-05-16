export function useBoardIntelligence() {
  const suggestion = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const health = ref(null)
  const healthLoading = ref(false)

  async function suggestBoard(pinData, boards) {
    if (!boards?.length) return
    loading.value = true
    error.value = null
    suggestion.value = null
    try {
      const result = await $fetch('/api/pinterest/board-intelligence', {
        method: 'POST',
        body: {
          title: pinData.title || '',
          description: pinData.description || '',
          keywords: pinData.keywords || '',
          filename: pinData.filename || '',
          boards: boards.map(b => typeof b === 'string' ? b : b.name),
        },
      })
      suggestion.value = result
    } catch (e) {
      error.value = e?.data?.statusMessage || e?.message || 'Board suggestion failed'
    } finally {
      loading.value = false
    }
  }

  async function loadBoardHealth() {
    healthLoading.value = true
    try {
      health.value = await $fetch('/api/pinterest/board-health')
    } catch (e) {
      error.value = e?.data?.statusMessage || e?.message || 'Failed to load board health'
    } finally {
      healthLoading.value = false
    }
  }

  function clear() {
    suggestion.value = null
    error.value = null
  }

  return { suggestion, loading, error, health, healthLoading, suggestBoard, loadBoardHealth, clear }
}
