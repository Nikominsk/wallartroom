// Parser for the Pinterest Business "Analytics overview" CSV export.
//
// That file is not a single table — it's several stacked sections separated by
// blank lines:
//   1. "Analytics overview" + a "YYYY-MM-DD - YYYY-MM-DD" period + filter rows
//   2. "Date,Outbound clicks" daily time series
//   3. "Top Boards <range>" table  (the richest signal)
//   4. "Top Pins <range>" table
//
// We extract everything that can (a) populate board names or (b) help the AI
// make better board/description calls: per-board performance, the account
// handle, the account's strongest themes, click momentum, and a top-pin
// impression benchmark. Every section is optional; we return whatever we find.

export interface ParsedBoard {
  slug:           string
  name:           string
  url:            string
  system:         boolean   // Pinterest auto-board (slug starts with "_")
  impressions:    number
  engagement:     number
  pinClicks:      number
  outboundClicks: number
  saves:          number
}

export interface ParsedAnalytics {
  handle:    string | null
  period:    { start: string | null; end: string | null }
  boards:    ParsedBoard[]
  outboundClicks: {
    total:     number
    avgPerDay: number
    trend:     'rising' | 'falling' | 'flat'
    bestDay:   { date: string; clicks: number } | null
    days:      number
  } | null
  pins: {
    count:          number
    organicShare:   number   // 0..1
    canonicalShare: number   // 0..1
    impressions:    { max: number; median: number; p25: number; total: number }
  } | null
  topThemes: string[]        // strongest board names by impressions (non-system)
}

// ── CSV record parsing (RFC-4180-ish: quotes, "" escapes, commas in quotes) ──
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      out.push(field); field = ''
    } else {
      field += c
    }
  }
  out.push(field)
  return out.map(s => s.trim())
}

const num = (v: string): number => {
  const n = parseInt(String(v ?? '').replace(/[^\d-]/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

const PERIOD_RE = /(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// "https://www.pinterest.com/DigiDesignArt/simple-ways-to-style-your-walls/"
// → { handle: "DigiDesignArt", slug: "simple-ways-to-style-your-walls" }
function parseBoardUrl(url: string): { handle: string; slug: string } | null {
  const m = url.match(/pinterest\.[a-z.]+\/([^/]+)\/([^/]+)\/?/i)
  if (!m) return null
  const handle = m[1]
  const slug = decodeURIComponent(m[2])
  if (handle.toLowerCase() === 'pin') return null // that's a pin URL, not a board
  return { handle, slug }
}

function median(sorted: number[]): number {
  if (!sorted.length) return 0
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[idx]
}

export function parsePinterestAnalytics(csv: string): ParsedAnalytics {
  const lines = String(csv ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')

  const result: ParsedAnalytics = {
    handle: null,
    period: { start: null, end: null },
    boards: [],
    outboundClicks: null,
    pins: null,
    topThemes: [],
  }

  // Overall period: first "YYYY-MM-DD - YYYY-MM-DD" we see (the header line, or
  // failing that, a "Top Boards <range>" title).
  for (const l of lines.slice(0, 30)) {
    const m = l.match(PERIOD_RE)
    if (m) { result.period = { start: m[1], end: m[2] }; break }
  }

  // ── Top Boards ────────────────────────────────────────────────────────────
  const boardIdx = lines.findIndex(l => /^top boards/i.test(l.trim()))
  if (boardIdx !== -1) {
    if (!result.period.start) {
      const m = lines[boardIdx].match(PERIOD_RE)
      if (m) result.period = { start: m[1], end: m[2] }
    }
    // header is the next non-empty line; data starts after it.
    let i = boardIdx + 1
    while (i < lines.length && !lines[i].trim()) i++
    const header = parseCsvLine(lines[i] ?? '')
    const col = (name: string) =>
      header.findIndex(h => h.toLowerCase() === name.toLowerCase())
    const cImp  = col('Impressions')
    const cEng  = col('Engagement')
    const cPin  = col('Pin clicks')
    const cOut  = col('Outbound clicks')
    const cSav  = col('Saves')
    i++
    for (; i < lines.length; i++) {
      const raw = lines[i]
      if (!raw.trim()) break                       // blank → section ended
      if (/^top pins/i.test(raw.trim())) break
      if (raw.trim().startsWith('"') && !raw.includes('pinterest.')) break // footnote
      const cells = parseCsvLine(raw)
      const parsed = parseBoardUrl(cells[0] ?? '')
      if (!parsed) continue
      if (!result.handle) result.handle = parsed.handle
      const slug = parsed.slug
      result.boards.push({
        slug,
        name: titleCase(slug.replace(/[-_]+/g, ' ').trim()),
        url: cells[0],
        system: slug.startsWith('_'),
        impressions:    cImp >= 0 ? num(cells[cImp]) : 0,
        engagement:     cEng >= 0 ? num(cells[cEng]) : 0,
        pinClicks:      cPin >= 0 ? num(cells[cPin]) : 0,
        outboundClicks: cOut >= 0 ? num(cells[cOut]) : 0,
        saves:          cSav >= 0 ? num(cells[cSav]) : 0,
      })
    }
  }

  // Strongest themes = non-system boards by impressions, top 6.
  result.topThemes = [...result.boards]
    .filter(b => !b.system)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 6)
    .map(b => b.name)

  // ── Daily outbound clicks ─────────────────────────────────────────────────
  const clicksIdx = lines.findIndex(l =>
    /^date\s*,\s*outbound clicks/i.test(l.trim()))
  if (clicksIdx !== -1) {
    const series: { date: string; clicks: number }[] = []
    for (let i = clicksIdx + 1; i < lines.length; i++) {
      const raw = lines[i]
      if (!raw.trim()) break
      const cells = parseCsvLine(raw)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cells[0] ?? '')) break // footnote/next section
      series.push({ date: cells[0], clicks: num(cells[1]) })
    }
    if (series.length) {
      const total = series.reduce((s, d) => s + d.clicks, 0)
      const half = Math.floor(series.length / 2)
      const firstAvg = half ? series.slice(0, half).reduce((s, d) => s + d.clicks, 0) / half : 0
      const secondAvg = half ? series.slice(half).reduce((s, d) => s + d.clicks, 0) / (series.length - half) : 0
      const best = series.reduce((b, d) => (d.clicks > b.clicks ? d : b), series[0])
      const trend: 'rising' | 'falling' | 'flat' =
        secondAvg > firstAvg * 1.15 ? 'rising'
        : secondAvg < firstAvg * 0.85 ? 'falling'
        : 'flat'
      result.outboundClicks = {
        total,
        avgPerDay: Math.round((total / series.length) * 10) / 10,
        trend,
        bestDay: best.clicks > 0 ? best : null,
        days: series.length,
      }
    }
  }

  // ── Top Pins (no titles in this export → store aggregates only) ────────────
  const pinIdx = lines.findIndex(l => /^top pins/i.test(l.trim()))
  if (pinIdx !== -1) {
    let i = pinIdx + 1
    while (i < lines.length && !lines[i].trim()) i++
    const header = parseCsvLine(lines[i] ?? '')
    const cType = header.findIndex(h => /content type/i.test(h))
    const cCanon = header.findIndex(h => /canonical/i.test(h))
    const cImp = header.findIndex(h => /impressions/i.test(h))
    i++
    const imps: number[] = []
    let organic = 0
    let canonical = 0
    let count = 0
    for (; i < lines.length; i++) {
      const raw = lines[i]
      if (!raw.trim()) break
      if (raw.trim().startsWith('"') && !raw.includes('pinterest.')) break
      const cells = parseCsvLine(raw)
      if (!/pinterest\.[a-z.]+\/pin\//i.test(cells[0] ?? '')) continue
      count++
      if (cType >= 0 && /organic/i.test(cells[cType] ?? '')) organic++
      if (cCanon >= 0 && /^yes$/i.test(cells[cCanon] ?? '')) canonical++
      if (cImp >= 0) imps.push(num(cells[cImp]))
    }
    if (count) {
      const sorted = [...imps].sort((a, b) => a - b)
      result.pins = {
        count,
        organicShare: Math.round((organic / count) * 100) / 100,
        canonicalShare: Math.round((canonical / count) * 100) / 100,
        impressions: {
          max: sorted.length ? sorted[sorted.length - 1] : 0,
          median: median(sorted),
          p25: percentile(sorted, 25),
          total: imps.reduce((s, n) => s + n, 0),
        },
      }
    }
  }

  return result
}

// A one-paragraph, token-cheap brief the AI prompts can embed. Returns '' when
// there's no analytics yet so callers can simply skip it.
export function analyticsBriefForAI(a: ParsedAnalytics | null | undefined): string {
  if (!a || !a.boards.length) return ''
  const top = a.topThemes.slice(0, 5)
  const parts: string[] = []
  if (a.handle) parts.push(`Pinterest account: @${a.handle}.`)
  if (top.length) {
    parts.push(`This account's best-performing themes (by real impressions) are: ${top.join(', ')}. Lean into these proven, search-friendly angles when they fit the image; treat low-traffic themes as secondary.`)
  }
  if (a.outboundClicks) {
    parts.push(`Outbound-click trend over the measured window: ${a.outboundClicks.trend}.`)
  }
  return parts.join(' ')
}
