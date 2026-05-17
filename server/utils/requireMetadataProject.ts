import type { H3Event } from 'h3'
import type { AuthedUser } from './requireUser'

// The active /metadata project id travels as a cookie so every existing
// composable's plain `$fetch('/api/...')` call carries it automatically — no
// need to thread a header through ~10 composables. The client switcher
// (useMetadataProject) writes this same cookie.
export const METADATA_PROJECT_COOKIE = 'w__metadata_project'

export interface MetadataProject {
  id:         string
  user_id:    string
  name:       string
  created_at: string
  updated_at: string
}

export interface MetadataProjectContext {
  user:      AuthedUser
  project:   MetadataProject
  projectId: string
}

// Resolves the project every /metadata/* server endpoint must operate within:
//
//   1. Require auth (any signed-in user — no more single-email gate).
//   2. Take the project id from the cookie and verify it belongs to THIS user
//      (this is the tenant-isolation boundary, since endpoints use the
//      RLS-bypassing service-role key).
//   3. If the cookie is missing / stale / not owned → fall back to the user's
//      most-recent project, auto-creating "My Project" if they have none.
//   4. Pin the resolved id back into the cookie so the client and subsequent
//      requests stay consistent even before the switcher has loaded.
export async function requireMetadataProject(
  event: H3Event,
): Promise<MetadataProjectContext> {
  const user  = await requireUser(event)
  const admin = serverSupabaseAdmin(event)

  const cookieId = getCookie(event, METADATA_PROJECT_COOKIE) || null

  let project: MetadataProject | null = null

  if (cookieId) {
    const { data } = await admin
      .from('metadata_project')
      .select('id, user_id, name, created_at, updated_at')
      .eq('id', cookieId)
      .eq('user_id', user.id)
      .maybeSingle()
    project = (data as MetadataProject) ?? null
  }

  if (!project) {
    const { data: recent } = await admin
      .from('metadata_project')
      .select('id, user_id, name, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    project = (recent as MetadataProject) ?? null
  }

  if (!project) {
    project = await ensureFirstProject(event, user.id)
  }

  if (project.id !== cookieId) {
    setCookie(event, METADATA_PROJECT_COOKIE, project.id, {
      path:     '/',
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 365,
    })
  }

  return { user, project, projectId: project.id }
}

// Race-safe "give this user a starting project". The first metadata page load
// fires several scoped endpoints in parallel and they ALL land here with no
// project yet — a naive insert would make all-but-one fail on the per-user
// unique-name index. So: try to insert "My Project"; on a unique violation
// (someone else just made it) fall back to re-selecting the user's project.
async function ensureFirstProject(
  event: H3Event,
  userId: string,
): Promise<MetadataProject> {
  const admin = serverSupabaseAdmin(event)

  const { data, error } = await admin
    .from('metadata_project')
    .insert({ user_id: userId, name: 'My Project' })
    .select('id, user_id, name, created_at, updated_at')
    .single()

  if (!error && data) {
    await ensureProjectSettings(event, data.id)
    return data as MetadataProject
  }

  // 23505 = unique_violation → a concurrent request created it first.
  if (error && error.code !== '23505') {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const { data: existing, error: selErr } = await admin
    .from('metadata_project')
    .select('id, user_id, name, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (selErr || !existing) {
    throw createError({
      statusCode: 500,
      statusMessage: selErr?.message ?? 'Could not provision a project',
    })
  }
  await ensureProjectSettings(event, existing.id)
  return existing as MetadataProject
}

// Creates a project for a user. Throws a friendly 409 on the per-user unique
// name index. Also seeds the project's metadata_settings row so the Settings
// page and AI defaults work immediately.
export async function createMetadataProject(
  event: H3Event,
  userId: string,
  rawName: string,
): Promise<MetadataProject> {
  const name = String(rawName ?? '').trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Project name is required' })
  }
  if (name.length > 120) {
    throw createError({ statusCode: 400, statusMessage: 'Project name is too long (max 120)' })
  }

  const admin = serverSupabaseAdmin(event)
  const { data, error } = await admin
    .from('metadata_project')
    .insert({ user_id: userId, name })
    .select('id, user_id, name, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'You already have a project with that name' })
    }
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  await ensureProjectSettings(event, data.id)
  return data as MetadataProject
}

// Self-healing: guarantees a metadata_settings row exists for a project.
// Called on project creation and defensively from the settings endpoints.
export async function ensureProjectSettings(event: H3Event, projectId: string) {
  const admin = serverSupabaseAdmin(event)
  // ON CONFLICT DO NOTHING against uq_metadata_settings_project — race-safe
  // when several parallel requests provision the same project at once.
  await admin
    .from('metadata_settings')
    .upsert({ project_id: projectId }, { onConflict: 'project_id', ignoreDuplicates: true })
}
