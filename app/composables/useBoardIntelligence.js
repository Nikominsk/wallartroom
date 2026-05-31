export function useBoardIntelligence() {
  const suggestion = ref(null)
  const newBoardSuggestion = ref(null)
  const loading = ref(false)
  const loadingNew = ref(false)
  const error = ref(null)
  const health = ref(null)
  const healthLoading = ref(false)

  // Fires two parallel requests:
  //   1. existing board matching (always)
  //   2. new board name suggestion (skipped when withNewBoard=false, e.g. bulk AI flow)
  async function suggestBoard(pinData, boards, { withNewBoard = true } = {}) {
    if (!boards?.length) return
    loading.value = true
    error.value = null
    suggestion.value = null
    newBoardSuggestion.value = null

    const boardNames = boards.map(b => typeof b === 'string' ? b : b.name)

    $fetch('/api/pinterest/board-intelligence', {
      method: 'POST',
      body: {
        title: pinData.title || '',
        description: pinData.description || '',
        keywords: pinData.keywords || '',
        filename: pinData.filename || '',
        boards: boardNames,
      },
    }).then(result => {
      suggestion.value = { recommendedBoards: result.recommendedBoards, reasoning: result.reasoning }
    }).catch(e => {
      error.value = e?.data?.statusMessage || e?.message || 'Board suggestion failed'
    }).finally(() => {
      loading.value = false
    })

    if (withNewBoard) {
      loadingNew.value = true
      $fetch('/api/pinterest/board-intelligence', {
        method: 'POST',
        body: {
          title: pinData.title || '',
          description: pinData.description || '',
          filename: pinData.filename || '',
          boards: boardNames,
          forceNewSuggestion: true,
        },
      }).then(result => {
        newBoardSuggestion.value = result.newBoard || null
      }).catch(() => {
        // non-critical — new board suggestion failing doesn't block the flow
      }).finally(() => {
        loadingNew.value = false
      })
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
    newBoardSuggestion.value = null
    error.value = null
  }

  return { suggestion, newBoardSuggestion, loading, loadingNew, error, health, healthLoading, suggestBoard, loadBoardHealth, clear }
}
