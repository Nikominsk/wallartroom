// Tracks the number of unread admin replies across the metadata section.
// Shared via useState so the layout badge and HelpChat component stay in sync.
export function useHelpBadge() {
  const count = useState('helpUnreadCount', () => 0)

  async function refresh() {
    try {
      const data = await $fetch('/api/help/tickets')
      count.value = data.unreadCount ?? 0
    } catch {}
  }

  return { count, refresh }
}
