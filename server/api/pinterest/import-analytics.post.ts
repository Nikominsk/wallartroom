// POST /api/pinterest/import-analytics
// Body: { csv: string, createMissingBoards?: boolean, includeSystemBoards?: boolean }
//
// Parses a Pinterest Business "Analytics overview" CSV, then for the caller's
// ACTIVE project:
//   • creates any missing boards (names derived from the board URL slugs) and
//   • updates per-board performance counters on every matched board, and
//   • saves the account handle + a full analytics snapshot on metadata_project
//     so the AI (board-intelligence / generate-metadata) can use it.

interface Body {
  csv?: string
  createMissingBoards?: boolean
  includeSystemBoards?: boolean
  dryRun?: boolean   // parse + preview only, no DB writes
}

export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const admin = serverSupabaseAdmin(event)
  const body = await readBody<Body>(event)

  const csv = String(body?.csv ?? '')
  if (csv.trim().length < 20) {
    throw createError({ statusCode: 400, statusMessage: 'No CSV content provided' })
  }

  const createMissing = body?.createMissingBoards !== false   // default true
  const includeSystem = body?.includeSystemBoards === true     // default false

  const parsed = parsePinterestAnalytics(csv)

  if (!parsed.boards.length) {
    throw createError({
      statusCode: 422,
      statusMessage:
        'Couldn’t find a “Top Boards” table — is this the Analytics overview CSV from Pinterest Business?',
    })
  }

  const candidateBoards = parsed.boards.filter(b => includeSystem || !b.system)

  // Existing boards in this project, indexed case-insensitively by name.
  const { data: existing, error: exErr } = await admin
    .from('pinterest_board')
    .select('id, name')
    .eq('project_id', projectId)
  if (exErr) throw createError({ statusCode: 500, statusMessage: exErr.message })

  const byLowerName = new Map<string, { id: string; name: string }>()
  for (const b of existing ?? []) byLowerName.set(b.name.toLowerCase(), b)

  // Preview only — report what WOULD happen, touch nothing.
  if (body?.dryRun) {
    const willCreate: string[] = []
    const willUpdate: string[] = []
    for (const b of candidateBoards) {
      if (byLowerName.has(b.name.toLowerCase())) willUpdate.push(b.name)
      else if (createMissing) willCreate.push(b.name)
    }
    return {
      ok: true,
      dryRun: true,
      handle: parsed.handle,
      period: parsed.period,
      topThemes: parsed.topThemes,
      outboundClicks: parsed.outboundClicks,
      pins: parsed.pins,
      boards: {
        detected: parsed.boards.length,
        systemSkipped: includeSystem ? 0 : parsed.boards.filter(b => b.system).length,
        willCreate,
        willUpdate,
        allNames: candidateBoards.map(b => b.name),
      },
    }
  }

  const now = new Date().toISOString()
  const periodStart = parsed.period.start ?? null
  const periodEnd = parsed.period.end ?? null

  const statsFor = (b: (typeof candidateBoards)[number]) => ({
    stat_impressions:     b.impressions,
    stat_engagement:      b.engagement,
    stat_pin_clicks:      b.pinClicks,
    stat_outbound_clicks: b.outboundClicks,
    stat_saves:           b.saves,
    stat_period_start:    periodStart,
    stat_period_end:      periodEnd,
    stats_updated_at:     now,
  })

  let created = 0
  let updated = 0
  let failed = 0
  const createdNames: string[] = []

  for (const b of candidateBoards) {
    const match = byLowerName.get(b.name.toLowerCase())
    if (match) {
      const { error } = await admin
        .from('pinterest_board')
        .update(statsFor(b))
        .eq('id', match.id)
        .eq('project_id', projectId)
      if (error) failed++; else updated++
      continue
    }
    if (!createMissing) continue

    const { error } = await admin
      .from('pinterest_board')
      .insert({ name: b.name, color: null, project_id: projectId, ...statsFor(b) })
    if (error) {
      // 23505 = a board with that name already exists (case/race) → update it.
      if (error.code === '23505') {
        const { error: uErr } = await admin
          .from('pinterest_board')
          .update(statsFor(b))
          .eq('project_id', projectId)
          .eq('name', b.name)
        if (uErr) failed++; else updated++
      } else {
        failed++
      }
      continue
    }
    created++
    createdNames.push(b.name)
  }

  // Persist the full snapshot on the project (handle + everything useful).
  const snapshot = {
    handle:         parsed.handle,
    period:         parsed.period,
    outboundClicks: parsed.outboundClicks,
    pins:           parsed.pins,
    topThemes:      parsed.topThemes,
    boards:         parsed.boards, // incl. system boards, for completeness
    importedAt:     now,
  }

  const { error: projErr } = await admin
    .from('metadata_project')
    .update({
      pinterest_handle: parsed.handle,
      pinterest_analytics: snapshot,
    })
    .eq('id', projectId)
  if (projErr) throw createError({ statusCode: 500, statusMessage: projErr.message })

  return {
    ok: true,
    handle: parsed.handle,
    period: parsed.period,
    boards: {
      detected:     parsed.boards.length,
      systemSkipped: includeSystem ? 0 : parsed.boards.filter(b => b.system).length,
      created,
      updated,
      failed,
      createdNames,
    },
    topThemes: parsed.topThemes,
    outboundClicks: parsed.outboundClicks,
    pins: parsed.pins,
  }
})
