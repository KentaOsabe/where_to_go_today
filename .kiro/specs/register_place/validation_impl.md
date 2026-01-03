# 実装レビュー（validate-impl）

## 対象
- Task 1.1: places の永続化と制約を整える
- Task 1.2: 入力バリデーションとURL正規化を実装する
- Task 1.3: 登録APIの応答とエラーハンドリングを整備する

## 結論
- Task 1.1 は完了済み。Task 1.2 も要件/設計どおりに実装されており、完了と判断できる。
- Task 1.3 も要件/設計どおりに実装されており、完了と判断できる。

## 実装確認
- スキーマ: `backend/db/migrate/20260103090000_create_places.rb`
  - 必須カラム: `name`, `tabelog_url`, `visit_status`（`null: false`）
  - 任意カラム: `genre`, `area`, `price_range`, `note`
  - 監査カラム: `created_at`, `updated_at`
- 一意制約: `tabelog_url` にユニークインデックス
- 許可値制約: `visit_status` に `visited` / `not_visited` のチェック制約
- モデル: `backend/app/models/place.rb`
  - 必須バリデーション: `name`, `tabelog_url`, `visit_status`
  - 訪問ステータスの許可値: `visited` / `not_visited`
  - `tabelog_url` の一意性バリデーション（正規化後に判定）
  - `tabelog.com` ドメインのみ許可（http/https のみ受付）
  - 正規化: 前後空白除去、クエリ削除、末尾スラッシュ除去、https 統一
- テスト: `backend/spec/models/place_spec.rb`
  - 必須項目、ドメイン制約、URL正規化、重複検知を RSpec で検証
- ルーティング: `backend/config/routes.rb`
  - `POST /api/places` と `GET /api/places/:id` を定義
- API: `backend/app/controllers/api/places_controller.rb`
  - 登録成功時は 201 + 登録データを返却
  - バリデーション失敗時は 422 + `errors` を返却
  - URL重複時は 409 + `errors` と `existing_place_id` を返却
  - DB一意制約の例外も同様の重複応答に統一
- テスト: `backend/spec/requests/api/places_spec.rb`
  - 登録成功、バリデーション失敗、URL重複の応答を RSpec で検証

## ギャップ/懸念
- なし（Task 1.3 を含む要件・設計に対する未実装は確認できず）。

## 次のアクション
- Task 2（フロントエンドの登録体験構築）に着手
