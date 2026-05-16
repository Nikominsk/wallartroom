// Timezone helpers for the Pinterest metadata tool.
//
// Every publish date is stored as a UTC instant. Pinterest's bulk-CSV importer
// reads the naked "Publish date" in the *Pinterest account's* timezone, so the
// export (and the in-app preview, so they match) must render the wall-clock for
// a fixed, user-chosen zone — never the timezone of whatever machine happens to
// run the export. That choice lives in Settings (`csv_timezone`).

// Curated list shown in the Settings dropdown. European zones first since the
// tool's operator is EU-based; the rest cover the common Pinterest markets.
export const METADATA_TIMEZONES = [
  { value: 'Europe/Berlin',      label: 'Europe — Berlin / Paris / Madrid (CET/CEST)' },
  { value: 'Europe/London',      label: 'Europe — London / Dublin / Lisbon (GMT/BST)' },
  { value: 'Europe/Athens',      label: 'Europe — Athens / Helsinki / Bucharest (EET)' },
  { value: 'Europe/Moscow',      label: 'Europe — Moscow (MSK)' },
  { value: 'UTC',                label: 'UTC — Coordinated Universal Time' },
  { value: 'America/New_York',   label: 'US — Eastern (New York)' },
  { value: 'America/Chicago',    label: 'US — Central (Chicago)' },
  { value: 'America/Denver',     label: 'US — Mountain (Denver)' },
  { value: 'America/Los_Angeles',label: 'US — Pacific (Los Angeles)' },
  { value: 'America/Sao_Paulo',  label: 'Brazil — São Paulo' },
  { value: 'Asia/Dubai',         label: 'Asia — Dubai (GST)' },
  { value: 'Asia/Kolkata',       label: 'Asia — India (IST)' },
  { value: 'Asia/Singapore',     label: 'Asia — Singapore' },
  { value: 'Asia/Tokyo',         label: 'Asia — Tokyo (JST)' },
  { value: 'Australia/Sydney',   label: 'Australia — Sydney' },
]

export const DEFAULT_METADATA_TIMEZONE = 'Europe/Berlin'

function partsInZone(iso, tz) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || DEFAULT_METADATA_TIMEZONE,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    const map = {}
    for (const p of fmt.formatToParts(d)) {
      if (p.type !== 'literal') map[p.type] = p.value
    }
    // h23 can emit "24" at midnight in some engines — normalise to "00".
    if (map.hour === '24') map.hour = '00'
    return map
  } catch {
    return null
  }
}

// "2026-06-01T15:00:00" — the exact shape Pinterest's CSV importer expects, in
// the configured zone. Falls back to the machine's local time if the zone is
// unusable so an export never silently produces an empty cell.
export function formatWallClockInZone(iso, tz) {
  const m = partsInZone(iso, tz)
  if (!m) {
    try {
      const d = new Date(iso)
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    } catch {
      return iso
    }
  }
  return `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}:${m.second}`
}

// "YYYY-MM-DD" for the configured zone — used to bucket pins into calendar days.
export function dateKeyInZone(iso, tz) {
  const m = partsInZone(iso, tz)
  return m ? `${m.year}-${m.month}-${m.day}` : ''
}

// "HH:MM" (24h) for the configured zone — used for calendar / preview labels.
export function timeLabelInZone(iso, tz) {
  const m = partsInZone(iso, tz)
  return m ? `${m.hour}:${m.minute}` : ''
}

// Short "GMT+2"-style suffix so the UI can show which offset is in effect.
export function zoneOffsetLabel(tz, at = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || DEFAULT_METADATA_TIMEZONE,
      timeZoneName: 'shortOffset',
    }).formatToParts(at)
    return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}
