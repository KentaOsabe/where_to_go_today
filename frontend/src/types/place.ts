export type VisitStatus = 'not_visited' | 'visited'
export type RevisitIntent = 'yes' | 'no' | 'unknown'

export type FormState = {
  name: string
  tabelog_url: string
  visit_status: VisitStatus
  genre: string
  area: string
  price_range: string
  note: string
}

export type FormErrors = Partial<Record<keyof FormState, string>>

export type Place = {
  id: number
  name: string
  tabelog_url: string
  visit_status: VisitStatus
  genre: string | null
  area: string | null
  price_range: string | null
  note: string | null
  visit_reason: string | null
  revisit_intent: RevisitIntent | null
  created_at: string
  updated_at: string
}

export type Pagination = {
  page: number
  per: number
  total_count: number
  total_pages: number
}

export type PlacesResponse = {
  places: Place[]
  pagination: Pagination
}

export type ApiErrorResponse = {
  errors?: Partial<Record<keyof FormState, string[]>>
  existing_place_id?: number
}

export type RecommendationConditions = {
  condition_text: string
}

export type Recommendation = {
  place: Place
  reason: string
}

export const initialFormState: FormState = {
  name: '',
  tabelog_url: '',
  visit_status: 'not_visited',
  genre: '',
  area: '',
  price_range: '',
  note: '',
}
