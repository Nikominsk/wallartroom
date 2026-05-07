// Shared AI service types. Mirrors the §21 spec interfaces. Both the mock and
// the future OpenAI implementation must satisfy AiProvider.

export interface RoomAnalysis {
  dominantColors:        string[]      // hex values, dominant first
  roomStyle:             string        // e.g. "scandinavian", "modern", "japandi"
  wallColor:             string        // hex
  furnitureColors:       string[]
  lightingDescription:   string
  suggestedArtworkColors: string[]
  stylesThatFit:         string[]
  stylesToAvoid:         string[]
}

export interface ArtworkAnalysis {
  dominantColors: string[]
  style:          string
  mood:           string
  format:         'portrait' | 'landscape' | 'square'
  tags:           string[]
}

export interface PlacementData {
  // Position/size relative to the room image (0-1 normalized).
  x:        number
  y:        number
  width:    number
  height:   number
  rotation: number
  aspectRatio?: string
  mode:     'flat' | 'perspective' | 'replace_existing'
}

export interface ImprovementTip {
  id:       string
  label:    string
  category: 'size' | 'position' | 'color' | 'style' | 'frame'
  apply?:   Partial<PlacementData>  // hint the editor can use to apply the suggestion
}

export interface StyleMatchResult {
  styleMatchScore:     number  // 0-100, weighted overall
  colorMatchScore:     number
  sizeMatchScore:      number
  styleScore:          number
  roomHarmonyScore:    number
  explanation:         string  // human-readable paragraph
  improvementTips:     ImprovementTip[]
  recommendedColors:   string[]
  recommendedSize:     { wMin: number; wMax: number; hMin: number; hMax: number }
  recommendedPosition: { x: number; y: number }
}

export type RenderQuality = 'quick' | 'realistic' | 'high_quality'

export interface VisualizationRequest {
  roomImageUrl:    string
  artworkImageUrl: string
  placementData:   PlacementData
  renderQuality:   RenderQuality
}

export interface VisualizationResult {
  resultImageUrl: string
  status:         'succeeded' | 'failed'
  error?:         string
  metadata: {
    provider:    string
    modelUsed:   string
    durationMs:  number
  }
}

export interface AiProvider {
  analyzeRoom:           (input: { roomImageUrl: string }) => Promise<RoomAnalysis>
  analyzeArtwork:        (input: { artworkImageUrl: string }) => Promise<ArtworkAnalysis>
  generateStyleMatch:    (input: {
    roomAnalysis:    RoomAnalysis
    artworkAnalysis: ArtworkAnalysis
    placementData:   PlacementData
  }) => Promise<StyleMatchResult>
  generateVisualization: (input: VisualizationRequest) => Promise<VisualizationResult>
}
