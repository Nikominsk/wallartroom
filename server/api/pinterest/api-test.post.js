// POST /api/pinterest/api-test
// Server-side proxy to Pinterest v5 API — avoids CORS, keeps token off the wire.
// Accepts { token, environment, endpoint, params } and returns the raw API response.

const BASE = {
  production: 'https://api.pinterest.com/v5',
  sandbox:    'https://api-sandbox.pinterest.com/v5',
}

const ENDPOINTS = {
  user_account: { path: '/user_account',     method: 'GET' },
  boards:       { path: '/boards',           method: 'GET', params: { page_size: 10 } },
  pins:         { path: '/pins',             method: 'GET', params: { page_size: 10 } },
  board_pins:   { path: '/boards/{id}/pins', method: 'GET', params: { page_size: 5  } },
}

export default defineEventHandler(async (event) => {
  const { token, environment = 'production', endpoint, pathParams = {} } = await readBody(event)

  if (!token?.trim())    throw createError({ statusCode: 400, statusMessage: 'token is required' })
  if (!ENDPOINTS[endpoint]) throw createError({ statusCode: 400, statusMessage: `unknown endpoint "${endpoint}"` })

  const base = BASE[environment] ?? BASE.production
  const def  = ENDPOINTS[endpoint]

  let path = def.path
  for (const [k, v] of Object.entries(pathParams)) {
    path = path.replace(`{${k}}`, encodeURIComponent(v))
  }

  const qs = def.params ? '?' + new URLSearchParams(def.params).toString() : ''
  const url = `${base}${path}${qs}`

  const t0 = Date.now()
  let res, body

  try {
    res = await fetch(url, {
      method:  def.method,
      headers: {
        Authorization:  `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      },
    })
    body = await res.json()
  } catch (err) {
    throw createError({ statusCode: 502, statusMessage: `Pinterest API unreachable: ${err.message}` })
  }

  return {
    ok:          res.ok,
    status:      res.status,
    statusText:  res.statusText,
    endpoint,
    environment,
    url,
    ms:          Date.now() - t0,
    data:        body,
  }
})
