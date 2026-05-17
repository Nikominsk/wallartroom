<template>
  <div class="meta-shell" :class="{ 'meta-shell--collapsed': collapsed }">
    <aside class="meta-shell__sidebar" :aria-expanded="!collapsed">
      <!-- ── Brand + collapse toggle ─────────────────────────────────── -->
      <div class="meta-shell__brand">
        <NuxtLink to="/metadata" class="meta-shell__brand-link" :title="collapsed ? 'WallArtRoom' : ''">
          <span class="meta-shell__brand-mark">W</span>
          <span class="meta-shell__brand-text">Wall<span>Art</span>Room</span>
        </NuxtLink>
        <button
          class="meta-shell__collapse"
          type="button"
          :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggle"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path v-if="collapsed" d="M5 3l4 4-4 4" />
            <path v-else d="M9 3l-4 4 4 4" />
          </svg>
        </button>
      </div>

      <!-- ── Upload (workflow entry point) ───────────────────────────── -->
      <div class="meta-shell__upload">
        <button
          class="meta-shell__upload-btn"
          type="button"
          :title="collapsed ? 'Upload images' : ''"
          @click="openUpload"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 13v3a1 1 0 001 1h12a1 1 0 001-1v-3" />
            <path d="M10 3v10M6 7l4-4 4 4" />
          </svg>
          <span class="meta-shell__upload-label">Upload images</span>
        </button>
      </div>

      <!-- ── Primary nav ─────────────────────────────────────────────── -->
      <nav class="meta-shell__nav" aria-label="Metadata sections">
        <template v-for="item in navItems" :key="item.to">
          <!-- Parent -->
          <NuxtLink
            :to="item.to"
            class="meta-shell__nav-item"
            :class="{
              'meta-shell__nav-item--parent': item.children?.length,
              'meta-shell__nav-item--active': isItemActive(item),
              'meta-shell__nav-item--parent-trail': item.children?.length && isInChildTrail(item),
            }"
            :title="collapsed ? item.label : ''"
          >
            <span class="meta-shell__nav-icon" v-html="item.icon" />
            <span class="meta-shell__nav-label">{{ item.label }}</span>
            <span
              v-if="item.to === '/metadata/csv-exports' && csvCount > 0"
              class="meta-shell__nav-badge"
              :title="`${csvCount} export${csvCount !== 1 ? 's' : ''} not yet marked exported`"
            >{{ csvCount }}</span>
          </NuxtLink>

          <!-- Children (rendered as nested under parent) -->
          <div
            v-if="item.children?.length"
            class="meta-shell__nav-children"
            :class="{ 'meta-shell__nav-children--collapsed': collapsed }"
          >
            <NuxtLink
              v-for="child in item.children"
              :key="child.to"
              :to="child.to"
              class="meta-shell__nav-item meta-shell__nav-item--child"
              active-class="meta-shell__nav-item--active"
              :title="collapsed ? child.label : ''"
            >
              <span class="meta-shell__nav-icon" v-html="child.icon" />
              <span class="meta-shell__nav-label">{{ child.label }}</span>
            </NuxtLink>
          </div>
        </template>
      </nav>

      <!-- ── Profile (pinned to the bottom, separated from the section nav) ── -->
      <div class="meta-shell__profile">
        <NuxtLink
          to="/metadata/profile"
          class="meta-shell__nav-item"
          active-class="meta-shell__nav-item--active"
          :title="collapsed ? 'Profile' : ''"
        >
          <span class="meta-shell__nav-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="7" r="3.5"/><path d="M3 17c0-3.31 3.13-6 7-6s7 2.69 7 6"/></svg>
          </span>
          <span class="meta-shell__nav-label">Profile</span>
        </NuxtLink>
      </div>

      <!-- ── Footer: project switcher + user ─────────────────────────── -->
      <div class="meta-shell__footer">
        <MetadataProjectSwitcher :collapsed="collapsed" />
        <div class="meta-shell__user" :title="collapsed ? displayName : ''">
          <div class="meta-shell__avatar">{{ signingOut ? '·' : initials }}</div>
          <div class="meta-shell__user-meta">
            <div class="meta-shell__user-name">{{ signingOut ? 'Signing out…' : displayName }}</div>
            <div v-if="!signingOut" class="meta-shell__user-email">{{ user?.email }}</div>
          </div>
          <button
            class="meta-shell__user-action"
            type="button"
            title="Sign out"
            aria-label="Sign out"
            @click="handleSignOut"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 3h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M9 14l5-4-5-4M14 10H3" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <main class="meta-shell__main">
      <!-- Gallery workspace stays mounted across Pins/Drafts/Schedules/Posted so
           switching is instant — only the preset prop changes. -->
      <MetadataWorkspace
        v-show="galleryMeta"
        :preset-status="galleryMeta?.presetStatus ?? []"
        :view-label="galleryMeta?.viewLabel ?? 'Pins'"
        :require-publish-date="galleryMeta?.requirePublishDate ?? false"
        :default-sort-by-publish-date="galleryMeta?.defaultSortByPublishDate ?? false"
      />
      <!-- Non-gallery routes (Settings, csv-exports) render via the slot. -->
      <div v-show="!galleryMeta" class="meta-shell__slot">
        <slot />
      </div>
    </main>

    <!-- Upload modal lives at the layout level so it's reachable from every
         metadata route, including Settings / CSV history. -->
    <Teleport to="body">
      <div v-if="uploadOpen" class="meta-upload-overlay" @click.self="closeUpload">
        <MetadataUploadModal @close="closeUpload" @uploaded="onUploadedFromModal" />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
const { collapsed, toggle } = useMetadataSidebar()
const { open: uploadOpen, openUpload, closeUpload, emitUploaded } = useMetadataUpload()
const { count: csvCount, refresh: refreshCsvBadge } = useCsvExportBadge()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()

async function onUploadedFromModal() {
  await emitUploaded()
  closeUpload()
}

// Keep the sidebar badge fresh: on load and whenever the route changes (e.g.
// after marking exports on the CSV history page).
onMounted(refreshCsvBadge)
watch(() => route.path, refreshCsvBadge)

const galleryMeta = computed(() => route.meta?.gallery ?? null)

const navItems = [
  {
    to: '/metadata/dashboard',
    label: 'Dashboard',
    icon: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>`,
  },
  {
    to: '/metadata',
    label: 'Pins',
    icon: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17v-5"/><path d="M7 7.5a3 3 0 1 1 6 0c0 1.5-.7 2.4-1.4 3.1-.6.6-1.6 1.4-1.6 2.4M5 4h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/></svg>`,
    children: [
      {
        to: '/metadata/drafts',
        label: 'Drafts',
        icon: `<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h10l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M14 4v3h3"/></svg>`,
      },
      {
        to: '/metadata/schedules',
        label: 'Schedules',
        icon: `<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="14" height="13" rx="1.5"/><path d="M3 8h14M7 2v4M13 2v4"/></svg>`,
      },
      {
        to: '/metadata/posted',
        label: 'Posted',
        icon: `<svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l4 4 10-10"/></svg>`,
      },
    ],
  },
  {
    to: '/metadata/csv-exports',
    label: 'CSV Exports',
    icon: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><path d="M10 5v5l3.5 2"/></svg>`,
  },
  {
    to: '/metadata/calendar',
    label: 'Calendar',
    icon: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="16" height="13" rx="1.5"/><path d="M2 8h16M6 2v4M14 2v4"/></svg>`,
  },
  {
    to: '/metadata/settings',
    label: 'Settings',
    icon: `<svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="2.5"/><path d="M16.5 10a6.5 6.5 0 0 0-.1-1.1l1.5-1.2-1.5-2.6-1.8.6a6.5 6.5 0 0 0-1.9-1.1L12.4 2.8h-3l-.3 1.8a6.5 6.5 0 0 0-1.9 1.1l-1.8-.6L3.9 7.7l1.5 1.2A6.5 6.5 0 0 0 5.4 10c0 .4 0 .8.1 1.1L4 12.3l1.5 2.6 1.8-.6c.6.5 1.2.9 1.9 1.1l.3 1.8h3l.3-1.8c.7-.2 1.3-.6 1.9-1.1l1.8.6 1.5-2.6-1.5-1.2c.1-.3.1-.7.1-1.1Z"/></svg>`,
  },
]

// Pins is "active" only when the URL is exactly /metadata. When the user is on
// a child route the parent gets a softer "trail" highlight via isInChildTrail.
function isItemActive(item) {
  if (item.children?.length) return route.path === item.to
  return route.path === item.to
}

function isInChildTrail(item) {
  if (!item.children?.length) return false
  return item.children.some(c => route.path === c.to)
}

const displayName = computed(() => {
  const email = user.value?.email ?? ''
  const meta = user.value?.user_metadata ?? {}
  return meta.full_name || meta.name || email.split('@')[0] || ''
})

const initials = computed(() => {
  const name = displayName.value
  const parts = String(name).split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0]?.toUpperCase() || '·'
})

const signingOut = ref(false)

async function handleSignOut() {
  signingOut.value = true
  await supabase.auth.signOut()
  await navigateTo('/login')
}
</script>

<style lang="scss" scoped>
$sidebar-w: 232px;
$sidebar-w-collapsed: 68px;

.meta-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #f7f7f7;
  color: $color-primary;

  &__sidebar {
    flex-shrink: 0;
    width: $sidebar-w;
    background: #fff;
    border-right: 1px solid #ececec;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100vh;
    transition: width 0.18s ease;
    z-index: 30;
  }

  &--collapsed &__sidebar { width: $sidebar-w-collapsed; }

  &__main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  &__slot {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }

  // ── Brand ───────────────────────────────────────────────────────────
  &__brand {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 14px 14px 12px;
    border-bottom: 1px solid #f3f3f3;
    height: 56px;
    box-sizing: border-box;
  }

  &__brand-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: inherit;
    font-weight: 800;
    font-size: 15px;
    letter-spacing: -0.02em;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  &__brand-mark {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    background: $color-accent;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 14px;
  }

  &__brand-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    span { color: $color-accent; }
  }

  &--collapsed &__brand-text { display: none; }

  &__collapse {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border: 1px solid #ececec;
    border-radius: 6px;
    background: #fff;
    color: #6b7280;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s, color 0.15s, border-color 0.15s;

    &:hover { background: #f3f4f6; color: $color-primary; border-color: #d1d5db; }
  }

  // ── Upload CTA ──────────────────────────────────────────────────────
  &__upload {
    padding: 12px 12px 4px;
  }

  &__upload-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 38px;
    padding: 0 12px;
    border: none;
    border-radius: 9px;
    background: $color-accent;
    color: #fff;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: color-mix(in srgb, #{$color-accent} 90%, #000); }
    &:focus-visible { outline: 2px solid $color-accent; outline-offset: 2px; }

    svg { flex-shrink: 0; }
  }

  &--collapsed &__upload-btn {
    padding: 0;
    .meta-shell__upload-label { display: none; }
  }

  // ── Nav ─────────────────────────────────────────────────────────────
  &__nav {
    flex: 1;
    overflow-y: auto;
    padding: 10px 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 9px 11px;
    border-radius: 8px;
    text-decoration: none;
    color: #4b5563;
    font-size: 13.5px;
    font-weight: 500;
    transition: background 0.12s, color 0.12s;
    position: relative;

    &:hover {
      background: #f3f4f6;
      color: $color-primary;
    }

    &--active {
      background: color-mix(in srgb, #{$color-accent} 9%, #fff);
      color: $color-primary;
      font-weight: 600;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 8px;
        bottom: 8px;
        width: 3px;
        border-radius: 0 2px 2px 0;
        background: $color-accent;
      }

      .meta-shell__nav-icon { color: $color-accent; }
    }

    // Subtle trail highlight on the Pins parent when a child route is active.
    &--parent-trail {
      color: $color-primary;
      font-weight: 600;
      .meta-shell__nav-icon { color: $color-accent; }
    }

    // Child rows are slightly indented and use smaller spacing so the parent
    // visually owns the group.
    &--child {
      padding: 7px 11px 7px 30px;
      font-size: 13px;
      gap: 10px;
    }
  }

  &__nav-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    transition: color 0.12s;

    :deep(svg) { display: block; }
  }

  &__nav-item--child &__nav-icon {
    width: 14px;
    height: 14px;
  }

  &__nav-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__nav-badge {
    margin-left: auto;
    flex-shrink: 0;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: $color-accent;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
  }

  // Collapsed: no room for a pill — show a small dot on the icon corner.
  &--collapsed &__nav-badge {
    position: absolute;
    top: 5px;
    right: 8px;
    min-width: 8px;
    width: 8px;
    height: 8px;
    padding: 0;
    font-size: 0;
    margin: 0;
  }

  &__nav-children {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 4px;
    position: relative;

    // Subtle vertical guide line connecting children to the parent
    &::before {
      content: '';
      position: absolute;
      left: 20px;
      top: 0;
      bottom: 4px;
      width: 1px;
      background: #ececec;
    }
  }

  // ── Collapsed mode ──────────────────────────────────────────────────
  &--collapsed &__nav-item {
    justify-content: center;
    padding: 9px 0;

    .meta-shell__nav-label { display: none; }

    &--active::before { display: none; }

    &--child {
      padding: 7px 0;
      gap: 0;
    }
  }

  // Hide the child group's tree guide and indent when collapsed
  &__nav-children--collapsed::before { display: none; }
  &--collapsed &__nav-item--child &__nav-icon { width: 18px; height: 18px; }

  // ── Profile (separated, pinned above the footer) ────────────────────
  &__profile {
    padding: 8px 10px;
    border-top: 1px solid #f3f3f3;
  }

  &--collapsed &__profile .meta-shell__nav-item {
    justify-content: center;
    padding: 9px 0;

    .meta-shell__nav-label { display: none; }
  }

  @media (max-width: 768px) {
    &__profile .meta-shell__nav-item { justify-content: center; padding: 9px 0; }
  }

  // ── Footer ──────────────────────────────────────────────────────────
  &__footer {
    border-top: 1px solid #f3f3f3;
    padding: 12px 10px;
  }

  &__user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 4px;
    border-radius: 8px;
  }

  &__avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f3f4f6;
    color: $color-primary;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.02em;
  }

  &__user-meta {
    flex: 1;
    min-width: 0;
    line-height: 1.25;
  }

  &__user-name {
    font-size: 13px;
    font-weight: 600;
    color: $color-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-email {
    font-size: 11.5px;
    color: #8a8a8a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__user-action {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border: 1px solid transparent;
    background: transparent;
    color: #9ca3af;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s, color 0.15s, border-color 0.15s;

    &:hover {
      background: #fef2f2;
      border-color: #fecaca;
      color: #b91c1c;
    }
  }

  &--collapsed &__user-meta,
  &--collapsed &__user-action {
    display: none;
  }

  &--collapsed &__user {
    justify-content: center;
    padding: 6px 0;
  }

  // ── Responsive ──────────────────────────────────────────────────────
  @media (max-width: 768px) {
    &__sidebar {
      width: $sidebar-w-collapsed;
    }

    &__brand-text,
    &__nav-label,
    &__upload-label,
    &__user-meta,
    &__user-action { display: none; }

    &__upload-btn { padding: 0; }

    &__nav-item { justify-content: center; padding: 9px 0; }
    &__nav-item--child { padding: 7px 0; gap: 0; }

    &__nav-badge {
      position: absolute;
      top: 5px;
      right: 8px;
      min-width: 8px;
      width: 8px;
      height: 8px;
      padding: 0;
      font-size: 0;
      margin: 0;
    }
    &__nav-children::before { display: none; }
    &__user { justify-content: center; padding: 6px 0; }

    &__collapse { display: none; }
  }
}

// Teleported to <body>, but still owned by this component so scoped styles
// apply. Sits above the workspace's own overlays (z-index 100).
.meta-upload-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 120;
  padding: 20px;
  box-sizing: border-box;
}
</style>
