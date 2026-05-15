// Must match FALLBACK_COLORS in dashboard.vue — keep in sync.
const FALLBACK_PALETTE = [
  { bg: '#ff6b35', color: '#ffffff' },
  { bg: '#6366f1', color: '#ffffff' },
  { bg: '#22c55e', color: '#ffffff' },
  { bg: '#f59e0b', color: '#ffffff' },
  { bg: '#3b82f6', color: '#ffffff' },
  { bg: '#ec4899', color: '#ffffff' },
  { bg: '#8b5cf6', color: '#ffffff' },
  { bg: '#14b8a6', color: '#ffffff' },
]

function hashIndex(name, modulus) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % modulus
  return h
}

// Pick a readable text color (dark or light) given a background hex.
function readableTextColor(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return '#1f2937'
  const r = parseInt(m[1].slice(0, 2), 16)
  const g = parseInt(m[1].slice(2, 4), 16)
  const b = parseInt(m[1].slice(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 175 ? '#1f2937' : '#ffffff'
}

export function boardChipStyleFor(board) {
  if (!board) return null
  const name = typeof board === 'string' ? board : board?.name
  const explicit = typeof board === 'string' ? null : board?.color
  if (explicit) return { background: explicit, color: readableTextColor(explicit) }
  if (!name) return null
  const idx = hashIndex(name, FALLBACK_PALETTE.length)
  return { background: FALLBACK_PALETTE[idx].bg, color: FALLBACK_PALETTE[idx].color }
}

export function usePinterestBoards() {
  const boards = useState('pinterest-boards', () => [])
  const loaded = useState('pinterest-boards-loaded', () => false)
  const loading = ref(false)
  const error = ref(null)

  // Quick lookup: name -> { id, name, color }
  const boardsByName = computed(() => {
    const map = new Map()
    for (const b of boards.value) map.set(b.name, b)
    return map
  })

  // Boards rarely change inside a session, so re-mounting consumers (or routes
  // navigating away and back) shouldn't trigger a refetch. Callers that want a
  // fresh list pass force=true.
  async function loadBoards(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value = null
    try {
      const data = await $fetch('/api/pinterest/boards')
      boards.value = data
      loaded.value = true
    } catch (e) {
      error.value = e.data?.statusMessage ?? e.message ?? 'Failed to load boards'
    } finally {
      loading.value = false
    }
  }

  async function addBoard(name, color = null) {
    const board = await $fetch('/api/pinterest/boards', {
      method: 'POST',
      body: { name, color },
    })
    boards.value = [...boards.value, board].sort((a, b) => a.name.localeCompare(b.name))
    return board
  }

  async function updateBoard(id, patch) {
    const board = await $fetch(`/api/pinterest/boards/${id}`, {
      method: 'PATCH',
      body: patch,
    })
    boards.value = boards.value
      .map(b => (b.id === id ? board : b))
      .sort((a, b) => a.name.localeCompare(b.name))
    return board
  }

  async function deleteBoard(id) {
    await $fetch(`/api/pinterest/boards/${id}`, { method: 'DELETE' })
    boards.value = boards.value.filter(b => b.id !== id)
  }

  function chipStyleForName(name) {
    return boardChipStyleFor(boardsByName.value.get(name) ?? name)
  }

  return {
    boards,
    boardsByName,
    loading,
    error,
    loadBoards,
    addBoard,
    updateBoard,
    deleteBoard,
    chipStyleForName,
  }
}
