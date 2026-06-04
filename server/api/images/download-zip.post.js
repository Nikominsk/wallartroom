import { zipSync } from 'fflate'

export default defineEventHandler(async (event) => {
  const { projectId } = await requireMetadataProject(event)
  const { imageIds } = await readBody(event)

  if (!Array.isArray(imageIds) || imageIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No image IDs provided' })
  }

  const admin = serverSupabaseAdmin(event)
  const { data: rows } = await admin
    .from('image')
    .select('id, filename, public_url')
    .in('id', imageIds)
    .eq('project_id', projectId)

  if (!rows?.length) {
    throw createError({ statusCode: 404, statusMessage: 'No images found' })
  }

  const files = {}
  await Promise.all(rows.map(async (row) => {
    if (!row.public_url) return
    try {
      const res = await fetch(row.public_url)
      if (!res.ok) return
      const buf = await res.arrayBuffer()
      const name = row.filename || `image-${row.id}`
      let key = name
      let n = 1
      while (key in files) {
        const dot = name.lastIndexOf('.')
        key = dot >= 0 ? `${name.slice(0, dot)}_${n++}${name.slice(dot)}` : `${name}_${n++}`
      }
      // level: 0 = store only — images are already compressed formats
      files[key] = [new Uint8Array(buf), { level: 0 }]
    } catch { /* skip any individual image that fails */ }
  }))

  if (Object.keys(files).length === 0) {
    throw createError({ statusCode: 502, statusMessage: 'Could not fetch any images' })
  }

  const zipped = zipSync(files)

  setResponseHeader(event, 'Content-Type', 'application/zip')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="images-${new Date().toISOString().slice(0, 10)}.zip"`)

  return send(event, Buffer.from(zipped))
})
