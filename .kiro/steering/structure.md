# プロジェクト構造

## 組織方針

- フロントエンドとバックエンドを明確に分離
- バックエンドは Rails 標準の MVC 構成に従う
- フロントは React コンポーネント単位で UI を組み立てる

## ディレクトリ規約

### Frontend

**場所**: `/frontend/`  
**目的**: React + Vite の UI とフロントエンド資産  
**例**: `/frontend/src/App.tsx`

### Frontend Source

**場所**: `/frontend/src/`  
**目的**: React コンポーネント、状態管理、スタイル  
**例**: `/frontend/src/main.tsx`

### Backend

**場所**: `/backend/`  
**目的**: Rails アプリケーション本体  
**例**: `/backend/app/`, `/backend/config/`

## 命名規約

- **ファイル**: Frontend は `PascalCase.tsx`（コンポーネント）, Backend は `snake_case.rb`
- **コンポーネント**: `PascalCase`
- **関数**: `camelCase`（TS）/ `snake_case`（Ruby）

## インポート整理

```typescript
import { Something } from './local'
```

**パスエイリアス**:
- なし（必要に応じて導入）

## コード構成の原則

- フロント: 表示/UI と状態・ロジックの分離を意識
- バック: Rails のレイヤ（Model/Controller/View/Service）に沿って責務分割

---
_規約とパターンを記述し、ツリーの網羅はしない_
