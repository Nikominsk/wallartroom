<template>
  <div ref="rootEl" class="proj" :class="{ 'proj--collapsed': collapsed }">
    <!-- Trigger -->
    <button
      class="proj__trigger"
      type="button"
      :title="collapsed ? activeName : 'Switch project'"
      :aria-expanded="open"
      @click.stop="toggle"
    >
      <span class="proj__icon" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6Z" />
        </svg>
      </span>
      <span class="proj__label">
        <span class="proj__label-cap">Project</span>
        <span class="proj__label-name">{{ activeName }}</span>
      </span>
      <span class="proj__chev" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l4-4 4 4" />
        </svg>
      </span>
    </button>

    <!-- Popover -->
    <div v-if="open" class="proj__pop" @click.stop>
      <div class="proj__pop-head">Projects</div>

      <ul class="proj__list">
        <li v-for="p in projects" :key="p.id" class="proj__item">
          <template v-if="renamingId === p.id">
            <form class="proj__edit" @submit.prevent="confirmRename(p)">
              <input
                ref="renameInput"
                v-model="renameValue"
                class="proj__input"
                maxlength="120"
                @keyup.esc="cancelRename"
              >
              <button class="proj__mini proj__mini--ok" type="submit" title="Save" :disabled="busy">✓</button>
              <button class="proj__mini" type="button" title="Cancel" @click="cancelRename">✕</button>
            </form>
          </template>

          <template v-else>
            <button
              class="proj__pick"
              :class="{ 'proj__pick--active': p.id === activeProjectId }"
              type="button"
              @click="choose(p)"
            >
              <span class="proj__check">
                <svg v-if="p.id === activeProjectId" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5l3.5 3.5L12 4" /></svg>
              </span>
              <span class="proj__pick-body">
                <span class="proj__pick-name">{{ p.name }}</span>
                <svg
                  v-if="sparklinePoints(p.id)"
                  viewBox="0 0 100 14"
                  preserveAspectRatio="none"
                  class="proj__sparkline"
                  aria-hidden="true"
                >
                  <path :d="sparklineArea(p.id)" class="proj__sparkline-area" />
                  <polyline :points="sparklinePoints(p.id)" class="proj__sparkline-line" />
                </svg>
                <svg
                  v-else-if="!sparklineFetched"
                  class="proj__sparkline-loader"
                  width="10" height="10" viewBox="0 0 22 22" fill="none"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="9" stroke="#e5e7eb" stroke-width="2.5"/>
                  <path d="M11 2a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </span>
            </button>
            <span class="proj__row-actions">
              <button class="proj__mini" type="button" title="Rename" @click.stop="startRename(p)">
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 2.5l2.5 2.5M3 13l8-8 2.5 2.5-8 8H3v-2.5Z" /></svg>
              </button>
              <button
                class="proj__mini proj__mini--danger"
                type="button"
                :title="projects.length <= 1 ? 'Can’t delete your only project' : 'Delete project'"
                :disabled="projects.length <= 1 || busy"
                @click.stop="confirmDelete(p)"
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M6.5 4V2.5h3V4M5 4l.5 9h5l.5-9" /></svg>
              </button>
            </span>
          </template>
        </li>
      </ul>

      <div class="proj__pop-foot">
        <button class="proj__new" type="button" @click="startCreate">
          <span>＋</span> New project
        </button>
      </div>

      <p v-if="errMsg" class="proj__err">{{ errMsg }}</p>
    </div>

    <!-- Project-switching overlay -->
    <Teleport to="body">
      <div v-if="switching" class="proj-switching">
        <div class="proj-switching__box">
          <span class="proj-switching__spinner" />
          Switching project…
        </div>
      </div>
    </Teleport>

    <!-- Delete confirmation modal -->
    <Teleport to="body">
      <div v-if="deleteModal.show" class="proj-upgrade-overlay" @click.self="closeDeleteModal">
        <div class="proj-upgrade">
          <button class="proj-upgrade__close" type="button" aria-label="Close" @click="closeDeleteModal">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
          </button>

          <div class="proj-upgrade__icon proj-upgrade__icon--danger">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </div>

          <h2 class="proj-upgrade__title">Delete "{{ deleteModal.project?.name }}"?</h2>

          <div v-if="deleteModal.fetching" class="proj-delete__loading">Counting images…</div>

          <template v-else>
            <p class="proj-upgrade__body">
              <template v-if="deleteModal.imageCount === 0">
                This project has no images.
              </template>
              <template v-else>
                This project contains <strong>{{ deleteModal.imageCount }} {{ deleteModal.imageCount === 1 ? 'image' : 'images' }}</strong>.
              </template>
            </p>

            <!-- Move option — only when images exist and there are other projects -->
            <div v-if="deleteModal.imageCount > 0 && otherProjects.length > 0" class="proj-delete__move">
              <label class="proj-delete__move-label">
                <input v-model="deleteModal.doMove" type="checkbox" class="proj-delete__move-check" />
                Move images to another project before deleting
              </label>
              <select
                v-if="deleteModal.doMove"
                v-model="deleteModal.targetId"
                class="proj-delete__select"
              >
                <option value="">— select project —</option>
                <option v-for="p in otherProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
              </select>
            </div>

            <div class="proj-upgrade__actions">
              <button
                type="button"
                class="proj-upgrade__cta proj-upgrade__cta--danger"
                :disabled="deleteModal.busy || (deleteModal.doMove && !deleteModal.targetId)"
                @click="executeDelete"
              >
                <template v-if="deleteModal.busy">Working…</template>
                <template v-else-if="deleteModal.doMove && deleteModal.targetId">Move images &amp; delete project</template>
                <template v-else>Delete project{{ deleteModal.imageCount > 0 ? ' and all images' : '' }}</template>
              </button>
              <button type="button" class="proj-upgrade__cancel" @click="closeDeleteModal">Cancel</button>
            </div>
          </template>
        </div>
      </div>
    </Teleport>

    <!-- New project modal -->
    <Teleport to="body">
      <div v-if="createModal.show" class="proj-upgrade-overlay" @click.self="closeCreateModal">
        <div class="proj-create-modal">

          <!-- Header -->
          <div class="proj-create-modal__header">
            <div class="proj-create-modal__header-left">
              <div class="proj-create-modal__icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6Z"/>
                  <path d="M12 11v4M10 13h4"/>
                </svg>
              </div>
              <div>
                <h2 class="proj-create-modal__title">New project</h2>
                <p class="proj-create-modal__subtitle">Your workspace for a set of pins.</p>
              </div>
            </div>
            <button class="proj-create-modal__close" type="button" aria-label="Close" @click="closeCreateModal">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
            </button>
          </div>

          <!-- Form -->
          <form class="proj-create-modal__body" @submit.prevent="confirmCreate">

            <!-- Project name -->
            <div class="pcm-field">
              <label class="pcm-field__label" for="proj-name-input">
                Project name
                <span class="pcm-field__required" aria-hidden="true">*</span>
              </label>
              <input
                id="proj-name-input"
                ref="createNameInput"
                v-model="createModal.name"
                class="pcm-field__input"
                type="text"
                placeholder="e.g. Summer collection"
                maxlength="120"
                autocomplete="off"
                @keyup.esc="closeCreateModal"
              />
            </div>

            <!-- Defaults section -->
            <div class="proj-create-modal__section-head">
              <span class="proj-create-modal__section-line" />
              <span class="proj-create-modal__section-label">Defaults</span>
              <span class="proj-create-modal__section-line" />
            </div>

            <!-- Two-col row: AI language + Board language -->
            <div class="proj-create-modal__row">
              <div class="pcm-field">
                <label class="pcm-field__label" for="proj-lang-input">AI Language</label>
                <input
                  id="proj-lang-input"
                  v-model="createModal.language"
                  list="proj-lang-list"
                  class="pcm-field__input"
                  placeholder="English"
                  autocomplete="off"
                />
                <datalist id="proj-lang-list">
                  <option value="English" /><option value="German" /><option value="French" />
                  <option value="Spanish" /><option value="Italian" /><option value="Dutch" />
                  <option value="Portuguese" /><option value="Swedish" /><option value="Japanese" />
                  <option value="Korean" /><option value="Chinese (Simplified)" /><option value="Arabic" />
                </datalist>
                <span class="pcm-field__hint">For titles &amp; descriptions.</span>
              </div>

              <div class="pcm-field">
                <label class="pcm-field__label" for="proj-board-lang-input">Board Language</label>
                <input
                  id="proj-board-lang-input"
                  v-model="createModal.boardLanguage"
                  list="proj-board-lang-list"
                  class="pcm-field__input"
                  placeholder="English"
                  autocomplete="off"
                />
                <datalist id="proj-board-lang-list">
                  <option value="English" /><option value="German" /><option value="French" />
                  <option value="Spanish" /><option value="Italian" /><option value="Dutch" />
                  <option value="Portuguese" /><option value="Swedish" /><option value="Japanese" />
                  <option value="Korean" /><option value="Chinese (Simplified)" /><option value="Arabic" />
                </datalist>
                <span class="pcm-field__hint">Language of your board names.</span>
              </div>
            </div>

            <!-- Timezone -->
            <div class="pcm-field">
              <label class="pcm-field__label" for="proj-tz-input">CSV Export Timezone</label>
              <div class="pcm-field__select-wrap">
                <svg class="pcm-field__select-icon" width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="10" cy="10" r="8"/><path d="M10 6v4l2.5 2.5"/><path d="M2 10h2M16 10h2M10 2v2M10 16v2"/>
                </svg>
                <select
                  id="proj-tz-input"
                  v-model="createModal.timezone"
                  class="pcm-field__select"
                >
                  <option v-for="tz in METADATA_TIMEZONES" :key="tz.value" :value="tz.value">
                    {{ tz.label }}
                  </option>
                </select>
                <svg class="pcm-field__select-caret" width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 4l4 4 4-4"/></svg>
              </div>
              <span class="pcm-field__hint">Match your Pinterest account's timezone for accurate pin scheduling.</span>
            </div>

            <p v-if="errMsg" class="proj-create-modal__error">{{ errMsg }}</p>

            <!-- Actions -->
            <div class="proj-create-modal__actions">
              <button
                type="submit"
                class="proj-create-modal__submit"
                :disabled="!createModal.name.trim() || createModal.busy"
              >
                <svg v-if="createModal.busy" class="proj-create-modal__spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                {{ createModal.busy ? 'Creating…' : 'Create project' }}
              </button>
              <button type="button" class="proj-create-modal__cancel" @click="closeCreateModal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Upgrade modal -->
    <Teleport to="body">
      <div v-if="showUpgradeModal" class="proj-upgrade-overlay" @click.self="showUpgradeModal = false">
        <div class="proj-upgrade">
          <button class="proj-upgrade__close" type="button" aria-label="Close" @click="showUpgradeModal = false">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
          </button>
          <div class="proj-upgrade__icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9l10-7 10 7v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9Z"/><path d="M9 22V12h6v10"/></svg>
          </div>
          <h2 class="proj-upgrade__title">Project limit reached</h2>
          <p class="proj-upgrade__body">
            Your current plan allows {{ MAX_PROJECTS[me?.plan ?? 'free'] ?? 1 }} project{{ (MAX_PROJECTS[me?.plan ?? 'free'] ?? 1) > 1 ? 's' : '' }}.
            Paid plans with more projects are coming soon — stay tuned!
          </p>
          <div class="proj-upgrade__actions">
            <button type="button" class="proj-upgrade__cta" @click="showUpgradeModal = false">Got it</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { METADATA_TIMEZONES } from '~/utils/metadataTimezone'

defineProps({ collapsed: { type: Boolean, default: false } })
const { confirm } = useConfirm()

const {
  projects, activeProjectId, activeProject,
  load, createProject, renameProject, deleteProject, switchTo,
} = useMetadataProject()

const { data: me } = useMe()

const rootEl = ref(null)
const open = ref(false)
const busy = ref(false)
const errMsg = ref('')
const showUpgradeModal = ref(false)

const createModal = reactive({ show: false, name: '', language: 'English', boardLanguage: 'English', timezone: 'Europe/Berlin', busy: false })
const createNameInput = ref(null)

const renamingId = ref(null)
const renameValue = ref('')
const renameInput = ref(null)

const activeName = computed(() => activeProject.value?.name ?? 'Project')

onMounted(() => {
  load()
  document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function onDocClick(e) {
  if (open.value && rootEl.value && !rootEl.value.contains(e.target)) open.value = false
}

// ── Per-project sparklines ────────────────────────────────────────────────────

const sparklineData = ref({})
const sparklineFetched = ref(false)

async function fetchSparklines() {
  if (sparklineFetched.value) return
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    sparklineData.value = await $fetch('/api/metadata/projects/sparklines', { query: { tz } })
    sparklineFetched.value = true
  } catch { /* non-critical, fail silently */ }
}

function buildSparkline(projectId) {
  const dayCounts = sparklineData.value[projectId]
  const today = new Date()
  const counts = []
  let maxCount = 0

  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const key = d.toLocaleDateString('en-CA')
    const n = dayCounts?.[key] ?? 0
    counts.push(n)
    if (n > maxCount) maxCount = n
  }

  if (maxCount === 0) return null

  const pts = counts.map((n, i) => {
    const x = (i / 29) * 100
    const y = 14 - (n / maxCount) * 12
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return {
    points: pts.join(' '),
    area: `M 0,14 L ${pts.join(' L ')} L 100,14 Z`,
  }
}

function sparklinePoints(id) { return buildSparkline(id)?.points ?? null }
function sparklineArea(id)   { return buildSparkline(id)?.area   ?? '' }

// ── Toggle ────────────────────────────────────────────────────────────────────

function toggle() {
  open.value = !open.value
  if (open.value) fetchSparklines()
  else resetEditing()
}

function resetEditing() {
  creating.value = false
  renamingId.value = null
  errMsg.value = ''
}

const switching = ref(false)

async function choose(p) {
  if (p.id === activeProjectId.value) { open.value = false; return }
  busy.value = true
  switching.value = true
  open.value = false
  try {
    await switchTo(p.id) // triggers a full page reload — switching overlay stays until reload
  } catch (e) {
    errMsg.value = e?.data?.statusMessage ?? 'Could not switch project'
    busy.value = false
    switching.value = false
    open.value = true
  }
}

const MAX_PROJECTS = {
  free:    1,
  starter: 1,
  plus:    3,
  studio:  10,
}

function startCreate() {
  const plan = me.value?.plan ?? 'free'
  const max  = MAX_PROJECTS[plan] ?? Infinity
  if (projects.value.length >= max) {
    open.value = false
    showUpgradeModal.value = true
    return
  }
  open.value = false
  errMsg.value = ''
  createModal.name          = ''
  createModal.language      = 'English'
  createModal.boardLanguage = 'English'
  createModal.timezone      = 'Europe/Berlin'
  createModal.busy          = false
  createModal.show          = true
  nextTick(() => createNameInput.value?.focus())
}

function closeCreateModal() {
  if (createModal.busy) return
  createModal.show = false
  errMsg.value = ''
}

async function confirmCreate() {
  const name = createModal.name.trim()
  if (!name) return
  createModal.busy = true
  errMsg.value = ''
  try {
    await createProject(name, {
      language:      createModal.language.trim() || 'English',
      boardLanguage: createModal.boardLanguage.trim() || 'English',
      timezone:      createModal.timezone || 'Europe/Berlin',
    })
  } catch (e) {
    errMsg.value = e?.data?.statusMessage ?? 'Could not create project'
    createModal.busy = false
  }
}

function startRename(p) {
  resetEditing()
  renamingId.value = p.id
  renameValue.value = p.name
  nextTick(() => renameInput.value?.[0]?.focus?.() ?? renameInput.value?.focus?.())
}

function cancelRename() {
  renamingId.value = null
}

async function confirmRename(p) {
  const name = renameValue.value.trim()
  if (!name || name === p.name) { renamingId.value = null; return }
  busy.value = true
  errMsg.value = ''
  try {
    await renameProject(p.id, name)
    renamingId.value = null
  } catch (e) {
    errMsg.value = e?.data?.statusMessage ?? 'Could not rename project'
  } finally {
    busy.value = false
  }
}

const deleteModal = reactive({
  show:       false,
  project:    null,
  fetching:   false,
  imageCount: 0,
  doMove:     false,
  targetId:   '',
  busy:       false,
})

const otherProjects = computed(() =>
  projects.value.filter(p => p.id !== deleteModal.project?.id),
)

async function confirmDelete(p) {
  if (projects.value.length <= 1) return
  open.value = false

  deleteModal.show       = true
  deleteModal.project    = p
  deleteModal.fetching   = true
  deleteModal.imageCount = 0
  deleteModal.doMove     = false
  deleteModal.targetId   = ''
  deleteModal.busy       = false

  try {
    const { count } = await $fetch(`/api/metadata/projects/${p.id}/image-count`)
    deleteModal.imageCount = count
  } catch {
    deleteModal.imageCount = 0
  } finally {
    deleteModal.fetching = false
  }
}

function closeDeleteModal() {
  if (deleteModal.busy) return
  deleteModal.show = false
}

async function executeDelete() {
  if (!deleteModal.project) return
  deleteModal.busy = true
  errMsg.value = ''
  try {
    if (deleteModal.doMove && deleteModal.targetId) {
      await $fetch(`/api/metadata/projects/${deleteModal.project.id}/move-images`, {
        method: 'POST',
        body: { targetProjectId: deleteModal.targetId },
      })
    }
    await deleteProject(deleteModal.project.id)
    deleteModal.show = false
  } catch (e) {
    errMsg.value = e?.data?.statusMessage ?? 'Could not delete project'
    deleteModal.busy = false
  }
}
</script>

<style lang="scss" scoped>
.proj {
  position: relative;
  margin-bottom: 8px;

  &__trigger {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 7px 8px;
    border: 1px solid #ececec;
    border-radius: 8px;
    background: #fafafa;
    cursor: pointer;
    text-align: left;
    transition: background 0.14s, border-color 0.14s;

    &:hover { background: #f3f4f6; border-color: #dcdcdc; }
    &:focus-visible { outline: 2px solid $color-accent; outline-offset: 2px; }
  }

  &__icon {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: color-mix(in srgb, #{$color-accent} 12%, #fff);
    color: $color-accent;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__label {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  &__label-cap {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #9ca3af;
  }

  &__label-name {
    font-size: 12.5px;
    font-weight: 600;
    color: $color-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chev {
    flex-shrink: 0;
    color: #9ca3af;
    display: flex;
  }

  &--collapsed &__label,
  &--collapsed &__chev { display: none; }
  &--collapsed &__trigger { justify-content: center; padding: 7px 0; }

  // ── Popover ──────────────────────────────────────────────────────────
  &__pop {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    width: 248px;
    max-width: 70vw;
    background: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 10px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
    padding: 6px;
    z-index: 200;
  }

  &--collapsed &__pop { left: 0; width: 240px; }

  &__pop-head {
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: #9ca3af;
    padding: 6px 8px 4px;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 240px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 2px;
    border-radius: 7px;

    &:hover { background: #f6f6f7; }
    &:hover .proj__row-actions { opacity: 1; }
  }

  &__pick {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font: inherit;
    text-align: left;
    color: #374151;

    &--active { font-weight: 600; color: $color-primary; }
  }

  &__check {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    color: $color-accent;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__pick-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
  }

  &__pick-name {
    flex: 1;
    min-width: 0;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    line-height: 1.3;
  }

  &__sparkline {
    display: block;
    flex-shrink: 0;
    width: 52px;
    height: 14px;
  }

  &__sparkline-area {
    fill: color-mix(in srgb, #{$color-accent} 18%, transparent);
  }

  &__sparkline-line {
    stroke: $color-accent;
    stroke-width: 1.5;
    fill: none;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  &__sparkline-loader {
    flex-shrink: 0;
    color: #9ca3af;
    animation: proj-spin 0.8s linear infinite;
  }

  @keyframes proj-spin { to { transform: rotate(360deg); } }

  &__row-actions {
    display: flex;
    gap: 2px;
    padding-right: 5px;
    opacity: 0;
    transition: opacity 0.12s;
  }

  &__mini {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 6px;
    color: #9ca3af;
    cursor: pointer;
    font-size: 12px;
    padding: 0;

    &:hover { background: #ececec; color: $color-primary; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
    &--ok:hover { background: #dcfce7; color: #15803d; }
    &--danger:hover { background: #fef2f2; color: #b91c1c; }
  }

  &__edit {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 5px 6px;
  }

  &__input {
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font: inherit;
    font-size: 12.5px;

    &:focus { outline: none; border-color: $color-accent; }
  }

  &__pop-foot {
    border-top: 1px solid #f0f0f0;
    margin-top: 4px;
    padding-top: 4px;
  }

  &__new {
    display: flex;
    align-items: center;
    gap: 7px;
    width: 100%;
    padding: 8px;
    border: none;
    background: transparent;
    border-radius: 7px;
    cursor: pointer;
    font: inherit;
    font-size: 12.5px;
    font-weight: 600;
    color: $color-accent;

    span { font-size: 15px; line-height: 1; }
    &:hover { background: color-mix(in srgb, #{$color-accent} 8%, #fff); }
  }

  &__err {
    margin: 4px 6px 2px;
    font-size: 11.5px;
    color: #b91c1c;
  }
}

// ── New project modal ─────────────────────────────────────────────────────────

.proj-create-modal {
  position: relative;
  background: #fff;
  border-radius: 14px;
  max-width: 460px;
  width: calc(100vw - 32px);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 20px 18px;
    border-bottom: 1px solid #f3f4f6;
    background: #fafafa;
  }

  &__header-left {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  &__icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: color-mix(in srgb, #{$color-accent} 11%, #fff);
    color: $color-accent;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid color-mix(in srgb, #{$color-accent} 18%, transparent);
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: $color-primary;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }

  &__subtitle {
    margin: 2px 0 0;
    font-size: 12px;
    color: #9ca3af;
    line-height: 1.3;
  }

  &__close {
    width: 30px;
    height: 30px;
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 8px;
    color: #9ca3af;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s, color 0.15s;

    &:hover { background: #f3f4f6; border-color: #d1d5db; color: #374151; }
    &:focus-visible { outline: 2px solid $color-accent; outline-offset: 2px; }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px 20px 22px;
  }

  &__section-head {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 2px 0 0;
  }

  &__section-line {
    flex: 1;
    height: 1px;
    background: #ececec;
  }

  &__section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #c4c9d4;
    white-space: nowrap;
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  &__error {
    padding: 9px 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #b91c1c;
    font-size: 12.5px;
    line-height: 1.45;
    margin: 0;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 4px;
  }

  &__submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    height: 40px;
    background: $color-accent;
    border: none;
    border-radius: 9px;
    color: #fff;
    font: inherit;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: -0.01em;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, #{$color-accent} 88%, #000);
      box-shadow: 0 4px 16px color-mix(in srgb, #{$color-accent} 32%, transparent);
      transform: translateY(-1px);
    }
    &:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
    &:focus-visible { outline: 2px solid $color-accent; outline-offset: 3px; }
  }

  &__spinner {
    animation: proj-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  &__cancel {
    background: none;
    border: none;
    color: #9ca3af;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    padding: 7px;
    text-align: center;
    border-radius: 8px;
    transition: color 0.15s, background 0.15s;

    &:hover { color: #6b7280; background: #f9fafb; }
    &:focus-visible { outline: 2px solid $color-accent; outline-offset: 2px; }
  }
}

// ── Field component used inside the create modal ──────────────────────────────

.pcm-field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &__label {
    font-size: 11px;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    line-height: 1;
  }

  &__required {
    color: $color-accent;
    margin-left: 2px;
  }

  &__input {
    width: 100%;
    height: 37px;
    padding: 0 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    background: #fafafa;
    color: $color-primary;
    box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;

    &::placeholder { color: #c8cdd6; }

    &:focus {
      outline: none;
      border-color: $color-accent;
      background: #fff;
      box-shadow: 0 0 0 3px color-mix(in srgb, #{$color-accent} 13%, transparent);
    }
  }

  &__select-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__select-icon {
    position: absolute;
    left: 10px;
    color: #9ca3af;
    pointer-events: none;
    flex-shrink: 0;
  }

  &__select {
    width: 100%;
    height: 37px;
    padding: 0 28px 0 30px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    background: #fafafa;
    color: $color-primary;
    box-sizing: border-box;
    appearance: none;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;

    &:focus {
      outline: none;
      border-color: $color-accent;
      background: #fff;
      box-shadow: 0 0 0 3px color-mix(in srgb, #{$color-accent} 13%, transparent);
    }
  }

  &__select-caret {
    position: absolute;
    right: 10px;
    color: #9ca3af;
    pointer-events: none;
    flex-shrink: 0;
  }

  &__hint {
    font-size: 11px;
    color: #adb5bd;
    line-height: 1.4;
  }
}

// ── Upgrade paywall modal ────────────────────────────────────────────────────
// Teleported to <body> so scoped styles need :deep or a global class — using
// unscoped class names with the proj-upgrade prefix is fine here.
.proj-upgrade-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  padding: 20px;
  box-sizing: border-box;
}

.proj-switching {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  &__box {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px 22px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  &__spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2.5px solid #e5e7eb;
    border-top-color: $color-accent;
    animation: proj-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
}

@keyframes proj-spin { to { transform: rotate(360deg); } }

.proj-delete {
  &__loading {
    font-size: 13px;
    color: #9ca3af;
    padding: 16px 0;
    text-align: center;
  }

  &__move {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 18px;
    text-align: left;
  }

  &__move-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
    user-select: none;
    font-weight: 500;
  }

  &__move-check {
    cursor: pointer;
    accent-color: $color-accent;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  &__select {
    display: block;
    width: 100%;
    margin-top: 10px;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    color: #1f2937;
    background: #fff;
    cursor: pointer;
    outline: none;
    &:focus { border-color: $color-accent; }
  }
}

.proj-upgrade {
  position: relative;
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px 28px;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  text-align: center;

  &__close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 28px;
    height: 28px;
    border: none;
    background: #f3f4f6;
    border-radius: 8px;
    color: #6b7280;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s;
    &:hover { background: #e5e7eb; color: #111827; }
  }

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: color-mix(in srgb, #{$color-accent} 10%, #fff);
    color: $color-accent;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 18px;

    &--danger {
      background: #fef2f2;
      color: #dc2626;
    }
  }

  &__title {
    font-size: 17px;
    font-weight: 700;
    color: $color-primary;
    margin: 0 0 10px;
    letter-spacing: -0.02em;
    line-height: 1.3;
  }

  &__body {
    font-size: 13.5px;
    color: #6b7280;
    line-height: 1.55;
    margin: 0 0 24px;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__cta {
    display: block;
    background: $color-accent;
    color: #fff;
    text-decoration: none;
    border: none;
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    padding: 11px 20px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.15s;
    &:hover:not(:disabled) { background: color-mix(in srgb, #{$color-accent} 85%, #000); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &--danger {
      background: #dc2626;
      &:hover:not(:disabled) { background: #b91c1c; }
    }
  }

  &__cancel {
    background: none;
    border: none;
    color: #9ca3af;
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    padding: 6px;
    &:hover { color: #6b7280; }
  }
}
</style>
