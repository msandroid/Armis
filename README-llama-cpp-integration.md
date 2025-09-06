# LlamaCpp Integration

このドキュメントでは、ArmisプロジェクトにLlamaCppServiceを統合して、ローカルでLLM推論を行う方法について説明します。

## 概要

LlamaCppServiceは、[llama.cpp](https://github.com/ggml-org/llama.cpp)を利用してローカルでLLM推論を行うためのサービスです。GGUF形式のモデルファイルを使用して、高速でプライベートなAI推論を提供します。

## 特徴

- 🚀 **高速推論**: C++で実装されたllama.cppによる高速な推論
- 🔒 **プライバシー**: ローカルでの推論により、データが外部に送信されません
- 💾 **効率的なメモリ使用**: GGUF形式による効率的なメモリ使用
- 🎛️ **柔軟な設定**: 温度、トークン数、コンテキストサイズなどの詳細設定
- 🔄 **動的モデル切り替え**: 実行時に異なるモデルに切り替え可能
- 📊 **詳細な統計**: 生成時間、トークン数などの詳細な統計情報

## 前提条件

### 1. 必要なパッケージ

```bash
npm install node-llama-cpp
```

### 2. モデルファイル

GGUF形式のモデルファイルを`./models/`ディレクトリに配置してください。

推奨モデル:
- `gpt-oss-20b-GGUF.gguf` (デフォルト) - OpenAI GPT-OSS-20Bモデル、強力な推論とエージェント機能
- `llama-2-7b-chat.gguf`
- `llama-2-13b-chat.gguf`
- `mistral-7b-instruct-v0.2.gguf`
- `qwen2-7b-instruct.gguf`

### 3. システム要件

- **メモリ**: モデルサイズに応じて8GB以上推奨
- **CPU**: マルチコアCPU推奨
- **GPU**: オプション（CUDA/OpenCL対応）
- **OS**: Windows, macOS, Linux

## 基本的な使用方法

### 1. サービスの初期化

```typescript
import { LlamaCppService } from '@/services/llm/llama-cpp-service'

const llamaCppService = new LlamaCppService({
  modelPath: './models/gpt-oss-20b-GGUF.gguf',
  temperature: 0.7,
  maxTokens: 2048,
  contextSize: 4096,
  threads: 4,
  gpuLayers: 0
})

await llamaCppService.initialize()
```

### 2. テキスト生成

```typescript
// 基本的なテキスト生成
const response = await llamaCppService.generateResponse("こんにちは！")
console.log(response.text)

// チャット形式での応答
const messages = [
  { role: 'system', content: 'あなたは親切なアシスタントです。' },
  { role: 'user', content: 'プログラミングについて教えてください。' }
]
const chatResponse = await llamaCppService.chat(messages)
```

### 3. ストリーミング応答

```typescript
await llamaCppService.generateStream("長い文章を生成してください。", (chunk) => {
  process.stdout.write(chunk)
})
```

## LLM Managerとの統合

### 1. サービスの切り替え

```typescript
// LlamaCppServiceに切り替え
await llmManager.switchToLlamaCpp()

// 現在のアクティブサービスを確認
const activeService = llmManager.getActiveService() // 'LlamaCpp' | 'Ollama' | 'Llama'
```

### 2. モデルの管理

```typescript
// 利用可能なモデルを取得
const models = await llmManager.getAvailableLlamaCppModels()

// 新しいモデルを読み込み
await llmManager.loadLlamaCppModel('./models/mistral-7b-instruct.gguf')
```

### 3. 設定の更新

```typescript
await llmManager.updateLlamaCppConfig({
  temperature: 0.9,
  maxTokens: 1024,
  threads: 8
})
```

## UI設定

### 1. 設定画面での管理

設定画面の「LlamaCpp」タブで以下が可能です：

- サービスの有効化/無効化
- 利用可能なモデルの表示
- モデルの切り替え
- 詳細設定の調整（温度、トークン数、スレッド数など）

### 2. 設定項目

| 項目 | 説明 | デフォルト値 | 範囲 |
|------|------|-------------|------|
| Temperature | 生成のランダム性 | 0.7 | 0.0 - 2.0 |
| Max Tokens | 最大生成トークン数 | 2048 | 512 - 8192 |
| Context Size | コンテキストサイズ | 4096 | 2048 - 16384 |
| Threads | CPUスレッド数 | 4 | 1 - 16 |
| GPU Layers | GPU使用レイヤー数 | 0 | 0 - 100 |
| Verbose | 詳細ログ出力 | false | true/false |

## GPT-OSS-20Bモデルの特別設定

### 1. GPT-OSS-20Bモデルの最適化設定

```typescript
// GPT-OSS-20Bモデル用の最適化された設定
const llamaCppService = new LlamaCppService({
  modelPath: './models/gpt-oss-20b-GGUF.gguf',
  temperature: 0.7,
  maxTokens: 32768, // GPT-OSS-20Bの最大トークン数
  contextSize: 8192, // 大きなコンテキストサイズ
  threads: 8, // より多くのスレッド
  gpuLayers: 32, // GPU使用を推奨
  verbose: false
})
```

### 2. 推論レベルの設定

GPT-OSS-20Bモデルは推論レベルを調整できます：

```typescript
// システムプロンプトで推論レベルを設定
const messages = [
  { 
    role: 'system', 
    content: 'Reasoning: high\nあなたは強力な推論能力を持つAIアシスタントです。' 
  },
  { role: 'user', content: '複雑な問題を解決してください。' }
]

const response = await llamaCppService.chat(messages)
```

推論レベル:
- **Low**: 高速応答、一般的な対話
- **Medium**: バランスの取れた速度と詳細
- **High**: 深く詳細な分析

### 3. エージェント機能の活用

```typescript
// ツール使用機能を活用した設定
const agentMessages = [
  { 
    role: 'system', 
    content: 'あなたはツールを使用できるエージェントです。関数呼び出しやWebブラウジングが可能です。' 
  },
  { role: 'user', content: '最新のニュースを調べて要約してください。' }
]

const agentResponse = await llamaCppService.chat(agentMessages)
```

## パフォーマンス最適化

### 1. スレッド数の調整

```typescript
// CPUコア数に応じてスレッド数を調整
const cpuCores = require('os').cpus().length
llamaCppService.updateConfig({ threads: cpuCores })
```

### 2. GPU使用の有効化

```typescript
// GPU使用を有効化（CUDA/OpenCL対応時）
llamaCppService.updateConfig({ gpuLayers: 32 })
```

### 3. メモリ使用量の最適化

```typescript
// コンテキストサイズを調整してメモリ使用量を制御
llamaCppService.updateConfig({ contextSize: 2048 })
```

## トラブルシューティング

### 1. よくある問題

#### モデルファイルが見つからない
```
Error: Model file not found at ./models/llama-2-7b-chat.gguf
```

**解決方法:**
- モデルファイルが正しいパスに配置されているか確認
- ファイル名とパスが正確か確認

#### メモリ不足エラー
```
Error: Failed to allocate memory
```

**解決方法:**
- より小さいモデルを使用
- コンテキストサイズを小さくする
- 他のアプリケーションを終了してメモリを確保

#### GPU関連エラー
```
Error: CUDA/OpenCL not available
```

**解決方法:**
- GPU使用を無効化: `gpuLayers: 0`
- 適切なドライバーがインストールされているか確認

### 2. ログの確認

```typescript
// 詳細ログを有効化
llamaCppService.updateConfig({ verbose: true })
```

### 3. パフォーマンス診断

```typescript
// システム統計を取得
const stats = llmManager.getSystemStats()
console.log('Active service:', stats.llmService)
console.log('Current model:', stats.llamaCppModel)
```

## サンプルコード

詳細な使用例は `src/examples/llama-cpp-usage.ts` を参照してください。

## 制限事項

1. **ブラウザ環境**: Node.js環境でのみ動作します
2. **モデルサイズ**: 大きなモデルは大量のメモリを必要とします
3. **初回起動**: モデルの読み込みに時間がかかる場合があります
4. **GPU使用**: ハードウェアとドライバーの制限があります

## 今後の改善予定

- [ ] WebAssembly対応（ブラウザ環境での動作）
- [ ] より多くのモデル形式のサポート
- [ ] 分散推論のサポート
- [ ] より詳細なパフォーマンスメトリクス
- [ ] 自動モデル最適化

## 参考リンク

- [llama.cpp GitHub](https://github.com/ggml-org/llama.cpp)
- [node-llama-cpp](https://www.npmjs.com/package/node-llama-cpp)
- [GGUF Format](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md)
- [Hugging Face Models](https://huggingface.co/models?search=gguf)
