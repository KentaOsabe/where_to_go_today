# 要件ドキュメント

## Introduction
全体像（`.kiro/specs/overview.md`）に基づき、登録済みのお店一覧を参照できる機能を定義する。ユーザが登録内容を素早く確認し、候補の整理に使えることを目的とする。

## Requirements

### Requirement 1: お店一覧の取得と表示
**Objective:** As a ユーザ, I want 登録済みのお店一覧を参照したい, so that 登録内容を確認して候補を整理できる

#### Acceptance Criteria
1. When ユーザが一覧画面を開いたとき, the Places API shall 登録済みのお店一覧を返す
2. When Places API から一覧が返却されたとき, the Places List Screen shall 各お店を一覧表示する
3. While 一覧取得中のとき, the Places List Screen shall ローディング表示を行う
4. When 登録済みデータが0件のとき, the Places List Screen shall 空状態の案内を表示する
5. If 一覧取得に失敗したとき, then the Places List Screen shall エラーメッセージと再試行手段を表示する

### Requirement 2: 一覧に表示する情報
**Objective:** As a ユーザ, I want 一覧から重要な情報を確認したい, so that 候補を迷わず把握できる

#### Acceptance Criteria
1. When お店を一覧に表示するとき, the Places List Screen shall 店名と来店ステータスを表示する
2. When 食べログURLが登録されているとき, the Places List Screen shall URLを表示し外部ページへ遷移できる導線を提供する
3. When ジャンル・エリア・予算帯・メモのいずれかが登録されているとき, the Places List Screen shall 補足情報として表示する

### Requirement 3: 登録直後の確認
**Objective:** As a ユーザ, I want 登録した直後に一覧で確認したい, so that 登録が成功したことを把握できる

#### Acceptance Criteria
1. When ユーザが新規登録完了後に一覧へ遷移したとき, the Places API shall 最新の登録内容を含む一覧を返す
2. When 新規登録したお店が一覧に含まれるとき, the Places List Screen shall それを表示できる
