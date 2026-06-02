<template>
  <!-- Chat popup — teleported to body so z-index stacks above everything -->
  <Teleport to="body">
    <Transition name="help-chat">
      <div v-if="open" class="help-popup">
        <!-- Header -->
        <div class="help-popup__head">
          <div class="help-popup__head-left">
            <img src="/favicon.ico" class="help-popup__avatar" alt="" width="34" height="34" />
            <div>
              <div class="help-popup__title">Help & Support</div>
              <div class="help-popup__subtitle">
                <span class="help-popup__dot" />
                Typically replies instantly
              </div>
            </div>
          </div>
          <button class="help-popup__close" type="button" aria-label="Close" @click="$emit('close')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M1 1l12 12M13 1L1 13"/></svg>
          </button>
        </div>

        <!-- Messages -->
        <div ref="scrollEl" class="help-popup__messages">
          <!-- Unread replies banner -->
          <div v-if="unreadReplies.length && !repliesShown" class="help-popup__unread-banner">
            <span>{{ unreadReplies.length }} new reply{{ unreadReplies.length !== 1 ? 's' : '' }} from the founder</span>
            <button type="button" @click="showReplies">View replies</button>
          </div>

          <!-- Past tickets / replies -->
          <template v-if="repliesShown">
            <div v-for="ticket in pastTickets" :key="ticket.id" class="help-popup__ticket-group">
              <!-- User's original question -->
              <div class="help-popup__msg help-popup__msg--user">
                <div class="help-popup__bubble">{{ ticket.question }}</div>
                <div class="help-popup__meta">{{ formatRel(ticket.created_at) }}</div>
              </div>
              <!-- AI response if it exists -->
              <div v-if="ticket.ai_response" class="help-popup__msg help-popup__msg--bot">
                <div class="help-popup__bot-icon">W</div>
                <div>
                  <div class="help-popup__bubble">{{ ticket.ai_response }}</div>
                </div>
              </div>
              <!-- Waiting state -->
              <div v-else-if="ticket.status === 'open'" class="help-popup__msg help-popup__msg--bot">
                <div class="help-popup__bot-icon">W</div>
                <div class="help-popup__bubble help-popup__bubble--muted">
                  Sent to the founder — reply coming soon.
                </div>
              </div>
              <!-- Admin reply -->
              <div v-if="ticket.admin_reply" class="help-popup__msg help-popup__msg--bot">
                <div class="help-popup__bot-icon help-popup__bot-icon--founder">F</div>
                <div>
                  <div class="help-popup__founder-label">Reply from the founder</div>
                  <div class="help-popup__bubble help-popup__bubble--founder">{{ ticket.admin_reply }}</div>
                  <div class="help-popup__meta">{{ formatRel(ticket.admin_replied_at) }}</div>
                </div>
              </div>
              <div class="help-popup__divider" />
            </div>
          </template>

          <!-- Greeting -->
          <div class="help-popup__msg help-popup__msg--bot">
            <div class="help-popup__bot-icon">W</div>
            <div class="help-popup__bubble">
              Hi! 👋 How can I help you today? I can answer questions about how to use WallArtRoom.
            </div>
          </div>

          <!-- Current session messages -->
          <template v-for="(msg, i) in sessionMessages" :key="i">
            <!-- User message -->
            <div v-if="msg.role === 'user'" class="help-popup__msg help-popup__msg--user">
              <div class="help-popup__bubble">{{ msg.content }}</div>
            </div>

            <!-- AI answer -->
            <div v-else-if="msg.role === 'bot'" class="help-popup__msg help-popup__msg--bot">
              <div class="help-popup__bot-icon">W</div>
              <div>
                <div class="help-popup__bubble" :class="{ 'help-popup__bubble--muted': !msg.canAnswer }">
                  {{ msg.content }}
                </div>
                <!-- Feedback -->
                <div v-if="!msg.feedbackGiven && !ticketSentFor.has(i)" class="help-popup__feedback">
                  <span class="help-popup__feedback-label">Was this helpful?</span>
                  <button type="button" class="help-popup__feedback-btn help-popup__feedback-btn--yes" @click="onHelpful(i)">👍 Yes</button>
                  <button type="button" class="help-popup__feedback-btn help-popup__feedback-btn--no" @click="onNotHelpful(i)">👎 No</button>
                </div>
                <div v-if="msg.feedbackGiven === 'yes'" class="help-popup__feedback-thanks">
                  Glad that helped! 🎉
                </div>
                <!-- Send to founder -->
                <div v-if="(msg.feedbackGiven === 'no' || !msg.canAnswer) && !ticketSentFor.has(i)" class="help-popup__send-founder">
                  <p>Would you like a personal reply from the founder?</p>
                  <button
                    type="button"
                    class="help-popup__send-btn"
                    :disabled="sendingTicket === i"
                    @click="sendToFounder(i)"
                  >
                    {{ sendingTicket === i ? 'Sending…' : 'Send to Founder' }}
                  </button>
                </div>
                <div v-if="ticketSentFor.has(i)" class="help-popup__ticket-sent">
                  ✅ Sent to the founder — I'll notify you here when there's a reply.
                </div>
              </div>
            </div>

            <!-- Loading -->
            <div v-else-if="msg.role === 'loading'" class="help-popup__msg help-popup__msg--bot">
              <div class="help-popup__bot-icon">W</div>
              <div class="help-popup__bubble help-popup__bubble--loading">
                <span /><span /><span />
              </div>
            </div>
          </template>
        </div>

        <!-- Input -->
        <form class="help-popup__input-row" @submit.prevent="sendQuestion">
          <input
            ref="inputEl"
            v-model="inputText"
            class="help-popup__input"
            type="text"
            placeholder="Ask a question…"
            maxlength="500"
            :disabled="isAsking"
            autocomplete="off"
          />
          <button
            type="submit"
            class="help-popup__send"
            :disabled="!inputText.trim() || isAsking"
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 10L3 3l4 7-4 7 16-7Z"/>
            </svg>
          </button>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
})
defineEmits(['close'])

const { refresh: refreshBadge } = useHelpBadge()

const scrollEl  = ref(null)
const inputEl   = ref(null)
const inputText = ref('')
const isAsking  = ref(false)
const sendingTicket = ref(null)

// Past tickets loaded from the API
const pastTickets   = ref([])
const repliesShown  = ref(false)
const unreadReplies = computed(() => pastTickets.value.filter(t => t.status === 'answered' && !t.user_read_at))

// Current chat session
const sessionMessages = ref([])
// i → true for session message indices where ticket was sent
const ticketSentFor = ref(new Set())

async function loadTickets() {
  try {
    const data = await $fetch('/api/help/tickets')
    pastTickets.value = data.tickets ?? []
    // If there are unread replies, auto-expand
    if (unreadReplies.value.length > 0) {
      showReplies()
    }
  } catch {}
}

async function showReplies() {
  repliesShown.value = true
  // Mark all unread replies as read
  for (const t of unreadReplies.value) {
    await $fetch(`/api/help/tickets/${t.id}/read`, { method: 'POST' }).catch(() => {})
    t.user_read_at = new Date().toISOString()
  }
  await refreshBadge()
  await nextTick()
  scrollToBottom()
}

async function sendQuestion() {
  const q = inputText.value.trim()
  if (!q || isAsking.value) return
  inputText.value = ''
  isAsking.value = true

  sessionMessages.value.push({ role: 'user', content: q })
  sessionMessages.value.push({ role: 'loading' })
  await nextTick()
  scrollToBottom()

  try {
    const { answer, canAnswer } = await $fetch('/api/help/ask', {
      method: 'POST',
      body: { question: q },
    })

    // Replace loading indicator with actual answer
    const idx = sessionMessages.value.findLastIndex(m => m.role === 'loading')
    if (idx !== -1) {
      sessionMessages.value.splice(idx, 1, {
        role:         'bot',
        content:      answer,
        canAnswer,
        feedbackGiven: canAnswer ? null : 'no',
        question:     q,
      })
    }
  } catch {
    const idx = sessionMessages.value.findLastIndex(m => m.role === 'loading')
    if (idx !== -1) {
      sessionMessages.value.splice(idx, 1, {
        role:         'bot',
        content:      'Something went wrong. Please try again.',
        canAnswer:    false,
        feedbackGiven: 'no',
        question:     q,
      })
    }
  } finally {
    isAsking.value = false
    await nextTick()
    scrollToBottom()
    inputEl.value?.focus()
  }
}

function onHelpful(i) {
  sessionMessages.value[i].feedbackGiven = 'yes'
}

function onNotHelpful(i) {
  sessionMessages.value[i].feedbackGiven = 'no'
}

async function sendToFounder(i) {
  const msg = sessionMessages.value[i]
  if (!msg) return
  sendingTicket.value = i

  try {
    await $fetch('/api/help/ticket', {
      method: 'POST',
      body: {
        question:    msg.question,
        aiResponse:  msg.content,
        aiAnswered:  msg.canAnswer ?? false,
      },
    })
    ticketSentFor.value = new Set([...ticketSentFor.value, i])
  } catch {
    // fail silently — user sees no change, can retry
  } finally {
    sendingTicket.value = null
  }
}

function scrollToBottom() {
  if (scrollEl.value) {
    scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  }
}

function formatRel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60)        return 'just now'
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Load tickets when chat is first opened
watch(() => props.open, async (val) => {
  if (val) {
    await loadTickets()
    await nextTick()
    scrollToBottom()
    inputEl.value?.focus()
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.help-popup {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 360px;
  max-height: 560px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07);
  z-index: 9999;
  overflow: hidden;
  font-size: 13.5px;
  color: #1f2937;

  // ── Header ────────────────────────────────────────────────────────────
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: $color-accent;
    color: #fff;
    flex-shrink: 0;
  }

  &__head-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__avatar {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: block;
    flex-shrink: 0;
    object-fit: contain;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.2;
  }

  &__subtitle {
    font-size: 11.5px;
    opacity: 0.85;
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 2px;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
    display: inline-block;
  }

  &__close {
    width: 28px;
    height: 28px;
    border: none;
    background: rgba(255,255,255,0.15);
    color: #fff;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    flex-shrink: 0;
    transition: background 0.15s;

    &:hover { background: rgba(255,255,255,0.25); }
  }

  // ── Messages ──────────────────────────────────────────────────────────
  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  &__unread-banner {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12.5px;
    color: #1d4ed8;
    font-weight: 500;

    button {
      background: #2563eb;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      &:hover { background: #1d4ed8; }
    }
  }

  &__ticket-group {
    display: contents;
  }

  &__divider {
    height: 1px;
    background: #f3f4f6;
    margin: 2px 0;
  }

  &__msg {
    display: flex;
    gap: 8px;
    align-items: flex-start;

    &--user {
      flex-direction: column;
      align-items: flex-end;
    }

    &--bot {
      flex-direction: row;
    }
  }

  &__bot-icon {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: $color-accent;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 12px;
    margin-top: 2px;

    &--founder {
      background: #7c3aed;
    }
  }

  &__bubble {
    padding: 9px 12px;
    border-radius: 12px;
    line-height: 1.45;
    max-width: 260px;
    word-break: break-word;

    .help-popup__msg--user & {
      background: $color-accent;
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    .help-popup__msg--bot & {
      background: #f3f4f6;
      color: #1f2937;
      border-bottom-left-radius: 4px;
    }

    &--muted {
      .help-popup__msg--bot & {
        background: #fef9ec;
        color: #92400e;
      }
    }

    &--founder {
      .help-popup__msg--bot & {
        background: #f5f3ff;
        color: #4c1d95;
      }
    }

    &--loading {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 11px 14px;

      span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #9ca3af;
        animation: help-bounce 1.2s ease-in-out infinite;

        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
  }

  &__founder-label {
    font-size: 11px;
    font-weight: 600;
    color: #7c3aed;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }

  &__meta {
    font-size: 11px;
    color: #9ca3af;
    margin-top: 4px;
  }

  // ── Feedback ──────────────────────────────────────────────────────────
  &__feedback {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  &__feedback-label {
    font-size: 11.5px;
    color: #6b7280;
  }

  &__feedback-btn {
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 6px;
    padding: 3px 9px;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.12s, border-color 0.12s;

    &--yes:hover { background: #f0fdf4; border-color: #86efac; }
    &--no:hover  { background: #fef2f2; border-color: #fca5a5; }
  }

  &__feedback-thanks {
    font-size: 12px;
    color: #059669;
    margin-top: 5px;
    font-weight: 500;
  }

  &__send-founder {
    margin-top: 8px;
    background: #fefce8;
    border: 1px solid #fde68a;
    border-radius: 10px;
    padding: 10px 12px;

    p {
      margin: 0 0 8px;
      font-size: 12.5px;
      color: #92400e;
    }
  }

  &__send-btn {
    background: #92400e;
    color: #fff;
    border: none;
    border-radius: 7px;
    padding: 6px 14px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: #78350f; }
    &:disabled { opacity: 0.6; cursor: wait; }
  }

  &__ticket-sent {
    margin-top: 6px;
    font-size: 12px;
    color: #059669;
    font-weight: 500;
  }

  // ── Input ─────────────────────────────────────────────────────────────
  &__input-row {
    display: flex;
    gap: 8px;
    padding: 12px 14px;
    border-top: 1px solid #f3f4f6;
    flex-shrink: 0;
    background: #fff;
  }

  &__input {
    flex: 1;
    height: 36px;
    padding: 0 12px;
    border: 1px solid #e5e7eb;
    border-radius: 9px;
    font: inherit;
    font-size: 13px;
    color: #1f2937;
    background: #f9fafb;
    outline: none;
    transition: border-color 0.15s;

    &:focus { border-color: $color-accent; background: #fff; }
    &::placeholder { color: #9ca3af; }
    &:disabled { opacity: 0.6; }
  }

  &__send {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border: none;
    border-radius: 9px;
    background: $color-accent;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    transition: background 0.15s;

    &:hover:not(:disabled) { background: color-mix(in srgb, #{$color-accent} 85%, #000); }
    &:disabled { opacity: 0.5; cursor: default; }
  }

  @keyframes help-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30%            { transform: translateY(-5px); }
  }
}

// ── Transition ─────────────────────────────────────────────────────────────────
.help-chat-enter-active,
.help-chat-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.help-chat-enter-from,
.help-chat-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

@media (max-width: 600px) {
  .help-popup {
    left: 12px;
    right: 12px;
    bottom: 12px;
    width: auto;
    max-height: calc(100vh - 72px);
  }
}
</style>
