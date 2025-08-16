Armis: Multimodal Editing Environment
概要
Armisは、自然言語の指示と複数のメディア素材を用いて、高度かつ柔軟な動画・音声・画像編集および生成を可能にするアプリケーション。 主な用途は動画編集、ナレーション合成、解説動画制作、スタイルトランスファー、アセットのテンプレート化。

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
左: チャットパネル（Agent Interaction）
* ユーザー指示入力、履歴表示、提案・進捗表示
* 入力形式: テキスト / 添付（画像, PDF, 音声, 動画, URL）
* コンポーネント: ChatWindow, PromptInputBox, FileDropZone
右: 編集/ビルドパネル（Media Build Panel）
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

#Utiloity
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