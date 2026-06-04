export function useBoardIntelligence() {
  const suggestion = ref(null)
  const newBoardSuggestionSpecific = ref(null)
  const newBoardSuggestionBroad = ref(null)
  const loading = ref(false)
  const loadingNew = ref(false)
  const newBoardsLoaded = ref(false) // true once the new-name call has settled
  const error = ref(null)
  const health = ref(null)
  const healthLoading = ref(false)

  // Fires two requests:
  //   1. existing board matching (always) — charges quota
  //   2. new board name suggestions (parallel, when boards exist; bundled with #1 when no boards)
  async function suggestBoard(pinData, boards, { withNewBoard = true } = {}) {
    loading.value = true
    error.value = null
    suggestion.value = null
    newBoardSuggestionSpecific.value = null
    newBoardSuggestionBroad.value = null
    newBoardsLoaded.value = false

    const boardNames = (boards ?? []).map(b => typeof b === 'string' ? b : b.name)
    const hasBoards = boardNames.length > 0

    $fetch('/api/pinterest/board-intelligence', {
      method: 'POST',
      body: {
        title: pinData.title || '',
        description: pinData.description || '',
        keywords: pinData.keywords || '',
        filename: pinData.filename || '',
        imageUrl: pinData.imageUrl || null,
        boards: boardNames,
      },
    }).then(result => {
      suggestion.value = { recommendedBoards: result.recommendedBoards, reasoning: result.reasoning }
      // When no boards exist, the main call takes the fast path and returns new name suggestions.
      if (!hasBoards) {
        newBoardSuggestionSpecific.value = result.newBoardSpecific || null
        newBoardSuggestionBroad.value = result.newBoardBroad || null
        newBoardsLoaded.value = true
      }
    }).catch(e => {
      error.value = e?.data?.statusMessage || e?.message || 'Board suggestion failed'
      if (!hasBoards) newBoardsLoaded.value = true
    }).finally(() => {
      loading.value = false
    })

    // Only fire the parallel call when there are boards to match against.
    // When no boards, new name suggestions come from the main fast-path response above.
    if (withNewBoard && hasBoards) {
      loadingNew.value = true
      $fetch('/api/pinterest/board-intelligence', {
        method: 'POST',
        body: {
          title: pinData.title || '',
          description: pinData.description || '',
          filename: pinData.filename || '',
          imageUrl: pinData.imageUrl || null,
          boards: boardNames,
          forceNewSuggestion: true,
        },
      }).then(result => {
        newBoardSuggestionSpecific.value = result.newBoardSpecific || null
        newBoardSuggestionBroad.value = result.newBoardBroad || null
      }).catch(() => {
        // non-critical — new board suggestion failing doesn't block the flow
      }).finally(() => {
        loadingNew.value = false
        newBoardsLoaded.value = true
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
    newBoardSuggestionSpecific.value = null
    newBoardSuggestionBroad.value = null
    newBoardsLoaded.value = false
    error.value = null
  }

  return { suggestion, newBoardSuggestionSpecific, newBoardSuggestionBroad, loading, loadingNew, newBoardsLoaded, error, health, healthLoading, suggestBoard, loadBoardHealth, clear }
}
