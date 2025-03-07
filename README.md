# Backlog MCP サーバー

Backlog API へのアクセスを提供する MCP サーバーです。プロジェクト管理、課題追跡、ファイル操作などの機能を利用できます。

## 機能

- **プロジェクト管理**: プロジェクト一覧の取得、詳細情報の閲覧
- **課題管理**: 課題の作成、更新、検索、コメント追加
- **ユーザー管理**: ユーザー情報の取得
- **ファイル操作**: 添付ファイルの管理
- **コメント機能**: 課題へのコメント追加
- **検索機能**: 課題やプロジェクトの検索

## ツール

### プロジェクト関連

#### getSpaces

- スペース情報を取得します
- 入力: なし
- 戻り値: スペース情報

#### getProjects

- プロジェクト一覧を取得します
- 入力: なし
- 戻り値: プロジェクト一覧

### 課題関連

#### getIssues

- 課題一覧を取得します
- 入力:
  - projectIdOrKey (string): プロジェクト ID またはキー
  - offset (number, オプション): 取得開始位置
  - count (number, オプション): 取得件数（最大 100）
  - sort (string, オプション): ソート順 ('created'または'updated')
  - order (string, オプション): ソート方向 ('asc'または'desc')
- 戻り値: 課題一覧

#### getIssue

- 課題の詳細情報を取得します
- 入力:
  - issueIdOrKey (string): 課題 ID またはキー
- 戻り値: 課題の詳細情報

#### createIssue

- 新しい課題を作成します
- 入力:
  - projectId (string/number): プロジェクト ID
  - summary (string): 課題の件名
  - issueTypeId (string/number): 課題種別 ID
  - priorityId (string/number, オプション): 優先度 ID
  - description (string, オプション): 課題の詳細
  - startDate (string, オプション): 開始日 (YYYY-MM-DD 形式)
  - dueDate (string, オプション): 期限日 (YYYY-MM-DD 形式)
  - assigneeId (string/number, オプション): 担当者 ID
- 戻り値: 作成された課題の情報

#### updateIssue

- 既存の課題を更新します
- 入力:
  - issueIdOrKey (string): 課題 ID またはキー
  - summary (string, オプション): 課題の件名
  - description (string, オプション): 課題の詳細
  - statusId (string/number, オプション): 状態 ID
  - priorityId (string/number, オプション): 優先度 ID
  - assigneeId (string/number, オプション): 担当者 ID
  - startDate (string, オプション): 開始日 (YYYY-MM-DD 形式)
  - dueDate (string, オプション): 期限日 (YYYY-MM-DD 形式)
- 戻り値: 更新された課題の情報

#### addComment

- 課題にコメントを追加します
- 入力:
  - issueIdOrKey (string): 課題 ID またはキー
  - content (string): コメント内容
- 戻り値: 追加されたコメントの情報

### 検索関連

#### searchIssues

- 課題を検索します
- 入力:
  - keyword (string): 検索キーワード
  - projectIdOrKey (string, オプション): プロジェクト ID またはキー
  - offset (number, オプション): 取得開始位置
  - count (number, オプション): 取得件数（最大 100）
- 戻り値: 検索結果の課題一覧

## 検索構文

### 課題検索

- `keyword`: フリーテキスト検索
- `projectId`: 特定のプロジェクトで絞り込み
- `statusId`: 状態で絞り込み
- `assigneeId`: 担当者で絞り込み

例: `keyword=バグ statusId=1 assigneeId=12345`

## セットアップ

### API キーの取得

1. Backlog にログイン
2. 個人設定 > API > API キーの発行
3. 発行された API キーをコピー

### 環境変数の設定

`.env`ファイルに以下の設定を追加します:

```
BACKLOG_DOMAIN=your-domain.backlog.com
BACKLOG_API_KEY=your-api-key

# テスト用設定（オプション）
TEST_PROJECT_ID=your-test-project-id
TEST_PROJECT_KEY=your-test-project-key
```

### Claude Desktop での使用

Claude Desktop で使用するには、`claude_desktop_config.json`に以下を追加します:

#### NPX の場合

```json
{
  "mcpServers": {
    "backlog": {
      "command": "npx",
      "args": ["-y", "@tmhr1850/backlog-mcp-server"],
      "env": {
        "BACKLOG_DOMAIN": "your-domain.backlog.com",
        "BACKLOG_API_KEY": "your-api-key"
      }
    }
  }
}
```

### ローカル実行

```bash
# ビルド
npm run build

# 実行
npm start
```

## テスト

```bash
# 全テスト実行
npm test

# 監視モードでテスト実行
npm run test:watch

# カバレッジレポート付きでテスト実行
npm run test:coverage
```

## ライセンス

この MCP サーバーは MIT ライセンスの下で提供されています。詳細はプロジェクトリポジトリの LICENSE ファイルをご覧ください。
