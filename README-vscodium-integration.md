# VSCodium拡張としてのWhisper.cpp統合

## 概要

このドキュメントでは、ArmisプロジェクトをVSCodium拡張として統合し、**Extension Host側（Node.js）でwhisper.cppを実行**する方法について説明します。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    VSCodium Extension                       │
├─────────────────────────────────────────────────────────────┤
│  Webview UI (React + Vite + Tailwind)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Chat UI   │ │ Whisper UI  │ │  Monitor UI │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  Extension Host (Node.js)                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │Whisper.cpp  │ │   Ollama    │ │ LangChain   │           │
│  │   (STT)     │ │   (LLM)     │ │ (Agents)    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 技術スタック

### Webview UI側
- **React + TypeScript + Vite**
- **Tailwind CSS + shadcn/ui**
- **React Dropzone** - ファイルアップロード
- **Framer Motion** - アニメーション

### Extension Host側
- **Node.js** - バックエンド処理
- **whisper.cpp** - 音声認識
- **Ollama** - ローカルLLM
- **LangChain** - エージェント・チェーン

## 実装内容

### 1. Extension Host側サービス

#### WhisperExtensionService
```typescript
// src/services/extension-host/whisper-extension-service.ts
export class WhisperExtensionService {
  // 音声ファイルを文字起こし
  async transcribeFile(filePath: string, options?: STTOptions): Promise<STTResult>
  
  // 複数の音声ファイルを一括処理
  async transcribeBatch(filePaths: string[], options?: STTOptions): Promise<STTResult[]>
  
  // リアルタイム音声認識（ファイル監視）
  async startRealtimeTranscription(watchDirectory: string, callbacks: Callbacks): Promise<void>
}
```

#### VSCodiumExtensionHost
```typescript
// src/services/extension-host/vscodium-extension-host.ts
export class VSCodiumExtensionHost {
  // VSCodiumコマンドを登録
  private registerCommands(): void
  
  // Webview UIからの要求を処理
  async transcribeAudio(filePath: string, options?: STTOptions): Promise<STTResult>
}
```

### 2. Webview UI側コンポーネント

#### WhisperWebviewPanel
```typescript
// src/components/webview/WhisperWebviewPanel.tsx
export function WhisperWebviewPanel() {
  // ファイルドロップゾーン
  const { getRootProps, getInputProps, isDragActive } = useDropzone()
  
  // リアルタイム音声認識
  async function startRealtimeTranscription()
  
  // 設定管理
  async function updateWhisperConfig()
}
```

## 使用方法

### 1. 基本的な音声認識

```typescript
// Webview UI側
const result = await window.vscode?.postMessage({
  command: 'transcribeAudio',
  filePath: '/path/to/audio.wav',
  options: { language: 'en' }
})
```

### 2. バッチ処理

```typescript
// Webview UI側
const results = await window.vscode?.postMessage({
  command: 'batchTranscribe',
  filePaths: ['audio1.wav', 'audio2.mp3'],
  options: { language: 'ja' }
})
```

### 3. リアルタイム処理

```typescript
// Webview UI側
await window.vscode?.postMessage({
  command: 'startRealtimeTranscription',
  watchDirectory: '/path/to/watch'
})
```

## 実行例

### Node.jsでの直接実行
```bash
# 基本的なテスト
npm run whisper:node-test

# 拡張機能テスト
npm run whisper:extension-test basic
```

### 実行結果
```
=== Whisper Extension Example ===
🚀 Initializing WhisperExtensionService...
✅ WhisperExtensionService initialized
Supported formats: [ 'wav', 'mp3', 'flac', 'ogg' ]
Available models: [ 'ggml-tiny.bin', 'ggml-base.bin', ... ]

🎤 Testing basic transcription...
✅ Transcription completed in 497ms
📝 Result: And so, my fellow Americans, ask not what your country can do for you...
```

## 設定

### 言語設定
- `en` - 英語
- `ja` - 日本語
- `auto` - 自動検出

### モデル選択
- `ggml-tiny.bin` - 軽量（推奨）
- `ggml-base.bin` - 標準
- `ggml-small.bin` - 高精度
- `ggml-medium.bin` - 最高精度

### 出力形式
- `txt` - テキスト形式
- `json` - JSON形式（セグメント情報含む）
- `srt` - 字幕形式
- `vtt` - WebVTT形式

## パフォーマンス

### 処理速度
| モデル | ファイルサイズ | 処理時間 | 精度 |
|--------|----------------|----------|------|
| tiny   | 1MB (30秒)     | ~500ms   | 良好 |
| base   | 1MB (30秒)     | ~1.5s    | 良好 |
| small  | 1MB (30秒)     | ~3s      | 高精度 |
| medium | 1MB (30秒)     | ~8s      | 最高精度 |

### メモリ使用量
- **tiny**: ~77MB
- **base**: ~147MB
- **small**: ~461MB
- **medium**: ~1.5GB

## エラーハンドリング

### よくあるエラー
1. **ファイルが見つからない**
   ```
   Error: Audio file not found: /path/to/audio.wav
   ```

2. **モデルファイルが見つからない**
   ```
   Error: Whisper model not found: /path/to/model.bin
   ```

3. **無効な音声ファイル**
   ```
   Error: Failed to process audio file
   ```

### デバッグ方法
```typescript
// ログ出力を有効化
console.log('Whisper CLI path:', whisperPath)
console.log('Model path:', modelPath)
console.log('Processing file:', filePath)
```

## 今後の拡張

### 1. Ollama統合
```typescript
// Extension Host側でOllamaを実行
export class OllamaExtensionService {
  async generateText(prompt: string, model: string): Promise<string>
  async chat(messages: Message[], model: string): Promise<string>
}
```

### 2. LangChain統合
```typescript
// Extension Host側でLangChainエージェントを実行
export class LangChainExtensionService {
  async runAgent(input: string, tools: Tool[]): Promise<string>
  async runChain(input: string, chain: Chain): Promise<string>
}
```

### 3. リアルタイム音声認識
```typescript
// マイクからの直接録音
export class RealtimeAudioService {
  async startRecording(): Promise<void>
  async stopRecording(): Promise<STTResult>
}
```

## まとめ

VSCodium拡張としての統合により：

✅ **Extension Host側でwhisper.cppを実行** - 高性能な音声認識
✅ **Webview UIでReact + Vite** - モダンなユーザーインターフェース
✅ **リアルタイム処理** - ファイル監視による自動音声認識
✅ **バッチ処理** - 複数ファイルの一括処理
✅ **設定管理** - 言語・モデル・出力形式の柔軟な設定

この実装により、VSCodium内でwhisper.cppを効果的に活用し、高度な音声認識機能を提供できます。
