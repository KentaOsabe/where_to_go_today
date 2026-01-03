# 技術スタック

## アーキテクチャ

- フロントエンド（Vite + React + TypeScript）とバックエンド（Rails）を分離
- ローカル開発は Docker Compose でフロント/バック/DB を起動
- DB は MySQL を利用

## コア技術

- **言語**: TypeScript, Ruby
- **フレームワーク**: React, Ruby on Rails
- **ランタイム**: Node.js, Ruby
- **データベース**: MySQL 8.4

## 主要ライブラリ

- **Frontend**: Vite, React 19
- **Backend**: Rails 8.1, Propshaft, Turbo, Stimulus, Jbuilder

## 開発標準

### 型安全

- TypeScript `strict: true`

### コード品質

- ESLint（frontend）
- RuboCop Rails Omakase（backend, 任意実行）

### テスト

- Frontend: Vitest
- Backend: Rails 標準（Minitest）+ Capybara/Selenium

## 開発環境

### 必須ツール

- Docker / Docker Compose
- Node.js + npm（フロント開発時）
- Ruby 4.0 + Bundler（バックエンド開発時）

### 主要コマンド

```bash
# Dev: docker compose up
# Frontend Dev: (frontend/) npm run dev
# Backend Dev: (backend/) bin/rails server
# Test (frontend): (frontend/) npm test
```

## 重要な技術的意思決定

- フロントとバックを分離し、UI は Vite/React で構築
- バックエンドは Rails で API/業務ロジックを担う
- DB は MySQL を採用し、開発はコンテナで統一

---
_標準と指針を記述し、依存関係の網羅はしない_
