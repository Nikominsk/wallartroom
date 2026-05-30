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
      <template v-if="safeImgSrc">
        <img
          :src="safeImgSrc"
          alt=""
          loading="lazy"
          :style="{ opacity: imgLoaded ? 1 : 0 }"
          @load="imgLoaded = true"
          @error="imgLoaded = true"
        />
        <div v-show="!imgLoaded" class="img-card__loading" aria-hidden="true">
          <svg class="img-card__spinner" width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#e5e7eb" stroke-width="2.5"/>
            <path d="M11 3a8 8 0 0 1 8 8" stroke="#9ca3af" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </template>
      <div v-else class="img-card__placeholder">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    </div>

    <div class="img-card__info">
      <div class="img-card__indicators">
        <template v-if="mode === 'pinterest'">
          <!-- Title -->
          <span
            class="img-card__ind"
            :class="image.pinterest.title ? 'img-card__ind--on' : ''"
            :title="image.pinterest.title ? `Title: ${image.pinterest.title}` : 'No title'"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M1.5 2.5h9M6 2.5v7"/>
            </svg>
          </span>
          <!-- Description -->
          <span
            class="img-card__ind"
            :class="image.pinterest.description ? 'img-card__ind--on' : ''"
            title="Description"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M1.5 3h9M1.5 6h9M1.5 9h6"/>
            </svg>
          </span>
          <!-- Board -->
          <span
            class="img-card__ind"
            :class="image.pinterest.board ? 'img-card__ind--on' : ''"
            :title="image.pinterest.board ? `Board: ${image.pinterest.board}` : 'No board'"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 1a2.5 2.5 0 012.5 2.5C8.5 5.5 6 10 6 10S3.5 5.5 3.5 3.5A2.5 2.5 0 016 1z"/>
              <circle cx="6" cy="3.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
          </span>
          <!-- Redirect URL -->
          <span
            class="img-card__ind"
            :class="image.pinterest.link ? 'img-card__ind--on' : ''"
            :title="image.pinterest.link ? `URL: ${image.pinterest.link}` : 'No redirect URL'"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.5 2H2.5A1 1 0 001.5 3v6.5A1 1 0 002.5 10.5H9A1 1 0 0010 9.5V7.5"/>
              <path d="M7 1.5h3.5V5M10.5 1.5L6 6"/>
            </svg>
          </span>
          <!-- Publish date (scheduling) -->
          <span
            class="img-card__ind"
            :class="image.pinterest.publishDate ? 'img-card__ind--date' : ''"
            :title="image.pinterest.publishDate ? `Scheduled: ${image.pinterest.publishDate}` : 'No publish date'"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="2" width="10" height="9" rx="1.5"/>
              <path d="M1 5h10M4 1v2M8 1v2"/>
            </svg>
          </span>
          <!-- Exported -->
          <span
            class="img-card__ind"
            :class="(image.pinterest.exportedAt || image.pinterest.status === 'exported') ? 'img-card__ind--exported' : ''"
            :title="image.pinterest.exportedAt ? 'Exported' : 'Not exported'"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1.5 8.5l3 3 6-6"/>
            </svg>
          </span>
        </template>
        <template v-else>
          <span
            class="img-card__dot"
            :class="adobeStockComplete ? 'img-card__dot--ok' : 'img-card__dot--warn'"
            title="Adobe Stock metadata"
          >A</span>
          <span
            class="img-card__dot img-card__dot--icon"
            :class="image.adobeStock.publishDate ? 'img-card__dot--date' : 'img-card__dot--none'"
            title="Adobe Stock publish date"
          >
            <svg width="7" height="7" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9 1V0H8v1H4V0H3v1H1a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1V2a1 1 0 00-1-1H9zM1 4h10v7H1V4zm2 2h1v1H3V6zm2 0h1v1H5V6zm2 0h1v1H7V6z"/>
            </svg>
          </span>
        </template>
      </div>
    </div>
  </article>
</template>

<script setup>
import { isWellFormedImageUrl } from '~/composables/useImageUrlValidation.js'

const props = defineProps({
  image: Object,
  selected: Boolean,
  active: Boolean,
  focused: Boolean,
  unsaved: Boolean,
  pinterestComplete: Boolean,
  adobeStockComplete: Boolean,
  mode: { type: String, default: 'pinterest' }, // 'pinterest' | 'adobe'
})
defineEmits(['card-click', 'toggle-select'])

// Guard against any URL the dev server would treat as a relative path. Without
// this, junk-prefixed URLs (e.g. dotenvx banner text glued onto an https://...
// URL) become relative requests against localhost and fill the Nuxt log with
// Vue Router 404s during dev.
const safeImgSrc = computed(() => {
  const candidates = [props.image?.thumbnailUrl, props.image?.mediaUrl]
  return candidates.find(isWellFormedImageUrl) ?? null
})

const imgLoaded = ref(false)
watch(safeImgSrc, () => { imgLoaded.value = false })
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
    position: relative;
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
      transition: opacity 0.18s ease;
    }
  }

  &__loading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
  }

  &__spinner {
    animation: img-spin 0.75s linear infinite;
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
    padding: 4px 6px;
    border-top: 1px solid #f3f4f6;
  }

  &__indicators {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  // Icon-based indicators (Pinterest mode)
  &__ind {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: #d1d5db;
    flex-shrink: 0;

    &--on       { color: $color-accent; }
    &--exported { color: #16a34a; }
    &--date     { color: #3b82f6; }
  }

  // Text-badge indicators (Adobe mode, kept)
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
}

@keyframes img-spin {
  to { transform: rotate(360deg); }
}
</style>
