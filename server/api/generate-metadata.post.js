export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await assertQuota(event, user.id, 'aiGenerations', 1)

  const body = await readBody(event)
  const { imageUrl, additionalContext, options, boards, existingTitles } = body

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })
  }

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

  const wantsBoard = Array.isArray(boards) && boards.length > 0

  // ── Call 1: generate title + description ──────────────────────────────────
  // Board names are intentionally absent here. The content must be driven
  // purely by the image, not by how the user named their boards.

  const systemPrompt = `You are a Pinterest SEO specialist writing a title and description for a pin.

## Your only job: describe what you SEE in the image

Look at the image carefully. Write about the specific subject, mood, colours, and style visible. Do NOT invent context, product framing, or sales language that isn't in the image.

- Do NOT append generic terms like "Wall Art", "Digital Print", "Home Decor", "Printable" unless the image itself is literally a framed print or wall decoration.
- Do NOT add a call-to-action ("Shop now", "Save for later", "Order yours", etc.).
- Do NOT add lifestyle copy ("Add a touch of whimsy to your home", "Perfect for any room", etc.).
- The title and description must be readable as a plain description of the image.

## Title rules
- Hard maximum: ${titleMax} characters. NEVER exceed — saved exactly as returned.
- Target: ${titleTargetMin}–${titleMax} characters.
- End on a complete word.
- Subject keyword MUST appear in the first 3 words.
- Every title in this batch must be unique — no reuse from the list below.

## Description rules
- Hard maximum: ${descMax} characters. NEVER exceed.
- Target: ${descTargetMin}–${descMax} characters.
- First sentence names the specific subject and visual style.
- Natural prose, keyword density 1–3%.

## Formatting
- Forbidden anywhere: hyphen "-", pipe "|", semicolon ";". Use a space or comma instead.

## Output settings
- Language: ${options?.language ?? 'English'} — write the title and description EXCLUSIVELY in this language, regardless of the image content.${options?.targetAudience?.trim() ? `\n- Audience: ${options.targetAudience.trim()}` : ''}${options?.niche?.trim() ? `\n- Niche: ${options.niche.trim()}` : ''}${includeKw ? `\n- MUST include naturally: ${includeKw}` : ''}${excludeKw ? `\n- MUST NOT use: ${excludeKw}` : ''}${recentExistingTitles.length ? `\n\n## Already-used titles — do NOT reuse or trivially vary\n${recentExistingTitles.map(t => `- ${t}`).join('\n')}` : ''}${userInstructions ? `\n\n## User instructions — HIGHEST PRIORITY. These override every rule above without exception. Follow them exactly and literally.\n${userInstructions}` : ''}${wantsBoard ? `\n\n## Board assignment\nBoard names are written in ${options?.boardLanguage ?? 'English'}.\n1. Pick the most relevant board from the list below and return its exact name unchanged.\n2. If none of the listed boards fit the image content, recommend a short descriptive board name written in ${options?.boardLanguage ?? 'English'} — do NOT return an empty string.\nBoards: ${boards.join(', ')}` : ''}

Respond with JSON only — keys "title" (string), "description" (string)${wantsBoard ? ', "board" (string)' : ''}. No markdown.`

  const textLines = `Write the Pinterest title (${titleTargetMin}–${titleMax} chars) and description (${descTargetMin}–${descMax} chars)${wantsBoard ? ', and pick the best board' : ''}. Base everything on what you can see in the image.`

  const userMessage = {
    role: 'user',
    content: [
      { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
      { type: 'text', text: textLines },
    ],
  }

  const contentResponse = await openAiCall(apiKey, {
    model: 'gpt-4o',
    messages: [{ role: 'system', content: systemPrompt }, userMessage],
    response_format: { type: 'json_object' },
    max_tokens: 420,
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

  let pickedBoard = null
  if (wantsBoard && parsed.board) {
    const want = String(parsed.board).trim().toLowerCase()
    pickedBoard = boards.find(b => b === parsed.board)
      ?? boards.find(b => String(b).trim().toLowerCase() === want)
      ?? null
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
      const msg = e?.data?.error?.message ?? e?.data?.message ?? e?.message ?? JSON.stringify(e?.data ?? e ?? 'unknown')
      if (status === 429 && n < 5) {
        // Parse the exact wait time OpenAI embeds in the error message, e.g.
        // "Please try again in 2.984s." — add 500ms headroom then retry.
        const match = String(msg).match(/try again in (\d+\.?\d*)s/)
        const wait = match
          ? Math.ceil(parseFloat(match[1]) * 1000) + 500
          : Math.min((2 ** n) * 2000, 30000)
        await new Promise(r => setTimeout(r, wait))
        return attempt(n + 1)
      }
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
