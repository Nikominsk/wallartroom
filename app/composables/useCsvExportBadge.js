// Count of CSV-export history records that haven't been marked "exported" yet.
// Shown as a badge on the sidebar's "CSV Exports" item. Shared (module-level)
// so the workspace can bump it right after a download and the sidebar reflects
// it without a refetch.

const _count = ref(0)

export function useCsvExportBadge() {
  async function refresh() {
    try {
      const { count } = await $fetch('/api/pinterest/csv-exports/unexported-count')
      _count.value = count ?? 0
    } catch {
      /* non-critical — the badge just won't show */
    }
  }

  function bump(n = 1) {
    _count.value = Math.max(0, _count.value + n)
  }

  return { count: _count, refresh, bump }
}
