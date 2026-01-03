import { useEffect, useState } from 'react'
import './App.css'
import { fetchPlace } from './api/places'
import { HeroSection } from './components/HeroSection'
import { PlaceForm } from './components/PlaceForm'
import { PlaceResult } from './components/PlaceResult'
import { useRegisterPlace } from './hooks/useRegisterPlace'
import type { Place } from './types/place'

const getPlaceIdFromPath = (path: string) => {
  const match = path.match(/^\/places\/(\d+)$/)
  if (!match) {
    return null
  }
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

function App() {
  const [activePlace, setActivePlace] = useState<Place | null>(null)
  const [routePlaceId, setRoutePlaceId] = useState<number | null>(() =>
    getPlaceIdFromPath(window.location.pathname)
  )
  const [isLoadingPlace, setIsLoadingPlace] = useState(false)
  const [placeLoadError, setPlaceLoadError] = useState<string | null>(null)

  const navigateToPlace = (placeId: number) => {
    window.history.pushState(null, '', `/places/${placeId}`)
    setRoutePlaceId(placeId)
  }

  const navigateToForm = () => {
    window.history.pushState(null, '', '/')
    setRoutePlaceId(null)
  }

  const {
    formState,
    errors,
    isSubmitting,
    submitError,
    duplicatePlaceId,
    handleChange,
    handleSubmit,
  } = useRegisterPlace({
    onSuccess: (place) => {
      setActivePlace(place)
      navigateToPlace(place.id)
    },
  })

  useEffect(() => {
    const handlePopState = () => {
      setRoutePlaceId(getPlaceIdFromPath(window.location.pathname))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (routePlaceId === null) {
      setActivePlace(null)
      setPlaceLoadError(null)
      return
    }
    if (activePlace?.id === routePlaceId) {
      setPlaceLoadError(null)
      return
    }

    let cancelled = false
    const loadPlace = async () => {
      setIsLoadingPlace(true)
      setPlaceLoadError(null)
      try {
        const payload = await fetchPlace(routePlaceId)
        if (!cancelled) {
          setActivePlace(payload)
        }
      } catch {
        if (!cancelled) {
          setActivePlace(null)
          setPlaceLoadError(
            '登録結果を取得できませんでした。時間をおいて再度お試しください。'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPlace(false)
        }
      }
    }

    loadPlace()

    return () => {
      cancelled = true
    }
  }, [routePlaceId, activePlace])

  return (
    <div className="app">
      <main className="layout">
        <HeroSection />
        <PlaceForm
          formState={formState}
          errors={errors}
          isSubmitting={isSubmitting}
          submitError={submitError}
          duplicatePlaceId={duplicatePlaceId}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onNavigateToDuplicate={navigateToPlace}
        />
        {(routePlaceId !== null || activePlace) && (
          <PlaceResult
            activePlace={activePlace}
            isLoading={isLoadingPlace}
            error={placeLoadError}
            onBackToForm={navigateToForm}
          />
        )}
      </main>
    </div>
  )
}

export default App
