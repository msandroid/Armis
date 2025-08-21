# Armis - AI-Powered Development Environment

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
