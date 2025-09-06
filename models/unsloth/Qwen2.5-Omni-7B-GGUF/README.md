# Qwen2.5-Omni-7B-GGUF Model Directory

このディレクトリには、Qwen2.5-Omni-7B-GGUFモデルファイルを配置してください。

## モデル情報

- **モデル名**: Qwen2.5-Omni-7B-GGUF
- **開発者**: Alibaba / Unsloth
- **パラメータ数**: 7.62B
- **ライセンス**: Apache-2.0
- **特徴**: マルチモーダル（テキスト、画像、音声、動画）+ 音声生成

## ダウンロード

### Hugging Faceからダウンロード

```bash
# Q4_K_M量子化（推奨）
wget https://huggingface.co/unsloth/Qwen2.5-Omni-7B-GGUF/resolve/main/Qwen2.5-Omni-7B-Q4_K_M.gguf -O models/unsloth/Qwen2.5-Omni-7B-GGUF/Qwen2.5-Omni-7B-Q4_K_M.gguf

# Q5_K_M量子化（高品質）
wget https://huggingface.co/unsloth/Qwen2.5-Omni-7B-GGUF/resolve/main/Qwen2.5-Omni-7B-Q5_K_M.gguf -O models/unsloth/Qwen2.5-Omni-7B-GGUF/Qwen2.5-Omni-7B-Q5_K_M.gguf

# Q8_0量子化（最高品質）
wget https://huggingface.co/unsloth/Qwen2.5-Omni-7B-GGUF/resolve/main/Qwen2.5-Omni-7B-Q8_0.gguf -O models/unsloth/Qwen2.5-Omni-7B-GGUF/Qwen2.5-Omni-7B-Q8_0.gguf
```

### 手動ダウンロード

1. [Hugging Face Qwen2.5-Omni-7B-GGUF](https://huggingface.co/unsloth/Qwen2.5-Omni-7B-GGUF) にアクセス
2. 希望の量子化レベルのGGUFファイルをダウンロード
3. このディレクトリに配置

## 量子化レベル

| 量子化レベル | サイズ | 品質 | メモリ使用量 | 推奨用途 |
|-------------|--------|------|-------------|----------|
| Q4_K_M | 4.68 GB | 良好 | ~6 GB | 一般的な用途 |
| Q5_K_M | 5.44 GB | 高品質 | ~7 GB | 高品質が必要な場合 |
| Q8_0 | 8.1 GB | 最高品質 | ~10 GB | 最高品質が必要な場合 |

## ファイル命名規則

モデルファイルは以下の命名規則に従ってください：

```
qwen2.5-omni-7b.{quantization}.gguf
```

例：
- `qwen2.5-omni-7b.Q4_K_M.gguf`
- `qwen2.5-omni-7b.Q5_K_M.gguf`
- `qwen2.5-omni-7b.Q8_0.gguf`

## 使用方法

### Armisでの使用

```typescript
import { Qwen2_5OmniService } from '@/services/llm/qwen2.5-omni-service'

const qwenOmniService = new Qwen2_5OmniService({
  modelPath: './models/unsloth/Qwen2.5-Omni-7B-GGUF/qwen2.5-omni-7b.Q4_K_M.gguf',
  temperature: 0.7,
  maxTokens: 2048,
  contextSize: 32768,
  threads: 4,
  gpuLayers: 0,
  enableAudioOutput: false,
  speaker: 'Chelsie',
  useAudioInVideo: true
})

await qwenOmniService.initialize()
```

### システム要件

- **最小メモリ**: 8GB RAM
- **推奨メモリ**: 16GB+ RAM
- **CPU**: マルチコア推奨
- **GPU**: オプション（CUDA/OpenCL対応）

## 特徴

### マルチモーダル機能
- **テキスト**: 自然言語処理
- **画像**: 視覚理解・分析
- **音声**: 音声認識・理解
- **動画**: 映像・音声統合理解

### 音声生成
- **Chelsie** (女性): 温かみのある明瞭な声
- **Ethan** (男性): 明るく親しみやすい声

### アーキテクチャ
- **Thinker-Talker**: エンドツーエンドマルチモーダル設計
- **TMRoPE**: 時間同期型マルチモーダル位置埋め込み
- **リアルタイム処理**: チャンク入力と即座の出力

## 注意事項

1. **ファイルサイズ**: モデルファイルは4-8GBになります
2. **メモリ使用量**: モデルサイズに応じて6-10GBのメモリが必要です
3. **音声生成**: 現在のGGUF版では音声生成機能は制限されています
4. **マルチモーダル**: 完全なマルチモーダル機能にはTransformers版の使用を推奨

## 参考リンク

- [Qwen2.5-Omni Hugging Face](https://huggingface.co/unsloth/Qwen2.5-Omni-7B-GGUF)
- [Qwen2.5-Omni 論文](https://arxiv.org/abs/2503.20215)
- [Armis Qwen2.5-Omni統合ドキュメント](../README-qwen2.5-omni-integration.md)
