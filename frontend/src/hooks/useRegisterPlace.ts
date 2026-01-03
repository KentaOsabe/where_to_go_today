import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { createPlace } from '../api/places'
import { validateForm } from '../lib/validation'
import type { ApiErrorResponse, FormErrors, FormState, Place } from '../types/place'
import { initialFormState } from '../types/place'

type UseRegisterPlaceOptions = {
  onSuccess: (place: Place) => void
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

export const useRegisterPlace = ({ onSuccess }: UseRegisterPlaceOptions) => {
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [duplicatePlaceId, setDuplicatePlaceId] = useState<number | null>(null)

  const handleChange = (
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | ChangeEvent<HTMLSelectElement>
  ) => {
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
      const result = await createPlace(formState)

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

      setSubmitError('登録に失敗しました。時間をおいて再度お試しください。')
    } catch {
      setSubmitError(
        '登録に失敗しました。通信状況を確認して再度お試しください。'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetFeedback = () => {
    setErrors({})
    setSubmitError(null)
    setDuplicatePlaceId(null)
  }

  return {
    formState,
    errors,
    isSubmitting,
    submitError,
    duplicatePlaceId,
    handleChange,
    handleSubmit,
    resetFeedback,
  }
}
