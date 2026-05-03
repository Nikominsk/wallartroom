<template>
  <div class="ai-panel">
    <button class="ai-panel__toggle" @click="expanded = !expanded">
      <span class="ai-panel__toggle-icon">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
        </svg>
      </span>
      <span>AI Metadata Generation</span>
      <svg class="ai-panel__chevron" :class="{ 'ai-panel__chevron--open': expanded }" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M3 5l4 4 4-4" />
      </svg>
    </button>

    <div v-if="expanded" class="ai-panel__body">
      <template v-if="progress.status === 'running' || progress.status === 'done' || progress.status === 'cancelled'">
        <div class="ai-panel__progress-header">
          <span v-if="progress.status === 'running'">
            Generating metadata for {{ progress.current }} of {{ progress.total }} images...
          </span>
          <span v-else-if="progress.status === 'done'">Generation complete</span>
          <span v-else>Generation cancelled</span>
        </div>

        <div v-if="progress.total > 0" class="ai-panel__progress-bar">
          <div class="ai-panel__progress-fill"
            :style="{ width: `${Math.round((progress.current / progress.total) * 100)}%` }" />
        </div>

        <div class="ai-panel__progress-stats">
          <span class="ai-panel__stat ai-panel__stat--ok">✓ {{ progress.successCount }} updated</span>
          <span class="ai-panel__stat ai-panel__stat--skip">— {{ progress.skippedCount }} skipped</span>
          <span v-if="progress.failedCount" class="ai-panel__stat ai-panel__stat--fail">✗ {{ progress.failedCount }} failed</span>
        </div>

        <div v-if="progress.status === 'done' || progress.status === 'cancelled'" class="ai-panel__progress-actions">
          <button class="ai-panel__btn ai-panel__btn--ghost" @click="$emit('reset-progress')">
            Reset &amp; configure again
          </button>
        </div>

        <div v-if="progress.status === 'running'" class="ai-panel__progress-actions">
          <button class="ai-panel__btn ai-panel__btn--danger" @click="$emit('cancel')">
            Cancel generation
          </button>
        </div>
      </template>

      <template v-else>
        <div class="ai-panel__section">
          <p class="ai-panel__section-label">Generate for</p>
          <div class="ai-panel__checkboxes">
            <label class="ai-panel__check">
              <input type="checkbox" v-model="options.generateFor.pinterestTitle" />
              Pinterest title
            </label>
            <label class="ai-panel__check">
              <input type="checkbox" v-model="options.generateFor.pinterestDescription" />
              Pinterest description
            </label>
            <div class="ai-panel__check-row">
              <label class="ai-panel__check">
                <input type="checkbox" v-model="options.generateFor.pinterestBoard" :disabled="!hasBoardsConfigured" />
                Pinterest board
              </label>
              <button class="ai-panel__boards-btn" type="button" @click="$emit('manage-boards')">
                Manage boards
              </button>
            </div>
            <label class="ai-panel__check">
              <input type="checkbox" v-model="options.generateFor.adobeStockTitle" />
              Adobe Stock title
            </label>
            <label class="ai-panel__check">
              <input type="checkbox" v-model="options.generateFor.adobeStockDescription" />
              Adobe Stock description
            </label>
            <label class="ai-panel__check">
              <input type="checkbox" v-model="options.generateFor.adobeStockKeywords" />
              Adobe Stock keywords
            </label>
          </div>
        </div>

        <div class="ai-panel__field ai-panel__field--full">
          <label class="ai-panel__label">Additional context</label>
          <textarea
            class="ai-panel__input ai-panel__input--textarea"
            v-model="options.additionalContext"
            rows="3"
            placeholder="e.g. This is a digital print shop selling boho-style wall art for living rooms and nurseries. Our products are instant downloads."
          />
        </div>

        <div class="ai-panel__grid">
          <div class="ai-panel__field">
            <label class="ai-panel__label">Language</label>
            <select class="ai-panel__input" v-model="options.language">
              <option>English</option>
              <option>German</option>
              <option>French</option>
              <option>Spanish</option>
              <option>Italian</option>
              <option>Dutch</option>
            </select>
          </div>
          <div class="ai-panel__field">
            <label class="ai-panel__label">Tone / style</label>
            <input class="ai-panel__input" v-model="options.tone" placeholder="e.g. inspiring, minimal..." />
          </div>
          <div class="ai-panel__field">
            <label class="ai-panel__label">Target audience</label>
            <input class="ai-panel__input" v-model="options.targetAudience" placeholder="e.g. home decorators" />
          </div>
          <div class="ai-panel__field">
            <label class="ai-panel__label">Niche / topic</label>
            <input class="ai-panel__input" v-model="options.niche" placeholder="e.g. boho living room art" />
          </div>
          <div class="ai-panel__field">
            <label class="ai-panel__label">Include keywords</label>
            <input class="ai-panel__input" v-model="options.includeKeywords" placeholder="keyword1, keyword2" />
          </div>
          <div class="ai-panel__field">
            <label class="ai-panel__label">Exclude keywords</label>
            <input class="ai-panel__input" v-model="options.excludeKeywords" placeholder="word1, word2" />
          </div>
        </div>

        <div class="ai-panel__grid ai-panel__grid--sm">
          <div class="ai-panel__field">
            <label class="ai-panel__label">Pin title max chars</label>
            <input class="ai-panel__input" type="number" v-model.number="options.maxPinterestTitleLength" min="10" max="255" />
          </div>
          <div class="ai-panel__field">
            <label class="ai-panel__label">Pin desc max chars</label>
            <input class="ai-panel__input" type="number" v-model.number="options.maxPinterestDescriptionLength" min="10" max="800" />
          </div>
          <div class="ai-panel__field">
            <label class="ai-panel__label">Adobe title max chars</label>
            <input class="ai-panel__input" type="number" v-model.number="options.maxAdobeStockTitleLength" min="10" max="200" />
          </div>
          <div class="ai-panel__field">
            <label class="ai-panel__label">Adobe keyword count</label>
            <input class="ai-panel__input" type="number" v-model.number="options.adobeStockKeywordCount" min="1" max="49" />
          </div>
        </div>

        <div class="ai-panel__section">
          <p class="ai-panel__section-label">Context</p>
          <label class="ai-panel__check">
            <input type="checkbox" v-model="options.usePromptAsContext" />
            Use image prompt as context
          </label>
          <label class="ai-panel__check">
            <input type="checkbox" v-model="options.useColorsAsContext" />
            Use detected colors as context
          </label>
        </div>

        <div class="ai-panel__section">
          <p class="ai-panel__section-label">Overwrite behavior</p>
          <label class="ai-panel__radio">
            <input type="radio" v-model="options.overwriteMode" value="missing-only" />
            Generate only missing fields <span class="ai-panel__recommended">(recommended)</span>
          </label>
          <label class="ai-panel__radio">
            <input type="radio" v-model="options.overwriteMode" value="replace" />
            Replace selected fields
          </label>
        </div>

        <button
          class="ai-panel__btn ai-panel__btn--generate"
          :disabled="!canGenerate"
          @click="$emit('generate')"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
          </svg>
          Generate for {{ imageCount }} image{{ imageCount !== 1 ? 's' : '' }}
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  options: Object,
  progress: Object,
  imageCount: Number,
  boardCount: { type: Number, default: 0 },
})
defineEmits(['generate', 'cancel', 'reset-progress', 'manage-boards'])

const expanded = ref(false)

const hasBoardsConfigured = computed(() => props.boardCount > 0)

const canGenerate = computed(() => {
  const g = props.options.generateFor
  return Object.values(g).some(Boolean) && props.imageCount > 0
})
</script>

<style scoped lang="scss">
.ai-panel {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;

  &__toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 12px 14px;
    border: none;
    background: #f9fafb;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    color: $color-primary;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;

    &:hover { background: #f3f4f6; }
  }

  &__toggle-icon { color: $color-accent; display: flex; }

  &__chevron {
    margin-left: auto;
    transition: transform 0.2s ease;
    color: #9ca3af;

    &--open { transform: rotate(180deg); }
  }

  &__body {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    border-top: 1px solid #f3f4f6;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__section-label {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__checkboxes { display: flex; flex-direction: column; gap: 5px; }

  &__check-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__boards-btn {
    height: 22px;
    padding: 0 8px;
    border: 1px solid #e5e7eb;
    border-radius: 5px;
    background: #f9fafb;
    font: inherit;
    font-size: 11px;
    color: #6b7280;
    cursor: pointer;
    white-space: nowrap;

    &:hover { background: #f3f4f6; color: $color-primary; }
  }

  &__check,
  &__radio {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    cursor: pointer;
    user-select: none;
    color: $color-primary;

    input { accent-color: $color-accent; }
  }

  &__recommended { font-size: 11px; color: #16a34a; font-weight: 600; }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &--full { grid-column: 1 / -1; }
  }

  &__label {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__input {
    width: 100%;
    height: 32px;
    padding: 0 8px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
    background: #fafafa;
    box-sizing: border-box;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }

    &--textarea {
      height: auto;
      padding: 7px 8px;
      resize: vertical;
      line-height: 1.45;
    }
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    border: none;

    &--generate {
      background: $color-accent;
      color: #fff;
      width: 100%;

      &:hover { background: color-mix(in srgb, #{$color-accent} 94%, #000); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    &--ghost {
      background: #f3f4f6;
      color: $color-primary;
      border: 1px solid #e5e7eb;

      &:hover { background: #e5e7eb; }
    }

    &--danger {
      background: #fef2f2;
      color: #ef4444;
      border: 1px solid #fecaca;

      &:hover { background: #fee2e2; }
    }
  }

  &__progress-header { font-size: 13px; font-weight: 600; color: $color-primary; }

  &__progress-bar {
    height: 6px;
    background: #f3f4f6;
    border-radius: 3px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: $color-accent;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  &__progress-stats { display: flex; gap: 12px; flex-wrap: wrap; }

  &__stat {
    font-size: 12px;
    font-weight: 600;

    &--ok { color: #16a34a; }
    &--skip { color: #9ca3af; }
    &--fail { color: #ef4444; }
  }

  &__progress-actions { display: flex; gap: 8px; }
}
</style>
