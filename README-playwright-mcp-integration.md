# Playwright MCP Integration

このプロジェクトでは、[Playwright MCP](https://github.com/microsoft/playwright-mcp)を統合して、ブラウザの自動化とウェブ操作をMCPプロトコルを通じて提供します。

## 概要

Playwright MCPは、Microsoftが開発したMCPサーバーで、以下の機能を提供します：

- **ブラウザ自動化**: Chromium、Firefox、WebKitの自動化
- **ウェブ操作**: ナビゲーション、クリック、タイピング、スクリーンショット
- **フォーム操作**: フォーム入力、ファイルアップロード
- **ネットワーク監視**: リクエストの監視と分析
- **タブ管理**: 複数タブの作成と管理
- **JavaScript実行**: ページ内でのJavaScript実行

## 実装された機能

### 1. Playwright MCP Adapter (`src/services/playwright-mcp-adapter.ts`)

Playwright MCPサーバーとの接続と操作を管理するアダプターです。

```typescript
import { PlaywrightMCPAdapter } from './services/playwright-mcp-adapter';

const adapter = new PlaywrightMCPAdapter({
  headless: true,
  browser: 'chromium',
  viewport: { width: 1280, height: 720 }
});

// サーバーに接続
await adapter.connect();

// ブラウザを起動
await adapter.launchBrowser();

// URLにナビゲート
await adapter.navigateToUrl('https://github.com');

// スクリーンショットを撮影
await adapter.takeScreenshot({
  filename: 'screenshot.png',
  fullPage: true
});

// セッションを閉じる
await adapter.close();
```

### 2. 利用可能なツール

Playwright MCPは以下のツールを提供します：

#### ブラウザ操作
- `browser_navigate` - URLにナビゲート
- `browser_snapshot` - ページのアクセシビリティスナップショット
- `browser_take_screenshot` - スクリーンショット撮影
- `browser_click` - 要素をクリック
- `browser_type` - テキストを入力
- `browser_press_key` - キーを押す
- `browser_hover` - マウスホバー
- `browser_wait_for` - テキストや時間の待機

#### フォーム操作
- `browser_fill_form` - 複数フィールドの一括入力
- `browser_select_option` - ドロップダウンの選択
- `browser_file_upload` - ファイルアップロード

#### 高度な操作
- `browser_evaluate` - JavaScript実行
- `browser_network_requests` - ネットワークリクエスト取得
- `browser_tabs` - タブ管理
- `browser_install` - ブラウザインストール

### 3. LangChain統合

Playwright MCPツールをLangChainエージェントで使用できます：

```typescript
// Playwright MCPツールを使用するReactエージェントを作成
const agent = await adapter.createReactAgentWithPlaywrightTools({
  type: 'openai',
  modelName: 'gpt-3.5-turbo'
});

// エージェントを実行
const result = await agent.invoke({
  input: "Navigate to https://github.com and take a screenshot"
});
```

### 4. Ollama統合

OllamaモデルとPlaywright MCPを組み合わせて使用できます：

```typescript
// Ollamaを使用するPlaywright MCPエージェント
const agent = await adapter.createReactAgentWithPlaywrightTools({
  type: 'ollama',
  modelName: 'gemma3:1b',
  baseUrl: 'http://localhost:11434'
});
```

## 使用方法

### 基本的な使用例

```typescript
import { PlaywrightMCPAdapter } from './services/playwright-mcp-adapter';

async function basicExample() {
  const adapter = new PlaywrightMCPAdapter({
    headless: true,
    browser: 'chromium'
  });

  try {
    await adapter.connect();
    await adapter.launchBrowser();
    
    // GitHubにナビゲート
    await adapter.navigateToUrl('https://github.com');
    
    // スクリーンショットを撮影
    await adapter.takeScreenshot({
      filename: 'github.png',
      fullPage: true
    });
    
    // JavaScriptを実行してタイトルを取得
    const title = await adapter.evaluateJavaScript('() => document.title');
    console.log('Page title:', title);
    
  } finally {
    await adapter.close();
  }
}
```

### フォーム操作の例

```typescript
async function formExample() {
  const adapter = new PlaywrightMCPAdapter();
  
  try {
    await adapter.connect();
    await adapter.launchBrowser();
    
    // フォームページにナビゲート
    await adapter.navigateToUrl('https://httpbin.org/forms/post');
    
    // ページのスナップショットを取得
    const snapshot = await adapter.takeSnapshot();
    
    // フォームフィールドを入力
    await adapter.fillForm([
      { element: 'Name input', ref: 'name-ref', value: 'John Doe' },
      { element: 'Email input', ref: 'email-ref', value: 'john@example.com' }
    ]);
    
  } finally {
    await adapter.close();
  }
}
```

### 検索エンジンでの検索例

```typescript
async function searchExample() {
  const adapter = new PlaywrightMCPAdapter();
  
  try {
    await adapter.connect();
    await adapter.launchBrowser();
    
    // Googleにナビゲート
    await adapter.navigateToUrl('https://www.google.com');
    
    // 検索ボックスにテキストを入力
    await adapter.typeText('Search input', 'search-ref', 'Playwright MCP');
    
    // Enterキーを押して検索
    await adapter.pressKey('Enter');
    
    // 結果が表示されるまで待機
    await adapter.waitForText('Playwright');
    
    // スクリーンショットを撮影
    await adapter.takeScreenshot({ filename: 'search-results.png' });
    
  } finally {
    await adapter.close();
  }
}
```

## ファイル構成

```
src/
├── services/
│   └── playwright-mcp-adapter.ts     # Playwright MCPアダプター
├── examples/
│   ├── playwright-mcp-integration-example.ts    # 統合例
│   └── playwright-mcp-simple-test.ts           # 簡単なテスト
└── components/
    └── MCPIntegration.tsx            # React UIコンポーネント（Playwright MCP対応）
```

## 利用可能なスクリプト

- `npm run mcp:playwright-example` - すべてのPlaywright MCP例を実行
- `npm run mcp:playwright-basic` - 基本的なPlaywright MCP例
- `npm run mcp:playwright-search` - 検索エンジン例
- `npm run mcp:playwright-network` - ネットワーク監視例
- `npm run mcp:playwright-tabs` - タブ管理例
- `npm run mcp:playwright-langchain` - LangChain統合例
- `npm run mcp:playwright-ollama` - Ollama統合例
- `npm run mcp:playwright-error` - エラーハンドリング例

## 設定オプション

Playwright MCPアダプターは以下の設定オプションをサポートします：

```typescript
interface PlaywrightMCPConfig {
  command?: string;                    // 実行コマンド（デフォルト: 'npx'）
  args?: string[];                     // コマンド引数（デフォルト: ['@playwright/mcp']）
  headless?: boolean;                  // ヘッドレスモード（デフォルト: true）
  browser?: 'chromium' | 'firefox' | 'webkit';  // ブラウザ（デフォルト: 'chromium'）
  viewport?: { width: number; height: number };  // ビューポートサイズ
  timeout?: number;                    // タイムアウト（ミリ秒）
}
```

## 注意事項

1. **ブラウザのインストール**: 初回実行時にブラウザのインストールが必要な場合があります。

2. **ヘッドレスモード**: デフォルトではヘッドレスモードで実行されます。動作を確認したい場合は`headless: false`に設定してください。

3. **要素の参照**: 要素を操作する際は、`browser_snapshot`で取得した要素の参照（ref）が必要です。

4. **ネットワークエラー**: ネットワークエラーやタイムアウトに対する適切なエラーハンドリングが実装されています。

5. **セキュリティ**: 実際の運用では、適切なセキュリティ対策を実装してください。

## 参考資料

- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Playwright MCP npm](https://www.npmjs.com/package/@playwright/mcp)
- [Playwright Documentation](https://playwright.dev/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
