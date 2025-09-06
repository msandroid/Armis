
# 現在の開発状況レポート

## プロジェクト概要

**Armis**は、自然言語指示と複数のメディア素材を用いて高度な動画・音声・画像編集・生成を可能にするマルチモーダル編集環境です。

## 現在の開発状況

### 1. プロジェクト構造
```
Armis/
├── vscodium/          # VSCodiumベースエディタ（ビルド済み）
├── src/mcp/          # MCP（Model Context Protocol）エージェントシステム
├── Management/       # プロジェクト管理ドキュメント
├── icon/            # アプリケーションアイコン
└── package.json     # メインプロジェクト設定
```

### 2. ビルド状況

#### VSCodium
- ✅ **ビルド完了**: macOS ARM64版（VSCodium.app）
- ✅ **最新版**: 1.103.15418（2025年8月17日）
- ✅ **ビルド成果物**: 正常に生成済み

#### メインプロジェクト
- ✅ **依存関係**: インストール済み
- ✅ **TypeScript**: 設定完了
- ✅ **MCP SDK**: 導入済み（@modelcontextprotocol/sdk@1.17.3）

### 3. 開発フェーズ

#### 🎯 **MVPフェーズ（最優先）**: Structural Style Transfer
- **目的**: 参照動画の構造抽出→新規コンテンツへの転写→プレビュー→書き出し
- **進捗**: 設計・計画段階
- **主要機能**:
  - 動画・URL取り込み（yt-dlp/スクレイピング）
  - Whisper（ASR）/ PySceneDetect（カット）/ pyannote（話者・BGM）
  - LMMによる構造抽出
  - 台本生成（MulmoScript）
  - TTS生成・プレビュー
  - FFmpeg書き出し

#### **次フェーズ**: UI・フロントエンド整備
- VSCodiumベースのUI改変
- チャットパネル実装（AI SDK + shadcn-chatbot-kit）
- 編集/ビルドパネル（a-react-video-editor）
- ワークフロー可視化（React Flow）

### 4. 技術スタック

#### フロントエンド
- **React + Electron** (Next.js)
- **shadcn/ui** コンポーネント
- **AI SDK** (ai-sdk.dev)

#### メディア処理
- **Whisper**: 音声解析・文字起こし
- **Coqui TTS / Style-Bert-VITS2**: ナレーション生成
- **ComfyUI**: 画像生成
- **FFmpeg**: 動画変換・出力

#### AI・エージェント
- **MCP**: Model Context Protocol
- **fast-agent / cursor-agent**: エージェントシステム
- **langchain**: チェーン型タスク管理
- **Sequential Thinking**: ワークフロー制御

### 5. Git状況

#### 変更されたファイル
- `Management/Docs/Roadmap.md`
- `Management/Docs/Structural Style Transfer.md`
- `Management/PRD.md`
- `Management/todo.md`
- `vscodium/` (サブモジュール)

#### 新規追加ファイル
- `Management/HowToMake.md` (VSCodium開発ガイド)
- `icon/`, `src/`, `package.json`, `tsconfig.json`

### 6. 次のステップ

#### 即座に実行可能
1. **VSCodiumの起動テスト**
   ```bash
   ./vscodium/VSCode-darwin-arm64/VSCodium.app/Contents/MacOS/VSCodium
   ```

2. **MCPエージェントのテスト**
   ```bash
   npm run dev
   ```

#### 優先開発項目
1. **Structural Style Transfer MVP**の実装開始
2. **チャットパネル**のUI実装
3. **動画取り込み機能**の実装
4. **Whisper統合**の実装

### 7. 注意点

- **メモリ要件**: VSCodiumビルドには8GB以上のメモリが必要
- **プラットフォーム**: 現在はmacOS ARM64でビルド済み
- **ライセンス**: VSCodiumはMITライセンス、テレメトリ無効化済み
- **拡張機能**: open-vsx.orgから取得（一部制限あり）

現在のプロジェクトは基盤構築が完了し、MVP開発フェーズに移行する準備が整っている状態です。