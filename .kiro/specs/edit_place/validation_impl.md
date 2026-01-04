# 実装レビュー（validate-impl）

## 対象
- Task 1.1: ルーティングに update/destroy を追加する
- Task 1.2: 更新APIのコントローラ処理を実装する
- Task 1.3: 削除APIのコントローラ処理を実装する
- Task 1.4: 404/例外ハンドリングを追加する
- Task 2.1: 更新/削除 API クライアントを追加する
- Task 2.2: 更新/削除のエラー型を整備する

## 結論
- Task 1.1〜1.4 は要件/設計どおりに実装されており、完了と判断できる。
- Task 2.1〜2.2 は要件/設計どおりに実装されており、完了と判断できる。

## 実装確認
- ルーティング: `backend/config/routes.rb`
  - `PATCH /api/places/:id` と `DELETE /api/places/:id` を追加
- API: `backend/app/controllers/api/places_controller.rb`
  - `update` は `place.update(place_params)` 成功時に更新後 JSON を返却
  - バリデーションエラーは 422、URL 重複は 409 + `existing_place_id`
  - `destroy` は削除後に 204 を返却
  - `ActiveRecord::RecordNotFound` を捕捉し 404 を返却
- テスト: `backend/spec/requests/api/places_spec.rb`
  - 更新成功/422/409/404 を検証
  - 削除成功/404 を検証
- API クライアント: `frontend/src/api/places.ts`
  - `updatePlace` が `success/duplicate/validation/not_found/failure` を返す
  - `deletePlace` が `success/not_found/failure` を返す
- テスト: `frontend/tests/api/places.test.ts`
  - 更新成功/422/409/404/500 を検証
  - 削除成功/404/500 を検証

## テスト実行
- Backend: `docker compose run --rm -e BUNDLE_DEPLOYMENT=false -e BUNDLE_FROZEN=false -e RAILS_ENV=test backend sh -c "bundle install && bin/rails db:prepare && bundle exec rspec spec/requests/api/places_spec.rb"`
- Frontend: `docker compose run --rm frontend sh -c "npm install && npm test"`

## ギャップ/懸念
- なし

## 次のアクション
- なし
