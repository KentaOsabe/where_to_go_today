import type {
  Recommendation,
  RecommendationConditions,
} from '../types/place'

type RecommendPlacesResult =
  | {
      type: 'success'
      conditions: RecommendationConditions
      recommendations: Recommendation[]
    }
  | { type: 'failure' }

const parseJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export const recommendPlaces = async (
  conditions: RecommendationConditions
): Promise<RecommendPlacesResult> => {
  const response = await fetch('/api/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conditions),
  })

  const data = await parseJson<{
    conditions: RecommendationConditions
    recommendations: Recommendation[]
  }>(response)

  if (response.ok && data && Array.isArray(data.recommendations)) {
    return {
      type: 'success',
      conditions: data.conditions,
      recommendations: data.recommendations,
    }
  }

  return { type: 'failure' }
}
