import type { ChangeEvent, FormEvent } from 'react'
import type { FormErrors, FormState } from '../types/place'

type PlaceFormProps = {
  formState: FormState
  errors: FormErrors
  isSubmitting: boolean
  submitError: string | null
  duplicatePlaceId: number | null
  onChange: (
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | ChangeEvent<HTMLSelectElement>
  ) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onNavigateToDuplicate: (placeId: number) => void
}

export const PlaceForm = ({
  formState,
  errors,
  isSubmitting,
  submitError,
  duplicatePlaceId,
  onChange,
  onSubmit,
  onNavigateToDuplicate,
}: PlaceFormProps) => (
  <section className="form-card">
    <form onSubmit={onSubmit} className="form" noValidate aria-busy={isSubmitting}>
      <div className="section">
        <div className="section-header">
          <div>
            <h2>必須項目</h2>
            <p>この3つだけで登録できます。</p>
          </div>
          <span className="section-badge">必須</span>
        </div>

        <div className="field-grid">
          <label className={`field ${errors.name ? 'field--error' : ''}`}>
            <span>店名</span>
            <input
              name="name"
              type="text"
              autoComplete="organization"
              placeholder="例: そば処 いちまる"
              value={formState.name}
              onChange={onChange}
              required
              autoFocus
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <small id="name-error" className="field-error" role="alert">
                {errors.name}
              </small>
            )}
          </label>

          <label
            className={`field field--wide ${
              errors.tabelog_url ? 'field--error' : ''
            }`}
          >
            <span>食べログURL</span>
            <input
              name="tabelog_url"
              type="url"
              placeholder="https://tabelog.com/tokyo/..."
              value={formState.tabelog_url}
              onChange={onChange}
              required
              aria-invalid={Boolean(errors.tabelog_url)}
              aria-describedby={
                errors.tabelog_url ? 'tabelog-url-error' : undefined
              }
            />
            {errors.tabelog_url && (
              <small id="tabelog-url-error" className="field-error" role="alert">
                {errors.tabelog_url}
              </small>
            )}
            <small className="field-note">tabelog.com ドメインのみ登録できます</small>
          </label>

          <label className={`field ${errors.visit_status ? 'field--error' : ''}`}>
            <span>来店ステータス</span>
            <select
              name="visit_status"
              value={formState.visit_status}
              onChange={onChange}
              aria-invalid={Boolean(errors.visit_status)}
              aria-describedby={
                errors.visit_status ? 'visit-status-error' : undefined
              }
            >
              <option value="not_visited">行っていない</option>
              <option value="visited">行った</option>
            </select>
            {errors.visit_status && (
              <small id="visit-status-error" className="field-error" role="alert">
                {errors.visit_status}
              </small>
            )}
          </label>
        </div>
      </div>

      <details className="optional">
        <summary>
          追加情報（任意）
          <span>後からでもOK</span>
        </summary>
        <div className="field-grid">
          <label className="field">
            <span>ジャンル</span>
            <input
              name="genre"
              type="text"
              placeholder="例: 和食、カフェ"
              value={formState.genre}
              onChange={onChange}
            />
          </label>

          <label className="field">
            <span>エリア</span>
            <input
              name="area"
              type="text"
              placeholder="例: 渋谷、三軒茶屋"
              value={formState.area}
              onChange={onChange}
            />
          </label>

          <label className="field">
            <span>予算帯</span>
            <input
              name="price_range"
              type="text"
              placeholder="例: 3000-5000"
              value={formState.price_range}
              onChange={onChange}
            />
          </label>

          <label className="field field--full">
            <span>メモ</span>
            <textarea
              name="note"
              placeholder="例: ひとりでも入りやすそう"
              value={formState.note}
              onChange={onChange}
              rows={4}
            />
          </label>
        </div>
      </details>

      <div className="actions">
        <div>
          <p className="action-hint">入力内容は送信後も保持されます。</p>
          <p className="action-sub">Enter で登録、Shift + Tab で戻れます。</p>
          {submitError && (
            <p className="form-alert form-alert--error" role="alert">
              {submitError}
            </p>
          )}
          {duplicatePlaceId && (
            <div className="form-alert form-alert--warning" role="alert">
              <p>すでに登録されたURLです。</p>
              <button
                type="button"
                className="link-button"
                onClick={() => onNavigateToDuplicate(duplicatePlaceId)}
              >
                登録済みデータを確認する
              </button>
            </div>
          )}
        </div>
        <button className="primary" type="submit" disabled={isSubmitting}>
          登録する
        </button>
      </div>
    </form>
  </section>
)
