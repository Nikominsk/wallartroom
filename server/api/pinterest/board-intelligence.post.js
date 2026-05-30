// AI board placement. Project-scoped so it can enrich the candidate boards
// with their REAL Pinterest performance (imported via the analytics CSV) and
// the account's strongest themes — the model then prefers proven, relevant
// boards instead of routing a strong pin into a dead board.
export default defineEventHandler(async (event) => {
  const { projectId, user } = await requireMetadataProject(event)
  const body = await readBody(event)
  const { title, description, keywords, filename, boards } = body

  if (!boards?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No boards provided' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })
  }

  await assertQuota(event, user.id, 'aiGenerations', 1)

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

  const systemPrompt = `You are a Pinterest marketing strategist. Given pin content and a list of available boards, determine the best board placement.

Pinterest SEO works best when a pin sits on a SPECIFIC, topical board — narrow boards rank better in search and reach the right audience. A pin on a precise board ("Botanical Wall Art", "Minimalist Floral Prints") performs far better than the same pin dumped on a generic catch-all board.

Analyze the pin's topic, keywords, and visual theme, then score each board:
- Topical relevance: does the board's theme specifically match the pin's subject?
- Specificity: SPECIFIC boards are strongly preferred. Treat generic catch-all boards (names like "All", "General", "Misc", "Other", "Everything", "Pins", a brand name alone) as a POOR fit — never score them above 40, because they give the pin no search context.
- Keyword & audience alignment: would someone browsing that board expect this exact pin?${hasStats ? `
- Real performance: each board is tagged with its actual Pinterest traffic. When two SPECIFIC boards are similarly relevant, prefer the higher-performing one. Never force a pin onto a generic board just because it has traffic.` : ''}

IMPORTANT RULES:
- Prefer an EXACT board name copied from the "Available boards" list when a SPECIFIC board genuinely fits (score 50+). Set "isNewBoard" to false.
- If the only fitting boards are generic catch-alls (or nothing fits well), propose a brand-new SPECIFIC board: put a concise, descriptive Pinterest-style name (2–4 words, Title Case, e.g. "Botanical Wall Art") in "suggestedBoard" and set "isNewBoard" to true.
- "alternativeBoards" MUST list the 2–3 next-best SPECIFIC boards from the "Available boards" list, ranked by score. When "isNewBoard" is true these are the user's best existing options. Never include generic catch-all boards unless no specific board exists. Omit the primary suggestedBoard from this list. If fewer than 2 alternatives exist return as many as you can (can be empty array).
- All score fields are integers 0–100.
- "reasoning" MUST be one short, CONCRETE sentence (max 18 words) that names the pin's actual subject and why the board fits it. Do not use vague filler like "aligns with the themes".

Respond with JSON:
{
  "suggestedBoard": "exact board name from the list, OR a new specific board name when isNewBoard is true",
  "relevanceScore": 85,
  "reasoning": "Concrete one-liner naming the pin's subject and the specific fit.",
  "alternativeBoards": [
    {"name": "second best board name from the list", "score": 70},
    {"name": "third best board name from the list", "score": 55}
  ],
  "isNewBoard": false
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
    'Which board is the best fit for this pin? Return the board NAME exactly as written before any [brackets].',
  ].filter(Boolean).join('\n')

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

  // The model may echo the "[tier: …]" annotation — strip it back to the bare
  // name, then resolve to a REAL board name from the list (exact, then
  // case-insensitive).
  const cleanName = (v) => String(v ?? '').replace(/\s*\[.*$/, '').trim()
  const resolve = (v) => {
    const name = cleanName(v)
    if (!name) return null
    const want = name.toLowerCase()
    return boards.find(b => b === name) ?? boards.find(b => String(b).trim().toLowerCase() === want) ?? null
  }

  const rawSuggested = cleanName(parsed.suggestedBoard)
  const matched = resolve(parsed.suggestedBoard)

  // It's a new board only if the model flagged it AND the name isn't already
  // one of the user's boards. Otherwise resolve to the matching board (or, as
  // a last resort, the first board so we never return an empty suggestion).
  const isNewBoard = !!parsed.isNewBoard && !matched && !!rawSuggested
  const suggested = isNewBoard ? rawSuggested : (matched ?? boards[0] ?? null)

  // Build the ranked alternative list. Each entry must resolve to a real board
  // name from the user's list and must differ from the primary suggestion.
  const rawAlts = Array.isArray(parsed.alternativeBoards) ? parsed.alternativeBoards : []
  const seen = new Set([suggested?.toLowerCase()])
  const alternativeBoards = []

  for (const entry of rawAlts) {
    const name = resolve(typeof entry === 'string' ? entry : entry?.name)
    if (!name) continue
    if (seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    const score = Math.min(100, Math.max(0, Number(entry?.score ?? 0)))
    alternativeBoards.push({ name, score })
    if (alternativeBoards.length >= 3) break
  }

  // If the model returned nothing useful, fill with the next best boards from
  // the list so the section is never empty when alternatives exist.
  if (alternativeBoards.length === 0 && boards.length) {
    for (const b of boards) {
      if (seen.has(b.toLowerCase())) continue
      alternativeBoards.push({ name: b, score: 0 })
      if (alternativeBoards.length >= 2) break
    }
  }

  await recordUsage(event, user.id, { aiGenerations: 1 })

  return {
    suggestedBoard: suggested,
    relevanceScore: Math.min(100, Math.max(0, Number(parsed.relevanceScore) || 0)),
    reasoning: parsed.reasoning || '',
    alternativeBoards,
    isNewBoard,
  }
})
