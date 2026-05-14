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

  // The previous prompt hard-coded "Recommended: 40–70 characters" which is why
  // generated titles came back ~56 chars even when the configured max was 100.
  // The recommended range now follows the configured max so the AI uses the
  // length the user actually asked for.
  const titleMax = clampInt(options?.maxPinterestTitleLength, 30, 100, 100)
  const titleTargetMin = Math.max(20, Math.floor(titleMax * 0.8))

  const descMax = clampInt(options?.maxPinterestDescriptionLength, 50, 500, 500)
  const descTargetMin = Math.max(80, Math.floor(descMax * 0.6))

  // Trim and cap to avoid runaway prompt size when the run already has hundreds
  // of titles — the most recent N are the ones most likely to collide.
  const recentExistingTitles = Array.isArray(existingTitles)
    ? existingTitles.filter(t => typeof t === 'string' && t.trim()).slice(-80)
    : []

  const systemPrompt = `You are an SEO expert specializing in Pinterest marketing for digital wall art prints sold on platforms like Etsy or a personal shop.

Your task: generate highly optimized Pinterest metadata (title + description) that maximizes search discoverability, click-through rate, and conversion.

Pinterest title rules:
- Hard maximum: ${titleMax} characters
- Target length: ${titleTargetMin}–${titleMax} characters. Use as much of this range as possible — do NOT default to short titles.
- Put the main keyword near the beginning
- Every title in this batch MUST be unique. Do not reuse, paraphrase lightly, or simply re-order words from any of the titles below.

Pinterest description rules:
- Hard maximum: ${descMax} characters
- Target length: ${descTargetMin}–${descMax} characters
- Put the most important keywords in the first sentence
- Write naturally, not keyword-stuffed

CRITICAL formatting rules (no exceptions):
- Never use hyphens (-), pipe characters (|), or semicolons (;) anywhere in the title or description
- Use spaces or commas instead

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

  return {
    pinterest: {
      title: clean(parsed.title).slice(0, titleMax),
      description: clean(parsed.description).slice(0, descMax),
      ...(pickedBoard ? { board: pickedBoard } : {}),
    },
    adobeStock: {},
  }
})

function clampInt(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, Math.round(n)))
}
