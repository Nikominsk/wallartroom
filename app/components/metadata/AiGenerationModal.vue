<template>
  <Teleport to="body">
    <div v-if="open" class="ai-modal" @click.self="handleClose">
      <div class="ai-modal__shell" role="dialog" aria-labelledby="ai-modal-title">

        <!-- ── Header ──────────────────────────────────────────────────── -->
        <header class="ai-modal__head">
          <div class="ai-modal__head-text">
            <span class="ai-modal__eyebrow">AI Generation</span>
            <h2 id="ai-modal-title" class="ai-modal__title">{{ headerTitle }}</h2>
          </div>
          <button
            class="ai-modal__close"
            type="button"
            :title="canClose ? 'Close' : 'Generation running'"
            :disabled="!canClose"
            @click="handleClose"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </header>

        <!-- ── Progress state ──────────────────────────────────────────── -->
        <div v-if="isWorking" class="ai-modal__progress">
          <div class="ai-modal__progress-bar-wrap">
            <div
              class="ai-modal__progress-fill"
              :style="{ width: `${Math.round((progress.current / Math.max(1, progress.total)) * 100)}%` }"
            />
          </div>

          <div class="ai-modal__progress-meta">
            <span class="ai-modal__progress-label">
              <template v-if="progress.status === 'running'">{{ progress.current }} / {{ progress.total }} images</template>
              <template v-else-if="progress.status === 'done'">Complete</template>
              <template v-else>Cancelled</template>
            </span>
            <span class="ai-modal__progress-pct">
              {{ Math.round((progress.current / Math.max(1, progress.total)) * 100) }}%
            </span>
          </div>

          <div class="ai-modal__progress-stats">
            <span class="ai-modal__stat ai-modal__stat--ok">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5l3 3 7-7"/></svg>
              {{ progress.successCount }} updated
            </span>
            <span class="ai-modal__stat ai-modal__stat--skip">{{ progress.skippedCount }} skipped</span>
            <span v-if="progress.failedCount" class="ai-modal__stat ai-modal__stat--fail">{{ progress.failedCount }} failed</span>
            <span
              v-if="progress.duplicateRetryCount"
              class="ai-modal__stat ai-modal__stat--retry"
              title="Titles returned as duplicates and re-generated"
            >{{ progress.duplicateRetryCount }} retried</span>
          </div>

          <div class="ai-modal__progress-actions">
            <button v-if="progress.status === 'running'" class="ai-modal__btn ai-modal__btn--danger" type="button" @click="$emit('cancel')">
              Cancel
            </button>
            <template v-else>
              <button class="ai-modal__btn" type="button" @click="$emit('reset-progress')">Configure again</button>
              <button class="ai-modal__btn ai-modal__btn--primary" type="button" @click="handleClose">Close</button>
            </template>
          </div>
        </div>

        <!-- ── Configure state ─────────────────────────────────────────── -->
        <div v-else class="ai-modal__body">

          <!-- ── Templates bar ──────────────────────────────────────────── -->
          <div v-if="templates.length || loaded" class="ai-modal__tpl-bar">
            <select
              v-model="selectedTplId"
              class="ai-modal__tpl-select"
              :disabled="!templates.length"
            >
              <option value="">{{ templates.length ? 'Select template…' : 'No templates yet' }}</option>
              <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
            </select>
            <button
              class="ai-modal__tpl-btn"
              type="button"
              :disabled="!selectedTplId"
              @click="applyTemplate"
            >Load</button>

            <span class="ai-modal__tpl-sep" />

            <template v-if="showSaveForm">
              <input
                ref="saveNameInput"
                v-model="saveName"
                class="ai-modal__tpl-name-input"
                type="text"
                placeholder="Template name…"
                maxlength="100"
                @keydown.enter.prevent="saveAsTemplate"
                @keydown.esc="showSaveForm = false; saveName = ''"
              />
              <button
                class="ai-modal__tpl-btn ai-modal__tpl-btn--primary"
                type="button"
                :disabled="!saveName.trim() || saving"
                @click="saveAsTemplate"
              >{{ saving ? '…' : 'Save' }}</button>
              <button
                class="ai-modal__tpl-cancel"
                type="button"
                @click="showSaveForm = false; saveName = ''"
              >
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
              </button>
            </template>
            <button
              v-else
              class="ai-modal__tpl-save-as"
              type="button"
              @click="openSaveForm"
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v10M3 8h10"/></svg>
              Save as template
            </button>
            <span v-if="saveError" class="ai-modal__tpl-err">{{ saveError }}</span>
          </div>

          <!-- 1 · Fields -->
          <section class="ai-modal__section">
            <h3 class="ai-modal__section-title">
              <span class="ai-modal__step-num">1</span>
              Fields to generate
            </h3>

            <div class="ai-modal__chips">
              <label
                class="ai-modal__chip"
                :class="{ 'ai-modal__chip--on': options.generateFor.pinterestTitle }"
              >
                <input type="checkbox" v-model="options.generateFor.pinterestTitle" />
                <span>Title</span>
              </label>
              <label
                class="ai-modal__chip"
                :class="{ 'ai-modal__chip--on': options.generateFor.pinterestDescription }"
              >
                <input type="checkbox" v-model="options.generateFor.pinterestDescription" />
                <span>Description</span>
              </label>
              <label
                class="ai-modal__chip"
                :class="{
                  'ai-modal__chip--on': options.generateFor.pinterestBoard,
                  'ai-modal__chip--disabled': !hasBoardsConfigured,
                }"
              >
                <input type="checkbox" v-model="options.generateFor.pinterestBoard" :disabled="!hasBoardsConfigured" />
                <span>Board</span>
              </label>
              <button v-if="!hasBoardsConfigured" class="ai-modal__inline-link" type="button" @click="$emit('manage-boards')">
                Add a board first →
              </button>
            </div>

            <div class="ai-modal__fill-group">
              <label class="ai-modal__check ai-modal__check--prominent">
                <input type="checkbox" v-model="options.skipFilled" />
                <span>Skip images where all selected fields are already filled</span>
              </label>

              <div class="ai-modal__overwrite-row">
                <span class="ai-modal__overwrite-label">When fields exist:</span>
                <label class="ai-modal__radio">
                  <input type="radio" v-model="options.overwriteMode" value="missing-only" />
                  <span>Fill missing only</span>
                </label>
                <label class="ai-modal__radio">
                  <input type="radio" v-model="options.overwriteMode" value="replace" />
                  <span>Replace all</span>
                </label>
              </div>
            </div>
          </section>

          <div class="ai-modal__divider" />

          <!-- 2 · Context -->
          <section class="ai-modal__section">
            <h3 class="ai-modal__section-title">
              <span class="ai-modal__step-num">2</span>
              Context
              <span class="ai-modal__optional">optional</span>
            </h3>

            <div class="ai-modal__field">
              <label class="ai-modal__label" for="ai-context">Additional context</label>
              <textarea
                id="ai-context"
                class="ai-modal__input ai-modal__input--textarea"
                v-model="options.additionalContext"
                rows="2"
                placeholder="e.g. Digital print shop selling boho-style wall art for modern homes."
              />
            </div>

            <div class="ai-modal__field-row">
              <div class="ai-modal__field">
                <label class="ai-modal__label" for="ai-niche">Niche / topic</label>
                <input id="ai-niche" class="ai-modal__input" v-model="options.niche" placeholder="e.g. boho living room" />
              </div>
              <div class="ai-modal__field">
                <label class="ai-modal__label" for="ai-keywords">Include keywords</label>
                <input id="ai-keywords" class="ai-modal__input" v-model="options.includeKeywords" placeholder="keyword1, keyword2" />
              </div>
            </div>

            <div class="ai-modal__checks">
              <label class="ai-modal__check">
                <input type="checkbox" v-model="options.usePromptAsContext" />
                <span>Use image prompt as context</span>
              </label>
              <label class="ai-modal__check">
                <input type="checkbox" v-model="options.useColorsAsContext" />
                <span>Use detected colors as context</span>
              </label>
            </div>

            <button class="ai-modal__more-btn" type="button" @click="showMore = !showMore">
              <svg
                width="11" height="11" viewBox="0 0 12 12" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                :class="{ 'ai-modal__chevron--open': showMore }"
                class="ai-modal__chevron"
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
              {{ showMore ? 'Fewer options' : 'More options' }}
            </button>

            <div v-if="showMore" class="ai-modal__field-row ai-modal__field-row--more">
              <div class="ai-modal__field">
                <label class="ai-modal__label" for="ai-audience">Target audience</label>
                <input id="ai-audience" class="ai-modal__input" v-model="options.targetAudience" placeholder="e.g. home decorators" />
              </div>
              <div class="ai-modal__field">
                <label class="ai-modal__label" for="ai-exclude">Exclude keywords</label>
                <input id="ai-exclude" class="ai-modal__input" v-model="options.excludeKeywords" placeholder="word1, word2" />
              </div>
            </div>
          </section>

          <div class="ai-modal__divider" />

          <!-- 3 · Tone & output -->
          <section class="ai-modal__section">
            <h3 class="ai-modal__section-title">
              <span class="ai-modal__step-num">3</span>
              Tone &amp; output
            </h3>

            <div class="ai-modal__field-row ai-modal__field-row--4">
              <div class="ai-modal__field">
                <label class="ai-modal__label" for="ai-tone">Tone / style</label>
                <input id="ai-tone" class="ai-modal__input" v-model="options.tone" placeholder="e.g. inspiring" />
              </div>
              <div class="ai-modal__field">
                <label class="ai-modal__label" for="ai-lang">Language</label>
                <select id="ai-lang" class="ai-modal__input" v-model="options.language">
                  <option>English</option>
                  <option>German</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>Italian</option>
                  <option>Dutch</option>
                </select>
              </div>
              <div class="ai-modal__field">
                <label class="ai-modal__label" for="ai-title-len">Max title length</label>
                <input id="ai-title-len" class="ai-modal__input" type="number" v-model.number="options.maxPinterestTitleLength" min="10" max="255" />
              </div>
              <div class="ai-modal__field">
                <label class="ai-modal__label" for="ai-desc-len">Max description</label>
                <input id="ai-desc-len" class="ai-modal__input" type="number" v-model.number="options.maxPinterestDescriptionLength" min="10" max="800" />
              </div>
            </div>
          </section>
        </div>

        <!-- ── Footer ──────────────────────────────────────────────────── -->
        <footer v-if="!isWorking" class="ai-modal__foot">
          <p class="ai-modal__foot-summary">
            <strong>{{ imageCount }}</strong> image{{ imageCount === 1 ? '' : 's' }}
            <template v-if="activeFieldCount"> · {{ activeFieldCount }} field{{ activeFieldCount === 1 ? '' : 's' }}</template>
            <template v-if="overwriteLabel"> · {{ overwriteLabel }}</template>
          </p>
          <div class="ai-modal__foot-actions">
            <button class="ai-modal__btn" type="button" @click="handleClose">Cancel</button>
            <button
              class="ai-modal__btn ai-modal__btn--primary"
              type="button"
              :disabled="!canGenerate"
              @click="$emit('generate')"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
              </svg>
              Generate for {{ imageCount }}
            </button>
          </div>
        </footer>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  open:       { type: Boolean, default: false },
  options:    { type: Object, required: true },
  progress:   { type: Object, required: true },
  imageCount: { type: Number, default: 0 },
  boardCount: { type: Number, default: 0 },
})

const emit = defineEmits(['close', 'generate', 'cancel', 'reset-progress', 'manage-boards'])

const showMore = ref(false)

// ── Templates ─────────────────────────────────────────────────────────────────
const { templates, loaded, load: loadTemplates, create: createTemplate } = useAiTemplates()

const selectedTplId = ref('')
const showSaveForm  = ref(false)
const saveName      = ref('')
const saving        = ref(false)
const saveError     = ref('')
const saveNameInput = ref(null)

watch(() => props.open, (v) => { if (v) loadTemplates() })

function applyTemplate() {
  const tpl = templates.value.find(t => t.id === selectedTplId.value)
  if (!tpl?.options) return
  const o = tpl.options
  for (const [k, v] of Object.entries(o)) {
    if (k === 'generateFor' && v && typeof v === 'object') {
      Object.assign(props.options.generateFor, v)
    } else if (k in props.options) {
      props.options[k] = v
    }
  }
  selectedTplId.value = ''
}

function openSaveForm() {
  showSaveForm.value = true
  saveError.value = ''
  nextTick(() => saveNameInput.value?.focus())
}

async function saveAsTemplate() {
  const name = saveName.value.trim()
  if (!name) return
  saving.value   = true
  saveError.value = ''
  try {
    await createTemplate(name, {
      ...props.options,
      generateFor: { ...props.options.generateFor },
    })
    showSaveForm.value = false
    saveName.value     = ''
  } catch (e) {
    saveError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not save template'
  } finally {
    saving.value = false
  }
}

const hasBoardsConfigured = computed(() => props.boardCount > 0)

const activeFieldCount = computed(() => {
  const g = props.options.generateFor
  return [g.pinterestTitle, g.pinterestDescription, g.pinterestBoard].filter(Boolean).length
})

const canGenerate = computed(() => props.imageCount > 0 && activeFieldCount.value > 0)

const isWorking = computed(() =>
  props.progress.status === 'running'  ||
  props.progress.status === 'done'     ||
  props.progress.status === 'cancelled'
)

const canClose = computed(() => props.progress.status !== 'running')

const headerTitle = computed(() => {
  if (props.progress.status === 'running')   return 'Working…'
  if (props.progress.status === 'done')      return 'Generation complete'
  if (props.progress.status === 'cancelled') return 'Generation cancelled'
  return props.imageCount === 1
    ? 'Generate metadata for 1 image'
    : `Generate metadata for ${props.imageCount} images`
})

const overwriteLabel = computed(() =>
  props.options.overwriteMode === 'missing-only' ? 'missing fields only' : 'replaces all'
)

function handleClose() {
  if (!canClose.value) return
  emit('close')
}
</script>

<style lang="scss" scoped>
// ── Overlay ──────────────────────────────────────────────────────────────────
.ai-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 24px;
  box-sizing: border-box;
  animation: aiModalFadeIn 0.14s ease-out;
}

@keyframes aiModalFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0);   }
}

// ── Shell ─────────────────────────────────────────────────────────────────────
.ai-modal__shell {
  width: 100%;
  max-width: 560px;
  max-height: 88vh;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ── Header ────────────────────────────────────────────────────────────────────
.ai-modal__head {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 18px;
  border-bottom: 1px solid #f3f4f6;
}

.ai-modal__head-text { min-width: 0; }

.ai-modal__eyebrow {
  display: block;
  font-size: 10.5px;
  font-weight: 700;
  color: $color-accent;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  margin-bottom: 3px;
}

.ai-modal__title {
  margin: 0;
  font-size: 15.5px;
  font-weight: 700;
  color: $color-primary;
  letter-spacing: -0.01em;
}

.ai-modal__close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 1px solid #ececec;
  background: #fff;
  color: #9ca3af;
  border-radius: 7px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s, color 0.15s, border-color 0.15s;

  &:hover:not(:disabled) { background: #f3f4f6; color: $color-primary; border-color: #d1d5db; }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
}

// ── Templates bar ─────────────────────────────────────────────────────────────
.ai-modal__tpl-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 22px 0;
  flex-shrink: 0;
}

.ai-modal__tpl-select {
  height: 28px;
  padding: 0 8px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  font: inherit;
  font-size: 12px;
  color: $color-primary;
  background: #fff;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  max-width: 220px;

  &:focus { outline: none; border-color: $color-accent; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.ai-modal__tpl-btn {
  height: 28px;
  padding: 0 10px;
  border: 1.5px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: $color-primary;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.12s, border-color 0.12s;

  &:hover:not(:disabled) { background: #f3f4f6; border-color: #d1d5db; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }

  &--primary {
    background: $color-accent;
    border-color: $color-accent;
    color: #fff;
    &:hover:not(:disabled) { background: color-mix(in srgb, #{$color-accent} 92%, #000); }
  }
}

.ai-modal__tpl-sep {
  width: 1px;
  height: 16px;
  background: #e5e7eb;
  flex-shrink: 0;
  align-self: center;
}

.ai-modal__tpl-name-input {
  height: 28px;
  padding: 0 8px;
  border: 1.5px solid $color-accent;
  border-radius: 6px;
  font: inherit;
  font-size: 12px;
  background: #fff;
  color: $color-primary;
  flex: 1;
  min-width: 120px;
  max-width: 180px;

  &:focus { outline: none; }
}

.ai-modal__tpl-cancel {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 4px;
  flex-shrink: 0;

  &:hover { color: $color-primary; background: #f3f4f6; }
}

.ai-modal__tpl-save-as {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: none;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  padding: 0 2px;
  flex-shrink: 0;
  white-space: nowrap;
  transition: color 0.12s;

  &:hover { color: $color-accent; }
}

.ai-modal__tpl-err {
  width: 100%;
  font-size: 11px;
  color: #dc2626;
}

// ── Body ──────────────────────────────────────────────────────────────────────
.ai-modal__body {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.ai-modal__divider {
  flex-shrink: 0;
  height: 1px;
  background: #f3f4f6;
  margin: 0 22px;
}

// ── Section ───────────────────────────────────────────────────────────────────
.ai-modal__section {
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ai-modal__section-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 700;
  color: $color-primary;
  letter-spacing: -0.005em;
}

.ai-modal__step-num {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: color-mix(in srgb, #{$color-accent} 12%, #fff);
  color: $color-accent;
  font-size: 10.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-modal__optional {
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  letter-spacing: 0;
}

// ── Field chips (section 1) ───────────────────────────────────────────────────
.ai-modal__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
}

.ai-modal__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px 5px 8px;
  border: 1.5px solid #e5e7eb;
  background: #fff;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
  user-select: none;

  input { display: none; }

  &:hover:not(.ai-modal__chip--disabled) {
    border-color: $color-accent;
    color: $color-primary;
  }

  &--on {
    border-color: $color-accent;
    background: color-mix(in srgb, #{$color-accent} 8%, #fff);
    color: $color-primary;
    font-weight: 600;
  }

  &--disabled { opacity: 0.45; cursor: not-allowed; }
}

.ai-modal__inline-link {
  border: none;
  background: none;
  color: $color-accent;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  padding: 0 2px;
  &:hover { text-decoration: underline; }
}

// ── Fill / skip group (section 1) ─────────────────────────────────────────────
.ai-modal__fill-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  background: #fafafa;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
}

.ai-modal__overwrite-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.ai-modal__overwrite-label {
  font-size: 11.5px;
  color: #9ca3af;
}

// ── Form atoms ────────────────────────────────────────────────────────────────
.ai-modal__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  min-width: 0;
}

.ai-modal__field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;

  &--4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
  &--more { margin-top: 4px; }
}

.ai-modal__label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.01em;
}

.ai-modal__input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  border: 1.5px solid #e5e7eb;
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
    padding: 8px 10px;
    resize: vertical;
    line-height: 1.55;
  }
}

.ai-modal__checks {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
}

.ai-modal__check,
.ai-modal__radio {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  color: $color-primary;
  cursor: pointer;
  user-select: none;

  input { accent-color: $color-accent; margin: 0; flex-shrink: 0; }

  &--prominent {
    font-weight: 500;
  }
}

.ai-modal__radio span { font-size: 12.5px; }

// ── "More options" disclosure ─────────────────────────────────────────────────
.ai-modal__more-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: #9ca3af;
  cursor: pointer;
  transition: color 0.15s;
  align-self: flex-start;

  &:hover { color: $color-primary; }
}

.ai-modal__chevron {
  transition: transform 0.15s ease;
  &--open { transform: rotate(180deg); }
}

// ── Footer ────────────────────────────────────────────────────────────────────
.ai-modal__foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  border-top: 1px solid #f3f4f6;
}

.ai-modal__foot-summary {
  margin: 0;
  font-size: 12.5px;
  color: #9ca3af;
  strong { color: $color-primary; font-weight: 700; }
}

.ai-modal__foot-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

// ── Buttons ───────────────────────────────────────────────────────────────────
.ai-modal__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 7px;
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: $color-primary;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s, opacity 0.15s;

  &:hover { background: #f9fafb; border-color: #d1d5db; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }

  &--primary {
    background: $color-accent;
    border-color: $color-accent;
    color: #fff;
    font-weight: 600;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, #{$color-accent} 92%, #000);
      border-color: color-mix(in srgb, #{$color-accent} 92%, #000);
    }
  }

  &--danger {
    background: #fef2f2;
    border-color: #fecaca;
    color: #b91c1c;
    &:hover { background: #fee2e2; }
  }
}

// ── Progress state ────────────────────────────────────────────────────────────
.ai-modal__progress {
  flex: 1;
  padding: 32px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-modal__progress-bar-wrap {
  height: 5px;
  background: #f3f4f6;
  border-radius: 99px;
  overflow: hidden;
}

.ai-modal__progress-fill {
  height: 100%;
  background: $color-accent;
  border-radius: 99px;
  transition: width 0.3s ease;
}

.ai-modal__progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-modal__progress-label {
  font-size: 13px;
  font-weight: 600;
  color: $color-primary;
}

.ai-modal__progress-pct {
  font-size: 13px;
  font-weight: 700;
  color: $color-accent;
}

.ai-modal__progress-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12.5px;
}

.ai-modal__stat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;

  &--ok    { color: #16a34a; }
  &--skip  { color: #9ca3af; }
  &--fail  { color: #ef4444; }
  &--retry { color: #d97706; }
}

.ai-modal__progress-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
}

// ── Responsive ────────────────────────────────────────────────────────────────
@media (max-width: 600px) {
  .ai-modal__field-row       { grid-template-columns: 1fr; }
  .ai-modal__field-row--4    { grid-template-columns: 1fr 1fr; }
  .ai-modal__foot            { flex-direction: column; align-items: stretch; }
  .ai-modal__foot-actions    { justify-content: flex-end; }
}
</style>
