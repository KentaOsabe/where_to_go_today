# 設計ドキュメント

## 目的
登録済みのお店情報を安全かつ素早く編集・削除できるようにし、候補リストを最新の状態に保つ。

## スコープ
### 対象
- お店情報の編集（必須/任意項目の更新）
- 編集フォームの初期値表示と保存
- 削除の確認ステップと実行
- 編集/削除後の結果確認（詳細/一覧への遷移）
- 編集/削除失敗時の理由表示と再試行導線

### 対象外
- 編集履歴の保持
- 取り消し（undo）機能
- まとめて編集・削除するバッチ操作

## 全体構成
- フロントエンド（Vite + React）で編集フォームと削除導線を提供
- バックエンド（Rails）で更新/削除 API と検証を提供
- 既存の `Place` モデル/バリデーションを再利用
- ルーティングに `/places/:id/edit` を追加し、詳細画面から編集へ遷移できるようにする

## 画面/UX設計
### 画面構成
- `/places/:id`：詳細画面（既存、右側アクションを「編集」「削除」に変更）
- `/places/:id/edit`：編集画面（新規）
- `/places`：一覧画面（削除後の戻り先）

### 編集フォーム
- 既存値を初期値として表示
- 入力項目は登録時と同等（店名、食べログURL、来店ステータス、ジャンル、エリア、予算帯、メモ）
- 送信時は登録と同じバリデーション（必須/URL 形式/ドメイン）
- 送信失敗時は入力値を保持
- 送信成功時は `/places/:id` に遷移し更新内容を確認
- ボタン文言は「更新する」とする

### 削除フロー
- 詳細画面の右側に「削除」ボタンを配置
- クリック時に確認ステップ（ダイアログ）を表示
- 確認後に `DELETE /api/places/:id` を呼び出す
- 削除成功時は `/places` に遷移し、一覧から対象が消えていることを確認できる
- 削除失敗時は理由をメッセージ表示

### 状態管理（フロント）
- `formState`: 編集フォームの入力値
- `errors`: フィールド別エラー
- `isSubmitting`: 保存中
- `submitError`: 保存失敗メッセージ
- `duplicatePlaceId`: 重複 URL の参照先
- `isDeleting`: 削除処理中
- `deleteError`: 削除失敗メッセージ

## API設計
### エンドポイント
- `PATCH /api/places/:id`：お店情報の更新
- `DELETE /api/places/:id`：お店の削除

### リクエスト（PATCH）
```json
{
  "name": "店名",
  "tabelog_url": "https://tabelog.com/...",
  "visit_status": "not_visited",
  "genre": "和食",
  "area": "渋谷",
  "price_range": "3000-5000",
  "note": "一人でも入りやすそう"
}
```

### レスポンス（更新成功）
```json
{
  "id": 1,
  "name": "店名",
  "tabelog_url": "https://tabelog.com/...",
  "visit_status": "not_visited",
  "genre": "和食",
  "area": "渋谷",
  "price_range": "3000-5000",
  "note": "一人でも入りやすそう",
  "created_at": "2026-01-04T00:30:00Z",
  "updated_at": "2026-01-04T01:15:00Z"
}
```

### レスポンス（削除成功）
- 204 No Content

### エラー
- 404: 対象が存在しない
- 422: バリデーションエラー
```json
{
  "errors": {
    "tabelog_url": ["食べログのURLを入力してください"]
  }
}
```
- 409: URL 重複
```json
{
  "errors": {
    "tabelog_url": ["すでに登録されています"]
  },
  "existing_place_id": 1
}
```

## バックエンド設計
- `Api::PlacesController` に `update` / `destroy` を追加
- `update` は `place.update(place_params)` で更新し、成功時は更新後の JSON を返す
- バリデーションエラーは 422、URL 重複は 409（`existing_place_id` 付き）で返す
- `ActiveRecord::RecordNotFound` を捕捉し、404 を返す
- `destroy` は `place.destroy!` 後に 204 を返す

## フロントエンド設計
### API クライアント
- `updatePlace(placeId, payload)` を追加
  - 結果型は `success` / `duplicate` / `validation` / `not_found` / `failure`
- `deletePlace(placeId)` を追加
  - 結果型は `success` / `not_found` / `failure`

### フォーム再利用
- `PlaceForm` を編集でも使えるように、見出し/説明/送信ボタン文言を変更可能にする
- 編集用では「必須項目」などの文言を維持しつつ、行動文言は「更新する」に変更

### 画面実装
- `EditPlaceScreen` を新規追加
  - 初期表示時に `GET /api/places/:id` で取得
  - 取得結果を `FormState` に変換（`null` → 空文字）
  - 保存成功時は `/places/:id` に遷移
- `PlaceDetailScreen` に編集/削除アクションを追加
  - 右側アクションは「編集」「削除」の2つに変更
  - 編集は `/places/:id/edit` へ遷移
  - 削除は確認ステップ後に API を呼び出す
  - 見出しは「店舗詳細」に変更し、キャプションは省略可

### ルーティング
- `/places/:id/edit` を追加し、`App.tsx` にルートを登録

## データモデル設計
- `places` テーブル変更なし（`updated_at` は更新で自動更新）

## エラー設計
- バリデーションエラーはフィールド別に表示
- 重複エラーは既存レコードへのリンクを提示
- 404 は「指定されたデータが見つかりませんでした。」などの文言を表示

## セキュリティ/信頼性
- 既存の入力検証を更新でも必須とする
- 個人利用前提のため追加の認証は不要

## テスト方針
### Backend（RSpec）
- `PATCH /api/places/:id` の更新成功
- 422（必須未入力/URL不正）
- 409（他レコードとの URL 重複）
- 404（対象なし）
- `DELETE /api/places/:id` の削除成功
- 404（対象なし）

### Frontend（Vitest）
- 編集フォームに既存値が表示される
- バリデーションエラー表示
- 重複エラーと既存詳細への遷移導線
- 更新成功で詳細に遷移し内容が更新される
- 削除確認 → 成功で一覧へ遷移
- 削除/取得失敗時のエラーメッセージ表示

## 依存関係
- 既存の `fetch` 実装と `PlaceForm` を再利用
- 新規ライブラリ追加なし

## 未決定事項→確定内容
- 編集画面の URL: `/places/:id/edit`
- 削除成功レスポンス: 204 No Content
- 削除確認はシンプルなダイアログで実装

## 将来拡張
- 変更履歴の表示
- 論理削除/復元機能
- 一括編集/削除
