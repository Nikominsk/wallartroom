// Shared upload state for the metadata workspace.
//
// Upload is the first step of the workflow, so the trigger lives in the
// sidebar (always reachable, even from Settings / CSV history which don't
// mount the gallery). The modal is rendered once in the metadata layout; any
// page that shows images registers a refresh handler so a finished upload
// re-pulls the gallery without a hard reload.

const _open = ref(false)
const _handlers = new Set()

export function useMetadataUpload() {
  function openUpload() { _open.value = true }
  function closeUpload() { _open.value = false }

  // Returns an unsubscribe fn — call it onUnmounted so a torn-down page can't
  // keep refreshing a gallery that no longer exists.
  function onUploaded(fn) {
    _handlers.add(fn)
    return () => _handlers.delete(fn)
  }

  async function emitUploaded() {
    for (const fn of [..._handlers]) {
      try { await fn() } catch { /* one stale handler shouldn't block the rest */ }
    }
  }

  return { open: _open, openUpload, closeUpload, onUploaded, emitUploaded }
}
