# AI SDK Providers - ロゴ画像収集プロジェクト

このプロジェクトは、AI SDKでサポートされているすべてのプロバイダーのロゴ画像を収集するためのツールセットです。

## 📁 ファイル構成

- `ai-sdk-providers-logos.md` - プロバイダー一覧とロゴURLの詳細リスト
- `download-logos.cjs` - Node.js版ダウンロードスクリプト
- `download-logos-python.py` - Python版高品質ダウンロードスクリプト
- `README-logos.md` - このファイル

## 🚀 使用方法

### 1. Node.js版（簡単）

```bash
# Node.jsスクリプトを実行
node download-logos.cjs
```

**特徴:**
- 簡単に実行可能
- favicon.icoファイルを取得
- 基本的なロゴ画像を素早く収集

### 2. Python版（高品質）

```bash
# 必要なライブラリをインストール
pip install requests

# Pythonスクリプトを実行
python download-logos-python.py
```

**特徴:**
- 高解像度ロゴ画像を優先取得
- 複数のURLパターンを試行
- 詳細な結果レポート
- レート制限対応

## 📊 収集対象プロバイダー

### 主要プロバイダー (20社)
- xAI Grok, Vercel, OpenAI, Azure OpenAI, Anthropic
- Amazon Bedrock, Groq, Fal AI, DeepInfra, Google Generative AI
- Google Vertex AI, Mistral AI, Together.ai, Cohere, Fireworks
- DeepSeek, Cerebras, Perplexity, Luma AI

### 音声・音響系プロバイダー (7社)
- ElevenLabs, AssemblyAI, Deepgram, Gladia, LMNT, Hume, Rev.ai

### コミュニティプロバイダー (17社)
- Ollama, Portkey, OpenRouter, Crosshatch, Mixedbread
- Voyage AI, Jina AI, Mem0, Letta, Spark, Inflection AI
- LangDB, SambaNova, Dify, Sarvam, Built-in AI

### アダプター・統合 (2社)
- LangChain, LlamaIndex

### オブザーバビリティ統合 (11社)
- Braintrust, Helicone, Laminar, Langfuse, LangWatch
- Maxim, Patronus, SigNoz, Traceloop, Weave

**合計: 57社のプロバイダー**

## 📊 実際のダウンロード結果

### Node.js版実行結果（2024年12月時点）
- ✅ 成功: 21個のロゴ画像
- ❌ 失敗: 33個のロゴ画像
- 📁 保存先: `logos/` ディレクトリ

**成功したプロバイダー:**
- xAI Grok, Vercel, Azure OpenAI, Anthropic, Amazon Bedrock
- Groq, Fal AI, DeepInfra, Google Vertex AI, Mistral AI
- Cohere, Fireworks, ElevenLabs, AssemblyAI, Deepgram
- OpenRouter, Jina AI, Mem0, LlamaIndex, Langfuse, Weave

**主な失敗理由:**
- HTTP 301/302/307/308: リダイレクト（手動でフォローが必要）
- HTTP 403/404: アクセス拒否・ファイル不存在
- ネットワークタイムアウト: 接続問題

## 📂 出力ディレクトリ

### Node.js版
```
logos/
├── xai-grok.ico
├── vercel.ico
├── openai.ico
└── ...
```

### Python版
```
logos-high-quality/
├── xai-grok.png
├── vercel.png
├── openai.png
├── download-results.json
└── ...
```

## ⚠️ 注意事項

### 著作権・ライセンス
- 各ロゴの著作権は各プロバイダーに帰属します
- 商用利用の場合は、事前に各プロバイダーに確認してください
- 各プロバイダーのブランドガイドラインに従って使用してください

### 技術的制限
- 一部のプロバイダーはロゴ配布を制限している場合があります
- サイトの構造変更により、URLが無効になる可能性があります
- レート制限により、一部のダウンロードが失敗する場合があります

## 🔧 カスタマイズ

### 新しいプロバイダーの追加

1. `ai-sdk-providers-logos.md`にプロバイダー情報を追加
2. `download-logos.cjs`の`providers`オブジェクトに追加
3. `download-logos-python.py`の`PROVIDERS`辞書に追加

### ロゴURLの更新

各プロバイダーの公式サイトでロゴURLが変更された場合、対応するファイルを更新してください。

## 📈 結果の確認

### 成功したダウンロード
- 各スクリプト実行後にコンソールで確認
- Python版では`download-results.json`で詳細確認

### 失敗したダウンロード
- エラーメッセージを確認
- 手動でプロバイダーサイトからロゴを取得
- URLパターンを更新して再実行

## 🤝 貢献

新しいプロバイダーの追加や、ロゴURLの更新など、改善提案を歓迎します。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。ただし、収集されるロゴ画像の著作権は各プロバイダーに帰属します。
