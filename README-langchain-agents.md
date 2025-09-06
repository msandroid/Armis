# LangChain Agents Integration

このプロジェクトでは、LangChain.jsの様々なエージェントを利用可能な状態にしています。

## 📋 概要

LangChain.jsリポジトリをクローンし、以下のエージェントタイプを利用できるようにしました：

- **Basic Agent** - 基本的なエージェント
- **Chat Agent** - チャットエージェント
- **Chat Conversational Agent** - 会話型チャットエージェント
- **Zero-Shot Agent** - Zero-Shotエージェント
- **Structured Chat Agent** - 構造化チャットエージェント
- **OpenAI Functions Agent** - OpenAI Functionsエージェント
- **OpenAI Tools Agent** - OpenAI Toolsエージェント
- **Tool Calling Agent** - Tool Callingエージェント
- **XML Agent** - XMLエージェント
- **ReAct Agent** - ReActエージェント
- **JSON Agent** - JSONエージェント
- **OpenAPI Agent** - OpenAPIエージェント
- **VectorStore Agent** - ベクトルストアエージェント
- **VectorStore Router Agent** - ベクトルストアルーターエージェント

## 🚀 セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、必要なAPIキーを設定してください：

```env
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key
SERPAPI_API_KEY=your_serpapi_api_key
```

### 3. アプリケーションの起動

```bash
npm run dev
```

## 🎯 使用方法

### Web UI

1. アプリケーションを起動
2. 「LangChain エージェント」タブを選択
3. エージェントを作成・実行

### コマンドライン

#### 全例の実行

```bash
npm run agents:all
```

#### 個別の例の実行

```bash
# 基本的なエージェント
npm run agents:basic

# チャットエージェント
npm run agents:chat

# 会話型チャットエージェント
npm run agents:conversational

# Zero-Shotエージェント
npm run agents:zero-shot

# 構造化チャットエージェント
npm run agents:structured

# OpenAI Functionsエージェント
npm run agents:openai-functions

# ReActエージェント
npm run agents:react

# 複数エージェント比較
npm run agents:multiple

# カスタムツール
npm run agents:custom-tools

# 一括実行
npm run agents:batch
```

## 📁 ファイル構造

```
src/
├── services/agent/
│   └── langchain-agents-service.ts    # LangChainエージェントサービス
├── components/chat/
│   └── LangChainAgentsInterface.tsx   # UIインターフェース
└── examples/
    ├── langchain-agents-example.ts    # 使用例
    └── run-langchain-agents.ts        # 実行スクリプト
```

## 🔧 コード例

### 基本的な使用例

```typescript
import LangChainAgentsService from './services/agent/langchain-agents-service';

const config = {
  modelType: 'openai',
  modelName: 'gpt-3.5-turbo',
  temperature: 0,
  maxTokens: 1000,
  apiKey: process.env.OPENAI_API_KEY,
};

const service = new LangChainAgentsService(config);

// 基本的なエージェントを作成
const agent = await service.createBasicAgent({
  verbose: true,
  maxIterations: 10,
});

// エージェントを実行
const result = await service.runAgent(agent, '2 + 2 は何ですか？');
console.log(result);
```

### カスタムツールの作成

```typescript
// カスタムツールを作成
const customTool = service.createCustomTool(
  'get_weather',
  '天気情報を取得します',
  async (city: string) => {
    return `${city}の天気は晴れです。`;
  }
);

// カスタムツールを使用してエージェントを作成
const agent = await service.createBasicAgent({
  tools: [customTool],
  verbose: true,
});
```

### 複数エージェントの一括実行

```typescript
const agents = [
  { name: 'Basic Agent', agent: await service.createBasicAgent() },
  { name: 'Chat Agent', agent: await service.createChatAgent() },
  { name: 'Zero-Shot Agent', agent: await service.createZeroShotAgent() },
];

const results = await service.runMultipleAgents(agents, '1 + 1 は何ですか？');
```

## 🤖 対応モデル

- **OpenAI**: GPT-3.5-turbo, GPT-4, GPT-4-turbo
- **Anthropic**: Claude-3-sonnet, Claude-3-opus, Claude-3-haiku
- **Google**: Gemini-pro, Gemini-pro-vision
- **Ollama**: llama2, codellama, mistral
- **Llama.cpp**: ローカルLLM

## 🛠️ 利用可能なツール

- **Calculator** - 数学計算
- **SerpAPI** - Web検索
- **DynamicTool** - カスタムツール
- **VectorStoreQATool** - ベクトルストア検索
- **ChainTool** - チェーンツール

## 📊 機能

### Web UI機能

- ✅ エージェント作成・管理
- ✅ 複数モデル対応
- ✅ リアルタイム実行
- ✅ 結果表示・比較
- ✅ カスタムツール作成
- ✅ 一括実行
- ✅ 実行時間計測

### コマンドライン機能

- ✅ 個別例の実行
- ✅ 全例の一括実行
- ✅ エラーハンドリング
- ✅ 詳細ログ出力

## 🔍 トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - 環境変数が正しく設定されているか確認
   - APIキーが有効か確認

2. **モデルエラー**
   - 指定したモデル名が正しいか確認
   - モデルが利用可能か確認

3. **ツールエラー**
   - 必要なAPIキーが設定されているか確認
   - ツールの依存関係が正しくインストールされているか確認

### デバッグ

詳細ログを有効にする：

```typescript
const agent = await service.createBasicAgent({
  verbose: true,
  returnIntermediateSteps: true,
});
```

## 📚 参考資料

- [LangChain.js Documentation](https://js.langchain.com/)
- [LangChain Agents](https://js.langchain.com/docs/modules/agents/)
- [LangChain Tools](https://js.langchain.com/docs/modules/agents/tools/)

## 🤝 貢献

バグ報告や機能要望は、GitHubのIssuesでお知らせください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
