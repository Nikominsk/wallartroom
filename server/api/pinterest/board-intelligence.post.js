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

export default defineEventHandler(async (event) => {
  const { projectId, user } = await requireMetadataProject(event)
  const body = await readBody(event)
  const { title, description, keywords, filename, boards, forceNewSuggestion } = body

  if (!boards?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No boards provided' })
  }

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
  // Skip board-list analysis entirely and just ask the model to invent a
  // specific new board name for this pin.
  if (forceNewSuggestion) {
    const pinLines = [
      title       ? `Title: "${title}"`       : '',
      description ? `Description: "${description}"` : '',
      filename    ? `Filename: ${filename}`   : '',
    ].filter(Boolean).join('\n')

    const resp = await $fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a Pinterest board naming expert. Given a pin's text data, suggest ONE specific, topical Pinterest board name that would be the ideal home for this pin. The name should be 2–4 words, Title Case, and describe a precise niche (e.g. "Minimalist Office Decor", "Botanical Wall Art"). Do NOT suggest generic catch-all names like "All", "Everything", "My Pins". Respond with JSON: {"newBoard": "Board Name Here", "reasoning": "one sentence"}`,
          },
          { role: 'user', content: pinLines || 'No text data provided.' },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 100,
        temperature: 0.5,
      }),
    }).catch((e) => {
      throw createError({ statusCode: 502, statusMessage: e?.data?.error?.message ?? 'OpenAI API error' })
    })

    let p
    try { p = JSON.parse(resp.choices[0].message.content) } catch {
      throw createError({ statusCode: 502, statusMessage: 'Could not parse AI response' })
    }

    const suggested = String(p.newBoard ?? '').trim()
    return {
      recommendedBoards: [],
      newBoard: suggested || null,
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

  const systemPrompt = `You are a Pinterest board placement assistant. Go through every board in the list and decide which ones this pin belongs on.

You only have text to work with (title, description, filename, keywords). You cannot see the image. This means:
- You MUST base every recommendation on words that are explicitly present in the provided text.
- You MUST NOT infer what the image might contain beyond what the text states.
- If the text is sparse or ambiguous, make fewer recommendations — do not guess.

Apply these two rules:

RULE 1 — Catch-all boards (always include):
If a board name clearly signals it collects everything ("All", "Everything", "All Pins", "My Pins", a bare shop or brand name, etc.), always include it regardless of content.

RULE 2 — Topical boards (evidence required):
A topical board has a specific theme. Only include it when you can point to a specific word or phrase in the provided text that directly matches that theme.
- "directly matches" means the text explicitly mentions the topic — not that the topic could be inferred, imagined, or assumed.
- Example: text says "floral wall art print" → "Botanical Wall Art" board ✓; "Pets" board ✗ (no mention of animals).
- If you cannot find an explicit textual match, do NOT include the board.${hasStats ? `
- When multiple topical boards have explicit support, prefer higher-traffic ones.` : ''}

RULE 3 — Auto-suggest a new specific board when only catch-alls match:
If your "recommendedBoards" list contains ONLY catch-all boards (no topical board fits), ALSO populate "newBoard" with one specific topical board name (2–4 words, Title Case) that would suit this pin — give the user a concrete themed option alongside their catch-all collection. If at least one topical board is already in "recommendedBoards", set "newBoard" to null.

Only leave "recommendedBoards" entirely empty AND use "newBoard" when no board at all (not even a catch-all) fits.
"reasoning" must be one short concrete sentence (max 15 words) naming the specific text evidence. No vague filler.

Respond with JSON only:
{
  "recommendedBoards": ["Exact board name from list", "Another exact name"],
  "newBoard": null,
  "reasoning": "Concrete one-liner citing the evidence."
}`

  const userPrompt = [
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
        { role: 'user', content: userPrompt },
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

  // New-board suggestion is valid when:
  //   a) No existing boards were recommended at all, OR
  //   b) Every recommended board is a catch-all (the model should also have
  //      provided a specific topical option per RULE 3)
  // Either way, the suggested name must not already exist in the board list.
  const rawNew = cleanName(parsed.newBoard)
  const allCatchAll = recommendedBoards.length > 0 && recommendedBoards.every(isCatchAll)
  const newBoard = (rawNew && !resolve(rawNew) && (recommendedBoards.length === 0 || allCatchAll))
    ? rawNew
    : null

  await recordUsage(event, user.id, { aiGenerations: 1 })

  return {
    recommendedBoards,
    newBoard,
    reasoning: parsed.reasoning || '',
  }
})
