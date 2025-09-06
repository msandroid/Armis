# Coqui XTTS-v2 Integration

このディレクトリには、Coqui XTTS-v2（eXtended Text-to-Speech v2）の統合が含まれています。XTTS-v2は、高品質な多言語音声合成を提供する最新のTTSモデルです。

## 特徴

- 🎤 **高品質音声合成**: 自然で表現豊かな音声を生成
- 🌍 **多言語対応**: 英語、日本語、中国語、韓国語など16言語をサポート
- 🎭 **音声クローニング**: 短いリファレンス音声から音声スタイルを学習
- ⚡ **高速処理**: GPU対応で高速な音声合成
- 🔧 **ローカル実行**: インターネット接続不要でローカルで動作

## セットアップ

### 前提条件

- Python 3.8以上
- Git
- CUDA対応GPU（推奨、CPUでも動作可能）

### 自動セットアップ

完全なセットアップを実行するには：

```bash
cd models/coqui-xtts
python setup.py setup
```

このコマンドは以下を自動実行します：
1. Coqui TTSリポジトリのクローン
2. 依存関係のインストール
3. TTSライブラリのソースからのインストール
4. Hugging FaceからのXTTS-v2モデルのダウンロード
5. リファレンス音声ファイルの作成

### 手動セットアップ

個別のステップを実行する場合：

```bash
# 1. TTSリポジトリのクローン
python setup.py clone_repo

# 2. 依存関係のインストール
python setup.py install_deps

# 3. TTSライブラリのソースからのインストール
python setup.py install_tts

# 4. Hugging Faceからのモデルダウンロード
python setup.py download_model

# 5. リファレンス音声の作成
python setup.py create_audio
```

### セットアップ状況の確認

```bash
python setup.py check
```

## 使用方法

### 基本的な音声合成

```python
from xtts_service import CoquiXTTSService

# サービスの初期化
service = CoquiXTTSService()

# 音声合成
result = service.synthesize(
    text="Hello, this is a test of XTTS-v2.",
    voice_name="p225",
    language="en",
    speed=1.0
)

if result["success"]:
    print("音声合成が成功しました")
    # result["audio"] にBase64エンコードされた音声データが含まれます
else:
    print(f"エラー: {result['error']}")
```

### 利用可能な音声

```python
voices = service.list_voices()
print("利用可能な音声:", voices["voices"])
```

### コマンドラインからの使用

```bash
# 音声一覧の表示
python xtts_service.py list_voices

# 音声合成
python xtts_service.py synthesize "Hello, world!" p225 en 1.0

# モデル状況の確認
python xtts_service.py check_model
```

## サポートされている言語

- 英語 (en)
- スペイン語 (es)
- フランス語 (fr)
- ドイツ語 (de)
- イタリア語 (it)
- ポルトガル語 (pt)
- ポーランド語 (pl)
- トルコ語 (tr)
- ロシア語 (ru)
- オランダ語 (nl)
- チェコ語 (cs)
- アラビア語 (ar)
- 中国語 (zh-cn)
- 日本語 (ja)
- 韓国語 (ko)
- ヒンディー語 (hi)

## 利用可能な音声

| ID | 名前 | 性別 | 言語 |
|----|------|------|------|
| p225 | Female Voice 1 | 女性 | 英語 |
| p226 | Male Voice 1 | 男性 | 英語 |
| p227 | Female Voice 2 | 女性 | 英語 |
| p228 | Male Voice 2 | 男性 | 英語 |
| p229 | Female Voice 3 | 女性 | 英語 |
| p230 | Male Voice 3 | 男性 | 英語 |

## ファイル構成

```
models/coqui-xtts/
├── README.md              # このファイル
├── setup.py               # セットアップスクリプト
├── xtts_service.py        # TTSサービス
├── TTS/                   # Coqui TTSリポジトリ（クローン後）
├── xtts_v2_model/         # Hugging Faceからダウンロードしたモデル
├── reference_audio/       # リファレンス音声ファイル
│   ├── p225.wav
│   ├── p226.wav
│   └── ...
└── requirements.txt       # 依存関係リスト
```

## トラブルシューティング

### よくある問題

1. **Gitが見つからない**
   ```bash
   # macOS
   brew install git
   
   # Ubuntu/Debian
   sudo apt-get install git
   
   # Windows
   # Git for Windowsをダウンロードしてインストール
   ```

2. **CUDAエラー**
   - CPU版のPyTorchを使用するか、CUDAドライバーを更新してください

3. **メモリ不足**
   - より小さなバッチサイズを使用するか、GPUメモリを増やしてください

4. **モデルダウンロードエラー**
   ```bash
   # 手動でモデルをダウンロード
   python setup.py download_model
   ```

### ログの確認

セットアップ中に問題が発生した場合は、詳細なログを確認してください：

```bash
python setup.py check
```

## パフォーマンス

- **GPU使用時**: 約2-5秒で音声合成
- **CPU使用時**: 約10-30秒で音声合成
- **モデルサイズ**: 約4GB（Hugging Faceキャッシュ）

## ライセンス

Coqui XTTS-v2はMITライセンスの下で提供されています。詳細は[Coqui TTSリポジトリ](https://github.com/coqui-ai/TTS)を参照してください。

## 参考リンク

- [Coqui TTS GitHub](https://github.com/coqui-ai/TTS)
- [XTTS-v2 Hugging Face](https://huggingface.co/coqui/XTTS-v2)
- [XTTS-v2 ドキュメント](https://docs.coqui.ai/en/latest/models/xtts.html)
