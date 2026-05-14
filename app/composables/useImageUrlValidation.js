// Cheap synchronous URL validation: parses with the URL constructor and requires
// an http/https scheme. This catches missing/malformed URLs without firing any
// network requests, so we never block rendering or hammer external hosts.
//
// We intentionally do NOT verify that the URL actually serves an image, since
// that would require N HEAD requests per page load. The runtime <img onerror>
// handler in InvalidImagesModal flags URLs that *parse* fine but won't load.

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|bmp|svg|avif|ico|tiff?)(\?.*)?$/i

export function isWellFormedImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim()
  if (!trimmed) return false
  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    return false
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
  if (!parsed.hostname) return false
  return true
}

// Pulls the last http(s) URL out of a string that may have junk prefixed
// (dotenvx banner, terminal escape sequences, square-bracketed URLs from
// markdown, etc.). Returns null if no URL is found. The match is intentionally
// the LAST occurrence so a real URL beats a host-only string earlier in the
// noise (e.g. "[www.dotenvx.com]https://real.url" → "https://real.url").
const URL_IN_STRING_RE = /https?:\/\/\S+/g

export function extractUrlFromString(input) {
  const matches = [...String(input ?? '').matchAll(URL_IN_STRING_RE)]
  if (matches.length === 0) return null
  return matches[matches.length - 1][0]
}

export function looksLikeImagePath(url) {
  if (!isWellFormedImageUrl(url)) return false
  try {
    const parsed = new URL(url.trim())
    return IMAGE_EXT_RE.test(parsed.pathname)
  } catch {
    return false
  }
}

// "Invalid" = no usable mediaUrl. We require the primary mediaUrl to be a
// well-formed URL — that's what the export pipeline and Pinterest itself
// consume. Thumbnail URL is optional and only used for the card preview.
export function isInvalidImage(img) {
  return !isWellFormedImageUrl(img?.mediaUrl)
}

export function useImageUrlValidation() {
  function partition(images) {
    const valid = []
    const invalid = []
    for (const img of images ?? []) {
      if (isInvalidImage(img)) invalid.push(img)
      else valid.push(img)
    }
    return { valid, invalid }
  }
  return { isWellFormedImageUrl, looksLikeImagePath, isInvalidImage, partition }
}
