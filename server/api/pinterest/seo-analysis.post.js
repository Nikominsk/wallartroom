export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, description, board, keywords } = body

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })
  }

  const systemPrompt = `You are a Pinterest SEO specialist. Analyze the given pin metadata and provide actionable optimization feedback.

Score each area 0-100 and provide specific suggestions. Focus on:
1. Keyword placement (are primary keywords in the first few words of title/description?)
2. Search intent match (would someone searching these keywords find value in this pin?)
3. Description completeness (does it use enough of the 500-char limit? Does it have a call-to-action?)
4. Board relevance (does the board name align with the pin's topic?)
5. Keyword density (natural usage vs keyword stuffing)
6. Freshness signals (does the content feel current/trending?)

Respond with JSON:
{
  "overallScore": 75,
  "titleScore": 80,
  "descriptionScore": 70,
  "keywordScore": 65,
  "boardScore": 85,
  "issues": [
    {"severity": "high", "area": "title", "message": "Primary keyword should appear in first 3 words"},
    {"severity": "medium", "area": "description", "message": "Description is only 120 chars, use at least 200 for better reach"}
  ],
  "suggestions": [
    "Move 'minimalist wall art' to the beginning of the title",
    "Add a call-to-action like 'Shop now' or 'Save for later' at the end of description",
    "Include trending keyword 'aesthetic room decor' naturally"
  ],
  "keywordOpportunities": ["aesthetic room decor", "home office wall art", "modern prints"],
  "estimatedReach": "medium"
}`

  const userPrompt = [
    title ? `Title: "${title}"` : 'Title: (empty)',
    description ? `Description: "${description}"` : 'Description: (empty)',
    board ? `Board: "${board}"` : 'Board: (not assigned)',
    keywords ? `Keywords: ${keywords}` : '',
    '',
    'Analyze this pin\'s SEO quality for Pinterest search discovery.',
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
      max_tokens: 600,
      temperature: 0.4,
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

  return {
    overallScore: Math.min(100, Math.max(0, Number(parsed.overallScore) || 0)),
    titleScore: Math.min(100, Math.max(0, Number(parsed.titleScore) || 0)),
    descriptionScore: Math.min(100, Math.max(0, Number(parsed.descriptionScore) || 0)),
    keywordScore: Math.min(100, Math.max(0, Number(parsed.keywordScore) || 0)),
    boardScore: Math.min(100, Math.max(0, Number(parsed.boardScore) || 0)),
    issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 8) : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
    keywordOpportunities: Array.isArray(parsed.keywordOpportunities) ? parsed.keywordOpportunities.slice(0, 6) : [],
    estimatedReach: parsed.estimatedReach || 'unknown',
  }
})
