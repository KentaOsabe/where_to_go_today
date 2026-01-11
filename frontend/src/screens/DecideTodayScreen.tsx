import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { recommendPlaces } from '../api/recommendations'
import type { Place, Recommendation, RecommendationConditions } from '../types/place'

type ConditionFormState = {
  condition_text: string
}

const initialFormState: ConditionFormState = {
  condition_text: '',
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

const buildConditions = (conditionText: string): RecommendationConditions => ({
  condition_text: conditionText,
})

export const DecideTodayScreen = () => {
  const [formState, setFormState] = useState<ConditionFormState>(initialFormState)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [hasResult, setHasResult] = useState(false)

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    if (!(name in formState)) {
      return
    }
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (validationError && value.trim().length > 0) {
      setValidationError(null)
    }
  }

  const runRecommendation = async (conditionText: string) => {
    setIsLoading(true)
    setLoadError(null)
    setHasResult(false)
    setRecommendations([])

    try {
      const result = await recommendPlaces(buildConditions(conditionText))
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
    const trimmedCondition = formState.condition_text.trim()
    if (trimmedCondition.length === 0) {
      setValidationError('条件を入力してください。')
      return
    }
    setValidationError(null)
    setFormState((prev) => ({
      ...prev,
      condition_text: trimmedCondition,
    }))
    runRecommendation(trimmedCondition)
  }

  const handleRetry = () => {
    if (isLoading) {
      return
    }
    const trimmedCondition = formState.condition_text.trim()
    if (trimmedCondition.length === 0) {
      setValidationError('条件を入力してください。')
      return
    }
    setValidationError(null)
    runRecommendation(trimmedCondition)
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
                <p>入力は必須です。今日の条件を自由記述で入力してください。</p>
              </div>
              <span className="section-badge">必須</span>
            </div>

            <label
              className={`field${validationError ? ' field--error' : ''}`}
            >
              <span>条件</span>
              <textarea
                name="condition_text"
                placeholder="例: 今日は軽めで、駅近。静かな雰囲気。"
                value={formState.condition_text}
                onChange={handleChange}
                rows={4}
              />
            </label>

            {validationError && (
              <p className="field-error" role="alert">
                {validationError}
              </p>
            )}
          </div>

          <div className="actions">
            <div>
              <p className="action-hint">
                条件は必須です。具体的に書くほど提案しやすくなります。
              </p>
              <p className="action-sub">Enter で提案を実行できます。</p>
            </div>
            <div className="result-actions">
              <Link className="ghost" to="/places">
                店舗一覧へ
              </Link>
              <button className="primary" type="submit" disabled={isLoading}>
                提案する
              </button>
            </div>
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
            <p>条件を具体的にすると提案しやすくなります。</p>
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
