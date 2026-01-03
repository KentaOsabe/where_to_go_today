# 設計ドキュメント

## 目的
「お店を登録する機能」において、最小限の入力で素早く登録でき、提案機能で使う必須情報（店名・食べログURL・来店ステータス）を確実に保存する。

## スコープ
### 対象
- お店の新規登録（手動入力）
- 登録結果の確認（詳細または一覧に相当する画面）

### 対象外
- 登録済みデータの編集・削除
- 外部サービスからの自動インポート

## 全体構成
- フロントエンド（Vite + React）で登録フォームを提供
- バックエンド（Rails）で登録API・バリデーション・永続化を担当
- DB（MySQL）にお店情報を保存

## 画面/UX設計
### 画面構成
- 1画面完結の登録フォーム
- 必須項目を上部に配置、任意項目は折りたたみ可能な「追加情報」セクション
- 登録完了後は同一画面で「登録結果」を表示（簡易詳細ビュー）

### 入力項目
- 必須: 店名、食べログURL、来店ステータス
- 任意: ジャンル、エリア、予算帯、メモ

### UX方針
- 来店ステータスは「行っていない」を初期値
- 送信失敗時は入力値を保持
- キーボード操作中心でも完結（Enter送信、タブ移動）

### フロントの状態
- `formState`: 入力値
- `errors`: フィールド別エラー
- `isSubmitting`: 送信中表示制御
- `createdPlace`: 登録成功時の表示用データ

## API設計
### エンドポイント
- `POST /api/places`
  - お店の新規登録
- `GET /api/places/:id`
  - 登録結果確認用（必要に応じて使用）

### リクエスト（POST）
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

### レスポンス（成功）
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
  "created_at": "2026-01-03T06:30:00Z",
  "updated_at": "2026-01-03T06:30:00Z"
}
```

### レスポンス（エラー）
- 422: バリデーションエラー
```json
{
  "errors": {
    "tabelog_url": ["食べログのURLを入力してください"]
  }
}
```
- 409: URL重複
```json
{
  "errors": {
    "tabelog_url": ["すでに登録されています"]
  },
  "existing_place_id": 1
}
```

## データモデル設計
### places テーブル
- `id` (PK)
- `name` (string, 必須)
- `tabelog_url` (string, 必須, 一意)
- `visit_status` (string, 必須)
- `genre` (string, 任意)
- `area` (string, 任意)
- `price_range` (string, 任意)
- `note` (text, 任意)
- `created_at` / `updated_at`

### 制約
- `tabelog_url` はユニークインデックス
- `visit_status` は enum 的に `visited` / `not_visited`

## バリデーション/正規化
- 必須項目: `name`, `tabelog_url`, `visit_status`
- `tabelog_url` は `http`/`https` で `tabelog.com` ドメインのみ許可
- 送信前に前後の空白をトリム
- 重複は DB のユニーク制約とモデルバリデーションで防止

## エラー設計
- フロントで入力チェック（必須/URL形式）
- バックエンドでも同等のバリデーション
- エラーはフィールド別に表示
- 重複時は既存データへの案内を表示（`existing_place_id` を利用）

## セキュリティ/信頼性
- 個人利用・ローカル前提のため、CSRF 等の追加対策は当面不要（API-only でクッキー認証を使わない前提）
- 入力はサーバ側で必ず検証

## テスト方針
- Backend
  - `Place` モデルのバリデーションテスト
  - `POST /api/places` のリクエストテスト（成功/失敗/重複）
- Frontend
  - 登録フォームのバリデーション表示
  - API 成功時の登録結果表示

## 依存関係
- Rails に API コントローラを追加
- MySQL に places テーブル追加
- フロントで API 呼び出し（`fetch`）

## 未決定事項→確定内容
- URL正規化ルール
  - 前後の空白をトリム
  - 末尾スラッシュは削除
  - クエリ文字列（`?` 以降）は削除
  - スキームは `https` に寄せる（`http` → `https`）
- 登録後の詳細画面
  - 登録成功後は `/places/:id` に遷移
  - v1 の詳細画面は表示専用
  - 編集・削除は別フェーズで扱う

## 将来拡張
- 外部APIを使用した自動登録（例: 食べログURLのメタ情報取得や一括登録）
