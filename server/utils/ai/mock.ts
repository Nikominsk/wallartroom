// Mock AI provider. Returns plausible, deterministic-ish output so the editor
// flow looks real before OpenAI is wired up in Phase 4.
//
// "Deterministic-ish": derived from a hash of the inputs so the same room +
// artwork + placement always produces the same scores (avoids flicker on retry).

import type {
  AiProvider, RoomAnalysis, ArtworkAnalysis, StyleMatchResult,
  VisualizationRequest, VisualizationResult, PlacementData,
} from './types'

// Tiny string hash → pseudo-random 0-1 generator
function seedFrom(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995)
    h = (h ^ (h >>> 15)) >>> 0
    return h / 0xffffffff
  }
}

const PALETTES = [
  ['#D4C5A9', '#9b6b3d', '#3f342c', '#f5ecd7'], // warm/beige
  ['#1A1A2E', '#2980B9', '#E07B39', '#FFFFFF'], // navy/orange
  ['#A8C5A0', '#795548', '#F5C518', '#FFFFFF'], // sage/wood
  ['#212121', '#9E9E9E', '#FFFFFF', '#C5A059'], // monochrome+gold
  ['#E8A598', '#B5838D', '#F5ECD7', '#3f342c'], // pink/mauve
]

const ROOM_STYLES   = ['scandinavian', 'japandi', 'modern', 'minimal', 'bohemian', 'industrial']
const ARTWORK_STYLES = ['abstract', 'minimal', 'botanical', 'modern', 'bauhaus', 'monochrome', 'vintage']
const MOODS         = ['calm', 'warm', 'elegant', 'bold', 'playful']

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)]!
}


export const mockProvider: AiProvider = {

  async analyzeRoom({ roomImageUrl }) {
    const r = seedFrom(roomImageUrl)
    const palette = pick(r, PALETTES)
    const style   = pick(r, ROOM_STYLES)
    const result: RoomAnalysis = {
      dominantColors:        palette,
      roomStyle:             style,
      wallColor:             palette[3]!,
      furnitureColors:       palette.slice(0, 3),
      lightingDescription:   r() > 0.5 ? 'Warm natural light, soft shadows' : 'Cool overhead light, balanced exposure',
      suggestedArtworkColors: palette.slice(0, 3),
      stylesThatFit:         ARTWORK_STYLES.filter(() => r() > 0.5).slice(0, 3),
      stylesToAvoid:         r() > 0.5 ? ['baroque', 'ornate-gilded'] : ['hyper-photographic'],
    }
    return result
  },

  async analyzeArtwork({ artworkImageUrl }) {
    const r = seedFrom(artworkImageUrl)
    const palette = pick(r, PALETTES)
    const style   = pick(r, ARTWORK_STYLES)
    const result: ArtworkAnalysis = {
      dominantColors: palette.slice(0, 3),
      style,
      mood:           pick(r, MOODS),
      format:         pick(r, ['portrait', 'landscape', 'square'] as const),
      tags:           [style, pick(r, MOODS), 'curated'],
    }
    return result
  },

  async generateStyleMatch({ roomAnalysis, artworkAnalysis, placementData }) {
    const seed = JSON.stringify({ roomAnalysis, artworkAnalysis, placementData })
    const r    = seedFrom(seed)

    // Score components 60-95, biased high so the demo feels good.
    const score = () => Math.round(60 + r() * 35)
    const color   = score()
    const size    = sizeScore(placementData)
    const style   = styleScore(roomAnalysis.roomStyle, artworkAnalysis.style, r)
    const harmony = Math.round((color + size + style) / 3 + (r() - 0.5) * 6)

    const overall = Math.round(color * 0.3 + size * 0.2 + style * 0.25 + harmony * 0.25)
    const tips    = buildTips(placementData, color, size, style, harmony)

    const result: StyleMatchResult = {
      styleMatchScore:  clamp(overall),
      colorMatchScore:  clamp(color),
      sizeMatchScore:   clamp(size),
      styleScore:       clamp(style),
      roomHarmonyScore: clamp(harmony),
      explanation:      buildExplanation(roomAnalysis, artworkAnalysis, color, size, style),
      improvementTips:  tips,
      recommendedColors: roomAnalysis.suggestedArtworkColors,
      recommendedSize:   { wMin: 0.30, wMax: 0.55, hMin: 0.25, hMax: 0.50 },
      recommendedPosition: { x: 0.5, y: 0.42 },
    }
    return result
  },

  async generateVisualization(input: VisualizationRequest): Promise<VisualizationResult> {
    // Mock: return the room URL itself. The client overlays the artwork during
    // preview anyway. Delay matches the rough perceived cost of the quality tier
    // so the loading state feels real.
    const delay = input.renderQuality === 'high_quality' ? 1800
                : input.renderQuality === 'realistic'    ? 1100
                : 600
    const t0 = Date.now()
    await new Promise((res) => setTimeout(res, delay))

    return {
      resultImageUrl: input.roomImageUrl,
      status:         'succeeded',
      metadata: {
        provider:   'mock',
        modelUsed:  `mock-${input.renderQuality}`,
        durationMs: Date.now() - t0,
      },
    }
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function sizeScore(p: PlacementData): number {
  // Penalize artworks that are too small (<15% width) or huge (>70% width).
  const w = p.width
  if (w < 0.15) return 55
  if (w < 0.25) return 72
  if (w < 0.55) return 88
  if (w < 0.70) return 78
  return 60
}

function styleScore(roomStyle: string, artworkStyle: string, r: () => number): number {
  // Hand-rolled affinity matrix; 60-90 range with noise.
  const affinity: Record<string, string[]> = {
    scandinavian: ['minimal', 'botanical', 'abstract'],
    japandi:      ['minimal', 'monochrome', 'botanical'],
    modern:       ['abstract', 'modern', 'bauhaus'],
    minimal:      ['minimal', 'monochrome', 'abstract'],
    bohemian:     ['botanical', 'vintage', 'abstract'],
    industrial:   ['monochrome', 'modern', 'bauhaus'],
  }
  const fits = affinity[roomStyle]?.includes(artworkStyle)
  return Math.round((fits ? 82 : 68) + (r() - 0.5) * 12)
}

function buildExplanation(
  room: RoomAnalysis,
  artwork: ArtworkAnalysis,
  color: number,
  size: number,
  style: number,
): string {
  const colorPart = color >= 80
    ? `the artwork's ${artwork.dominantColors[0]} tones echo the room's palette`
    : `the artwork's colors contrast a bit with the room`
  const sizePart = size >= 80
    ? 'the format suits the wall'
    : size < 70
      ? 'a slightly larger size would feel more premium'
      : 'the proportions are reasonable for the wall'
  const stylePart = style >= 80
    ? `the ${artwork.style} character fits the ${room.roomStyle} room`
    : `the style is a softer match for a ${room.roomStyle} room`
  return `This artwork works because ${colorPart}, ${stylePart}, and ${sizePart}.`
}

function buildTips(
  p: PlacementData,
  color: number,
  size: number,
  style: number,
  harmony: number,
) {
  const tips = []
  if (size < 78) {
    tips.push({ id: 'size_up',     label: 'Try a larger size',           category: 'size'    as const, apply: { width: Math.min(0.6, p.width * 1.15), height: Math.min(0.6, p.height * 1.15) } })
  }
  if (size > 88 && p.width > 0.5) {
    tips.push({ id: 'size_down',   label: 'Make the artwork a bit smaller', category: 'size' as const, apply: { width: p.width * 0.9, height: p.height * 0.9 } })
  }
  if (p.y > 0.55) {
    tips.push({ id: 'move_up',     label: 'Move it higher on the wall',  category: 'position' as const, apply: { y: Math.max(0.32, p.y - 0.08) } })
  }
  if (p.y < 0.28) {
    tips.push({ id: 'move_down',   label: 'Lower it slightly',           category: 'position' as const, apply: { y: p.y + 0.06 } })
  }
  if (color < 78) {
    tips.push({ id: 'warmer',      label: 'Try warmer artwork colors',   category: 'color'    as const })
  }
  if (style < 75) {
    tips.push({ id: 'calmer',      label: 'A calmer style may fit better', category: 'style'   as const })
  }
  if (harmony < 75) {
    tips.push({ id: 'frame',       label: 'A thin black frame would help', category: 'frame'   as const })
  }
  return tips.slice(0, 4) // editor shows max 4
}
