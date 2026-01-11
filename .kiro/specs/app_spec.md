# where_to_go_today 全体仕様（現状）

## 目的と前提
- 自分用の「今日行く店」を迷わず決めるための支援ツール。
- 候補店の登録・一覧化、条件に応じた提案までを実装済み。
- 決定はユーザが行う（アプリは提案まで）。
- 認証は無し、単一ユーザ前提。

## 画面構成（ルーティング）
- `/` -> `/places` にリダイレクト
- `/places` : 店舗一覧
- `/register` : 店舗登録
- `/places/:id` : 店舗詳細
- `/places/:id/edit` : 店舗編集
- `/decide` : 今日の提案

## データモデル
### Place
- 必須: `name`, `tabelog_url`, `visit_status`
- 任意: `genre`, `area`, `price_range`, `visit_reason`, `note`, `revisit_intent`
- システム: `id`, `created_at`, `updated_at`
- 制約
  - `visit_status`: `visited` / `not_visited`
  - `revisit_intent`: `yes` / `no` / `unknown`（現在UI未入力）
  - `tabelog_url` は `tabelog.com` ドメインのみ
  - `tabelog_url` は一意（重複時は 409 を返す）
  - `tabelog_url` は保存時に正規化（https化、クエリ削除、末尾スラッシュ削除、ホスト小文字化）

### Recommendation
- `place`（Place）
- `reason`（提案理由の短文）

### RecommendationConditions
- `condition_text`（自由記述の条件）

## 画面仕様

### 店舗一覧（`/places`）
#### フロントエンド
- 初期表示で一覧取得、ページングはクエリ `?page=` を利用。
- 状態
  - 読み込み中: ローディング文言
  - 取得失敗: 再試行ボタンを表示
  - 0件: 空状態メッセージと登録導線
  - ページ範囲外: 「前へ」誘導
- 表示内容
  - 店名・来店ステータス・食べログURL
  - 追加情報（存在するもののみ表示）: ジャンル/エリア/予算帯/メモ（60文字で省略）
- 操作
  - 店名クリックで詳細へ
  - 「今日どこ行く？」（提案画面）、登録画面への導線
  - 前へ/次へでページ移動

#### バックエンド
- `GET /api/places`
  - クエリ: `page`（1以上）、`per`（1〜20、デフォルト20）
  - 取得順: `created_at` の降順
  - レスポンス
    - `places`: Place 配列
    - `pagination`: `{ page, per, total_count, total_pages }`

---

### 店舗登録（`/register`）
#### フロントエンド
- 主要UI: Hero + フォーム（`PlaceForm` を使用）
- 入力項目
  - 必須: 店名、食べログURL、来店ステータス
  - 任意: ジャンル、エリア、予算帯、行った理由、メモ
- バリデーション
  - 必須項目の空チェック
  - 食べログURLのドメインチェック（`tabelog.com`）
- 状態
  - 送信中: 送信ボタン無効化
  - バリデーションエラー: フィールド下に表示
  - 重複: 「登録済みデータを確認」ボタンを表示
- 成功時: `/places` に遷移
- 入力内容は送信後も保持

#### バックエンド
- `POST /api/places`
  - 許可パラメータ: `name`, `tabelog_url`, `visit_status`, `genre`, `area`, `price_range`, `note`, `visit_reason`, `revisit_intent`
  - 成功: `201` + Place
  - バリデーション: `422` + `{ errors: { field: [message] } }`
  - URL重複: `409` + `{ errors: { tabelog_url: [...] }, existing_place_id }`

---

### 店舗詳細（`/places/:id`）
#### フロントエンド
- 初期表示で詳細取得
- 状態
  - 読み込み中: ローディング
  - 取得失敗/存在しない: エラーメッセージ
- 表示内容
  - 店名/URL/来店ステータス
  - 追加情報（存在するもののみ）: ジャンル、エリア、予算帯、メモ
  - 登録日時（ローカライズ表示）
- 操作
  - 一覧へ戻る
  - 編集へ遷移
  - 削除: 確認ダイアログ -> 削除

#### バックエンド
- `GET /api/places/:id`
  - 成功: `200` + Place
  - 存在しない: `404` + `{ error: "not_found" }`
- `DELETE /api/places/:id`
  - 成功: `204`
  - 存在しない: `404` + `{ error: "not_found" }`

---

### 店舗編集（`/places/:id/edit`）
#### フロントエンド
- 初期表示で詳細取得し、フォームに初期値を反映
- フォーム構成は登録と同一
- 状態
  - 読み込み中/取得失敗の表示
  - 更新中: 送信ボタン無効化
- 成功時: 詳細画面へ遷移

#### バックエンド
- `PATCH /api/places/:id`
  - 成功: `200` + Place
  - バリデーション: `422`
  - URL重複: `409` + `{ errors: { tabelog_url: [...] }, existing_place_id }`
  - 存在しない: `404` + `{ error: "not_found" }`

---

### 今日の提案（`/decide`）
#### フロントエンド
- 条件入力（自由記述）は必須
- 状態
  - 読み込み中: 「提案を作成中」
  - 失敗: 再試行ボタン
  - 0件: 条件見直しのメッセージ
- 表示
  - 最大5件の提案
  - 各提案に「理由」を表示
  - 店名クリックで詳細へ

#### バックエンド
- `POST /api/recommendations`
  - 入力: `condition_text`
  - 空の場合: `422` + `{ error: "condition_text_required" }`
  - 成功: `200` + `{ condition_text, recommendations: [{ place, reason }] }`
  - 失敗: `500` + `{ error: "recommendation_failed" }`
- ロジック
  - 候補: 全店舗（`updated_at` 降順）
  - OpenAI API を使って最大5件を選び、理由を生成
  - 条件に完全一致不要／未訪問を1〜2件含める制約あり

## 補足（現状の制約/未対応）
- `revisit_intent` はDB/APIにあるがフロントUIからは入力不可
- ルールベースの `RecommendationService` は実装済みだが、現行フローでは未使用
- 決定履歴の保存は未実装
