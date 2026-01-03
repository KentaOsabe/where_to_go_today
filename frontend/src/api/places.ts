import type { ApiErrorResponse, FormState, Place } from '../types/place'

type CreatePlaceResult =
  | { type: 'success'; place: Place }
  | { type: 'duplicate'; errors?: ApiErrorResponse; existingPlaceId?: number }
  | { type: 'validation'; errors?: ApiErrorResponse }
  | { type: 'failure' }

const parseJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T
  } catch {
    return null
  }
}

export const createPlace = async (
  payload: FormState
): Promise<CreatePlaceResult> => {
  const response = await fetch('/api/places', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await parseJson<Place | ApiErrorResponse>(response)

  if (response.ok && data && 'id' in data) {
    return { type: 'success', place: data }
  }

  if (response.status === 409) {
    const errorPayload = (data ?? undefined) as ApiErrorResponse | undefined
    return {
      type: 'duplicate',
      errors: errorPayload,
      existingPlaceId: errorPayload?.existing_place_id,
    }
  }

  if (response.status === 422) {
    return {
      type: 'validation',
      errors: (data ?? undefined) as ApiErrorResponse | undefined,
    }
  }

  return { type: 'failure' }
}

export const fetchPlace = async (placeId: number): Promise<Place> => {
  const response = await fetch(`/api/places/${placeId}`)
  if (!response.ok) {
    throw new Error('Failed to load place')
  }
  return (await response.json()) as Place
}
