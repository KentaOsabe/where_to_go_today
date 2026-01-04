import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchPlaces } from '../api/places'
import type { Pagination, Place } from '../types/place'

const formatVisitStatus = (value: Place['visit_status']) =>
  value === 'visited' ? '行った' : '行っていない'

const normalizeValue = (value: string | null) => {
  if (!value) {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const buildOptionalInfo = (place: Place) => {
  const note = normalizeValue(place.note)
  const notePreview =
    note && note.length > 60 ? `${note.slice(0, 60)}…` : note

  const entries = [
    { label: 'ジャンル', value: normalizeValue(place.genre) },
    { label: 'エリア', value: normalizeValue(place.area) },
    { label: '予算帯', value: normalizeValue(place.price_range) },
    { label: 'メモ', value: notePreview },
  ]

  return entries.filter(
    (entry): entry is { label: string; value: string } => Boolean(entry.value)
  )
}

const parsePageParam = (value: string | null) => {
  if (!value) {
    return 1
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return 1
  }
  const normalized = Math.floor(parsed)
  return normalized >= 1 ? normalized : 1
}

export const PlacesListScreen = () => {
  const [places, setPlaces] = useState<Place[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = parsePageParam(searchParams.get('page'))

  useEffect(() => {
    let cancelled = false

    const loadPlaces = async () => {
      setIsLoading(true)
      setLoadError(null)
      setPlaces([])
      setPagination(null)

      try {
        const payload = await fetchPlaces({ page: currentPage })
        if (cancelled) {
          return
        }
        setPlaces(payload.places)
        setPagination(payload.pagination)
      } catch {
        if (!cancelled) {
          setLoadError(
            '一覧を取得できませんでした。時間をおいて再度お試しください。'
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadPlaces()

    return () => {
      cancelled = true
    }
  }, [currentPage, reloadKey])

  const handleRetry = () => {
    if (isLoading) {
      return
    }
    setReloadKey((prev) => prev + 1)
  }

  const totalCount = pagination?.total_count ?? 0
  const hasPlaces = places.length > 0
  const hasAnyPlaces = totalCount > 0
  const showEmptyState =
    !isLoading && !loadError && pagination !== null && totalCount === 0
  const showOutOfRangeState =
    !isLoading && !loadError && pagination !== null && !hasPlaces && hasAnyPlaces
  const canGoPrev = currentPage > 1
  const canGoNext =
    pagination !== null && currentPage < pagination.total_pages

  const updatePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(nextPage))
    setSearchParams(params)
  }

  const handlePrevPage = () => {
    if (!canGoPrev) {
      return
    }
    updatePage(currentPage - 1)
  }

  const handleNextPage = () => {
    if (!canGoNext) {
      return
    }
    updatePage(currentPage + 1)
  }

  return (
    <main className="layout layout--detail">
      <section className="result-card" aria-live="polite">
        <div className="result-header">
          <div>
            <h2>登録済みのお店</h2>
            <p>候補を確認して今日の行き先を決めましょう。</p>
          </div>
          <Link className="ghost" to="/register">
            お店を登録する
          </Link>
        </div>
        {isLoading && (
          <p className="result-loading">一覧を読み込み中です。</p>
        )}
        {loadError && !isLoading && (
          <div className="form-alert form-alert--error" role="alert">
            <p>{loadError}</p>
            <button type="button" className="ghost" onClick={handleRetry}>
              再試行する
            </button>
          </div>
        )}
        {showEmptyState && (
          <div className="form-alert form-alert--warning">
            <p>まだ登録がありません。</p>
            <p>気になるお店を登録して一覧に追加しましょう。</p>
            <Link className="ghost" to="/register">
              お店を登録する
            </Link>
          </div>
        )}
        {showOutOfRangeState && (
          <div className="form-alert form-alert--warning">
            <p>このページにはお店がありません。</p>
            <p>前へボタンで前のページに戻ってください。</p>
          </div>
        )}
        {!isLoading && !loadError && hasAnyPlaces && (
          <>
            <p className="result-loading">
              現在 {totalCount} 件のお店があります。
            </p>
            <ul className="places-list">
              {places.map((place) => {
                const optionalInfo = buildOptionalInfo(place)

                return (
                  <li key={place.id} className="places-list__item">
                    <div className="places-list__header">
                      <Link
                        className="places-list__name"
                        to={`/places/${place.id}`}
                      >
                        {place.name}
                      </Link>
                      <span className="status-pill places-list__status">
                        {formatVisitStatus(place.visit_status)}
                      </span>
                    </div>
                    <a
                      className="places-list__url"
                      href={place.tabelog_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {place.tabelog_url}
                    </a>
                    {optionalInfo.length > 0 && (
                      <dl className="places-list__meta">
                        {optionalInfo.map((info) => (
                          <div key={info.label}>
                            <dt>{info.label}</dt>
                            <dd>{info.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </li>
                )
              })}
            </ul>
            {pagination && (
              <nav className="pagination" aria-label="ページ移動">
                <button
                  type="button"
                  className="ghost"
                  onClick={handlePrevPage}
                  disabled={!canGoPrev}
                >
                  前へ
                </button>
                <span className="pagination__status">
                  {pagination.page} / {pagination.total_pages}
                </span>
                <button
                  type="button"
                  className="ghost"
                  onClick={handleNextPage}
                  disabled={!canGoNext}
                >
                  次へ
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  )
}
