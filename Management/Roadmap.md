了解です。
VSCodiumビルド済みであれば、Armisの実装ロードマップは**VSCodiumベースのIDE化 → マルチモーダル機能追加 → AIエージェント統合 → メディア生成・編集統合 → デプロイ**の流れが最も効率的です。

以下は段階的なロードマップです。

---

## **Armis 開発ロードマップ**

### **フェーズ 1：VSCodiumカスタマイズ & 基盤整備**

目的：ArmisのIDEベース環境を整える

* [x] **VSCodiumビルド完了**
* [ ] ブランド差し替え（アイコン、ロゴ、スプラッシュ画面、カラーテーマ）
* [ ] 拡張機能セット作成（React, Electron, shadcn/ui, Tailwind, MCP, AI SDK）
* [ ] エディタ内部の**WebView API**有効化（チャットUI・プレビュー埋め込み用）
* [ ] ローカル設定同期（ユーザー設定保存）

---

### **フェーズ 2：UI/UX 実装**

目的：マルチモーダル編集を可能にするUI構築

* [ ] **左パネル（Agent Interaction）**

  * shadcn-chatbot-kitベースのチャットUI実装
  * 添付ファイル（画像, PDF, 音声, 動画, URL）ドロップ対応
* [ ] **右パネル（Media Build Panel）**

  * タブ構成：Canvas / Script / Workflow / Timeline / Assets / Audio
  * a-react-video-editorでタイムライン編集機能追加
  * motion.devでアニメーション効果実装
* [ ] **テーマ適用**

  * プライマリカラー#006337、デジタル迷彩背景

---

### **フェーズ 3：エージェントレイヤー構築**

目的：自然言語→タスク変換を可能にする

* [ ] fast-agentをMCP対応で組み込み
* [ ] cursor-agentで自然言語指示→タスク分解
* [ ] langchainでツール統合（Whisper, ComfyUI, LTX-Videoなど）
* [ ] autogenでマルチエージェント間の自動タスク生成
* [ ] yt-dlpによる素材収集モジュール追加
* [ ] playwright-mcpでWebスクレイピング機能追加

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

* [ ] LTX-Video / FastVideoで動画合成
* [ ] Open-Sora / HunyuanVideoで動画生成
* [ ] アニメーション追加（motion.dev）
* [ ] BGM・効果音自動挿入（音声モデル連携）

---

### **フェーズ 7：デプロイ & 配布**

目的：Mac / Windows / Web アプリ配布

* [ ] Electronビルド設定（macOS, Windows）
* [ ] Web版（Next.js）ビルド・ホスティング
* [ ] アップデート配信（自動更新機構）
* [ ] 配布ページ作成（スクリーンショット・動画・説明）

---

### **フェーズ 8：最適化 & 拡張**

目的：ユーザー体験改善・処理高速化

* [ ] GPUアクセラレーション（CUDA / ROCm対応）
* [ ] モデルキャッシュ・事前読み込み
* [ ] API利用コスト最適化（ローカルモデル優先）
* [ ] プラグインSDK提供（外部開発者が機能追加可能に）

---

💡 このロードマップを**実装順に進めると、最小限の機能から始めて徐々に完全版へ拡張できます**。
もし希望があれば、これを**4〜6か月の開発スケジュール表**に落とし込み可能です。

次、このロードマップをガントチャート形式に変換しますか？
そうすれば開発順序と工数が可視化できます。
