Armis: Multimodal Editing Environment
概要
Armisは、自然言語の指示と複数のメディア素材を用いて、高度かつ柔軟な動画・音声・画像編集および生成を可能にするアプリケーション。主な用途は動画編集、ナレーション合成、解説動画制作、スタイルトランスファー、アセットのテンプレート化。

ブランディング
* カラー
    * プライマリ: #006337（深緑）
    * アクセント1: #389F70（明るい緑）
    * アクセント2: #B6E3CE（淡いミント）
    * アクセント3: #8EF6C7（ライム寄りのシアン）
    * 背景: デジタル迷彩風グラデーション（ミリタリー感×デジタル感）

対応プラットフォーム
* Mac / Windows / Webアプリ

技術スタック
* フロントエンド: React + Electron (Next.js)
* UIコンポーネント: shadcn/ui

UI構成
チャットパネル（Agent Interaction）
* ユーザー指示入力、履歴表示、提案・進捗表示
* 入力形式: テキスト / 添付（画像, PDF, 音声, 動画, URL）
* コンポーネント: ChatWindow, PromptInputBox, FileDropZone
編集/ビルドパネル（Media Build Panel）
* タブ:
    * Canvas（プレビュー）
    * Script（中間スクリプト編集）
    * Workflow（ワークフロー.json編集）
    * Timeline（映像・音声同期編集）
    * Assets（素材一覧）
    * Audio（ナレーション生成・確認）
* ライブプレビュー & 差分ビルド

入力対応形式
* チャット
* URL（記事・動画など）
* 文書（テキスト, TXT, PDF）
* 画像（PNG, JPG, WEBP）
* 動画（MP4, WMV）
* 音声（MP3, WAV）

主な機能
* 自然言語による動画・メディア編集
* URL・動画から編集スタイルを抽出・再現
* ワークフローのテンプレート化（.json）
* Whisperで音声解析・文字起こし
* 合成音声生成（TTS, VITS2）
* ComfyUIによる画像生成
* アニメーション追加
* 3Dモデルからの動画生成
* Webスクレイピングによる素材収集
* 音声モデル自動学習

操作フロー（例）
1. 素材アップロード or URL入力
2. チャットで要望送信
3. AIがスクリプト・画像編集・ナレーションを自動生成
4. 右パネルでプレビュー・微修正
5. 書き出し（mp4 + JSONテンプレート） or 保存

強み
* 長尺動画（30〜60分）も数分で自動生成
* 参考動画やURLからスタイルを学習・再現
* 手直し可能な構造で表示・編集
  * テンプレート・ワークフローで再利用可能
  * 音声・画像・映像を横断するマルチモーダル編集

## PRD (MVP): Structural Style Transfer

### 目的 / 背景
参照動画の構造（章立て、ショット長、演出、BGM/ナレーション比率）を数値化し、新規トピックへ転写することで、長尺解説動画を高速に再利用・量産できる制作基盤を提供する。

### ペルソナ
- 長尺解説動画を継続制作する個人/法人クリエイター（YouTube/社内研修/講義）

### 主要ユースケース
- 参照URL/動画を投入→構造を抽出→別テーマの記事や素材で同構造の動画を生成

### スコープ（MVP）
- やる: 構造特徴量の抽出と可視化、テンプレ化、台本生成（MulmoScript）、TTS、差分プレビュー、書き出し
- やらない: 3D生成、音声モデルの自動学習、フルWeb同時対応、WMVなど稀少形式、複雑なカラーグレーディング

### 入出力（最小）
- 入力: 参照MP4（任意SRT/URL）、記事URL/TXT
- 出力: MP4（H.264/AAC, 1080p/30fps）、JSONワークフローテンプレート

### 機能要件（要約）
1) 取込: URL貼付→yt-dlp/スクレイピング、ローカルファイル
2) 解析: Whisper（ASR）/ PySceneDetect（カット）/ pyannote（話者・BGM）/ LMM（構造抽出）
3) 台本: 記事要約＋構造パラメータ適用（MulmoScript）
4) アセット: B-roll/SFX/BGM収集、TTS生成（プレビュー：WaveSurfer）
5) 合成: タイムライン編集、差分ビルド、プレビュー、FFmpeg書き出し

### 非機能要件（MVP）
- Apple Silicon推奨。30分素材の初回プレビュー≤6分を目標
- ログ/テレメトリはオプトイン。著作権/スクレイピング注意喚起

### KPI
- 初回プレビュー時間（30分素材）: ≤6分
- 構造一致度（章/ショット/ナレーション比率）: ≥85%
- ワークフロー実行成功率: ≥90%
- 手動編集時間短縮: ≥50%

### 受け入れ基準
- 参照構造の長さ・テンポ・B-roll頻度・ナレーション比率が±10%以内
- 生成JSONテンプレを別トピックに適用し再現できる
- `Chat→Script→Timeline→Canvas`でE2E実行でき、失敗時に原因ログ表示

### プラットフォーム戦略
- 初期: Electron（macOS優先）＋ローカル推論
- 後続: Windows対応、Webは機能限定版

### アーキテクチャ概要
- UI: React + Electron（Next.js統合）
- 解析: Whisper/pyannote/PySceneDetect/LMM
- 合成/出力: Mulmocast CLI + FFmpeg
- ストレージ: Electron Store/SQLite、キャッシュ/一時領域設計

### リスク/前提
- GPU依存、外部APIキー管理、参照素材の権利確認

### ロードマップ（抜粋）
- MVP: 解析→台本→合成→書き出しのE2E
- β: テンプレ共有、軽量Webビューア
- GA: プロジェクト管理、チームコラボ

#Docs

#IDE
* VSCodium GitHub
* VSCodium 公式サイト
* Cursor Docs - @docs
#UI
* shadcn-chatbot-kit – チャットUIテンプレート
* a-react-video-editor – React動画エディタ
* Vercel v0.dev サンプル – UI例
* motion.dev Examples – アニメーション例
* motion.dev React Animation Docs – アニメーション解説
* ai-sdk.dev Getting Started – AI SDK入門
* React DnD – 高度なドラッグ&ドロップ
* React Flow – ワークフロー可視化
* WaveSurfer.js – 音声波形表示・編集
* Fabric.js – インタラクティブなCanvas編集
* React Window / React Virtualized – 大量データ仮想化表示
#Agent
* fast-agent
* cursor-agent
* LangChain
* Awesome LLM Agents
* playwright-mcp
* Sequential Thinking MCP
* Awesome AI Agents by jim-schwoebel
* Microsoft Autogen
* yt-dlp – 動画ダウンロード
* CAD-MCP
#LLM
* Ollama
* Fireworks AI Login
* Fireworks AI Querying Guide
* Google Vertex AI Generative AI
* Google AI Studio API Key
* Anthropic Claude Models Overview
* OpenAI Models
* OpenAI Text Guide
* x.ai Models
#LMM
* ARC-Hunyuan-Video-7B
#CodebaseIndex
* CocoIndex Blog
* CocoIndex GitHub
* Claude Context
#Script
* mulmocast-cli
* graphai
#Image
* ComfyUI
* Ultralytics
* Ultralytics Docs
* DeepFace
#Voice
* Whisper
* Coqui TTS
* Style-Bert-VITS2 CLI
* Azure Speech SDK
* Spark-TTS
#Video
* LTX-Video
* FastVideo
* Open-Sora
* HunyuanVideo

#Utility
メディア処理・エンコーディング
* FFmpeg.js / FFmpeg WASM – ブラウザ内動画変換
* MediaRecorder API – 録音・録画機能
* Sharp – 高速画像変換
ファイル・データ管理
* Electron Store – 永続化ストレージ
* Better-SQLite3 – ローカルDB
* Chokidar – ファイル監視
* JSZip – ZIP圧縮
API・通信
* Axios – HTTPクライアント
* WebSocket API – リアルタイム通信
* Multer – ファイルアップロード
バックエンド
* Express.js / Fastify – APIサーバー
* Redis – キャッシュ
* Bull / Agenda – バックグラウンドジョブ
* Docker – コンテナ化
セキュリティ
* Helmet – セキュリティヘッダー
* Rate Limiter Flex – APIレート制限
* jsonwebtoken – 認証トークン
