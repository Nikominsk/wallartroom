<template>
  <div class="bulk-form">
    <div class="bulk-form__warning">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
      <span>You are editing <strong>{{ count }} images</strong>. Applied fields may overwrite existing values for all selected images.</span>
    </div>

    <div class="bulk-form__section">
      <h4 class="bulk-form__section-title">Pinterest</h4>

      <BulkField label="Pinterest title" v-model:enabled="spec.pinterestTitle.enabled" v-model:clear="spec.pinterestTitle.clear">
        <input class="bulk-form__input" v-model="spec.pinterestTitle.value" :disabled="!spec.pinterestTitle.enabled" />
      </BulkField>

      <BulkField label="Pinterest description" v-model:enabled="spec.pinterestDescription.enabled" v-model:clear="spec.pinterestDescription.clear">
        <textarea class="bulk-form__textarea" rows="3" v-model="spec.pinterestDescription.value" :disabled="!spec.pinterestDescription.enabled" />
      </BulkField>

      <BulkField label="Pinterest board" v-model:enabled="spec.pinterestBoard.enabled" v-model:clear="spec.pinterestBoard.clear">
        <input class="bulk-form__input" v-model="spec.pinterestBoard.value" :disabled="!spec.pinterestBoard.enabled" />
      </BulkField>

      <BulkField label="Pinterest redirect URL" v-model:enabled="spec.pinterestLink.enabled" v-model:clear="spec.pinterestLink.clear">
        <input class="bulk-form__input" type="url" v-model="spec.pinterestLink.value" :disabled="!spec.pinterestLink.enabled" />
      </BulkField>

      <BulkField label="Pinterest publish date" v-model:enabled="spec.pinterestPublishDate.enabled" v-model:clear="spec.pinterestPublishDate.clear">
        <input class="bulk-form__input" type="datetime-local"
          :value="toDatetimeLocal(spec.pinterestPublishDate.value)"
          :disabled="!spec.pinterestPublishDate.enabled"
          @input="spec.pinterestPublishDate.value = fromDatetimeLocal($event.target.value)" />
      </BulkField>
    </div>

    <div class="bulk-form__section">
      <h4 class="bulk-form__section-title">Adobe Stock</h4>

      <BulkField label="Adobe Stock title" v-model:enabled="spec.adobeStockTitle.enabled" v-model:clear="spec.adobeStockTitle.clear">
        <input class="bulk-form__input" v-model="spec.adobeStockTitle.value" :disabled="!spec.adobeStockTitle.enabled" />
      </BulkField>

      <BulkField label="Adobe Stock description" v-model:enabled="spec.adobeStockDescription.enabled" v-model:clear="spec.adobeStockDescription.clear">
        <textarea class="bulk-form__textarea" rows="3" v-model="spec.adobeStockDescription.value" :disabled="!spec.adobeStockDescription.enabled" />
      </BulkField>

      <BulkField label="Adobe Stock keywords" v-model:enabled="spec.adobeStockKeywords.enabled" v-model:clear="spec.adobeStockKeywords.clear">
        <textarea class="bulk-form__textarea" rows="2"
          :value="spec.adobeStockKeywords.value.join(', ')"
          :disabled="!spec.adobeStockKeywords.enabled"
          placeholder="keyword1, keyword2..."
          @input="spec.adobeStockKeywords.value = $event.target.value.split(',').map(k => k.trim()).filter(Boolean)" />
      </BulkField>

      <BulkField label="Adobe Stock publish date" v-model:enabled="spec.adobeStockPublishDate.enabled" v-model:clear="spec.adobeStockPublishDate.clear">
        <input class="bulk-form__input" type="datetime-local"
          :value="toDatetimeLocal(spec.adobeStockPublishDate.value)"
          :disabled="!spec.adobeStockPublishDate.enabled"
          @input="spec.adobeStockPublishDate.value = fromDatetimeLocal($event.target.value)" />
      </BulkField>
    </div>
  </div>
</template>

<script setup>
defineProps({
  spec: Object,
  count: Number,
})

function toDatetimeLocal(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return '' }
}

function fromDatetimeLocal(val) {
  if (!val) return ''
  return new Date(val).toISOString()
}
</script>

<script>
import { defineComponent, h } from 'vue'

export const BulkField = defineComponent({
  name: 'BulkField',
  props: {
    label: String,
    enabled: Boolean,
    clear: Boolean,
  },
  emits: ['update:enabled', 'update:clear'],
  setup(props, { slots, emit }) {
    return () => h('div', { class: 'bulk-field' }, [
      h('label', { class: 'bulk-field__toggle' }, [
        h('input', {
          type: 'checkbox',
          checked: props.enabled,
          onChange: (e) => emit('update:enabled', e.target.checked),
        }),
        h('span', { class: 'bulk-field__toggle-box' }),
        h('span', { class: 'bulk-field__toggle-label' }, `Apply ${props.label}`),
      ]),
      props.enabled
        ? h('div', { class: 'bulk-field__content' }, [
            slots.default?.(),
            h('label', { class: 'bulk-field__clear' }, [
              h('input', {
                type: 'checkbox',
                checked: props.clear,
                onChange: (e) => emit('update:clear', e.target.checked),
              }),
              h('span', {}, 'Clear this field for all selected images'),
            ]),
          ])
        : null,
    ])
  },
})
</script>

<style scoped lang="scss">
.bulk-form {
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__warning {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px;
    background: #fffbeb;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    font-size: 13px;
    color: #92400e;
    line-height: 1.4;

    svg { flex-shrink: 0; margin-top: 1px; color: #d97706; }
  }

  &__section { display: flex; flex-direction: column; gap: 12px; }

  &__section-title {
    margin: 0 0 4px;
    font-size: 11px;
    font-weight: 700;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding-bottom: 8px;
    border-bottom: 1px solid #f3f4f6;
  }

  &__input,
  &__textarea {
    width: 100%;
    padding: 7px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    background: #fafafa;
    box-sizing: border-box;
    transition: border-color 0.15s;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }

    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  &__textarea { resize: vertical; }
}

:deep(.bulk-field) { display: flex; flex-direction: column; gap: 6px; }

:deep(.bulk-field__toggle) {
  display: flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;

  input[type='checkbox'] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .bulk-field__toggle-box {
      background: $color-accent;
      border-color: $color-accent;

      &::after { opacity: 1; }
    }
  }
}

:deep(.bulk-field__toggle-box) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;

  &::after {
    content: '';
    display: block;
    width: 4px;
    height: 7px;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: rotate(45deg) translateY(-1px);
    opacity: 0;
    transition: opacity 0.1s;
  }
}

:deep(.bulk-field__toggle-label) { font-size: 13px; font-weight: 500; color: $color-primary; }

:deep(.bulk-field__content) { padding-left: 23px; display: flex; flex-direction: column; gap: 6px; }

:deep(.bulk-field__clear) {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #ef4444;
  cursor: pointer;
  user-select: none;

  input[type='checkbox'] { accent-color: #ef4444; }
}
</style>
