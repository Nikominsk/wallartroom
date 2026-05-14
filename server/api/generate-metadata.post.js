export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { filename, prompt, colors, additionalContext, options, boards, existingTitles } = body

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })
  }

  const colorList = (colors ?? [])
    .map(c => c.label || c.hex)
    .filter(Boolean)
    .join(', ')

  const contextLines = []
  if (options?.usePromptAsContext && prompt) contextLines.push(`Image creation prompt: "${prompt}"`)
  if (options?.useColorsAsContext && colorList) contextLines.push(`Dominant colors: ${colorList}`)
  if (additionalContext?.trim()) contextLines.push(`Additional context: ${additionalContext.trim()}`)

  const includeKw = options?.includeKeywords?.trim()
  const excludeKw = options?.excludeKeywords?.trim()

  // Database CHECK constraints from migration 001 — title <= 100, description
  // <= 500. We never truncate based on the *user setting* (that would chop
  // text mid-sentence at e.g. 300 chars and read unprofessionally). The user
  // setting is the AI's instruction; this DB cap is a silent last-resort so
  // a runaway response can't break the save.
  const TITLE_DB_MAX = 100
  const DESC_DB_MAX = 500

  // The user's configured max is the AI target ceiling — only fed into the
  // prompt, NOT used to slice the response. If the user setting is missing or
  // invalid we fall back to a sensible default.
  const titleMax = clampInt(options?.maxPinterestTitleLength, 30, TITLE_DB_MAX, TITLE_DB_MAX)
  const titleTargetMin = Math.max(20, Math.floor(titleMax * 0.8))

  const descMax = clampInt(options?.maxPinterestDescriptionLength, 50, DESC_DB_MAX, 300)
  const descTargetMin = Math.max(80, Math.floor(descMax * 0.6))

  // Trim and cap to avoid runaway prompt size when the run already has hundreds
  // of titles — the most recent N are the ones most likely to collide.
  const recentExistingTitles = Array.isArray(existingTitles)
    ? existingTitles.filter(t => typeof t === 'string' && t.trim()).slice(-80)
    : []

  const systemPrompt = `You are an SEO expert specializing in Pinterest marketing for digital wall art prints sold on platforms like Etsy or a personal shop.

Your task: generate highly optimized Pinterest metadata (title + description) that maximizes search discoverability, click-through rate, and conversion.

Pinterest title rules:
- Hard maximum: ${titleMax} characters. NEVER exceed this — the title will be saved exactly as you return it, no truncation.
- Target length: ${titleTargetMin}–${titleMax} characters. Use as much of this range as possible — do NOT default to short titles.
- The title must end with a complete word and proper punctuation. No mid-word cut-offs.
- Put the main keyword near the beginning
- Every title in this batch MUST be unique. Do not reuse, paraphrase lightly, or simply re-order words from any of the titles below.

Pinterest description rules:
- Hard maximum: ${descMax} characters. NEVER exceed this — the description will be saved exactly as you return it, no truncation.
- Target length: ${descTargetMin}–${descMax} characters
- The description must end with a complete sentence and proper punctuation. No mid-sentence cut-offs.
- Put the most important keywords in the first sentence
- Write naturally, not keyword-stuffed

CRITICAL formatting rules (no exceptions):
- Forbidden characters anywhere in the title or description: hyphen "-", pipe "|", semicolon ";". Treat these as banned — they break the downstream Pinterest CSV import.
- Use spaces or commas instead of those characters.
- Stay within the character limits above — going over WILL get cut.

Additional guidelines:
- Language: ${options?.language ?? 'English'}
- Tone/style: ${options?.tone?.trim() || 'inspiring, elegant, modern'}
- Target audience: ${options?.targetAudience?.trim() || 'home decorators, interior design lovers'}
- Niche: ${options?.niche?.trim() || 'wall art, home decor, printable art'}${includeKw ? `\n- You MUST include these keywords naturally: ${includeKw}` : ''}${excludeKw ? `\n- You MUST NOT use these words: ${excludeKw}` : ''}${boards?.length ? `\n- Pinterest board: pick the single most fitting board from this list and return it as the "board" field: ${boards.join(', ')}` : ''}${recentExistingTitles.length ? `\n\nTitles ALREADY used in this run (your new title must NOT match or be a trivial variation of any of these):\n${recentExistingTitles.map(t => `- ${t}`).join('\n')}` : ''}

Respond with a JSON object containing exactly two keys: "title" (string) and "description" (string). No other keys. No markdown.`

  const userPrompt = [
    `Filename: ${filename}`,
    ...contextLines,
    '',
    `Generate the Pinterest metadata now. Title MUST be ${titleTargetMin}–${titleMax} characters, MUST be unique vs. the list above.`,
  ].join('\n')

  const response = await $fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.8,
    }),
  }).catch((e) => {
    throw createError({ statusCode: 502, statusMessage: e?.data?.error?.message ?? 'OpenAI API error' })
  })

  let parsed
  try {
    parsed = JSON.parse(response.choices[0].message.content)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Could not parse OpenAI response' })
  }

  const clean = str => String(str ?? '').replace(/[-|;]/g, ' ').replace(/\s{2,}/g, ' ').trim()

  const pickedBoard = boards?.length && parsed.board && boards.includes(parsed.board)
    ? parsed.board
    : null

  // The AI is told the limit but doesn't always respect it. We enforce the
  // user-configured max in code — but instead of a dumb mid-word slice, we cut
  // at the last full sentence (or failing that, the last word) so the text
  // still reads cleanly.
  return {
    pinterest: {
      title: trimToLimit(clean(parsed.title), titleMax, { sentenceAware: false }),
      description: trimToLimit(clean(parsed.description), descMax, { sentenceAware: true }),
      ...(pickedBoard ? { board: pickedBoard } : {}),
    },
    adobeStock: {},
  }
})

// Truncates `text` so its length never exceeds `max`. Prefers a sentence
// boundary (when sentenceAware), then a word boundary, then a hard cut as a
// last resort. The 70% floor keeps us from cutting aggressively short when an
// early sentence/word boundary would chop off most of the content.
function trimToLimit(text, max, { sentenceAware = false } = {}) {
  const t = String(text ?? '')
  if (t.length <= max) return t

  const slice = t.slice(0, max)
  const minAcceptable = Math.floor(max * 0.7)

  if (sentenceAware) {
    const match = slice.match(/^[\s\S]*[.!?](?=\s|$)/)
    if (match && match[0].length >= minAcceptable) {
      return match[0].trim()
    }
  }

  const lastSpace = slice.lastIndexOf(' ')
  if (lastSpace >= minAcceptable) {
    const out = slice.slice(0, lastSpace).trim()
    if (!sentenceAware) return out
    // Add a period so the description ends on a complete sentence even when we
    // couldn't reach an existing one. Keep the total within `max`.
    if (/[.!?]$/.test(out)) return out
    return out.length + 1 <= max ? `${out}.` : out
  }

  return slice.trim()
}

function clampInt(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}
