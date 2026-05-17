// Active-project state for the /metadata workspace.
//
// The server resolves the active project from a cookie and is the source of
// truth (see server/utils/requireMetadataProject.ts). This composable mirrors
// that list/active id for the sidebar switcher.
//
// Switching projects does a hard app reload on purpose: several stores cache
// at module level (useMetadataImages._cachedImages, usePinterestBoards /
// useMetadataSettings / useAiTemplates useState). A reload is the only
// bullet-proof way to guarantee every one of them re-fetches scoped to the
// newly-active project — far less bug-prone than hunting down each cache.

export function useMetadataProject() {
  const projects        = useState('metadata-projects', () => [])
  const activeProjectId = useState('metadata-active-project', () => null)
  // Token-cheap account-performance brief for the active project (from the
  // imported Pinterest analytics). Passed into AI generation so descriptions
  // lean into proven themes — no per-image DB hit.
  const analyticsBrief  = useState('metadata-analytics-brief', () => '')
  const loaded          = useState('metadata-projects-loaded', () => false)
  const loading         = useState('metadata-projects-loading', () => false)
  const error           = useState('metadata-projects-error', () => null)

  const activeProject = computed(
    () => projects.value.find(p => p.id === activeProjectId.value) ?? null,
  )

  async function load(force = false) {
    if (loaded.value && !force) return
    loading.value = true
    error.value = null
    try {
      const data = await $fetch('/api/metadata/projects')
      projects.value = data.projects ?? []
      activeProjectId.value = data.activeProjectId ?? null
      analyticsBrief.value = data.analyticsBrief ?? ''
      loaded.value = true
    } catch (e) {
      error.value = e?.data?.statusMessage ?? e?.message ?? 'Failed to load projects'
    } finally {
      loading.value = false
    }
  }

  async function createProject(name) {
    const project = await $fetch('/api/metadata/projects', {
      method: 'POST',
      body: { name },
    })
    // Server already set this as the active project — reload into it.
    await switchTo(project.id, { skipActivate: true })
    return project
  }

  async function renameProject(id, name) {
    const updated = await $fetch(`/api/metadata/projects/${id}`, {
      method: 'PATCH',
      body: { name },
    })
    projects.value = projects.value.map(p => (p.id === id ? { ...p, ...updated } : p))
    return updated
  }

  async function deleteProject(id) {
    await $fetch(`/api/metadata/projects/${id}`, { method: 'DELETE' })
    const wasActive = id === activeProjectId.value
    projects.value = projects.value.filter(p => p.id !== id)
    // Server repointed the active cookie if we deleted the active project;
    // reload so the whole workspace re-scopes.
    if (wasActive) reloadIntoActiveProject()
  }

  async function switchTo(id, { skipActivate = false } = {}) {
    if (!skipActivate) {
      if (id === activeProjectId.value) return
      await $fetch(`/api/metadata/projects/${id}/activate`, { method: 'POST' })
    }
    reloadIntoActiveProject()
  }

  function reloadIntoActiveProject() {
    if (import.meta.client) {
      // Full reload — clears every module-level / useState cache so all
      // workspace data re-fetches against the new active-project cookie.
      window.location.reload()
    }
  }

  return {
    projects,
    activeProject,
    activeProjectId,
    analyticsBrief,
    loaded,
    loading,
    error,
    load,
    createProject,
    renameProject,
    deleteProject,
    switchTo,
  }
}
