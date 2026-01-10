import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { recommendPlaces } from '../api/recommendations'
import type { Place, Recommendation, RecommendationConditions } from '../types/place'

type ConditionFormState = {
  genre: string
  area: string
  price_range: string
}

const initialFormState: ConditionFormState = {
  genre: '',
  area: '',
  price_range: '',
}

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
  const entries = [
    { label: 'ジャンル', value: normalizeValue(place.genre) },
    { label: 'エリア', value: normalizeValue(place.area) },
    { label: '予算帯', value: normalizeValue(place.price_range) },
  ]

  return entries.filter(
    (entry): entry is { label: string; value: string } => Boolean(entry.value)
  )
}

const normalizeCondition = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const buildConditions = (
  formState: ConditionFormState
): RecommendationConditions => ({
  genre: normalizeCondition(formState.genre),
  area: normalizeCondition(formState.area),
  price_range: normalizeCondition(formState.price_range),
})

export const DecideTodayScreen = () => {
  const [formState, setFormState] = useState<ConditionFormState>(initialFormState)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [hasResult, setHasResult] = useState(false)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    if (!(name in formState)) {
      return
    }
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const runRecommendation = async () => {
    setIsLoading(true)
    setLoadError(null)
    setHasResult(false)
    setRecommendations([])

    try {
      const result = await recommendPlaces(buildConditions(formState))
      if (result.type === 'success') {
        setRecommendations(result.recommendations)
        setHasResult(true)
        return
      }
      setLoadError('提案に失敗しました。再試行してください。')
    } catch {
      setLoadError('提案に失敗しました。再試行してください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) {
      return
    }
    runRecommendation()
  }

  const handleRetry = () => {
    if (isLoading) {
      return
    }
    runRecommendation()
  }

  const showEmptyState = hasResult && recommendations.length === 0
  const showCountMessage =
    hasResult && recommendations.length > 0 && recommendations.length < 5

  return (
    <main className="layout">
      <section className="form-card">
        <form
          className="form"
          onSubmit={handleSubmit}
          noValidate
          aria-busy={isLoading}
        >
          <div className="section">
            <div className="section-header">
              <div>
                <h2>今日の条件</h2>
                <p>入力は任意です。空のままでも提案できます。</p>
              </div>
              <span className="section-badge">任意</span>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>ジャンル</span>
                <input
                  name="genre"
                  type="text"
                  placeholder="例: 和食、カフェ"
                  value={formState.genre}
                  onChange={handleChange}
                />
              </label>
              <label className="field">
                <span>エリア</span>
                <input
                  name="area"
                  type="text"
                  placeholder="例: 渋谷、三軒茶屋"
                  value={formState.area}
                  onChange={handleChange}
                />
              </label>
              <label className="field">
                <span>予算帯</span>
                <input
                  name="price_range"
                  type="text"
                  placeholder="例: 3000-5000"
                  value={formState.price_range}
                  onChange={handleChange}
                />
              </label>
            </div>
          </div>

          <div className="actions">
            <div>
              <p className="action-hint">条件は提案の優先度付けに使われます。</p>
              <p className="action-sub">Enter で提案を実行できます。</p>
            </div>
            <button className="primary" type="submit" disabled={isLoading}>
              提案する
            </button>
          </div>
        </form>
      </section>

      <section className="result-card" aria-live="polite">
        <div className="result-header">
          <div>
            <h2>今日の提案</h2>
            <p>登録済みのお店から最大5件を提案します。</p>
          </div>
        </div>

        {isLoading && <p className="result-loading">提案を作成中です。</p>}

        {loadError && !isLoading && (
          <div className="form-alert form-alert--error" role="alert">
            <p>{loadError}</p>
            <button type="button" className="ghost" onClick={handleRetry}>
              再試行する
            </button>
          </div>
        )}

        {showCountMessage && (
          <p className="result-meta">
            現在 {recommendations.length} 件を提案しています。
          </p>
        )}

        {showEmptyState && (
          <div className="form-alert form-alert--warning">
            <p>条件を変えて試してください。</p>
            <p>入力なしでも提案できます。</p>
          </div>
        )}

        {hasResult && recommendations.length > 0 && (
          <ul className="places-list">
            {recommendations.map((item) => {
              const optionalInfo = buildOptionalInfo(item.place)

              return (
                <li key={item.place.id} className="places-list__item">
                  <div className="places-list__header">
                    <Link
                      className="places-list__name"
                      to={`/places/${item.place.id}`}
                    >
                      {item.place.name}
                    </Link>
                    <span className="status-pill places-list__status">
                      {formatVisitStatus(item.place.visit_status)}
                    </span>
                  </div>
                  <a
                    className="places-list__url"
                    href={item.place.tabelog_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.place.tabelog_url}
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
                  <p className="result-meta">{item.reason}</p>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
