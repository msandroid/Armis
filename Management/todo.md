## 1. MVP E2E Checklist

### MVP E2E: Structural Style Transfer（最優先）

目的：参照動画の構造抽出→新規コンテンツへの転写→プレビュー→書き出しまでを最小構成で成立

- [ ] 取込：URL/ローカルから参照動画・記事投入（yt-dlp / スクレイピング）
- [ ] 解析：Whisper（ASR）/ PySceneDetect（カット）/ pyannote（話者・BGM）
- [ ] 構造抽出：LMMで章/ショット長/B-roll頻度/ナレ比率を数値化
- [ ] 台本生成：記事要約＋構造パラメータ適用（MulmoScript）
- [ ] アセット：B-roll/SFX収集、TTS生成、Assetsタブで差し替え
- [ ] 合成：Timeline編集、差分プレビュー、FFmpeg書き出し
- [ ] KPI計測：初回プレビュー時間・構造一致度・成功率のロギング
- [ ] 受け入れ基準テスト：±10%内再現、テンプレ再適用、E2Eログ

---

## 1. UI・フロントエンドの整備

VSCodiumをベースにしてArmis固有のUIを組み込むフェーズです。

* **チャットパネル**
  * sidebarを改変してchatpanel実装してください。
  * AISDKを利用してください。https://ai-sdk.dev/docs/getting-started/nextjs-app-router
  * shadcn-chatbot-kitを組み込んで、ユーザー入力、履歴表示、添付ファイル対応
  * PromptInputBox, FileDropZoneの配置

* **編集/ビルドパネル**
  * a-react-video-editorによるタイムライン編集、カット/トランジション対応
  * Canvas/Script/Workflow/Timeline/Assets/AudioタブのUI整備
  * WaveSurfer.jsで音声波形表示（未導入）

* **ワークフロー可視化**

  * React Flowを導入し、Workflow\.jsonをGUIで操作可能に

* **その他のUI補強**

  * Fabric.js: Canvas上での画像編集
  * React DnD: ドラッグ＆ドロップ対応
  * React Window/Virtualized: 大量アセット表示の高速化

---

## 2. エージェント・AIレイヤー統合

自然言語指示からタスク分解・生成までの流れを整える。

* fast-agent / cursor-agentの組み込み
* langchainを利用したチェーン型タスク管理
* MCP対応エージェントやSequential Thinkingでワークフロー順序制御
* autogenでマルチエージェント管理

---

## 3. メディア処理・生成パイプライン

動画・音声・画像生成・解析機能を統合。

* **動画生成・編集**

  * LTX-Video / FastVideo / Open-Sora / HunyuanVideoを統合
  * Mulmocast-cliでワークフロー自動化

* **音声処理**

  * Whisperで文字起こし
  * Coqui TTS / Style-Bert-VITS2でナレーション生成
  * WaveSurfer.jsで波形表示・編集

* **画像生成・編集**

  * ComfyUIによるText2Image / Image2Image / ControlNet対応
  * Fabric.jsとの連携でインタラクティブ編集

---

## 4. ファイル管理・保存

ユーザーがアップロードした素材や生成結果を管理する仕組み。

* Electron Storeで設定・履歴の保存
* SQLite/Better-SQLite3で素材・プロジェクトデータ管理
* JSZipでプロジェクトのアーカイブ

---

## 5. メディア変換・出力

* FFmpeg.js/WASMでブラウザ内動画変換
* MediaRecorder APIで録音・録画
* FastVideoで高速生成・変換

---

## 6. デプロイ・テスト環境

* Express/FastifyでAPIサーバー構築
* WebSocketで進捗や差分通知
* PM2 / Dockerでマルチモデル環境をデプロイ
* Sentryでエラー監視

---

## 7. 🚀 **デプロイ & 配布（現在の優先タスク）**

### **7.1 Electronビルド設定**
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

### **7.2 Web版Next.jsビルド**
* [ ] **Next.jsアプリケーション構築**
  * Vercelへのデプロイ設定
  * 静的サイト生成（SSG）の設定
  * PWA対応（Service Worker）
  * オフライン機能の実装

* [ ] **レスポンシブデザイン最適化**
  * モバイル対応のUI調整
  * タブレット対応のレイアウト
  * デスクトップ版との一貫性確保

### **7.3 自動更新機構**
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

### **7.4 配布ページ作成**
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

### 推奨順序

1. **UIのベースを整える**（チャットパネル＋編集パネル）
2. **エージェント・LLMレイヤーの統合**（自然言語指示→タスク生成）
3. **メディア生成・編集パイプライン接続**（動画・音声・画像）
4. **ファイル管理・ワークフロー保存対応**
5. **出力・書き出し機能の検証**
6. **テスト・デプロイ**
7. **🚀 デプロイ & 配布（現在の優先タスク）**

---

💡 **補足**

* まずは最小構成で「チャット指示→動画生成→プレビュー→微調整→書き出し」が動作する環境を作るのが成功率高いです。
* UIを固めつつ、エージェントとメディア処理を段階的に統合すると依存関係の問題も減らせます。
* **現在はフェーズ7「デプロイ & 配布」が最優先です。機能実装は完了しているため、配布準備に集中しましょう。**
