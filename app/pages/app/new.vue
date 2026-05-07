<template>
  <section class="wiz">
    <!-- Step indicator ────────────────────────────────────────────────────── -->
    <header class="wiz__steps">
      <button v-for="(label, i) in stepLabels" :key="i"
              class="wiz__step"
              :class="{ active: step === i + 1, done: step > i + 1 }"
              :disabled="i + 1 > maxReached"
              @click="goTo(i + 1)">
        <span class="wiz__step-num">{{ i + 1 }}</span>
        <span class="wiz__step-label">{{ label }}</span>
      </button>
    </header>

    <!-- ────────────────── STEP 1 — Upload room ────────────────── -->
    <div v-if="step === 1" class="wiz__pane">
      <div class="wiz__copy">
        <span class="wiz__eyebrow">Step 1 of 3</span>
        <h1>Upload a photo of your room</h1>
        <p>JPG, PNG, or WebP — best results with natural light and a clear wall view. The wall doesn't need to be empty; you can replace an existing picture.</p>
      </div>

      <label class="upload" :class="{ 'has-image': roomImageUrl, dragover }"
             @dragover.prevent="dragover = true"
             @dragleave.prevent="dragover = false"
             @drop.prevent="onDrop">
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="onPickRoom" hidden />
        <template v-if="!roomImageUrl">
          <div class="upload__icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <strong>Drop your room photo here, or click to browse</strong>
          <span>JPG, PNG, WebP · up to 12 MB</span>
        </template>
        <img v-else :src="roomImageUrl" alt="Your room" />
      </label>

      <p v-if="uploadErr" class="wiz__err">{{ uploadErr }}</p>

      <div class="wiz__actions">
        <NuxtLink to="/app/dashboard" class="wiz__back">← Cancel</NuxtLink>
        <div class="wiz__actions-right">
          <button class="wiz__btn-ghost" type="button" @click="useExampleRoom" :disabled="busy">Use example room</button>
          <button class="wiz__btn-primary" type="button" :disabled="!roomImageUrl || busy" @click="goTo(2)">
            Continue →
          </button>
        </div>
      </div>
    </div>

    <!-- ────────────────── STEP 2 — Mark wall area ────────────────── -->
    <div v-else-if="step === 2" class="wiz__pane wiz__pane--wide">
      <div class="wiz__copy">
        <span class="wiz__eyebrow">Step 2 of 3</span>
        <h1>Mark where the artwork should hang</h1>
        <p>Drag the rectangle to position it. Use the corners or edges to resize.</p>
      </div>

      <div class="wiz__layout">
        <div class="wiz__canvas-wrap">
          <WallRect
            v-model="placement"
            :room-image-url="roomImageUrl"
            :aspect-ratio="aspectRatio"
            hint="Drag to position the artwork area"
          />
        </div>
        <aside class="wiz__sidebar">
          <h3>Aspect ratio</h3>
          <div class="ratio-grid">
            <button v-for="r in ratios" :key="r"
                    class="ratio"
                    :class="{ active: aspectRatio === r }"
                    @click="aspectRatio = r">
              {{ r === 'free' ? 'Free' : r }}
            </button>
          </div>

          <h3>What's on the wall?</h3>
          <div class="mode-list">
            <button class="mode-row" :class="{ active: placement.mode === 'flat' }"
                    @click="placement.mode = 'flat'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
              </svg>
              <span class="mode-row__body">
                <strong>Empty wall</strong>
                <em>Place new artwork on a clear wall.</em>
              </span>
            </button>
            <button class="mode-row" :class="{ active: placement.mode === 'replace_existing' }"
                    @click="placement.mode = 'replace_existing'">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="4" width="16" height="16" rx="1.5" stroke="currentColor" stroke-width="1.6"/>
                <path d="M9 9l6 6m0-6l-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <span class="mode-row__body">
                <strong>Replace existing</strong>
                <em>There's already a picture here — swap it out.</em>
              </span>
            </button>
          </div>

          <button class="reset" type="button" @click="resetPlacement">Reset position</button>
        </aside>
      </div>

      <div class="wiz__actions">
        <button class="wiz__back" type="button" @click="goTo(1)">← Back</button>
        <button class="wiz__btn-primary" type="button" :disabled="busy" @click="goTo(3)">
          Confirm position →
        </button>
      </div>
    </div>

    <!-- ────────────────── STEP 3 — Pick artwork ────────────────── -->
    <div v-else-if="step === 3" class="wiz__pane">
      <div class="wiz__copy">
        <span class="wiz__eyebrow">Step 3 of 3</span>
        <h1>Add your artwork</h1>
        <p>Upload your own piece. The gallery picker is coming soon — once an artwork is selected we'll create your project and open the editor.</p>
      </div>

      <label class="upload upload--small" :class="{ 'has-image': artworkImageUrl, dragover: artworkDragover }"
             @dragover.prevent="artworkDragover = true"
             @dragleave.prevent="artworkDragover = false"
             @drop.prevent="onArtworkDrop">
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="onPickArtwork" hidden />
        <template v-if="!artworkImageUrl">
          <div class="upload__icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M3 4h18v16H3zM3 16l5-5 4 4 3-3 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <strong>Upload artwork</strong>
          <span>JPG, PNG, WebP · up to 12 MB</span>
        </template>
        <img v-else :src="artworkImageUrl" alt="Your artwork" />
      </label>

      <input v-if="artworkImageUrl" v-model="artworkTitle"
             type="text" class="wiz__title-input"
             placeholder="Artwork title (optional)" />

      <p v-if="finishErr" class="wiz__err">{{ finishErr }}</p>

      <div class="wiz__actions">
        <button class="wiz__back" type="button" @click="goTo(2)">← Back</button>
        <button class="wiz__btn-primary" type="button" :disabled="!artworkImageUrl || busy" @click="finish">
          {{ busy ? 'Creating project…' : 'Open editor →' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })

import WallRect from '~/components/editor/WallRect.vue'
// Bundled sample so the "Use example room" button has a real URL.
import sampleRoomUrl from '@@/assets/images/showcase-empty-wall.png'

interface Placement {
  x:        number
  y:        number
  width:    number
  height:   number
  rotation: number
  aspectRatio?: string
  mode:     'flat' | 'perspective' | 'replace_existing'
}

const stepLabels = ['Upload room', 'Mark wall', 'Add artwork'] as const

const step       = ref<1 | 2 | 3>(1)
const maxReached = ref<number>(1)

const dragover         = ref(false)
const artworkDragover  = ref(false)
const busy             = ref(false)
const uploadErr        = ref<string | null>(null)
const finishErr        = ref<string | null>(null)

const { upload }       = useImageUpload()

// Step 1 state
const roomImageUrl     = ref<string | null>(null)

// Step 2 state
const aspectRatio      = ref('free')
const ratios           = ['free', '1:1', '2:3', '3:4', '4:5', '16:9'] as const
const placement        = ref<Placement>({
  x: 0.5, y: 0.42, width: 0.32, height: 0.28, rotation: 0, mode: 'flat',
})

// Step 3 state
const artworkImageUrl  = ref<string | null>(null)
const artworkTitle     = ref('')

function goTo(n: number) {
  if (n > maxReached.value && !canAdvanceTo(n)) return
  step.value       = n as 1 | 2 | 3
  maxReached.value = Math.max(maxReached.value, n)
}

function canAdvanceTo(n: number) {
  if (n === 2) return !!roomImageUrl.value
  if (n === 3) return !!roomImageUrl.value
  return true
}


// ─── Step 1 handlers ────────────────────────────────────────────────────

async function onPickRoom(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await uploadRoom(file)
}
async function onDrop(e: DragEvent) {
  dragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await uploadRoom(file)
}
async function uploadRoom(file: File) {
  uploadErr.value = null
  busy.value = true
  try {
    const { url } = await upload('rooms', file)
    roomImageUrl.value = url
  } catch (e: any) {
    uploadErr.value = e?.message || 'Upload failed'
  } finally {
    busy.value = false
  }
}
function useExampleRoom() {
  // Sample images live in the bundled assets folder so they always resolve.
  roomImageUrl.value = sampleRoomUrl
}


// ─── Step 3 handlers ────────────────────────────────────────────────────

async function onPickArtwork(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await uploadArtwork(file)
}
async function onArtworkDrop(e: DragEvent) {
  artworkDragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) await uploadArtwork(file)
}
async function uploadArtwork(file: File) {
  uploadErr.value = null
  busy.value = true
  try {
    const { url } = await upload('artworks', file)
    artworkImageUrl.value = url
  } catch (e: any) {
    uploadErr.value = e?.message || 'Upload failed'
  } finally {
    busy.value = false
  }
}


// ─── Step 2 helper ──────────────────────────────────────────────────────
function resetPlacement() {
  placement.value = { x: 0.5, y: 0.42, width: 0.32, height: 0.28, rotation: 0, mode: 'flat' }
  aspectRatio.value = 'free'
}


// ─── Finish: create project + artwork, redirect to editor ───────────────

async function finish() {
  if (!roomImageUrl.value || !artworkImageUrl.value) return
  finishErr.value = null
  busy.value = true
  try {
    // 1) project
    const project = await $fetch<{ id: string }>('/api/projects', {
      method: 'POST',
      body: {
        title:            artworkTitle.value || 'Untitled visualization',
        roomImageUrl:     roomImageUrl.value,
        selectedWallArea: { ...placement.value, aspectRatio: aspectRatio.value },
        placementMode:    placement.value.mode,
      },
    })

    // 2) artwork
    const artwork = await $fetch<{ id: string }>('/api/artworks', {
      method: 'POST',
      body: {
        imageUrl:    artworkImageUrl.value,
        title:       artworkTitle.value || null,
        aspectRatio: aspectRatio.value,
      },
    })

    // 3) jump to editor; editor reads ?artwork=<id> on first open
    await refreshNuxtData('me')
    await navigateTo(`/app/editor/${project.id}?artwork=${artwork.id}`)
  } catch (e: any) {
    finishErr.value = e?.statusMessage || e?.message || 'Could not create project'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped lang="scss">
.wiz {
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 1080px;
  margin: 0 auto;

  &__steps {
    display: flex;
    gap: 4px;
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 999px;
    padding: 4px;
    align-self: center;
  }

  &__step {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    border: 0;
    background: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #8a7a6e;
    border-radius: 999px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px; height: 22px;
      background: #faf3e3;
      color: #c5a059;
      border-radius: 50%;
      font-size: 12px;
    }

    &.active {
      background: #1a1714;
      color: #fff;
      .wiz__step-num { background: #c5a059; color: #1a1714; }
    }
    &.done .wiz__step-num { background: #c5a059; color: #1a1714; }
    &:disabled { cursor: not-allowed; opacity: 0.6; }
  }

  &__pane {
    display: flex;
    flex-direction: column;
    gap: 24px;
    align-items: center;
  }
  &__pane--wide { align-items: stretch; }

  &__copy {
    text-align: center;
    max-width: 600px;

    h1 {
      margin: 8px 0 12px;
      font-size: clamp(26px, 4vw, 34px);
      font-weight: 700;
      color: #1a1714;
      letter-spacing: -0.03em;
    }
    p {
      margin: 0;
      color: #6b5e52;
      line-height: 1.55;
    }
  }

  &__eyebrow {
    display: inline-block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #c5a059;
  }

  &__layout {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 24px;
  }

  &__canvas-wrap {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 16px;
    overflow: hidden;
    padding: 12px;
  }

  &__sidebar {
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 16px;
    padding: 20px;
    align-self: start;

    h3 {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 600;
      color: #1a1714;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    padding-top: 12px;

    &-right { display: flex; gap: 10px; }
  }

  &__back {
    background: none;
    border: 0;
    color: #6b5e52;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    text-decoration: none;
    padding: 10px 4px;
    &:hover { color: #1a1714; }
  }

  &__btn-primary {
    padding: 12px 24px;
    background: #1a1714;
    color: #fff;
    border: 0;
    border-radius: 999px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    &:disabled { opacity: 0.45; cursor: not-allowed; }
    &:hover:not(:disabled) { background: #2d2926; }
  }

  &__btn-ghost {
    padding: 12px 18px;
    background: #fff;
    color: #1a1714;
    border: 1px solid #ede0d0;
    border-radius: 999px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    &:hover:not(:disabled) { background: #faf7f2; border-color: #c5a059; }
    &:disabled { opacity: 0.45; cursor: not-allowed; }
  }

  &__title-input {
    width: 100%;
    max-width: 520px;
    padding: 12px 16px;
    border: 1px solid #ede0d0;
    border-radius: 12px;
    background: #fff;
    font-family: inherit;
    font-size: 14px;
    color: #1a1714;
    outline: none;
    transition: border-color 0.15s;
    &:focus { border-color: #c5a059; }
  }

  &__err {
    color: #b91c1c;
    background: #fef2f2;
    border: 1px solid #fecaca;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    max-width: 520px;
    align-self: center;
    margin: 0;
  }
}

.upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 640px;
  min-height: 320px;
  padding: 36px;
  background: #fff;
  border: 2px dashed #d8cab1;
  border-radius: 18px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  overflow: hidden;
  position: relative;

  &--small { min-height: 240px; }

  &:hover, &.dragover { border-color: #c5a059; background: #fdfaf3; }

  &.has-image {
    padding: 0;
    border-style: solid;
    border-color: #ede0d0;
  }

  &__icon {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: #faf3e3;
    color: #c5a059;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }

  strong {
    font-size: 16px;
    font-weight: 600;
    color: #1a1714;
    margin-bottom: 4px;
  }
  span {
    font-size: 13px;
    color: #8a7a6e;
  }

  img {
    width: 100%;
    max-height: 480px;
    object-fit: contain;
    display: block;
  }
}

.ratio-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 18px;
}

.ratio {
  padding: 8px 10px;
  background: #faf7f2;
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #6b5e52;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  &:hover { border-color: #ede0d0; }
  &.active { background: #1a1714; color: #fff; border-color: #1a1714; }
}

.mode-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
}
.mode-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #faf7f2;
  border: 1px solid transparent;
  border-radius: 10px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  color: #1a1714;
  transition: background 0.15s, border-color 0.15s;

  &:hover { border-color: #ede0d0; }
  &.active {
    background: #1a1714;
    border-color: #1a1714;
    color: #fff;
    em { color: rgba(255, 255, 255, 0.65); }
  }

  > svg { flex-shrink: 0; margin-top: 2px; }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 1px;
    line-height: 1.3;
  }
  strong {
    font-size: 13px;
    font-weight: 600;
  }
  em {
    font-size: 11px;
    font-style: normal;
    color: #8a7a6e;
  }
}

.reset {
  width: 100%;
  padding: 8px;
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #6b5e52;
  cursor: pointer;
  &:hover { color: #1a1714; border-color: #c5a059; }
}

@media (max-width: 800px) {
  .wiz__layout { grid-template-columns: 1fr; }
}
</style>
