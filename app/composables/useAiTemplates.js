// Shared, cached AI generation templates.
// useState keeps the list in sync across the modal and settings page within the same session.

export function useAiTemplates() {
  const templates = useState('ai-templates', () => [])
  const loaded    = useState('ai-templates-loaded', () => false)
  const loading   = ref(false)
  const error     = ref(null)

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value   = null
    try {
      const data      = await $fetch('/api/metadata/templates')
      templates.value = data
      loaded.value    = true
    } catch (e) {
      error.value = e?.data?.statusMessage ?? e?.message ?? 'Failed to load templates'
    } finally {
      loading.value = false
    }
  }

  async function create(name, options) {
    const tpl = await $fetch('/api/metadata/templates', {
      method: 'POST',
      body: { name, options },
    })
    templates.value = [...templates.value, tpl].sort((a, b) => a.name.localeCompare(b.name))
    return tpl
  }

  async function update(id, patch) {
    const tpl = await $fetch(`/api/metadata/templates/${id}`, {
      method: 'PUT',
      body: patch,
    })
    templates.value = templates.value
      .map(t => t.id === id ? tpl : t)
      .sort((a, b) => a.name.localeCompare(b.name))
    return tpl
  }

  async function remove(id) {
    await $fetch(`/api/metadata/templates/${id}`, { method: 'DELETE' })
    templates.value = templates.value.filter(t => t.id !== id)
  }

  return { templates, loaded, loading, error, load, create, update, remove }
}
