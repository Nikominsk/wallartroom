export type PinterestStatus = 'draft' | 'ready' | 'exported' | 'published' | 'error'
export type AdobeStockStatus = 'draft' | 'ready' | 'scheduled' | 'submitted' | 'error'
export type AiImageStatus = 'queued' | 'generating' | 'done' | 'failed' | 'skipped'
export type SortField =
  | 'filename'
  | 'createdAt'
  | 'updatedAt'
  | 'pinterestStatus'
  | 'adobeStockStatus'
  | 'pinterestPublishDate'
  | 'adobeStockPublishDate'
export type SortDirection = 'asc' | 'desc'

export interface ImageColor {
  hex: string
  label?: string
}

export interface GalleryImage {
  id: string
  filename: string
  mediaUrl: string
  thumbnailUrl?: string
  createdAt?: string
  updatedAt?: string
  prompt?: string
  colors?: ImageColor[]
  pinterest: {
    title?: string
    description?: string
    board?: string
    link?: string
    publishDate?: string
    exportedAt?: string
    publishedAt?: string
    status?: PinterestStatus
  }
  adobeStock: {
    title?: string
    description?: string
    keywords?: string[]
    publishDate?: string
    status?: AdobeStockStatus
  }
}

export interface FilterState {
  search: string
  pinterestComplete: '' | 'complete' | 'incomplete'
  adobeStockComplete: '' | 'complete' | 'incomplete'
  pinterestDate: '' | 'set' | 'missing'
  adobeStockDate: '' | 'set' | 'missing'
  pinterestExported: '' | 'exported' | 'not-exported'
  pinterestPublished: '' | 'published' | 'not-published'
  onlySelected: boolean
}

export interface BulkField<T = string> {
  enabled: boolean
  value: T
  clear: boolean
}

export interface BulkEditSpec {
  pinterestTitle: BulkField
  pinterestDescription: BulkField
  pinterestBoard: BulkField
  pinterestLink: BulkField
  pinterestPublishDate: BulkField
  adobeStockTitle: BulkField
  adobeStockDescription: BulkField
  adobeStockKeywords: BulkField<string[]>
  adobeStockPublishDate: BulkField
}

export interface AiGenerationOptions {
  generateFor: {
    pinterestTitle: boolean
    pinterestDescription: boolean
    adobeStockTitle: boolean
    adobeStockDescription: boolean
    adobeStockKeywords: boolean
  }
  tone: string
  targetAudience: string
  niche: string
  includeKeywords: string
  excludeKeywords: string
  language: string
  maxPinterestTitleLength: number
  maxPinterestDescriptionLength: number
  maxAdobeStockTitleLength: number
  maxAdobeStockDescriptionLength: number
  adobeStockKeywordCount: number
  usePromptAsContext: boolean
  useColorsAsContext: boolean
  overwriteMode: 'missing-only' | 'replace' | 'ask'
}

export interface ScheduleOptions {
  targetField: 'pinterestPublishDate' | 'adobeStockPublishDate'
  startDate: string
  startTime: string
  intervalMinutes: number
  skipExisting: boolean
  overwriteExisting: boolean
}

export interface AiProgress {
  status: 'idle' | 'running' | 'done' | 'cancelled'
  current: number
  total: number
  imageStatuses: Record<string, AiImageStatus>
  successCount: number
  failedCount: number
  skippedCount: number
  failedIds: string[]
}

export interface PinterestValidationResult {
  valid: GalleryImage[]
  invalid: { image: GalleryImage; missing: string[] }[]
}

export interface ValidationIssue {
  field: string
  message: string
  platform: 'pinterest' | 'adobeStock' | 'general'
}
