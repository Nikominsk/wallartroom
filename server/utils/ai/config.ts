// Central AI config. All model names live here so they can be swapped without
// touching call sites.
//
// Phase 2 ships with an entirely mock provider; Phase 4 swaps in OpenAI by
// changing AI_PROVIDER=openai and supplying OPENAI_API_KEY.

// Renamed from `AiProvider` to avoid colliding with the interface of the same
// name in ./types — both were getting auto-imported and Nuxt warned about it.
export type AiProviderName = 'mock' | 'openai'

export interface AiConfig {
  provider:        AiProviderName
  cheapTextModel:  string  // tags, gallery metadata, simple labels
  visionModel:     string  // room understanding, style match scoring
  imageModel:      string  // visualization (placement / replacement)
}

function env(key: string, fallback = ''): string {
  return (process.env[key] || fallback).trim()
}

export function getAiConfig(): AiConfig {
  return {
    provider:       (env('AI_PROVIDER', 'mock') as AiProviderName),
    cheapTextModel: env('OPENAI_CHEAP_TEXT_MODEL',   'gpt-4o-mini'),
    visionModel:    env('OPENAI_VISION_MODEL',       'gpt-4o'),
    imageModel:     env('OPENAI_IMAGE_MODEL',        'gpt-image-1'),
  }
}
