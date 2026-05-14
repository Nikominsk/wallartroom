// Cloudflare R2 upload helper. R2 speaks the S3 API; we use the AWS SDK with
// the R2 endpoint and account-scoped credentials.
//
// Required env vars (see .env.r2):
//   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
//   R2_BUCKET, R2_PUBLIC_BASE_URL

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

// Filenames match the existing R2 layout: YYYYMMDD-{uuid}.{ext} under the
// configured Pinterest landscape prefix.
export function buildPinterestLandscapeKey(ext: string): string {
  const prefix = (process.env.R2_PINTEREST_LANDSCAPE_PREFIX || 'pinterest/landscape')
    .replace(/^\/+|\/+$/g, '')
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const uuid = (globalThis.crypto as Crypto).randomUUID()
  return `${prefix}/${yyyy}${mm}${dd}-${uuid}.${ext}`
}
