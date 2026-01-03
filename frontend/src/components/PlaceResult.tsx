import type { Place, VisitStatus } from '../types/place'

type PlaceResultProps = {
  activePlace: Place | null
  isLoading: boolean
  error: string | null
  onBackToForm: () => void
}

const formatVisitStatus = (value: VisitStatus) =>
  value === 'visited' ? '行った' : '行っていない'

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export const PlaceResult = ({
  activePlace,
  isLoading,
  error,
  onBackToForm,
}: PlaceResultProps) => (
  <section className="result-card" aria-live="polite">
    <div className="result-header">
      <div>
        <h2>登録結果</h2>
        <p>保存された内容を確認できます。</p>
      </div>
      <button type="button" className="ghost" onClick={onBackToForm}>
        新しく登録する
      </button>
    </div>
    {isLoading && <p className="result-loading">登録結果を読み込み中です。</p>}
    {error && !isLoading && (
      <p className="form-alert form-alert--error" role="alert">
        {error}
      </p>
    )}
    {activePlace && !isLoading && !error && (
      <>
        <dl className="result-list">
          <div>
            <dt>店名</dt>
            <dd>{activePlace.name}</dd>
          </div>
          <div>
            <dt>食べログURL</dt>
            <dd>
              <a href={activePlace.tabelog_url} target="_blank" rel="noreferrer">
                {activePlace.tabelog_url}
              </a>
            </dd>
          </div>
          <div>
            <dt>来店ステータス</dt>
            <dd className="status-pill">
              {formatVisitStatus(activePlace.visit_status)}
            </dd>
          </div>
          {activePlace.genre && (
            <div>
              <dt>ジャンル</dt>
              <dd>{activePlace.genre}</dd>
            </div>
          )}
          {activePlace.area && (
            <div>
              <dt>エリア</dt>
              <dd>{activePlace.area}</dd>
            </div>
          )}
          {activePlace.price_range && (
            <div>
              <dt>予算帯</dt>
              <dd>{activePlace.price_range}</dd>
            </div>
          )}
          {activePlace.note && (
            <div>
              <dt>メモ</dt>
              <dd>{activePlace.note}</dd>
            </div>
          )}
        </dl>
        <p className="result-meta">
          登録日時: {formatDateTime(activePlace.created_at)}
        </p>
      </>
    )}
  </section>
)
