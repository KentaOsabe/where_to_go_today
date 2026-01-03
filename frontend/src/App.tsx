import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import './App.css'

type FormState = {
  name: string
  tabelog_url: string
  visit_status: 'not_visited' | 'visited'
  genre: string
  area: string
  price_range: string
  note: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const initialState: FormState = {
  name: '',
  tabelog_url: '',
  visit_status: 'not_visited',
  genre: '',
  area: '',
  price_range: '',
  note: '',
}

function App() {
  const [formState, setFormState] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<FormErrors>({})

  const isTabelogUrl = (value: string) => {
    try {
      const url = new URL(value)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false
      }
      const host = url.hostname.toLowerCase()
      return host === 'tabelog.com' || host.endsWith('.tabelog.com')
    } catch {
      return false
    }
  }

  const validateForm = (state: FormState) => {
    const nextErrors: FormErrors = {}
    if (!state.name.trim()) {
      nextErrors.name = '店名を入力してください'
    }
    const tabelogUrl = state.tabelog_url.trim()
    if (!tabelogUrl) {
      nextErrors.tabelog_url = '食べログURLを入力してください'
    } else if (!isTabelogUrl(tabelogUrl)) {
      nextErrors.tabelog_url = 'tabelog.com ドメインのURLを入力してください'
    }
    if (!state.visit_status) {
      nextErrors.visit_status = '来店ステータスを選択してください'
    }
    return nextErrors
  }

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateForm(formState)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    setErrors({})
  }

  return (
    <div className="app">
      <main className="layout">
        <section className="hero">
          <div className="hero-tag">Register Place</div>
          <h1>今日の候補を、最小入力で。</h1>
          <p>
            店名・食べログURL・来店ステータスだけで登録できます。追加情報は後回しでOK。
          </p>
          <div className="hero-panel">
            <div>
              <h2>入力の流れ</h2>
              <ol>
                <li>必須3項目を入力</li>
                <li>必要なら追加情報を開く</li>
                <li>
                  <span className="kbd">Enter</span> で登録
                </li>
              </ol>
            </div>
            <div className="hero-note">
              <strong>ヒント</strong>
              <p>タブ移動だけで完結します。入力途中でも内容は保持されます。</p>
            </div>
          </div>
        </section>

        <section className="form-card">
          <form onSubmit={handleSubmit} className="form" noValidate>
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
                    onChange={handleChange}
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
                    onChange={handleChange}
                    required
                    aria-invalid={Boolean(errors.tabelog_url)}
                    aria-describedby={
                      errors.tabelog_url ? 'tabelog-url-error' : undefined
                    }
                  />
                  {errors.tabelog_url && (
                    <small
                      id="tabelog-url-error"
                      className="field-error"
                      role="alert"
                    >
                      {errors.tabelog_url}
                    </small>
                  )}
                  <small className="field-note">
                    tabelog.com ドメインのみ登録できます
                  </small>
                </label>

                <label
                  className={`field ${errors.visit_status ? 'field--error' : ''}`}
                >
                  <span>来店ステータス</span>
                  <select
                    name="visit_status"
                    value={formState.visit_status}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.visit_status)}
                    aria-describedby={
                      errors.visit_status ? 'visit-status-error' : undefined
                    }
                  >
                    <option value="not_visited">行っていない</option>
                    <option value="visited">行った</option>
                  </select>
                  {errors.visit_status && (
                    <small
                      id="visit-status-error"
                      className="field-error"
                      role="alert"
                    >
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

                <label className="field field--full">
                  <span>メモ</span>
                  <textarea
                    name="note"
                    placeholder="例: ひとりでも入りやすそう"
                    value={formState.note}
                    onChange={handleChange}
                    rows={4}
                  />
                </label>
              </div>
            </details>

            <div className="actions">
              <div>
                <p className="action-hint">
                  入力内容は送信後も保持されます。
                </p>
                <p className="action-sub">
                  Enter で登録、Shift + Tab で戻れます。
                </p>
              </div>
              <button className="primary" type="submit">
                登録する
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default App
