import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { fetchPlace, updatePlace } from '../api/places'
import { validateForm } from '../lib/validation'
import type { ApiErrorResponse, FormErrors, FormState, Place } from '../types/place'
import { initialFormState } from '../types/place'

type UseEditPlaceOptions = {
  placeId: number | null
  onSuccess: (place: Place) => void
}

type EditFormChangeEvent =
  | ChangeEvent<HTMLInputElement>
  | ChangeEvent<HTMLTextAreaElement>
  | ChangeEvent<HTMLSelectElement>

export type EditPlaceState = {
  formState: FormState
  errors: FormErrors
  isLoading: boolean
  loadError: string | null
  isSubmitting: boolean
  submitError: string | null
  duplicatePlaceId: number | null
  isReady: boolean
  handleChange: (event: EditFormChangeEvent) => void
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void
  reload: () => void
}

const mapApiErrors = (payload?: ApiErrorResponse): FormErrors => {
  if (!payload?.errors) {
    return {}
  }
  return Object.entries(payload.errors).reduce<FormErrors>(
    (acc, [key, value]) => {
      if (value && value.length > 0) {
        acc[key as keyof FormState] = value[0]
      }
      return acc
    },
    {}
  )
}

const mapPlaceToFormState = (place: Place): FormState => ({
  name: place.name ?? '',
  tabelog_url: place.tabelog_url ?? '',
  visit_status: place.visit_status ?? 'not_visited',
  genre: place.genre ?? '',
  area: place.area ?? '',
  price_range: place.price_range ?? '',
  visit_reason: place.visit_reason ?? '',
  note: place.note ?? '',
})

export const useEditPlace = ({
  placeId,
  onSuccess,
}: UseEditPlaceOptions): EditPlaceState => {
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [duplicatePlaceId, setDuplicatePlaceId] = useState<number | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (placeId === null) {
      setIsLoading(false)
      setLoadError('指定されたデータが見つかりませんでした。')
      setIsReady(false)
      setFormState(initialFormState)
      return
    }

    let cancelled = false

    const loadPlace = async () => {
      setIsLoading(true)
      setLoadError(null)
      setIsReady(false)
      setSubmitError(null)
      setErrors({})
      setDuplicatePlaceId(null)
      try {
        const payload = await fetchPlace(placeId)
        if (!cancelled) {
          setFormState(mapPlaceToFormState(payload))
          setIsReady(true)
        }
      } catch {
        if (!cancelled) {
          setLoadError(
            '編集対象を取得できませんでした。時間をおいて再度お試しください。'
          )
          setIsReady(false)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadPlace()

    return () => {
      cancelled = true
    }
  }, [placeId, reloadKey])

  const handleChange = (event: EditFormChangeEvent) => {
    const { name, value } = event.target
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }))
    setSubmitError(null)
    if (name === 'tabelog_url') {
      setDuplicatePlaceId(null)
    }
    setErrors((prev) => {
      const fieldName = name as keyof FormState
      if (!prev[fieldName]) {
        return prev
      }
      const next = { ...prev }
      delete next[fieldName]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (placeId === null) {
      setSubmitError('指定されたデータが見つかりませんでした。')
      return
    }

    const nextErrors = validateForm(formState)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setSubmitError(null)
    setDuplicatePlaceId(null)

    setIsSubmitting(true)
    try {
      const result = await updatePlace(placeId, formState)

      if (result.type === 'success') {
        onSuccess(result.place)
        return
      }

      if (result.type === 'duplicate') {
        const fieldErrors = mapApiErrors(result.errors)
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
        }
        setDuplicatePlaceId(result.existingPlaceId ?? null)
        setSubmitError('このURLはすでに登録されています。')
        return
      }

      if (result.type === 'validation') {
        const fieldErrors = mapApiErrors(result.errors)
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
        }
        setSubmitError('入力内容を確認してください。')
        return
      }

      if (result.type === 'not_found') {
        setSubmitError('指定されたデータが見つかりませんでした。')
        return
      }

      setSubmitError('更新に失敗しました。時間をおいて再度お試しください。')
    } catch {
      setSubmitError(
        '更新に失敗しました。通信状況を確認して再度お試しください。'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const reload = () => {
    if (isLoading) {
      return
    }
    setReloadKey((prev) => prev + 1)
  }

  return {
    formState,
    errors,
    isLoading,
    loadError,
    isSubmitting,
    submitError,
    duplicatePlaceId,
    isReady,
    handleChange,
    handleSubmit,
    reload,
  }
}
