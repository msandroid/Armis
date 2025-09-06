# 本文抽出機能 (Text Extraction Feature)

## 概要

この機能は、入力テキストからTTS（Text-to-Speech）に渡すべき本文部分を適切に抽出するためのLangChainベースのシステムです。

ユーザーが「説明文や解説文などを含むテキスト」を入力した際に、指示文や説明文を除いて「音声化すべき本文部分」のみを抽出し、TTS処理に渡すことができます。

**新機能**: llama.cpp対応により、ローカルLLMでも本文抽出機能が利用可能になりました。さらに、OpenAIのgpt-ossモデルにも対応しています。

## 主要機能

### 1. TextExtractionChain
- **目的**: 入力テキストから本文部分を抽出
- **特徴**: 
  - LangChainのLLMChain + OutputParserを使用
  - 構造化された出力（JSON形式）
  - フォールバック機能付き
  - 複数のLLMプロバイダー対応（OpenAI、Anthropic、Google）

### 2. TextExtractionAgent
- **目的**: 本文抽出とTTS生成を統合したエージェント
- **特徴**:
  - LangChainのAgent + Tools構成
  - 自動的な抽出→TTS処理フロー
  - 高度な制御とエラーハンドリング

### 3. 拡張されたTTSRequestAnalyzer
- **目的**: 既存のTTSリクエスト分析機能を拡張
- **特徴**:
  - TextExtractionChainとの統合
  - より高精度な本文抽出
  - 後方互換性の維持

### 4. 🆕 LlamaCppTextExtractionChain
- **目的**: ローカルLLMを使用した本文抽出
- **特徴**:
  - llama.cpp + GGUFモデル対応
  - オフラインでの本文抽出
  - プライバシー保護
  - カスタマイズ可能な設定

### 5. 🆕 LlamaCppTextExtractionAgent
- **目的**: ローカルLLMを使用した統合エージェント
- **特徴**:
  - llama.cpp + Agent構成
  - ローカルでの抽出→TTS処理
  - バックエンド専用

### 6. 🆕 LlamaCppBackendService
- **目的**: バックエンド統合サービス
- **特徴**:
  - Electron/Node.jsサーバー対応
  - 統合されたAPI
  - エラーハンドリング
  - 状態管理

### 7. 🆕 GptOssTextExtractionChain
- **目的**: OpenAIのgpt-ossモデルを使用した本文抽出
- **特徴**:
  - gpt-oss-20b対応（約20Bパラメータ）
  - 推論レベル設定（low/medium/high）
  - 長いコンテキスト対応（8192トークン）
  - OpenAI社内モデル「o3-mini」と同等の性能

### 8. 🆕 GptOssTextExtractionAgent
- **目的**: gpt-ossモデルを使用した統合エージェント
- **特徴**:
  - gpt-oss + Agent構成
  - 推論レベルに応じた処理
  - バックエンド専用

### 9. 🆕 GptOssBackendService
- **目的**: gpt-ossバックエンド統合サービス
- **特徴**:
  - gpt-oss専用の最適化
  - 推論レベル制御
  - 高性能な本文抽出

## 実装ファイル

```
src/services/tts/
├── text-extraction-chain.ts              # 本文抽出用Chain（クラウドLLM）
├── text-extraction-agent.ts              # 本文抽出用Agent（クラウドLLM）
├── llama-cpp-text-extraction-chain.ts    # 本文抽出用Chain（ローカルLLM）
├── llama-cpp-text-extraction-agent.ts    # 本文抽出用Agent（ローカルLLM）
├── llama-cpp-backend-service.ts          # バックエンド統合サービス
├── gpt-oss-text-extraction-chain.ts      # 本文抽出用Chain（gpt-oss）
├── gpt-oss-text-extraction-agent.ts      # 本文抽出用Agent（gpt-oss）
├── gpt-oss-backend-service.ts            # gpt-ossバックエンド統合サービス
├── tts-request-analyzer.ts               # 拡張されたTTSリクエスト分析
└── index.ts                              # エクスポート定義

src/examples/
├── text-extraction-example.ts            # クラウドLLM使用例
├── text-extraction-test.ts               # テスト
├── llama-cpp-text-extraction-example.ts  # ローカルLLM使用例
├── llama-cpp-backend-example.ts          # バックエンド統合例
├── llama-cpp-environment-check.ts        # 環境チェック
├── gpt-oss-text-extraction-example.ts    # gpt-oss使用例
└── gpt-oss-environment-check.ts          # gpt-oss環境チェック
```

## 使用方法

### クラウドLLM（OpenAI、Anthropic、Google）

#### 基本的な使用例

```typescript
import { createTextExtractionChain } from '../services/tts'

// TextExtractionChainの作成
const extractionChain = createTextExtractionChain({
  modelType: 'openai',
  modelName: 'gpt-3.5-turbo',
  temperature: 0.1,
  apiKey: 'your-api-key'
})

// 初期化
await extractionChain.initialize()

// 本文抽出
const result = await extractionChain.extractMainText(inputText)
console.log('Extracted Text:', result.mainText)
console.log('Confidence:', result.confidence)
```

#### Agentを使用した例

```typescript
import { createTextExtractionAgent } from '../services/tts'

// TextExtractionAgentの作成
const extractionAgent = createTextExtractionAgent({
  modelType: 'openai',
  modelName: 'gpt-3.5-turbo',
  temperature: 0.1,
  apiKey: 'your-api-key',
  maxIterations: 3,
  verbose: true
})

// 初期化
await extractionAgent.initialize()

// テキスト処理（抽出 + TTS生成）
const result = await extractionAgent.processText(inputText)
console.log('Extracted Text:', result.extractedText)
console.log('TTS Result:', result.ttsResult)
```

### 🆕 ローカルLLM（llama.cpp）

#### 前提条件

1. **必要なパッケージ**:
```bash
npm install node-llama-cpp@3 @langchain/community
```

2. **GGUFモデルファイル**:
```bash
# モデルディレクトリを作成
mkdir models

# GGUFモデルファイルをダウンロード（例）
# - llama-2-7b-chat.gguf
# - llama-2-13b-chat.gguf
# - mistral-7b-instruct-v0.2.gguf
# - qwen2-7b-instruct.gguf
```

3. **環境チェック**:
```bash
npx tsx src/examples/llama-cpp-environment-check.ts
```

### 🆕 OpenAI gpt-ossモデル

#### 前提条件

1. **必要なパッケージ**:
```bash
npm install node-llama-cpp@3 @langchain/community
```

2. **gpt-ossモデルファイル**:
```bash
# モデルディレクトリを作成
mkdir models

# gpt-ossモデルファイルをダウンロード
# 推奨: gpt-oss-20b-mxfp4.gguf (~15GB)
# ダウンロード元: https://huggingface.co/ggml-org/gpt-oss-20b-GGUF
```

3. **環境チェック**:
```bash
npx tsx src/examples/gpt-oss-environment-check.ts
```

#### 基本的な使用例

```typescript
import { createLlamaCppTextExtractionChain } from '../services/tts'

// LlamaCppTextExtractionChainの作成
const extractionChain = createLlamaCppTextExtractionChain({
  modelPath: './models/llama-2-7b-chat.gguf',
  temperature: 0.1,
  maxTokens: 2048,
  contextSize: 4096,
  threads: 4,
  gpuLayers: 0,
  verbose: true
})

// 初期化
await extractionChain.initialize()

// 本文抽出
const result = await extractionChain.extractMainText(inputText)
console.log('Extracted Text:', result.mainText)
console.log('Confidence:', result.confidence)
```

#### Agentを使用した例

```typescript
import { createLlamaCppTextExtractionAgent } from '../services/tts'

// LlamaCppTextExtractionAgentの作成
const extractionAgent = createLlamaCppTextExtractionAgent({
  modelPath: './models/llama-2-7b-chat.gguf',
  temperature: 0.1,
  maxTokens: 2048,
  contextSize: 4096,
  threads: 4,
  gpuLayers: 0,
  verbose: true,
  maxIterations: 3
})

// 初期化
await extractionAgent.initialize()

// テキスト処理（抽出 + TTS生成）
const result = await extractionAgent.processText(inputText)
console.log('Extracted Text:', result.extractedText)
console.log('TTS Result:', result.ttsResult)
```

#### バックエンド統合

```typescript
import { createLlamaCppBackendService } from '../services/tts'

// バックエンドサービスの作成
const backendService = createLlamaCppBackendService({
  modelPath: './models/llama-2-7b-chat.gguf',
  temperature: 0.1,
  maxTokens: 2048,
  contextSize: 4096,
  threads: 4,
  gpuLayers: 0,
  verbose: false,
  maxIterations: 3
})

// 初期化
await backendService.initialize()

// 本文抽出
const result = await backendService.extractText({
  text: inputText,
  useAgent: false,
  batchMode: false
})

if (result.success) {
  console.log('Extracted Text:', result.data.mainText)
  console.log('Execution Time:', result.executionTime, 'ms')
}
```

#### 🆕 gpt-ossモデルの使用例

```typescript
import { createGptOssTextExtractionChain } from '../services/tts'

// GptOssTextExtractionChainの作成
const extractionChain = createGptOssTextExtractionChain({
  modelPath: './models/gpt-oss-20b-mxfp4.gguf',
  temperature: 0.1,
  maxTokens: 2048,
  contextSize: 8192, // gpt-oss-20bは長いコンテキストをサポート
  threads: 4,
  gpuLayers: 0,
  verbose: true,
  reasoningLevel: 'medium' // 推論レベル設定
})

// 初期化
await extractionChain.initialize()

// 本文抽出
const result = await extractionChain.extractMainText(inputText)
console.log('Extracted Text:', result.mainText)
console.log('Confidence:', result.confidence)
console.log('Reasoning:', result.reasoning)
```

#### 🆕 gpt-ossバックエンド統合

```typescript
import { createGptOssBackendService } from '../services/tts'

// gpt-ossバックエンドサービスの作成
const backendService = createGptOssBackendService({
  modelPath: './models/gpt-oss-20b-mxfp4.gguf',
  temperature: 0.1,
  maxTokens: 2048,
  contextSize: 8192,
  threads: 4,
  gpuLayers: 0,
  verbose: false,
  maxIterations: 3,
  reasoningLevel: 'medium'
})

// 初期化
await backendService.initialize()

// 本文抽出（推論レベル指定）
const result = await backendService.extractText({
  text: inputText,
  useAgent: false,
  batchMode: false,
  reasoningLevel: 'high' // 動的に推論レベルを変更
})

if (result.success) {
  console.log('Extracted Text:', result.data.mainText)
  console.log('Execution Time:', result.executionTime, 'ms')
  console.log('Reasoning Level:', result.modelInfo?.reasoningLevel)
}
```

### 既存のTTSRequestAnalyzerとの統合

#### クラウドLLM

```typescript
import { createTTSRequestAnalyzer } from '../services/tts'

// TTSRequestAnalyzerの作成（クラウドLLM）
const analyzer = createTTSRequestAnalyzer({
  apiKey: 'your-api-key'
})

// 分析実行
const analysis = await analyzer.analyzeTTSRequest(inputText)
console.log('TTS Text:', analysis.ttsText)
console.log('Extracted Data:', analysis.extractedData)
```

#### 🆕 ローカルLLM

```typescript
import { createTTSRequestAnalyzer } from '../services/tts'

// TTSRequestAnalyzerの作成（llama.cpp）
const analyzer = createTTSRequestAnalyzer({
  useLlamaCpp: true,
  llamaCppConfig: {
    modelPath: './models/llama-2-7b-chat.gguf',
    temperature: 0.1,
    maxTokens: 2048,
    contextSize: 4096,
    threads: 4,
    gpuLayers: 0,
    verbose: false
  }
})

// 分析実行
const analysis = await analyzer.analyzeTTSRequest(inputText)
console.log('TTS Text:', analysis.ttsText)
console.log('Extracted Data:', analysis.extractedData)
```

#### 🆕 gpt-ossモデル

```typescript
import { createTTSRequestAnalyzer } from '../services/tts'

// TTSRequestAnalyzerの作成（gpt-oss）
const analyzer = createTTSRequestAnalyzer({
  useGptOss: true,
  gptOssConfig: {
    modelPath: './models/gpt-oss-20b-mxfp4.gguf',
    temperature: 0.1,
    maxTokens: 2048,
    contextSize: 8192,
    threads: 4,
    gpuLayers: 0,
    verbose: false,
    reasoningLevel: 'medium'
  }
})

// 分析実行
const analysis = await analyzer.analyzeTTSRequest(inputText)
console.log('TTS Text:', analysis.ttsText)
console.log('Extracted Data:', analysis.extractedData)
```

## 入力例と出力例

### 入力テキスト
```
ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。通俗的には、ヴァイキングは角のある兜を被った海賊や略奪を働く戦士であるとされるが、このイメージは後世の想像の影響が強く、実際には略奪を専業としていたのではなく交易民でもあり、故地においては農民であり漁民であった。各地に進出し、北ヨーロッパの歴史に大きな影響を残したが、次第に各地に土着してゆくとともに海上の民としての性格を失い、13世紀までには、殆どのヴァイキングは消滅した。上記の文章を音声にしてください。
```

### 抽出結果
```json
{
  "mainText": "ヴァイキングとは、ヴァイキング時代（Viking Age、800年 - 1050年）と呼ばれる約250年間に西ヨーロッパ沿海部を侵略したスカンディナヴィア、バルト海沿岸地域の武装集団を指す言葉。通俗的には、ヴァイキングは角のある兜を被った海賊や略奪を働く戦士であるとされるが、このイメージは後世の想像の影響が強く、実際には略奪を専業としていたのではなく交易民でもあり、故地においては農民であり漁民であった。各地に進出し、北ヨーロッパの歴史に大きな影響を残したが、次第に各地に土着してゆくとともに海上の民としての性格を失い、13世紀までには、殆どのヴァイキングは消滅した。",
  "confidence": 0.95,
  "reasoning": "「上記の文章を音声にしてください」という明確なTTS指示があり、その前の部分が本文として抽出できる。",
  "hasInstructions": true,
  "instructionType": "tts_request"
}
```

## 技術仕様

### 対応LLMプロバイダー

#### クラウドLLM
- **OpenAI**: GPT-3.5-turbo, GPT-4
- **Anthropic**: Claude-3-sonnet, Claude-3-haiku
- **Google**: Gemini Pro

#### 🆕 ローカルLLM（llama.cpp）
- **Llama 2**: 7B, 13B, 70B
- **Mistral**: 7B Instruct
- **Qwen2**: 7B Instruct
- **Gemma**: 2B, 7B, 9B
- **CodeLlama**: 7B, 13B, 34B
- **その他**: GGUF形式対応モデル

#### 🆕 OpenAI gpt-ossモデル
- **gpt-oss-20b**: 約20Bパラメータ（推奨）
- **gpt-oss-120b**: 約120Bパラメータ（大規模）
- **特徴**: OpenAI社内モデル「o3-mini」と同等の性能
- **ライセンス**: Apache 2.0
- **知識カットオフ**: 2024年6月

### 抽出アルゴリズム
1. **キーワード検出**: TTS関連キーワードの検出
2. **LLM解析**: 高度な自然言語処理による本文抽出
3. **フォールバック**: LLMが利用できない場合の基本的な抽出ロジック

### 出力形式
```typescript
interface ExtractedText {
  mainText: string                    // 抽出された本文
  confidence: number                  // 抽出の信頼度（0-1）
  reasoning: string                   // 抽出理由
  hasInstructions: boolean           // 指示文の有無
  instructionType?: 'tts_request' | 'explanation' | 'other'  // 指示文の種類
}
```

## テスト

### テストの実行

#### クラウドLLM
```bash
# 基本的なテスト
npx tsx src/examples/text-extraction-test.ts

# 完全なデモ（APIキーが必要）
npx tsx src/examples/text-extraction-example.ts
```

#### 🆕 ローカルLLM
```bash
# 環境チェック
npx tsx src/examples/llama-cpp-environment-check.ts

# ローカルLLMデモ（モデルファイルが必要）
npx tsx src/examples/llama-cpp-text-extraction-example.ts

# バックエンド統合デモ
npx tsx src/examples/llama-cpp-backend-example.ts
```

#### 🆕 gpt-ossモデル
```bash
# 環境チェック
npx tsx src/examples/gpt-oss-environment-check.ts

# gpt-ossデモ（モデルファイルが必要）
npx tsx src/examples/gpt-oss-text-extraction-example.ts
```

### テストケース
- ヴァイキングの説明文（長文 + TTS指示）
- シンプルなTTS要求
- 指示文なしのテキスト
- 複雑な説明文

## 設定

### 環境変数

#### クラウドLLM
```bash
# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key

# Google
GOOGLE_API_KEY=your-google-api-key
```

#### 🆕 ローカルLLM
```bash
# モデルファイルパス
LLAMA_MODEL_PATH=./models/llama-2-7b-chat.gguf

# システム設定
LLAMA_THREADS=4
LLAMA_CONTEXT_SIZE=4096
LLAMA_GPU_LAYERS=0
```

#### 🆕 gpt-ossモデル
```bash
# モデルファイルパス
GPTOSS_MODEL_PATH=./models/gpt-oss-20b-mxfp4.gguf

# システム設定
GPTOSS_THREADS=4
GPTOSS_CONTEXT_SIZE=8192
GPTOSS_GPU_LAYERS=0
GPTOSS_REASONING_LEVEL=medium
```

### 設定オプション

#### クラウドLLM
```typescript
interface TextExtractionConfig {
  modelType: 'openai' | 'anthropic' | 'google'
  modelName?: string
  temperature?: number
  apiKey?: string
}
```

#### 🆕 ローカルLLM
```typescript
interface LlamaCppTextExtractionConfig {
  modelPath: string
  temperature?: number
  maxTokens?: number
  contextSize?: number
  threads?: number
  gpuLayers?: number
  verbose?: boolean
}
```

#### 🆕 gpt-ossモデル
```typescript
interface GptOssTextExtractionConfig {
  modelPath: string
  temperature?: number
  maxTokens?: number
  contextSize?: number
  threads?: number
  gpuLayers?: number
  verbose?: boolean
  reasoningLevel?: 'low' | 'medium' | 'high'
}
```

## システム要件

### クラウドLLM
- インターネット接続
- 有効なAPIキー
- 適切なAPI制限

### 🆕 ローカルLLM（llama.cpp）
- **OS**: Windows, macOS, Linux
- **メモリ**: 8GB以上推奨（モデルサイズに応じて）
- **CPU**: マルチコアCPU推奨
- **GPU**: オプション（CUDA/OpenCL対応）
- **ストレージ**: モデルファイル用の空き容量

#### 推奨設定
- **7Bモデル**: 8GB RAM, 4-8 CPU cores
- **13Bモデル**: 16GB RAM, 8-16 CPU cores
- **70Bモデル**: 32GB+ RAM, 16+ CPU cores, GPU推奨

### 🆕 OpenAI gpt-ossモデル
- **OS**: Windows, macOS, Linux
- **メモリ**: 16GB以上推奨（gpt-oss-20b）
- **CPU**: マルチコアCPU推奨（4コア以上）
- **GPU**: オプション（CUDA/OpenCL対応）
- **ストレージ**: モデルファイル用の空き容量（15GB+）

#### 推奨設定
- **gpt-oss-20b**: 16GB RAM, 4-8 CPU cores
- **gpt-oss-120b**: 80GB+ RAM, 16+ CPU cores, GPU必須

## 制限事項

### クラウドLLM
1. **APIキー依存**: 高度な機能にはLLM APIキーが必要
2. **言語制限**: 現在は日本語と英語に最適化
3. **処理時間**: LLM使用時は応答時間が長くなる可能性
4. **プライバシー**: データが外部サーバーに送信される

### 🆕 ローカルLLM
1. **環境制限**: Node.js環境でのみ動作
2. **モデル依存**: GGUF形式のモデルファイルが必要
3. **リソース要求**: 十分なメモリとCPU性能が必要
4. **初期化時間**: モデル読み込みに時間がかかる場合がある

### 🆕 gpt-ossモデル
1. **環境制限**: Node.js環境でのみ動作
2. **モデル依存**: GGUF形式のgpt-ossモデルファイルが必要
3. **リソース要求**: 16GB以上のメモリと4コア以上のCPUが必要
4. **初期化時間**: 大規模モデルのため読み込みに時間がかかる
5. **推論レベル**: 設定によって処理時間と精度が変化

## 今後の拡張予定

1. **多言語対応**: より多くの言語での本文抽出
2. **カスタム抽出ルール**: ユーザー定義の抽出パターン
3. **バッチ処理最適化**: 大量テキストの効率的な処理
4. **学習機能**: 抽出精度の継続的改善
5. **🆕 GPU最適化**: CUDA/OpenCL対応の強化
6. **🆕 モデル管理**: 動的モデル切り替え機能
7. **🆕 分散処理**: 複数モデルの並列処理
8. **🆕 推論レベル最適化**: gpt-ossの推論レベル自動調整
9. **🆕 モデル比較**: 異なるモデル間の性能比較機能

## 貢献

この機能の改善や拡張にご協力いただける場合は、以下の点にご注意ください：

1. 既存のUIは変更しない
2. 型安全性を維持する
3. テストケースを追加する
4. ドキュメントを更新する
5. 🆕 ローカルLLM対応の場合は環境チェックを実行する
6. 🆕 gpt-oss対応の場合は推論レベル設定を考慮する
