# Whisper.cpp Setup Guide

このガイドでは、whisper.cppを使用したSpeech to Text機能のセットアップ方法を説明します。

## 概要

whisper.cppは、OpenAIのWhisperモデルをC/C++で実装した軽量な音声認識ライブラリです。WebAssembly版を使用することで、ブラウザ上でローカルに音声認識を実行できます。

## セットアップ手順

### 1. モデルの事前ダウンロード

推奨モデル（軽量・高速）:
```bash
# 推奨: tiny-q5_1 (32.2MB, 多言語対応)
npm run whisper:download-tiny

# または、より高精度なモデル
npm run whisper:download-base  # base-q5_1 (59.7MB)
npm run whisper:download-small # small-q5_1 (190MB)
```

### 4. 手動ダウンロード

特定のモデルをダウンロードする場合:
```bash
# ヘルプ表示
node download-whisper-models.cjs --help

# 特定のモデルをダウンロード
node download-whisper-models.cjs tiny-q5_1
node download-whisper-models.cjs base-q5_1
node download-whisper-models.cjs small-q5_1

# 強制再ダウンロード
node download-whisper-models.cjs tiny-q5_1 --force
```

### 5. ダウンロード先

モデルファイルは以下の場所に保存されます:
```
public/whisper/models/
├── ggml-tiny-q5_1.bin
├── ggml-base-q5_1.bin
├── ggml-small-q5_1.bin
└── whisper.bin (シンボリックリンク)
```

## 使用方法

### 1. 音声ファイルの文字起こし

1. アプリケーションを起動
2. チャット画面のファイル添付ボタン（📎）をクリック
3. 音声ファイル（MP3、WAV、OGGなど）を選択
4. 自動的にwhisper.cppで文字起こしが実行される
5. 結果がメッセージ入力欄に挿入される

### 2. サポートされている音声形式

- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- FLAC (.flac)
- M4A (.m4a)
- AAC (.aac)

### 3. 言語設定

デフォルトでは日本語（`ja`）に設定されています。他の言語に変更する場合は、`WhisperLocalService`の設定を変更してください。

## 技術詳細

### WebAssemblyファイル

以下のファイルが`public/whisper/`ディレクトリに配置されています:
- `main.js` - WebAssemblyメインファイル
- `whisper.wasm` - WebAssemblyバイナリ
- `helpers.js` - ヘルパー関数

### モデルファイル

- **tiny-q5_1**: 32.2MB、多言語対応、量子化済み
- **base-q5_1**: 59.7MB、多言語対応、量子化済み
- **small-q5_1**: 190MB、多言語対応、量子化済み
- **medium-q5_0**: 539MB、多言語対応、量子化済み
- **large-v3-turbo-q5_0**: 574MB、多言語対応、最新版、量子化済み

### パフォーマンス

| モデル | ダウンロード時間 | 初期化時間 | 処理速度 | 精度 |
|--------|----------------|------------|----------|------|
| tiny-q5_1 | ~30秒 | ~2秒 | 高速 | 良好 |
| base-q5_1 | ~1分 | ~3秒 | 中速 | 良好 |
| small-q5_1 | ~3分 | ~5秒 | 低速 | 高精度 |
| medium-q5_0 | ~5分 | ~8秒 | 低速 | 高精度 |
| large-v3-turbo-q5_0 | ~6分 | ~10秒 | 低速 | 最高精度 |

## トラブルシューティング

### 1. モデルダウンロードエラー

```bash
# ネットワーク接続を確認
curl -I https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin

# 強制再ダウンロード
npm run whisper:download-tiny -- --force
```

### 2. WebAssembly初期化エラー

- ブラウザがWebAssemblyをサポートしているか確認
- ブラウザのコンソールでエラーメッセージを確認
- ページを再読み込みして再試行

### 3. メモリ不足エラー

- より軽量なモデル（tiny-q5_1）を使用
- 他のタブを閉じてメモリを解放
- ブラウザを再起動

### 4. 音声ファイルエラー

- サポートされている形式か確認
- ファイルサイズが適切か確認（推奨: 10MB以下）
- 音声ファイルが破損していないか確認

## 開発者向け情報

### WhisperLocalService設定

```typescript
const whisperService = new WhisperLocalService({
  modelPath: '/whisper/models/whisper.bin',
  language: 'ja',
  temperature: 0.0,
  maxTokens: 448
});
```

### カスタムモデル使用

```typescript
// 特定のモデルを使用
const whisperService = new WhisperLocalService({
  modelPath: '/whisper/models/ggml-base-q5_1.bin',
  language: 'en',
  temperature: 0.1
});
```

### エラーハンドリング

```typescript
try {
  const result = await whisperService.transcribeFile(audioFile);
  console.log('Transcription:', result.text);
} catch (error) {
  console.error('Transcription failed:', error);
}
```

## 参考リンク

- [whisper.cpp GitHub](https://github.com/ggml-org/whisper.cpp)
- [Hugging Face Models](https://huggingface.co/ggerganov/whisper.cpp/tree/main)
- [WebAssembly Documentation](https://webassembly.org/)
- [Whisper Model Documentation](https://github.com/ggml-org/whisper.cpp/blob/master/models/README.md)
