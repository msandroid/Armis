# Qwen2.5-Omni Integration

このドキュメントでは、ArmisプロジェクトにQwen2.5-Omni-7B-GGUFモデルを統合して、マルチモーダルAI推論と音声生成を行う方法について説明します。

## 概要

Qwen2.5-Omniは、Alibabaが開発したエンドツーエンドマルチモーダルモデルです。テキスト、画像、音声、動画を理解し、テキストと自然な音声を生成できます。

### 主要特徴

- 🎯 **マルチモーダル対応**: テキスト、画像、音声、動画の統合理解
- 🎤 **音声生成**: リアルタイム音声出力（Chelsie/Ethan）
- 🏗️ **革新的アーキテクチャ**: Thinker-Talker設計
- ⚡ **高速処理**: リアルタイムチャンク処理
- 🔒 **プライバシー**: ローカル推論

## 前提条件

### 1. 必要なパッケージ

```bash
npm install node-llama-cpp@3
```

### 2. モデルファイル

Qwen2.5-Omni GGUFモデルを`./models/unsloth/Qwen2.5-Omni-7B-GGUF/`ディレクトリに配置してください。

推奨量子化レベル:
- `Qwen2.5-Omni-7B-Q4_K_M.gguf` (推奨) - バランス型
- `Qwen2.5-Omni-7B-Q5_K_M.gguf` - 高品質
- `Qwen2.5-Omni-7B-Q8_0.gguf` - 最高品質

### 3. システム要件

- **メモリ**: 8GB以上推奨
- **CPU**: マルチコアCPU推奨
- **GPU**: オプション（CUDA/OpenCL対応）
- **OS**: Windows, macOS, Linux

## 基本的な使用方法

### 1. サービスの初期化

```typescript
import { Qwen2_5OmniService } from '@/services/llm/qwen2.5-omni-service'

const qwenOmniService = new Qwen2_5OmniService({
  modelPath: './models/unsloth/Qwen2.5-Omni-7B-GGUF/Qwen2.5-Omni-7B-Q4_K_M.gguf',
  temperature: 0.7,
  maxTokens: 2048,
  contextSize: 32768,
  threads: 4,
  gpuLayers: 0,
  enableAudioOutput: false,
  speaker: 'Chelsie',
  useAudioInVideo: true
})

await qwenOmniService.initialize()
```

### 2. 基本的なテキスト生成

```typescript
const response = await qwenOmniService.generateResponse(
  "Hello! I am Qwen2.5-Omni. How can I help you today?"
)

console.log('Response:', response.text)
console.log('Duration:', response.duration, 'ms')
console.log('Tokens:', response.tokens)
```

### 3. マルチモーダル会話

```typescript
const conversation = [
  {
    role: 'system',
    content: [
      {
        type: 'text',
        text: 'You are Qwen, a virtual human developed by the Qwen Team, Alibaba Group, capable of perceiving auditory and visual inputs, as well as generating text and speech.'
      }
    ]
  },
  {
    role: 'user',
    content: [
      {
        type: 'text',
        text: 'What can you see in this image?'
      },
      {
        type: 'image',
        image: '/path/to/image.jpg'
      }
    ]
  }
]

const response = await qwenOmniService.generateMultimodalResponse(conversation)
console.log('Multimodal response:', response.text)
```

### 4. 音声生成（将来実装予定）

```typescript
// 音声出力を有効化
await qwenOmniService.enableAudioOutput()

// スピーカーを設定
qwenOmniService.setSpeaker('Ethan')

// 音声付きで応答生成
const response = await qwenOmniService.generateResponse(
  "Hello! This is a test of audio generation.",
  { returnAudio: true, speaker: 'Chelsie' }
)

if (response.audio) {
  // 音声データを処理
  console.log('Audio generated:', response.audio.byteLength, 'bytes')
}
```

## 設定オプション

### モデル設定

| パラメータ | デフォルト | 説明 |
|-----------|-----------|------|
| `modelPath` | `./models/unsloth/Qwen2.5-Omni-7B-GGUF/qwen2.5-omni-7b.Q4_K_M.gguf` | モデルファイルパス |
| `temperature` | 0.7 | 創造性の調整（0.0-2.0） |
| `maxTokens` | 2048 | 最大出力トークン数 |
| `contextSize` | 32768 | コンテキストウィンドウサイズ |
| `threads` | -1 | CPUスレッド数（-1で自動） |
| `gpuLayers` | 99 | GPU使用レイヤー数 |

### 音声設定

| パラメータ | デフォルト | 説明 |
|-----------|-----------|------|
| `enableAudioOutput` | false | 音声出力の有効化 |
| `speaker` | 'Chelsie' | 音声タイプ（'Chelsie'/'Ethan'） |
| `useAudioInVideo` | true | 動画内音声の使用 |

## 音声タイプ

### Chelsie (女性)
- 温かみのある明瞭な声
- 優しく親しみやすいトーン
- 一般的な用途に最適

### Ethan (男性)
- 明るく親しみやすい声
- エネルギッシュで魅力的
- カジュアルな会話に最適

## パフォーマンス最適化

### メモリ使用量

| 量子化レベル | サイズ | メモリ使用量 |
|-------------|--------|-------------|
| Q4_K_M | 4.68 GB | ~6 GB |
| Q5_K_M | 5.44 GB | ~7 GB |
| Q8_0 | 8.1 GB | ~10 GB |

### 推奨設定

#### 軽量環境（8GB RAM）
```typescript
{
  threads: 4,
  gpuLayers: 0,
  contextSize: 16384
}
```

#### 標準環境（16GB RAM）
```typescript
{
  threads: 8,
  gpuLayers: 20,
  contextSize: 32768
}
```

#### 高性能環境（32GB+ RAM）
```typescript
{
  threads: 12,
  gpuLayers: 99,
  contextSize: 65536
}
```

## 使用例

### 1. 画像分析

```typescript
const imageAnalysisConversation = [
  {
    role: 'system',
    content: 'You are Qwen2.5-Omni, an AI assistant with visual understanding capabilities.'
  },
  {
    role: 'user',
    content: [
      { type: 'text', text: 'Describe what you see in this image.' },
      { type: 'image', image: '/path/to/image.jpg' }
    ]
  }
]

const analysis = await qwenOmniService.generateMultimodalResponse(imageAnalysisConversation)
```

### 2. 音声理解

```typescript
const audioUnderstandingConversation = [
  {
    role: 'system',
    content: 'You are Qwen2.5-Omni, capable of understanding audio content.'
  },
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What did you hear in this audio?' },
      { type: 'audio', audio: '/path/to/audio.wav' }
    ]
  }
]

const understanding = await qwenOmniService.generateMultimodalResponse(audioUnderstandingConversation)
```

### 3. 動画分析

```typescript
const videoAnalysisConversation = [
  {
    role: 'system',
    content: 'You are Qwen2.5-Omni, capable of analyzing video content with audio.'
  },
  {
    role: 'user',
    content: [
      { type: 'text', text: 'What is happening in this video?' },
      { type: 'video', video: '/path/to/video.mp4' }
    ]
  }
]

const analysis = await qwenOmniService.generateMultimodalResponse(videoAnalysisConversation)
```

## トラブルシューティング

### よくある問題

#### 1. モデルファイルが見つからない
```
Error: Qwen2.5-Omni model file not found
```
**解決方法**: モデルファイルを正しいパスに配置してください。

#### 2. メモリ不足
```
Error: Out of memory
```
**解決方法**: より軽量な量子化レベルを使用するか、メモリを増設してください。

#### 3. 音声生成が動作しない
```
Warning: Audio generation is not yet implemented
```
**解決方法**: 音声生成機能は将来のバージョンで実装予定です。

### デバッグ

```typescript
// 詳細ログを有効化
const qwenOmniService = new Qwen2_5OmniService({
  verbose: true,
  // ... その他の設定
})

// 設定を確認
const config = qwenOmniService.getConfig()
console.log('Current config:', config)

// 準備状態を確認
console.log('Service ready:', qwenOmniService.isReady())
```

## 今後の実装予定

- [ ] 完全な音声生成機能
- [ ] リアルタイム音声ストリーミング
- [ ] マルチモーダル入力の完全サポート
- [ ] 音声品質の最適化
- [ ] バッチ処理機能

## 参考リンク

- [Qwen2.5-Omni Hugging Face](https://huggingface.co/unsloth/Qwen2.5-Omni-7B-GGUF)
- [Qwen2.5-Omni 論文](https://arxiv.org/abs/2503.20215)
- [node-llama-cpp ドキュメント](https://github.com/withcatai/node-llama-cpp)
