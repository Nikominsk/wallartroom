<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div
        v-if="state.visible"
        class="confirm-overlay"
        @click.self="_dismiss"
        @keydown.esc.window="_dismiss"
      >
        <div class="confirm-box" role="dialog" aria-modal="true" :aria-labelledby="state.title ? 'confirm-title' : undefined">
          <p v-if="state.title" id="confirm-title" class="confirm-box__title">{{ state.title }}</p>
          <p class="confirm-box__message">{{ state.message }}</p>
          <div class="confirm-box__actions">
            <button
              v-if="state.cancelLabel"
              class="confirm-box__btn confirm-box__btn--cancel"
              autofocus
              @click="_dismiss"
            >{{ state.cancelLabel }}</button>
            <button
              class="confirm-box__btn"
              :class="state.danger ? 'confirm-box__btn--danger' : 'confirm-box__btn--primary'"
              @click="_accept"
            >{{ state.confirmLabel }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const { state, _accept, _dismiss } = useConfirm()
</script>

<style scoped lang="scss">
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.confirm-box {
  background: #fff;
  border-radius: 12px;
  padding: 24px 24px 20px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__title {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: $color-primary;
  }

  &__message {
    margin: 0;
    font-size: 13.5px;
    color: #374151;
    line-height: 1.55;
    white-space: pre-line;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 6px;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    height: 34px;
    padding: 0 16px;
    border-radius: 8px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.12s, border-color 0.12s;

    &--cancel {
      background: #f3f4f6;
      border-color: #e5e7eb;
      color: #374151;

      &:hover { background: #e5e7eb; }
    }

    &--danger {
      background: #ef4444;
      color: #fff;

      &:hover { background: #dc2626; }
    }

    &--primary {
      background: $color-accent;
      color: #fff;

      &:hover { background: color-mix(in srgb, #{$color-accent} 92%, #000); }
    }
  }
}

.confirm-fade-enter-active,
.confirm-fade-leave-active { transition: opacity 0.15s ease; }
.confirm-fade-enter-from,
.confirm-fade-leave-to    { opacity: 0; }
</style>
