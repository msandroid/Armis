# MCP (Model Context Protocol) SDK 使用方法

このディレクトリには、MCP SDKを使用するための基本的な実装例が含まれています。

## 概要

MCP (Model Context Protocol) は、AIモデルと外部ツールやリソースを安全に接続するためのプロトコルです。このSDKを使用することで、以下の機能を実装できます：

- **ツール**: AIが呼び出すことができる関数
- **プロンプト**: AIが使用できるテンプレート
- **リソース**: AIが読み取ることができるデータ

## ファイル構成

```
src/mcp/
├── client/          # MCPクライアントの実装例
├── server/          # MCPサーバーの実装例
├── tools/           # MCPツールの実装例
└── README.md        # このファイル
```

## セットアップ

### 1. 依存関係の確認

`package.json`に以下の依存関係が含まれていることを確認してください：

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.17.3",
    "@playwright/mcp": "^0.0.34"
  }
}
```

### 2. Playwright MCPのセットアップ

Playwright MCPサーバーを使用するには、以下のコマンドでブラウザをインストールしてください：

```bash
npx playwright install
```

### 2. TypeScript設定

`tsconfig.json`が正しく設定されていることを確認してください。

## 使用方法

### 基本的なツールの使用

```typescript
import { echoTool, addTool, getCurrentTimeTool } from './tools/example-tools';

// エコーツールの使用
const echoResult = await echoTool.handler({ message: "Hello, World!" });
console.log(echoResult.content[0].text); // "Echo: Hello, World!"

// 加算ツールの使用
const addResult = await addTool.handler({ a: 5, b: 3 });
console.log(addResult.content[0].text); // "5 + 3 = 8"

// 現在時刻取得ツールの使用
const timeResult = await getCurrentTimeTool.handler({});
console.log(timeResult.content[0].text); // "現在時刻: 2024/1/1 12:00:00"
```

### 基本的なクライアントの使用

```typescript
import { BasicMcpClient } from './client/basic-client';

const client = new BasicMcpClient();

try {
  await client.connect();
  await client.listTools();
  await client.callTool("echo", { message: "Hello, MCP!" });
} finally {
  await client.disconnect();
}
```

### Playwright MCPクライアントの使用

```typescript
import { PlaywrightMcpClient } from './client/playwright-client';

const client = new PlaywrightMcpClient();

try {
  await client.connect();
  
  // ウェブ検索を実行
  const result = await client.performWebSearch("Playwright MCP", "google");
  console.log("検索結果:", result);
  
  // 特定のURLにナビゲート
  await client.navigateToUrl("https://github.com/microsoft/playwright-mcp");
  
  // スクリーンショットを撮影
  await client.takeScreenshot({ filename: "page.png" });
  
} finally {
  await client.disconnect();
}
```

## 利用可能なツール

### 基本的なツール

#### 1. echo
- **説明**: メッセージをエコーするツール
- **入力**: `{ message: string }`
- **出力**: 入力されたメッセージをそのまま返す

#### 2. add
- **説明**: 2つの数値を加算するツール
- **入力**: `{ a: number, b: number }`
- **出力**: 加算結果

#### 3. getCurrentTime
- **説明**: 現在時刻を取得するツール
- **入力**: なし
- **出力**: 現在の日時（日本語形式）

#### 4. reverseString
- **説明**: 文字列を反転するツール
- **入力**: `{ text: string }`
- **出力**: 反転された文字列

### Playwright MCPツール

#### ブラウザ操作
- **browser_navigate**: URLにナビゲート
- **browser_snapshot**: ページのアクセシビリティスナップショットを取得
- **browser_take_screenshot**: スクリーンショットを撮影
- **browser_click**: 要素をクリック
- **browser_type**: テキストを入力
- **browser_press_key**: キーを押す
- **browser_wait_for**: テキスト表示や時間待機

#### 検索エンジン対応
- **Google**: 標準的なウェブ検索
- **Bing**: Microsoft検索エンジン
- **DuckDuckGo**: プライバシー重視の検索エンジン

## カスタムツールの作成

新しいツールを作成するには、以下の形式に従ってください：

```typescript
export const customTool = {
  name: "customToolName",
  description: "ツールの説明",
  inputSchema: {
    type: "object",
    properties: {
      // 入力パラメータの定義
    },
    required: ["必須パラメータ"]
  },
  handler: async (args: { /* 型定義 */ }) => {
    // ツールの処理ロジック
    return {
      content: [{
        type: "text",
        text: "結果のテキスト"
      }]
    };
  }
};
```

## トラブルシューティング

### よくある問題

1. **TypeScriptエラー**: `tsconfig.json`の設定を確認してください
2. **依存関係エラー**: `npm install`を実行して依存関係を再インストールしてください
3. **MCP SDKのAPI変更**: 最新のドキュメントを確認してください

### デバッグ

- コンソールログを確認してエラーメッセージを確認してください
- MCP SDKのデバッグモードを有効にしてください

## 参考資料

- [MCP TypeScript SDK GitHub](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 公式ドキュメント](https://modelcontextprotocol.io/)
- [MCP 仕様書](https://spec.modelcontextprotocol.io/)

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
