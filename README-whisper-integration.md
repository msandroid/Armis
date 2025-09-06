# Whisper.cpp ローカルSTT機能統合

このドキュメントでは、Armisアプリケーションにwhisper.cppを使用したローカル音声認識（STT）機能を統合した実装について説明します。

## 概要

チャットで音声ファイルの文字起こしタスク（STT）を頼まれたときに、ローカルで動作するwhisper.cppベースのSTT機能を実装しました。

## 実装内容

### 1. 型定義
- `src/types/stt.ts`: STT機能の型定義
  - `STTResult`: 文字起こし結果の型
  - `STTOptions`: 文字起こしオプションの型
  - `STTService`: STTサービスのインターフェース
  - `WhisperConfig`: Whisper設定の型

### 2. ユーティリティ関数
- `src/utils/audio-utils.ts`: 音声ファイル処理のユーティリティ
  - 音声形式の判定
  - Base64変換
  - 音声情報取得
  - ファイルサイズ・長さのフォーマット

### 3. ローカルSTTサービス
- `src/services/stt/whisper-local-service.ts`: Whisper.cppを使用したローカルSTTサービス
  - WebAssembly版のwhisper.cppを統合
  - モデルファイルの動的読み込み
  - 音声データの前処理
  - エラーハンドリングとフォールバック機能

### 4. UIコンポーネント
- `src/components/generative-ui/AudioUnderstanding.tsx`: 音声理解・分析・文字起こしUI
  - クラウド/ローカルサービス選択
  - 文字起こし結果の表示
  - セグメント詳細表示
- `src/components/chat/AudioTranscriptionButton.tsx`: チャット用音声文字起こしボタン
  - サービス選択
  - 文字起こし実行
  - 結果のコピー機能

### 5. チャット機能統合
- `src/components/chat/EnhancedFilePreview.tsx`: ファイルプレビューに音声文字起こし機能を追加
- `src/components/chat/ChatWindow.tsx`: チャット機能に音声文字起こしを統合

## 使用方法

### 1. 音声理解・分析画面での使用

1. 音声ファイルをアップロード
2. 処理サービスを選択（クラウド/ローカル）
3. 「文字起こし」ボタンをクリック
4. 結果を確認

### 2. チャットでの使用

1. 音声ファイルをチャットに添付
2. ファイルを展開
3. 「音声を文字起こし」ボタンをクリック
4. 文字起こし結果がチャットに送信される

## 技術仕様

### サポート音声形式
- WAV, MP3, OGG, FLAC, M4A, AAC

### ローカルSTT機能
- **エンジン**: whisper.cpp WebAssembly版
- **モデル**: ggml-base.en.bin（日本語対応）
- **言語**: 日本語（デフォルト）
- **温度**: 0.0（デフォルト）
- **最大トークン**: 448

### クラウドSTT機能
- **サービス**: Google AI (Gemini)
- **機能**: 音声分析・文字起こし

## ファイル構成

```
src/
├── types/
│   └── stt.ts                    # STT型定義
├── utils/
│   └── audio-utils.ts            # 音声処理ユーティリティ
├── services/
│   └── stt/
│       ├── index.ts              # エクスポート
│       └── whisper-local-service.ts  # ローカルSTTサービス
└── components/
    ├── generative-ui/
    │   └── AudioUnderstanding.tsx    # 音声理解UI
    └── chat/
        ├── AudioTranscriptionButton.tsx  # 文字起こしボタン
        ├── EnhancedFilePreview.tsx       # ファイルプレビュー
        └── ChatWindow.tsx                # チャットウィンドウ
```

## 設定

### Whisper設定
```typescript
const whisperConfig: WhisperConfig = {
  modelPath: '/whisper/ggml-base.en.bin',
  language: 'ja',
  temperature: 0.0,
  maxTokens: 448
}
```

### 環境変数
- クラウドサービス用のAPIキー設定が必要

## 今後の改善点

### 1. 音声変換機能の強化
- FFmpeg.jsを使用した音声形式変換
- Web Audio APIを使用したリアルタイム処理

### 2. モデル管理の改善
- 複数言語モデルのサポート
- モデルの動的ダウンロード
- モデルキャッシュ機能

### 3. パフォーマンス最適化
- Web Workersを使用したバックグラウンド処理
- ストリーミング文字起こし
- メモリ使用量の最適化

### 4. ユーザビリティの向上
- リアルタイム音声認識
- 音声品質の自動調整
- 文字起こし精度の向上

## トラブルシューティング

### よくある問題

1. **Whisperモジュールが読み込まれない**
   - `/public/whisper/`ディレクトリにwhisper.jsとwhisper.wasmが存在することを確認
   - ブラウザのWebAssemblyサポートを確認

2. **モデルファイルが見つからない**
   - `/public/whisper/ggml-base.en.bin`が存在することを確認
   - モデルファイルのダウンロードが必要

3. **音声ファイルが処理できない**
   - サポートされている音声形式かどうか確認
   - ファイルサイズが制限内かどうか確認

### デバッグ方法

1. ブラウザの開発者ツールでコンソールログを確認
2. ネットワークタブでファイルの読み込み状況を確認
3. アプリケーションタブでWebAssemblyモジュールの状態を確認

## ライセンス

この実装はMITライセンスの下で提供されています。whisper.cppのライセンスも確認してください。
