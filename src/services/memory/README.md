# Memory機能

このディレクトリには、LangChain.jsのMemory機能の実装が含まれています。Memory機能は、AIアシスタントが過去の会話内容を記憶し、文脈を理解した応答を生成するために使用されます。

## 概要

Memory機能は以下の要素で構成されています：

- **BaseMemory**: すべてのMemoryクラスの基底クラス
- **ChatMessageHistory**: チャットメッセージ履歴を管理するクラス
- **各種Memory実装**: 異なる用途に特化したMemoryクラス
- **ConversationChain**: Memory機能を統合した会話チェーン

## 実装されているMemoryタイプ

### 1. BufferMemory
最も基本的なMemory実装で、全ての会話履歴を保持します。

```typescript
import { BufferMemory } from "./buffer-memory";

const memory = new BufferMemory({ memoryKey: "chat_history" });
```

### 2. ConversationSummaryMemory
会話を要約して保持し、メモリ使用量を削減します。

```typescript
import { ConversationSummaryMemory } from "./conversation-summary-memory";

const memory = new ConversationSummaryMemory({
  memoryKey: "chat_history",
  llm: new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 }),
});
```

### 3. BufferWindowMemory
直近N件のメッセージのみを保持します。

```typescript
import { BufferWindowMemory } from "./buffer-window-memory";

const memory = new BufferWindowMemory({ 
  memoryKey: "chat_history", 
  k: 5 // 直近5件の会話を保持
});
```

### 4. ConversationTokenBufferMemory
トークン数制限付きのMemory実装です。

```typescript
import { ConversationTokenBufferMemory } from "./conversation-token-buffer-memory";

const memory = new ConversationTokenBufferMemory({
  llm: new ChatOpenAI({ model: "gpt-4o-mini" }),
  maxTokenLimit: 2000,
});
```

### 5. ConversationSummaryBufferMemory
要約とバッファを組み合わせたMemory実装です。

```typescript
import { ConversationSummaryBufferMemory } from "./conversation-summary-buffer-memory";

const memory = new ConversationSummaryBufferMemory({
  llm: new ChatOpenAI({ model: "gpt-3.5-turbo-instruct", temperature: 0 }),
  maxTokenLimit: 2000,
});
```

### 6. EntityMemory
エンティティを抽出・記憶するMemory実装です。

```typescript
import { EntityMemory } from "./entity-memory";

const memory = new EntityMemory({
  llm: new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 }),
  chatHistoryKey: "history",
  entitiesKey: "entities",
});
```

### 7. CombinedMemory
複数のMemoryを組み合わせる実装です。

```typescript
import { CombinedMemory } from "./combined-memory";

const memory = new CombinedMemory({
  memories: [bufferMemory, summaryMemory],
});
```

### 8. VectorStoreRetrieverMemory
ベクトルストアを使用したMemory実装です。

```typescript
import { VectorStoreRetrieverMemory } from "./vector-store-retriever-memory";

const memory = new VectorStoreRetrieverMemory({
  retriever,
  memoryKey: "chat_history",
  inputKey: "input",
});
```

## 使用方法

### 基本的な使用例

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { BufferMemory, ConversationChain } from "./index";

// Memoryを初期化
const memory = new BufferMemory({ memoryKey: "chat_history" });

// 言語モデルを設定
const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.9 });

// プロンプトテンプレートを作成
const prompt = PromptTemplate.fromTemplate(`
The following is a friendly conversation between a human and an AI. 
The AI is talkative and provides lots of specific details from its context. 
If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
{chat_history}
Human: {input}
AI:`);

// 会話チェーンを作成
const chain = new ConversationChain({ llm: model, prompt, memory });

// 会話を開始
const res1 = await chain.call({ input: "Hi! I'm Jim." });
console.log(res1.response);

// 前の会話を踏まえた質問
const res2 = await chain.call({ input: "What's my name?" });
console.log(res2.response);
```

### メモリの操作

```typescript
// メモリ変数を読み込み
const memoryVariables = await memory.loadMemoryVariables({});

// メモリをクリア
await memory.clear();

// コンテキストを手動で保存
await memory.saveContext(
  { input: "Hello" },
  { output: "Hi there!" }
);
```

## ファイル構成

```
src/services/memory/
├── index.ts                           # メインエクスポート
├── base-memory.ts                     # 基底Memoryクラス
├── chat-message-history.ts            # チャットメッセージ履歴
├── buffer-memory.ts                   # BufferMemory実装
├── conversation-summary-memory.ts     # ConversationSummaryMemory実装
├── buffer-window-memory.ts            # BufferWindowMemory実装
├── conversation-token-buffer-memory.ts # ConversationTokenBufferMemory実装
├── conversation-summary-buffer-memory.ts # ConversationSummaryBufferMemory実装
├── entity-memory.ts                   # EntityMemory実装
├── combined-memory.ts                 # CombinedMemory実装
├── vector-store-retriever-memory.ts   # VectorStoreRetrieverMemory実装
├── conversation-chain.ts              # ConversationChain実装
├── utils.ts                           # ユーティリティ関数
├── example-usage.ts                   # 使用例
└── README.md                          # このファイル
```

## 注意事項

1. **メモリインスタンスの共有**: メモリインスタンスは単一の会話の履歴を表すため、異なるチェーン間で共有することは推奨されません。

2. **サーバーレス環境**: サーバーレス環境でデプロイする場合、メモリインスタンスを変数に保存しないでください。ホスティングプロバイダーが次回の関数呼び出し時にリセットする可能性があります。

3. **トークン制限**: トークン数制限付きのMemoryを使用する場合、使用するLLMのトークナイザーに合わせて調整してください。

## 拡張方法

新しいMemoryタイプを追加する場合は、`BaseMemory`クラスを拡張し、以下のメソッドを実装してください：

- `memoryKeys`: メモリキーの配列を返す
- `loadMemoryVariables()`: メモリ変数を読み込む
- `saveContext()`: コンテキストを保存する（必要に応じて）
- `clear()`: メモリをクリアする（必要に応じて）

## 使用例の実行

使用例を実行するには：

```bash
# TypeScriptファイルをコンパイル
npx tsc src/services/memory/example-usage.ts

# 実行
node src/services/memory/example-usage.js
```

または、個別の例を実行する場合：

```typescript
import { bufferMemoryExample } from "./example-usage";

await bufferMemoryExample();
```
