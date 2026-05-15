<template>
  <div class="settings-page">
    <header class="settings-page__header">
      <div>
        <h1 class="settings-page__title">Settings</h1>
        <p class="settings-page__subtitle">Boards and AI metadata defaults for this workspace.</p>
      </div>
    </header>

    <div class="settings-page__body">
      <nav class="settings-page__sections-nav" aria-label="Settings sections">
        <button
          v-for="s in sections"
          :key="s.id"
          type="button"
          class="settings-page__section-link"
          :class="{ 'settings-page__section-link--active': activeSection === s.id }"
          @click="activeSection = s.id"
        >
          <span class="settings-page__section-link-icon" v-html="s.icon" />
          <span>{{ s.label }}</span>
        </button>
      </nav>

      <div class="settings-page__content">
        <!-- ── Boards ────────────────────────────────────────────────────── -->
        <section v-show="activeSection === 'boards'" class="settings-card">
          <header class="settings-card__head">
            <div>
              <h2 class="settings-card__title">Boards</h2>
              <p class="settings-card__hint">Pick a color for each board, or leave it blank and we'll pick one automatically.</p>
            </div>
            <span class="settings-card__count">{{ boards.length }} board{{ boards.length === 1 ? '' : 's' }}</span>
          </header>

          <div class="settings-card__body">
            <!-- New board row -->
            <form class="board-row board-row--new" @submit.prevent="handleAddBoard">
              <button
                type="button"
                class="board-row__swatch"
                :style="newSwatchStyle"
                :title="newColor ? newColor : 'Auto color'"
                @click="openPicker('new')"
              >
                <span v-if="!newColor" class="board-row__swatch-auto">A</span>
              </button>
              <input
                v-model.trim="newName"
                class="board-row__name-input"
                placeholder="New board name"
                maxlength="80"
              />
              <button type="submit" class="settings-btn settings-btn--primary" :disabled="!newName || addingBoard">
                {{ addingBoard ? 'Adding…' : 'Add board' }}
              </button>

              <!-- Color picker for the new-board row -->
              <div
                v-if="pickerOpenFor === 'new'"
                class="board-row__picker"
                @click.stop
              >
                <p class="board-row__picker-label">Pick a color</p>
                <div class="board-row__palette">
                  <button
                    v-for="hex in PALETTE"
                    :key="hex"
                    type="button"
                    class="board-row__palette-swatch"
                    :class="{ 'board-row__palette-swatch--active': newColor === hex }"
                    :style="{ background: hex }"
                    :aria-label="hex"
                    @click="setNewColor(hex)"
                  />
                  <button
                    type="button"
                    class="board-row__palette-swatch board-row__palette-swatch--clear"
                    :class="{ 'board-row__palette-swatch--active': !newColor }"
                    title="Auto color"
                    @click="setNewColor(null)"
                  >
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12L12 2"/></svg>
                  </button>
                </div>
              </div>
            </form>

            <p v-if="addError" class="settings-card__error">{{ addError }}</p>

            <!-- Existing boards -->
            <div v-if="boards.length" class="board-list">
              <div v-for="board in boards" :key="board.id" class="board-row">
                <button
                  type="button"
                  class="board-row__swatch"
                  :style="swatchStyleFor(board)"
                  :title="board.color || 'Auto color'"
                  @click="openPicker(board.id)"
                >
                  <span v-if="!board.color" class="board-row__swatch-auto">A</span>
                </button>

                <input
                  v-model.trim="editNames[board.id]"
                  class="board-row__name-input"
                  :placeholder="board.name"
                  @blur="commitName(board)"
                  @keydown.enter.prevent="$event.target.blur()"
                />

                <span v-if="rowError[board.id]" class="board-row__error" :title="rowError[board.id]">{{ rowError[board.id] }}</span>

                <button
                  class="settings-btn settings-btn--ghost-danger"
                  type="button"
                  :disabled="deletingId === board.id"
                  @click="handleDelete(board)"
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4l1 9a1 1 0 001 1h2a1 1 0 001-1l1-9" />
                  </svg>
                </button>

                <!-- Color picker popover (inline, anchored to this row) -->
                <div
                  v-if="pickerOpenFor === board.id"
                  class="board-row__picker"
                  @click.stop
                >
                  <p class="board-row__picker-label">Pick a color</p>
                  <div class="board-row__palette">
                    <button
                      v-for="hex in PALETTE"
                      :key="hex"
                      type="button"
                      class="board-row__palette-swatch"
                      :class="{ 'board-row__palette-swatch--active': board.color === hex }"
                      :style="{ background: hex }"
                      :aria-label="hex"
                      @click="setColor(board, hex)"
                    />
                    <button
                      type="button"
                      class="board-row__palette-swatch board-row__palette-swatch--clear"
                      :class="{ 'board-row__palette-swatch--active': !board.color }"
                      title="Auto color"
                      @click="setColor(board, null)"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M2 12L12 2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="!boardsLoading" class="settings-card__empty">
              No boards yet. Add your first board above.
            </div>
          </div>
        </section>

        <!-- ── AI defaults ──────────────────────────────────────────────── -->
        <section v-show="activeSection === 'ai'" class="settings-card">
          <header class="settings-card__head">
            <div>
              <h2 class="settings-card__title">AI Metadata Generation defaults</h2>
              <p class="settings-card__hint">These values pre-fill the AI generation modal. You can still override them per run.</p>
            </div>
          </header>

          <form class="settings-card__body settings-card__body--form" @submit.prevent="handleSaveAi">
            <div class="settings-grid">
              <div class="settings-field">
                <label class="settings-field__label">Maximum title length</label>
                <input
                  v-model.number="aiDraft.ai_max_title_length"
                  type="number"
                  class="settings-field__input"
                  min="10"
                  max="255"
                />
                <span class="settings-field__hint">Pinterest hard limit: 100 characters.</span>
              </div>

              <div class="settings-field">
                <label class="settings-field__label">Maximum description length</label>
                <input
                  v-model.number="aiDraft.ai_max_description_length"
                  type="number"
                  class="settings-field__input"
                  min="10"
                  max="800"
                />
                <span class="settings-field__hint">Pinterest hard limit: 500 characters.</span>
              </div>

              <div class="settings-field">
                <label class="settings-field__label">Default tone / style</label>
                <input
                  v-model="aiDraft.ai_default_tone"
                  class="settings-field__input"
                  placeholder="e.g. inspiring, minimal, playful"
                />
              </div>

              <div class="settings-field">
                <label class="settings-field__label">Default language</label>
                <select v-model="aiDraft.ai_default_language" class="settings-field__input">
                  <option>English</option>
                  <option>German</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>Italian</option>
                  <option>Dutch</option>
                </select>
              </div>
            </div>

            <div class="settings-field settings-field--full">
              <label class="settings-field__label">Additional instructions</label>
              <textarea
                v-model="aiDraft.ai_additional_instructions"
                class="settings-field__input settings-field__input--textarea"
                rows="4"
                placeholder="e.g. Do not use characters like '-' when generating titles and descriptions."
              />
              <span class="settings-field__hint">Free-form guidance appended to every AI generation request.</span>
            </div>

            <div class="settings-card__footer">
              <button type="submit" class="settings-btn settings-btn--primary" :disabled="!aiDirty || savingAi">
                {{ savingAi ? 'Saving…' : 'Save changes' }}
              </button>
              <button type="button" class="settings-btn" :disabled="!aiDirty || savingAi" @click="resetAiDraft">
                Discard
              </button>
              <span v-if="aiSaved" class="settings-card__status settings-card__status--ok">Saved</span>
              <span v-if="aiError" class="settings-card__status settings-card__status--err">{{ aiError }}</span>
            </div>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'metadata' })

// ── State ─────────────────────────────────────────────────────────────────────
// Must match FALLBACK_PALETTE in usePinterestBoards.js and FALLBACK_COLORS in dashboard.vue.
const PALETTE = [
  '#ff6b35',
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
]

const sections = [
  {
    id: 'boards',
    label: 'Boards',
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 7h12"/></svg>`,
  },
  {
    id: 'ai',
    label: 'AI Defaults',
    icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1.5l1.6 3.4 3.4 1.6-3.4 1.6L8 11.5 6.4 8.1 3 6.5l3.4-1.6z"/><path d="M12 11.5l.7 1.4 1.3.6-1.3.6-.7 1.4-.7-1.4-1.3-.6 1.3-.6z"/></svg>`,
  },
]

const activeSection = ref('boards')

// ── Boards ────────────────────────────────────────────────────────────────────
const {
  boards,
  loading: boardsLoading,
  loadBoards,
  addBoard,
  updateBoard,
  deleteBoard,
  chipStyleForName,
} = usePinterestBoards()

const newName = ref('')
const newColor = ref(null)
const addingBoard = ref(false)
const addError = ref('')
const deletingId = ref(null)

// Per-row editable name + per-row inline error
const editNames = reactive({})
const rowError = reactive({})

// Which row has its color picker open ('new', a board id, or null)
const pickerOpenFor = ref(null)

watch(boards, (list) => {
  for (const b of list) {
    if (editNames[b.id] === undefined) editNames[b.id] = b.name
  }
}, { deep: false, immediate: true })

const newSwatchStyle = computed(() => {
  if (newColor.value) return { background: newColor.value }
  return { background: '#f3f4f6', color: '#9ca3af' }
})

function swatchStyleFor(board) {
  if (board.color) return { background: board.color }
  const style = chipStyleForName(board.name)
  return style ? { background: style.background } : { background: '#f3f4f6' }
}

function openPicker(id) {
  pickerOpenFor.value = pickerOpenFor.value === id ? null : id
}

function setNewColor(hex) {
  newColor.value = hex
  pickerOpenFor.value = null
}

async function setColor(board, color) {
  pickerOpenFor.value = null
  rowError[board.id] = ''
  try {
    await updateBoard(board.id, { color })
  } catch (e) {
    rowError[board.id] = e?.data?.statusMessage ?? 'Could not save color'
  }
}

async function commitName(board) {
  const next = (editNames[board.id] ?? '').trim()
  if (!next || next === board.name) {
    editNames[board.id] = board.name
    return
  }
  rowError[board.id] = ''
  try {
    await updateBoard(board.id, { name: next })
  } catch (e) {
    rowError[board.id] = e?.data?.statusMessage ?? 'Could not rename board'
    editNames[board.id] = board.name
  }
}

async function handleAddBoard() {
  addError.value = ''
  if (!newName.value) return
  addingBoard.value = true
  try {
    await addBoard(newName.value, newColor.value)
    newName.value = ''
    newColor.value = null
  } catch (e) {
    addError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not add board'
  } finally {
    addingBoard.value = false
  }
}

async function handleDelete(board) {
  if (!confirm(`Delete board "${board.name}"? This can't be undone.`)) return
  deletingId.value = board.id
  rowError[board.id] = ''
  try {
    await deleteBoard(board.id)
    delete editNames[board.id]
    delete rowError[board.id]
  } catch (e) {
    rowError[board.id] = e?.data?.statusMessage ?? 'Could not delete board'
  } finally {
    deletingId.value = null
  }
}

// ── AI defaults ───────────────────────────────────────────────────────────────
const { settings: aiSettings, load: loadSettings, save: saveSettings } = useMetadataSettings()

const aiDraft = reactive({ ...aiSettings.value })
const savingAi = ref(false)
const aiSaved = ref(false)
const aiError = ref('')

const aiDirty = computed(() => {
  for (const key of Object.keys(aiSettings.value)) {
    if (aiDraft[key] !== aiSettings.value[key]) return true
  }
  return false
})

function syncDraftFromSettings() {
  for (const key of Object.keys(aiSettings.value)) {
    aiDraft[key] = aiSettings.value[key]
  }
}

watch(aiSettings, () => syncDraftFromSettings(), { deep: true })

function resetAiDraft() {
  syncDraftFromSettings()
  aiError.value = ''
}

async function handleSaveAi() {
  savingAi.value = true
  aiError.value = ''
  aiSaved.value = false
  try {
    await saveSettings({ ...aiDraft })
    aiSaved.value = true
    setTimeout(() => { aiSaved.value = false }, 2500)
  } catch (e) {
    aiError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not save settings'
  } finally {
    savingAi.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadBoards(), loadSettings()])
  syncDraftFromSettings()
})

// Close color picker when clicking outside.
onMounted(() => {
  const onDocClick = () => { pickerOpenFor.value = null }
  document.addEventListener('click', onDocClick)
  onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
})
</script>

<style lang="scss" scoped>
.settings-page {
  flex: 1;
  min-height: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f7f7f7;

  &__header {
    flex-shrink: 0;
    padding: 18px 28px 14px;
    background: #fff;
    border-bottom: 1px solid #ececec;
  }

  &__title {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: $color-primary;
  }

  &__subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #6b7280;
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: flex;
    overflow: hidden;
  }

  &__sections-nav {
    flex-shrink: 0;
    width: 200px;
    padding: 18px 14px;
    border-right: 1px solid #ececec;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #fbfbfb;
  }

  &__section-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border: none;
    background: none;
    border-radius: 7px;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    color: #4b5563;
    text-align: left;
    transition: background 0.15s, color 0.15s;

    &:hover { background: #f3f4f6; color: $color-primary; }

    &--active {
      background: color-mix(in srgb, #{$color-accent} 10%, #fff);
      color: $color-primary;
      font-weight: 600;
    }
  }

  &__section-link-icon {
    width: 16px;
    height: 16px;
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(svg) { display: block; }
  }

  &__section-link--active &__section-link-icon { color: $color-accent; }

  &__content {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    padding: 22px 28px 60px;
  }
}

.settings-card {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  max-width: 780px;
  overflow: hidden;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #f3f4f6;
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: $color-primary;
  }

  &__hint {
    margin: 4px 0 0;
    font-size: 12.5px;
    color: #6b7280;
    line-height: 1.5;
  }

  &__count {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    background: #f3f4f6;
    border-radius: 999px;
    padding: 3px 10px;
    letter-spacing: 0.02em;
  }

  &__body {
    padding: 16px 20px;

    &--form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 6px;
  }

  &__empty {
    padding: 24px 4px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
  }

  &__error {
    margin: 0 0 8px;
    padding: 8px 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 7px;
    color: #b91c1c;
    font-size: 12.5px;
  }

  &__status {
    font-size: 12.5px;
    font-weight: 600;

    &--ok  { color: #16a34a; }
    &--err { color: #ef4444; }
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &--full { grid-column: 1 / -1; }

  &__label {
    font-size: 11px;
    font-weight: 700;
    color: #1f2937;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__input {
    width: 100%;
    height: 36px;
    padding: 0 10px;
    border: 1px solid #374151;
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
    background: #fff;
    color: $color-primary;
    box-sizing: border-box;
    transition: border-color 0.15s;

    &:focus { outline: none; border-color: $color-accent; }

    &--textarea {
      height: auto;
      padding: 9px 10px;
      resize: vertical;
      line-height: 1.5;
      font-family: inherit;
    }
  }

  &__hint {
    font-size: 11.5px;
    color: #9ca3af;
  }
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  background: #f9fafb;
  font: inherit;
  font-size: 13px;
  color: $color-primary;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;

  &:hover { background: #f3f4f6; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  &--primary {
    background: $color-accent;
    border-color: $color-accent;
    color: #fff;
    font-weight: 600;

    &:hover { background: color-mix(in srgb, #{$color-accent} 94%, #000); border-color: color-mix(in srgb, #{$color-accent} 94%, #000); }
  }

  &--ghost-danger {
    background: transparent;
    border-color: transparent;
    color: #9ca3af;
    width: 30px;
    height: 30px;
    padding: 0;

    &:hover:not(:disabled) {
      background: #fef2f2;
      border-color: #fecaca;
      color: #b91c1c;
    }
  }
}

// ── Board rows ─────────────────────────────────────────────────────────────────
.board-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.board-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px;
  border-radius: 9px;
  position: relative;
  transition: background 0.12s;

  &:hover { background: #fafafa; }

  &--new {
    background: #fafafa;
    margin-bottom: 12px;
    padding: 10px;
  }

  &__swatch {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1px solid #e5e7eb;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.12s, border-color 0.12s;

    &:hover {
      border-color: #d1d5db;
      transform: scale(1.04);
    }
  }

  &__swatch-auto {
    font-size: 11px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
  }

  &__name-input {
    flex: 1;
    min-width: 0;
    height: 32px;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 7px;
    font: inherit;
    font-size: 13.5px;
    color: $color-primary;
    background: transparent;
    transition: border-color 0.15s, background 0.15s;
    box-sizing: border-box;

    &:hover { background: #fff; border-color: #e5e7eb; }
    &:focus { outline: none; background: #fff; border-color: $color-accent; }
  }

  &--new &__name-input {
    background: #fff;
    border-color: #e5e7eb;
  }

  &__error {
    color: #b91c1c;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 220px;
  }

  &__picker {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 20;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    min-width: 220px;
  }

  &__picker-label {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__palette {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }

  &__palette-swatch {
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
    transition: transform 0.12s, border-color 0.12s;

    &:hover { transform: scale(1.06); }

    &--active {
      border-color: $color-primary;
    }

    &--clear {
      background: #fafafa;
      color: #9ca3af;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
