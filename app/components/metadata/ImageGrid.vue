<template>
  <div class="img-grid">
    <p v-if="images.length === 0" class="img-grid__empty">
      No images match the current filters.
    </p>
    <MetadataImageCard
      v-for="(image, index) in images"
      :key="image.id"
      :image="image"
      :selected="selectedIds.has(image.id)"
      :active="activeId === image.id"
      :focused="focusedId === image.id"
      :unsaved="unsavedIds.has(image.id)"
      :pinterest-complete="isPinterestComplete(image)"
      :adobe-stock-complete="isAdobeStockComplete(image)"
      @card-click="$emit('card-click', image.id, index, $event)"
      @toggle-select="$emit('toggle-select', image.id)"
    />
  </div>
</template>

<script setup>
defineProps({
  images: Array,
  selectedIds: Object,
  activeId: String,
  focusedId: String,
  unsavedIds: Object,
  panelOpen: Boolean,
  isPinterestComplete: Function,
  isAdobeStockComplete: Function,
})
defineEmits(['card-click', 'toggle-select'])
</script>

<style scoped lang="scss">
.img-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;

  &__empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 48px 0;
    color: #9ca3af;
    font-size: 14px;
  }

  @media (max-width: 600px) {
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 6px;
  }
}
</style>
