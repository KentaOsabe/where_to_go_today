import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deletePlace, fetchPlace } from '../api/places'
import { PlaceResult } from '../components/PlaceResult'
import type { Place } from '../types/place'

export const PlaceDetailScreen = () => {
  const { id } = useParams()
  const parsedId = Number(id)
  const placeId = Number.isFinite(parsedId) ? parsedId : null
  const navigate = useNavigate()
  const [activePlace, setActivePlace] = useState<Place | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
            '店舗詳細を取得できませんでした。時間をおいて再度お試しください。'
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

  const handleEdit = () => {
    if (placeId === null) {
      return
    }
    navigate(`/places/${placeId}/edit`)
  }

  const handleDelete = () => {
    setIsDeleteDialogOpen(true)
    setDeleteError(null)
  }

  const handleCloseDeleteDialog = () => {
    if (isDeleting) {
      return
    }
    setIsDeleteDialogOpen(false)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (placeId === null) {
      setDeleteError('指定されたデータが見つかりませんでした。')
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const result = await deletePlace(placeId)
      if (result.type === 'success') {
        navigate('/places')
        return
      }
      if (result.type === 'not_found') {
        setDeleteError('削除対象が見つかりませんでした。')
        return
      }
      setDeleteError('削除に失敗しました。時間をおいて再度お試しください。')
    } catch {
      setDeleteError('削除に失敗しました。通信状況を確認して再度お試しください。')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="layout layout--detail">
      {isDeleteDialogOpen && (
        <div className="dialog-backdrop" role="presentation">
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <h3 id="delete-dialog-title">このお店を削除しますか？</h3>
            <p id="delete-dialog-description">
              削除すると元に戻せません。よろしいですか？
            </p>
            {deleteError && (
              <p className="form-alert form-alert--error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="ghost"
                onClick={handleCloseDeleteDialog}
                disabled={isDeleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {deleteError ? '再試行する' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
      <PlaceResult
        activePlace={activePlace}
        isLoading={isLoading}
        error={loadError}
        actions={
          <>
            <Link className="ghost" to="/places">
              店舗一覧へ
            </Link>
            {placeId !== null && (
              <>
                <button
                  type="button"
                  className="ghost"
                  onClick={handleEdit}
                  disabled={!activePlace || isLoading || isDeleting}
                >
                  編集
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={handleDelete}
                  disabled={!activePlace || isLoading || isDeleting}
                >
                  削除
                </button>
              </>
            )}
          </>
        }
      />
    </main>
  )
}
