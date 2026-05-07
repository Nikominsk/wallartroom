// Direct browser → Supabase Storage uploads. RLS in 005_storage.sql restricts
// uploads to the owner's <userId>/* folder; buckets are public-read with
// unguessable UUID filenames so we don't need signed URLs.
//
// We pull user.id from supabase.auth.getSession() at call time rather than
// trusting the captured useSupabaseUser ref — the ref can be stale during
// SSR→client hydration and would otherwise produce paths like "undefined/..."

type Bucket = 'rooms' | 'artworks' | 'visualizations'

export interface UploadResult {
  url:  string
  path: string
}

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp']
const MAX_BYTES   = 12 * 1024 * 1024 // 12 MB

export function useImageUpload() {
  const supabase = useSupabaseClient()

  async function upload(bucket: Bucket, file: File): Promise<UploadResult> {
    // Always read from the live session — single source of truth.
    const { data: { session }, error: sessErr } = await supabase.auth.getSession()
    if (sessErr) throw new Error(sessErr.message)
    const userId = session?.user?.id
    if (!userId) throw new Error('Not signed in — please log in again.')

    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    if (!ALLOWED_EXT.includes(ext)) throw new Error('Use JPG, PNG, or WebP.')
    if (file.size > MAX_BYTES)      throw new Error('Max file size is 12 MB.')

    const path = `${userId}/${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false })

    if (error) {
      // The most common cause is a stale auth token — surface a clearer message.
      if (error.message?.toLowerCase().includes('row-level security')) {
        throw new Error('Upload was rejected by storage permissions. Try refreshing the page and signing in again.')
      }
      throw new Error(error.message)
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return { url: data.publicUrl, path }
  }

  return { upload }
}
