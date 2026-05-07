<template>
  <section class="ed">
    <!-- ── TOPBAR ────────────────────────────────────────────────────── -->
    <header class="ed__top">
      <div class="ed__top-left">
        <NuxtLink to="/app/dashboard" class="ed__back" aria-label="Back to dashboard">←</NuxtLink>
        <input v-model="projectTitle"
               @blur="saveTitle"
               class="ed__title"
               placeholder="Untitled visualization" />
      </div>
      <div class="ed__top-right">
        <span v-if="me" class="ed__credits">
          <strong>{{ me.wallet.available }}</strong> credits
        </span>
      </div>
    </header>

    <!-- ── BODY ──────────────────────────────────────────────────────── -->
    <div class="ed__body">

      <!-- ── LEFT SIDEBAR ─────────────────────────────────────────── -->
      <aside class="ed__left">
        <!-- Room -->
        <section class="ed-card">
          <header class="ed-card__head">
            <h3>Room</h3>
            <NuxtLink to="/app/new" class="ed-card__link">Change</NuxtLink>
          </header>
          <div class="ed-thumb" :style="thumbStyle(project?.roomImageUrl)" />
        </section>

        <!-- Artwork -->
        <section class="ed-card">
          <header class="ed-card__head">
            <h3>Artwork</h3>
            <button class="ed-card__link" type="button" @click="onPickArtwork">Replace</button>
          </header>
          <input ref="artInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="onArtworkFile" />
          <div class="ed-thumb" :style="thumbStyle(currentArtwork?.imageUrl)" />
          <p v-if="!currentArtwork" class="ed-card__hint">No artwork chosen yet.</p>
          <p v-else class="ed-card__caption">{{ currentArtwork.title || 'Untitled' }}</p>
        </section>

        <!-- Format -->
        <section class="ed-card">
          <header class="ed-card__head"><h3>Format</h3></header>
          <select v-model="aspectRatio" class="ed-select">
            <option v-for="r in ratios" :key="r" :value="r">{{ r === 'free' ? 'Free' : r }}</option>
          </select>
          <div class="ed-presets">
            <button v-for="p in sizePresets" :key="p.label"
                    class="ed-preset"
                    @click="applySizePreset(p.scale)">
              {{ p.label }}
            </button>
          </div>
        </section>

        <!-- Render quality -->
        <section class="ed-card">
          <header class="ed-card__head"><h3>Render quality</h3></header>
          <button v-for="q in qualities" :key="q.id"
                  class="ed-quality"
                  :class="{ active: renderQuality === q.id }"
                  type="button"
                  @click="renderQuality = q.id">
            <span class="ed-quality__label">{{ q.label }}</span>
            <span class="ed-quality__cost">{{ q.cost }} credit{{ q.cost === 1 ? '' : 's' }}</span>
          </button>
        </section>
      </aside>

      <!-- ── CENTER CANVAS ────────────────────────────────────────── -->
      <main class="ed__center">
        <!-- State banners -->
        <div v-if="!project?.roomImageUrl" class="ed-state">Upload a room photo to start.</div>
        <div v-else-if="!placement" class="ed-state">Mark where the artwork should hang.</div>
        <div v-else-if="!currentArtwork" class="ed-state">Upload artwork or pick one from the gallery.</div>

        <div class="ed__canvas">
          <WallRect
            v-if="project?.roomImageUrl && placement"
            v-model="placement"
            :room-image-url="latestResultImage || project.roomImageUrl"
            :artwork-image-url="currentArtwork?.imageUrl || null"
            :aspect-ratio="aspectRatio"
          />
        </div>

        <!-- Generate button + loader -->
        <div class="ed__cta-row">
          <button class="ed__generate"
                  type="button"
                  :disabled="!canGenerate || generating"
                  @click="generate">
            <span v-if="generating" class="ed__spinner" aria-hidden="true">⟳</span>
            <span v-if="generating">Adjusting position, perspective, lighting…</span>
            <span v-else-if="!currentArtwork">Pick artwork to generate</span>
            <span v-else>Create preview · {{ currentCost }} credit{{ currentCost === 1 ? '' : 's' }}</span>
          </button>
          <p v-if="generationErr" class="ed__err">{{ generationErr }}</p>
        </div>

        <!-- ── VARIANT BAR ──────────────────────────────────────── -->
        <div v-if="visualizations.length" class="ed__variants">
          <h3>Variants</h3>
          <div class="ed-variants">
            <article v-for="v in visualizations" :key="v.id"
                     class="ed-variant"
                     :class="{ active: v.id === activeVariantId, failed: v.status === 'failed' }"
                     @click="selectVariant(v.id)">
              <div class="ed-variant__thumb" :style="thumbStyle(v.resultImageUrl || project?.roomImageUrl)">
                <span v-if="v.styleMatchScore != null" class="ed-variant__score">{{ v.styleMatchScore }}</span>
                <span v-if="v.status === 'failed'" class="ed-variant__failed">failed</span>
              </div>
              <div class="ed-variant__meta">
                <span class="ed-variant__quality">{{ v.renderQuality }}</span>
                <span class="ed-variant__cost">{{ v.creditsSpent }} credit{{ v.creditsSpent === 1 ? '' : 's' }}</span>
              </div>
            </article>
          </div>
        </div>
      </main>

      <!-- ── RIGHT SIDEBAR — AI Style Advisor ─────────────────────── -->
      <aside class="ed__right">
        <header class="ed-advisor__head">
          <h2>AI Style Advisor</h2>
        </header>

        <!-- No score yet -->
        <div v-if="!activeVariant" class="ed-advisor__empty">
          <p>Generate a preview to see the AI Style Match Score and recommendations.</p>
        </div>

        <template v-else>
          <!-- Overall score ring -->
          <div class="ed-score">
            <div class="ed-score__ring" :style="{ '--p': activeVariant.styleMatchScore + '' }">
              <span class="ed-score__num">{{ activeVariant.styleMatchScore }}</span>
              <span class="ed-score__den">/100</span>
            </div>
            <span class="ed-score__label">{{ scoreLabel(activeVariant.styleMatchScore) }}</span>
          </div>

          <!-- Sub-scores -->
          <div class="ed-bars">
            <div class="ed-bar" v-for="bar in scoreBars" :key="bar.label">
              <div class="ed-bar__head">
                <span>{{ bar.label }}</span>
                <span>{{ bar.value }}</span>
              </div>
              <div class="ed-bar__track">
                <div class="ed-bar__fill" :style="{ width: bar.value + '%' }" />
              </div>
            </div>
          </div>

          <!-- Explanation -->
          <p v-if="activeVariant.recommendation?.explanation" class="ed-advisor__expl">
            {{ activeVariant.recommendation.explanation }}
          </p>

          <!-- Improvement tips -->
          <div v-if="tips?.length" class="ed-tips">
            <h4>Improvement tips</h4>
            <button v-for="tip in tips" :key="tip.id"
                    class="ed-tip" type="button" @click="applyTip(tip)">
              <span class="ed-tip__cat">{{ tip.category }}</span>
              <span class="ed-tip__label">{{ tip.label }}</span>
            </button>
          </div>
        </template>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'app' })

import WallRect from '~/components/editor/WallRect.vue'

interface Placement {
  x:        number
  y:        number
  width:    number
  height:   number
  rotation: number
  aspectRatio?: string
  mode:     'flat' | 'perspective' | 'replace_existing'
}

interface ImprovementTip {
  id:       string
  label:    string
  category: 'size' | 'position' | 'color' | 'style' | 'frame'
  apply?:   Partial<Placement>
}

interface Visualization {
  id:               string
  resultImageUrl:   string | null
  renderQuality:    'quick' | 'realistic' | 'high_quality'
  placementData:    Placement | null
  styleMatchScore:  number | null
  colorMatchScore:  number | null
  sizeMatchScore:   number | null
  styleScore:       number | null
  roomHarmonyScore: number | null
  creditsSpent:     number
  status:           'pending' | 'running' | 'succeeded' | 'failed' | 'refunded'
  errorMessage:     string | null
  createdAt:        string
  artwork: {
    id:       string
    imageUrl: string
    title:    string | null
  } | null
  recommendation: {
    explanation:   string | null
    sizeTips:      any
    positionTips:  any
    colorTips:     any
    styleTips:     ImprovementTip[]
  } | null
}

interface ProjectPayload {
  project: {
    id:               string
    title:            string
    roomImageUrl:     string | null
    selectedWallArea: any
    placementMode:    'flat' | 'perspective' | 'replace_existing'
    bestScore:        number | null
  }
  visualizations: Visualization[]
}

const route       = useRoute()
const projectId   = computed(() => route.params.projectId as string)
const { data: me, refresh: refreshMe } = useMe()

// ─── Load project ───────────────────────────────────────────────────────
const { data, error, refresh } = await useFetch<ProjectPayload>(`/api/projects/${projectId.value}`, {
  key: `project-${projectId.value}`,
  server: false,
  lazy: true,
  default: () => null as any,
})
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Project not found' })

const project       = computed(() => data.value?.project)
const visualizations = computed(() => data.value?.visualizations ?? [])

// ─── Editor state ───────────────────────────────────────────────────────
const projectTitle  = ref('')
const aspectRatio   = ref<string>('free')
const renderQuality = ref<'quick' | 'realistic' | 'high_quality'>('quick')
const placement     = ref<Placement | null>(null)
const activeVariantId = ref<string | null>(null)

const generating    = ref(false)
const generationErr = ref<string | null>(null)
const artInput      = ref<HTMLInputElement | null>(null)
const { upload }    = useImageUpload()

// Initial sync once /api/projects/[id] resolves
watch(data, (val) => {
  if (!val) return
  projectTitle.value = val.project.title
  const wallArea = val.project.selectedWallArea
  if (wallArea && typeof wallArea === 'object') {
    placement.value = {
      x:        wallArea.x ?? 0.5,
      y:        wallArea.y ?? 0.42,
      width:    wallArea.width ?? 0.32,
      height:   wallArea.height ?? 0.28,
      rotation: wallArea.rotation ?? 0,
      mode:     wallArea.mode ?? val.project.placementMode ?? 'flat',
      aspectRatio: wallArea.aspectRatio ?? 'free',
    }
    aspectRatio.value = wallArea.aspectRatio ?? 'free'
  } else {
    placement.value = { x: 0.5, y: 0.42, width: 0.32, height: 0.28, rotation: 0, mode: val.project.placementMode ?? 'flat' }
  }
  if (val.visualizations.length) activeVariantId.value = val.visualizations[0]!.id
}, { immediate: true })

// ─── Active variant + current artwork ───────────────────────────────────
const activeVariant = computed<Visualization | null>(() =>
  visualizations.value.find((v) => v.id === activeVariantId.value) ?? visualizations.value[0] ?? null,
)
// Choose displayed artwork: ?artwork=<id> from wizard ⇒ fetch row; else last variant's artwork
const initialArtworkId = ref<string | null>(typeof route.query.artwork === 'string' ? route.query.artwork : null)
const fetchedArtwork   = ref<{ id: string; imageUrl: string; title: string | null } | null>(null)
const supabase         = useSupabaseClient()

watchEffect(async () => {
  if (!initialArtworkId.value) return
  const { data: row } = await supabase
    .from('artwork_image')
    .select('id, image_url, title')
    .eq('id', initialArtworkId.value)
    .single()
  if (row) fetchedArtwork.value = { id: row.id, imageUrl: row.image_url, title: row.title }
})

const currentArtwork = computed(() => {
  // Priority: 1) variant in focus, 2) wizard artwork, 3) most recent variant artwork
  if (activeVariant.value?.artwork) return activeVariant.value.artwork
  if (fetchedArtwork.value)         return fetchedArtwork.value
  const last = visualizations.value.find((v) => v.artwork)
  return last?.artwork ?? null
})

const latestResultImage = computed(() => activeVariant.value?.resultImageUrl ?? null)

// ─── Format presets ─────────────────────────────────────────────────────
const ratios       = ['free', '1:1', '2:3', '3:4', '4:5', '16:9'] as const
const sizePresets  = [
  { label: 'S', scale: 0.75 },
  { label: 'M', scale: 1.0  },
  { label: 'L', scale: 1.25 },
  { label: 'XL', scale: 1.5 },
] as const
function applySizePreset(scale: number) {
  if (!placement.value) return
  const w = Math.min(0.7, Math.max(0.1, placement.value.width  * scale))
  const h = Math.min(0.7, Math.max(0.1, placement.value.height * scale))
  placement.value = { ...placement.value, width: w, height: h }
}

// ─── Render quality ─────────────────────────────────────────────────────
const qualities = [
  { id: 'quick'        as const, label: 'Quick preview',  cost: 1 },
  { id: 'realistic'    as const, label: 'Realistic',      cost: 2 },
  { id: 'high_quality' as const, label: 'High quality',   cost: 3 },
]
const currentCost = computed(() => qualities.find((q) => q.id === renderQuality.value)?.cost ?? 1)

const canGenerate = computed(() => !!(project.value?.roomImageUrl && placement.value && currentArtwork.value && me.value && me.value.wallet.available >= currentCost.value))

// ─── Score panel ────────────────────────────────────────────────────────
const scoreBars = computed(() => {
  const v = activeVariant.value
  if (!v) return []
  return [
    { label: 'Color match',  value: v.colorMatchScore  ?? 0 },
    { label: 'Size match',   value: v.sizeMatchScore   ?? 0 },
    { label: 'Style',        value: v.styleScore       ?? 0 },
    { label: 'Room harmony', value: v.roomHarmonyScore ?? 0 },
  ]
})

const tips = computed<ImprovementTip[]>(() => {
  return (activeVariant.value?.recommendation?.styleTips as ImprovementTip[] | null) ?? []
})

function scoreLabel(n: number | null) {
  if (n == null) return ''
  if (n >= 90) return 'Excellent match'
  if (n >= 80) return 'Very good match'
  if (n >= 70) return 'Good match'
  if (n >= 60) return 'Fair match'
  return 'Try the improvements below'
}

// ─── Actions ────────────────────────────────────────────────────────────
async function saveTitle() {
  if (!project.value || projectTitle.value === project.value.title) return
  await $fetch(`/api/projects/${projectId.value}`, {
    method: 'PATCH',
    body: { title: projectTitle.value },
  })
}

function onPickArtwork() { artInput.value?.click() }

async function onArtworkFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  generationErr.value = null
  try {
    const { url } = await upload('artworks', file)
    const row = await $fetch<{ id: string; image_url: string; title: string | null }>('/api/artworks', {
      method: 'POST',
      body: { imageUrl: url, title: null, aspectRatio: aspectRatio.value },
    })
    fetchedArtwork.value = { id: row.id, imageUrl: row.image_url, title: row.title }
  } catch (e: any) {
    generationErr.value = e?.message || 'Upload failed'
  }
}

function selectVariant(id: string) {
  activeVariantId.value = id
  const v = visualizations.value.find((x) => x.id === id)
  if (v?.placementData) placement.value = { ...placement.value!, ...v.placementData }
}

function applyTip(tip: ImprovementTip) {
  if (!tip.apply || !placement.value) return
  placement.value = { ...placement.value, ...tip.apply }
}

async function generate() {
  if (!canGenerate.value || !project.value || !placement.value || !currentArtwork.value) return
  generating.value     = true
  generationErr.value  = null

  try {
    // Persist current wall area first so reloads retain it
    await $fetch(`/api/projects/${projectId.value}`, {
      method: 'PATCH',
      body: { selectedWallArea: { ...placement.value, aspectRatio: aspectRatio.value } },
    })

    const res = await $fetch<any>('/api/visualizations/create', {
      method: 'POST',
      body: {
        projectId:      projectId.value,
        artworkImageId: currentArtwork.value.id,
        placementData:  { ...placement.value, aspectRatio: aspectRatio.value },
        renderQuality:  renderQuality.value,
      },
    })

    activeVariantId.value = res.id
    await refresh()
    await refreshMe()
  } catch (e: any) {
    generationErr.value = e?.statusMessage || e?.message || 'Generation failed'
  } finally {
    generating.value = false
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────
function thumbStyle(url?: string | null) {
  return url
    ? { backgroundImage: `url(${url})` }
    : { background: 'linear-gradient(135deg, #ede0d0 0%, #d8cab1 100%)' }
}
</script>

<style scoped lang="scss">
.ed {
  display: flex;
  flex-direction: column;
  margin: -32px -28px -80px;  // bleed past app layout's main padding
  height: calc(100vh - 64px); // 64 ≈ topbar in app layout

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    border-bottom: 1px solid #ede0d0;
    background: #fff;
    flex-shrink: 0;
  }
  &__top-left, &__top-right {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  &__back {
    text-decoration: none;
    color: #6b5e52;
    font-size: 18px;
    line-height: 1;
    padding: 6px 12px;
    border-radius: 8px;
    &:hover { background: #faf7f2; color: #1a1714; }
  }
  &__title {
    border: 0;
    background: none;
    font-family: inherit;
    font-size: 16px;
    font-weight: 600;
    color: #1a1714;
    outline: none;
    width: 320px;
    padding: 6px 8px;
    border-radius: 6px;
    &:hover, &:focus { background: #faf7f2; }
  }
  &__credits {
    background: #faf3e3;
    border: 1px solid #e8d8b0;
    color: #92400e;
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 13px;
    strong { color: #1a1714; font-weight: 700; }
  }

  &__body {
    flex: 1;
    display: grid;
    grid-template-columns: 280px 1fr 320px;
    min-height: 0;
  }

  &__left, &__right {
    overflow-y: auto;
    padding: 18px;
    background: #faf7f2;
  }
  &__left   { border-right: 1px solid #ede0d0; }
  &__right  { border-left:  1px solid #ede0d0; }

  &__center {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 20px 24px;
    background: #f5f2ed;
  }

  &__canvas {
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 1px solid #ede0d0;
    border-radius: 16px;
    padding: 14px;
    overflow: hidden;

    > * { width: 100%; max-height: 100%; }
  }

  &__cta-row {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 0 8px;
  }

  &__generate {
    padding: 14px 28px;
    background: #1a1714;
    color: #fff;
    border: 0;
    border-radius: 999px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 280px;
    justify-content: center;
    &:disabled { opacity: 0.45; cursor: not-allowed; }
    &:hover:not(:disabled) { background: #2d2926; }
  }
  &__spinner {
    display: inline-block;
    animation: ed-spin 0.9s linear infinite;
  }
  @keyframes ed-spin { to { transform: rotate(360deg); } }

  &__err {
    margin: 0;
    color: #b91c1c;
    font-size: 13px;
  }

  &__variants {
    flex-shrink: 0;
    border-top: 1px solid #ede0d0;
    padding: 16px 0 0;
    margin-top: 12px;

    h3 {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #6b5e52;
    }
  }
}

.ed-state {
  text-align: center;
  padding: 8px 12px;
  background: #faf3e3;
  border: 1px solid #e8d8b0;
  color: #92400e;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 10px;
}

.ed-card {
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    h3 {
      margin: 0;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #1a1714;
    }
  }
  &__link {
    background: none;
    border: 0;
    cursor: pointer;
    font-family: inherit;
    color: #c5a059;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    &:hover { color: #1a1714; }
  }
  &__hint, &__caption {
    margin: 8px 0 0;
    font-size: 12px;
    color: #8a7a6e;
  }
  &__caption { color: #1a1714; font-weight: 500; }
}

.ed-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: #ede0d0;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
}

.ed-select {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #ede0d0;
  border-radius: 8px;
  background: #faf7f2;
  font-family: inherit;
  font-size: 13px;
  color: #1a1714;
  margin-bottom: 10px;
  outline: none;
  &:focus { border-color: #c5a059; }
}

.ed-presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
.ed-preset {
  padding: 7px 4px;
  background: #faf7f2;
  border: 1px solid transparent;
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: #6b5e52;
  cursor: pointer;
  &:hover { border-color: #c5a059; color: #1a1714; }
}

.ed-quality {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: #faf7f2;
  border: 1px solid transparent;
  border-radius: 8px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover { border-color: #ede0d0; }
  &.active {
    background: #1a1714;
    border-color: #1a1714;
    .ed-quality__label { color: #fff; }
    .ed-quality__cost  { color: #c5a059; }
  }

  &__label { font-size: 13px; font-weight: 600; color: #1a1714; }
  &__cost  { font-size: 12px; color: #8a7a6e; }
}

// ── Right sidebar ──
.ed-advisor__head h2 {
  margin: 0 0 14px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #1a1714;
}
.ed-advisor__empty {
  background: #fff;
  border: 1px dashed #d8cab1;
  border-radius: 12px;
  padding: 24px 18px;
  text-align: center;
  color: #6b5e52;
  font-size: 13px;
  line-height: 1.5;
}
.ed-advisor__expl {
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13px;
  line-height: 1.55;
  color: #2d2926;
  margin: 0 0 16px;
}

.ed-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 14px;
  padding: 22px 18px;
  margin-bottom: 14px;

  &__ring {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: conic-gradient(#c5a059 calc(var(--p) * 1%), #ede0d0 0);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;

    &::before {
      content: '';
      position: absolute;
      inset: 8px;
      border-radius: 50%;
      background: #fff;
    }
  }
  &__num {
    position: relative;
    font-size: 32px;
    font-weight: 700;
    color: #1a1714;
    letter-spacing: -0.02em;
  }
  &__den {
    position: relative;
    font-size: 14px;
    color: #8a7a6e;
    margin-left: 2px;
  }
  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #6b5e52;
  }
}

.ed-bars {
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ed-bar {
  &__head {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 600;
    color: #1a1714;
    margin-bottom: 5px;
    > span:last-child { color: #c5a059; }
  }
  &__track {
    height: 6px;
    background: #f3eadc;
    border-radius: 3px;
    overflow: hidden;
  }
  &__fill {
    height: 100%;
    background: linear-gradient(90deg, #c5a059, #9b6b3d);
    border-radius: 3px;
    transition: width 0.3s;
  }
}

.ed-tips {
  h4 {
    margin: 4px 0 8px;
    font-size: 11px;
    font-weight: 700;
    color: #6b5e52;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
}
.ed-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #ede0d0;
  border-radius: 10px;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, transform 0.15s;

  &:hover { border-color: #c5a059; transform: translateY(-1px); }

  &__cat {
    flex-shrink: 0;
    background: #faf3e3;
    color: #92400e;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 7px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  &__label {
    font-size: 13px;
    color: #1a1714;
  }
}

// ── Variants bar ──
.ed-variants {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.ed-variant {
  flex: 0 0 110px;
  background: #fff;
  border: 2px solid #ede0d0;
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, transform 0.15s;

  &:hover { transform: translateY(-2px); }
  &.active { border-color: #c5a059; }
  &.failed { opacity: 0.55; }

  &__thumb {
    aspect-ratio: 4 / 3;
    background-size: cover;
    background-position: center;
    position: relative;
  }
  &__score {
    position: absolute;
    top: 6px; left: 6px;
    background: rgba(26, 23, 20, 0.78);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 999px;
    backdrop-filter: blur(4px);
  }
  &__failed {
    position: absolute;
    top: 6px; right: 6px;
    background: #b91c1c;
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  &__meta {
    padding: 6px 8px;
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    font-weight: 600;
  }
  &__quality { color: #1a1714; text-transform: uppercase; letter-spacing: 0.06em; }
  &__cost    { color: #8a7a6e; }
}

@media (max-width: 1100px) {
  .ed__body { grid-template-columns: 240px 1fr 280px; }
}
@media (max-width: 880px) {
  .ed__body { grid-template-columns: 1fr; }
  .ed__left, .ed__right { display: none; } // mobile editor lands in Phase 5
}
</style>
