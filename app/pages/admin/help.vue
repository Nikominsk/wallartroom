<template>
  <div class="admin-help">
    <!-- Header -->
    <header class="admin-help__head">
      <div class="admin-help__head-left">
        <NuxtLink to="/metadata" class="admin-help__brand">
          <span class="admin-help__brand-mark">P</span>
          <span class="admin-help__brand-text">Pix<span>Schedule</span></span>
        </NuxtLink>
        <div class="admin-help__crumbs">
          <NuxtLink to="/admin" class="admin-help__crumb-link">Admin</NuxtLink>
          <span class="admin-help__crumb-sep">/</span>
          <span class="admin-help__crumb-leaf">Help Tickets</span>
        </div>
      </div>
      <div class="admin-help__head-right">
        <NuxtLink to="/admin" class="admin-help__link">← Overview</NuxtLink>
        <button
          class="admin-help__refresh"
          :class="{ 'admin-help__refresh--spin': loading }"
          :disabled="loading"
          title="Refresh"
          @click="load"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4a8 8 0 0 1 12 0M4 16a8 8 0 0 0 12 0"/>
            <polyline points="1 4 4 4 4 7"/>
            <polyline points="19 16 16 16 16 13"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Stats -->
    <div class="admin-help__stats">
      <div class="admin-help__stat admin-help__stat--open">
        <div class="admin-help__stat-n">{{ openCount }}</div>
        <div class="admin-help__stat-l">Open</div>
      </div>
      <div class="admin-help__stat admin-help__stat--answered">
        <div class="admin-help__stat-n">{{ answeredCount }}</div>
        <div class="admin-help__stat-l">Answered</div>
      </div>
      <div class="admin-help__stat">
        <div class="admin-help__stat-n">{{ totalCount }}</div>
        <div class="admin-help__stat-l">Total</div>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="admin-help__tabs">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        class="admin-help__tab"
        :class="{ 'admin-help__tab--active': activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'open' && openCount" class="admin-help__tab-badge">{{ openCount }}</span>
      </button>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading && !tickets.length">
      <div v-for="n in 3" :key="n" class="admin-help__skel" />
    </template>

    <!-- Empty -->
    <div v-else-if="!filteredTickets.length" class="admin-help__empty">
      {{ activeTab === 'open' ? 'No open tickets — all caught up! 🎉' : 'No answered tickets yet.' }}
    </div>

    <!-- Ticket list -->
    <div v-else class="admin-help__list">
      <div
        v-for="ticket in filteredTickets"
        :key="ticket.id"
        class="admin-help__ticket"
        :class="{ 'admin-help__ticket--open': ticket.status === 'open' }"
      >
        <!-- Ticket meta -->
        <div class="admin-help__ticket-head">
          <div class="admin-help__ticket-user">
            <div class="admin-help__avatar">{{ initialsOf(ticket.user_email) }}</div>
            <div>
              <div class="admin-help__user-name">{{ ticket.user_name || ticket.user_email.split('@')[0] }}</div>
              <div class="admin-help__user-email">{{ ticket.user_email }}</div>
            </div>
          </div>
          <div class="admin-help__ticket-meta">
            <span class="admin-help__badge" :class="`admin-help__badge--${ticket.status}`">{{ ticket.status }}</span>
            <span class="admin-help__time">{{ formatRel(ticket.created_at) }}</span>
          </div>
        </div>

        <!-- Question -->
        <div class="admin-help__question">
          <div class="admin-help__question-label">Question from user</div>
          <div class="admin-help__question-text">{{ ticket.question }}</div>
        </div>

        <!-- AI response (if any) -->
        <div v-if="ticket.ai_response" class="admin-help__ai-block">
          <div class="admin-help__ai-label">AI responded · {{ ticket.ai_answered ? 'could answer' : 'could not answer' }}</div>
          <div class="admin-help__ai-text">{{ ticket.ai_response }}</div>
        </div>

        <!-- Existing admin reply (answered state) -->
        <div v-if="ticket.admin_reply" class="admin-help__existing-reply">
          <div class="admin-help__existing-reply-label">Your reply · {{ formatRel(ticket.admin_replied_at) }}</div>
          <div class="admin-help__existing-reply-text">{{ ticket.admin_reply }}</div>
          <div v-if="ticket.user_read_at" class="admin-help__read-at">✓ Read by user {{ formatRel(ticket.user_read_at) }}</div>
          <div v-else class="admin-help__unread">● Not yet read</div>
        </div>

        <!-- Reply form — open tickets always, answered if editing -->
        <div v-if="ticket.status === 'open' || editingId === ticket.id" class="admin-help__reply-form">
          <textarea
            v-model="replyDrafts[ticket.id]"
            class="admin-help__reply-textarea"
            placeholder="Write your reply to the user…"
            rows="4"
          />
          <div class="admin-help__kb-row">
            <label class="admin-help__kb-label">
              <input v-model="kbUpdateEnabled[ticket.id]" type="checkbox" class="admin-help__kb-check" />
              Also update the knowledge base with this answer
            </label>
            <span class="admin-help__kb-hint">Your reply will be added as a Q&amp;A entry to the AI help guide.</span>
          </div>
          <div class="admin-help__reply-actions">
            <button
              type="button"
              class="admin-help__reply-btn"
              :disabled="!replyDrafts[ticket.id]?.trim() || sendingId === ticket.id"
              @click="sendReply(ticket)"
            >
              {{ sendingId === ticket.id ? 'Sending…' : 'Send Reply' }}
            </button>
            <span v-if="sentIds.has(ticket.id)" class="admin-help__sent-ok">✓ Sent &amp; user notified</span>
          </div>
        </div>

        <!-- Edit button for answered tickets -->
        <div v-else-if="ticket.status === 'answered'" class="admin-help__reopen-wrap">
          <button type="button" class="admin-help__reopen-btn" @click="startEdit(ticket)">
            Edit reply
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const TABS = [
  { key: 'open',     label: 'Open' },
  { key: 'answered', label: 'Answered' },
  { key: 'all',      label: 'All' },
]

const activeTab     = ref('open')
const tickets       = ref([])
const openCount     = ref(0)
const answeredCount = ref(0)
const loading       = ref(false)
const editingId     = ref(null)
const sendingId     = ref(null)
const sentIds       = ref(new Set())
const replyDrafts   = ref({})
const kbUpdateEnabled = ref({})

const totalCount = computed(() => tickets.value.length)
const filteredTickets = computed(() => {
  if (activeTab.value === 'all') return tickets.value
  return tickets.value.filter(t => t.status === activeTab.value)
})

async function load() {
  loading.value = true
  try {
    const data = await $fetch('/api/admin/help-tickets')
    tickets.value       = data.tickets ?? []
    openCount.value     = data.openCount ?? 0
    answeredCount.value = data.answeredCount ?? 0
    // Default KB checkbox to ON for every ticket
    for (const t of tickets.value) {
      if (kbUpdateEnabled.value[t.id] === undefined) {
        kbUpdateEnabled.value[t.id] = true
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function startEdit(ticket) {
  editingId.value = ticket.id
  if (kbUpdateEnabled.value[ticket.id] === undefined) {
    kbUpdateEnabled.value[ticket.id] = true
  }
}

async function sendReply(ticket) {
  const reply = replyDrafts.value[ticket.id]?.trim()
  if (!reply) return
  sendingId.value = ticket.id
  try {
    // When KB update is enabled, send the reply itself formatted as Q&A
    const kbUpdate = kbUpdateEnabled.value[ticket.id]
      ? `Q: ${ticket.question}\nA: ${reply}`
      : undefined

    await $fetch(`/api/admin/help-tickets/${ticket.id}/reply`, {
      method: 'POST',
      body: { reply, kbUpdate },
    })
    sentIds.value           = new Set([...sentIds.value, ticket.id])
    ticket.status           = 'answered'
    ticket.admin_reply      = reply
    ticket.admin_replied_at = new Date().toISOString()
    editingId.value         = null
    openCount.value         = tickets.value.filter(t => t.status === 'open').length
    answeredCount.value     = tickets.value.filter(t => t.status === 'answered').length
  } catch (e) {
    alert('Failed to send reply: ' + (e.message ?? e))
  } finally {
    sendingId.value = null
  }
}

function initialsOf(email) {
  if (!email) return '·'
  const name = email.split('@')[0]
  const parts = name.split(/[.\-_]/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0]?.toUpperCase() || '·'
}

function formatRel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)        return 'just now'
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(load)
</script>

<style scoped lang="scss">
.admin-help {
  min-height: 100vh;
  background: #faf7f2;
  color: #3f342c;
  padding: 24px 36px 64px;
  font-family: inherit;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 20px;
  }

  &__head-left {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  &__brand {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    text-decoration: none;
    color: #3f342c;
    font-weight: 700;
    letter-spacing: -0.03em;

    &-mark {
      width: 26px; height: 26px;
      border-radius: 7px;
      background: #3f342c;
      color: #faf7f2;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 13px;
    }
    &-text {
      font-size: 15px;
      span { color: #9b5f3d; }
    }
  }

  &__crumbs {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #8a7a6e;
  }

  &__crumb-link {
    text-decoration: none;
    color: #6b4423;
    font-weight: 600;
    font-size: 11px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: #f1e6d4;
    padding: 3px 9px;
    border-radius: 999px;
    &:hover { background: #e8d5bb; }
  }

  &__crumb-sep  { opacity: 0.4; }
  &__crumb-leaf { color: #3f342c; font-weight: 500; }

  &__head-right {
    display: inline-flex;
    align-items: center;
    gap: 12px;
  }

  &__link {
    font-size: 12.5px;
    color: #8a7a6e;
    text-decoration: none;
    &:hover { color: #6b4423; }
  }

  &__refresh {
    width: 32px; height: 32px;
    border-radius: 9px;
    border: 1px solid #ede0d0;
    background: #fff;
    color: #8a7a6e;
    cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    transition: background .15s, color .15s;
    &:hover:not(:disabled) { background: #f5ecd7; color: #6b4423; }
    &--spin svg { animation: spin 0.9s linear infinite; }
    &:disabled { cursor: progress; }
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  // ── Stats ─────────────────────────────────────────────────────────────
  &__stats {
    display: flex;
    gap: 12px;
    margin-bottom: 18px;
  }

  &__stat {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 12px;
    padding: 14px 20px;
    min-width: 100px;
    text-align: center;

    &--open     { border-color: #fde68a; background: #fefce8; }
    &--answered { border-color: #bbf7d0; background: #f0fdf4; }
  }

  &__stat-n {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.025em;
    font-variant-numeric: tabular-nums;
    color: #3f342c;
  }

  &__stat-l {
    font-size: 11.5px;
    color: #8a7a6e;
    font-weight: 500;
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  // ── Tabs ──────────────────────────────────────────────────────────────
  &__tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 18px;
  }

  &__tab {
    appearance: none;
    border: 1px solid #ede0d0;
    background: #fff;
    color: #6b6058;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    padding: 7px 16px;
    border-radius: 8px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: background .15s, color .15s;

    &:hover { background: #faf3e8; color: #3f342c; }

    &--active {
      background: #3f342c;
      color: #faf7f2;
      border-color: #3f342c;
      &:hover { background: #2d251f; }
    }
  }

  &__tab-badge {
    background: #ef4444;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 999px;
    line-height: 1.4;
    animation: tab-badge-pulse 2s ease-in-out infinite;
  }

  @keyframes tab-badge-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }

  // ── Skeleton ──────────────────────────────────────────────────────────
  &__skel {
    height: 160px;
    background: linear-gradient(90deg, #f5ecd7 0%, #faf3e8 50%, #f5ecd7 100%);
    background-size: 200% 100%;
    border-radius: 14px;
    margin-bottom: 14px;
    animation: shimmer 1.6s ease-in-out infinite;
  }

  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  // ── Empty ────────────────────────────────────────────────────────────
  &__empty {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 14px;
    padding: 40px;
    text-align: center;
    color: #a89886;
    font-size: 14px;
  }

  // ── Ticket cards ──────────────────────────────────────────────────────
  &__list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__ticket {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 14px;
    padding: 0;
    overflow: hidden;

    &--open {
      border-color: #ede0d0;
    }
  }

  &__ticket-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px 0;
    margin-bottom: 14px;
  }

  &__ticket-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: #f1e6d4;
    color: #6b4423;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__user-name {
    font-size: 13.5px;
    font-weight: 600;
    color: #3f342c;
    line-height: 1.2;
  }

  &__user-email {
    font-size: 11.5px;
    color: #8a7a6e;
  }

  &__ticket-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  &__badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 999px;
    text-transform: capitalize;
    letter-spacing: 0.02em;

    &--open     { background: #fee2e2; color: #991b1b; }
    &--answered { background: #dcfce7; color: #166534; }
  }

  &__time {
    font-size: 11.5px;
    color: #a89886;
    font-variant-numeric: tabular-nums;
  }

  &__question {
    margin: 0 20px 12px;
  }

  &__question-label, &__ai-label, &__existing-reply-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #a89886;
    margin-bottom: 5px;
  }

  &__question-text {
    font-size: 15px;
    font-weight: 600;
    color: #3f342c;
    line-height: 1.45;
  }

  &__ai-block {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 10px 12px;
    margin: 0 20px 12px;
  }

  &__ai-label {
    margin-bottom: 6px;
  }

  &__ai-text {
    font-size: 13px;
    color: #4b5563;
    line-height: 1.4;
  }

  &__existing-reply {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    padding: 10px 12px;
    margin: 0 20px 12px;
  }

  &__existing-reply-text {
    font-size: 13.5px;
    color: #166534;
    line-height: 1.45;
  }

  &__read-at {
    font-size: 11px;
    color: #6b7280;
    margin-top: 6px;
  }

  &__unread {
    font-size: 11px;
    color: #f59e0b;
    margin-top: 6px;
    font-weight: 600;
  }

  // ── Reply form ────────────────────────────────────────────────────────
  &__reply-form {
    border-top: 1px solid #f1e6d4;
    padding: 16px 20px 18px;
    background: #fff;
  }

  &__reply-textarea {
    width: 100%;
    padding: 11px 13px;
    border: 1.5px solid #e0d4c8;
    border-radius: 9px;
    font: inherit;
    font-size: 14px;
    color: #3f342c;
    background: #fff;
    resize: vertical;
    box-sizing: border-box;
    outline: none;
    line-height: 1.55;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:focus {
      border-color: #9b5f3d;
      box-shadow: 0 0 0 3px rgba(155, 95, 61, 0.1);
    }
    &::placeholder { color: #c4b5a0; }
  }

  &__kb-row {
    margin: 10px 0 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__kb-label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    color: #6b6058;
    cursor: pointer;
    user-select: none;
    font-weight: 500;
  }

  &__kb-check {
    cursor: pointer;
    width: 14px;
    height: 14px;
    accent-color: #9b5f3d;
  }

  &__kb-hint {
    font-size: 11.5px;
    color: #a89886;
    padding-left: 21px;
  }

  &__reply-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
  }

  &__reply-btn {
    background: #3f342c;
    color: #faf7f2;
    border: none;
    border-radius: 9px;
    padding: 10px 22px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #2d251f; }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__sent-ok {
    font-size: 13px;
    color: #059669;
    font-weight: 600;
  }

  &__reopen-wrap {
    border-top: 1px solid #f1e6d4;
    padding: 10px 20px 14px;
  }

  &__reopen-btn {
    background: transparent;
    border: 1px solid #ede0d0;
    color: #8a7a6e;
    border-radius: 7px;
    padding: 6px 14px;
    font-family: inherit;
    font-size: 12.5px;
    cursor: pointer;
    transition: background 0.15s;
    &:hover { background: #faf3e8; color: #3f342c; }
  }
}
</style>
