const FIELD_LABELS = {
  title: 'Pinterest title',
  mediaUrl: 'Media URL',
  board: 'Pinterest board',
  description: 'Pinterest description',
  link: 'Redirect URL',
  publishDate: 'Pinterest publish date',
}

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

    for (const img of images) {
      const missing = []
      if (!img.pinterest.title) missing.push(FIELD_LABELS.title)
      if (!img.mediaUrl) missing.push(FIELD_LABELS.mediaUrl)
      if (!img.pinterest.board) missing.push(FIELD_LABELS.board)
      if (!img.pinterest.description) missing.push(FIELD_LABELS.description)
      if (!img.pinterest.link) missing.push(FIELD_LABELS.link)
      if (!img.pinterest.publishDate) missing.push(FIELD_LABELS.publishDate)
      missing.length === 0 ? valid.push(img) : invalid.push({ image: img, missing })
    }

    return { valid, invalid }
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
