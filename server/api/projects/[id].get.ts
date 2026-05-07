// GET /api/projects/[id] — full project payload for the editor.
// Includes the project, all visualizations (newest first) with their AI
// recommendations and the artwork rows referenced by each.

export default defineEventHandler(async (event) => {
  const user  = await requireUser(event)
  const id    = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'project id required' })

  const admin = serverSupabaseAdmin(event)

  const projectRes = await admin
    .from('project')
    .select('id, title, room_image_url, selected_wall_area, placement_mode, best_score, created_at, updated_at, user_id')
    .eq('id', id)
    .single()

  if (projectRes.error || !projectRes.data) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }
  if (projectRes.data.user_id !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const visualsRes = await admin
    .from('visualization')
    .select(`
      id, result_image_url, render_quality, placement_data,
      style_match_score, color_match_score, size_match_score, style_score, room_harmony_score,
      credits_spent, status, error_message, created_at,
      artwork_image_id,
      artwork_image:artwork_image_id (
        id, image_url, title, source, dominant_colors, aspect_ratio
      ),
      ai_recommendation (
        id, explanation, color_tips, size_tips, position_tips, style_tips, alternative_suggestions
      )
    `)
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  if (visualsRes.error) throw createError({ statusCode: 500, statusMessage: visualsRes.error.message })

  return {
    project: {
      id:               projectRes.data.id,
      title:            projectRes.data.title,
      roomImageUrl:     projectRes.data.room_image_url,
      selectedWallArea: projectRes.data.selected_wall_area,
      placementMode:    projectRes.data.placement_mode,
      bestScore:        projectRes.data.best_score,
      createdAt:        projectRes.data.created_at,
      updatedAt:        projectRes.data.updated_at,
    },
    visualizations: visualsRes.data.map((v: any) => ({
      id:               v.id,
      resultImageUrl:   v.result_image_url,
      renderQuality:    v.render_quality,
      placementData:    v.placement_data,
      styleMatchScore:  v.style_match_score,
      colorMatchScore:  v.color_match_score,
      sizeMatchScore:   v.size_match_score,
      styleScore:       v.style_score,
      roomHarmonyScore: v.room_harmony_score,
      creditsSpent:     v.credits_spent,
      status:           v.status,
      errorMessage:     v.error_message,
      createdAt:        v.created_at,
      artwork: v.artwork_image ? {
        id:             v.artwork_image.id,
        imageUrl:       v.artwork_image.image_url,
        title:          v.artwork_image.title,
        source:         v.artwork_image.source,
        dominantColors: v.artwork_image.dominant_colors,
        aspectRatio:    v.artwork_image.aspect_ratio,
      } : null,
      recommendation: v.ai_recommendation?.[0] ? {
        explanation:            v.ai_recommendation[0].explanation,
        colorTips:              v.ai_recommendation[0].color_tips,
        sizeTips:               v.ai_recommendation[0].size_tips,
        positionTips:           v.ai_recommendation[0].position_tips,
        styleTips:              v.ai_recommendation[0].style_tips,
        alternativeSuggestions: v.ai_recommendation[0].alternative_suggestions,
      } : null,
    })),
  }
})
