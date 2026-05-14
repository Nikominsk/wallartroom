// Tracks which platform the /metadata page is currently focused on. The user
// flips between "pinterest" and "adobe" via the mode switcher; the choice is
// persisted to localStorage so the page reopens in the same mode.

const STORAGE_KEY = 'wallartroom-metadata-mode'
const _mode = ref('pinterest')
let _hydrated = false

function hydrateOnce() {
  if (_hydrated || !import.meta.client) return
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'pinterest' || saved === 'adobe') _mode.value = saved
  _hydrated = true
}

export function useMetadataMode() {
  hydrateOnce()

  function setMode(m) {
    if (m !== 'pinterest' && m !== 'adobe') return
    _mode.value = m
    if (import.meta.client) {
      try { localStorage.setItem(STORAGE_KEY, m) } catch { /* private mode etc. */ }
    }
  }

  const isPinterest = computed(() => _mode.value === 'pinterest')
  const isAdobe = computed(() => _mode.value === 'adobe')

  return { mode: _mode, setMode, isPinterest, isAdobe }
}
