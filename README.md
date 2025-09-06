# Armis - AI-Powered Development Environment

## Features

- **TTS (Text-to-Speech)**: Convert text to speech using Google's Gemini API
- **Multi-language Support**: Support for 24 languages including Japanese, English, Korean, and more
- **Multiple Voice Options**: Choose from various voice personalities and styles
- **Real-time Audio Playback**: Play generated audio directly in the browser
- **Audio Download**: Save generated audio files locally

## TTS Setup

### 1. Environment Variables

Set your Google Gemini API key:

#### Option A: Settings Configuration (Recommended)
Configure the API key in the application settings:
1. Open Settings → API Keys → Google
2. Enter your Google Gemini API key
3. Save the settings

#### Option B: Environment Variable
Alternatively, create a `.env` file in the project root:

```bash
# .env
VITE_GOOGLE_GENAI_API_KEY=your_google_gemini_api_key_here
```

**Note**: The API key configured in Settings → API Keys → Google takes priority over the environment variable.

### 2. Available Voices

The TTS system supports various voices with different personalities:

**Japanese Voices:**
- **Kore**: 明るく親しみやすい
- **Irrhoe**: おおらか

**English Voices:**
- **Autonoe**: Bright
- **Enceladus**: Breathy
- **Iapetus**: Clear
- **Umbriel**: Easy-going
- **Algieba**: Smooth
- **Despina**: Smooth
- **Erinome**: クリア
- **Algenib**: Gravelly
- **Rasalgethi**: 情報が豊富
- **Laomedeia**: アップビート
- **Achernar**: Soft
- **Alnilam**: Firm
- **Schedar**: Even
- **Gacrux**: 成人向け
- **Pulcherrima**: Forward
- **Achird**: フレンドリー
- **Zubenelgenubi**: カジュアル
- **Vindemiatrix**: Gentle
- **Sadachbia**: Lively
- **Sadaltager**: Knowledgeable
- **Sulafat**: Warm

### 3. Usage

#### Command Line Example

```bash
npm run tts:example
```

#### Programmatic Usage

```typescript
import { createGeminiTTSService } from './src/services/tts'

const ttsService = createGeminiTTSService({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
  defaultVoice: 'Kore',
  defaultLanguage: 'ja-JP'
})

// Basic synthesis
const result = await ttsService.synthesize('こんにちは、世界！')

// With style
const styledResult = await ttsService.synthesize('お疲れ様でした！', {
  speaker: {
    voiceName: 'Kore',
    style: 'cheerfully',
    language: 'ja-JP'
  }
})

// Save to file
await ttsService.saveToFile(result.audioData, 'output.wav')
```

#### React Component

```tsx
import { TTSPlayer } from './src/components/tts'

function App() {
  return (
    <div>
      <TTSPlayer />
    </div>
  )
}
```

### 4. Supported Languages

The TTS system supports 24 languages:

- Arabic (Egypt): `ar-EG`
- German (Germany): `de-DE`
- English (US): `en-US`
- Spanish (US): `es-US`
- French (France): `fr-FR`
- Hindi (India): `hi-IN`
- Indonesian (Indonesia): `id-ID`
- Italian (Italy): `it-IT`
- Japanese (Japan): `ja-JP`
- Korean (Korea): `ko-KR`
- Portuguese (Brazil): `pt-BR`
- Russian (Russia): `ru-RU`
- Dutch (Netherlands): `nl-NL`
- Polish (Poland): `pl-PL`
- Thai (Thailand): `th-TH`
- Turkish (Turkey): `tr-TR`
- Vietnamese (Vietnam): `vi-VN`
- Romanian (Romania): `ro-RO`
- Ukrainian (Ukraine): `uk-UA`
- Bengali (Bangladesh): `bn-BD`
- English (India): `en-IN`
- Marathi (India): `mr-IN`
- Tamil (India): `ta-IN`
- Telugu (India): `te-IN`

## Gemini Image Generation Integration

### 概要
GoogleのImagenモデルを使用した高品質な画像生成機能をArmisに統合しました。Vertex AI APIを通じて、様々なスタイルと品質の画像を生成できます。

### 主な機能

#### 1. 複数のImagenモデルサポート
- **imagen-3.0-generate-002**: 標準的な画像生成（推奨）
- **imagen-3.0-fast-generate-001**: 高速画像生成
- **imagen-4.0-generate-001**: 高品質画像生成
- **imagen-4.0-fast-generate-001**: 高速高品質生成
- **imagen-4.0-ultra-generate-001**: 最高品質生成

#### 2. 豊富なカスタマイズオプション
- **アスペクト比**: 1:1, 4:3, 3:4, 16:9, 9:16
- **品質設定**: Draft, Standard, HD
- **スタイル**: Photorealistic, Artistic, Cartoon, Abstract
- **安全フィルター**: 4段階の制限レベル
- **人物生成**: 制限レベル設定

#### 3. バッチ生成
- 1-4枚の画像を同時生成
- 設定の保存と復元
- 生成履歴の管理

#### 4. 画像管理機能
- 生成された画像のダウンロード
- クリップボードへのコピー
- 設定の復元機能

### セットアップ

#### 1. 環境変数の設定
`.env`ファイルに以下を追加：
```bash
# Google AI API Key for Gemini File Upload and Image Generation
VITE_GOOGLE_API_KEY=your_google_api_key_here

# Google Cloud Project ID for Vertex AI Image Generation
VITE_GOOGLE_PROJECT_ID=your_google_cloud_project_id_here

# Google Cloud Location for Vertex AI (default: us-central1)
VITE_GOOGLE_LOCATION=us-central1
```

#### 2. Google Cloud Projectの設定

##### Step 1: Google Cloud Projectの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. プロジェクトIDをメモ（例: `my-ai-project-123456`）

##### Step 2: Vertex AI APIの有効化
1. Google Cloud Consoleで「APIとサービス」→「ライブラリ」を開く
2. 「Vertex AI API」を検索して有効化
3. 「Imagen API」も検索して有効化

##### Step 3: 認証方法の設定

**重要**: Vertex AI Imagen APIは、APIキーではなくOAuth2認証を要求します。

###### 方法A: サービスアカウント認証情報（推奨）

1. **サービスアカウントの作成**:
   - Google Cloud Consoleで「IAM & Admin」→「サービスアカウント」を開く
   - 「サービスアカウントを作成」をクリック
   - 名前を入力（例: `imagen-api-service`）
   - 「作成して続行」をクリック

2. **権限の付与**:
   - 「役割を選択」で「Vertex AI User」を選択
   - 「完了」をクリック

3. **認証情報のダウンロード**:
   - 作成したサービスアカウントをクリック
   - 「キー」タブを開く
   - 「鍵を追加」→「新しい鍵を作成」→「JSON」を選択
   - ダウンロードされたJSONファイルを安全な場所に保存

###### 方法B: Application Default Credentials (ADC)

1. **Google Cloud CLIのインストール**:
   - [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)をインストール

2. **認証の設定**:
   ```bash
   gcloud auth application-default login
   ```

3. **プロジェクトの設定**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

##### Step 4: 環境変数ファイルの作成
1. プロジェクトのルートディレクトリに`.env`ファイルを作成
2. 以下の内容を追加（実際の値に置き換え）：

```bash
# Google AI API Key for Gemini File Upload (テキスト生成用)
VITE_GOOGLE_API_KEY=your_google_api_key_here

# Google Cloud Project ID for Vertex AI Image Generation
VITE_GOOGLE_PROJECT_ID=my-ai-project-123456

# Google Cloud Location for Vertex AI (default: us-central1)
VITE_GOOGLE_LOCATION=us-central1

# サービスアカウント認証情報ファイルのパス（方法Aを使用する場合）
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

##### Step 5: アプリケーションの再起動
1. 環境変数を設定した後、アプリケーションを再起動
2. 設定が正しく読み込まれることを確認

##### トラブルシューティング
- **401エラー: API keys are not supported**: サービスアカウント認証情報またはADCを使用
- **認証エラー**: 認証情報が正しく設定されているか確認
- **Project IDが間違っている**: Google Cloud Consoleで正しいProject IDを確認
- **APIが有効化されていない**: Vertex AI APIとImagen APIが有効化されていることを確認
- **権限エラー**: サービスアカウントに「Vertex AI User」役割が付与されているか確認

### 使用方法

#### 1. UIからの使用
1. Generative UI → Media Generation タブを開く
2. "Gemini Image Generation" セクションでプロンプトを入力
3. モデル、アスペクト比、品質、スタイルを選択
4. "画像を生成" ボタンをクリック
5. 生成された画像をダウンロードまたはコピー

#### 2. プログラムでの使用
```typescript
import { GeminiImageService } from '@/services/llm/gemini-image-service'

// サービスの初期化
const geminiImageService = new GeminiImageService()
await geminiImageService.configure(
  'your-api-key',
  'your-project-id',
  'us-central1'
)

// 単一画像生成
const response = await geminiImageService.generateImage({
  prompt: 'A beautiful sunset over mountains',
  model: 'imagen-3.0-generate-002',
  aspectRatio: '16:9',
  quality: 'standard',
  style: 'photorealistic'
})

// 複数画像生成
const multiResponse = await geminiImageService.generateMultipleImages(
  {
    prompt: 'A futuristic cityscape',
    model: 'imagen-4.0-generate-001',
    aspectRatio: '1:1',
    quality: 'hd',
    style: 'artistic'
  },
  3
)

// 利用可能なモデルを取得
const models = geminiImageService.getAvailableModels()
console.log('Available models:', models)
```

#### 3. LLM Managerとの統合
```typescript
import { LLMManager } from '@/services/llm/llm-manager'

const llmManager = new LLMManager(config)
await llmManager.initialize()

// Gemini Image Serviceの設定
await llmManager.configureGeminiImageService(
  'your-api-key',
  'your-project-id',
  'us-central1'
)

// 画像生成
const imageResponse = await llmManager.generateImage({
  prompt: 'A magical forest scene',
  model: 'imagen-3.0-generate-002',
  aspectRatio: '1:1',
  quality: 'standard'
})
```

### 推奨設定

#### 高品質画像生成
```typescript
{
  model: 'imagen-4.0-ultra-generate-001',
  quality: 'hd',
  style: 'photorealistic',
  aspectRatio: '16:9'
}
```

#### 高速生成
```typescript
{
  model: 'imagen-3.0-fast-generate-001',
  quality: 'draft',
  style: 'artistic',
  aspectRatio: '1:1'
}
```

#### アート風画像
```typescript
{
  model: 'imagen-3.0-generate-002',
  quality: 'standard',
  style: 'artistic',
  aspectRatio: '4:3'
}
```

## Llama.cpp Integration

### 概要
llama.cppのローカルLLMモデルをArmisに統合しました。これにより、Hugging Faceから直接モデルをダウンロードして、ローカルで高性能なAIモデルを使用できるようになります。

### 主な機能

#### 1. Hugging Faceモデルダウンロード
- **ワンクリックダウンロード**: Settings-ModelsからHugging Faceのモデルを直接ダウンロード
- **リアルタイム進捗表示**: ダウンロード進捗の詳細表示（速度、残り時間、パーセンテージ）
- **検索機能**: モデル名やタグで検索可能
- **モデル情報表示**: サイズ、量子化レベル、ダウンロード数、説明文

#### 2. Llama.cppモデル管理
- ローカルモデルの一覧表示と切り替え
- モデル設定の調整（温度、トークン数、コンテキストサイズなど）
- 複数のモデルを並行してダウンロード

#### 3. 高性能ローカル推論
- GGUF形式のモデルサポート
- GPU/CPU最適化
- ストリーミング生成
- チャット形式での対話

#### 4. Electron統合
- ネイティブファイルシステムアクセス
- バックグラウンドダウンロード
- 進捗通知

### 使用方法

#### 1. アプリケーションの起動
```bash
# 開発環境
npm run dev
npm run electron-dev

# 本番環境
npm run build
npm run electron
```

#### 2. モデルのダウンロード
1. Settings → Models → LlamaCpp タブを開く
2. "Hugging Face" タブを選択
3. 検索ボックスにモデル名を入力（例: "llama", "mistral", "qwen"）
4. 目的のモデルを見つけて "Download" ボタンをクリック
5. ダウンロード進捗を確認
6. 完了後 "Load" ボタンでモデルを読み込み

#### 3. プログラムでの使用
```typescript
import { LLMManager } from '@/services/llm/llm-manager'

const llmManager = new LLMManager(config)
await llmManager.initialize()

// LlamaCppに切り替え
await llmManager.switchToLlamaCpp()

// モデルを読み込み
await llmManager.loadLlamaCppModel('./models/llama-2-7b-chat.gguf')

// テキスト生成
const response = await llmManager.generateResponse('こんにちは！')
console.log(response.text)

// 設定の調整
await llmManager.updateLlamaCppConfig({
  temperature: 0.8,
  maxTokens: 4096,
  threads: 8
})
```

#### 4. Hugging Faceモデル検索
```typescript
// モデル検索
const models = await llmManager.searchHuggingFaceModels('llama', 20)

// モデル詳細取得
const modelDetails = await llmManager.getHuggingFaceModelDetails('TheBloke/Llama-2-7B-Chat-GGUF')

// モデルダウンロード
await llmManager.downloadHuggingFaceModel(
  'TheBloke/Llama-2-7B-Chat-GGUF',
  (progress) => console.log(`Download: ${progress.percentage}%`),
  (path) => console.log(`Completed: ${path}`),
  (error) => console.error(`Error: ${error}`)
)
```

### 推奨モデル

#### 軽量モデル（1-3GB）
- `TheBloke/Llama-2-7B-Chat-GGUF` - 汎用チャット
- `TheBloke/Mistral-7B-Instruct-v0.2-GGUF` - 高性能軽量
- `Qwen/Qwen2.5-1.5B-GGUF` - 超軽量

#### 高性能モデル（7-13GB）
- `TheBloke/Llama-2-13B-Chat-GGUF` - 高精度
- `TheBloke/Mistral-7B-Instruct-v0.2-GGUF` - バランス型
- `Qwen/Qwen2.5-7B-GGUF` - 多言語対応

#### 専門モデル
- `TheBloke/CodeLlama-7B-Python-GGUF` - プログラミング
- `TheBloke/Llama-2-7B-Chat-GGUF` - 会話
- `TheBloke/Llama-2-7B-GGUF` - 汎用

### 設定オプション

#### モデル設定
- **Temperature**: 0.0-2.0（創造性の調整）
- **Max Tokens**: 512-8192（最大出力トークン数）
- **Context Size**: 2048-16384（コンテキストウィンドウ）
- **Threads**: 1-16（CPUスレッド数）
- **GPU Layers**: 0-100（GPU使用レイヤー数）

#### パフォーマンス最適化
- 軽量モデル: 4-8スレッド
- 中規模モデル: 8-12スレッド
- 大規模モデル: 12-16スレッド
- GPU使用時: GPU Layersを設定

## Ollama Integration

### 概要
OllamaのローカルLLMモデルをArmisに統合しました。これにより、インターネット接続なしでローカルでAIモデルを使用できるようになります。初期モデルとして`gemma3:1b`が設定されています。

### 主な機能

#### 1. 自動モデルダウンロード
- **gemma3:1bの自動ダウンロード**: アプリケーション起動時に自動的にダウンロード
- **進捗表示**: リアルタイムのダウンロード進捗表示
- **エラーハンドリング**: ダウンロード失敗時の適切なエラー処理

#### 2. Ollamaモデル管理
- モデルの一覧表示と切り替え
- 新しいモデルのダウンロード（進捗表示付き）
- モデル情報の表示（サイズ、更新日時など）

#### 3. ローカルLLM実行
- テキスト生成
- ストリーミング生成
- チャット形式での対話

#### 4. LLMマネージャーとの統合
- OllamaとLlamaサービスの切り替え
- 統一されたAPIインターフェース
- エラーハンドリングとフォールバック

### 使用方法

#### 1. Ollamaのインストールと起動
```bash
# Ollamaのインストール（macOS）
curl -fsSL https://ollama.ai/install.sh | sh

# Ollamaサービスの起動
ollama serve

# 注意: gemma3:1bは自動的にダウンロードされます
```

#### 2. アプリケーションでの使用
```typescript
import { OllamaService } from '@/services/llm/ollama-service'

// Ollamaサービスの初期化（gemma3:1bが自動ダウンロードされます）
const ollamaService = new OllamaService({
  defaultModel: 'gemma3:1b',
  baseUrl: 'http://localhost:11434'
})

// 初期化時にgemma3:1bが存在しない場合は自動ダウンロード
await ollamaService.initialize()

// 基本的なテキスト生成
const response = await ollamaService.generate('こんにちは！')
console.log(response.response)

// ストリーミング生成
await ollamaService.generateStream(
  '日本の文化について教えてください。',
  {},
  (chunk) => console.log(chunk.response)
)

// 進捗表示付きモデルダウンロード
await ollamaService.pullModelWithProgress(
  'llama3.1:8b',
  (progress, message) => console.log(`${message} (${progress}%)`)
)
```

#### 3. LLMマネージャーとの統合
```typescript
import { LLMManager } from '@/services/llm/llm-manager'

const llmManager = new LLMManager(config)
await llmManager.initialize()

// Ollamaに切り替え
await llmManager.switchToOllama()

// モデルを切り替え
await llmManager.setOllamaModel('llama3.1:8b')

// ユーザーリクエストの処理
const response = await llmManager.processUserRequest('AIについて教えてください。')
```

#### 4. UIでのモデル管理
設定画面の「Ollama」タブで以下の操作が可能です：
- インストール済みモデルの一覧表示
- モデルの切り替え
- 新しいモデルのダウンロード
- 人気モデルの一覧表示

### 利用可能なモデル

#### 人気モデル
- **gemma3:1b** - 軽量で高速なモデル（初期設定）
- **gemma3:4b** - バランスの取れた性能
- **gemma3:12b** - 高精度な応答
- **gemma3:27b** - 最高性能
- **llama3.1:8b** - Metaの最新モデル
- **llama3.1:70b** - 大規模モデル
- **qwen3:4b** - Alibabaの高性能モデル
- **deepseek-r1:7b** - 推論に特化したモデル

#### 特殊用途モデル
- **llava:7b** - 画像理解対応
- **llava:13b** - 高精度画像理解
- **llava:34b** - 最高精度画像理解

### 実装されたコンポーネント

#### 1. OllamaService
- Ollama APIとの通信
- モデル管理機能
- テキスト生成とストリーミング
- エラーハンドリング

#### 2. OllamaModelManager
- モデル管理UI
- ダウンロード進捗表示
- モデル切り替え機能

## タスク実行表示機能

### 概要
特別なタスク実行時にチャット上でタスク内容を表示し、シマーエフェクトで文章を表示する機能を実装しました。これにより、ユーザーは現在実行中のタスクの進捗をリアルタイムで確認できます。

### 主な機能

#### 1. タスク実行表示
- **リアルタイム進捗表示**: タスクの実行状況をリアルタイムで表示
- **シマーエフェクト**: タスクタイトルと説明文にシマーエフェクトを適用
- **ステータス管理**: 待機中、実行中、完了、エラーの状態を視覚的に表示
- **進捗バー**: パーセンテージとステップ別の進捗表示

#### 2. タスクタイプ別アイコン
- **分析タスク**: Brainアイコン
- **生成タスク**: Zapアイコン
- **処理タスク**: Cpuアイコン
- **検索タスク**: Searchアイコン
- **計算タスク**: Codeアイコン
- **最適化タスク**: Targetアイコン
- **学習タスク**: Lightbulbアイコン
- **カスタムタスク**: Settingsアイコン

#### 3. 詳細情報表示
- **経過時間**: タスク開始からの経過時間
- **予想時間**: 完了までの予想時間
- **残り時間**: 現在の進捗から計算された残り時間
- **メタデータ**: 使用モデル、複雑度、優先度、リソース情報

#### 4. 自動管理機能
- **自動削除**: 完了したタスクは10秒後に自動削除
- **手動クリア**: 完了済みタスクの一括削除
- **エラーハンドリング**: エラー発生時の適切な表示

### 使用方法

#### 1. 基本的な使用
```typescript
import { useTaskExecution } from '@/hooks/useTaskExecution'
import { TaskExecutionDisplay } from '@/components/chat/TaskExecutionDisplay'

// タスク実行管理フックを使用
const {
  activeTasks,
  addTask,
  updateTask,
  removeTask,
  clearCompletedTasks
} = useTaskExecution()

// タスクを開始
const taskId = addTask({
  taskType: 'analysis',
  title: 'データ分析タスク',
  description: 'ユーザーデータの詳細分析を実行中',
  status: 'pending',
  progress: 0,
  estimatedDuration: 60000,
  metadata: {
    model: 'GPT-4',
    complexity: 'moderate',
    priority: 'medium',
    resources: ['Database', 'AI Model']
  }
})

// 進捗を更新
updateTask(taskId, {
  status: 'running',
  progress: 50,
  currentStep: 'データ処理中'
})

// タスクを完了
updateTask(taskId, {
  status: 'completed',
  progress: 100
})
```

#### 2. チャットコンポーネントでの統合
```typescript
// ChatWindowコンポーネントで自動的にタスク表示が有効になります
// 特別なタスク実行時（Sequential Thinking、ファイル処理など）に
// 自動的にタスク実行表示が表示されます
```

#### 3. カスタムタスクの追加
```typescript
// 独自のタスクを追加する場合
const customTaskId = addTask({
  taskType: 'custom',
  title: 'カスタム処理',
  description: '独自の処理を実行中',
  status: 'pending',
  progress: 0,
  metadata: {
    complexity: 'simple',
    priority: 'low'
  }
})
```

### 実装されたコンポーネント

#### 1. TaskExecutionDisplay
- タスク実行状況の表示
- シマーエフェクト付きテキスト表示
- 進捗バーとステータス表示
- メタデータ表示

#### 2. useTaskExecution
- タスク実行状態の管理
- タスクの追加・更新・削除
- 自動削除機能
- リアルタイム更新

#### 3. 統合機能
- ChatWindowコンポーネントとの統合
- 自動タスク管理
- エラーハンドリング

## ファイル作成ローダー機能

### 概要
ファイル作成時にCircle Spinnerのmotionとファイル名を表示する機能を実装しました。これにより、ユーザーはファイル作成の進捗をリアルタイムで視覚的に確認できます。

### 主な機能

#### 1. ファイル作成表示
- **Circle Spinner Motion**: ファイル作成中に回転するスピナーアニメーション
- **シマーエフェクト**: ファイル名にシマーエフェクトを適用
- **ステータス管理**: 作成中、処理中、完了、エラーの状態を視覚的に表示
- **進捗バー**: パーセンテージとステップ別の進捗表示

#### 2. ファイルタイプ別アイコン
- **テキストファイル**: FileTextアイコン
- **画像ファイル**: Imageアイコン
- **動画ファイル**: Videoアイコン
- **音声ファイル**: Musicアイコン
- **コードファイル**: Codeアイコン
- **アーカイブファイル**: Archiveアイコン
- **ドキュメントファイル**: FileTextアイコン
- **その他ファイル**: Fileアイコン

#### 3. 詳細情報表示
- **経過時間**: ファイル作成開始からの経過時間
- **予想時間**: 完了までの予想時間
- **残り時間**: 現在の進捗から計算された残り時間
- **メタデータ**: ファイルサイズ、フォーマット、品質、圧縮情報

#### 4. 自動管理機能
- **自動削除**: 完了したファイル作成は8秒後に自動削除
- **手動クリア**: 完了済みファイル作成の一括削除
- **エラーハンドリング**: エラー発生時の適切な表示

### 使用方法

#### 1. 基本的な使用
```typescript
import { useFileCreation } from '@/hooks/useFileCreation'
import { FileCreationLoader } from '@/components/ui/file-creation-loader'

// ファイル作成管理フックを使用
const {
  activeFileCreations,
  addFileCreation,
  updateFileCreation,
  removeFileCreation,
  clearCompletedFileCreations
} = useFileCreation()

// ファイル作成を開始
const fileCreationId = addFileCreation({
  fileName: 'generated-image.png',
  fileType: 'image',
  status: 'creating',
  progress: 0,
  estimatedDuration: 30000,
  metadata: {
    format: 'png',
    quality: 'high',
    compression: 'lossless'
  }
})

// 進捗を更新
updateFileCreation(fileCreationId, {
  status: 'processing',
  progress: 50,
  currentStep: '画像生成中'
})

// ファイル作成を完了
updateFileCreation(fileCreationId, {
  status: 'completed',
  progress: 100
})
```

#### 2. チャットコンポーネントでの統合
```typescript
// ChatWindowコンポーネントで自動的にファイル作成表示が有効になります
// ファイル生成時（画像生成、動画作成、ドキュメント作成など）に
// 自動的にファイル作成表示が表示されます
```

#### 3. ファイルタイプ別の作成
```typescript
// 画像ファイル作成
const imageFileId = addFileCreation({
  fileName: 'ai-generated-image.png',
  fileType: 'image',
  status: 'creating',
  progress: 0,
  estimatedDuration: 30000,
  metadata: {
    format: 'png',
    quality: 'high',
    compression: 'lossless'
  }
})

// 動画ファイル作成
const videoFileId = addFileCreation({
  fileName: 'output-video.mp4',
  fileType: 'video',
  status: 'creating',
  progress: 0,
  estimatedDuration: 120000, // 2分
  metadata: {
    format: 'mp4',
    quality: '1080p',
    compression: 'h.264'
  }
})
```

### 実装されたコンポーネント

#### 1. FileCreationLoader
- ファイル作成状況の表示
- Circle Spinnerのmotionアニメーション
- シマーエフェクト付きファイル名表示
- 進捗バーとステータス表示
- メタデータ表示

#### 2. useFileCreation
- ファイル作成状態の管理
- ファイル作成の追加・更新・削除
- 自動削除機能
- リアルタイム更新

#### 3. 統合機能
- ChatWindowコンポーネントとの統合
- 自動ファイル作成管理
- エラーハンドリング

## Material Icon Theme統合

### 概要
[Material Icon Theme](https://www.npmjs.com/package/material-icon-theme)を使用して、高品質なファイルアイコンを表示する機能を実装しました。VS CodeのMaterial Icon Themeから提供される豊富なアイコンセットにより、様々なファイルタイプに対応した美しいアイコンを表示できます。

### 主な機能

#### 1. ファイル拡張子別アイコン
- **プログラミング言語**: TypeScript、JavaScript、Python、Java、C++、Go、Rust、Swift、Kotlin、Scala、R、MATLAB、SQL、Perl、Shell、PowerShell、Batch、Docker
- **ウェブ技術**: HTML、CSS、SCSS、Sass、Less、Vue、Svelte、Astro
- **データファイル**: JSON、XML、CSV、YAML、TOML、INI、データベースファイル
- **ドキュメント**: PDF、Word、Excel、PowerPoint、Markdown、テキストファイル
- **メディアファイル**: 画像（PNG、JPG、GIF、SVG、WebP、AVIF）、動画（MP4、AVI、MOV、WebM）、音声（MP3、WAV、FLAC、AAC、OGG）
- **アーカイブ**: ZIP、RAR、7Z、TAR、GZ、BZ2、XZ
- **設定ファイル**: .env、.gitignore、package.json、tsconfig.json、webpack.config.js、Dockerfile

#### 2. アイコンパック対応
- **Angular**: Angularプロジェクト用のアイコン
- **React**: Reactプロジェクト用のアイコン
- **Vue**: Vueプロジェクト用のアイコン
- **NestJS**: NestJSプロジェクト用のアイコン
- **その他**: 様々なフレームワークやツールに対応

#### 3. 動的アイコン生成
- **マニフェスト生成**: Material Icon Themeのマニフェストを動的に生成
- **フォールバック機能**: アイコンが見つからない場合の適切なフォールバック
- **エラーハンドリング**: アイコン読み込みエラーの適切な処理

### 使用方法

#### 1. 基本的な使用
```typescript
import { MaterialFileIcon, AutoFileIcon, TypeFileIcon } from '@/components/ui/material-file-icon'

// ファイル名から自動的にアイコンを決定
<MaterialFileIcon fileName="example.ts" size="md" />

// ファイルタイプからアイコンを表示
<MaterialFileIcon fileType="image" size="md" />

// 自動ファイルアイコン（ファイル名指定）
<AutoFileIcon fileName="component.tsx" size="lg" />

// タイプファイルアイコン（ファイルタイプ指定）
<TypeFileIcon fileType="code" size="sm" />
```

#### 2. ユーティリティ関数の使用
```typescript
import { 
  getFileIconProps, 
  getFileTypeIconName, 
  getIconPath,
  getAvailableIconPacks,
  changeIconPack 
} from '@/utils/material-icons'

// ファイル名からアイコン情報を取得
const iconProps = getFileIconProps('example.ts')
console.log(iconProps)
// 出力: { iconName: 'typescript', iconPath: '/node_modules/material-icon-theme/icons/typescript.svg', alt: 'example.ts icon' }

// ファイルタイプからアイコン名を取得
const iconName = getFileTypeIconName('code')
console.log(iconName) // 'typescript'

// アイコンパスを取得
const iconPath = getIconPath('typescript')
console.log(iconPath) // '/node_modules/material-icon-theme/icons/typescript.svg'

// 利用可能なアイコンパックを取得
const iconPacks = getAvailableIconPacks()
console.log(iconPacks) // ['angular', 'react', 'vue', 'nest', ...]

// アイコンパックを変更
const success = changeIconPack('react')
console.log(success) // true
```

#### 3. ファイル作成ローダーでの使用
```typescript
// FileCreationLoaderコンポーネントで自動的にMaterial Icon Themeが使用されます
const fileCreationId = addFileCreation({
  fileName: 'generated-image.png',
  fileType: 'image',
  status: 'creating',
  progress: 0,
  estimatedDuration: 30000,
  metadata: {
    format: 'png',
    quality: 'high',
    compression: 'lossless'
  }
})
```

### 実装されたコンポーネント

#### 1. MaterialFileIcon
- Material Icon Themeを使用したファイルアイコン表示
- ファイル名またはファイルタイプから自動的にアイコンを決定
- サイズ指定（sm、md、lg）
- エラー時のフォールバック機能

#### 2. AutoFileIcon
- ファイル名から自動的にアイコンを決定するコンポーネント
- ファイル拡張子に基づく適切なアイコン表示

#### 3. TypeFileIcon
- ファイルタイプからアイコンを表示するコンポーネント
- 汎用的なファイルタイプ表示

#### 4. ユーティリティ関数
- getFileIconProps: ファイル名からアイコン情報を取得
- getFileTypeIconName: ファイルタイプからアイコン名を取得
- getIconPath: アイコンファイルのパスを取得
- getAvailableIconPacks: 利用可能なアイコンパックを取得
- changeIconPack: アイコンパックを変更

### 対応ファイル拡張子

#### プログラミング言語
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp)
- C# (.cs)
- Go (.go)
- Rust (.rs)
- Swift (.swift)
- Kotlin (.kt)
- Scala (.scala)
- R (.r)
- MATLAB (.m)
- SQL (.sql)
- Perl (.pl)
- Shell (.sh)
- PowerShell (.ps1)
- Batch (.bat)
- Dockerfile

#### ウェブ技術
- HTML (.html, .htm)
- CSS (.css)
- SCSS (.scss)
- Sass (.sass)
- Less (.less)
- Vue (.vue)
- Svelte (.svelte)
- Astro (.astro)

#### データファイル
- JSON (.json)
- XML (.xml)
- CSV (.csv)
- YAML (.yaml, .yml)
- TOML (.toml)
- INI (.ini)
- データベース (.db, .sqlite, .sqlite3, .mdb, .accdb)

#### ドキュメント
- PDF (.pdf)
- Word (.doc, .docx)
- Excel (.xls, .xlsx)
- PowerPoint (.ppt, .pptx)
- Markdown (.md)
- テキスト (.txt)
- LibreOffice (.odt, .ods, .odp)

#### メディアファイル
- 画像 (.png, .jpg, .jpeg, .gif, .svg, .ico, .bmp, .tiff, .webp, .avif)
- 動画 (.mp4, .avi, .mov, .wmv, .flv, .webm, .mkv, .m4v)
- 音声 (.mp3, .wav, .flac, .aac, .ogg, .wma, .m4a)

#### アーカイブ
- ZIP (.zip)
- RAR (.rar)
- 7Z (.7z)
- TAR (.tar)
- GZ (.gz)
- BZ2 (.bz2)
- XZ (.xz)

#### 設定ファイル
- 環境変数 (.env)
- Git (.gitignore, .gitattributes)
- 設定 (.editorconfig, .eslintrc, .prettierrc, .babelrc)
- ビルドツール (webpack, rollup, vite)
- パッケージ管理 (package.json, package-lock.json, yarn.lock, pnpm-lock.yaml)
- 証明書 (.key, .pem, .crt, .cer, .p12, .pfx)

#### 3. LLMManager統合
- サービス切り替え機能
- 統一されたAPI
- フォールバック機能

### 使用例

詳細な使用例は `src/examples/ollama-usage.ts` を参照してください：

```typescript
import { runOllamaExamples } from '@/examples/ollama-usage'

// すべての例を実行
await runOllamaExamples()

// 個別の例を実行
import { runBasicExample, runModelManagementExample } from '@/examples/ollama-usage'
await runBasicExample()
await runModelManagementExample()
```

### トラブルシューティング

#### 1. Ollamaが起動していない場合
```
Error: Ollama is not running or not accessible at http://localhost:11434
```
**解決方法**: `ollama serve` を実行してOllamaサービスを起動してください。

#### 2. モデルが見つからない場合
```
Error: Model not found
```
**解決方法**: gemma3:1bは自動的にダウンロードされます。他のモデルは設定画面の「Ollama」タブでダウンロードしてください。

#### 3. ダウンロードが失敗する場合
```
Error: Failed to download model
```
**解決方法**: 
- インターネット接続を確認してください
- 十分なディスク容量があることを確認してください
- ファイアウォールの設定を確認してください

#### 4. メモリ不足の場合
```
Error: Out of memory
```
**解決方法**: より小さなモデル（例：gemma3:1b）を使用するか、システムのメモリを増やしてください。

## Gemini File Upload & Chat

### 概要
[参考記事](https://qiita.com/shokkaa/items/b137366cca35ce331c4d)に基づくGemini APIファイルアップロード機能を実装しました。これにより、画像やドキュメントをGeminiにアップロードして、AIとチャットできるようになります。

### 主な機能

#### 1. ファイルアップロード
- 画像、PDF、テキストファイルのアップロード
- 自動MIMEタイプ判定
- アップロード進捗の表示

#### 2. ファイルについてのチャット
- 単一質問の送信
- 複数質問の連続実行
- トークン使用量の表示

#### 3. 統合されたUI
- 直感的なファイルアップロードインターフェース
- リアルタイムのチャット応答
- ローディング状態の表示

### 使用方法

#### 1. 環境変数の設定
```bash
# .envファイルを作成
VITE_GOOGLE_API_KEY=your_google_api_key_here
```

#### 2. アプリケーションでの使用
```typescript
import { GeminiFileUpload } from '@/components/generative-ui/GeminiFileUpload'

// 使用例
<GeminiFileUpload 
  apiKey={process.env.VITE_GOOGLE_API_KEY}
  model="gemini-1.5-flash"
/>
```

#### 3. プログラムでの使用
```typescript
import { GeminiFileService } from '@/services/llm/gemini-file-service'

const geminiService = new GeminiFileService()
await geminiService.configure(apiKey, 'gemini-1.5-flash')

// ファイルアップロード
const uploadResponse = await geminiService.uploadFile(filePath, mimeType, displayName)

// ファイルについてチャット
const response = await geminiService.chatAboutFile(uploadResponse.file.uri, question)
```

### 実装されたコンポーネント

#### 1. GeminiFileService
- ファイルアップロード機能
- チャット機能
- 複数質問の連続実行
- MIMEタイプ自動判定

#### 2. GeminiFileTools
- LLM Managerとの統合
- ツールベースの実行
- エラーハンドリング

#### 3. GeminiFileUpload UI
- ファイル選択とアップロード
- 質問入力と送信
- 応答表示
- ローディング状態

### 参考記事
- [Gemini API ― File Upload/画像認識](https://qiita.com/shokkaa/items/b137366cca35ce331c4d)

## 改善されたストリーミング機能

### 概要
AI SDKの最新機能を活用した高品質なストリーミング機能を実装しました。これにより、チャットの応答がより滑らかで高速になり、ユーザー体験が大幅に向上します。

### 主な改善点

#### 1. AI SDK 5の最新ストリーミング機能
- `streamText`関数を使用した効率的なストリーミング
- 低レイテンシーでの応答表示
- エラーハンドリングの改善

#### 2. 新しいストリーミングメソッド
```typescript
// チャット履歴を使用したストリーミング
await aiSDKService.streamChatResponse(
  messages,
  (chunk) => console.log('Received:', chunk),
  (fullResponse) => console.log('Complete:', fullResponse),
  (error) => console.error('Error:', error)
)

// 高速ストリーミング
await aiSDKService.streamFastResponse(
  prompt,
  (chunk) => console.log('Fast chunk:', chunk),
  { temperature: 0.8, maxTokens: 100 }
)
```

#### 3. 改善されたUIコンポーネント
- 滑らかなタイピングアニメーション
- リアルタイムのストリーミング表示
- エラー状態の適切な表示

#### 4. エラーハンドリングの強化
- レート制限の検出
- APIクォータ超過の検出
- ネットワークエラーの適切な処理
- 日本語でのエラーメッセージ

## Generative User Interfaces

### 概要
AI SDKのGenerative User Interfaces機能を実装しました。これにより、AIがテキストだけでなく、動的にUIコンポーネントを生成できるようになります。

### 実装された機能

#### 1. ツール定義
以下のツールが実装されています：

- **天気情報ツール**: 指定された場所の天気情報を取得
- **株価情報ツール**: 株式銘柄の価格情報を取得
- **画像生成ツール**: プロンプトから画像を生成
- **翻訳ツール**: テキストを指定された言語に翻訳
- **計算ツール**: 数学的な計算を実行
- **検索ツール**: Web検索を実行して情報を取得

#### 2. Reactコンポーネント
各ツールに対応する美しいUIコンポーネント：

- `Weather`: 天気情報の表示
- `Stock`: 株価情報の表示
- `ImageGenerator`: 生成された画像の表示
- `Translation`: 翻訳結果の表示
- `Calculator`: 計算結果の表示
- `SearchResults`: 検索結果の表示

#### 3. Generative UIチャット
動的にUIを生成するチャットインターフェース：

```typescript
import { GenerativeUIChat } from '@/components/generative-ui/GenerativeUIChat'

// 使用例
<GenerativeUIChat />
```

### 使用方法

#### 1. 基本的なセットアップ
```typescript
import { generativeUIService } from '@/services/generative-ui/generative-ui-service'

// プロバイダーを設定
await generativeUIService.configureProvider({
  providerId: 'openai',
  modelId: 'gpt-4o',
  apiKey: 'your-api-key'
})
```

#### 2. Generative UIチャットの使用
```typescript
// ユーザーが「東京の天気を教えて」と入力すると、
// AIが自動的に天気ツールを選択し、Weatherコンポーネントを表示
```

#### 3. カスタムツールの追加
```typescript
// src/services/tools/generative-ui-tools.ts に新しいツールを追加
export const customTool = createTool({
  description: 'カスタムツールの説明',
  inputSchema: z.object({
    // 入力スキーマ
  }),
  execute: async function ({ /* パラメータ */ }) {
    // ツールの実行ロジック
    return { /* 結果 */ }
  },
})
```

### 使用例

#### 天気情報の取得
```
ユーザー: 「東京の天気を教えてください」
AI: 天気ツールを使用して東京の天気情報を取得し、Weatherコンポーネントを表示
```

#### 株価情報の取得
```
ユーザー: 「Appleの株価を教えてください」
AI: 株価ツールを使用してAAPLの株価情報を取得し、Stockコンポーネントを表示
```

#### 画像生成
```
ユーザー: 「美しい夕日を背景にした山の風景を生成してください」
AI: 画像生成ツールを使用して風景画像を作成し、ImageGeneratorコンポーネントを表示
```

### 技術的な実装

#### 1. ツール定義
```typescript
// src/services/tools/generative-ui-tools.ts
export const weatherTool = createTool({
  description: '指定された場所の天気情報を表示します',
  inputSchema: z.object({
    location: z.string().describe('天気を取得する場所'),
  }),
  execute: async function ({ location }) {
    // 天気情報を取得するロジック
    return weatherData
  },
})
```

#### 2. UIコンポーネント
```typescript
// src/components/generative-ui/Weather.tsx
export const Weather: React.FC<WeatherProps> = ({ location, temperature, condition }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
      {/* 美しい天気表示UI */}
    </div>
  )
}
```

#### 3. サービス統合
```typescript
// src/services/generative-ui/generative-ui-service.ts
export class GenerativeUIService {
  async streamGenerativeUI(messages, onChunk, onToolCall, onComplete, onError) {
    // AI SDKを使用してツール呼び出しとUI生成を処理
  }
}
```

### パフォーマンスの特徴

1. **動的UI生成**: AIが適切なツールを選択してUIを生成
2. **リアルタイム更新**: ツール実行中にリアルタイムで状態を更新
3. **エラーハンドリング**: ツール実行エラーの適切な処理
4. **レスポンシブデザイン**: モバイルとデスクトップに対応

### 対応プロバイダー

- OpenAI (GPT-4o, GPT-4o Mini, GPT-4 Turbo)
- Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- Google (Gemini 2.0 Flash Exp, Gemini 1.5 Pro)

### 今後の改善予定

- [ ] より多くのツールの追加
- [ ] カスタムツールの作成UI
- [ ] ツール実行の履歴管理
- [ ] より高度なUIコンポーネント
- [ ] リアルタイムコラボレーション機能

### 使用方法

#### 基本的なストリーミングチャット
```typescript
import { sendEnhancedStreamingChat } from '@/services/tools/armis-tools'

const messages = [
  { role: 'user', content: 'こんにちは！' }
]

await sendEnhancedStreamingChat(
  messages,
  (chunk) => {
    // ストリーミングチャンクを処理
    setResponse(prev => prev + chunk)
  },
  (fullResponse) => {
    // 完了時の処理
    console.log('Complete response:', fullResponse)
  },
  (error) => {
    // エラー処理
    console.error('Error:', error.message)
  }
)
```

#### 高速ストリーミング
```typescript
import { sendFastStreamingChat } from '@/services/tools/armis-tools'

await sendFastStreamingChat(
  '短い詩を作ってください',
  (chunk) => console.log(chunk),
  (fullResponse) => console.log('Complete:', fullResponse),
  (error) => console.error('Error:', error),
  {
    temperature: 0.8,
    maxTokens: 100,
    systemPrompt: 'あなたは創造的な詩人です。'
  }
)
```

### 設定

#### AIプロバイダーの設定
```typescript
import { configureAIProvider } from '@/services/tools/armis-tools'

await configureAIProvider(
  'anthropic',
  'claude-3.5-sonnet',
  'your-api-key',
  {
    temperature: 0.7,
    maxOutputTokens: 4096
  }
)
```

#### ストリーミング状態の確認
```typescript
import { getStreamingStatus } from '@/services/tools/armis-tools'

const status = getStreamingStatus()
console.log('Streaming supported:', status.isSupported)
console.log('Provider info:', status.providerInfo)
```

### パフォーマンスの改善

1. **低レイテンシー**: 最初のチャンクを即座に表示
2. **滑らかなアニメーション**: タイピング効果の改善
3. **エラー回復**: 適切なエラーハンドリングとリトライ機能
4. **メモリ効率**: 効率的なストリーミング処理

### 対応プロバイダー

- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude 3.5 Sonnet, Claude 3.5 Haiku)
- Google (Gemini 2.5 Pro, Gemini 2.5 Flash)
- xAI (Grok)
- DeepSeek
- Ollama (ローカル)

### トラブルシューティング

#### よくある問題

1. **ストリーミングが開始されない**
   - APIキーが正しく設定されているか確認
   - プロバイダーが有効になっているか確認

2. **エラーメッセージが表示される**
   - エラーメッセージを確認し、適切な対処を行う
   - レート制限やクォータ超過の場合はしばらく待ってから再試行

3. **応答が遅い**
   - より高速なモデルに切り替える
   - ネットワーク接続を確認

4. **Generative UIが動作しない**
   - プロバイダーが正しく設定されているか確認
   - ツールが正しく定義されているか確認

### 今後の改善予定

- [ ] ストリーミングの中断・再開機能
- [ ] 複数モデルでの並列ストリーミング
- [ ] ストリーミング品質の動的調整
- [ ] より詳細なパフォーマンスメトリクス
- [ ] より多くのGenerative UIツール
- [ ] カスタムツール作成UI

## TTS API Reference

### TTSService Interface

```typescript
interface TTSService {
  synthesize(text: string, options?: TTSOptions): Promise<TTSResult>
  getAvailableSpeakers(): Promise<TTSSpeaker[]>
  isAvailable(): boolean
  getSupportedFormats(): string[]
  getSupportedLanguages(): string[]
}
```

### TTSOptions

```typescript
interface TTSOptions {
  speaker?: TTSSpeakerConfig
  format?: 'wav' | 'mp3' | 'ogg'
  sampleRate?: number
  channels?: number
  speed?: number
  pitch?: number
  volume?: number
}
```

### TTSResult

```typescript
interface TTSResult {
  audioData: ArrayBuffer
  format: string
  duration?: number
  sampleRate?: number
  channels?: number
}
```

## TTS Notes

- TTS models only accept text input and generate audio output
- The context window limit for TTS sessions is 32,000 tokens
- Audio is generated in WAV format at 24kHz sample rate
- The TTS feature is currently in preview

### Supported TTS Providers

- **Google Gemini TTS**: High-quality text-to-speech with multiple voices
- **OpenAI TTS**: Professional-grade speech synthesis
- **Inworld AI TTS**: Enterprise-grade TTS with multiple quality models (TTS-1, TTS-1 Max, TTS-1 HD)
- **Local Inworld AI TTS**: Completely free, offline TTS using local models (TTS-1 Local, TTS-1 Max Local)
- **Microsoft VibeVoice**: Multi-language TTS with natural voice quality
- **Web Speech API**: Browser-based speech synthesis (fallback)

### VibeVoice TTS Features

- **Multi-language Support**: Japanese, English, Chinese, Korean, Spanish, French, German
- **Natural Voice Quality**: High-quality speech synthesis
- **Customizable Parameters**: Speed, pitch, volume control
- **Voice Styles**: Different voice characteristics for various use cases

### Inworld AI TTS Setup

1. **Get Inworld AI API Key**:
   - Visit [Inworld Studio](https://studio.inworld.ai/)
   - Sign up and create an account
   - Click the **Get API Key** shortcut in the Overview tab, or go to **Settings > API Keys**
   - Generate a Runtime API key
   - Copy the Base64 credentials

2. **Configure API Key in Settings** (Recommended):
   - Open Armis Settings (⚙️ icon)
   - Go to "API Keys" tab
   - Find "Inworld AI" section
   - Enter your Base64 API key
   - Click "Verify" to test the connection
   - Save the settings

3. **Alternative: Environment Variable**:
   ```bash
   # Environment variable
   export INWORLD_API_KEY='your-base64-api-key-here'
   
   # Or in .env file
   VITE_INWORLD_API_KEY='your-base64-api-key-here'
   ```

4. **Enable Inworld AI in Settings**:
   - Go to Settings → Audio Generation
   - Select "Inworld AI (TTS)" as provider
   - Choose your preferred voice (Ashley, Alex, Hades)

### Inworld AI Usage Example

```typescript
import { createTTSManager } from './services/tts/tts-manager'

const ttsManager = createTTSManager({
  primaryService: 'inworld',
  inworldApiKey: 'your_api_key_here'
})

const result = await ttsManager.synthesize('Hello, world!', {
  speaker: {
    voiceName: 'Ashley',
    language: 'en'
  },
  format: 'wav',
  speed: 1.0,
  sampleRate: 24000
})
```
```

### Inworld AI Features

- **High-Quality Voices**: Natural-sounding speech synthesis
- **Multiple Voice Options**: Ashley (female), Alex (male), Hades (deep male)
- **Customizable Parameters**: Speed, pitch, and format control
- **24kHz Sample Rate**: High-quality audio output
- **Multiple Formats**: WAV, MP3, and OGG support

## Local Inworld AI TTS Setup (Completely Free & Offline)

### Prerequisites
- Python 3.9+ installed
- Git installed
- GPU recommended (NVIDIA RTX with 8GB+ VRAM)
- 10GB+ free disk space for models

### Automatic Setup
The local TTS setup is automatic when you first use it:

1. Open Armis Settings (⚙️ icon)
2. Go to "Generation" tab
3. Under "Audio Generation", select "Local Inworld AI (TTS) - Free"
4. The system will automatically:
   - Download Inworld TTS source code
   - Install Python dependencies
   - Download pre-trained models
   - Configure the local service

### Manual Setup (Optional)
You can also run the setup manually:

```bash
# Run the setup script
npm run tts:local-setup

# Test the setup
npm run tts:local-test
```

### Local Inworld AI Usage Example

```typescript
import { createTTSManager } from './services/tts/tts-manager'

const ttsManager = createTTSManager({
  primaryService: 'local-inworld',
  localInworldConfig: {
    pythonPath: 'python3',
    modelsDir: './models/inworld-tts-local',
    autoSetup: true
  }
})

const result = await ttsManager.synthesize('Hello, world!', {
  speaker: {
    voiceName: 'tts-1',
    language: 'en-US'
  },
  format: 'wav',
  sampleRate: 24000
})
```

### Local Inworld AI Features

- **Completely Free**: No API costs or usage limits
- **100% Offline**: Works without internet connection
- **High Quality**: Same models as cloud version
- **Privacy First**: No data leaves your device
- **Multiple Models**: TTS-1, TTS-1 Max local versions
- **Multi-language**: English, Japanese, Chinese support
- **GPU Acceleration**: Uses your local GPU for faster processing

### VibeVoice Setup

1. **Get Hugging Face API Key**:
   - Visit [Hugging Face](https://huggingface.co/settings/tokens)
   - Create a new access token
   - Copy the token

2. **Configure API Key**:
   ```bash
   # Environment variable
   export HUGGINGFACE_API_KEY=your_api_key_here
   
   # Or in .env file
   VITE_HUGGINGFACE_API_KEY=your_api_key_here
   ```

3. **Enable VibeVoice in Settings**:
   - Go to Settings → Audio Generation
   - Select "Microsoft (VibeVoice)" as provider
   - Choose your preferred voice and language

### VibeVoice Usage Example

```typescript
import { createTTSManager } from './services/tts/tts-manager'

const ttsManager = createTTSManager({
  primaryService: 'vibevoice',
  huggingfaceApiKey: 'your_api_key_here'
})

const result = await ttsManager.synthesize('Hello, world!', {
  speaker: {
    voiceName: 'vibevoice-english',
    language: 'en-US',
    style: 'professionally'
  }
})
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TTS example
npm run tts:example

# Build for production
npm run build
```

## License

MIT
