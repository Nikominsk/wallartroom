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

function fmtDate(iso) {
  try {
    const d = new Date(iso)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`
  } catch {
    return iso
  }
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

  function buildCsv(images) {
    const header = 'Title,Media URL,Pinterest board,Description,Link,Publish date'
    const rows = images.map(img =>
      [
        escape(img.pinterest.title ?? ''),
        escape(img.mediaUrl),
        escape(img.pinterest.board ?? ''),
        escape(img.pinterest.description ?? ''),
        escape(img.pinterest.link ?? ''),
        escape(img.pinterest.publishDate ? fmtDate(img.pinterest.publishDate) : ''),
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

  function downloadCsv(images) {
    const filename = generateFilename()
    const csv = buildCsv(images)
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
