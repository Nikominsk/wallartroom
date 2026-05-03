export function usePinterestBoards() {
  const boards = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function loadBoards() {
    loading.value = true
    error.value = null
    try {
      boards.value = await $fetch('/api/pinterest/boards')
    } catch (e) {
      error.value = e.data?.statusMessage ?? e.message ?? 'Failed to load boards'
    } finally {
      loading.value = false
    }
  }

  async function addBoard(name) {
    const board = await $fetch('/api/pinterest/boards', { method: 'POST', body: { name } })
    boards.value = [...boards.value, board].sort((a, b) => a.name.localeCompare(b.name))
    return board
  }

  async function deleteBoard(id) {
    await $fetch(`/api/pinterest/boards/${id}`, { method: 'DELETE' })
    boards.value = boards.value.filter(b => b.id !== id)
  }

  return { boards, loading, error, loadBoards, addBoard, deleteBoard }
}
