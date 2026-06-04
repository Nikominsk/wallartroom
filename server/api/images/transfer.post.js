// Move or copy a batch of images from the caller's ACTIVE project into another
// of their own projects.
//
//   • Move = update `project_id` on the image + its pinterest_image /
//     adobe_image rows. Fast, no R2 touch needed (the public_url still
//     resolves; the path's project segment is a soft convention).
//
//   • Copy = clone the image row (gets a new uuid), clone pin/adobe rows if
//     present (new pin_id/adobe_id from the default generators), AND copy the
//     R2 object so each project owns its own bytes. Without an R2 copy a
//     future delete on one project would yank the bytes out from under the
//     other (delete-many.post.js derives the key from public_url).
//
// Tenant isolation: the source must be the caller's active project (enforced
// by requireMetadataProject), and the target must belong to the same user.
// Forged ids in the source set are silently filtered to the project.

const MAX_BATCH = 500

export default defineEventHandler(async (event) => {
  const { user, projectId: sourceProjectId } = await requireMetadataProject(event)
  const body = await readBody(event)

  const ids = Array.isArray(body?.ids) ? [...new Set(body.ids.filter(Boolean))] : []
  const targetProjectId = String(body?.targetProjectId ?? '').trim()
  const mode = body?.mode === 'copy' ? 'copy' : 'move'

  // Field selection — default all true so existing callers without this param are unaffected.
  const f = body?.fields ?? {}
  const fields = {
    title:        f.title       !== false,
    description:  f.description !== false,
    board:        f.board       !== false,
    boardMissing: f.boardMissing === 'skip' ? 'skip' : 'create', // 'create' | 'skip'
    link:         f.link        !== false,
    status:       f.status      !== false,
  }

  if (ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No image ids provided' })
  }
  if (ids.length > MAX_BATCH) {
    throw createError({ statusCode: 400, statusMessage: `Too many ids in one request (max ${MAX_BATCH})` })
  }
  if (!targetProjectId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing targetProjectId' })
  }
  if (targetProjectId === sourceProjectId) {
    throw createError({ statusCode: 400, statusMessage: 'Target project is the same as the source' })
  }

  const client = serverSupabaseAdmin(event)

  // Tenant boundary: the target must belong to the same user.
  const { data: target, error: tgtErr } = await client
    .from('metadata_project')
    .select('id, user_id, name')
    .eq('id', targetProjectId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (tgtErr) throw createError({ statusCode: 500, statusMessage: tgtErr.message })
  if (!target) throw createError({ statusCode: 404, statusMessage: 'Target project not found' })

  // Filter the requested ids down to what actually lives in the source
  // project. This is the same hardening pattern used in save.post.js — a
  // forged id from another tenant simply gets dropped instead of erroring.
  const { data: ownedRows, error: ownErr } = await client
    .from('image')
    .select('*')
    .eq('project_id', sourceProjectId)
    .in('id', ids)
  if (ownErr) throw createError({ statusCode: 500, statusMessage: ownErr.message })

  const sourceImages = ownedRows ?? []
  if (sourceImages.length === 0) {
    throw createError({ statusCode: 403, statusMessage: 'No matching images in the active project' })
  }
  const allowedIds = sourceImages.map(r => r.id)

  if (mode === 'move') {
    // Update project_id on all three tables. pinterest_image / adobe_image
    // rows are optional (only created lazily when metadata is saved), so
    // those updates may be no-ops for some images — that's fine.
    const r1 = await client.from('image').update({ project_id: targetProjectId }).in('id', allowedIds)
    if (r1.error) throw createError({ statusCode: 500, statusMessage: r1.error.message })

    const r2 = await client.from('pinterest_image').update({ project_id: targetProjectId }).in('image_id', allowedIds)
    if (r2.error) throw createError({ statusCode: 500, statusMessage: r2.error.message })

    const r3 = await client.from('adobe_image').update({ project_id: targetProjectId }).in('image_id', allowedIds)
    if (r3.error) throw createError({ statusCode: 500, statusMessage: r3.error.message })

    // Apply field deselection and fix board_ids (they pointed to source project's boards).
    const { data: movedPins } = await client
      .from('pinterest_image')
      .select('image_id, board, board_id')
      .in('image_id', allowedIds)
      .eq('project_id', targetProjectId)

    if (movedPins?.length) {
      const targetBoardMap = await ensureBoards(
        client, movedPins, fields.board ? targetProjectId : null, fields.boardMissing === 'create'
      )
      for (const pin of movedPins) {
        const patch = {}
        if (!fields.title)       patch.title = null
        if (!fields.description) patch.description = null
        if (!fields.link)        patch.link = null
        if (!fields.status)      patch.status = 'draft'
        if (!fields.board) {
          patch.board = null
          patch.board_id = null
        } else {
          // Fix the board_id to point to the target project's board.
          const targetBoard = pin.board ? targetBoardMap.get(pin.board.toLowerCase()) : null
          patch.board_id = targetBoard?.id ?? null
        }
        if (Object.keys(patch).length) {
          await client.from('pinterest_image').update(patch).eq('image_id', pin.image_id)
        }
      }
    }

    return {
      ok: true,
      mode,
      count: allowedIds.length,
      movedIds: allowedIds,
      targetProjectId,
    }
  }

  // ── Copy mode ────────────────────────────────────────────────────────────

  // Helper: resolve board names from pins against the target project.
  // Returns a name.toLowerCase() → { id, name } map for boards that exist.
  // When create=true, missing boards are inserted first.
  // When create=false (skip), missing boards are simply absent from the map
  // so callers set board/board_id to null for those images.
  // Pass tgtProjectId=null to skip entirely (board field deselected).
  async function ensureBoards(db, pins, tgtProjectId, create = true) {
    if (!tgtProjectId) return new Map()
    const names = [...new Set(pins.map(r => r.board).filter(Boolean))]
    if (!names.length) return new Map()
    const { data: existing } = await db
      .from('pinterest_board')
      .select('id, name')
      .eq('project_id', tgtProjectId)
      .in('name', names)
    const map = new Map((existing ?? []).map(b => [b.name.toLowerCase(), b]))
    if (create) {
      for (const name of names) {
        if (!map.has(name.toLowerCase())) {
          const { data: created } = await db
            .from('pinterest_board')
            .insert({ name, project_id: tgtProjectId })
            .select('id, name')
            .single()
          if (created) map.set(name.toLowerCase(), created)
        }
      }
    }
    return map
  }

  const { data: pinRows, error: pinErr } = await client
    .from('pinterest_image')
    .select('*')
    .in('image_id', allowedIds)
    .eq('project_id', sourceProjectId)
  if (pinErr) throw createError({ statusCode: 500, statusMessage: pinErr.message })

  const { data: adobeRows, error: adobeErr } = await client
    .from('adobe_image')
    .select('*')
    .in('image_id', allowedIds)
    .eq('project_id', sourceProjectId)
  if (adobeErr) throw createError({ statusCode: 500, statusMessage: adobeErr.message })

  const pinByImage = new Map((pinRows ?? []).map(r => [r.image_id, r]))
  const adobeByImage = new Map((adobeRows ?? []).map(r => [r.image_id, r]))

  // Pre-resolve boards in the target project so we can set board_id on each copy.
  const targetBoardMap = await ensureBoards(
    client, pinRows ?? [], fields.board ? targetProjectId : null, fields.boardMissing === 'create'
  )

  const createdImageIds = []
  // Track R2 keys we wrote so we can attempt cleanup if a later DB insert
  // fails partway through a multi-image copy. This is best-effort — leftover
  // R2 bytes without a DB pointer are harmless orphans, not data loss.
  const writtenKeys = []

  try {
    for (const src of sourceImages) {
      // Derive the new R2 key under the target project's path. Falls back to
      // 'jpg' if the source filename has no extension (defensive — every row
      // we write goes through upload.post.js which validates MIME).
      const ext = (src.filename?.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const newKey = buildPinterestUserKey({ ext, userId: user.id, projectId: targetProjectId })

      const sourceKey = keyFromPublicUrl(src.public_url)
      let newPublicUrl = src.public_url
      if (sourceKey) {
        const copyResult = await copyR2Object({ sourceKey, destKey: newKey })
        newPublicUrl = copyResult.publicUrl
        writtenKeys.push(newKey)
      }
      // else: the URL doesn't sit under our public base (legacy / external).
      // We can't copy what we can't address, so the new row reuses the URL.
      // That's safe because the delete path would also be unable to reach it.

      const { data: newImg, error: insErr } = await client
        .from('image')
        .insert({
          filename: newKey.split('/').pop() || src.filename,
          public_url: newPublicUrl,
          thumbnail_url: src.thumbnail_url,
          prompt: src.prompt,
          visibility: src.visibility,
          primary_color_id: src.primary_color_id,
          secondary_color_id: src.secondary_color_id,
          tertiary_color_id: src.tertiary_color_id,
          project_id: targetProjectId,
        })
        .select('id')
        .single()
      if (insErr) throw createError({ statusCode: 500, statusMessage: insErr.message })

      const newId = newImg.id
      createdImageIds.push(newId)

      // Clone Pinterest metadata if the source had any. Reset the publish
      // lifecycle: a fresh copy in another project starts as a draft (no
      // exported_at / published_at) — those timestamps belong to the source.
      const p = pinByImage.get(src.id)
      if (p) {
        const targetBoard = fields.board && p.board ? targetBoardMap.get(p.board.toLowerCase()) : null
        const { error: pe } = await client.from('pinterest_image').insert({
          image_id: newId,
          project_id: targetProjectId,
          // pin_id intentionally omitted — the table's default generator
          // produces a fresh globally-unique short id.
          title:        fields.title       ? (p.title       ?? null) : null,
          description:  fields.description ? (p.description ?? null) : null,
          board:        fields.board       ? (p.board       ?? null) : null,
          board_id:     targetBoard?.id    ?? null,
          link:         fields.link        ? (p.link        ?? null) : null,
          publish_date: p.publish_date     ?? null,
          status:       fields.status      ? (p.status      ?? 'draft') : 'draft',
        })
        if (pe) throw createError({ statusCode: 500, statusMessage: pe.message })
      }

      const a = adobeByImage.get(src.id)
      if (a) {
        const { error: ae } = await client.from('adobe_image').insert({
          image_id: newId,
          project_id: targetProjectId,
          // adobe_id omitted — default generator fires.
          title: a.title ?? null,
          description: a.description ?? null,
          keywords: a.keywords ?? null,
          publish_date: a.publish_date ?? null,
          status: 'draft',
        })
        if (ae) throw createError({ statusCode: 500, statusMessage: ae.message })
      }
    }
  } catch (e) {
    // Partial failure: clean up the R2 objects we wrote (best-effort), but
    // leave the successfully-inserted image rows in place — they're already
    // valid records in the target project.
    if (writtenKeys.length) {
      try { await deleteFromR2(writtenKeys) } catch { /* swallow */ }
    }
    throw e
  }

  return {
    ok: true,
    mode,
    count: createdImageIds.length,
    createdImageIds,
    targetProjectId,
  }
})
