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
              <span class="proj__pick-name">{{ p.name }}</span>
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
        <form v-if="creating" class="proj__edit" @submit.prevent="confirmCreate">
          <input
            ref="createInput"
            v-model="createValue"
            class="proj__input"
            placeholder="Project name"
            maxlength="120"
            @keyup.esc="creating = false"
          >
          <button class="proj__mini proj__mini--ok" type="submit" title="Create" :disabled="busy">✓</button>
          <button class="proj__mini" type="button" title="Cancel" @click="creating = false">✕</button>
        </form>
        <button v-else class="proj__new" type="button" @click="startCreate">
          <span>＋</span> New project
        </button>
      </div>

      <p v-if="errMsg" class="proj__err">{{ errMsg }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({ collapsed: { type: Boolean, default: false } })

const {
  projects, activeProjectId, activeProject,
  load, createProject, renameProject, deleteProject, switchTo,
} = useMetadataProject()

const rootEl = ref(null)
const open = ref(false)
const busy = ref(false)
const errMsg = ref('')

const creating = ref(false)
const createValue = ref('')
const createInput = ref(null)

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

function toggle() {
  open.value = !open.value
  if (!open.value) resetEditing()
}

function resetEditing() {
  creating.value = false
  renamingId.value = null
  errMsg.value = ''
}

async function choose(p) {
  if (p.id === activeProjectId.value) { open.value = false; return }
  busy.value = true
  try {
    await switchTo(p.id) // triggers a full reload on success
  } catch (e) {
    errMsg.value = e?.data?.statusMessage ?? 'Could not switch project'
    busy.value = false
  }
}

function startCreate() {
  resetEditing()
  creating.value = true
  createValue.value = ''
  nextTick(() => createInput.value?.focus())
}

async function confirmCreate() {
  const name = createValue.value.trim()
  if (!name) return
  busy.value = true
  errMsg.value = ''
  try {
    await createProject(name) // reloads into the new project
  } catch (e) {
    errMsg.value = e?.data?.statusMessage ?? 'Could not create project'
    busy.value = false
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

async function confirmDelete(p) {
  if (projects.value.length <= 1) return
  if (!window.confirm(`Delete “${p.name}” and everything in it (pins, boards, exports)? This cannot be undone.`)) return
  busy.value = true
  errMsg.value = ''
  try {
    await deleteProject(p.id) // reloads if the active project was deleted
    busy.value = false
  } catch (e) {
    errMsg.value = e?.data?.statusMessage ?? 'Could not delete project'
    busy.value = false
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
    padding: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    font: inherit;
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

  &__pick-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
  }

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
</style>
