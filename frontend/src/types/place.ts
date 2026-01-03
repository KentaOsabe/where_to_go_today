export type VisitStatus = 'not_visited' | 'visited'

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
  created_at: string
  updated_at: string
}

export type ApiErrorResponse = {
  errors?: Partial<Record<keyof FormState, string[]>>
  existing_place_id?: number
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
