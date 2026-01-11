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

---

## 対象（Task 2）
- Task 2.1: 型定義を更新する
- Task 2.2: 提案APIクライアントを更新する
- Task 2.3: DecideTodayScreen を自由記述入力に変更する
- Task 2.4: 提案結果表示の文言を調整する

## 結論（Task 2）
- Task 2.1〜2.4 は要件/設計どおりに実装されており、完了と判断できる。

## 実装確認（Task 2）
- 型定義: `frontend/src/types/place.ts`
  - `RecommendationConditions` が `condition_text` のみに変更されている。
- API クライアント: `frontend/src/api/recommendations.ts`
  - `condition_text` を送信し、レスポンスから `condition_text` を受け取る。
- 画面入力: `frontend/src/screens/DecideTodayScreen.tsx`
  - textarea による自由記述入力に変更され、未入力時は送信ブロックとエラー表示。
  - 失敗時も入力内容は保持される。
  - 0件時/失敗時/ローディング表示が維持されている。
- 文言: `frontend/src/screens/DecideTodayScreen.tsx`
  - 条件が必須であることを明記する文言に更新されている。

## テスト（Task 2）
- `frontend/tests/DecideTodayScreen.test.tsx`
  - 未入力時の送信ブロックとエラー表示
  - 入力→提案表示、失敗/0件表示、入力保持
- `frontend/tests/api/recommendations.test.ts`
  - `condition_text` を送信し、レスポンスを受け取る

### 実行済みコマンド（Task 2）
- `docker compose run --rm frontend sh -c "npm install && npm test"`

## ギャップ/懸念（Task 2）
- なし（Task 2 系の要件・設計に対する未実装は確認できず）。
