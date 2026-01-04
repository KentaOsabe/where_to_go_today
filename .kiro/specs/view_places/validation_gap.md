# ギャップ分析（validate-gap）

## 1. 現状調査（Current State Investigation）

### バックエンド
- データモデル: `backend/db/migrate/20260103090000_create_places.rb` に `places` テーブル（一覧に必要な項目は全て保持）
- モデル: `backend/app/models/place.rb`（登録用バリデーション中心）
- API: `backend/app/controllers/api/places_controller.rb` に `create` / `show` のみ
- ルーティング: `backend/config/routes.rb` は `POST /api/places`, `GET /api/places/:id` のみ
- テスト: `backend/spec/requests/api/places_spec.rb` は登録/重複/バリデーションのみ

### フロントエンド
- API クライアント: `frontend/src/api/places.ts` に `createPlace` / `fetchPlace` のみ
- 型定義: `frontend/src/types/place.ts` に `Place` 定義（一覧に必要な項目が揃う）
- UI: `frontend/src/App.tsx` はフォームと詳細表示のみ（`/` と `/places/:id` の簡易ルーティング）
- UI 部品: `frontend/src/components/PlaceForm.tsx` / `PlaceResult.tsx`
- テスト配置: フロントは `frontend/tests/`、バックは RSpec

### 既存の規約/制約
- ルーティングはブラウザ履歴の手動制御（React Router 未導入）
- API は JSON を返却する単純な CRUD 形式

## 2. 要件実現性とギャップ

### 要件→資産マップ
| 要件 | 既存資産 | ギャップ/備考 | タグ |
| --- | --- | --- | --- |
| Req 1: 一覧の取得と表示 | Place モデル、`Place` 型、`create/show` API | 一覧取得 API（`index`）が未実装。フロントの一覧画面・ローディング・空状態・エラー表示が未実装。 | Missing |
| Req 2: 一覧に表示する情報 | Place に必要項目あり。`PlaceResult` に表示パターンあり。 | 一覧での表示レイアウトと URL 導線が未実装。任意情報の見せ方が未決定。 | Missing |
| Req 3: 登録直後の確認 | 登録後に詳細表示へ遷移する既存フローあり。 | 登録後に一覧へ遷移/表示する導線が未実装。 | Missing |

### 制約/判断が必要な点
- 一覧は登録日時の降順で表示する（決定）
- 表示は最大20件とし、ページングを実装する（決定）
- 一覧の店名はリンクにして詳細へ遷移させる（決定）

### Research Needed
- なし（既存資産の範囲で判断可能）

## 3. 実装アプローチの選択肢

### Option A: 既存コンポーネントの拡張
- 追加対象: `Api::PlacesController#index`、`routes.rb`、`frontend/src/api/places.ts` に `fetchPlaces`、`frontend/src/App.tsx` に一覧ルートと表示切替
- 新規 UI: 一覧表示用の小さなコンポーネントを追加（既存 CSS パターンに合わせる）
- Trade-offs:
  - ✅ 既存パターンの延長で実装が速い
  - ✅ 追加依存が不要
  - ❌ 手動ルーティングの分岐が増える

### Option B: 新規ページ構成（ルーティング導入）
- React Router を導入し `/places` を一覧として整理（選択）
- Trade-offs:
  - ✅ 画面遷移の責務が明確になる
  - ❌ 新規依存導入と既存ルーティングの置き換えが必要

### Option C: ハイブリッド
- まず Option A で最小対応し、将来的にルーティング導入を検討
- Trade-offs:
  - ✅ 早期提供と将来拡張の両立
  - ❌ 移行時に構造整理が必要

## 4. 実装規模・リスク
- Effort: S（1–3日）
  - CRUD 追加＋画面 1 枚で完結し、既存パターンが利用可能
- Risk: Low
  - 既存のデータモデルが流用でき、外部連携なし

## 5. 設計フェーズへの推奨事項
- 推奨アプローチ: Option B（React Router 導入で一覧を `/places` に配置）
- 主要決定事項:
  - 一覧は `created_at` 降順
  - 一覧は最大20件 + ページング
  - 店名リンクで詳細へ遷移
