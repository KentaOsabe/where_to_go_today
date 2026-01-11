import { Link } from 'react-router-dom'

export const HeroSection = () => (
  <section className="hero">
    <div className="hero-actions">
      <div className="hero-tag">Register Place</div>
      <Link className="ghost" to="/places">
        店舗一覧へ
      </Link>
    </div>
    <h1>今日の候補を、最小入力で。</h1>
    <p>店名・食べログURL・来店ステータスだけで登録できます。追加情報は後回しでOK。</p>
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
)
