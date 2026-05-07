<!--
  WallRect — draggable + resizable rectangle overlaid on a room photo.

  Coordinates are normalized to the room image (0-1) so the same placement
  data survives any container size or screen.

  Used by both the /app/new wizard step 2 (mark wall area) and the editor's
  center canvas. Emits "update" with the latest PlacementData.
-->

<template>
  <div ref="container" class="wallrect" :class="{ 'wallrect--no-image': !roomImageUrl }">
    <img v-if="roomImageUrl" :src="roomImageUrl" :alt="alt" class="wallrect__img" draggable="false" />
    <div v-else class="wallrect__placeholder">No room photo yet</div>

    <!-- Optional artwork overlay so users see what they're sizing for -->
    <img
      v-if="artworkImageUrl"
      :src="artworkImageUrl"
      class="wallrect__art"
      draggable="false"
      :style="rectStyle"
      alt=""
    />

    <!-- The placement rectangle itself -->
    <div
      v-if="roomImageUrl"
      class="wallrect__rect"
      :class="{ 'wallrect__rect--ghost': !!artworkImageUrl }"
      :style="rectStyle"
      @pointerdown="onDragStart"
    >
      <div class="wallrect__inner">
        <span v-if="!artworkImageUrl" class="wallrect__hint">{{ hint }}</span>
      </div>

      <!-- 8 resize handles -->
      <div class="wallrect__handle wallrect__handle--n"  @pointerdown.stop="onResizeStart('n',  $event)"></div>
      <div class="wallrect__handle wallrect__handle--s"  @pointerdown.stop="onResizeStart('s',  $event)"></div>
      <div class="wallrect__handle wallrect__handle--e"  @pointerdown.stop="onResizeStart('e',  $event)"></div>
      <div class="wallrect__handle wallrect__handle--w"  @pointerdown.stop="onResizeStart('w',  $event)"></div>
      <div class="wallrect__handle wallrect__handle--ne" @pointerdown.stop="onResizeStart('ne', $event)"></div>
      <div class="wallrect__handle wallrect__handle--nw" @pointerdown.stop="onResizeStart('nw', $event)"></div>
      <div class="wallrect__handle wallrect__handle--se" @pointerdown.stop="onResizeStart('se', $event)"></div>
      <div class="wallrect__handle wallrect__handle--sw" @pointerdown.stop="onResizeStart('sw', $event)"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Placement {
  x:        number
  y:        number
  width:    number
  height:   number
  rotation: number
  aspectRatio?: string
  mode:     'flat' | 'perspective' | 'replace_existing'
}

const props = withDefaults(defineProps<{
  roomImageUrl?:    string | null
  artworkImageUrl?: string | null
  modelValue:       Placement
  aspectRatio?:     string  // 'free' | '1:1' | '2:3' | '3:4' | '4:5' | '16:9'
  hint?:            string
  alt?:             string
}>(), {
  aspectRatio: 'free',
  hint:        'Drag to position · corners to resize',
  alt:         'Room',
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: Placement): void
}>()

const container = ref<HTMLElement | null>(null)

const rectStyle = computed(() => ({
  left:   `${props.modelValue.x * 100}%`,
  top:    `${props.modelValue.y * 100}%`,
  width:  `${props.modelValue.width  * 100}%`,
  height: `${props.modelValue.height * 100}%`,
  transform: props.modelValue.rotation
    ? `translate(-50%, -50%) rotate(${props.modelValue.rotation}deg)`
    : 'translate(-50%, -50%)',
}))


// ─── Aspect ratio enforcement ──────────────────────────────────────────────
function ratioFor(s: string): number | null {
  if (!s || s === 'free') return null
  const [a, b] = s.split(':').map(Number)
  if (!a || !b) return null
  return a / b
}

// When the aspect ratio prop changes (user picked a new ratio in the dropdown
// without dragging), re-derive height from the current width so the rectangle
// snaps to the new ratio immediately. Skipped for 'free'.
watch(() => props.aspectRatio, (next) => {
  const r = ratioFor(next)
  if (r === null || !container.value) return
  const cr = container.value.getBoundingClientRect()
  // norm height that makes rect (px) match target ratio: rect_w_px / rect_h_px = r
  const targetH = (props.modelValue.width * cr.width) / r / cr.height
  if (Math.abs(targetH - props.modelValue.height) < 0.001) return // already matches
  // Clamp to image bounds, anchored on the rect's centre
  let h = Math.max(0.05, Math.min(0.95, targetH))
  let y = clamp01(props.modelValue.y, h / 2, 1 - h / 2)
  emit('update:modelValue', { ...props.modelValue, height: h, y, aspectRatio: next })
})


// ─── Drag (move) ───────────────────────────────────────────────────────────

let dragState: { startX: number; startY: number; origX: number; origY: number } | null = null

function onDragStart(e: PointerEvent) {
  if (!container.value) return
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragState = {
    startX: e.clientX,
    startY: e.clientY,
    origX:  props.modelValue.x,
    origY:  props.modelValue.y,
  }
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup',   onDragEnd)
}

function onDragMove(e: PointerEvent) {
  if (!dragState || !container.value) return
  const r = container.value.getBoundingClientRect()
  const dx = (e.clientX - dragState.startX) / r.width
  const dy = (e.clientY - dragState.startY) / r.height
  const x  = clamp01(dragState.origX + dx, props.modelValue.width  / 2, 1 - props.modelValue.width  / 2)
  const y  = clamp01(dragState.origY + dy, props.modelValue.height / 2, 1 - props.modelValue.height / 2)
  emit('update:modelValue', { ...props.modelValue, x, y })
}

function onDragEnd() {
  dragState = null
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup',   onDragEnd)
}


// ─── Resize ────────────────────────────────────────────────────────────────

type Dir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

let resizeState: {
  dir:       Dir
  startX:    number
  startY:    number
  origRect:  Placement
  rectAspect: number
} | null = null

function onResizeStart(dir: Dir, e: PointerEvent) {
  if (!container.value) return
  const r = container.value.getBoundingClientRect()
  const aspect = (props.modelValue.width * r.width) / (props.modelValue.height * r.height)
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  resizeState = {
    dir,
    startX:     e.clientX,
    startY:     e.clientY,
    origRect:   { ...props.modelValue },
    rectAspect: aspect,
  }
  window.addEventListener('pointermove', onResizeMove)
  window.addEventListener('pointerup',   onResizeEnd)
}

function onResizeMove(e: PointerEvent) {
  if (!resizeState || !container.value) return
  const cr = container.value.getBoundingClientRect()
  const dx = (e.clientX - resizeState.startX) / cr.width
  const dy = (e.clientY - resizeState.startY) / cr.height
  const dir = resizeState.dir
  const orig = resizeState.origRect

  let { x, y, width, height } = orig
  const cx = orig.x, cy = orig.y

  // Left/right edges shift the centre by dx/2, width by dx (mirrored on left).
  if (dir.includes('e')) { width  = orig.width  + dx; x = cx + dx / 2 }
  if (dir.includes('w')) { width  = orig.width  - dx; x = cx + dx / 2 }
  if (dir.includes('s')) { height = orig.height + dy; y = cy + dy / 2 }
  if (dir.includes('n')) { height = orig.height - dy; y = cy + dy / 2 }

  // Aspect ratio lock — when set, force height from width based on the
  // image's own aspect (px) to keep the rectangle visually correct.
  const lockedRatio = ratioFor(props.aspectRatio)
  if (lockedRatio !== null) {
    // lockedRatio is artwork w/h. Container is room w/h px.
    // We want rect.width(px)/rect.height(px) == lockedRatio
    // → rect.height_norm = rect.width_norm * (cr.width/cr.height) / lockedRatio
    const targetH = (width * cr.width) / lockedRatio / cr.height
    // Anchor scaling on the side opposite the handle so it doesn't jump.
    const anchorY = dir.includes('n') ? orig.y + orig.height / 2 : orig.y - orig.height / 2
    height = targetH
    y      = dir.includes('n') ? anchorY - targetH / 2 : anchorY + targetH / 2
  }

  // Minimum size guard
  width  = Math.max(0.05, width)
  height = Math.max(0.05, height)

  // Keep inside the container
  x = clamp01(x, width  / 2, 1 - width  / 2)
  y = clamp01(y, height / 2, 1 - height / 2)

  emit('update:modelValue', { ...orig, x, y, width, height, aspectRatio: props.aspectRatio })
}

function onResizeEnd() {
  resizeState = null
  window.removeEventListener('pointermove', onResizeMove)
  window.removeEventListener('pointerup',   onResizeEnd)
}


// ─── Helpers ───────────────────────────────────────────────────────────────

function clamp01(n: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, n))
}
</script>

<style scoped lang="scss">
.wallrect {
  position: relative;
  width: 100%;
  background: #1a1714;
  border-radius: 14px;
  overflow: hidden;
  user-select: none;
  touch-action: none;

  &--no-image {
    aspect-ratio: 4 / 3;
    background: #ede0d0;
  }

  &__img {
    width: 100%;
    display: block;
    object-fit: contain;
    pointer-events: none;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #8a7a6e;
    font-size: 14px;
  }

  &__rect {
    position: absolute;
    transform-origin: center;
    border: 2px solid #c5a059;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.45), 0 8px 30px rgba(0, 0, 0, 0.35);
    cursor: move;
    background: rgba(197, 160, 89, 0.08);
    border-radius: 2px;

    &--ghost {
      background: transparent;
      border-style: dashed;
    }
  }

  &__art {
    position: absolute;
    transform-origin: center;
    object-fit: cover;
    pointer-events: none;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  }

  &__inner {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__hint {
    font-size: 11px;
    font-weight: 600;
    color: #1a1714;
    background: rgba(255, 255, 255, 0.9);
    padding: 5px 10px;
    border-radius: 999px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    pointer-events: none;
  }

  // 12px hit target, smaller visual dot
  $h: 12px;
  &__handle {
    position: absolute;
    width: $h; height: $h;
    background: #fff;
    border: 2px solid #c5a059;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);

    &--n  { top: 0;    left: 50%; transform: translate(-50%, -50%); cursor: ns-resize; }
    &--s  { bottom: 0; left: 50%; transform: translate(-50%,  50%); cursor: ns-resize; }
    &--e  { top: 50%;  right: 0;  transform: translate( 50%, -50%); cursor: ew-resize; }
    &--w  { top: 50%;  left: 0;   transform: translate(-50%, -50%); cursor: ew-resize; }
    &--ne { top: 0;    right: 0;  transform: translate( 50%, -50%); cursor: nesw-resize; }
    &--nw { top: 0;    left: 0;   transform: translate(-50%, -50%); cursor: nwse-resize; }
    &--se { bottom: 0; right: 0;  transform: translate( 50%,  50%); cursor: nwse-resize; }
    &--sw { bottom: 0; left: 0;   transform: translate(-50%,  50%); cursor: nesw-resize; }
  }
}
</style>
