// Cloudflare R2 upload helper. R2 speaks the S3 API; we use the AWS SDK with
// the R2 endpoint and account-scoped credentials.
//
// Required env vars (see .env.r2):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//   R2_BUCKET, R2_PUBLIC_BASE_URL

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'

let _client: S3Client | null = null

function getR2Client(): S3Client {
  if (_client) return _client

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, ' +
      'and R2_SECRET_ACCESS_KEY in your env.'
    )
  }

  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  return _client
}

export interface R2UploadResult {
  key: string
  publicUrl: string
}

export async function uploadToR2(opts: {
  key: string
  body: Buffer | Uint8Array
  contentType: string
}): Promise<R2UploadResult> {
  const bucket = process.env.R2_BUCKET
  const publicBase = process.env.R2_PUBLIC_BASE_URL
  if (!bucket) throw new Error('R2_BUCKET is not configured')
  if (!publicBase) throw new Error('R2_PUBLIC_BASE_URL is not configured')

  const client = getR2Client()
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: opts.key,
    Body: opts.body,
    ContentType: opts.contentType,
  }))

  const cleanBase = publicBase.replace(/\/+$/, '')
  const cleanKey = opts.key.replace(/^\/+/, '')
  return { key: opts.key, publicUrl: `${cleanBase}/${cleanKey}` }
}

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

export function extensionForMime(mime: string): string | null {
  return EXT_BY_MIME[mime.toLowerCase()] ?? null
}

// Only `[a-zA-Z0-9_-]` survives; anything else collapses to '-'. User and
// project ids are DB UUIDs so this is just defence-in-depth against an
// unexpected value ever reaching a storage path segment.
function sanitizeKeySegment(value: string): string {
  const cleaned = String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '-').replace(/^-+|-+$/g, '')
  return cleaned || 'unknown'
}

// Per-user / per-project R2 layout:
//   {prefix}/{userId}/{projectId}/YYYYMMDD-{uuid}.{ext}
// where {prefix} is "pinterest/user". Each user gets their own directory under
// pinterest/user; each project a directory inside it. The trailing filename
// stays globally unique (UUID) so it can still be derived as the last path
// segment without collisions.
export function buildPinterestUserKey(opts: {
  ext: string
  userId: string
  projectId: string
}): string {
  const prefix = (process.env.R2_PINTEREST_USER_PREFIX || 'pinterest/user')
    .replace(/^\/+|\/+$/g, '')
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const uuid = (globalThis.crypto as Crypto).randomUUID()
  const userSeg = sanitizeKeySegment(opts.userId)
  const projectSeg = sanitizeKeySegment(opts.projectId)
  return `${prefix}/${userSeg}/${projectSeg}/${yyyy}${mm}${dd}-${uuid}.${opts.ext}`
}

// Recover the object key from a stored `image.public_url`. Upload writes the
// URL as `${publicBase}/${key}` with no escaping (keys are ASCII-safe: prefix +
// UUID + date + ext), so stripping the base is exact. Returns null if the URL
// doesn't sit under the configured public base (defensive — never guess a key).
export function keyFromPublicUrl(publicUrl: string): string | null {
  const publicBase = process.env.R2_PUBLIC_BASE_URL
  if (!publicBase || !publicUrl) return null
  const cleanBase = publicBase.replace(/\/+$/, '')
  const prefix = `${cleanBase}/`
  if (!publicUrl.startsWith(prefix)) return null
  const key = publicUrl.slice(prefix.length).replace(/^\/+/, '')
  return key || null
}

// Best-effort batch delete. S3/R2 DeleteObjects accepts up to 1000 keys per
// call, so we chunk. Duplicates and falsy keys are dropped. Returns counts so
// callers can surface a soft warning instead of failing the whole request.
export async function deleteFromR2(
  keys: (string | null | undefined)[],
): Promise<{ deleted: number; errors: number }> {
  const bucket = process.env.R2_BUCKET
  if (!bucket) throw new Error('R2_BUCKET is not configured')

  const unique = [...new Set(keys.filter((k): k is string => !!k))]
  if (unique.length === 0) return { deleted: 0, errors: 0 }

  const client = getR2Client()
  let deleted = 0
  let errors = 0
  for (let i = 0; i < unique.length; i += 1000) {
    const chunk = unique.slice(i, i + 1000)
    const res = await client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
    }))
    const failed = res.Errors?.length ?? 0
    deleted += chunk.length - failed
    errors += failed
  }
  return { deleted, errors }
}

// List + delete every object under a prefix. Used when wiping a whole user so
// any storage not tracked by a DB row (orphans) is also removed. Paginates
// through arbitrarily large prefixes.
export async function deleteR2Prefix(prefix: string): Promise<{ deleted: number }> {
  const bucket = process.env.R2_BUCKET
  if (!bucket) throw new Error('R2_BUCKET is not configured')

  const cleanPrefix = prefix.replace(/^\/+/, '')
  if (!cleanPrefix) return { deleted: 0 }

  const client = getR2Client()
  let token: string | undefined
  let deleted = 0
  do {
    const list = await client.send(new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: cleanPrefix,
      ContinuationToken: token,
    }))
    const objects = (list.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k)
      .map((Key) => ({ Key }))
    if (objects.length) {
      await client.send(new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: objects, Quiet: true },
      }))
      deleted += objects.length
    }
    token = list.IsTruncated ? list.NextContinuationToken : undefined
  } while (token)
  return { deleted }
}
