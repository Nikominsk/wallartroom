// Shared, cached metadata settings (AI defaults). Loaded once per session and
// reused via useState so every consumer reacts to the same source of truth.

const FALLBACK = {
  ai_max_title_length: 100,
  ai_max_description_length: 300,
  ai_default_tone: '',
  ai_additional_instructions: '',
  ai_default_language: 'English',
  csv_timezone: 'Europe/Berlin',
}

export function useMetadataSettings() {
  const settings = useState('metadata-settings', () => ({ ...FALLBACK }))
  const loaded = useState('metadata-settings-loaded', () => false)
  const pending = useState('metadata-settings-pending', () => false)
  const error = useState('metadata-settings-error', () => null)

  async function load(force = false) {
    if (loaded.value && !force) return settings.value
    pending.value = true
    error.value = null
    try {
      const data = await $fetch('/api/metadata/settings')
      settings.value = { ...FALLBACK, ...data }
      loaded.value = true
    } catch (e) {
      error.value = e?.data?.statusMessage ?? e?.message ?? 'Failed to load settings'
    } finally {
      pending.value = false
    }
    return settings.value
  }

  async function save(patch) {
    pending.value = true
    error.value = null
    try {
      const data = await $fetch('/api/metadata/settings', { method: 'PUT', body: patch })
      settings.value = { ...FALLBACK, ...data }
      loaded.value = true
      return settings.value
    } catch (e) {
      error.value = e?.data?.statusMessage ?? e?.message ?? 'Failed to save settings'
      throw e
    } finally {
      pending.value = false
    }
  }

  return { settings, loaded, pending, error, load, save }
}
