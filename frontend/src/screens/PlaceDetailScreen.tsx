import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPlace } from '../api/places'
import { PlaceResult } from '../components/PlaceResult'
import type { Place } from '../types/place'

type PlaceDetailScreenProps = {
  onBackToForm: () => void
}

export const PlaceDetailScreen = ({ onBackToForm }: PlaceDetailScreenProps) => {
  const { id } = useParams()
  const parsedId = Number(id)
  const placeId = Number.isFinite(parsedId) ? parsedId : null
  const [activePlace, setActivePlace] = useState<Place | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (placeId === null) {
      setActivePlace(null)
      setIsLoading(false)
      setLoadError('指定されたデータが見つかりませんでした。')
      return
    }

    let cancelled = false

    const loadPlace = async () => {
      setIsLoading(true)
      setLoadError(null)
      setActivePlace(null)
      try {
        const payload = await fetchPlace(placeId)
        if (!cancelled) {
          setActivePlace(payload)
        }
      } catch {
        if (!cancelled) {
          setActivePlace(null)
          setLoadError(
            '登録結果を取得できませんでした。時間をおいて再度お試しください。'
          )
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
  }, [placeId])

  return (
    <main className="layout layout--detail">
      <PlaceResult
        activePlace={activePlace}
        isLoading={isLoading}
        error={loadError}
        onBackToForm={onBackToForm}
      />
    </main>
  )
}
