<template>
  <div class="single-form">
    <div class="single-form__tabs">
      <button
        v-for="tab in visibleTabs"
        :key="tab.id"
        class="single-form__tab"
        :class="{
          'single-form__tab--active': activeTab === tab.id,
          'single-form__tab--ai': tab.id === 'ai',
        }"
        @click="activeTab = tab.id"
      >
        <svg v-if="tab.id === 'ai'" class="single-form__ai-bolt" width="11" height="11" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
        </svg>
        <span class="single-form__tab-label">{{ tab.label }}</span>
        <span v-if="tab.id === 'pinterest'" class="single-form__tab-dot"
          :class="isPinterestComplete ? 'single-form__tab-dot--ok' : 'single-form__tab-dot--warn'" />
        <span v-if="tab.id === 'adobe'" class="single-form__tab-dot"
          :class="isAdobeStockComplete ? 'single-form__tab-dot--ok' : 'single-form__tab-dot--warn'" />
      </button>

      <div class="single-form__tab-actions">
        <button
          class="single-form__action-btn single-form__action-btn--save"
          :class="{ 'single-form__action-btn--active': isDirty && !saving }"
          :disabled="!isDirty || saving"
          title="Save changes"
          @click="emit('save')"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 1h8l3 3v9H1V1h1z" />
            <path d="M4 1v4h5V1" />
            <rect x="3" y="8" width="8" height="5" rx="0.5" />
          </svg>
        </button>
        <button
          class="single-form__action-btn single-form__action-btn--discard"
          :disabled="!isDirty || saving"
          title="Discard changes"
          @click="emit('discard')"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11.5 3A6 6 0 1 0 13 7" />
            <path d="M10 1l1.5 2-2 1.5" />
          </svg>
        </button>
        <button
          class="single-form__action-btn single-form__action-btn--delete"
          :disabled="saving"
          title="Delete image"
          @click="emit('delete')"
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3.5h10M5.5 3.5v-1a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M4.5 3.5l.75 8h4.5l.75-8" />
          </svg>
        </button>
      </div>
    </div>

    <div class="single-form__body">
      <!-- General tab -->
      <template v-if="activeTab === 'general'">
        <div class="single-form__field">
          <label class="single-form__label">Filename</label>
          <input class="single-form__input" :value="draft.filename" readonly />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Image ID</label>
          <input class="single-form__input single-form__input--mono" :value="draft.id" readonly />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Media URL</label>
          <input class="single-form__input" :value="draft.mediaUrl" readonly
            @input="update('mediaUrl', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Thumbnail URL</label>
          <input class="single-form__input" :value="draft.thumbnailUrl ?? ''"
            @input="update('thumbnailUrl', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Prompt</label>
          <textarea class="single-form__textarea" rows="3" :value="draft.prompt ?? ''"
            @input="update('prompt', $event.target.value)" />
        </div>
        <div v-if="draft.colors?.length" class="single-form__field">
          <label class="single-form__label">Main colors</label>
          <div class="single-form__colors">
            <div v-for="c in draft.colors" :key="c.hex" class="single-form__color">
              <span class="single-form__swatch" :style="{ background: c.hex }" />
              <span class="single-form__hex">{{ c.hex }}</span>
              <span v-if="c.label" class="single-form__color-label">{{ c.label }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Pinterest tab -->
      <template v-if="activeTab === 'pinterest'">
        <div class="single-form__field">
          <label class="single-form__label single-form__label--req">Title
            <span class="single-form__char-count"
              :class="(draft.pinterest.title?.length ?? 0) > 100 ? 'single-form__char-count--over' : ''">
              {{ draft.pinterest.title?.length ?? 0 }}/100
            </span>
          </label>
          <input class="single-form__input" :value="draft.pinterest.title ?? ''"
            @input="updatePinterest('title', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label single-form__label--req">Description
            <span class="single-form__char-count"
              :class="(draft.pinterest.description?.length ?? 0) > 500 ? 'single-form__char-count--over' : ''">
              {{ draft.pinterest.description?.length ?? 0 }}/500
            </span>
          </label>
          <textarea class="single-form__textarea" rows="4" :value="draft.pinterest.description ?? ''"
            @input="updatePinterest('description', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label single-form__label--req">Pinterest board</label>
          <select
            v-if="boards.length"
            class="single-form__select"
            :value="draft.pinterest.board ?? ''"
            @change="updatePinterest('board', $event.target.value)"
          >
            <option value="">— select board —</option>
            <option v-for="b in boards" :key="b.id" :value="b.name">{{ b.name }}</option>
          </select>
          <input
            v-else
            class="single-form__input"
            :value="draft.pinterest.board ?? ''"
            @input="updatePinterest('board', $event.target.value)"
          />
        </div>
        <div class="single-form__field">
          <label class="single-form__label single-form__label--req">Redirect URL</label>
          <input class="single-form__input" type="url" :value="draft.pinterest.link ?? ''"
            @input="updatePinterest('link', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Pinterest publish date</label>
          <div class="single-form__datetime">
            <input
              class="single-form__input single-form__input--date"
              type="date"
              :value="toDatePart(draft.pinterest.publishDate)"
              @change="onPinDateChange($event.target.value)"
            />
            <select
              class="single-form__select single-form__select--time"
              :value="toTimePart(draft.pinterest.publishDate)"
              :disabled="!draft.pinterest.publishDate"
              @change="onPinTimeChange($event.target.value)"
            >
              <option v-if="!draft.pinterest.publishDate" value="" disabled selected>— time —</option>
              <option v-for="s in TIME_SLOTS_30" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button v-if="draft.pinterest.publishDate" class="single-form__clear-btn" type="button" title="Clear" @click="updatePinterest('publishDate', null)">×</button>
          </div>
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Status</label>
          <select class="single-form__select" :value="draft.pinterest.status ?? 'draft'"
            @change="updatePinterest('status', $event.target.value)">
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="exported">Exported</option>
            <option value="published">Published</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div v-if="draft.pinterest.exportedAt" class="single-form__field">
          <label class="single-form__label">Exported at</label>
          <input class="single-form__input" :value="fmtDate(draft.pinterest.exportedAt)" readonly />
        </div>
        <div v-if="draft.pinterest.publishedAt" class="single-form__field">
          <label class="single-form__label">Published at</label>
          <input class="single-form__input" :value="fmtDate(draft.pinterest.publishedAt)" readonly />
        </div>
      </template>

      <!-- AI Generation tab -->
      <template v-if="activeTab === 'ai' && aiOptions && aiProgress">

        <!-- ── Progress state (running / done / cancelled) ──────────────────── -->
        <template v-if="isAiWorking">
          <div class="ai-panel__progress-bar-wrap">
            <div
              class="ai-panel__progress-fill"
              :style="{ width: `${Math.round((aiProgress.current / Math.max(1, aiProgress.total)) * 100)}%` }"
            />
          </div>
          <div class="ai-panel__progress-meta">
            <span class="ai-panel__progress-label">
              <template v-if="aiProgress.status === 'running'">{{ aiProgress.current }} / {{ aiProgress.total }}</template>
              <template v-else-if="aiProgress.status === 'done'">Complete</template>
              <template v-else>Cancelled</template>
            </span>
            <span class="ai-panel__progress-pct">{{ Math.round((aiProgress.current / Math.max(1, aiProgress.total)) * 100) }}%</span>
          </div>
          <div class="ai-panel__progress-stats">
            <span class="ai-panel__stat ai-panel__stat--ok">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7.5l3 3 7-7"/></svg>
              {{ aiProgress.successCount }} updated
            </span>
            <span class="ai-panel__stat ai-panel__stat--skip">{{ aiProgress.skippedCount }} skipped</span>
            <span v-if="aiProgress.failedCount" class="ai-panel__stat ai-panel__stat--fail">{{ aiProgress.failedCount }} failed</span>
            <span v-if="aiProgress.duplicateRetryCount" class="ai-panel__stat ai-panel__stat--retry">{{ aiProgress.duplicateRetryCount }} retried</span>
          </div>
          <div class="ai-panel__progress-actions">
            <button v-if="aiProgress.status === 'running'" class="ai-panel__btn ai-panel__btn--danger" type="button" @click="emit('ai-cancel')">
              Cancel
            </button>
            <template v-else>
              <button class="ai-panel__btn" type="button" @click="emit('ai-reset-progress')">Configure again</button>
              <button class="ai-panel__btn ai-panel__btn--primary" type="button" @click="activeTab = 'pinterest'">Done</button>
            </template>
          </div>
        </template>

        <!-- ── Configure state ──────────────────────────────────────────────── -->
        <template v-else>

          <!-- 1 · Fields to generate -->
          <div class="ai-panel__section">
            <div class="ai-panel__section-title">
              <span class="ai-panel__step">1</span>
              Fields to generate
            </div>
            <div class="ai-panel__chips">
              <label class="ai-panel__chip" :class="{ 'ai-panel__chip--on': aiOptions.generateFor.pinterestTitle }">
                <input type="checkbox" v-model="aiOptions.generateFor.pinterestTitle" />
                <span>Title</span>
              </label>
              <label class="ai-panel__chip" :class="{ 'ai-panel__chip--on': aiOptions.generateFor.pinterestDescription }">
                <input type="checkbox" v-model="aiOptions.generateFor.pinterestDescription" />
                <span>Description</span>
              </label>
              <label class="ai-panel__chip" :class="{ 'ai-panel__chip--on': aiOptions.generateFor.pinterestBoard, 'ai-panel__chip--disabled': !hasBoardsForAi }">
                <input type="checkbox" v-model="aiOptions.generateFor.pinterestBoard" :disabled="!hasBoardsForAi" />
                <span>Board</span>
              </label>
              <button v-if="!hasBoardsForAi" class="ai-panel__text-link" type="button" @click="emit('manage-boards')">
                Add a board first →
              </button>
            </div>
            <div class="ai-panel__fill-box">
              <label class="ai-panel__check ai-panel__check--strong">
                <input type="checkbox" v-model="aiOptions.skipFilled" />
                <span>Skip images where all selected fields are filled</span>
              </label>
              <div class="ai-panel__radio-row">
                <span class="ai-panel__radio-label">When fields exist:</span>
                <label class="ai-panel__check">
                  <input type="radio" v-model="aiOptions.overwriteMode" value="missing-only" />
                  <span>Fill missing</span>
                </label>
                <label class="ai-panel__check">
                  <input type="radio" v-model="aiOptions.overwriteMode" value="replace" />
                  <span>Replace all</span>
                </label>
              </div>
            </div>
          </div>

          <div class="ai-panel__divider" />

          <!-- 2 · Context -->
          <div class="ai-panel__section">
            <div class="ai-panel__section-title">
              <span class="ai-panel__step">2</span>
              Context
              <span class="ai-panel__optional">optional</span>
            </div>

            <div class="ai-panel__field">
              <label class="ai-panel__label">Additional context</label>
              <textarea
                class="ai-panel__input ai-panel__input--textarea"
                v-model="aiOptions.additionalContext"
                rows="2"
                placeholder="e.g. Digital print shop selling boho wall art."
              />
            </div>

            <div class="ai-panel__row2">
              <div class="ai-panel__field">
                <label class="ai-panel__label">Niche / topic</label>
                <input class="ai-panel__input" v-model="aiOptions.niche" placeholder="e.g. boho living room" />
              </div>
              <div class="ai-panel__field">
                <label class="ai-panel__label">Include keywords</label>
                <input class="ai-panel__input" v-model="aiOptions.includeKeywords" placeholder="keyword1, keyword2" />
              </div>
            </div>

            <div class="ai-panel__checks">
              <label class="ai-panel__check">
                <input type="checkbox" v-model="aiOptions.usePromptAsContext" />
                <span>Use image prompt as context</span>
              </label>
              <label class="ai-panel__check">
                <input type="checkbox" v-model="aiOptions.useColorsAsContext" />
                <span>Use detected colors as context</span>
              </label>
            </div>

            <button class="ai-panel__more-btn" type="button" @click="showAiMore = !showAiMore">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'ai-panel__chevron--open': showAiMore }" class="ai-panel__chevron">
                <path d="M2 4l4 4 4-4" />
              </svg>
              {{ showAiMore ? 'Fewer options' : 'More options' }}
            </button>

            <div v-if="showAiMore" class="ai-panel__row2">
              <div class="ai-panel__field">
                <label class="ai-panel__label">Target audience</label>
                <input class="ai-panel__input" v-model="aiOptions.targetAudience" placeholder="e.g. home decorators" />
              </div>
              <div class="ai-panel__field">
                <label class="ai-panel__label">Exclude keywords</label>
                <input class="ai-panel__input" v-model="aiOptions.excludeKeywords" placeholder="word1, word2" />
              </div>
            </div>
          </div>

          <div class="ai-panel__divider" />

          <!-- 3 · Tone & output -->
          <div class="ai-panel__section">
            <div class="ai-panel__section-title">
              <span class="ai-panel__step">3</span>
              Tone &amp; output
            </div>
            <div class="ai-panel__row2">
              <div class="ai-panel__field">
                <label class="ai-panel__label">Tone / style</label>
                <input class="ai-panel__input" v-model="aiOptions.tone" placeholder="e.g. inspiring" />
              </div>
              <div class="ai-panel__field">
                <label class="ai-panel__label">Language</label>
                <select class="ai-panel__input" v-model="aiOptions.language">
                  <option>English</option>
                  <option>German</option>
                  <option>French</option>
                  <option>Spanish</option>
                  <option>Italian</option>
                  <option>Dutch</option>
                </select>
              </div>
            </div>
            <div class="ai-panel__row2">
              <div class="ai-panel__field">
                <label class="ai-panel__label">Max title length</label>
                <input class="ai-panel__input" type="number" v-model.number="aiOptions.maxPinterestTitleLength" min="10" max="255" />
              </div>
              <div class="ai-panel__field">
                <label class="ai-panel__label">Max description</label>
                <input class="ai-panel__input" type="number" v-model.number="aiOptions.maxPinterestDescriptionLength" min="10" max="800" />
              </div>
            </div>
          </div>

          <!-- Generate button -->
          <button
            class="ai-panel__generate-btn"
            type="button"
            :disabled="!canAiGenerate"
            @click="emit('ai-generate')"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
            </svg>
            Generate
            <span v-if="aiFieldCount" class="ai-panel__generate-meta">{{ aiFieldCount }} field{{ aiFieldCount !== 1 ? 's' : '' }} · {{ aiOverwriteLabel }}</span>
          </button>

        </template>
      </template>

      <!-- Adobe Stock tab -->
      <template v-if="activeTab === 'adobe'">
        <div class="single-form__field">
          <label class="single-form__label">Title
            <span class="single-form__char-count"
              :class="(draft.adobeStock.title?.length ?? 0) > 200 ? 'single-form__char-count--over' : ''">
              {{ draft.adobeStock.title?.length ?? 0 }}/200
            </span>
          </label>
          <input class="single-form__input" :value="draft.adobeStock.title ?? ''"
            @input="updateAdobe('title', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Description
            <span class="single-form__char-count"
              :class="(draft.adobeStock.description?.length ?? 0) > 500 ? 'single-form__char-count--over' : ''">
              {{ draft.adobeStock.description?.length ?? 0 }}/500
            </span>
          </label>
          <textarea class="single-form__textarea" rows="4" :value="draft.adobeStock.description ?? ''"
            @input="updateAdobe('description', $event.target.value)" />
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Keywords
            <span class="single-form__char-count"
              :class="(draft.adobeStock.keywords?.length ?? 0) > 49 ? 'single-form__char-count--over' : ''">
              {{ draft.adobeStock.keywords?.length ?? 0 }}/49
            </span>
          </label>
          <textarea class="single-form__textarea" rows="3"
            :value="(draft.adobeStock.keywords ?? []).join(', ')"
            placeholder="keyword1, keyword2, keyword3..."
            @input="updateAdobe('keywords', $event.target.value.split(',').map(k => k.trim()).filter(Boolean))" />
          <span class="single-form__hint">Comma-separated</span>
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Adobe Stock publish date</label>
          <div class="single-form__datetime">
            <input
              class="single-form__input single-form__input--date"
              type="date"
              :value="toDatePart(draft.adobeStock.publishDate)"
              @change="onAdobeDateChange($event.target.value)"
            />
            <select
              class="single-form__select single-form__select--time"
              :value="toTimePart(draft.adobeStock.publishDate)"
              :disabled="!draft.adobeStock.publishDate"
              @change="onAdobeTimeChange($event.target.value)"
            >
              <option v-if="!draft.adobeStock.publishDate" value="" disabled selected>— time —</option>
              <option v-for="s in TIME_SLOTS_30" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button v-if="draft.adobeStock.publishDate" class="single-form__clear-btn" type="button" title="Clear" @click="updateAdobe('publishDate', null)">×</button>
          </div>
        </div>
        <div class="single-form__field">
          <label class="single-form__label">Status</label>
          <select class="single-form__select" :value="draft.adobeStock.status ?? 'draft'"
            @change="updateAdobe('status', $event.target.value)">
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
            <option value="scheduled">Scheduled</option>
            <option value="submitted">Submitted</option>
            <option value="error">Error</option>
          </select>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  draft: Object,
  isPinterestComplete: Boolean,
  isAdobeStockComplete: Boolean,
  boards: { type: Array, default: () => [] },
  mode: { type: String, default: 'pinterest' },
  isDirty: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  // AI generation
  aiOptions:  { type: Object, default: null },
  aiProgress: { type: Object, default: null },
})

const emit = defineEmits(['update', 'save', 'discard', 'delete', 'ai-generate', 'ai-cancel', 'ai-reset-progress', 'manage-boards'])

const activeTab = ref(props.mode === 'adobe' ? 'adobe' : 'pinterest')

const tabs = [
  { id: 'general',   label: 'General' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'adobe',     label: 'Adobe Stock' },
  { id: 'ai',        label: 'AI' },
]

// Hide the tab that belongs to the other platform so the user only sees their
// current mode's fields. Switching mode while the panel is open auto-swaps the
// active tab to the one that matches.
const visibleTabs = computed(() => {
  if (props.mode === 'adobe') return tabs.filter(t => t.id !== 'pinterest' && t.id !== 'ai')
  return tabs.filter(t => t.id !== 'adobe')
})

watch(() => props.mode, (newMode) => {
  if (newMode === 'pinterest' && activeTab.value === 'adobe') activeTab.value = 'pinterest'
  if (newMode === 'adobe' && (activeTab.value === 'pinterest' || activeTab.value === 'ai')) activeTab.value = 'adobe'
})

// ── AI tab helpers ────────────────────────────────────────────────────────────
const showAiMore = ref(false)

const hasBoardsForAi = computed(() => props.boards.length > 0)

const aiFieldCount = computed(() => {
  if (!props.aiOptions) return 0
  const g = props.aiOptions.generateFor
  return [g.pinterestTitle, g.pinterestDescription, g.pinterestBoard].filter(Boolean).length
})

const canAiGenerate = computed(() => aiFieldCount.value > 0)

const isAiWorking = computed(() =>
  props.aiProgress?.status === 'running' ||
  props.aiProgress?.status === 'done'    ||
  props.aiProgress?.status === 'cancelled'
)

const aiOverwriteLabel = computed(() =>
  props.aiOptions?.overwriteMode === 'missing-only' ? 'missing fields only' : 'replaces all'
)

function update(key, value) {
  emit('update', { ...props.draft, [key]: value })
}

function updatePinterest(key, value) {
  emit('update', { ...props.draft, pinterest: { ...props.draft.pinterest, [key]: value } })
}

function updateAdobe(key, value) {
  emit('update', { ...props.draft, adobeStock: { ...props.draft.adobeStock, [key]: value } })
}

const TIME_SLOTS_30 = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const hh = String(h).padStart(2, '0')
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return { value: `${hh}:${m}`, label: `${h12}:${m} ${period}` }
})

const pad = n => String(n).padStart(2, '0')

function toDatePart(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  } catch { return '' }
}

function toTimePart(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return `${pad(d.getHours())}:${d.getMinutes() >= 30 ? '30' : '00'}`
  } catch { return '' }
}

function combineDatetime(datePart, timePart) {
  if (!datePart) return null
  try { return new Date(`${datePart}T${timePart || '00:00'}`).toISOString() } catch { return null }
}

function onPinDateChange(datePart) {
  if (!datePart) { updatePinterest('publishDate', null); return }
  updatePinterest('publishDate', combineDatetime(datePart, toTimePart(props.draft.pinterest.publishDate) || '12:00'))
}
function onPinTimeChange(timePart) {
  updatePinterest('publishDate', combineDatetime(toDatePart(props.draft.pinterest.publishDate), timePart))
}
function onAdobeDateChange(datePart) {
  if (!datePart) { updateAdobe('publishDate', null); return }
  updateAdobe('publishDate', combineDatetime(datePart, toTimePart(props.draft.adobeStock.publishDate) || '12:00'))
}
function onAdobeTimeChange(timePart) {
  updateAdobe('publishDate', combineDatetime(toDatePart(props.draft.adobeStock.publishDate), timePart))
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}
</script>

<style scoped lang="scss">
.single-form {
  &__tabs {
    display: flex;
    align-items: center;
    border-bottom: 2px solid #f3f4f6;
    margin-bottom: 16px;
    gap: 2px;
  }

  &__tab-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 3px;
    padding-right: 2px;
    flex-shrink: 0;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 0;
    transition: background 0.12s, color 0.12s, border-color 0.12s;

    &:disabled { opacity: 0.3; cursor: not-allowed; }

    &--save {
      color: #f97316;
      &:not(:disabled):hover { background: #fff7ed; border-color: #fdba74; color: #ea580c; }
      &--active { color: #f97316; }
    }

    &--discard {
      &:not(:disabled):hover { background: #fefce8; border-color: #fde047; color: #92400e; }
    }

    &--delete {
      &:not(:disabled):hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
    }
  }

  &__tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    background: none;
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    transition: color 0.15s, border-color 0.15s;

    &:hover { color: $color-primary; }

    &--active { color: $color-accent; border-bottom-color: $color-accent; }
  }

  &__tab-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;

    &--ok { background: #16a34a; }
    &--warn { background: #d97706; }
  }

  &__body { display: flex; flex-direction: column; gap: 14px; }

  &__field { display: flex; flex-direction: column; gap: 5px; }

  &__label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 600;
    color: #1f2937;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__char-count {
    font-size: 11px;
    font-weight: 400;
    color: #9ca3af;
    text-transform: none;
    letter-spacing: 0;

    &--over { color: #ef4444; }
  }

  &__input,
  &__select,
  &__textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid #374151;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    background: #fff;
    transition: border-color 0.15s;
    box-sizing: border-box;

    &:focus { outline: none; border-color: $color-accent; }

    &[readonly] { background: #f5f5f5; color: #6b7280; cursor: default; border-color: #d1d5db; }
  }

  &__input--mono { font-family: monospace; font-size: 11px; }

  &__textarea { resize: vertical; line-height: 1.5; }

  &__hint { font-size: 11px; color: #9ca3af; }

  &__datetime {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  &__input--date { flex: 1; min-width: 0; }

  &__select--time {
    width: 108px;
    flex-shrink: 0;
    padding: 8px 6px;
    border: 1px solid #374151;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    background: #fff;
    box-sizing: border-box;
    cursor: pointer;

    &:focus { outline: none; border-color: $color-accent; }
    &:disabled { color: #9ca3af; cursor: default; background: #f5f5f5; border-color: #d1d5db; }
  }

  &__clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 36px;
    flex-shrink: 0;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
    color: #6b7280;
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s, border-color 0.15s, color 0.15s;

    &:hover { background: #fee2e2; border-color: #fecaca; color: #ef4444; }
  }

  &__colors { display: flex; flex-wrap: wrap; gap: 8px; }

  &__color {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    font-size: 12px;
  }

  &__swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
  }

  &__hex { font-family: monospace; color: #374151; }

  &__color-label { color: #6b7280; }

  // ── AI tab button ────────────────────────────────────────────────────────────

  &__tab--ai {
    gap: 5px;

    .single-form__ai-bolt {
      color: $color-accent;
      opacity: 0.55;
      flex-shrink: 0;
      transition: opacity 0.15s;
    }

    &.single-form__tab--active .single-form__ai-bolt { opacity: 1; }

    &:hover .single-form__ai-bolt { opacity: 0.85; }
  }
}

// ── AI generation panel (inside single-form__body) ───────────────────────────
// Uses flat BEM class names (no parent selector) so scoped styles don't bleed.

.ai-panel {

  // ── Sections ──────────────────────────────────────────────────────────────

  &__section {
    display: flex;
    flex-direction: column;
    gap: 11px;
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: $color-primary;
    letter-spacing: -0.005em;
  }

  &__step {
    flex-shrink: 0;
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: color-mix(in srgb, #{$color-accent} 12%, #fff);
    color: $color-accent;
    font-size: 10px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__optional {
    font-size: 11px;
    font-weight: 500;
    color: #9ca3af;
    letter-spacing: 0;
  }

  &__divider {
    height: 1px;
    background: #f3f4f6;
  }

  // ── Field chips ────────────────────────────────────────────────────────────

  &__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px 4px 8px;
    border: 1.5px solid #e5e7eb;
    background: #fff;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, color 0.15s;
    user-select: none;

    input { display: none; }

    &:hover:not(.ai-panel__chip--disabled) {
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

  &__text-link {
    border: none;
    background: none;
    color: $color-accent;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
    padding: 0 2px;
    &:hover { text-decoration: underline; }
  }

  // ── Skip/overwrite box ─────────────────────────────────────────────────────

  &__fill-box {
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 10px 12px;
    background: #fafafa;
    border: 1px solid #f3f4f6;
    border-radius: 8px;
  }

  &__radio-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__radio-label {
    font-size: 11.5px;
    color: #9ca3af;
  }

  // ── Form atoms ─────────────────────────────────────────────────────────────

  &__field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex: 1;
    min-width: 0;
  }

  &__row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: #1f2937;
    letter-spacing: 0.01em;
    text-transform: uppercase;
  }

  &__input {
    width: 100%;
    height: 32px;
    padding: 0 9px;
    border: 1px solid #374151;
    border-radius: 7px;
    font: inherit;
    font-size: 12.5px;
    background: #fff;
    color: $color-primary;
    box-sizing: border-box;
    transition: border-color 0.15s;

    &:focus { outline: none; border-color: $color-accent; }

    &--textarea {
      height: auto;
      padding: 7px 9px;
      resize: vertical;
      line-height: 1.5;
    }
  }

  &__checks {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__check {
    display: inline-flex;
    align-items: flex-start;
    gap: 7px;
    font-size: 12.5px;
    color: $color-primary;
    cursor: pointer;
    user-select: none;
    line-height: 1.4;

    input {
      accent-color: $color-accent;
      margin: 0;
      flex-shrink: 0;
      margin-top: 2px;
    }

    &--strong { font-weight: 500; }
  }

  // ── "More options" disclosure ──────────────────────────────────────────────

  &__more-btn {
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
    align-self: flex-start;
    transition: color 0.15s;

    &:hover { color: $color-primary; }
  }

  &__chevron {
    transition: transform 0.15s ease;
    &--open { transform: rotate(180deg); }
  }

  // ── Generate button ────────────────────────────────────────────────────────

  &__generate-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 38px;
    padding: 0 16px;
    border: none;
    border-radius: 9px;
    background: $color-accent;
    color: #fff;
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    margin-top: 4px;

    &:hover:not(:disabled) {
      background: color-mix(in srgb, #{$color-accent} 90%, #000);
    }

    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  &__generate-meta {
    font-size: 11.5px;
    font-weight: 500;
    opacity: 0.82;
  }

  // ── Progress state ─────────────────────────────────────────────────────────

  &__progress-bar-wrap {
    height: 4px;
    background: #f3f4f6;
    border-radius: 99px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: $color-accent;
    border-radius: 99px;
    transition: width 0.3s ease;
  }

  &__progress-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__progress-label {
    font-size: 12.5px;
    font-weight: 600;
    color: $color-primary;
  }

  &__progress-pct {
    font-size: 12.5px;
    font-weight: 700;
    color: $color-accent;
  }

  &__progress-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
  }

  &__stat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;

    &--ok    { color: #16a34a; }
    &--skip  { color: #9ca3af; }
    &--fail  { color: #ef4444; }
    &--retry { color: #d97706; }
  }

  &__progress-actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
    padding-top: 6px;
  }

  // ── Shared button atoms ────────────────────────────────────────────────────

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 32px;
    padding: 0 12px;
    border: 1.5px solid #e5e7eb;
    border-radius: 7px;
    background: #fff;
    font: inherit;
    font-size: 12.5px;
    font-weight: 500;
    color: $color-primary;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: #f9fafb; border-color: #d1d5db; }

    &--primary {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
      font-weight: 600;
      &:hover { background: color-mix(in srgb, #{$color-accent} 92%, #000); }
    }

    &--danger {
      background: #fef2f2;
      border-color: #fecaca;
      color: #b91c1c;
      &:hover { background: #fee2e2; }
    }
  }
}
</style>
