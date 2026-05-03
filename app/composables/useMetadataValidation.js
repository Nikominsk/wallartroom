export function useMetadataValidation() {
  function validatePinterest(img) {
    const issues = []
    if (!img.pinterest.title)
      issues.push({ field: 'title', message: 'Pinterest title is required', platform: 'pinterest' })
    if (!img.pinterest.description)
      issues.push({ field: 'description', message: 'Pinterest description is required', platform: 'pinterest' })
    if (!img.pinterest.board)
      issues.push({ field: 'board', message: 'Pinterest board is required', platform: 'pinterest' })
    if (!img.pinterest.link)
      issues.push({ field: 'link', message: 'Redirect URL is required', platform: 'pinterest' })
    if (!img.pinterest.publishDate)
      issues.push({ field: 'publishDate', message: 'Pinterest publish date is required', platform: 'pinterest' })
    if (img.pinterest.title && img.pinterest.title.length > 100)
      issues.push({ field: 'title', message: 'Title exceeds 100 characters', platform: 'pinterest' })
    if (img.pinterest.description && img.pinterest.description.length > 500)
      issues.push({ field: 'description', message: 'Description exceeds 500 characters', platform: 'pinterest' })
    return issues
  }

  function validateAdobeStock(img) {
    const issues = []
    if (!img.adobeStock.title)
      issues.push({ field: 'title', message: 'Adobe Stock title is required', platform: 'adobeStock' })
    if (!img.adobeStock.description)
      issues.push({ field: 'description', message: 'Adobe Stock description is required', platform: 'adobeStock' })
    if (!img.adobeStock.keywords?.length)
      issues.push({ field: 'keywords', message: 'Adobe Stock keywords are required', platform: 'adobeStock' })
    if (img.adobeStock.keywords && img.adobeStock.keywords.length > 49)
      issues.push({ field: 'keywords', message: 'Max 49 keywords allowed', platform: 'adobeStock' })
    if (img.adobeStock.title && img.adobeStock.title.length > 200)
      issues.push({ field: 'title', message: 'Title exceeds 200 characters', platform: 'adobeStock' })
    return issues
  }

  function isPinterestComplete(img) {
    return !!(img.pinterest.title && img.pinterest.description && img.pinterest.board && img.pinterest.link)
  }

  function isAdobeStockComplete(img) {
    return !!(img.adobeStock.title && img.adobeStock.description && img.adobeStock.keywords?.length)
  }

  return { validatePinterest, validateAdobeStock, isPinterestComplete, isAdobeStockComplete }
}
