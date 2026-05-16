const STORAGE_KEY = 'wallartroom-utm-presets'

function loadFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveToStorage(presets) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function useUtmPresets() {
  const presets = useState('utm-presets', () => [])

  function init() {
    presets.value = loadFromStorage()
  }

  function addPreset(preset) {
    const entry = {
      id: `utm_${Date.now()}`,
      name: preset.name,
      source: preset.source || 'pinterest',
      medium: preset.medium || 'social',
      campaign: preset.campaign || '',
      content: preset.content || '',
      term: preset.term || '',
      createdAt: new Date().toISOString(),
    }
    presets.value = [...presets.value, entry]
    saveToStorage(presets.value)
    return entry
  }

  function removePreset(id) {
    presets.value = presets.value.filter(p => p.id !== id)
    saveToStorage(presets.value)
  }

  function applyPreset(baseUrl, presetId) {
    const preset = presets.value.find(p => p.id === presetId)
    if (!preset || !baseUrl) return baseUrl

    try {
      const url = new URL(baseUrl.trim())
      if (preset.source) url.searchParams.set('utm_source', preset.source)
      if (preset.medium) url.searchParams.set('utm_medium', preset.medium)
      if (preset.campaign) url.searchParams.set('utm_campaign', preset.campaign)
      if (preset.content) url.searchParams.set('utm_content', preset.content)
      if (preset.term) url.searchParams.set('utm_term', preset.term)
      return url.toString()
    } catch {
      return baseUrl
    }
  }

  function buildUtmUrl(baseUrl, params) {
    if (!baseUrl) return baseUrl
    try {
      const url = new URL(baseUrl.trim())
      if (params.source) url.searchParams.set('utm_source', params.source)
      if (params.medium) url.searchParams.set('utm_medium', params.medium)
      if (params.campaign) url.searchParams.set('utm_campaign', params.campaign)
      if (params.content) url.searchParams.set('utm_content', params.content)
      if (params.term) url.searchParams.set('utm_term', params.term)
      return url.toString()
    } catch {
      return baseUrl
    }
  }

  return { presets, init, addPreset, removePreset, applyPreset, buildUtmUrl }
}
