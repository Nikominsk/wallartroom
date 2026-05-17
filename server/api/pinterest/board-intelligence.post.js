// AI board placement. Project-scoped so it can enrich the candidate boards
// with their REAL Pinterest performance (imported via the analytics CSV) and
// the account's strongest themes — the model then prefers proven, relevant
// boards instead of routing a strong pin into a dead board.
export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const body = await readBody(event)
  const { title, description, keywords, filename, boards } = body

  if (!boards?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No boards provided' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })
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

  const systemPrompt = `You are a Pinterest marketing strategist. Given pin content and a list of available boards, determine the best board placement.

Analyze the pin's topic, keywords, and visual theme to match it with the most relevant board. Consider:
- Topical relevance (does the pin's subject match the board's theme?)
- Keyword alignment (do the pin's keywords match what users would search in that board context?)
- Audience intent (would a user browsing that board expect to find this pin?)${hasStats ? `
- Real performance: each board is tagged with its actual Pinterest traffic. When two boards are similarly relevant, PREFER the higher-performing one. Never route a clearly strong, on-topic pin into a "low traffic" board if a relevant "solid" or "top performer" board exists. Relevance still comes first — do not force an irrelevant pin into a popular board.` : ''}

IMPORTANT RULES:
- "suggestedBoard" MUST be an exact name from the "Available boards" list if any board scores 50 or higher.
- Only when NO existing board scores above 50 should you suggest a brand-new board name in "suggestedBoard" AND set "isNewBoard" to true.
- "alternativeBoard" must always be an exact name from the "Available boards" list, or null.
- relevanceScore and alternativeScore are integers 0–100.

Respond with JSON:
{
  "suggestedBoard": "exact board name from list, OR a new board name if isNewBoard is true",
  "relevanceScore": 85,
  "reasoning": "Brief explanation why this board is the best fit",
  "alternativeBoard": "second best board name from the list, or null",
  "alternativeScore": 70,
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
      max_tokens: 300,
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
  // name and validate against the real board list.
  const cleanName = (v) => String(v ?? '').replace(/\s*\[.*$/, '').trim()
  const suggested = cleanName(parsed.suggestedBoard)
  const alternative = cleanName(parsed.alternativeBoard)
  const isNewBoard = !!parsed.isNewBoard && !boards.includes(suggested)

  return {
    suggestedBoard: suggested || null,
    relevanceScore: Math.min(100, Math.max(0, Number(parsed.relevanceScore) || 0)),
    reasoning: parsed.reasoning || '',
    alternativeBoard: alternative && boards.includes(alternative) ? alternative : null,
    alternativeScore: Math.min(100, Math.max(0, Number(parsed.alternativeScore) || 0)),
    isNewBoard,
  }
})
