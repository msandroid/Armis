Armisの実装ロードマップは**VSCodiumベースのIDE化 → マルチモーダル機能追加 → AIエージェント統合 → メディア生成・編集統合 → デプロイ**の流れが最も効率的です。

## **Armis 開発ロードマップ**

### **MVP優先事項：Structural Style Transfer（E2E）**

目的：参照動画の構造抽出→新規コンテンツへの転写→プレビュー→書き出しまでを最小構成で成立させる。

* [ ] 取込：URL/ローカルから参照動画・記事を投入（yt-dlp / スクレイピング）
* [ ] 解析：Whisper（ASR）、PySceneDetect（カット）、pyannote（話者/BGM）
* [ ] 構造抽出：LMMで章/ショット長/B-roll頻度/ナレーション比率を数値化
* [ ] 台本生成：記事要約＋構造パラメータ適用（MulmoScript）
* [ ] アセット：B-roll/SFX収集、TTS生成、Assetsタブで差し替え
* [ ] 合成：Timeline編集、差分プレビュー、FFmpegで書き出し
* [ ] KPI計測：初回プレビュー時間・構造一致度・成功率のロギング
* [ ] 受け入れ基準テスト：±10%内の再現、テンプレ再適用、E2Eログ

### **フェーズ 1：VSCodiumカスタマイズ & 基盤整備**

目的：ArmisのIDEベース環境を整える

* [x] **VSCodiumビルド完了**
* [ ] 拡張機能セット作成（React, Electron, shadcn/ui, Tailwind, MCP, AI SDK）
* [ ] エディタ内部の**WebView API**有効化（チャットUI・プレビュー埋め込み用）
* [ ] ローカル設定同期（ユーザー設定保存）

---

### **フェーズ 2：UI/UX 実装**

目的：マルチモーダル編集を可能にするUI構築

* [ ] **左パネル（Agent Interaction）**

  * shadcn-chatbot-kitベースのチャットUI実装
  * 添付ファイル（画像, PDF, 音声, 動画, URL）ドロップ対応
  * PromptInputBox, FileDropZoneの配置
  * ユーザー入力、履歴表示、添付ファイル対応
* [ ] **右パネル（Media Build Panel）**

  * タブ構成：Canvas / Script / Workflow / Timeline / Assets / Audio
  * a-react-video-editorでタイムライン編集機能追加
  * Canvas/Script/Workflow/Timeline/Assets/AudioタブのUI整備
  * カット/トランジション対応
  * WaveSurfer.jsで音声波形表示（未導入）
  * motion.devでアニメーション効果実装
* [ ] **ワークフロー可視化**

  * React Flowを導入し、Workflow.jsonをGUIで操作可能に
* [ ] **その他のUI補強**

  * Fabric.js: Canvas上での画像編集
  * React DnD: ドラッグ＆ドロップ対応
  * React Window/Virtualized: 大量アセット表示の高速化
* [ ] **テーマ適用**

  * プライマリカラー#006337、デジタル迷彩背景

---

### **フェーズ 3：エージェントレイヤー構築**

目的：自然言語→タスク変換を可能にする

* [ ] **エージェント・AIレイヤー統合**

  * fast-agent / cursor-agentの組み込み
  * langchainを利用したチェーン型タスク管理
  * MCP対応エージェントやSequential Thinkingでワークフロー順序制御
  * autogenでマルチエージェント管理
  * fast-agentをMCP対応で組み込み
  * cursor-agentで自然言語指示→タスク分解
  * langchainでツール統合（Whisper, ComfyUI, LTX-Videoなど）
  * autogenでマルチエージェント間の自動タスク生成
  * yt-dlpによる素材収集モジュール追加
  * playwright-mcpでWebスクレイピング機能追加

---

### **フェーズ 4：AIモデル統合**

目的：生成・解析機能を追加

* [ ] **LLM統合**

  * Ollama（ローカル推論）
  * Fireworks.ai / Gemini / Claude / OpenAI APIの切り替え機構
* [ ] **LMM統合**

  * ARC-Hunyuan-Video-7B / VideoITG-8Bで動画生成・解析
  * LLaVA-Video-7B-Qwen2でスタイル抽出
* [ ] **音声**

  * Whisperで音声解析
  * Coqui TTS / Style-Bert-VITS2 / Azure Speech SDKで合成
* [ ] **画像**

  * ComfyUI（ControlNet対応）
  * Ultralytics YOLOで物体検出
  * DeepFaceで顔認識

---

### **フェーズ 5：ワークフロー & スクリプト管理**

目的：再利用可能な制作パイプライン構築

* [ ] mulmocast-cliでマルチモーダルスクリプト実行
* [ ] graphaiでタスク依存関係可視化
* [ ] cocoindexでコードベース検索（RAG対応）
* [ ] ワークフローJSONテンプレート作成・保存機能

---

### **フェーズ 6：メディア生成・編集統合**

目的：動画・音声・画像の一括生成・編集

* [ ] **メディア処理・生成パイプライン**

  * **動画生成・編集**
    * LTX-Video / FastVideo / Open-Sora / HunyuanVideoを統合
    * Mulmocast-cliでワークフロー自動化
    * LTX-Video / FastVideoで動画合成
    * Open-Sora / HunyuanVideoで動画生成
    * アニメーション追加（motion.dev）
    * BGM・効果音自動挿入（音声モデル連携）
  * **音声処理**
    * Whisperで文字起こし
    * Coqui TTS / Style-Bert-VITS2でナレーション生成
    * WaveSurfer.jsで波形表示・編集
  * **画像生成・編集**
    * ComfyUIによるText2Image / Image2Image / ControlNet対応
    * Fabric.jsとの連携でインタラクティブ編集

---

### **フェーズ 7：ファイル管理・保存**

目的：ユーザーがアップロードした素材や生成結果を管理する仕組み

* [ ] Electron Storeで設定・履歴の保存
* [ ] SQLite/Better-SQLite3で素材・プロジェクトデータ管理
* [ ] JSZipでプロジェクトのアーカイブ

---

### **フェーズ 8：メディア変換・出力**

目的：最終的な動画・音声の出力機能

* [ ] FFmpeg.js/WASMでブラウザ内動画変換
* [ ] MediaRecorder APIで録音・録画
* [ ] FastVideoで高速生成・変換

---

### **フェーズ 9：🚀 デプロイ & 配布**

目的：Mac / Windows / Web アプリ配布

#### **9.1 Electronビルド設定**
* [ ] **macOS向けビルド設定**
  * `electron-builder`の設定ファイル作成
  * `.dmg`インストーラーの生成
  * コード署名の設定（Apple Developer Account）
  * 公証（Notarization）の設定

* [ ] **Windows向けビルド設定**
  * `.exe`インストーラーの生成
  * `.msi`パッケージの作成
  * Windows Defender対応
  * インストール先ディレクトリの設定

* [ ] **Linux向けビルド設定**
  * `.AppImage`の生成
  * `.deb`パッケージの作成
  * `.rpm`パッケージの作成

#### **9.2 Web版Next.jsビルド**
* [ ] **Next.jsアプリケーション構築**
  * Vercelへのデプロイ設定
  * 静的サイト生成（SSG）の設定
  * PWA対応（Service Worker）
  * オフライン機能の実装

* [ ] **レスポンシブデザイン最適化**
  * モバイル対応のUI調整
  * タブレット対応のレイアウト
  * デスクトップ版との一貫性確保

#### **9.3 自動更新機構**
* [ ] **アップデートチェック機能**
  * `electron-updater`の統合
  * バージョン比較ロジック
  * 更新通知の表示

* [ ] **自動ダウンロード・インストール**
  * バックグラウンドダウンロード
  * インストール後の自動再起動
  * ロールバック機能

* [ ] **バージョン管理システム**
  * GitHub Releasesとの連携
  * 変更履歴の自動生成
  * ベータ版・安定版の分離

#### **9.4 配布ページ作成**
* [ ] **ダウンロードページ**
  * 各プラットフォーム向けダウンロードリンク
  * システム要件の表示
  * インストールガイド

* [ ] **マーケティング素材**
  * スクリーンショット・動画の作成
  * 機能紹介ページ
  * ユーザーガイド・ドキュメント

* [ ] **配布チャネル**
  * GitHub Releases
  * Homebrew（macOS）
  * Chocolatey（Windows）
  * Snap Store（Linux）

---

### **フェーズ 10：テスト環境・監視**

目的：安定した運用のためのテスト・監視環境

* [ ] Express/FastifyでAPIサーバー構築
* [ ] WebSocketで進捗や差分通知
* [ ] PM2 / Dockerでマルチモデル環境をデプロイ
* [ ] Sentryでエラー監視

---

### **フェーズ 11：最適化 & 拡張**

目的：ユーザー体験改善・処理高速化

* [ ] GPUアクセラレーション（CUDA / ROCm対応）
* [ ] モデルキャッシュ・事前読み込み
* [ ] API利用コスト最適化（ローカルモデル優先）
* [ ] プラグインSDK提供（外部開発者が機能追加可能に）

---

## **推奨実装順序**

1. **UIのベースを整える**（チャットパネル＋編集パネル）
2. **エージェント・LLMレイヤーの統合**（自然言語指示→タスク生成）
3. **メディア生成・編集パイプライン接続**（動画・音声・画像）
4. **ファイル管理・ワークフロー保存対応**
5. **出力・書き出し機能の検証**
6. **テスト・デプロイ**
7. **MVP E2E（Structural Style Transfer）を最優先**

---

💡 **補足**

* まずは最小構成で「チャット指示→動画生成→プレビュー→微調整→書き出し」が動作する環境を作るのが成功率高いです。
* UIを固めつつ、エージェントとメディア処理を段階的に統合すると依存関係の問題も減らせます。
* **現在はMVP E2E（フェーズ2〜5）が最優先です。まずはE2E成立とKPI計測に集中しましょう。**

このロードマップを**実装順に進めると、最小限の機能から始めて徐々に完全版へ拡張できます**。
もし希望があれば、これを**4〜6か月の開発スケジュール表**に落とし込み可能です。

次、このロードマップをガントチャート形式に変換しますか？
そうすれば開発順序と工数が可視化できます。
