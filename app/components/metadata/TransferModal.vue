<template>
  <div class="xfer">
    <header class="xfer__header">
      <div class="xfer__heading">
        <span class="xfer__heading-icon" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6Z" />
            <path d="M9 11h6M12 8l3 3-3 3" />
          </svg>
        </span>
        <h3 class="xfer__title">Move or copy {{ count }} image{{ count !== 1 ? 's' : '' }}</h3>
      </div>
      <button class="xfer__close" type="button" title="Close" :disabled="busy" @click="$emit('close')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13" /></svg>
      </button>
    </header>

    <div class="xfer__body">
      <!-- Mode picker -->
      <fieldset class="xfer__field">
        <legend class="xfer__legend">Action</legend>
        <div class="xfer__modes">
          <label class="xfer__mode" :class="{ 'xfer__mode--on': mode === 'move' }">
            <input v-model="mode" type="radio" value="move" :disabled="busy" />
            <span class="xfer__mode-body">
              <span class="xfer__mode-title">Move</span>
              <span class="xfer__mode-sub">Remove from <strong>{{ sourceName }}</strong> and place in the destination.</span>
            </span>
          </label>
          <label class="xfer__mode" :class="{ 'xfer__mode--on': mode === 'copy' }">
            <input v-model="mode" type="radio" value="copy" :disabled="busy" />
            <span class="xfer__mode-body">
              <span class="xfer__mode-title">Copy</span>
              <span class="xfer__mode-sub">Keep in <strong>{{ sourceName }}</strong> and duplicate into the destination as drafts.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <!-- Fields to carry over -->
      <fieldset class="xfer__field">
        <legend class="xfer__legend">Fields to carry over</legend>
        <div class="xfer__checks">
          <label class="xfer__check" :class="{ 'xfer__check--disabled': busy }">
            <input type="checkbox" v-model="fields.title" :disabled="busy" />
            Title
          </label>
          <label class="xfer__check" :class="{ 'xfer__check--disabled': busy }">
            <input type="checkbox" v-model="fields.description" :disabled="busy" />
            Description
          </label>
          <label class="xfer__check" :class="{ 'xfer__check--disabled': busy }">
            <input type="checkbox" v-model="fields.board" :disabled="busy" />
            Board name
          </label>
          <label class="xfer__check" :class="{ 'xfer__check--disabled': busy }">
            <input type="checkbox" v-model="fields.link" :disabled="busy" />
            Redirect URL
          </label>
          <label class="xfer__check" :class="{ 'xfer__check--disabled': busy }">
            <input type="checkbox" v-model="fields.status" :disabled="busy" />
            Status
          </label>
        </div>

        <!-- Board sub-option: only shown when board is checked -->
        <div v-if="fields.board" class="xfer__board-opts">
          <label class="xfer__board-opt" :class="{ 'xfer__board-opt--on': fields.boardMissing === 'create' }">
            <input type="radio" v-model="fields.boardMissing" value="create" :disabled="busy" />
            <span>
              <span class="xfer__board-opt-title">Create if missing</span>
              <span class="xfer__board-opt-sub">Boards that don't exist in the destination will be created.</span>
            </span>
          </label>
          <label class="xfer__board-opt" :class="{ 'xfer__board-opt--on': fields.boardMissing === 'skip' }">
            <input type="radio" v-model="fields.boardMissing" value="skip" :disabled="busy" />
            <span>
              <span class="xfer__board-opt-title">Skip if missing</span>
              <span class="xfer__board-opt-sub">Images whose board doesn't exist in the destination will have no board set.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <!-- Destination -->
      <div class="xfer__field">
        <label class="xfer__legend" for="xfer-dest">Destination project</label>
        <select
          id="xfer-dest"
          v-model="targetId"
          class="xfer__select"
          :disabled="busy || targets.length === 0"
        >
          <option v-if="targets.length === 0" value="">No other projects available</option>
          <option v-for="p in targets" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <p v-if="targets.length === 0" class="xfer__hint xfer__hint--warn">
          Create another project from the sidebar switcher first, then come back here.
        </p>
        <p v-else-if="mode === 'copy'" class="xfer__hint">
          Copies start as drafts (no exported / published timestamps) so they don't collide
          with the source's posting history. Board names are preserved as-is — if the
          destination doesn't have the same boards, they'll show as plain text until you
          add them.
        </p>
        <p v-else class="xfer__hint">
          Moves leave nothing behind in <strong>{{ sourceName }}</strong>. Board names are
          preserved as-is.
        </p>
      </div>

      <p v-if="errMsg" class="xfer__err">{{ errMsg }}</p>
    </div>

    <footer class="xfer__footer">
      <button
        class="xfer__btn xfer__btn--primary"
        type="button"
        :disabled="!canSubmit"
        @click="onConfirm"
      >
        <span v-if="busy">Working…</span>
        <span v-else>{{ mode === 'move' ? 'Move' : 'Copy' }} {{ count }} → {{ targetName || '…' }}</span>
      </button>
      <button class="xfer__btn" type="button" :disabled="busy" @click="$emit('close')">Cancel</button>
    </footer>
  </div>
</template>

<script setup>
const props = defineProps({
  count:           { type: Number,  required: true },
  projects:        { type: Array,   required: true }, // full project list
  activeProjectId: { type: String,  default: '' },
  busy:            { type: Boolean, default: false },
  errMsg:          { type: String,  default: '' },
})

const emit = defineEmits(['close', 'confirm'])

const mode     = ref('move')
const targetId = ref('')
const fields   = reactive({ title: true, description: true, board: true, boardMissing: 'create', link: true, status: true })

const targets = computed(() =>
  (props.projects ?? []).filter(p => p.id !== props.activeProjectId),
)

const sourceName = computed(() =>
  props.projects.find(p => p.id === props.activeProjectId)?.name ?? 'this project',
)
const targetName = computed(() =>
  props.projects.find(p => p.id === targetId.value)?.name ?? '',
)

const canSubmit = computed(() =>
  !props.busy && !!targetId.value && targets.value.length > 0,
)

// Default to the first available destination so the user can confirm immediately.
watchEffect(() => {
  if (!targetId.value && targets.value.length > 0) {
    targetId.value = targets.value[0].id
  }
})

function onConfirm() {
  if (!canSubmit.value) return
  emit('confirm', { mode: mode.value, targetProjectId: targetId.value, fields: { ...fields } })
}
</script>

<style scoped lang="scss">
.xfer {
  width: min(480px, 92vw);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid #f1f1f1;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__heading-icon {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: color-mix(in srgb, #{$color-accent} 12%, #fff);
    color: $color-accent;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 14.5px;
    font-weight: 700;
    color: $color-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__close {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #ececec;
    background: #fff;
    border-radius: 7px;
    color: #6b7280;
    cursor: pointer;
    flex-shrink: 0;

    &:hover { background: #f3f4f6; color: $color-primary; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  &__body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__field {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__legend {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    padding: 0;
    margin: 0;
  }

  &__modes {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__mode {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid #ececec;
    border-radius: 9px;
    background: #fafafa;
    cursor: pointer;
    transition: background 0.14s, border-color 0.14s;

    input { margin-top: 3px; accent-color: $color-accent; cursor: pointer; }
    &:hover { background: #f3f4f6; }
    &--on {
      background: color-mix(in srgb, #{$color-accent} 7%, #fff);
      border-color: color-mix(in srgb, #{$color-accent} 45%, #fff);
    }
  }

  &__mode-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  &__mode-title { font-size: 13px; font-weight: 600; color: $color-primary; }
  &__mode-sub { font-size: 12px; color: #6b7280; line-height: 1.4; }

  &__checks {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
  }

  &__check {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: $color-primary;
    cursor: pointer;
    user-select: none;

    input { accent-color: $color-accent; cursor: pointer; }
    &--disabled { opacity: 0.5; cursor: not-allowed; input { cursor: not-allowed; } }
  }

  &__board-opts {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-left: 20px;
    padding-left: 12px;
    border-left: 2px solid #e5e7eb;
  }

  &__board-opt {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid #ececec;
    border-radius: 8px;
    background: #fafafa;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;

    input { margin-top: 2px; accent-color: $color-accent; cursor: pointer; flex-shrink: 0; }
    &:hover { background: #f3f4f6; }
    &--on {
      background: color-mix(in srgb, #{$color-accent} 7%, #fff);
      border-color: color-mix(in srgb, #{$color-accent} 40%, #fff);
    }
  }

  &__board-opt-title { display: block; font-size: 12.5px; font-weight: 600; color: $color-primary; }
  &__board-opt-sub   { display: block; font-size: 11.5px; color: #6b7280; line-height: 1.4; margin-top: 1px; }

  &__select {
    width: 100%;
    height: 36px;
    padding: 0 28px 0 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    background-color: #f9fafb;
    color: $color-primary;
    appearance: none;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path fill='none' stroke='%236b7280' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' d='M2 4l3 3 3-3'/></svg>");
    background-repeat: no-repeat;
    background-position: right 10px center;
    cursor: pointer;

    &:focus { outline: none; border-color: $color-accent; background-color: #fff; }
    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }

  &__hint {
    margin: 0;
    font-size: 12px;
    color: #6b7280;
    line-height: 1.45;

    &--warn { color: #92400e; }
  }

  &__err {
    margin: 0;
    padding: 8px 10px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 7px;
    font-size: 12.5px;
    color: #b91c1c;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid #f1f1f1;
    background: #fafafa;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    height: 34px;
    padding: 0 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #fff;
    font: inherit;
    font-size: 13px;
    color: $color-primary;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: #f3f4f6; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }

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
  }
}
</style>
