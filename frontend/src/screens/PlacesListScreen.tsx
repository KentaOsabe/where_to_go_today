import { Link } from 'react-router-dom'

export const PlacesListScreen = () => (
  <main className="layout layout--detail">
    <section className="result-card">
      <div className="result-header">
        <div>
          <h2>登録済みのお店</h2>
          <p>一覧画面は準備中です。</p>
        </div>
        <Link className="ghost" to="/register">
          お店を登録する
        </Link>
      </div>
      <p className="result-loading">
        現在は登録フォームから新しいお店を追加できます。
      </p>
    </section>
  </main>
)
