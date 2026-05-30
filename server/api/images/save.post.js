// Upserts Pinterest / Adobe metadata for images. Hardened for multi-tenant:
// the caller can only write metadata for images that live in their ACTIVE
// project — any id that isn't in the project is silently dropped so a forged
// image_id can't poison another tenant's data.
export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const client = serverSupabaseAdmin(event)
  const body = await readBody(event)
  const imgs = Array.isArray(body) ? body : [body]

  const requestedIds = [...new Set(imgs.map(i => i.id).filter(Boolean))]
  if (requestedIds.length === 0) return { ok: true }

  const { data: owned, error: ownErr } = await client
    .from('image')
    .select('id')
    .eq('project_id', projectId)
    .in('id', requestedIds)
  if (ownErr) throw createError({ statusCode: 500, statusMessage: ownErr.message })

  const allowed = new Set((owned ?? []).map(r => r.id))
  const scoped = imgs.filter(img => allowed.has(img.id))
  if (scoped.length === 0) {
    throw createError({ statusCode: 403, statusMessage: 'No matching images in the active project' })
  }

  // Resolve every image's board set. `boardIds` (array) is the canonical
  // multi-board field; fall back to the legacy single `boardId` for older
  // payloads. The primary (first) board is mirrored onto pinterest_image so
  // single-board consumers (calendar, dashboard, admin) keep working.
  const boardIdsOf = (img) => {
    const arr = Array.isArray(img.pinterest?.boardIds)
      ? img.pinterest.boardIds
      : (img.pinterest?.boardId ? [img.pinterest.boardId] : [])
    return [...new Set(arr.filter(Boolean))]
  }

  // Validate the union of all referenced board IDs in one query. A stale id
  // (e.g. a board deleted in another tab) is caught here as a clear 422.
  const allBoardIds = [...new Set(scoped.flatMap(boardIdsOf))]
  const boardNameMap = {}
  if (allBoardIds.length) {
    const { data: boards, error: boardErr } = await client
      .from('pinterest_board')
      .select('id, name')
      .eq('project_id', projectId)
      .in('id', allBoardIds)
    if (boardErr) throw createError({ statusCode: 500, statusMessage: boardErr.message })

    const foundIds = new Set((boards ?? []).map(b => b.id))
    const missingIds = allBoardIds.filter(id => !foundIds.has(id))
    if (missingIds.length) {
      const payloadNameMap = {}
      for (const img of scoped) {
        for (const b of img.pinterest?.boards ?? []) {
          if (b?.id) payloadNameMap[b.id] = b.name || null
        }
        if (img.pinterest?.boardId) payloadNameMap[img.pinterest.boardId] = img.pinterest?.board || null
      }
      const names = missingIds.map(id => payloadNameMap[id] ? `"${payloadNameMap[id]}"` : `(id: ${id})`)
      const list = names.join(', ')
      throw createError({
        statusCode: 422,
        statusMessage: names.length === 1
          ? `Board ${list} no longer exists. Please select a different board.`
          : `These boards no longer exist: ${list}. Please select different boards for the affected images.`,
      })
    }
    for (const b of boards ?? []) boardNameMap[b.id] = b.name
  }

  const pRows = scoped.map(img => {
    const ids = boardIdsOf(img)
    const primaryId = ids[0] ?? null
    // Primary board name from DB (handles renames). Fall back to client name
    // only when there's no board id at all.
    const board = primaryId ? (boardNameMap[primaryId] ?? null) : (img.pinterest?.board || null)
    return {
      image_id:     img.id,
      project_id:   projectId,
      title:        img.pinterest.title || null,
      description:  img.pinterest.description || null,
      board_id:     primaryId,
      board,
      link:         img.pinterest.link || null,
      publish_date: img.pinterest.publishDate || null,
      exported_at:  img.pinterest.exportedAt || null,
      published_at: img.pinterest.publishedAt || null,
      status:       img.pinterest.status ?? 'draft',
    }
  })

  const aRows = scoped.map(img => ({
    image_id:     img.id,
    project_id:   projectId,
    title:        img.adobeStock.title || null,
    description:  img.adobeStock.description || null,
    keywords:     img.adobeStock.keywords?.length ? img.adobeStock.keywords : null,
    publish_date: img.adobeStock.publishDate || null,
    status:       img.adobeStock.status ?? 'draft',
  }))

  const { error: pe } = await client
    .from('pinterest_image')
    .upsert(pRows, { onConflict: 'image_id' })
  if (pe) throw createError({ statusCode: 500, statusMessage: pe.message })

  const { error: ae } = await client
    .from('adobe_image')
    .upsert(aRows, { onConflict: 'image_id' })
  if (ae) throw createError({ statusCode: 500, statusMessage: ae.message })

  // ── Multi-board memberships ────────────────────────────────────────────────
  // Only manage boards for images whose payload actually carries board data, so
  // a partial save (e.g. a status-only update) never wipes a pin's boards.
  // For those, replace the set: clear existing rows then insert one per board.
  const managesBoards = (img) =>
    Array.isArray(img.pinterest?.boardIds) ||
    Array.isArray(img.pinterest?.boards) ||
    img.pinterest?.boardId !== undefined
  const boardManaged = scoped.filter(managesBoards)

  if (boardManaged.length) {
    const managedIds = boardManaged.map(i => i.id)
    const { error: delErr } = await client
      .from('pinterest_image_board')
      .delete()
      .in('image_id', managedIds)
    if (delErr) throw createError({ statusCode: 500, statusMessage: delErr.message })

    const links = []
    for (const img of boardManaged) {
      for (const bid of boardIdsOf(img)) {
        links.push({ image_id: img.id, board_id: bid, project_id: projectId })
      }
    }
    if (links.length) {
      const { error: linkErr } = await client.from('pinterest_image_board').insert(links)
      if (linkErr) throw createError({ statusCode: 500, statusMessage: linkErr.message })
    }
  }

  return { ok: true }
})
