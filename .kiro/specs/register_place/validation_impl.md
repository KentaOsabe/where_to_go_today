# 実装レビュー（validate-impl）

## 対象
- Task 1.1: places の永続化と制約を整える
- Task 1.2: 入力バリデーションとURL正規化を実装する
- Task 1.3: 登録APIの応答とエラーハンドリングを整備する
- Task 2.1: 登録フォームの入力フローを組み立てる
- Task 2.2: フロントのバリデーションとエラー表示を実装する
- Task 2.3: 登録API連携と登録結果の提示を実装する
- Task 3.1: 登録後の詳細表示を参照専用で提供する

## 結論
- Task 1.1 は完了済み。Task 1.2 も要件/設計どおりに実装されており、完了と判断できる。
- Task 1.3 も要件/設計どおりに実装されており、完了と判断できる。
- Task 2.1 も要件/設計どおりに実装されており、完了と判断できる。
- Task 2.2 も要件/設計どおりに実装されており、完了と判断できる。
- Task 2.3 も要件/設計どおりに実装されており、完了と判断できる。
- Task 3.1 も要件/設計どおりに実装されており、完了と判断できる。

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

### Task 2.1 (フロント)
- フォーム構成: `frontend/src/components/PlaceForm.tsx`
  - 必須項目（店名/食べログURL/来店ステータス）と任意項目を分離して表示
  - 任意項目は `details` 要素で折りたたみ可能
  - 来店ステータスの既定値は `not_visited`
  - `formState` を保持し、送信失敗時も入力値が残る構成
  - `Enter` 送信が可能（標準フォーム送信）
- スタイル/導線: `frontend/src/App.css`
  - 必須/任意セクションの視認性分離
  - 1画面完結の入力フローを意識したレイアウト

### Task 2.2 (フロント)
- バリデーション: `frontend/src/lib/validation.ts`
  - 必須項目（店名/食べログURL/来店ステータス）の未入力検知
  - `tabelog.com` ドメインのみ許可するURL検証
- 入力/エラー表示: `frontend/src/components/PlaceForm.tsx`
  - フィールド単位のエラー状態と `aria-invalid` / `aria-describedby` を付与
  - 入力変更時に該当エラーのみを解除
- エラー表示: `frontend/src/components/PlaceForm.tsx`
  - フィールド直下に理由を表示（`role="alert"`）
  - 食べログURLの補足は通常時も表示
- スタイル: `frontend/src/App.css`
  - エラーメッセージ色とエラーフィールドの強調を追加
- テスト: `frontend/tests/lib/validation.test.ts`, `frontend/tests/App.test.tsx`
  - 必須未入力時のエラー表示
  - `tabelog.com` 以外のURLを拒否し理由を表示

### Task 2.3 (フロント)
- API連携: `frontend/src/api/places.ts`
  - `POST /api/places` の成功/重複/バリデーション/失敗を結果型で返却
  - `GET /api/places/:id` を取得関数で提供
- 登録フロー: `frontend/src/hooks/useRegisterPlace.ts`
  - 登録成功時に `onSuccess` を呼び出し、画面遷移へ接続
  - 409時は既存IDを保持し、重複案内の表示に連携
  - 422時はフィールド別エラーを表示
- 登録結果表示: `frontend/src/components/PlaceResult.tsx`
  - 登録後の詳細を表示（必須/任意項目）
  - 取得中/取得失敗の状態を表示
- 遷移/取得: `frontend/src/App.tsx`
  - 登録後は `/places/:id` に遷移し、遷移先で結果を取得して表示
  - ブラウザ戻る操作でルートを反映
- テスト: `frontend/tests/api/places.test.ts`, `frontend/tests/hooks/useRegisterPlace.test.tsx`, `frontend/tests/components/PlaceResult.test.tsx`
  - API結果判定（成功/重複/バリデーション/失敗）
  - 成功時コールバックと重複時の状態保持
  - 登録結果の表示/エラー表示

### Task 3.1 (フロント)
- 詳細表示: `frontend/src/components/PlaceResult.tsx`
  - 必須/任意項目を参照専用で表示し、取得中/エラーを明示
- 画面遷移/取得: `frontend/src/App.tsx`
  - `/places/:id` で詳細ビューのみ表示し、API取得結果を反映
  - `popstate` でURLに追従し、詳細ビュー復帰が可能
- API: `frontend/src/api/places.ts`
  - `GET /api/places/:id` により登録結果を取得
- テスト: `frontend/tests/App.test.tsx`, `frontend/tests/components/PlaceResult.test.tsx`
  - 詳細ルートでフォーム非表示・結果表示を確認
  - 参照専用表示の内容とエラー表示を検証

## ギャップ/懸念
- なし（Task 3.1 を含む要件・設計に対する未実装は確認できず）。

## 次のアクション
- Task 4.1/4.2（テストで登録フローを担保する）に着手
