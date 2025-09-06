# MulmoCast CLI Integration

MulmoCast CLIをArmisプロジェクトに統合し、LLMが利用できるようにしました。

## 概要

MulmoCastは、AIと人間が協力してアイデアを作成・共有するための次世代プレゼンテーションプラットフォームです。この統合により、ArmisのLLMシステムからMulmoCastの機能を利用できるようになります。

## 機能

### 利用可能なツール

1. **スクリプト生成** (`mulmocastScriptGenerator`)
   - URLからスクリプトを生成
   - インタラクティブモードでのスクリプト生成
   - テンプレートベースのスクリプト生成

2. **音声生成** (`mulmocastAudioGenerator`)
   - スクリプトから音声ファイルを生成
   - 多言語対応（英語、日本語）
   - 強制再生成オプション

3. **画像生成** (`mulmocastImageGenerator`)
   - スクリプトから画像を生成
   - 多言語対応
   - 強制再生成オプション

4. **動画生成** (`mulmocastMovieGenerator`)
   - スクリプトから動画を生成
   - 字幕対応
   - 音声と画像の統合

5. **PDF生成** (`mulmocastPdfGenerator`)
   - スライドモード
   - トークモード
   - ハンドアウトモード
   - A4/Letterサイズ対応

6. **ストーリーからスクリプト生成** (`mulmocastStoryToScriptGenerator`)
   - テキストファイルからスクリプトを生成
   - ステップワイズ/ワンステップモード

7. **プロンプトダンプ** (`mulmocastPromptDumper`)
   - テンプレートのプロンプトを表示

8. **スキーマダンプ** (`mulmocastSchemaDumper`)
   - MulmoCastスキーマを表示

9. **完全ワークフロー** (`mulmocastCompleteWorkflow`)
   - URLから最終動画まで一気通貫で生成

## セットアップ

### 1. MulmoCast CLIのクローン

```bash
git clone https://github.com/receptron/mulmocast-cli.git
cd mulmocast-cli
npm install
npm run build
```

### 2. 依存関係の確認

MulmoCast CLIは以下の主要な依存関係を使用します：
- GraphAI
- Puppeteer
- Fluent-FFmpeg
- 各種AIエージェント（OpenAI、Anthropic、Gemini、Groq）

## 使用方法

### 基本的な使用例

```typescript
import { MulmoCastTools } from '@/services/tools/mulmocast-tools'

// MulmoCastツールインスタンスを作成
const mulmoCastTools = new MulmoCastTools()

// スクリプト生成
const scriptResult = await mulmoCastTools.scriptGenerator.execute({
  urls: ['https://example.com/article1'],
  template: 'business',
  outputName: 'demo_script'
})

// 音声生成
const audioResult = await mulmoCastTools.audioGenerator.execute({
  scriptFile: scriptResult.scriptPath,
  language: 'en',
  force: true
})

// 画像生成
const imageResult = await mulmoCastTools.imageGenerator.execute({
  scriptFile: scriptResult.scriptPath,
  language: 'en',
  force: true
})

// 動画生成
const movieResult = await mulmoCastTools.movieGenerator.execute({
  scriptFile: scriptResult.scriptPath,
  language: 'en',
  force: true,
  captions: 'en'
})
```

### 完全ワークフロー例

```typescript
// URLから最終動画まで一気通貫で生成
const result = await mulmoCastTools.completeWorkflow.execute({
  urls: ['https://example.com/topic1', 'https://example.com/topic2'],
  template: 'business',
  language: 'en',
  force: true
})

if (result.success) {
  console.log('✅ Complete workflow finished successfully!')
  console.log(`📄 Script: ${result.scriptPath}`)
  console.log(`🎧 Audio: ${result.audioDir}`)
  console.log(`🖼️ Images: ${result.imageDir}`)
  console.log(`🎥 Video: ${result.videoPath}`)
}
```

## 利用可能なテンプレート

- `akira_comic` - アキラ風コミック
- `business` - ビジネス
- `children_book` - 児童書
- `coding` - コーディング
- `comic_strips` - コミックストリップ
- `drslump_comic` - Dr.スランプ風コミック
- `ghibli_comic` - ジブリ風コミック
- `ghibli_image_only` - ジブリ画像のみ
- `ghibli_shorts` - ジブリショート
- `ghost_comic` - ゴーストコミック
- `onepiece_comic` - ワンピース風コミック
- `podcast_standard` - 標準ポッドキャスト
- `portrait_movie` - ポートレート動画
- `realistic_movie` - リアルな動画
- `sensei_and_taro` - 先生と太郎
- `shorts` - ショート動画
- `text_and_image` - テキストと画像
- `text_only` - テキストのみ
- `trailer` - トレーラー

## 出力ディレクトリ

デフォルトでは、すべての出力ファイルは `./output/mulmocast/` ディレクトリに保存されます：

```
output/mulmocast/
├── script.json          # 生成されたスクリプト
├── audio/               # 音声ファイル
├── images/              # 画像ファイル
├── output.mp4           # 最終動画
├── output.pdf           # PDFファイル
└── story.txt            # ストーリーファイル
```

## 実行例

### npmスクリプト

```bash
# 基本的な例を実行
npm run mulmocast:example

# 完全ワークフロー例を実行
npm run mulmocast:workflow

# ストーリーからスクリプト生成例を実行
npm run mulmocast:story

# プロンプトとスキーマ確認例を実行
npm run mulmocast:prompt
```

### 直接実行

```bash
# TypeScriptファイルを直接実行
tsx src/examples/mulmocast-integration-example.ts
```

## 設定

### 環境変数

MulmoCast CLIは以下の環境変数をサポートします：

```bash
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Gemini
GOOGLE_API_KEY=your_google_api_key

# Groq
GROQ_API_KEY=your_groq_api_key

# Replicate
REPLICATE_API_TOKEN=your_replicate_token

# Tavily
TAVILY_API_KEY=your_tavily_api_key
```

### カスタム設定

```typescript
// カスタムパスでMulmoCastツールを作成
const mulmoCastTools = new MulmoCastTools(
  './custom-mulmocast-path',  // MulmoCast CLIのパス
  './custom-output-dir'       // 出力ディレクトリ
)
```

## トラブルシューティング

### よくある問題

1. **MulmoCast CLIが見つからない**
   - MulmoCast CLIが正しくクローンされているか確認
   - パスが正しく設定されているか確認

2. **依存関係エラー**
   - `npm install` を実行して依存関係をインストール
   - Node.js 18以上を使用しているか確認

3. **FFmpegエラー**
   - FFmpegがシステムにインストールされているか確認
   - macOS: `brew install ffmpeg`
   - Ubuntu: `sudo apt install ffmpeg`

4. **APIキーエラー**
   - 必要なAPIキーが環境変数に設定されているか確認
   - `.env` ファイルを作成してAPIキーを設定

### ログの確認

```typescript
// 詳細ログを有効にする
const mulmoCastTools = new MulmoCastTools()
const result = await mulmoCastTools.scriptGenerator.execute({
  urls: ['https://example.com'],
  template: 'business',
  verbose: true  // 詳細ログを有効化
})
```

## 貢献

MulmoCast CLIの統合に関する改善提案やバグ報告は、GitHubのIssuesでお知らせください。

## ライセンス

MulmoCast CLIはAGPL-3.0ライセンスの下で提供されています。詳細は[MulmoCast CLIリポジトリ](https://github.com/receptron/mulmocast-cli)を参照してください。
