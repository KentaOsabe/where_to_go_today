# ギャップ検証（validate-gap）

## 対象
- 仕様: `.kiro/specs/decide_today_for_ai/requirements.md`
- 既存実装: decide_today（提案機能）/ 登録・編集 UI / API 現状

## 結論
- 既存の提案機能は「ジャンル/エリア/予算帯」の構造化条件 + ルールベースの一次選定 + OpenAI で絞り込みという構成であり、今回の「自由記述入力 + 生成AIによる全候補選定」という要件と大きく乖離している。
- 生成AIへの入力として重要視する「行った理由」は DB には存在するが、登録・編集 UI で入力できず、実データが不足する状態。
- OpenAI 失敗時のフォールバック（テンプレ理由で返却）が現在は実装されており、要件の「失敗時はエラー表示・再試行」と不一致。

## 既存実装の確認
### バックエンド
- 提案 API は `POST /api/recommendations` で実装済み
  - 受け取り条件: `genre`, `area`, `price_range`
  - `RecommendationService` がスコアで一次候補（最大10件）を選定
  - `OpenAiRecommendationService` が一次候補から最大5件に絞り込み + 理由生成
  - OpenAI 失敗時はテンプレ理由でフォールバック
- `Place` に `visit_reason` / `revisit_intent` カラムは存在
- `PlacesController` は `visit_reason` / `revisit_intent` を受け付ける

### フロントエンド
- `DecideTodayScreen` はジャンル/エリア/予算帯の3入力で提案を実行
- `recommendPlaces` は構造化条件を送信する API クライアント
- `PlaceForm`（登録・編集）は `visit_reason` 入力欄が存在しない
- `types/place.ts` に `visit_reason` / `revisit_intent` は定義済み

## ギャップ
### 条件入力
- 自由記述の条件入力 UI が未実装（現在は 3 つのテキスト入力）
- フロント・バックともに「自由記述の条件文字列」を扱う I/F が未定義

### 提案ロジック
- ルールベースのスコアリングと一次候補選定（最大10件）が存在し、要件の「スコア廃止」に反する
- OpenAI への入力が構造化条件前提で設計されており、自由記述入力 + 全候補を前提にしたプロンプト設計が必要
- OpenAI 失敗時にテンプレ理由で返す仕様が要件と不一致（エラー表示と再試行が必要）

### データ/入力 UI
- 「行った理由」を主要入力として扱う要件に対し、登録・編集画面で入力できない
- 「次も同条件なら行くか」は将来用途で UI に含めない方針だが、現行のスコアリングでは使用されているため除外が必要

## 既存資産の再利用候補
- 提案 API ルーティング `POST /api/recommendations`
- OpenAI 連携の基盤実装（`OpenAiRecommendationService`）
- 提案結果 UI の骨格（`DecideTodayScreen`）
- `Place` モデルの `visit_reason` カラム

## 次のアクション
- 設計で以下を明確化
  - 自由記述条件のパラメータ I/F と送受信形式
  - 生成AIへの入力設計（全候補の渡し方、`visit_reason` の扱い）
  - 失敗時の挙動（エラー表示・再試行のみ、フォールバック廃止）
- 登録/編集 UI に「行った理由」入力を追加し、データが蓄積されるようにする
- ルールベースの推薦サービスとテストの刷新方針を決める
