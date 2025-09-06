# LangChain MCP Integration

このプロジェクトでは、[langchain-mcp-adapters](https://github.com/langchain-ai/langchain-mcp-adapters)の機能を参考に、TypeScriptでMCP（Model Context Protocol）とLangChainの統合を実装しています。

## 概要

MCP（Model Context Protocol）は、AIモデルと外部ツールやリソースを安全に接続するためのプロトコルです。この実装により、以下の機能を利用できます：

- **MCPツールをLangChainツールに変換**
- **LangChainエージェントでMCPツールを使用**
- **LangGraphエージェントでMCPツールを使用**
- **複数のMCPサーバーを同時に管理**
- **React UIでの統合**

## 実装された機能

### 1. LangChain MCP Adapter (`src/services/langchain-mcp-adapter.ts`)

MCPツールをLangChainツールに変換し、LangChainエージェントで使用できるようにするアダプターです。複数のLLMプロバイダーをサポートしています：

- **OpenAI**: GPT-3.5-turbo, GPT-4
- **Ollama**: Gemma 3:1B, Gemma 3:4B, Phi 3:3.8B, Qwen 3:1.7B, Qwen 3:4B, GPT-OSS 20B
- **Gemini**: 将来の実装予定
- **Anthropic**: 将来の実装予定

```typescript
import { LangChainMCPAdapter } from './services/langchain-mcp-adapter';

// MCPセッションからアダプターを作成
const adapter = new LangChainMCPAdapter(mcpSession);

// MCPツールをLangChainツールに変換
const langchainTools = await adapter.convertMCPToolsToLangChain();

// Reactエージェントを作成
const agent = await adapter.createReactAgentWithMCPTools(model);
```

### 2. LangGraph MCP Adapter (`src/services/langchain-mcp-langgraph-adapter.ts`)

LangGraphとMCPを統合するアダプターです。

```typescript
import { LangGraphMCPAdapter } from './services/langchain-mcp-langgraph-adapter';

// LangGraph MCPアダプターを作成
const adapter = new LangGraphMCPAdapter(mcpSession);

// LangGraphエージェントを作成
const graph = await adapter.createLangGraphAgentWithMCPTools(model);
```

### 3. Multi-Server MCP Client

複数のMCPサーバーを同時に管理できるクライアントです。

```typescript
import { MultiServerMCPClient } from './services/langchain-mcp-adapter';

const multiClient = new MultiServerMCPClient();

// 複数のサーバーに接続
await multiClient.connectToServer('math', mathSession);
await multiClient.connectToServer('weather', weatherSession);

// すべてのツールを取得
const allTools = await multiClient.getAllTools();
```

### 4. React UI Component (`src/components/MCPIntegration.tsx`)

MCPとLangChainの統合をUIで操作できるReactコンポーネントです。LLMタイプの選択（OpenAI/Ollama）とOllamaモデルの選択が可能です。また、Playwright MCPエージェントの実行もサポートしています。

### 5. Playwright MCP Adapter (`src/services/playwright-mcp-adapter.ts`)

[Playwright MCP](https://github.com/microsoft/playwright-mcp)を統合して、ブラウザの自動化とウェブ操作をMCPプロトコルを通じて提供します。LangChainエージェントと組み合わせて使用できます。

## 使用方法

### 1. 基本的な使用例

```bash
# 基本的な統合例を実行
npm run mcp:langchain-example

# 特定の例を実行
npm run mcp:langchain-basic
npm run mcp:langchain-multi
npm run mcp:langchain-langgraph
npm run mcp:langchain-error
```

### 2. 実際のMCPサーバーとの統合

```bash
# 実際のMCPサーバーとの統合例を実行
npm run mcp:real-server
```

### 3. React UIでの使用

```typescript
import { MCPIntegration } from './components/MCPIntegration';

function App() {
  return (
    <div>
      <MCPIntegration />
    </div>
  );
}
```

## 実装例

### 基本的なLangChain MCP統合

```typescript
import { LangChainMCPAdapter } from './services/langchain-mcp-adapter';
import { ChatOpenAI } from '@langchain/openai';

// モックMCPセッションを作成
const mockSession = {
  listTools: async () => ({
    tools: [
      {
        name: 'add',
        description: 'Add two numbers',
        inputSchema: {
          type: 'object',
          properties: { 
            a: { type: 'number' },
            b: { type: 'number' }
          },
          required: ['a', 'b']
        }
      }
    ]
  }),
  callTool: async (name: string, args: any) => {
    if (name === 'add') {
      return { content: [{ type: 'text', text: `${args.a} + ${args.b} = ${args.a + args.b}` }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  },
  close: async () => {}
};

// アダプターを作成
const adapter = new LangChainMCPAdapter(mockSession as any);

// 利用可能なツールを取得
const availableTools = await adapter.listAvailableTools();
console.log('Available tools:', availableTools);

// LangChainツールに変換
const langchainTools = await adapter.convertMCPToolsToLangChain();

// Reactエージェントを作成
const model = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' });
const agent = await adapter.createReactAgentWithMCPTools(model);

// エージェントを実行
const result = await agent.invoke({
  input: "Add 15 and 27"
});

console.log('Result:', result.output);
```

### Ollamaを使用した例

```typescript
import { LangChainMCPAdapter, LLMConfig } from './services/langchain-mcp-adapter';

// MCPセッションからアダプターを作成
const adapter = new LangChainMCPAdapter(mcpSession);

// Ollama Gemma 3:1Bの設定
const ollamaConfig: LLMConfig = {
  type: 'ollama',
  modelName: 'gemma3:1b',
  baseUrl: 'http://localhost:11434',
  temperature: 0.1
};

// Reactエージェントを作成
const agent = await adapter.createReactAgentWithMCPTools(ollamaConfig);

// エージェントを実行
const result = await agent.invoke({
  input: "Echo 'Hello from Ollama' and then add 15 and 27"
});

console.log('Ollama Result:', result.output);
```

### Playwright MCPを使用した例

```typescript
import { PlaywrightMCPAdapter } from './services/playwright-mcp-adapter';

// Playwright MCPアダプターを作成
const adapter = new PlaywrightMCPAdapter({
  headless: true,
  browser: 'chromium',
  viewport: { width: 1280, height: 720 }
});

// サーバーに接続
await adapter.connect();

// Playwright MCPツールを使用するReactエージェントを作成
const agent = await adapter.createReactAgentWithPlaywrightTools({
  type: 'openai',
  modelName: 'gpt-3.5-turbo'
});

// エージェントを実行
const result = await agent.invoke({
  input: "Navigate to https://github.com and take a screenshot"
});

console.log('Playwright MCP Result:', result.output);

// セッションを閉じる
await adapter.close();
```

### 複数サーバーの使用

```typescript
import { MultiServerMCPClient } from './services/langchain-mcp-adapter';

const multiClient = new MultiServerMCPClient();

// 複数のサーバーに接続
await multiClient.connectToServer('math', mathSession);
await multiClient.connectToServer('weather', weatherSession);

// すべてのツールを取得
const allTools = await multiClient.getAllTools();

// 特定のサーバーのツールを呼び出し
const addResult = await multiClient.callServerTool('math', 'add', { a: 10, b: 5 });
const weatherResult = await multiClient.callServerTool('weather', 'getWeather', { location: 'Tokyo' });
```

### LangGraphとの統合

```typescript
import { LangGraphMCPAdapter } from './services/langchain-mcp-langgraph-adapter';

const adapter = new LangGraphMCPAdapter(mcpSession);

// LangGraphエージェントを作成
const model = new ChatOpenAI({ modelName: 'gpt-3.5-turbo' });
const graph = await adapter.createLangGraphAgentWithMCPTools(model);

// エージェントを実行
const result = await graph.invoke({
  messages: [{ 
    role: 'user', 
    content: 'Calculate 10 * 5 and then add 3 to the result' 
  }]
});

console.log('LangGraph Result:', result);
```

## ファイル構成

```
src/
├── services/
│   ├── langchain-mcp-adapter.ts          # LangChain MCPアダプター
│   └── langchain-mcp-langgraph-adapter.ts # LangGraph MCPアダプター
├── examples/
│   ├── langchain-mcp-integration-example.ts    # 基本的な統合例
│   └── real-mcp-server-integration.ts          # 実際のサーバー統合例
├── components/
│   └── MCPIntegration.tsx                # React UIコンポーネント
└── mcp/                                  # 既存のMCP実装
    ├── client/
    ├── server/
    └── tools/
```

## 利用可能なスクリプト

### LangChain統合例
- `npm run mcp:langchain-example` - すべての統合例を実行
- `npm run mcp:langchain-basic` - 基本的な統合例
- `npm run mcp:langchain-multi` - 複数サーバー例
- `npm run mcp:langchain-langgraph` - LangGraph統合例
- `npm run mcp:langchain-error` - エラーハンドリング例
- `npm run mcp:real-server` - 実際のサーバー統合例

### Ollama統合例
- `npm run mcp:ollama-example` - すべてのOllama例を実行
- `npm run mcp:ollama-test` - Ollama設定テスト
- `npm run mcp:ollama-basic` - 基本的なOllama統合例
- `npm run mcp:ollama-direct` - 直接Ollamaモデル使用例
- `npm run mcp:ollama-compare` - 複数Ollamaモデル比較例

### Playwright MCP統合例
- `npm run mcp:playwright-example` - すべてのPlaywright MCP例を実行
- `npm run mcp:playwright-basic` - 基本的なPlaywright MCP例
- `npm run mcp:playwright-search` - 検索エンジン例
- `npm run mcp:playwright-network` - ネットワーク監視例
- `npm run mcp:playwright-tabs` - タブ管理例
- `npm run mcp:playwright-langchain` - LangChain統合例
- `npm run mcp:playwright-ollama` - Ollama統合例
- `npm run mcp:playwright-error` - エラーハンドリング例

## 注意事項

1. **実際のMCPサーバーの使用**: 実際のMCPサーバーを使用する場合は、サーバーが起動していることを確認してください。

2. **Ollamaの使用**: Ollamaを使用する場合は、以下を確認してください：
   - Ollamaが起動していること（`ollama serve`）
   - 必要なモデルがインストールされていること（`ollama pull gemma3:1b`）

3. **Playwright MCPの使用**: Playwright MCPを使用する場合は、以下を確認してください：
   - `@playwright/mcp`パッケージがインストールされていること
   - 初回実行時にブラウザのインストールが必要な場合があること

4. **依存関係**: この実装は既存のMCP SDKとLangChainライブラリに依存しています。

5. **エラーハンドリング**: ネットワークエラーやサーバーエラーに対する適切なエラーハンドリングが実装されています。

6. **セキュリティ**: 実際の運用では、適切な認証とセキュリティ対策を実装してください。

## 参考資料

- [langchain-mcp-adapters GitHub](https://github.com/langchain-ai/langchain-mcp-adapters)
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [LangChain Documentation](https://js.langchain.com/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Playwright Documentation](https://playwright.dev/)

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
