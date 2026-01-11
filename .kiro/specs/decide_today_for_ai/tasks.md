# タスク

- [ ] 1. 提案APIを自由記述入力に対応させる
- [ ] 1.1 リクエストI/Fを `condition_text` に変更し、未入力時はエラーを返す
  - `POST /api/recommendations` で `condition_text` を必須とする
  - 空文字の場合は 422 でエラーを返す
  - _Requirements: 2.2, 2.3, 3.2, 6.3, 9.1_

- [ ] 1.2 ルールベースの一次候補選定を廃止する
  - `RecommendationService` を使用しない設計に変更する
  - 候補は `Place` 全件を OpenAI に渡す
  - _Requirements: 2.5, 2.6, 4.1, 4.2_

- [ ] 1.3 OpenAI 提案生成ロジックを改修する
  - 入力: `condition_text` + 候補一覧
  - 出力: 最大5件（id, reason）のみ
  - 理由文に `condition_text` を反映する指示を追加する
  - 不正/空の出力はエラー扱いにし、フォールバックは廃止する
  - _Requirements: 2.5, 4.3, 4.4, 5.1, 5.2, 6.3_

- [ ] 1.4 提案APIレスポンスを整備する
  - `condition_text` と `recommendations`（place + reason）を返す
  - _Requirements: 2.5, 5.1_

- [ ] 2. フロントエンドの提案画面を改修する
- [ ] 2.1 型定義を更新する
  - `RecommendationConditions` を `condition_text` のみに変更する
  - _Requirements: 2.2, 3.1_

- [ ] 2.2 提案APIクライアントを更新する
  - `recommendPlaces({ condition_text })` で送信する
  - _Requirements: 2.5_

- [ ] 2.3 DecideTodayScreen を自由記述入力に変更する
  - textarea に変更し、未入力時は送信不可 + エラー表示
  - 入力内容は失敗時も保持する
  - _Requirements: 2.1, 3.1, 3.2, 6.1, 6.3, 8.2, 9.1_

- [ ] 2.4 提案結果表示の文言を調整する
  - 条件必須の文言/ヘルプを反映する
  - _Requirements: 2.1, 6.1_

- [ ] 3. 登録・編集画面に「行った理由」を追加する
- [ ] 3.1 フォームの状態/型を拡張する
  - `FormState` に `visit_reason` を追加する
  - _Requirements: 2.7, 7.1_

- [ ] 3.2 PlaceForm に「行った理由」入力を追加する
  - 任意入力として textarea を追加する
  - 入力エラー時も値を保持する
  - _Requirements: 2.7, 8.2_

- [ ] 3.3 登録/編集の送信ペイロードに `visit_reason` を含める
  - create/update の API リクエストに反映する
  - _Requirements: 2.7, 7.1_

- [ ] 4. テストで変更点を担保する
- [ ] 4.1 バックエンドの提案APIを検証する（RSpec）
  - `condition_text` 必須の検証（未入力で 422）
  - OpenAI 出力が不正/空のとき 500 が返る
  - 最大5件・候補外IDは除外される
  - テストコメントに「概要」「目的」を含める
  - _Requirements: 3.2, 4.3, 4.4, 6.3, 9.1, 9.2, 9.3, 9.5_

- [ ] 4.2 フロントエンドの提案画面を検証する（frontend/tests）
  - 未入力時の送信ブロックとエラー表示
  - 入力→提案表示、失敗/0件表示
  - テストコメントに「概要」「目的」を含める
  - _Requirements: 3.2, 6.1, 6.3, 6.4, 9.1, 9.5, 9.6_

- [ ] 4.3 登録/編集フォームの「行った理由」を検証する（frontend/tests）
  - 入力値が送信ペイロードに含まれる
  - テストコメントに「概要」「目的」を含める
  - _Requirements: 2.7, 7.1_
