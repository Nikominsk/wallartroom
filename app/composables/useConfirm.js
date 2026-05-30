// Singleton state — one dialog instance shared across the whole app.
const state = reactive({
  visible:      false,
  title:        '',
  message:      '',
  confirmLabel: 'Confirm',
  cancelLabel:  'Cancel',
  danger:       true,
  resolve:      null,
})

export function useConfirm() {
  function _open(message, opts = {}) {
    state.title        = opts.title        ?? ''
    state.message      = message
    state.confirmLabel = opts.confirmLabel ?? 'Confirm'
    state.cancelLabel  = opts.cancelLabel  ?? 'Cancel'
    state.danger       = opts.danger       ?? true
    state.visible      = true
    return new Promise(res => { state.resolve = res })
  }

  // Returns true if user clicked Confirm, false otherwise.
  function confirm(message, opts = {}) {
    return _open(message, opts)
  }

  // Single-button acknowledgement (no cancel).
  function alert(message, opts = {}) {
    return _open(message, { danger: false, confirmLabel: 'OK', ...opts, cancelLabel: null })
  }

  function _accept() {
    state.visible = false
    state.resolve?.(true)
    state.resolve = null
  }

  function _dismiss() {
    state.visible = false
    state.resolve?.(false)
    state.resolve = null
  }

  return { state, confirm, alert, _accept, _dismiss }
}
