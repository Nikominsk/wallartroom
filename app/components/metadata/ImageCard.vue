<template>
  <article
    class="img-card"
    :class="{
      'img-card--selected': selected,
      'img-card--active': active,
      'img-card--focused': focused,
    }"
    @click="$emit('card-click', $event)"
  >
    <span v-if="unsaved" class="img-card__unsaved-dot" title="Unsaved changes" />
    <label class="img-card__checkbox" @click.stop>
      <input type="checkbox" :checked="selected" @change="$emit('toggle-select')" />
      <span class="img-card__check-box" />
    </label>

    <div class="img-card__image">
      <img
        v-if="image.thumbnailUrl || image.mediaUrl"
        :src="image.thumbnailUrl || image.mediaUrl"
        :alt="image.filename"
        loading="lazy"
      />
      <div v-else class="img-card__placeholder">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    </div>

    <div class="img-card__info">
      <span class="img-card__name" :title="image.filename">{{ image.filename }}</span>
      <div class="img-card__indicators">
        <span
          class="img-card__dot"
          :class="pinterestComplete ? 'img-card__dot--ok' : 'img-card__dot--warn'"
          title="Pinterest metadata"
        >P</span>
        <span
          class="img-card__dot"
          :class="adobeStockComplete ? 'img-card__dot--ok' : 'img-card__dot--warn'"
          title="Adobe Stock metadata"
        >A</span>
        <span
          class="img-card__dot img-card__dot--icon"
          :class="image.pinterest.publishDate ? 'img-card__dot--date' : 'img-card__dot--none'"
          title="Pinterest publish date"
        >
          <svg width="7" height="7" viewBox="0 0 12 12" fill="currentColor">
            <path d="M9 1V0H8v1H4V0H3v1H1a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1V2a1 1 0 00-1-1H9zM1 4h10v7H1V4zm2 2h1v1H3V6zm2 0h1v1H5V6zm2 0h1v1H7V6z"/>
          </svg>
        </span>
        <span
          class="img-card__dot img-card__dot--icon"
          :class="image.adobeStock.publishDate ? 'img-card__dot--date' : 'img-card__dot--none'"
          title="Adobe Stock publish date"
        >
          <svg width="7" height="7" viewBox="0 0 12 12" fill="currentColor">
            <path d="M9 1V0H8v1H4V0H3v1H1a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1V2a1 1 0 00-1-1H9zM1 4h10v7H1V4zm2 2h1v1H3V6zm2 0h1v1H5V6zm2 0h1v1H7V6z"/>
          </svg>
        </span>
        <span v-if="image.pinterest.exportedAt" class="img-card__badge img-card__badge--exported">EXP</span>
        <span v-if="image.pinterest.publishedAt" class="img-card__badge img-card__badge--published">PUB</span>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  image: Object,
  selected: Boolean,
  active: Boolean,
  focused: Boolean,
  unsaved: Boolean,
  pinterestComplete: Boolean,
  adobeStockComplete: Boolean,
})
defineEmits(['card-click', 'toggle-select'])
</script>

<style scoped lang="scss">
.img-card {
  position: relative;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.07);
  }

  &--selected {
    border-color: $color-accent !important;
    box-shadow: 0 0 0 2px rgba($color-accent, 0.15) !important;
  }

  &--active {
    border-color: color-mix(in srgb, #{$color-accent} 92%, #000) !important;
  }

  &--focused:not(&--selected):not(&--active) {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
  }

  &__checkbox {
    position: absolute;
    top: 5px;
    left: 5px;
    z-index: 2;
    cursor: pointer;

    input[type='checkbox'] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;

      &:checked + .img-card__check-box {
        background: $color-accent;
        border-color: $color-accent;

        &::after {
          opacity: 1;
        }
      }
    }
  }

  &__check-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    background: rgba(255, 255, 255, 0.92);
    border: 2px solid #d1d5db;
    border-radius: 4px;
    backdrop-filter: blur(4px);
    transition: background 0.15s ease, border-color 0.15s ease;

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

  &__image {
    aspect-ratio: 3 / 4;
    background: #f3f4f6;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  }

  &__unsaved-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f97316;
    border: 1.5px solid #fff;
    z-index: 3;
  }

  &__placeholder {
    color: #d1d5db;
  }

  &__info {
    padding: 5px 7px 6px;
    border-top: 1px solid #f3f4f6;
  }

  &__name {
    display: block;
    font-size: 10px;
    color: $color-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
    line-height: 1.3;
  }

  &__indicators {
    display: flex;
    align-items: center;
    gap: 3px;
    flex-wrap: wrap;
  }

  &__dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border-radius: 3px;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0;

    &--ok   { background: #dcfce7; color: #16a34a; }
    &--warn { background: #fef3c7; color: #d97706; }
    &--date { background: #dbeafe; color: #2563eb; }
    &--none { background: #f3f4f6; color: #9ca3af; }
    &--icon { font-size: 7px; }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    height: 13px;
    padding: 0 4px;
    border-radius: 3px;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.03em;

    &--exported  { background: #ede9fe; color: #7c3aed; }
    &--published { background: #d1fae5; color: #059669; }
  }
}
</style>
