// Single entry point. `getAi()` returns the active provider. Phase 2 always
// returns the mock; Phase 4 will branch to OpenAI when AI_PROVIDER=openai.

import type { AiProvider } from './types'
import { mockProvider } from './mock'
import { getAiConfig } from './config'

export * from './types'
// `getAiConfig` is already auto-imported from ./config — re-exporting it here
// produced a Nuxt "duplicated imports" warning, so we leave it at its source.

export function getAi(): AiProvider {
  const cfg = getAiConfig()
  switch (cfg.provider) {
    case 'mock':
      return mockProvider
    case 'openai':
      throw new Error('OpenAI provider not yet implemented (Phase 4)')
    default:
      return mockProvider
  }
}
