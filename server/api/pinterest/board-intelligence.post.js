// AI board placement. Project-scoped so it can enrich the candidate boards
// with their REAL Pinterest performance (imported via the analytics CSV) and
// the account's strongest themes — the model then prefers proven, relevant
// boards instead of routing a strong pin into a dead board.
// A board is "catch-all" when its name signals it collects everything rather
// than a specific topic. We use this to decide whether to also auto-suggest a
// new specific board name even when existing boards were recommended.
function isCatchAll(name) {
  const l = String(name ?? '').toLowerCase().trim()
  const exact = new Set(['all', 'everything', 'all pins', 'my pins', 'general', 'misc', 'other', 'pins'])
  if (exact.has(l)) return true
  // "all <anything>" or "<anything> all"
  if (l.startsWith('all ') || l.endsWith(' all')) return true
  return false
}

// Build a GPT-4o user message content array that includes the image when available.
function buildUserContent(textPart, imageUrl) {
  if (!imageUrl) return textPart
  return [
    { type: 'text', text: textPart },
    { type: 'image_url', image_url: { url: imageUrl, detail: 'low' } },
  ]
}

export default defineEventHandler(async (event) => {
  const { projectId, user } = await requireMetadataProject(event)
  const body = await readBody(event)
  const { title, description, keywords, filename, imageUrl, boards, forceNewSuggestion } = body

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })
  }

  // forceNewSuggestion is always fired in parallel with the main board-matching
  // request — both together count as one AI action, so only the main call charges.
  if (!forceNewSuggestion) {
    await assertQuota(event, user.id, 'aiGenerations', 1)
  }

  // ── Fast path: user clicked "Suggest a new board name" ────────────────────
  // Also the only path when the project has no boards yet.
  if (forceNewSuggestion || !boards?.length) {
    const pinLines = [
      title       ? `Title: "${title}"`       : '',
      description ? `Description: "${description}"` : '',
      filename    ? `Filename: ${filename}`   : '',
      imageUrl    ? '' : (!title && !description ? 'No text data provided.' : ''),
    ].filter(Boolean).join('\n')

    const hasText = !!(title || description || filename)
    const systemContent = `You are a Pinterest board naming expert. Given a pin's ${imageUrl ? 'image' : ''}${imageUrl && hasText ? ' and ' : ''}${hasText ? 'text data' : ''}, suggest TWO Pinterest board names for this pin:
1. "newBoardSpecific" — a precise niche name (2–4 words, Title Case) that exactly matches the subject. E.g. "Rocky Mountain Landscapes", "Minimalist Desk Setup".
2. "newBoardBroad" — a broader category name (2–4 words, Title Case) that is still topically relevant but encompasses more content. E.g. "Nature Photography", "Home Office Decor".
Do NOT suggest generic catch-all names like "All", "Everything", "My Pins". Both names must be clearly related to the pin's actual content.
Respond with JSON: {"newBoardSpecific": "...", "newBoardBroad": "...", "reasoning": "one sentence"}`

    const userText = pinLines.trim() || (imageUrl ? 'Analyze the image to suggest board names.' : 'No data provided.')

    const resp = await $fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: buildUserContent(userText, imageUrl) },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 150,
        temperature: 0.5,
      }),
    }).catch((e) => {
      throw createError({ statusCode: 502, statusMessage: e?.data?.error?.message ?? 'OpenAI API error' })
    })

    let p
    try { p = JSON.parse(resp.choices[0].message.content) } catch {
      throw createError({ statusCode: 502, statusMessage: 'Could not parse AI response' })
    }

    if (!forceNewSuggestion) await recordUsage(event, user.id, { aiGenerations: 1 })
    return {
      recommendedBoards: [],
      newBoardSpecific: String(p.newBoardSpecific ?? '').trim() || null,
      newBoardBroad: String(p.newBoardBroad ?? '').trim() || null,
      reasoning: p.reasoning || '',
    }
  }

  const admin = serverSupabaseAdmin(event)

  // Stored per-board performance for this project (from the analytics import).
  const { data: boardRows } = await admin
    .from('pinterest_board')
    .select('name, stat_impressions, stat_saves, stat_engagement')
    .eq('project_id', projectId)
  const statByName = new Map()
  for (const b of boardRows ?? []) {
    if (b.stat_impressions != null) {
      statByName.set(b.name.toLowerCase(), {
        impressions: b.stat_impressions ?? 0,
        saves: b.stat_saves ?? 0,
        engagement: b.stat_engagement ?? 0,
      })
    }
  }

  // Account-level brief (handle + strongest themes + click trend).
  const { data: proj } = await admin
    .from('metadata_project')
    .select('pinterest_analytics')
    .eq('id', projectId)
    .maybeSingle()
  const brief = analyticsBriefForAI(proj?.pinterest_analytics ?? null)

  // Annotate the candidate list with a performance tier so the model can
  // weigh "where will this actually get seen" alongside topical relevance.
  const tierOf = (s) => {
    if (!s) return null
    if (s.impressions >= 50000) return 'top performer'
    if (s.impressions >= 5000) return 'solid'
    if (s.impressions >= 500) return 'modest'
    return 'low traffic'
  }
  const annotated = boards.map((name) => {
    const s = statByName.get(String(name).toLowerCase())
    const tier = tierOf(s)
    return tier
      ? `${name} [${tier}: ${s.impressions.toLocaleString()} impressions, ${s.saves.toLocaleString()} saves]`
      : `${name} [no performance data]`
  })
  const hasStats = statByName.size > 0

  const hasImage = !!imageUrl
  const systemPrompt = `You are a Pinterest board placement assistant. Go through every board in the list and decide which ones this pin belongs on.

${hasImage ? 'You have both the image and any available text (title, description, filename, keywords) to work with.' : 'You only have text to work with (title, description, filename, keywords). You cannot see the image.'}

${hasImage ? `When matching boards:
- Use the image as your primary signal for visual content (colors, style, subject matter, medium).
- Use text as supporting evidence — explicit words strengthen a match.
- A board match must be DIRECT and OBVIOUS. Do not follow chains of loose association.
  ✗ Rock landscape → "Universe" (rocks ≠ space; too abstract)
  ✗ Rock landscape → "Travel" (no travel context shown)
  ✓ Rock landscape → "Nature Photography" (directly matches what is seen)
- If the image is ambiguous and the text gives no clear signal, leave the board out.` : `This means:
- You MUST base every recommendation on words that are explicitly present in the provided text.
- You MUST NOT infer what the image might contain beyond what the text states.
- If the text is sparse or ambiguous, make fewer recommendations — do not guess.`}

Apply these rules:

RULE 1 — Catch-all boards (always include):
If a board name clearly signals it collects everything ("All", "Everything", "All Pins", "My Pins", a bare shop or brand name, etc.), always include it regardless of content.

RULE 2 — Topical boards (strict match only):
A topical board has a specific theme. Only include it when there is DIRECT, UNAMBIGUOUS evidence from ${hasImage ? 'the image or text' : 'the provided text'} that matches that theme.
- "Direct" means the content plainly belongs in that category — not that it could plausibly relate through imagination.
- When in doubt, leave it out. A shorter, accurate list is always better than a longer, inaccurate one.${hasStats ? `
- When multiple topical boards qualify, prefer higher-traffic ones.` : ''}

If no board fits at all (not even a catch-all), return an empty "recommendedBoards" array.
"reasoning" must be one short concrete sentence (max 15 words) naming the specific evidence. No vague filler.

Respond with JSON only:
{
  "recommendedBoards": ["Exact board name from list", "Another exact name"],
  "reasoning": "Concrete one-liner citing the evidence."
}`

  const userText = [
    brief ? `Account context: ${brief}` : '',
    title ? `Pin title: "${title}"` : '',
    description ? `Pin description: "${description}"` : '',
    keywords ? `Keywords: ${keywords}` : '',
    filename ? `Filename: ${filename}` : '',
    '',
    `Available boards: ${annotated.join('; ')}`,
    '',
    'Return board names exactly as written before any [brackets].',
  ].filter(Boolean).join('\n')

  const response = await $fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildUserContent(userText, imageUrl) },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.3,
    }),
  }).catch((e) => {
    throw createError({ statusCode: 502, statusMessage: e?.data?.error?.message ?? 'OpenAI API error' })
  })

  let parsed
  try {
    parsed = JSON.parse(response.choices[0].message.content)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Could not parse AI response' })
  }

  // Strip any "[tier: …]" annotations the model may echo back, then resolve
  // each name to the exact canonical string from the boards list.
  const cleanName = (v) => String(v ?? '').replace(/\s*\[.*$/, '').trim()
  const resolve = (v) => {
    const name = cleanName(v)
    if (!name) return null
    const want = name.toLowerCase()
    return boards.find(b => b === name) ?? boards.find(b => String(b).trim().toLowerCase() === want) ?? null
  }

  // Deduplicate and resolve all recommended existing boards.
  const rawRecs = Array.isArray(parsed.recommendedBoards) ? parsed.recommendedBoards : []
  const seen = new Set()
  const recommendedBoards = []
  for (const entry of rawRecs) {
    const name = resolve(entry)
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    recommendedBoards.push(name)
  }

  await recordUsage(event, user.id, { aiGenerations: 1 })

  return {
    recommendedBoards,
    reasoning: parsed.reasoning || '',
  }
})
