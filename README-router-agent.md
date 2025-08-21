# ルーターエージェントシステム

LangChainのルーターエージェントパターンを参考に実装された、チャット入力に基づいて最適なエージェントを決定し実行するシステムです。

## 🎯 概要

このシステムは、ユーザーの入力内容を分析し、最も適切な専門エージェントを自動的に選択して実行します。各エージェントは特定の分野に特化しており、より高品質で専門的な応答を提供します。

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  Router Agent   │───▶│ Specialized     │
│                 │    │                 │    │ Agents          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Fallback      │
                       │   Handling      │
                       └─────────────────┘
```

## 🤖 利用可能なエージェント

### 1. General Agent (`general`)
- **説明**: 汎用的な質問や会話に対応
- **キーワード**: 質問、会話、雑談、説明、一般
- **用途**: 一般的な会話や基本的な質問

### 2. Code Assistant Agent (`code_assistant`)
- **説明**: プログラミングやコード関連の質問に対応
- **キーワード**: コード、プログラミング、開発、デバッグ、アルゴリズム、関数、クラス、TypeScript、JavaScript、Python
- **用途**: コード生成、デバッグ、アルゴリズム説明

### 3. File Processor Agent (`file_processor`)
- **説明**: ファイル処理やファイル関連の操作に対応
- **キーワード**: ファイル、アップロード、ダウンロード、処理、変換、解析、読み込み、書き込み
- **用途**: ファイル操作、データ変換、ファイル解析

### 4. Data Analyzer Agent (`data_analyzer`)
- **説明**: データ分析や統計処理に対応
- **キーワード**: データ、分析、統計、グラフ、チャート、可視化、集計、計算、数値、パターン
- **用途**: データ分析、統計処理、可視化

### 5. Creative Writer Agent (`creative_writer`)
- **説明**: 創造的な文章作成やコンテンツ生成に対応
- **キーワード**: 文章、作成、執筆、物語、小説、詩、歌詞、マーケティング、広告、ブログ、記事
- **用途**: 文章作成、コンテンツ生成、マーケティング

### 6. Sequential Thinking Agent (`sequential_thinking`)
- **説明**: 複雑な問題を段階的に分析し解決
- **キーワード**: 分析、段階的、計画、戦略、複雑、論理的、思考、解決
- **用途**: 複雑な問題の段階的解決

## 🚀 使用方法

### 基本的な使用例

```typescript
import { LLMManager } from '@/services/llm/llm-manager'
import { LLMConfig } from '@/types/llm'

// LLM設定
const config: LLMConfig = {
  modelPath: './models/llama-2-7b-chat.gguf',
  contextSize: 4096,
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  repeatPenalty: 1.1
}

// LLMマネージャーを初期化
const llmManager = new LLMManager(config)
await llmManager.initialize()

// ユーザー入力を処理（自動的に最適なエージェントが選択される）
const response = await llmManager.routeAndExecute('TypeScriptで配列をソートする方法を教えてください')
console.log(`選択されたエージェント: ${response.agentType}`)
console.log(`応答: ${response.content}`)
```

### 特定のエージェントを直接使用

```typescript
const routerAgent = llmManager.getRouterAgent()
const codeAgent = routerAgent.getAgent('code_assistant')

if (codeAgent) {
  const response = await codeAgent.execute('Pythonでクイックソートを実装してください')
  console.log(response.content)
}
```

### ルーター設定のカスタマイズ

```typescript
// 設定を更新
llmManager.updateRouterConfig({
  confidenceThreshold: 0.8,  // 信頼度閾値を0.8に設定
  enableFallback: false,      // フォールバックを無効化
  maxRetries: 2               // 最大リトライ回数を2に設定
})

// 現在の設定を取得
const config = llmManager.getRouterConfig()
console.log(config)
```

## ⚙️ 設定オプション

### RouterAgentConfig

```typescript
interface RouterAgentConfig {
  defaultAgent: AgentType        // デフォルトエージェント
  confidenceThreshold: number    // 信頼度閾値 (0-1)
  enableFallback: boolean        // フォールバック有効化
  maxRetries: number            // 最大リトライ回数
}
```

### デフォルト設定

```typescript
{
  defaultAgent: 'general',
  confidenceThreshold: 0.7,
  enableFallback: true,
  maxRetries: 3
}
```

## 📊 レスポンス形式

```typescript
interface AgentResponse {
  agentType: AgentType           // 使用されたエージェントの種類
  content: string               // 応答内容
  metadata: Record<string, any> // メタデータ（トークン数、実行時間など）
  executionTime: number         // 実行時間（ミリ秒）
  success: boolean              // 成功フラグ
  error?: string               // エラーメッセージ（失敗時）
}
```

## 🔧 カスタムエージェントの追加

新しいエージェントを追加するには、`Agent`インターフェースを実装します：

```typescript
import { Agent, AgentResponse } from '@/services/agent/router-agent'
import { AgentType } from '@/types/llm'

export class CustomAgent implements Agent {
  type: AgentType = 'custom'
  name = 'Custom Agent'
  description = 'カスタムエージェントの説明'
  keywords = ['キーワード1', 'キーワード2']

  constructor(private llmService: LlamaService) {}

  async execute(input: string, context?: Record<string, any>): Promise<AgentResponse> {
    // エージェントの実装
    const startTime = Date.now()
    
    try {
      const response = await this.llmService.generateResponse(input)
      
      return {
        agentType: this.type,
        content: response.text,
        metadata: { /* メタデータ */ },
        executionTime: Date.now() - startTime,
        success: true
      }
    } catch (error) {
      return {
        agentType: this.type,
        content: `エラー: ${error.message}`,
        metadata: { error: error.message },
        executionTime: Date.now() - startTime,
        success: false,
        error: error.message
      }
    }
  }
}

// ルーターに登録
const customAgent = new CustomAgent(llmService)
routerAgent.registerAgent(customAgent)
```

## 🧪 テスト

使用例を実行するには：

```bash
# TypeScriptファイルを実行
npx ts-node src/examples/router-agent-usage.ts
```

## 📈 パフォーマンス

- **ルーティング決定時間**: 通常100-500ms
- **エージェント実行時間**: 入力内容とエージェントタイプにより変動
- **フォールバック処理**: 信頼度が低い場合に自動的に代替エージェントを実行

## 🔍 デバッグ

ルーティング履歴を確認できます：

```typescript
const routingHistory = llmManager.getRoutingHistory()
routingHistory.forEach((decision, index) => {
  console.log(`${index + 1}. ${decision.selectedAgent} (信頼度: ${decision.confidence})`)
  console.log(`   理由: ${decision.reasoning}`)
})
```

## 🚨 エラーハンドリング

システムは以下のエラーケースを自動的に処理します：

1. **エージェントが見つからない場合**: デフォルトエージェントにフォールバック
2. **信頼度が低い場合**: 代替エージェントを実行
3. **実行エラー**: エラーレスポンスを返し、ログに記録
4. **JSON解析エラー**: デフォルトエージェントを使用

## 🔄 後方互換性

既存の`SequentialThinkingAgent`との互換性を維持しています：

```typescript
// 従来の方法（引き続き使用可能）
const legacyResponse = await llmManager.processUserRequestLegacy(userInput)

// 新しいルーターエージェント（推奨）
const routerResponse = await llmManager.routeAndExecute(userInput)
```

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
