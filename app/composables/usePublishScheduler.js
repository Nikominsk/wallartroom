export const TIME_SLOTS = (() => {
  const slots = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const h12 = h % 12 === 0 ? 12 : h % 12
      const ampm = h < 12 ? 'AM' : 'PM'
      slots.push(`${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`)
    }
  }
  return slots
})()

function parseTime(time) {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return { hours: 0, minutes: 0 }
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  const ap = m[3].toUpperCase()
  if (ap === 'AM' && h === 12) h = 0
  if (ap === 'PM' && h !== 12) h += 12
  return { hours: h, minutes: min }
}

function freshOptions() {
  return {
    targetField: 'pinterestPublishDate',
    startDate: new Date().toISOString().slice(0, 10),
    startTime: '12:00 PM',
    intervalMinutes: 30,
    skipExisting: true,
    overwriteExisting: false,
  }
}

export function usePublishScheduler() {
  const options = reactive(freshOptions())

  function previewSchedule(images) {
    const { hours, minutes } = parseTime(options.startTime)
    let cursor = new Date(`${options.startDate}T00:00:00`)
    cursor.setHours(hours, minutes, 0, 0)
    const intervalMs = options.intervalMinutes * 60 * 1000

    return images.map(img => {
      const existing =
        options.targetField === 'pinterestPublishDate'
          ? img.pinterest.publishDate
          : img.adobeStock.publishDate

      if (existing && options.skipExisting && !options.overwriteExisting) {
        return { image: img, date: null }
      }

      const assigned = new Date(cursor.getTime())
      cursor = new Date(cursor.getTime() + intervalMs)
      return { image: img, date: assigned }
    })
  }

  function applySchedule(images) {
    const preview = previewSchedule(images)
    return preview.map(({ image, date }) => {
      if (!date) return image
      const p = { ...image.pinterest }
      const a = { ...image.adobeStock }
      if (options.targetField === 'pinterestPublishDate') {
        p.publishDate = date.toISOString()
      } else {
        a.publishDate = date.toISOString()
      }
      return { ...image, pinterest: p, adobeStock: a, updatedAt: new Date().toISOString() }
    })
  }

  function reset() {
    Object.assign(options, freshOptions())
  }

  return { options, previewSchedule, applySchedule, reset }
}
