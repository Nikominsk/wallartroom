export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { urls } = body

  if (!Array.isArray(urls) || urls.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'urls array is required' })
  }

  // Limit batch size to prevent abuse
  const batch = urls.slice(0, 50)

  const results = await Promise.allSettled(
    batch.map(async (url) => {
      if (!url || typeof url !== 'string') {
        return { url, status: 'invalid', statusCode: null, redirectTo: null, error: 'Not a valid URL' }
      }

      let parsed
      try {
        parsed = new URL(url.trim())
      } catch {
        return { url, status: 'invalid', statusCode: null, redirectTo: null, error: 'Malformed URL' }
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { url, status: 'invalid', statusCode: null, redirectTo: null, error: 'Must be http or https' }
      }

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 8000)

        const res = await fetch(url.trim(), {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
          headers: { 'User-Agent': 'WallArtRoom-LinkChecker/1.0' },
        })

        clearTimeout(timeout)

        const redirectTo = res.headers.get('location') || null
        const isRedirect = res.status >= 300 && res.status < 400

        let status = 'healthy'
        if (res.status >= 400) status = 'broken'
        else if (isRedirect) status = 'redirect'

        return { url, status, statusCode: res.status, redirectTo, error: null }
      } catch (e) {
        return { url, status: 'broken', statusCode: null, redirectTo: null, error: e.message || 'Connection failed' }
      }
    })
  )

  return {
    results: results.map(r => r.status === 'fulfilled' ? r.value : { url: null, status: 'error', statusCode: null, redirectTo: null, error: 'Check failed' }),
    summary: {
      total: batch.length,
      healthy: results.filter(r => r.value?.status === 'healthy').length,
      redirects: results.filter(r => r.value?.status === 'redirect').length,
      broken: results.filter(r => r.value?.status === 'broken' || r.value?.status === 'invalid').length,
    },
  }
})
