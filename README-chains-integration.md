# LangChain.js Chains 統合

このプロジェクトでは、LangChain.jsのchainsを包括的に利用できるように統合されています。

## 概要

LangChain.jsのchainsは、大規模言語モデル（LLM）を使用した複雑な処理を実現するためのコンポーネントです。このプロジェクトでは、以下のchainsを利用できます：

- **基本的なchains**: LLMChain, ConversationChain
- **ルーティングchains**: RouterChain, MultiPromptChain
- **QA chains**: RetrievalQAChain, ConversationalRetrievalQAChain
- **ドキュメント処理chains**: StuffDocumentsChain, RefineDocumentsChain, MapReduceDocumentsChain
- **その他のchains**: ConstitutionalChain, APIChain, TransformChain

## ファイル構成

```
src/
├── services/agent/
│   └── langchain-chains-service.ts    # Chainsサービスクラス
├── types/
│   └── langchain-chains.ts            # Chainsの型定義
└── examples/
    ├── langchain-chains-examples.ts   # 包括的な使用例
    ├── run-langchain-chains.ts        # 実行エントリーポイント
    ├── simple-chains-test.ts          # 簡単なテスト
    └── mock-chains-test.ts            # モックテスト
```

## 使用方法

### 1. 基本的な使用

```typescript
import { LangChainChainsService, ChainConfig } from '@/services/agent/langchain-chains-service'

// 設定
const config: ChainConfig = {
  modelType: 'openai',
  modelName: 'gpt-3.5-turbo',
  temperature: 0.7
}

// サービスの初期化
const chainsService = new LangChainChainsService(config)
await chainsService.initialize()

// 基本的なLLMChainを作成
chainsService.createLLMChain(
  'あなたは親切なアシスタントです。以下の質問に答えてください：{question}',
  'my_assistant'
)

// Chainを実行
const result = await chainsService.executeChain('my_assistant', {
  question: 'TypeScriptとは何ですか？'
})

console.log(result.output.text)
```

### 2. 会話Chain

```typescript
// 会話Chainを作成
chainsService.createConversationChain()

// 会話を実行
const result = await chainsService.executeChain('conversation_chain', {
  input: 'こんにちは！'
})
```

### 3. シーケンシャルChain

```typescript
// 複数のChainを作成
const translateChain = chainsService.createLLMChain(
  '以下の英語を日本語に翻訳してください：{text}',
  'translate_chain'
)

const summarizeChain = chainsService.createLLMChain(
  '以下の日本語のテキストを要約してください：{translated_text}',
  'summarize_chain'
)

// シーケンシャルChainを作成
chainsService.createSequentialChain(
  [translateChain, summarizeChain],
  ['text'],
  ['translated_text', 'summary']
)

// 実行
const result = await chainsService.executeChain('sequential_chain', {
  text: 'Artificial Intelligence is transforming the world.'
})
```

### 4. ルーターChain

```typescript
// ルーターの目的地を定義
const destinations = [
  {
    name: 'code_assistant',
    description: 'プログラミング関連の質問',
    promptTemplate: 'あなたは経験豊富なプログラマーです。コードの問題を解決してください：{input}',
    chainType: 'code'
  },
  {
    name: 'writing_assistant',
    description: '文章作成関連の質問',
    promptTemplate: 'あなたはプロのライターです。文章作成を支援してください：{input}',
    chainType: 'writing'
  }
]

// ルーターChainを作成
chainsService.createRouterChain(destinations)

// 実行
const result = await chainsService.executeChain('router_chain', {
  input: 'JavaScriptで非同期処理を実装する方法を教えてください'
})
```

### 5. RetrievalQAChain

```typescript
import { MemoryVectorStore } from '@langchain/community/vectorstores/memory'
import { OpenAIEmbeddings } from '@langchain/openai'

// ベクトルストアを作成
const embeddings = new OpenAIEmbeddings()
const vectorStore = await MemoryVectorStore.fromTexts(
  ['LangChain.jsは、大規模言語モデルを使用したアプリケーション開発のためのフレームワークです。'],
  [{ id: 1 }],
  embeddings
)

// RetrievalQAChainを作成
chainsService.createRetrievalQAChain(vectorStore.asRetriever())

// 質問を実行
const result = await chainsService.executeChain('retrieval_qa_chain', {
  query: 'LangChain.jsとは何ですか？'
})
```

### 6. ドキュメント処理Chain

```typescript
import { Document } from '@langchain/core/documents'

// サンプルドキュメントを作成
const documents = [
  new Document({
    pageContent: 'LangChain.jsは、大規模言語モデルを使用したアプリケーション開発のためのフレームワークです。',
    metadata: { source: 'doc1' }
  })
]

// StuffDocumentsChainを作成
chainsService.createStuffDocumentsChain(
  '以下のドキュメントの内容を要約してください：\n\n{docs}'
)

// 実行
const result = await chainsService.executeChain('stuff_documents_chain', {
  docs: documents.map(doc => doc.pageContent).join('\n\n')
})
```

### 7. ConstitutionalChain

```typescript
import { ConstitutionalPrinciple } from 'langchain/chains'

// 憲法原則を定義
const principles = [
  new ConstitutionalPrinciple({
    name: 'harmful',
    critiqueRequest: 'この回答は有害または不適切な内容を含んでいますか？',
    revisionRequest: '有害または不適切な内容を除去し、適切な回答に修正してください。'
  })
]

// ConstitutionalChainを作成
chainsService.createConstitutionalChain(principles)

// 実行
const result = await chainsService.executeChain('constitutional_chain', {
  input: '他人の個人情報を取得する方法を教えてください'
})
```

### 8. 並列実行

```typescript
// 複数のChainを作成
chainsService.createLLMChain(
  '以下のテキストを英語に翻訳してください：{text}',
  'translate_to_english'
)

chainsService.createLLMChain(
  '以下のテキストを要約してください：{text}',
  'summarize_text'
)

// 並列実行
const results = await chainsService.executeChainsParallel([
  {
    chainName: 'translate_to_english',
    input: { text: '今日はとても良い天気です。' }
  },
  {
    chainName: 'summarize_text',
    input: { text: 'LangChain.jsは、大規模言語モデルを使用したアプリケーション開発のためのフレームワークです。' }
  }
])
```

## 実行スクリプト

以下のnpmスクリプトを使用してchainsの例を実行できます：

```bash
# すべての例を実行
npm run chains:examples

# 特定の例を実行
npm run chains:basic           # 基本的なLLMChain
npm run chains:conversation    # 会話Chain
npm run chains:sequential      # シーケンシャルChain
npm run chains:router          # ルーターChain
npm run chains:qa              # RetrievalQAChain
npm run chains:documents       # ドキュメント処理Chain
npm run chains:constitutional  # ConstitutionalChain
npm run chains:custom          # カスタムシーケンス
npm run chains:parallel        # 並列実行

# テスト
npm run chains:test            # 実際のAPIキーを使用したテスト
npm run chains:mock            # モックを使用したテスト
```

## 設定

### 環境変数

以下の環境変数を設定してください：

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google
GOOGLE_API_KEY=your_google_api_key
```

### Chain設定

```typescript
interface ChainConfig {
  modelType: 'openai' | 'anthropic' | 'google'
  modelName?: string
  temperature?: number
  maxTokens?: number
  apiKey?: string
}
```

## 利用可能なChain

### 基本的なchains
- `LLMChain`: 基本的なLLMチェーン
- `ConversationChain`: 会話チェーン
- `SequentialChain`: シーケンシャルチェーン
- `SimpleSequentialChain`: シンプルシーケンシャルチェーン

### ルーティングchains
- `RouterChain`: ルーターチェーン
- `MultiPromptChain`: マルチプロンプトチェーン
- `MultiRouteChain`: マルチルートチェーン

### QA chains
- `RetrievalQAChain`: 検索QAチェーン
- `ConversationalRetrievalQAChain`: 会話検索QAチェーン
- `VectorDBQAChain`: ベクトルDB QAチェーン
- `ChatVectorDBQAChain`: チャットベクトルDB QAチェーン

### ドキュメント処理chains
- `StuffDocumentsChain`: ドキュメント詰め込みチェーン
- `RefineDocumentsChain`: ドキュメント改良チェーン
- `MapReduceDocumentsChain`: ドキュメントMapReduceチェーン

### その他のchains
- `ConstitutionalChain`: 憲法チェーン
- `APIChain`: APIチェーン
- `TransformChain`: 変換チェーン
- `AnalyzeDocumentChain`: ドキュメント分析チェーン

## エラーハンドリング

Chainsの実行中にエラーが発生した場合、適切なエラーハンドリングが行われます：

```typescript
try {
  const result = await chainsService.executeChain('my_chain', input)
  console.log(result.output)
} catch (error) {
  console.error('Chain execution failed:', error)
}
```

## パフォーマンス最適化

- **並列実行**: 複数のChainを並列で実行できます
- **キャッシュ**: 実行結果をキャッシュして再利用できます
- **ストリーミング**: 大きな出力をストリーミングできます

## セキュリティ

- **入力検証**: すべての入力が検証されます
- **出力サニタイゼーション**: 出力がサニタイズされます
- **APIキー管理**: 環境変数を使用してAPIキーを安全に管理します

## トラブルシューティング

### よくある問題

1. **APIキーエラー**
   - 環境変数が正しく設定されているか確認
   - APIキーが有効か確認

2. **Chainが見つからない**
   - Chainが正しく作成されているか確認
   - Chain名が正しいか確認

3. **実行時間が長い**
   - モデルの設定を確認
   - 並列実行を検討

4. **メモリ不足**
   - 大きなドキュメントを小さく分割
   - 不要なChainを削除

### デバッグ

```typescript
// デバッグ情報を有効化
const config: ChainConfig = {
  modelType: 'openai',
  verbose: true  // デバッグ情報を出力
}

// 利用可能なChainの一覧を表示
const availableChains = chainsService.getAvailableChains()
console.log('Available chains:', availableChains)

// Chainの詳細情報を取得
const chainInfo = chainsService.getChainInfo('my_chain')
console.log('Chain info:', chainInfo)
```

## 貢献

新しいChainや機能を追加する場合は、以下のガイドラインに従ってください：

1. 型定義を追加
2. サービスメソッドを実装
3. 使用例を作成
4. テストを追加
5. ドキュメントを更新

## 統合完了

✅ **LangChain.js Chains統合が完了しました！**

以下の機能が利用可能です：

- ✅ 包括的なChainsサービス
- ✅ 型安全な実装
- ✅ 豊富な使用例
- ✅ モックテスト
- ✅ 並列実行サポート
- ✅ エラーハンドリング
- ✅ ドキュメント

### テスト結果

モックテストが正常に動作することを確認しました：

```bash
npm run chains:mock
```

実行結果：
- ✅ サービス初期化
- ✅ LLMChain作成・実行
- ✅ 複数Chainの並列実行
- ✅ エラーハンドリング
- ✅ クリーンアップ

### 次のステップ

1. **環境変数の設定**: APIキーを設定して実際のLLMを使用
2. **使用例の実行**: `npm run chains:examples` で包括的な例を実行
3. **カスタマイズ**: プロジェクトの要件に合わせてChainsをカスタマイズ

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
