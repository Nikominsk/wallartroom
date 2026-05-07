// POST /api/visualizations/create — generate one preview/render.
//
// Lifecycle (spec §13):
//   1. validate input + ownership
//   2. reserveCredits(cost)                     ← can fail with 402
//   3. insert visualization row (status=running)
//   4. run AI provider (room+artwork analysis → score → image)
//   5. on success → update visualization (succeeded), insert ai_recommendation,
//                   finalizeSpend, update project.best_score if higher
//      on failure → update visualization (failed), refundReserved
//   6. return the visualization payload to the client
//
// Important: the client never sees a successful response with a charged credit
// when generation actually failed. Refund-on-failure is the only safe path.

import type { CreditAction } from '~~/server/utils/credits'
import type { PlacementData, RenderQuality } from '~~/server/utils/ai/types'

interface CreateBody {
  projectId:       string
  artworkImageId:  string
  placementData:   PlacementData
  renderQuality:   RenderQuality
}

const COST_FOR: Record<RenderQuality, CreditAction> = {
  quick:        'quick_preview',
  realistic:    'realistic_render',
  high_quality: 'high_quality_export',
}

export default defineEventHandler(async (event) => {
  const user  = await requireUser(event)
  const body  = await readBody<CreateBody>(event)
  const admin = serverSupabaseAdmin(event)

  if (!body?.projectId || !body.artworkImageId || !body.placementData || !body.renderQuality) {
    throw createError({ statusCode: 400, statusMessage: 'projectId, artworkImageId, placementData, renderQuality all required' })
  }

  // ─── Ownership: project + artwork ────────────────────────────────────────
  const projRes = await admin
    .from('project')
    .select('id, user_id, room_image_url, best_score')
    .eq('id', body.projectId)
    .single()
  if (projRes.error || !projRes.data || projRes.data.user_id !== user.id) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  if (!projRes.data.room_image_url) {
    throw createError({ statusCode: 400, statusMessage: 'Project has no room photo yet' })
  }

  const artRes = await admin
    .from('artwork_image')
    .select('id, user_id, image_url')
    .eq('id', body.artworkImageId)
    .single()
  if (artRes.error || !artRes.data) {
    throw createError({ statusCode: 404, statusMessage: 'Artwork not found' })
  }
  if (artRes.data.user_id && artRes.data.user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // ─── Reserve credits ──────────────────────────────────────────────────────
  const action = COST_FOR[body.renderQuality]
  const cost   = CREDIT_COSTS[action]
  const reservation = await reserveCredits(event, user.id, cost, { projectId: body.projectId })

  // ─── Insert running row so the client can poll it if needed ──────────────
  const visIns = await admin
    .from('visualization')
    .insert({
      project_id:        body.projectId,
      user_id:           user.id,
      artwork_image_id:  body.artworkImageId,
      render_quality:    body.renderQuality,
      placement_data:    body.placementData,
      credits_spent:     0,
      status:            'running',
    })
    .select('id')
    .single()
  if (visIns.error) {
    await refundReserved(event, user.id, reservation, 'Failed to insert visualization row')
    throw createError({ statusCode: 500, statusMessage: visIns.error.message })
  }
  const visualizationId = visIns.data.id
  reservation.visualizationId = visualizationId

  // ─── Run AI (mock for now) ────────────────────────────────────────────────
  const ai = getAi()
  try {
    const [roomAnalysis, artworkAnalysis] = await Promise.all([
      ai.analyzeRoom({ roomImageUrl: projRes.data.room_image_url }),
      ai.analyzeArtwork({ artworkImageUrl: artRes.data.image_url }),
    ])

    const match = await ai.generateStyleMatch({
      roomAnalysis,
      artworkAnalysis,
      placementData: body.placementData,
    })

    const viz = await ai.generateVisualization({
      roomImageUrl:    projRes.data.room_image_url,
      artworkImageUrl: artRes.data.image_url,
      placementData:   body.placementData,
      renderQuality:   body.renderQuality,
    })

    if (viz.status !== 'succeeded') {
      throw new Error(viz.error || 'Generation failed')
    }

    // ─── Persist results ───────────────────────────────────────────────────
    const upd = await admin
      .from('visualization')
      .update({
        result_image_url:    viz.resultImageUrl,
        style_match_score:   match.styleMatchScore,
        color_match_score:   match.colorMatchScore,
        size_match_score:    match.sizeMatchScore,
        style_score:         match.styleScore,
        room_harmony_score:  match.roomHarmonyScore,
        credits_spent:       cost,
        status:              'succeeded',
      })
      .eq('id', visualizationId)
      .select('*')
      .single()
    if (upd.error) throw new Error(upd.error.message)

    await admin.from('ai_recommendation').insert({
      visualization_id:        visualizationId,
      explanation:             match.explanation,
      color_tips:              match.recommendedColors,
      size_tips:               match.recommendedSize,
      position_tips:           match.recommendedPosition,
      style_tips:              match.improvementTips,
      alternative_suggestions: null,
    })

    // Bump project.best_score if this run beats it
    const newBest = Math.max(projRes.data.best_score ?? 0, match.styleMatchScore)
    if (newBest !== (projRes.data.best_score ?? 0)) {
      await admin.from('project').update({ best_score: newBest }).eq('id', body.projectId)
    }

    await finalizeSpend(event, user.id, reservation, `Visualization (${body.renderQuality})`)

    return {
      id:                visualizationId,
      resultImageUrl:    viz.resultImageUrl,
      styleMatchScore:   match.styleMatchScore,
      colorMatchScore:   match.colorMatchScore,
      sizeMatchScore:    match.sizeMatchScore,
      styleScore:        match.styleScore,
      roomHarmonyScore:  match.roomHarmonyScore,
      explanation:       match.explanation,
      improvementTips:   match.improvementTips,
      recommendedColors: match.recommendedColors,
      creditsSpent:      cost,
      status:            'succeeded' as const,
    }
  } catch (err: any) {
    // ─── Failure path: refund + mark visualization failed ──────────────────
    await admin
      .from('visualization')
      .update({ status: 'failed', error_message: err?.message ?? 'Unknown error' })
      .eq('id', visualizationId)

    await refundReserved(event, user.id, reservation, `Visualization failed: ${err?.message ?? 'unknown'}`)

    throw createError({
      statusCode:    502,
      statusMessage: 'Generation failed. Your credits were not charged.',
      data:          { visualizationId },
    })
  }
})
