<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <div>
        <h1 class="profile-page__title">Profile</h1>
        <p class="profile-page__subtitle">Your account details and plan usage.</p>
      </div>
    </header>

    <div class="profile-page__body">

      <!-- ── Account card ──────────────────────────────────────────────── -->
      <div class="profile-card">
        <div class="profile-card__head">
          <div class="profile-card__avatar">{{ initials }}</div>
          <div class="profile-card__identity">
            <div class="profile-card__name">{{ displayName }}</div>
            <div class="profile-card__email">{{ user?.email }}</div>
          </div>
        </div>

        <div class="profile-card__rows">
          <div class="profile-card__row">
            <span class="profile-card__label">Email</span>
            <span class="profile-card__value">{{ user?.email ?? '—' }}</span>
          </div>
          <div class="profile-card__row">
            <span class="profile-card__label">Member since</span>
            <span class="profile-card__value">{{ memberSince }}</span>
          </div>
          <div class="profile-card__row">
            <span class="profile-card__label">Plan</span>
            <span class="profile-card__value profile-card__value--plan">
              <span class="profile-card__plan-badge" :class="`profile-card__plan-badge--${me?.plan ?? 'free'}`">
                {{ me?.plan ? capitalize(me.plan) : 'Free' }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- ── Plan usage card ───────────────────────────────────────────── -->
      <div class="profile-card" v-if="me">
        <div class="profile-card__section-title">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v14h14"/>
            <path d="M7 13l3-4 3 2 3-5"/>
          </svg>
          Plan Usage
        </div>

        <div v-for="u in usageRows" :key="u.key" class="profile-credits__row">
          <div class="profile-credits__row-info">
            <span class="profile-credits__row-label">{{ u.label }}</span>
            <span class="profile-credits__row-count">
              <template v-if="u.limit !== null">{{ u.used }} / {{ u.limit }}</template>
              <template v-else>{{ u.used }} · Unlimited</template>
            </span>
          </div>
          <div v-if="u.limit !== null" class="profile-credits__bar">
            <div class="profile-credits__bar-fill" :style="{ width: u.pct + '%' }" />
          </div>
          <p class="profile-credits__row-hint">
            <template v-if="u.limit !== null">{{ u.remaining }} remaining on the {{ planLabel }} plan</template>
            <template v-else>Unlimited on the {{ planLabel }} plan</template>
          </p>
        </div>

      </div>

      <!-- Loading state -->
      <div v-else-if="pending" class="profile-card profile-card--loading">
        <div class="profile-credits__skeleton" />
        <div class="profile-credits__skeleton profile-credits__skeleton--sm" />
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="profile-card profile-card--error">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        Could not load plan usage.
      </div>

      <!-- ── Beta notification card ──────────────────────────────────── -->
      <div class="profile-card profile-card--beta">
        <div class="profile-beta__head">
          <div class="profile-beta__badge">Beta</div>
          <div>
            <h2 class="profile-beta__title">You're using WallArtRoom Beta</h2>
            <p class="profile-beta__text">
              The app is currently in beta. All features are free right now. Paid
              subscription plans are coming soon. Check the box below to get one email
              when they go live.
            </p>
          </div>
        </div>
        <label class="profile-beta__check" :class="{ 'profile-beta__check--disabled': savingNotify }">
          <input
            type="checkbox"
            v-model="notifyPlans"
            :disabled="savingNotify"
            @change="saveNotifyPlans"
          />
          <span class="profile-beta__check-box" :class="{ 'profile-beta__check-box--on': notifyPlans }">
            <svg v-if="notifyPlans" width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 7l3.5 3.5L12 4"/>
            </svg>
          </span>
          <span class="profile-beta__check-label">Notify me when subscription plans launch</span>
        </label>
        <p v-if="notifySaved" class="profile-beta__saved">Preference saved.</p>
      </div>

      <!-- ── Danger zone: delete account ───────────────────────────────── -->
      <div class="profile-card profile-card--danger">
        <div class="profile-danger__head">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 2L1 18h18L10 2z"/><path d="M10 8v4M10 15h.01"/>
          </svg>
          <div>
            <h2 class="profile-danger__title">Delete account</h2>
            <p class="profile-danger__text">
              This permanently deletes your <strong>entire account</strong> and
              <strong>every project</strong> in it: all uploaded images
              (including the actual files in storage), every pin, draft, schedule
              and posted item, all boards, the full CSV-export history, AI
              templates, settings and any remaining credits. You'll be signed
              out immediately. <strong>This cannot be undone and nothing can be
              recovered.</strong>
            </p>
          </div>
        </div>

        <div class="profile-danger__confirm">
          <label class="profile-danger__label" for="acct-delete-confirm">
            Type <strong>DELETE</strong> to confirm
          </label>
          <input
            id="acct-delete-confirm"
            v-model="deleteConfirm"
            class="profile-danger__input"
            type="text"
            autocomplete="off"
            spellcheck="false"
            placeholder="DELETE"
            :disabled="deleting"
          />
          <button
            type="button"
            class="profile-danger__btn"
            :disabled="deleteConfirm !== 'DELETE' || deleting"
            @click="handleDeleteAccount"
          >
            <svg v-if="deleting" class="profile-danger__spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span>{{ deleting ? 'Deleting…' : 'Delete my account' }}</span>
          </button>
          <p v-if="deleteError" class="profile-danger__err">{{ deleteError }}</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'metadata' })

const user = useSupabaseUser()

const { data: me, pending, error } = useFetch('/api/me', { lazy: true })

const displayName = computed(() => {
  const meta = user.value?.user_metadata ?? {}
  const email = user.value?.email ?? ''
  return meta.full_name || meta.name || email.split('@')[0] || 'User'
})

const initials = computed(() => {
  const name = displayName.value
  const parts = String(name).split(/[\s@.]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0]?.toUpperCase() || '?'
})

const memberSince = computed(() => {
  const raw = user.value?.created_at
  if (!raw) return '—'
  return new Date(raw).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

const planLabel = computed(() => capitalize(me.value?.plan ?? 'free'))

// Free-plan usage vs. limits (limit === null means unlimited, i.e. Pro).
const usageRows = computed(() => {
  const usage = me.value?.usage
  const limits = me.value?.limits
  if (!usage || !limits) return []
  const row = (key, label, used, limit) => ({
    key,
    label,
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    pct: limit ? Math.min(100, Math.round((used / limit) * 100)) : 0,
  })
  return [
    row('uploads', 'Image uploads', usage.imageUploads, limits.imageUploads),
    row('ai', 'AI generations', usage.aiGenerations, limits.aiGenerations),
  ]
})

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
}

// ── Beta notification opt-in ─────────────────────────────────────────────────
const notifyPlans = ref(false)
const savingNotify = ref(false)
const notifySaved = ref(false)

watch(() => me.value, (v) => {
  if (v) notifyPlans.value = v.notifyPlansLaunch ?? false
}, { immediate: true })

async function saveNotifyPlans() {
  savingNotify.value = true
  notifySaved.value = false
  try {
    await $fetch('/api/me/notify-plans', { method: 'PATCH', body: { notify: notifyPlans.value } })
    notifySaved.value = true
    setTimeout(() => { notifySaved.value = false }, 2500)
  } catch {
    notifyPlans.value = !notifyPlans.value
  } finally {
    savingNotify.value = false
  }
}

// ── Delete account ────────────────────────────────────────────────────────────
const supabase = useSupabaseClient()
const deleteConfirm = ref('')
const deleting = ref(false)
const deleteError = ref('')

async function handleDeleteAccount() {
  if (deleteConfirm.value !== 'DELETE' || deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await $fetch('/api/me', { method: 'DELETE' })
    // The account (and its auth user) is gone — clear the local session and
    // hard-navigate out so the auth middleware doesn't bounce a dead session.
    await supabase.auth.signOut()
    window.location.href = '/'
  } catch (e) {
    deleteError.value = e?.data?.statusMessage ?? e?.message ?? 'Could not delete your account. Try again.'
    deleting.value = false
  }
}
</script>

<style scoped lang="scss">
.profile-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 32px 40px 48px;
  max-width: 680px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;

  &__header {
    margin-bottom: 24px;
    border-bottom: 1px solid #ececec;
    padding-bottom: 18px;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: $color-primary;
    margin: 0 0 4px;
    letter-spacing: -0.025em;
  }

  &__subtitle {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.profile-card {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 12px;
  padding: 24px;
  transition: box-shadow 0.15s;

  &--loading,
  &--error {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #9ca3af;
    font-size: 13.5px;
    min-height: 80px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #f3f3f3;
  }

  &__avatar {
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: color-mix(in srgb, #{$color-accent} 12%, #fff);
    color: $color-accent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: 0.01em;
    border: 1.5px solid color-mix(in srgb, #{$color-accent} 20%, #fff);
  }

  &__identity {
    min-width: 0;
  }

  &__name {
    font-size: 16px;
    font-weight: 700;
    color: $color-primary;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }

  &__email {
    font-size: 13px;
    color: #6b7280;
    margin-top: 2px;
  }

  &__rows {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 0;
    border-bottom: 1px solid #f7f7f7;

    &:last-child { border-bottom: none; }
  }

  &__label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  &__value {
    font-size: 13.5px;
    color: $color-primary;
    font-weight: 500;
  }

  &__plan-badge {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;

    &--free {
      background: #f3f4f6;
      color: #4b5563;
    }

    &--pro,
    &--starter {
      background: color-mix(in srgb, #{$color-accent} 12%, #fff);
      color: $color-accent;
    }

    &--enterprise {
      background: #f0fdf4;
      color: #166534;
    }
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    font-weight: 600;
    color: $color-primary;
    margin-bottom: 20px;

    svg { color: #9ca3af; }
  }
}

.profile-credits {
  &__total {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 20px;
  }

  &__total-num {
    font-size: 36px;
    font-weight: 800;
    color: $color-primary;
    letter-spacing: -0.03em;
    line-height: 1;
  }

  &__total-label {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
  }

  &__row {
    background: #f9f9f9;
    border: 1px solid #ececec;
    border-radius: 10px;
    padding: 14px 16px;
    margin-top: 10px;

    &--purchased {
      background: color-mix(in srgb, #{$color-accent} 4%, #fff);
      border-color: color-mix(in srgb, #{$color-accent} 18%, #fff);
    }
  }

  &__row-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__row-label {
    font-size: 13px;
    font-weight: 600;
    color: $color-primary;
  }

  &__row-count {
    font-size: 13px;
    font-weight: 600;
    color: #4b5563;
  }

  &__bar {
    height: 6px;
    background: #e5e7eb;
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  &__bar-fill {
    height: 100%;
    background: $color-accent;
    border-radius: 999px;
    transition: width 0.4s ease;
  }

  &__row-hint {
    font-size: 12px;
    color: #9ca3af;
    margin: 0;
  }

  &__upgrade {
    display: inline-block;
    margin-top: 18px;
    color: $color-accent;
    font-weight: 600;
    font-size: 13.5px;
    text-decoration: none;

    &:hover { text-decoration: underline; }
  }

  &__skeleton {
    height: 20px;
    border-radius: 6px;
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    width: 60%;

    &--sm {
      width: 40%;
      height: 14px;
      margin-top: 10px;
    }
  }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ── Danger zone ────────────────────────────────────────────────────────────────
.profile-card--danger {
  border-color: #fecaca;
  background: #fef6f6;
}

.profile-danger {
  &__head {
    display: flex;
    gap: 12px;
    align-items: flex-start;

    svg { color: #dc2626; flex-shrink: 0; margin-top: 1px; }
  }

  &__title {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 700;
    color: #991b1b;
    letter-spacing: -0.01em;
  }

  &__text {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: #7f1d1d;

    strong { font-weight: 700; }
  }

  &__confirm {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid #fecaca;
    max-width: 340px;
  }

  &__label {
    font-size: 12px;
    color: #7f1d1d;

    strong { font-weight: 700; letter-spacing: 0.06em; }
  }

  &__input {
    width: 100%;
    height: 36px;
    padding: 0 10px;
    border: 1px solid #f3c9c9;
    border-radius: 7px;
    font: inherit;
    font-size: 13px;
    background: #fff;
    color: $color-primary;
    box-sizing: border-box;
    transition: border-color 0.15s;

    &:focus { outline: none; border-color: #dc2626; }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    align-self: flex-start;
    height: 36px;
    padding: 0 16px;
    border: 1px solid #dc2626;
    border-radius: 7px;
    background: #dc2626;
    color: #fff;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.05s;

    &:hover:not(:disabled) {
      background: #ef4444;
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.28);
    }

    &:active:not(:disabled) { transform: translateY(1px); }

    &:disabled {
      background: #fae3e3;
      border-color: #f3c9c9;
      color: #c2554f;
      cursor: not-allowed;
    }
  }

  &__spin { animation: profile-danger-spin 0.8s linear infinite; }

  &__err {
    margin: 2px 0 0;
    font-size: 12px;
    color: #b91c1c;
    font-weight: 500;
  }
}

@keyframes profile-danger-spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .profile-page {
    padding: 24px 24px 40px;
    max-width: 100%;
  }
}

@media (max-width: 600px) {
  .profile-page {
    padding: 16px 14px 36px;
    padding-left: 54px;
  }
}

// ── Beta card ──────────────────────────────────────────────────────────────────
.profile-card--beta {
  border-color: color-mix(in srgb, #{$color-accent} 25%, #fff);
  background: color-mix(in srgb, #{$color-accent} 4%, #fff);
}

.profile-beta {
  &__head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid color-mix(in srgb, #{$color-accent} 15%, #fff);
  }

  &__badge {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: $color-accent;
    color: #fff;
    margin-top: 2px;
  }

  &__title {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 700;
    color: $color-primary;
    letter-spacing: -0.01em;
  }

  &__text {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: #4b5563;
  }

  &__check {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;

    input[type='checkbox'] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    &--disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__check-box {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 5px;
    border: 2px solid color-mix(in srgb, #{$color-accent} 40%, #d1d5db);
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;

    &--on {
      background: $color-accent;
      border-color: $color-accent;
      color: #fff;
    }
  }

  &__check-label {
    font-size: 13.5px;
    font-weight: 500;
    color: $color-primary;
    line-height: 1.4;
  }

  &__saved {
    margin: 8px 0 0;
    font-size: 12px;
    color: #16a34a;
    font-weight: 500;
  }
}
</style>
