# ギャップ検証（validate-gap）

## 対象
- 仕様: `.kiro/specs/edit_place/requirements.md`
- 既存実装: backend / frontend 現状

## 結論
- 編集・削除機能は現状未実装のため、要件に対して大きなギャップがある。
- 既存の Place モデルと一覧/詳細表示は再利用可能で、更新・削除 API と UI 追加が主な差分になる。

## 既存実装の確認
### バックエンド
- `Place` モデルは編集時にも使えるバリデーションを保持
  - `name` / `tabelog_url` / `visit_status` の必須
  - `tabelog_url` の正規化とドメインチェック
  - `tabelog_url` の一意制約（DB とモデル）
- `Api::PlacesController` は `index` / `show` / `create` のみ
- ルーティングは `GET /api/places`, `GET /api/places/:id`, `POST /api/places` のみ

### フロントエンド
- 一覧 (`/places`) と詳細 (`/places/:id`) は実装済み
- 登録フォーム (`PlaceForm`) と登録フロー (`useRegisterPlace`) は実装済み
- 編集・削除の UI/操作導線、API クライアントは未実装

## ギャップ
### 機能要件
- 編集 API (`PATCH/PUT /api/places/:id`) が未実装
- 削除 API (`DELETE /api/places/:id`) が未実装
- 編集 UI（既存値の初期表示・保存）が未実装
- 削除 UI（確認ステップ、削除後の遷移）が未実装
- 失敗時のエラーハンドリングと再試行導線が未実装

### バリデーション/エラー
- 更新時の重複 URL エラーの扱い（既存と同一の URL を許可しつつ他レコードは拒否する）
- 削除対象が存在しない場合のエラー表示

### 体験/遷移
- 詳細/一覧から編集・削除へ到達する導線が未整備
- 編集完了後に結果確認できる遷移が未整備

## 既存資産の再利用候補
- バリデーション: `backend/app/models/place.rb`
- URL 正規化/一意制約: 既存モデル/DB 制約
- フォーム UI: `frontend/src/components/PlaceForm.tsx` を編集用に再利用可能
- 詳細表示: `frontend/src/components/PlaceResult.tsx`

## 次のアクション
- edit_place の設計で以下を定義
  - 更新/削除 API の I/F とエラーレスポンス
  - 編集/削除 UI の画面構成・遷移
  - 既存フォームの再利用方針と差分（初期値・ボタン文言など）
