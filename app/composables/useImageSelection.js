export function useImageSelection() {
  const selectedIds = ref(new Set())

  const selectedCount = computed(() => selectedIds.value.size)

  function isSelected(id) {
    return selectedIds.value.has(id)
  }

  function toggle(id) {
    const next = new Set(selectedIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    selectedIds.value = next
  }

  function selectImages(images) {
    const next = new Set(selectedIds.value)
    images.forEach(img => next.add(img.id))
    selectedIds.value = next
  }

  function clearSelection() {
    selectedIds.value = new Set()
  }

  function selectOnly(id) {
    selectedIds.value = new Set([id])
  }

  return { selectedIds, selectedCount, isSelected, toggle, selectImages, clearSelection, selectOnly }
}
