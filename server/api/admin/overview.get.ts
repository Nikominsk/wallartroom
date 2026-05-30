// GET /api/admin/overview?from=ISO&to=ISO
//
// Founder-only analytics for the /metadata workspace. Aggregates everything
// useful for "what happened today / this week / this month" in a single round
// trip:
//
//   • KPI totals (lifetime + in-range)
//   • Daily upload + activity time series
//   • Status pipeline (drafts created / exported / published in range)
//   • Most-active users (top 10 by uploads in range)
//   • Most-active projects (top 8 by uploads in range)
//   • Recent CSV exports
//   • Recent uploads
//
// Gate: founder email OR role='admin'. Service-role queries bypass RLS.

import type { H3Event } from 'h3'

const ADMIN_EMAIL = 'nniko.geuenich@gmail.com'

async function requireAdminFounder(event: H3Event) {
  const user = await requireUser(event)
  if (user.email?.toLowerCase() === ADMIN_EMAIL) return user

  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('app_user')
    .select('role')
    .eq('id', user.id)
    .single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  const row = data as { role?: string } | null
  if (row?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}

function parseDate(input: unknown, fallback: Date): Date {
  if (typeof input !== 'string' || !input) return fallback
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? fallback : d
}

export default defineEventHandler(async (event) => {
  await requireAdminFounder(event)
  const admin = serverSupabaseAdmin(event)

  const query = getQuery(event)

  const now = new Date()
  const defaultFrom = new Date(now)
  defaultFrom.setHours(0, 0, 0, 0)
  const from = parseDate(query.from, defaultFrom)
  const to   = parseDate(query.to, now)
  const fromIso = from.toISOString()
  const toIso   = to.toISOString()

  // ── In parallel: lifetime counts (head:true so we only get the count) ────
  const headCount = (table: string) =>
    admin.from(table).select('*', { count: 'exact', head: true })

  const [
    usersTotalRes,
    projectsTotalRes,
    imagesTotalRes,
    pinsTotalRes,
    boardsTotalRes,
    exportsTotalRes,
  ] = await Promise.all([
    headCount('app_user'),
    headCount('metadata_project'),
    headCount('image'),
    headCount('pinterest_image'),
    headCount('pinterest_board'),
    headCount('pinterest_csv_export'),
  ])

  // ── In parallel: in-range data we need to aggregate ─────────────────────
  const [
    newUsersRes,
    newProjectsRes,
    newImagesRes,
    newBoardsRes,
    pinsCreatedRes,
    pinsExportedRes,
    pinsPublishedRes,
    csvExportsRes,
    allUsersRes,
    allProjectsRes,
    pinStatusRes,
  ] = await Promise.all([
    admin.from('app_user')
      .select('id, email, created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    admin.from('metadata_project')
      .select('id, user_id, name, created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    admin.from('image')
      .select('id, project_id, filename, public_url, thumbnail_url, created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
      .order('created_at', { ascending: false }),
    admin.from('pinterest_board')
      .select('id, name, project_id, created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    admin.from('pinterest_image')
      .select('image_id, project_id, created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    admin.from('pinterest_image')
      .select('image_id, project_id, exported_at')
      .gte('exported_at', fromIso)
      .lte('exported_at', toIso),
    admin.from('pinterest_image')
      .select('image_id, project_id, published_at')
      .gte('published_at', fromIso)
      .lte('published_at', toIso),
    admin.from('pinterest_csv_export')
      .select('id, filename, row_count, project_id, created_at')
      .gte('created_at', fromIso)
      .lte('created_at', toIso)
      .order('created_at', { ascending: false }),
    admin.from('app_user')
      .select('id, email, name, created_at, updated_at'),
    admin.from('metadata_project')
      .select('id, user_id, name'),
    admin.from('pinterest_image')
      .select('status'),
  ])

  for (const r of [
    newUsersRes, newProjectsRes, newImagesRes, newBoardsRes,
    pinsCreatedRes, pinsExportedRes, pinsPublishedRes,
    csvExportsRes, allUsersRes, allProjectsRes, pinStatusRes,
  ]) {
    if (r.error) throw createError({ statusCode: 500, statusMessage: r.error.message })
  }

  // Supabase v2 without a generated Database type returns `never` for select
  // results under strict TS; cast to permissive shapes (this is internal admin
  // code, contents validated by the explicit select() column list above).
  const newUsers      = (newUsersRes.data      ?? []) as Array<{ id: string; email: string; created_at: string }>
  const newProjects   = (newProjectsRes.data   ?? []) as Array<{ id: string; user_id: string; name: string; created_at: string }>
  const newImages     = (newImagesRes.data     ?? []) as Array<{ id: string; project_id: string | null; filename: string; public_url: string; thumbnail_url: string | null; created_at: string }>
  const newBoards     = (newBoardsRes.data     ?? []) as Array<{ id: string; name: string; project_id: string | null; created_at: string }>
  const pinsCreated   = (pinsCreatedRes.data   ?? []) as Array<{ image_id: string; project_id: string | null; created_at: string }>
  const pinsExported  = (pinsExportedRes.data  ?? []) as Array<{ image_id: string; project_id: string | null; exported_at: string }>
  const pinsPublished = (pinsPublishedRes.data ?? []) as Array<{ image_id: string; project_id: string | null; published_at: string }>
  const csvExports    = (csvExportsRes.data    ?? []) as Array<{ id: string; filename: string; row_count: number; project_id: string | null; created_at: string }>
  const allUsers      = (allUsersRes.data      ?? []) as Array<{ id: string; email: string; name: string | null; created_at: string; updated_at: string }>
  const allProjects   = (allProjectsRes.data   ?? []) as Array<{ id: string; user_id: string; name: string }>
  const pinStatusRows = (pinStatusRes.data     ?? []) as Array<{ status: string | null }>

  // ── Lookup maps ─────────────────────────────────────────────────────────
  const projectToUser = new Map<string, string>()
  const projectName   = new Map<string, string>()
  for (const p of allProjects) {
    projectToUser.set(p.id, p.user_id)
    projectName.set(p.id, p.name)
  }

  const userById = new Map<string, { email: string; name: string | null }>()
  for (const u of allUsers) {
    userById.set(u.id, { email: u.email, name: u.name })
  }

  // ── Lifetime pipeline status counts ─────────────────────────────────────
  const statusCounts: Record<string, number> = {
    draft: 0, exported: 0, error: 0,
  }
  for (const r of pinStatusRows) {
    const s = r.status
    if (s && s in statusCounts) statusCounts[s] = (statusCounts[s] ?? 0) + 1
  }

  // ── Active users = anyone who triggered an event in range ───────────────
  const activeUserIds = new Set<string>()
  const recordUser = (projectId: string | null | undefined) => {
    if (!projectId) return
    const uid = projectToUser.get(projectId)
    if (uid) activeUserIds.add(uid)
  }
  newImages.forEach(i => recordUser(i.project_id))
  pinsCreated.forEach(p => recordUser(p.project_id))
  pinsExported.forEach(p => recordUser(p.project_id))
  pinsPublished.forEach(p => recordUser(p.project_id))
  newBoards.forEach(b => recordUser(b.project_id))
  csvExports.forEach(e => recordUser(e.project_id))
  newProjects.forEach(p => activeUserIds.add(p.user_id))

  // ── Per-user activity (top 10 by uploads) ──────────────────────────────
  type UserAgg = {
    user_id:    string
    email:      string
    name:       string | null
    uploads:    number
    pins:       number
    exported:   number
    published:  number
    csv:        number
    projects:   Set<string>
  }
  const userAgg = new Map<string, UserAgg>()
  const ensureUser = (userId: string): UserAgg => {
    let row = userAgg.get(userId)
    if (!row) {
      const u = userById.get(userId)
      row = {
        user_id:   userId,
        email:     u?.email ?? '(unknown)',
        name:      u?.name ?? null,
        uploads:   0,
        pins:      0,
        exported:  0,
        published: 0,
        csv:       0,
        projects:  new Set(),
      }
      userAgg.set(userId, row)
    }
    return row
  }
  for (const img of newImages) {
    const uid = projectToUser.get(img.project_id ?? '')
    if (uid) { const a = ensureUser(uid); a.uploads++; if (img.project_id) a.projects.add(img.project_id) }
  }
  for (const p of pinsCreated) {
    const uid = projectToUser.get(p.project_id ?? '')
    if (uid) { ensureUser(uid).pins++ }
  }
  for (const p of pinsExported) {
    const uid = projectToUser.get(p.project_id ?? '')
    if (uid) { ensureUser(uid).exported++ }
  }
  for (const p of pinsPublished) {
    const uid = projectToUser.get(p.project_id ?? '')
    if (uid) { ensureUser(uid).published++ }
  }
  for (const e of csvExports) {
    const uid = projectToUser.get(e.project_id ?? '')
    if (uid) { ensureUser(uid).csv++ }
  }
  const topUsers = [...userAgg.values()]
    .map(u => ({
      user_id:   u.user_id,
      email:     u.email,
      name:      u.name,
      uploads:   u.uploads,
      pins:      u.pins,
      exported:  u.exported,
      published: u.published,
      csv:       u.csv,
      projects:  u.projects.size,
    }))
    .sort((a, b) =>
      (b.uploads + b.pins + b.exported + b.published + b.csv) -
      (a.uploads + a.pins + a.exported + a.published + a.csv),
    )
    .slice(0, 10)

  // ── Per-project activity (top 8 by uploads) ─────────────────────────────
  type ProjectAgg = {
    project_id: string
    name:       string
    user_email: string
    uploads:    number
    pins:       number
    exported:   number
    published:  number
  }
  const projAgg = new Map<string, ProjectAgg>()
  const ensureProj = (projectId: string): ProjectAgg => {
    let row = projAgg.get(projectId)
    if (!row) {
      const uid = projectToUser.get(projectId)
      row = {
        project_id: projectId,
        name:       projectName.get(projectId) ?? '(unknown)',
        user_email: uid ? (userById.get(uid)?.email ?? '(unknown)') : '(unknown)',
        uploads:    0,
        pins:       0,
        exported:   0,
        published:  0,
      }
      projAgg.set(projectId, row)
    }
    return row
  }
  for (const img of newImages)     if (img.project_id) ensureProj(img.project_id).uploads++
  for (const p of pinsCreated)     if (p.project_id)   ensureProj(p.project_id).pins++
  for (const p of pinsExported)    if (p.project_id)   ensureProj(p.project_id).exported++
  for (const p of pinsPublished)   if (p.project_id)   ensureProj(p.project_id).published++
  const topProjects = [...projAgg.values()]
    .sort((a, b) =>
      (b.uploads + b.pins + b.exported + b.published) -
      (a.uploads + a.pins + a.exported + a.published),
    )
    .slice(0, 8)

  // ── Daily series (one bucket per UTC day inside [from, to]) ─────────────
  const dayKey = (d: Date) => {
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const day = String(d.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const daysInRange: string[] = []
  {
    const start = new Date(from)
    start.setUTCHours(0, 0, 0, 0)
    const end = new Date(to)
    end.setUTCHours(0, 0, 0, 0)
    let cursor = new Date(start)
    while (cursor.getTime() <= end.getTime()) {
      daysInRange.push(dayKey(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    // Safety cap so a "since the beginning" range doesn't bloat the payload.
    if (daysInRange.length > 180) {
      daysInRange.splice(0, daysInRange.length - 180)
    }
  }

  const bucket = (rows: Array<{ ts: string | null | undefined }>) => {
    const m = new Map<string, number>()
    for (const r of rows) {
      if (!r.ts) continue
      const k = dayKey(new Date(r.ts))
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }
  const uploadsByDay   = bucket(newImages.map(i =>     ({ ts: i.created_at })))
  const pinsByDay      = bucket(pinsCreated.map(p =>   ({ ts: p.created_at })))
  const exportedByDay  = bucket(pinsExported.map(p =>  ({ ts: p.exported_at })))
  const publishedByDay = bucket(pinsPublished.map(p => ({ ts: p.published_at })))
  const csvByDay       = bucket(csvExports.map(e =>    ({ ts: e.created_at })))

  const daily = daysInRange.map(d => ({
    day:       d,
    uploads:   uploadsByDay.get(d) ?? 0,
    pins:      pinsByDay.get(d) ?? 0,
    exported:  exportedByDay.get(d) ?? 0,
    published: publishedByDay.get(d) ?? 0,
    csv:       csvByDay.get(d) ?? 0,
  }))

  // ── Recent CSV exports (latest 8 in range, enriched) ────────────────────
  const recentCsv = csvExports.slice(0, 8).map(e => {
    const uid = e.project_id ? projectToUser.get(e.project_id) : null
    return {
      id:         e.id,
      filename:   e.filename,
      row_count:  e.row_count,
      created_at: e.created_at,
      project:    e.project_id ? projectName.get(e.project_id) ?? null : null,
      user_email: uid ? userById.get(uid)?.email ?? null : null,
    }
  })

  // ── Recent uploads (latest 12 in range, enriched) ──────────────────────
  const recentUploads = newImages.slice(0, 12).map(i => {
    const uid = i.project_id ? projectToUser.get(i.project_id) : null
    return {
      id:            i.id,
      filename:      i.filename,
      thumbnail_url: i.thumbnail_url ?? i.public_url ?? null,
      created_at:    i.created_at,
      project:       i.project_id ? projectName.get(i.project_id) ?? null : null,
      user_email:    uid ? userById.get(uid)?.email ?? null : null,
    }
  })

  // CSV row count totals (handy on the KPI strip)
  const csvRows = csvExports.reduce((sum, e) => sum + (e.row_count ?? 0), 0)

  return {
    range: { from: fromIso, to: toIso },
    lifetime: {
      users:    usersTotalRes.count    ?? 0,
      projects: projectsTotalRes.count ?? 0,
      images:   imagesTotalRes.count   ?? 0,
      pins:     pinsTotalRes.count     ?? 0,
      boards:   boardsTotalRes.count   ?? 0,
      exports:  exportsTotalRes.count  ?? 0,
    },
    statusCounts,
    inRange: {
      newUsers:      newUsers.length,
      activeUsers:   activeUserIds.size,
      newProjects:   newProjects.length,
      uploads:       newImages.length,
      pinsCreated:   pinsCreated.length,
      pinsExported:  pinsExported.length,
      pinsPublished: pinsPublished.length,
      newBoards:     newBoards.length,
      csvExports:    csvExports.length,
      csvRows,
    },
    daily,
    topUsers,
    topProjects,
    recentCsv,
    recentUploads,
    newUsers: newUsers.map(u => ({
      id: u.id, email: u.email, created_at: u.created_at,
    })),
  }
})
