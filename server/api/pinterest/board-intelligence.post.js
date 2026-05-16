export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { title, description, keywords, filename, boards } = body

  if (!boards?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No boards provided' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY is not configured' })
  }

  const systemPrompt = `You are a Pinterest marketing strategist. Given pin content and a list of available boards, determine the best board placement.

Analyze the pin's topic, keywords, and visual theme to match it with the most relevant board. Consider:
- Topical relevance (does the pin's subject match the board's theme?)
- Keyword alignment (do the pin's keywords match what users would search in that board context?)
- Audience intent (would a user browsing that board expect to find this pin?)

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
    title ? `Pin title: "${title}"` : '',
    description ? `Pin description: "${description}"` : '',
    keywords ? `Keywords: ${keywords}` : '',
    filename ? `Filename: ${filename}` : '',
    '',
    `Available boards: ${boards.join(', ')}`,
    '',
    'Which board is the best fit for this pin?',
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

  const isNewBoard = !!parsed.isNewBoard && !boards.includes(parsed.suggestedBoard)

  return {
    suggestedBoard: parsed.suggestedBoard || null,
    relevanceScore: Math.min(100, Math.max(0, Number(parsed.relevanceScore) || 0)),
    reasoning: parsed.reasoning || '',
    alternativeBoard: parsed.alternativeBoard && boards.includes(parsed.alternativeBoard) ? parsed.alternativeBoard : null,
    alternativeScore: Math.min(100, Math.max(0, Number(parsed.alternativeScore) || 0)),
    isNewBoard,
  }
})
