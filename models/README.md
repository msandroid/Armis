# Models Directory

このディレクトリには、LlamaCppServiceで使用するGGUF形式のモデルファイルを配置してください。

## 推奨モデル

以下のモデルが推奨されています：

### 軽量モデル（4-8GB RAM）
- `llama-2-7b-chat.gguf` - Meta社のLlama 2 7Bチャットモデル
- `mistral-7b-instruct-v0.2.gguf` - Mistral AIの7B指示モデル
- `qwen2-7b-instruct.gguf` - AlibabaのQwen2 7B指示モデル

### 中規模モデル（8-16GB RAM）
- `llama-2-13b-chat.gguf` - Meta社のLlama 2 13Bチャットモデル
- `mistral-7b-instruct-v0.3.gguf` - Mistral AIの最新7B指示モデル

### 大規模モデル（16GB+ RAM）
- `llama-2-70b-chat.gguf` - Meta社のLlama 2 70Bチャットモデル
- `qwen2-72b-instruct.gguf` - AlibabaのQwen2 72B指示モデル

## モデルのダウンロード

### Hugging Faceからダウンロード

```bash
# TheBlokeのリポジトリからダウンロード
wget https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf -O models/llama-2-7b-chat.gguf

# Mistralモデル
wget https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf -O models/mistral-7b-instruct-v0.2.gguf
```

### 手動ダウンロード

1. [Hugging Face Models](https://huggingface.co/models?search=gguf) にアクセス
2. 希望のモデルを検索
3. GGUFファイルをダウンロード
4. このディレクトリに配置

## ファイル命名規則

モデルファイルは以下の命名規則に従ってください：

```
{model-name}-{version}.gguf
```

例：
- `llama-2-7b-chat.gguf`
- `mistral-7b-instruct-v0.2.gguf`
- `qwen2-7b-instruct.gguf`

## 量子化レベル

GGUFファイルには異なる量子化レベルがあります：

- `Q2_K` - 最も軽量（低品質）
- `Q4_K_M` - バランス（推奨）
- `Q5_K_M` - 高品質（大容量）
- `Q8_0` - 最高品質（最大容量）

## 注意事項

1. **ファイルサイズ**: モデルファイルは数GBになる場合があります
2. **ダウンロード時間**: インターネット接続速度に応じて時間がかかります
3. **ストレージ**: 十分なディスク容量を確保してください
4. **メモリ**: モデルサイズに応じて十分なRAMが必要です

## 設定例

LlamaCppServiceでモデルを使用する場合：

```typescript
const llamaCppService = new LlamaCppService({
  modelPath: './models/llama-2-7b-chat.gguf',
  temperature: 0.7,
  maxTokens: 2048,
  contextSize: 4096,
  threads: 4
})
```

## トラブルシューティング

### モデルファイルが見つからない
- ファイルパスが正しいか確認
- ファイル名の大文字小文字を確認
- ファイルが完全にダウンロードされているか確認

### メモリ不足エラー
- より小さいモデルを使用
- より低い量子化レベルのモデルを使用
- システムのメモリを増設

### パフォーマンスが遅い
- CPUスレッド数を増やす
- GPU使用を有効化（対応している場合）
- より小さいモデルを使用
