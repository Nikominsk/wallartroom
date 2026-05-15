// Tracks the left-sidebar collapsed state for the metadata workspace.
// Persisted in a cookie so the preference survives refresh / cross-tab.

export function useMetadataSidebar() {
  const cookie = useCookie('meta-sidebar-collapsed', {
    default: () => false,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const collapsed = useState('meta-sidebar-collapsed', () => cookie.value ?? false)

  function toggle() {
    collapsed.value = !collapsed.value
    cookie.value = collapsed.value
  }

  function setCollapsed(value) {
    collapsed.value = !!value
    cookie.value = collapsed.value
  }

  return { collapsed, toggle, setCollapsed }
}
