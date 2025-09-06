# GraphAI Integration

GraphAIをArmisプロジェクトに統合し、LLMが利用できるようにしました。

## 概要

[GraphAI](https://github.com/receptron/graphai)は、非同期データフロー実行エンジンで、開発者がエージェントワークフローを宣言的なデータフローグラフとして記述することで、エージェントアプリケーションを構築できるフレームワークです。

## GraphAIとは

GraphAIは以下の特徴を持つ強力なAIワークフローエンジンです：

### 主要特徴

1. **宣言的ワークフロー定義**
   - YAMLまたはJSONでワークフローを定義
   - 視覚的で理解しやすい構造

2. **非同期実行**
   - 複数のエージェントを並行実行
   - 効率的なリソース管理

3. **マルチエージェント対応**
   - OpenAI、Anthropic、Gemini、Groqなど
   - カスタムエージェントの追加

4. **リアルタイム監視**
   - ワークフローの実行状況をリアルタイムで監視
   - デバッグとトラブルシューティング

## 機能

### 利用可能なツール

1. **テキスト処理** (`graphaiTextProcessor`)
   - テキストの要約、キーワード抽出、感情分析
   - 複数の操作を並行実行

2. **マルチステップ推論** (`graphaiMultiStepReasoner`)
   - 段階的な分析と推論
   - 論理的な結論の導出

3. **ドキュメント処理** (`graphaiDocumentProcessor`)
   - 構造抽出、要約、質問生成
   - 複雑なドキュメントの分析

4. **コード生成** (`graphaiCodeGenerator`)
   - 要件からコードの計画、生成、レビュー
   - 複数のプログラミング言語対応

5. **データ分析** (`graphaiDataAnalyzer`)
   - データの洞察抽出と推奨事項
   - 統計分析とパターン認識

6. **カスタムワークフロー** (`graphaiCustomWorkflowExecutor`)
   - 独自のワークフロー定義
   - 柔軟なAIアプリケーション構築

7. **ワークフロー管理** (`graphaiWorkflowStatusChecker`, `graphaiWorkflowStopper`)
   - 実行状況の監視
   - ワークフローの制御

8. **エージェント情報** (`graphaiAgentInfoGetter`)
   - 利用可能なエージェントの情報
   - エージェントの詳細情報

9. **複合ワークフロー** (`graphaiCompositeTextReasoner`)
   - テキスト処理と推論の組み合わせ
   - 高度な分析ワークフロー

## セットアップ

### 1. GraphAIのインストール

```bash
npm install graphai --legacy-peer-deps
```

### 2. GraphAIエージェントのインストール

```bash
npm install @graphai/vanilla @graphai/openai_agent @graphai/anthropic_agent @graphai/gemini_agent @graphai/groq_agent @graphai/input_agents @graphai/vanilla_node_agents @graphai/stream_agent_filter @graphai/browserless_agent --legacy-peer-deps
```

## 使用方法

### 基本的な使用例

```typescript
import { GraphAIService } from '@/services/graphai/graphai-service'
import { GraphAITools } from '@/services/tools/graphai-tools'

// GraphAIサービスインスタンスを作成
const graphAIService = new GraphAIService()
const graphAITools = new GraphAITools()

// テキスト処理
const textResult = await graphAITools.textProcessor.execute({
  text: 'GraphAI is an asynchronous data flow execution engine.',
  operations: ['summarize', 'extract_keywords']
})

// マルチステップ推論
const reasoningResult = await graphAITools.multiStepReasoner.execute({
  question: 'How can GraphAI improve software development?',
  context: 'GraphAI is a framework for building AI applications.'
})
```

### カスタムワークフロー例

```typescript
import { GraphData } from 'graphai'

const customWorkflow: GraphData = {
  version: 0.5,
  nodes: {
    input_text: {
      value: 'GraphAI is revolutionizing AI application development.'
    },
    sentiment_analysis: {
      agent: 'openAIAgent',
      inputs: {
        prompt: 'Analyze the sentiment: ${:input_text}'
      }
    },
    keyword_extraction: {
      agent: 'openAIAgent',
      inputs: {
        prompt: 'Extract keywords: ${:input_text}'
      }
    },
    final_report: {
      agent: 'openAIAgent',
      inputs: {
        prompt: 'Create a report combining sentiment and keywords.'
      }
    }
  }
}

const result = await graphAIService.executeCustomWorkflow(customWorkflow)
```

### 複合ワークフロー例

```typescript
// テキスト処理と推論を組み合わせたワークフロー
const result = await graphAITools.compositeTextReasoner.execute({
  text: 'GraphAI enables complex AI workflows using declarative graphs.',
  question: 'What are the main benefits of GraphAI?'
})
```

## ワークフロー定義

### GraphData構造

```typescript
interface GraphData {
  version: number
  nodes: Record<string, NodeDefinition>
  edges?: EdgeDefinition[]
  options?: WorkflowOptions
}
```

### ノード定義

```typescript
interface NodeDefinition {
  agent: string
  inputs: Record<string, any>
  params?: Record<string, any>
  graph?: GraphData  // サブグラフ
  value?: any        // 固定値
  isResult?: boolean // 結果ノード
}
```

### エージェントの種類

#### 基本エージェント
- `copyAgent` - データのコピー
- `mapAgent` - 配列の処理
- `arrayJoinAgent` - 配列の結合
- `arrayFilterAgent` - 配列のフィルタリング

#### LLMエージェント
- `openAIAgent` - OpenAI GPT
- `anthropicAgent` - Anthropic Claude
- `geminiAgent` - Google Gemini
- `groqAgent` - Groq

#### 特殊エージェント
- `textInputAgent` - テキスト入力
- `fileWriteAgent` - ファイル書き込み
- `browserlessAgent` - Webスクレイピング

## 実行例

### npmスクリプト

```bash
# 基本的な例を実行
npm run graphai:example

# カスタムワークフロー例を実行
npm run graphai:custom

# 複合ワークフロー例を実行
npm run graphai:composite

# エージェント情報例を実行
npm run graphai:agents

# ワークフロー状態管理例を実行
npm run graphai:status
```

### 直接実行

```bash
# TypeScriptファイルを直接実行
tsx src/examples/graphai-integration-example.ts
```

## 設定

### 環境変数

GraphAIは以下の環境変数をサポートします：

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Gemini
GOOGLE_API_KEY=your_google_api_key

# Groq
GROQ_API_KEY=your_groq_api_key

# Browserless
BROWSERLESS_API_KEY=your_browserless_api_key
```

### カスタム設定

```typescript
// カスタムオプションでGraphAIサービスを作成
const graphAIService = new GraphAIService()

// カスタムワークフローを実行
const result = await graphAIService.executeCustomWorkflow(
  workflowDefinition,
  { customInput: 'value' }
)
```

## ワークフローパターン

### 1. シーケンシャルワークフロー

```typescript
const sequentialWorkflow: GraphData = {
  version: 0.5,
  nodes: {
    step1: { agent: 'openAIAgent', inputs: { prompt: 'Step 1' } },
    step2: { agent: 'openAIAgent', inputs: { prompt: 'Step 2: ${:step1}' } },
    step3: { agent: 'openAIAgent', inputs: { prompt: 'Step 3: ${:step2}' } }
  }
}
```

### 2. パラレルワークフロー

```typescript
const parallelWorkflow: GraphData = {
  version: 0.5,
  nodes: {
    input: { value: 'Input data' },
    parallel1: { agent: 'openAIAgent', inputs: { prompt: 'Process 1: ${:input}' } },
    parallel2: { agent: 'openAIAgent', inputs: { prompt: 'Process 2: ${:input}' } },
    parallel3: { agent: 'openAIAgent', inputs: { prompt: 'Process 3: ${:input}' } },
    combine: { agent: 'openAIAgent', inputs: { prompt: 'Combine: ${:parallel1}, ${:parallel2}, ${:parallel3}' } }
  }
}
```

### 3. 条件分岐ワークフロー

```typescript
const conditionalWorkflow: GraphData = {
  version: 0.5,
  nodes: {
    input: { value: 'Input data' },
    condition: { agent: 'openAIAgent', inputs: { prompt: 'Evaluate: ${:input}' } },
    branch1: { agent: 'openAIAgent', inputs: { prompt: 'Branch 1: ${:input}' } },
    branch2: { agent: 'openAIAgent', inputs: { prompt: 'Branch 2: ${:input}' } }
  }
}
```

## トラブルシューティング

### よくある問題

1. **エージェントが見つからない**
   - エージェントパッケージがインストールされているか確認
   - エージェント名が正しいか確認

2. **APIキーエラー**
   - 必要なAPIキーが環境変数に設定されているか確認
   - APIキーの権限を確認

3. **ワークフロー実行エラー**
   - ノードの依存関係が正しいか確認
   - 入力データの形式が正しいか確認

4. **パフォーマンス問題**
   - 並行実行の設定を確認
   - リソース使用量を監視

### デバッグ

```typescript
// 詳細ログを有効にする
const graphAIService = new GraphAIService()

// ワークフローの状態を確認
const status = graphAIService.getWorkflowStatus()
console.log('Workflow status:', status)

// 利用可能なエージェントを確認
const agents = graphAIService.getAvailableAgents()
console.log('Available agents:', agents)
```

## ベストプラクティス

### 1. ワークフロー設計

- **モジュラー設計**: 小さな再利用可能なノードに分割
- **エラーハンドリング**: 適切なエラー処理を実装
- **ログ記録**: 重要なステップでログを記録

### 2. パフォーマンス最適化

- **並行実行**: 独立したタスクは並行実行
- **キャッシュ**: 重い処理の結果をキャッシュ
- **リソース管理**: 適切なリソース制限を設定

### 3. セキュリティ

- **APIキー管理**: 環境変数でAPIキーを管理
- **入力検証**: すべての入力を検証
- **アクセス制御**: 適切なアクセス制御を実装

## 貢献

GraphAIの統合に関する改善提案やバグ報告は、GitHubのIssuesでお知らせください。

## ライセンス

GraphAIはMITライセンスの下で提供されています。詳細は[GraphAIリポジトリ](https://github.com/receptron/graphai)を参照してください。

## 参考リンク

- [GraphAI公式サイト](https://graphai.info)
- [GraphAI GitHub](https://github.com/receptron/graphai)
- [GraphAI API Document](https://github.com/receptron/graphai/blob/main/APIDocument.md)
- [GraphAI Agent Document](https://github.com/receptron/graphai/blob/main/docs/agents.md)
