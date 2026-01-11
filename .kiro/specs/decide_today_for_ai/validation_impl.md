# 実装レビュー（validate-impl）

## 対象
- Task 1.1: リクエストI/Fを `condition_text` に変更し、未入力時はエラーを返す
- Task 1.2: ルールベースの一次候補選定を廃止する
- Task 1.3: OpenAI 提案生成ロジックを改修する
- Task 1.4: 提案APIレスポンスを整備する

## 結論
- Task 1.1〜1.4 は要件/設計どおりに実装されており、完了と判断できる。

## 実装確認
- リクエストI/F: `backend/app/controllers/api/recommendations_controller.rb`
  - `condition_text` を必須とし、空文字は 422（`condition_text_required`）で返却。
  - レスポンスは `condition_text` と `recommendations` を返す構造に変更。
- 一次候補選定の廃止: `backend/app/controllers/api/recommendations_controller.rb`
  - `RecommendationService` を使用せず、`Place.order(updated_at: :desc)` の全件を OpenAI へ渡す。
- OpenAI 入力/出力仕様: `backend/app/services/open_ai_recommendation_service.rb`
  - 入力は `condition_text` + 候補一覧（`id/name/genre/area/price_range/visit_status/visit_reason/note`）。
  - 出力は最大5件・候補外IDは除外・理由必須（欠落は除外）。
  - 不正/空の出力や失敗時は `RecommendationError` を発生させ、フォールバックは廃止。
  - プロンプトは自由記述条件と制約（未訪問1〜2件含む等）を明示。

## テスト
- `backend/spec/requests/recommendations_spec.rb`
  - `condition_text` 必須の 422 検証
  - 全件を OpenAI に渡すこと、`condition_text` を返すことを検証
- `backend/spec/services/open_ai_recommendation_service_spec.rb`
  - 不正ID/理由欠落の除外、最大5件の制限、失敗時エラーを検証

### 実行済みコマンド
- `docker compose run --rm -e BUNDLE_DEPLOYMENT=false -e BUNDLE_FROZEN=false -e RAILS_ENV=test backend sh -c "bundle install && bin/rails db:prepare && bundle exec rspec spec/requests/recommendations_spec.rb"`
- `docker compose run --rm -e BUNDLE_DEPLOYMENT=false -e BUNDLE_FROZEN=false -e RAILS_ENV=test backend sh -c "bundle install && bin/rails db:prepare && bundle exec rspec spec/services/open_ai_recommendation_service_spec.rb"`

## ギャップ/懸念
- なし（Task 1 系の要件・設計に対する未実装は確認できず）。
