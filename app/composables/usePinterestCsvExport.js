// Fields the Pinterest CSV strictly requires. Missing one of these excludes an
// image from the export.
const REQUIRED_FIELDS = [
  { key: 'title', label: 'Pinterest title', get: img => img.pinterest.title },
  { key: 'mediaUrl', label: 'Media URL', get: img => img.mediaUrl },
  { key: 'description', label: 'Pinterest description', get: img => img.pinterest.description },
  { key: 'publishDate', label: 'Pinterest publish date', get: img => img.pinterest.publishDate },
]

// Fields treated as optional for Pinterest CSV export. The image still ships,
// but the modal surfaces a count so the user knows what's missing.
const OPTIONAL_FIELDS = [
  { key: 'board', label: 'Pinterest board', get: img => img.pinterest.board },
  { key: 'link', label: 'Redirect URL', get: img => img.pinterest.link },
]

function escape(value) {
  if (/[,\n\r"]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function usePinterestCsvExport() {
  function validate(images) {
    const valid = []
    const invalid = []
    const optionalMissing = Object.fromEntries(
      OPTIONAL_FIELDS.map(f => [f.key, { label: f.label, count: 0, samples: [] }])
    )

    for (const img of images) {
      const missing = REQUIRED_FIELDS.filter(f => !f.get(img)).map(f => f.label)

      if (missing.length > 0) {
        invalid.push({ image: img, missing })
        continue
      }

      valid.push(img)

      // Optional gaps are only tallied for images that will actually export.
      for (const f of OPTIONAL_FIELDS) {
        if (!f.get(img)) {
          const entry = optionalMissing[f.key]
          entry.count++
          if (entry.samples.length < 5) entry.samples.push(img.filename)
        }
      }
    }

    return { valid, invalid, optionalMissing }
  }

  // The publish date is a UTC instant; Pinterest reads the naked CSV time in
  // the Pinterest account's timezone. Rendering the wall-clock for the
  // user-configured `tz` makes the export independent of the export machine's
  // timezone — this is what stops a 15:00 pick arriving as 17:00.
  function buildCsv(images, tz = DEFAULT_METADATA_TIMEZONE) {
    // CSV rows are sorted by Pinterest publish date ascending so the file
    // matches the chronological posting order rather than whatever sort the
    // gallery happens to be on at the time of export.
    const sorted = [...images].sort((a, b) => {
      const da = a.pinterest.publishDate ?? ''
      const db = b.pinterest.publishDate ?? ''
      return da.localeCompare(db)
    })

    const header = 'Title,Media URL,Pinterest board,Description,Link,Publish date'
    const rows = sorted.map(img =>
      [
        escape(img.pinterest.title ?? ''),
        escape(img.mediaUrl),
        escape(img.pinterest.board ?? ''),
        escape(img.pinterest.description ?? ''),
        escape(img.pinterest.link ?? ''),
        escape(img.pinterest.publishDate ? formatWallClockInZone(img.pinterest.publishDate, tz) : ''),
      ].join(',')
    )
    return [header, ...rows].join('\n')
  }

  function generateFilename() {
    const d = new Date()
    const pad = n => String(n).padStart(2, '0')
    const ts = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
    return `pinterest-export-${ts}.csv`
  }

  function downloadCsv(images, tz = DEFAULT_METADATA_TIMEZONE) {
    const filename = generateFilename()
    const csv = buildCsv(images, tz)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return filename
  }

  return { validate, buildCsv, downloadCsv }
}
