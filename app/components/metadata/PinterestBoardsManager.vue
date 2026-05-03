<template>
  <div class="boards-modal">
    <div class="boards-modal__header">
      <h3>Pinterest Boards</h3>
      <button class="boards-modal__close" @click="emit('close')">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M1 1l12 12M13 1L1 13" />
        </svg>
      </button>
    </div>

    <div class="boards-modal__body">
      <!-- Add board -->
      <form class="boards-modal__add" @submit.prevent="handleAdd">
        <input
          v-model="newName"
          class="boards-modal__input"
          placeholder="New board name…"
          maxlength="100"
        />
        <button type="submit" class="boards-modal__btn boards-modal__btn--primary" :disabled="!newName.trim() || adding">
          {{ adding ? 'Adding…' : 'Add' }}
        </button>
      </form>
      <p v-if="addError" class="boards-modal__error">{{ addError }}</p>

      <!-- Board list -->
      <div v-if="loading" class="boards-modal__state">Loading…</div>
      <div v-else-if="boards.length === 0" class="boards-modal__state">No boards yet. Add one above.</div>
      <ul v-else class="boards-modal__list">
        <li v-for="board in boards" :key="board.id" class="boards-modal__item">
          <span class="boards-modal__name">{{ board.name }}</span>
          <button
            class="boards-modal__delete"
            :title="deleteErrors[board.id] || 'Delete board'"
            :disabled="deleting === board.id"
            @click="handleDelete(board)"
          >
            <svg v-if="deleting === board.id" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="boards-modal__spin">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <svg v-else width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
          <span v-if="deleteErrors[board.id]" class="boards-modal__item-err">{{ deleteErrors[board.id] }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  boards: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'add', 'delete'])

const newName = ref('')
const adding = ref(false)
const addError = ref(null)
const deleting = ref(null)
const deleteErrors = reactive({})

async function handleAdd() {
  const name = newName.value.trim()
  if (!name) return
  adding.value = true
  addError.value = null
  try {
    await emit('add', name)
    newName.value = ''
  } catch (e) {
    addError.value = e.data?.statusMessage ?? e.message ?? 'Failed to add board'
  } finally {
    adding.value = false
  }
}

async function handleDelete(board) {
  deleting.value = board.id
  delete deleteErrors[board.id]
  try {
    await emit('delete', board.id)
  } catch (e) {
    deleteErrors[board.id] = e.data?.statusMessage ?? e.message ?? 'Delete failed'
  } finally {
    deleting.value = null
  }
}
</script>

<style scoped lang="scss">
.boards-modal {
  background: #fff;
  border-radius: $radius-md;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 75vh;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;
    flex-shrink: 0;

    h3 { margin: 0; font-size: 15px; font-weight: 600; }
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    color: #6b7280;
    padding: 0;

    &:hover { background: #f3f4f6; }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__add {
    display: flex;
    gap: 8px;
  }

  &__input {
    flex: 1;
    height: 34px;
    padding: 0 10px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    background: #fafafa;

    &:focus { outline: none; border-color: $color-accent; background: #fff; }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    height: 34px;
    padding: 0 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;

    &:disabled { opacity: 0.45; cursor: not-allowed; }

    &--primary {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
      font-weight: 600;

      &:hover:not(:disabled) { background: color-mix(in srgb, #{$color-accent} 92%, #000); }
    }
  }

  &__error {
    margin: 0;
    font-size: 12px;
    color: #dc2626;
  }

  &__state {
    font-size: 13px;
    color: #9ca3af;
    text-align: center;
    padding: 16px 0;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 8px;
    background: #f9fafb;
    border: 1px solid #f3f4f6;
    flex-wrap: wrap;
  }

  &__name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: $color-primary;
    min-width: 0;
  }

  &__delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border: 1px solid #fecaca;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    color: #ef4444;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #fef2f2; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }

  &__item-err {
    width: 100%;
    font-size: 11px;
    color: #dc2626;
  }

  &__spin {
    animation: boards-spin 0.9s linear infinite;
  }

  @keyframes boards-spin {
    to { transform: rotate(360deg); }
  }
}
</style>
