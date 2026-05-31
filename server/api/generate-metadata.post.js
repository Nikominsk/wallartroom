export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await assertQuota(event, user.id, 'aiGenerations', 1)

  const body = await readBody(event)
  const { filename, imageUrl, prompt, colors, additionalContext, accountContext, options, boards, existingTitles } = body

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })
  }

  const colorList = (colors ?? [])
    .map(c => c.label || c.hex)
    .filter(Boolean)
    .join(', ')

  // Creation prompt is the richest subject signal — put it before the filename.
  const contextLines = []
  if (options?.usePromptAsContext && prompt) contextLines.push(`Image creation prompt: "${prompt}"`)
  if (colorList) contextLines.push(`Dominant colors: ${colorList}`)
  // additionalContext is intentionally NOT added to contextLines — it goes into
  // the system prompt as override instructions so the model treats it as rules,
  // not passive background. A user instruction like "add hashtags" must win over
  // the default "end with a CTA" rule.
  const userInstructions = additionalContext?.trim() || ''

  const includeKw = options?.includeKeywords?.trim()
  const excludeKw = options?.excludeKeywords?.trim()

  const TITLE_DB_MAX = 100
  const DESC_DB_MAX  = 500

  const titleMax      = clampInt(options?.maxPinterestTitleLength,       30, TITLE_DB_MAX, TITLE_DB_MAX)
  const titleTargetMin = Math.max(20, Math.floor(titleMax * 0.8))

  const descMax       = clampInt(options?.maxPinterestDescriptionLength, 50, DESC_DB_MAX, 300)
  const descTargetMin = Math.max(200, Math.floor(descMax * 0.6))

  const recentExistingTitles = Array.isArray(existingTitles)
    ? existingTitles.filter(t => typeof t === 'string' && t.trim()).slice(-80)
    : []

  const hasImage  = typeof imageUrl === 'string' && imageUrl.startsWith('http')
  const wantsBoard = Array.isArray(boards) && boards.length > 0

  // ── Call 1: generate title + description ──────────────────────────────────
  // Board names are intentionally absent here. The content must be driven
  // purely by the image, not by how the user named their boards.

  const systemPrompt = `You are a Pinterest SEO specialist writing metadata for a digital wall art print listing.${hasImage ? `

## Your #1 job: describe what you SEE in the image

An image is attached. Look at it carefully. Your title and description must describe the specific visual content — the subject, mood, colours, style. Do NOT write generic copy that fits any product.

SUBJECT ACCURACY (overrides everything):
- Title MUST open with what is actually shown: flowers, a mountain, an abstract pattern, a portrait — whatever you see.
  ✓ "Pink Cherry Blossom Print Floral Wall Art Botanical Style"
  ✓ "Mountain Sunset Landscape Printable Art Watercolour Style"
  ✓ "Abstract Blue Geometric Shapes Minimalist Print"
- These openers are BANNED — they describe nothing specific:
  ✗ "Stunning Modern Digital Wall Art…"
  ✗ "Beautiful Home Decor Print…"
  ✗ "Vibrant Digital Art Print…"
  ✗ Any phrase that could describe ANY wall art product
- The description's first sentence must name the specific subject and visual style you observe.` : `

## Your #1 job: describe the specific image subject

You cannot see the image. Extract every clue from the filename, creation prompt, and colours provided. The title and description MUST reflect this specific image, not generic wall art copy.

SUBJECT ACCURACY (overrides everything):
- Title MUST open with the specific subject in the first 3 words.
- BANNED openers: "Stunning Modern Digital Wall Art", "Beautiful Home Decor Print", "Vibrant Digital Art Print", or any phrase that fits ANY product.
- The description's first sentence must name the specific subject.`}${accountContext?.trim() ? `\n\n## Account context\n${accountContext.trim()}` : ''}

## Title rules
- Hard maximum: ${titleMax} characters. NEVER exceed — saved exactly as returned.
- Target: ${titleTargetMin}–${titleMax} characters. Fill this range.
- End on a complete word. No mid-word cut-offs.
- Subject keyword MUST appear in the first 3 words.
- Every title in this batch must be unique — no reuse from the list below.

## Description rules
- Hard maximum: ${descMax} characters. NEVER exceed.
- Target: ${descTargetMin}–${descMax} characters. Minimum 200 — short descriptions rank poorly.
- End with a complete sentence.
- First sentence: subject keyword + 2–3 related search terms.
- Natural prose, keyword density 1–3%.
- End with a call-to-action ("Shop now", "Save for later", "Click to shop", "Order yours today").

## Formatting
- Forbidden anywhere: hyphen "-", pipe "|", semicolon ";". Use a space or comma instead.

## Style
- Language: ${options?.language ?? 'English'}${options?.tone?.trim() ? `\n- Tone: ${options.tone.trim()}` : ''}${options?.targetAudience?.trim() ? `\n- Audience: ${options.targetAudience.trim()}` : ''}${options?.niche?.trim() ? `\n- Niche: ${options.niche.trim()}` : ''}${includeKw ? `\n- MUST include naturally: ${includeKw}` : ''}${excludeKw ? `\n- MUST NOT use: ${excludeKw}` : ''}${recentExistingTitles.length ? `\n\n## Already-used titles — do NOT reuse or trivially vary\n${recentExistingTitles.map(t => `- ${t}`).join('\n')}` : ''}${userInstructions ? `\n\n## User instructions — these override any conflicting default rules above\n${userInstructions}` : ''}

Respond with JSON only — keys "title" (string) and "description" (string). No markdown.`

  const textLines = [
    ...contextLines,
    `Filename: ${filename}`,
    '',
    `Write the Pinterest title (${titleTargetMin}–${titleMax} chars) and description (${descTargetMin}–${descMax} chars).${hasImage ? ' Base everything on what you can see in the image.' : ' The title must open with the specific image subject.'}`,
  ].join('\n').trim()

  const userMessage = hasImage
    ? {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
          { type: 'text', text: textLines },
        ],
      }
    : { role: 'user', content: textLines }

  const contentResponse = await openAiCall(apiKey, {
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, userMessage],
    response_format: { type: 'json_object' },
    max_tokens: 600,
    temperature: 0.6,
  })

  let parsed
  try {
    parsed = JSON.parse(contentResponse.choices[0].message.content)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Could not parse OpenAI response' })
  }

  const clean = str => String(str ?? '').replace(/[-|;]/g, ' ').replace(/\s{2,}/g, ' ').trim()
  const title       = trimToLimit(clean(parsed.title),       titleMax, { sentenceAware: false })
  const description = trimToLimit(clean(parsed.description), descMax,  { sentenceAware: true  })

  // ── Call 2: board picking ─────────────────────────────────────────────────
  // Separate call so board names never contaminate the title/description above.
  // Uses gpt-4o-mini — this is pure classification, no creativity needed.
  let pickedBoard = null
  if (wantsBoard) {
    const boardResponse = await openAiCall(apiKey, {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a Pinterest board classifier. Given a pin title and description, pick the single most relevant board from the provided list. Return the exact board name with no changes. Respond with JSON: {"board": "exact board name"}`,
        },
        {
          role: 'user',
          content: `Title: "${title}"\nDescription: "${description}"\n\nBoards: ${boards.join(', ')}\n\nWhich single board fits best?`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 60,
      temperature: 0,
    }).catch(() => null)

    if (boardResponse) {
      try {
        const bp = JSON.parse(boardResponse.choices[0].message.content)
        const want = String(bp.board ?? '').trim().toLowerCase()
        pickedBoard = boards.find(b => b === bp.board)
          ?? boards.find(b => String(b).trim().toLowerCase() === want)
          ?? null
      } catch { /* board picking failure is non-fatal */ }
    }
  }

  await recordUsage(event, user.id, { aiGenerations: 1 })

  return {
    pinterest: {
      title,
      description,
      ...(pickedBoard ? { board: pickedBoard } : {}),
    },
    adobeStock: {},
  }
})

async function openAiCall(apiKey, body) {
  return (async function attempt(n) {
    try {
      return await $fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (e) {
      const status = e?.response?.status ?? e?.status ?? 0
      if (status === 429 && n < 4) {
        await new Promise(r => setTimeout(r, (2 ** n) * 1000))
        return attempt(n + 1)
      }
      const msg = e?.data?.error?.message ?? e?.data?.message ?? e?.message ?? JSON.stringify(e?.data ?? e ?? 'unknown')
      throw createError({ statusCode: 502, statusMessage: `OpenAI: ${msg}` })
    }
  })(0)
}

function trimToLimit(text, max, { sentenceAware = false } = {}) {
  const t = String(text ?? '')
  if (t.length <= max) return t

  const slice = t.slice(0, max)
  const minAcceptable = Math.floor(max * 0.7)

  if (sentenceAware) {
    const match = slice.match(/^[\s\S]*[.!?](?=\s|$)/)
    if (match && match[0].length >= minAcceptable) return match[0].trim()
  }

  const lastSpace = slice.lastIndexOf(' ')
  if (lastSpace >= minAcceptable) {
    const out = slice.slice(0, lastSpace).trim()
    if (!sentenceAware) return out
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
