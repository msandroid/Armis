## 1. UI・フロントエンドの整備

VSCodiumをベースにしてArmis固有のUIを組み込むフェーズです。

* **チャットパネル**

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

### 推奨順序

1. **UIのベースを整える**（チャットパネル＋編集パネル）
2. **エージェント・LLMレイヤーの統合**（自然言語指示→タスク生成）
3. **メディア生成・編集パイプライン接続**（動画・音声・画像）
4. **ファイル管理・ワークフロー保存対応**
5. **出力・書き出し機能の検証**
6. **テスト・デプロイ**

---

💡 **補足**

* まずは最小構成で「チャット指示→動画生成→プレビュー→微調整→書き出し」が動作する環境を作るのが成功率高いです。
* UIを固めつつ、エージェントとメディア処理を段階的に統合すると依存関係の問題も減らせます。

---
