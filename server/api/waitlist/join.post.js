import { serverSupabaseServiceRole } from '#supabase/server'
import { getRequestIP, setResponseHeader } from 'h3'

// ── Validation ─────────────────────────────────────────────────────────────
// RFC 5322-lite. Good enough to reject obvious garbage; we don't verify
// deliverability here (no transactional provider wired up yet).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Smallest reasonable time a real human takes to land on the page, focus the
// email input, type, and submit. Bot auto-submits typically fire in well under
// a second. We err on the slow side so we don't reject legit fast typers.
const MIN_FORM_FILL_MS = 1500

// Per-IP throttle. In-memory so it doesn't survive a server restart, which is
// fine — most real abuse rotates IPs anyway, and Cloudflare/Vercel rate limits
// will catch the rest in production. Move to Supabase or Redis if you scale
// the API to multiple instances.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_HITS = 5
const rateLimitStore = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  // Cheap O(n) prune. n stays bounded by traffic; for a waitlist this is fine.
  for (const [k, v] of rateLimitStore) {
    if (v.expires < now) rateLimitStore.delete(k)
  }
  const entry = rateLimitStore.get(ip)
  if (!entry || entry.expires < now) {
    rateLimitStore.set(ip, { hits: 1, expires: now + RATE_LIMIT_WINDOW_MS })
    return { ok: true, retryAfter: 0 }
  }
  if (entry.hits >= RATE_LIMIT_MAX_HITS) {
    return { ok: false, retryAfter: Math.ceil((entry.expires - now) / 1000) }
  }
  entry.hits++
  return { ok: true, retryAfter: 0 }
}

// Disposable / burner-mail domains. Not exhaustive — there are thousands —
// but blocks the most common ones used to grief waitlists. Add to this set as
// junk shows up in your real signups.
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '20minutemail.com', '30minutemail.com',
  'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.net',
  'guerrillamail.org', 'guerrillamail.biz', 'guerrillamailblock.com',
  'mailinator.com', 'mailinator.net', 'mailinator2.com',
  'tempmail.org', 'temp-mail.org', 'temp-mail.io', 'tempmailo.com',
  'throwawaymail.com', 'throwaway.email',
  'yopmail.com', 'yopmail.fr', 'yopmail.net',
  'getnada.com', 'nada.email',
  'fakeinbox.com', 'fakemailgenerator.com',
  'sharklasers.com', 'spam4.me', 'grr.la',
  'maildrop.cc', 'mailcatch.com', 'maildim.com',
  'trashmail.com', 'trashmail.net', 'trashmail.de',
  'mohmal.com',
  'mintemail.com',
  'mytrashmail.com',
  'spambog.com', 'spambox.us',
  'discard.email', 'discardmail.com',
  'dispostable.com',
  'tempr.email',
  'emailondeck.com',
  'mailnesia.com',
  'mailcatch.com',
])


// ── Handler ────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 1) Honeypot. Real users never fill the hidden "company" field; bots that
  //    auto-fill form inputs by name almost always do. Silent 200 — we don't
  //    tell the bot we rejected, so it has nothing to adapt to.
  if (body?.company) {
    return { ok: true, alreadyJoined: false }
  }

  // 2) Minimum form fill time. The client sends `delay` (ms between mount and
  //    submit). Anything under 1.5s is almost certainly a script. Silent 200
  //    again — same reasoning as the honeypot.
  const delay = Number(body?.delay) || 0
  if (delay < MIN_FORM_FILL_MS) {
    return { ok: true, alreadyJoined: false }
  }

  // 3) Per-IP rate limit. Returns a real 429 with Retry-After so legit users
  //    on shared NATs get a meaningful error if they hit the cap.
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const rl = checkRateLimit(ip)
  if (!rl.ok) {
    setResponseHeader(event, 'Retry-After', String(rl.retryAfter))
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many signups from this connection. Try again in a few minutes.',
    })
  }

  // 4) Email shape. Trim, lowercase, length-cap so we don't get megabyte
  //    "emails" stored in the table.
  const raw = String(body?.email ?? '').trim().toLowerCase()
  if (!raw || !EMAIL_RE.test(raw) || raw.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'Please enter a valid email address.' })
  }

  // 5) Disposable / throwaway domain check.
  const domain = raw.split('@')[1]
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please use a non-disposable email address.',
    })
  }

  // 6) Source tag (where on the page the signup happened). Length-capped so
  //    nobody can stuff arbitrary text into the column.
  const source = body?.source ? String(body.source).slice(0, 120) : null

  // Service role bypasses RLS; RLS on the table is locked down to deny direct
  // client reads/writes, so this is the only way in.
  const client = serverSupabaseServiceRole(event)
  const { error } = await client.from('waitlist').insert({ email: raw, source })

  // 23505 = unique_violation. Treat duplicate emails as success so we don't
  // leak who's already on the list (prevents email-enumeration attacks).
  if (error && error.code !== '23505') {
    throw createError({ statusCode: 500, statusMessage: 'Could not save your email. Try again.' })
  }

  return { ok: true, alreadyJoined: error?.code === '23505' }
})
