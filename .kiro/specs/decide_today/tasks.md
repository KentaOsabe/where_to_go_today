# タスク

- [x] 1. データモデルと入力項目を拡張する
- [x] 1.1 places に評価項目を追加する
  - `visit_reason`（text）と `revisit_intent`（string）を追加する
  - `revisit_intent` は `yes` / `no` / `unknown` のいずれかを許容する
  - _Requirements: 4.3, 7.1_

- [x] 1.2 API の許可パラメータを拡張する
  - `place_params` に `visit_reason` / `revisit_intent` を追加する
  - _Requirements: 7.1_

- [x] 2. 提案APIの基盤を実装する
- [x] 2.1 ルーティングに提案APIを追加する
  - `POST /api/recommendations` を追加する
  - _Requirements: 2.1, 4.4, 4.5_

- [x] 2.2 ルールベースの一次候補選定を実装する
  - `RecommendationService` を追加し、条件一致と評価情報でスコアリングする
  - 上位最大10件を一次候補として返す
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 2.3 OpenAI 絞り込み + 理由生成を実装する
  - `openai_apikey` ファイルから API キーを読み込む
  - 一次候補から最大5件を選定し理由文を生成する
  - 返却 JSON を検証し、件数超過/候補外 ID/理由欠落は補正する
  - 失敗時は一次候補上位5件 + テンプレ理由を返す
  - _Requirements: 4.5, 5.1, 5.2, 5.3_

- [x] 2.4 提案APIレスポンスを整備する
  - `conditions` と `recommendations`（place + reason）を返す
  - _Requirements: 2.3, 5.1_

- [x] 2.5 `openai_apikey` を Git 管理対象外にする
  - `.gitignore` に `openai_apikey` を追加する
  - _Requirements: 5.2_

- [ ] 3. フロントエンドの提案画面を実装する
- [ ] 3.1 型定義を拡張する
  - `Place` に `visit_reason` / `revisit_intent` を追加する
  - 提案用の `Recommendation` / `RecommendationConditions` 型を追加する
  - _Requirements: 7.1_

- [ ] 3.2 提案APIクライアントを追加する
  - `recommendPlaces(conditions)` を実装する
  - _Requirements: 2.1, 5.1_

- [ ] 3.3 DecideTodayScreen を追加する
  - 条件入力フォーム（任意入力）と提案結果の同一画面構成
  - ローディング/失敗/0件/5件未満の表示
  - 再試行ボタンを配置
  - _Requirements: 2.1, 3.1, 3.2, 6.1, 6.2, 6.3, 6.4_

- [ ] 3.4 画面導線を追加する
  - `/decide` ルートを追加する
  - PlacesListScreen に「今日どこ行く？」導線を追加する
  - _Requirements: 2.1_

- [ ] 4. テストで提案機能を担保する
- [ ] 4.1 バックエンドの提案APIを検証する（RSpec）
  - 条件なしで一次候補10件以内、最終結果5件以内
  - 条件一致で一次候補のスコア順が正しい
  - OpenAI 失敗時にフォールバックが返る
  - テストコメントに「概要」「目的」を含める
  - _Requirements: 4.4, 4.5, 5.3, 9.2, 9.3, 9.4, 9.7_

- [ ] 4.2 フロントエンドの提案画面を検証する（frontend/tests）
  - 条件入力→提案表示
  - ローディング/失敗/0件/件数表示
  - 理由文が表示される
  - テストコメントに「概要」「目的」を含める
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 9.1, 9.5, 9.6_
