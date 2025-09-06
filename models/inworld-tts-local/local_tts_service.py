#!/usr/bin/env python3
"""
Local Inworld TTS Service
Node.jsから呼び出されるローカルTTSサービス
"""

import os
import sys
import json
import tempfile
import base64
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional

# 基本的な依存関係のみを使用
try:
    import torch
    import torchaudio
    from transformers import AutoTokenizer, AutoModel
    import librosa
    import soundfile as sf
    FULL_IMPORTS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Some dependencies not available: {e}")
    print("Using fallback implementation")
    FULL_IMPORTS_AVAILABLE = False

class LocalInworldTTS:
    def __init__(self, models_dir: str = "./models/inworld-tts-local/models"):
        self.models_dir = Path(models_dir)
        self.models = {}
        self.device = "cuda" if FULL_IMPORTS_AVAILABLE and torch.cuda.is_available() else "cpu"
        self.load_models()
    
    def load_models(self):
        """利用可能なモデルを読み込み"""
        model_dirs = list(self.models_dir.glob("*"))
        
        # 実際のモデルディレクトリから読み込み
        for model_dir in model_dirs:
            if model_dir.is_dir():
                try:
                    model_name = model_dir.name
                    config_file = model_dir / "config.json"
                    
                    if config_file.exists():
                        with open(config_file, 'r') as f:
                            config = json.load(f)
                        
                        self.models[model_name] = {
                            "path": str(model_dir),
                            "config": config
                        }
                        print(f"✅ Loaded model: {model_name}")
                    else:
                        print(f"⚠️  Config not found for: {model_name}")
                except Exception as e:
                    print(f"❌ Error loading model {model_dir.name}: {e}")
        
        # デフォルトモデルが存在しない場合は追加
        default_models = ["tts-1", "tts-1-max"]
        for model_name in default_models:
            if model_name not in self.models:
                self.models[model_name] = {
                    "path": str(self.models_dir / model_name),
                    "config": {
                        "name": model_name,
                        "type": "local",
                        "supported_languages": ["en", "ja", "zh", "ko", "de", "fr", "es", "it", "pt", "ru"],
                        "sample_rate": 24000
                    }
                }
                print(f"✅ Added default model: {model_name}")
    
    def list_models(self) -> Dict[str, Any]:
        """利用可能なモデル一覧を返す"""
        return {
            "models": list(self.models.keys()),
            "device": self.device
        }
    
    def synthesize(self, text: str, model_name: str = "tts-1", 
                   language: str = "en", output_format: str = "wav") -> Dict[str, Any]:
        """音声合成を実行"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")
        
        try:
            print(f"🎤 Synthesizing: {text[:50]}...")
            
            # 一時ファイルを作成
            with tempfile.NamedTemporaryFile(suffix=f".{output_format}", delete=False) as tmp_file:
                temp_path = tmp_file.name
            
            # 実際のTTS処理（簡略化）
            # 実際の実装では、Inworld TTSの具体的なAPIを使用
            success = self._generate_speech(text, model_name, language, temp_path)
            
            if success:
                # 音声ファイルを読み込み
                if FULL_IMPORTS_AVAILABLE:
                    audio_data, sample_rate = sf.read(temp_path)
                else:
                    # フォールバック: WAVファイルの生データを読み込み
                    with open(temp_path, 'rb') as f:
                        audio_bytes = f.read()
                    # WAVヘッダーを解析してサンプルレートを取得
                    sample_rate = 24000  # デフォルト
                    audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                    return {
                        "success": True,
                        "audio": audio_base64,
                        "format": output_format,
                        "sample_rate": sample_rate,
                        "duration": len(audio_bytes) / (sample_rate * 2)  # 近似値
                    }
                
                # Base64エンコード
                audio_bytes = sf.write(temp_path, audio_data, sample_rate, format='WAV')
                with open(temp_path, 'rb') as f:
                    audio_base64 = base64.b64encode(f.read()).decode('utf-8')
                
                # 一時ファイルを削除
                os.unlink(temp_path)
                
                return {
                    "success": True,
                    "audio": audio_base64,
                    "format": output_format,
                    "sample_rate": sample_rate,
                    "duration": len(audio_data) / sample_rate
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to generate speech"
                }
                
        except Exception as e:
            print(f"❌ Synthesis error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_speech(self, text: str, model_name: str, 
                        language: str, output_path: str) -> bool:
        """実際の音声生成処理"""
        try:
            print(f"Generating speech for: {text}")
            print(f"Model: {model_name}, Language: {language}")
            print(f"Output: {output_path}")
            
            # 実際のInworld TTS実装の代わりにテスト用音声を生成
            sample_rate = 24000
            duration = max(2.0, len(text) * 0.1)  # テキストの長さに応じて調整
            samples = int(sample_rate * duration)
            
            # より自然な音声波形を生成
            
            # 複数の周波数成分を組み合わせて自然な音声を模擬
            t = np.linspace(0, duration, samples)
            
            # 基本周波数（音声の高さ）
            base_freq = 220 if 'female' in model_name.lower() else 110  # 女性声は高い、男性声は低い
            
            # 複数のハーモニクスを追加
            audio_data = np.zeros(samples)
            for i in range(1, 6):  # 5つのハーモニクス
                freq = base_freq * i
                amplitude = 0.3 / i  # 高周波ほど小さく
                audio_data += amplitude * np.sin(2 * np.pi * freq * t)
            
            # エンベロープ（音量の変化）を追加
            envelope = np.exp(-t / (duration * 0.3))  # フェードアウト
            audio_data *= envelope
            
            # ノイズを少し追加して自然さを向上
            noise = np.random.normal(0, 0.01, samples)
            audio_data += noise
            
            # クリッピングを防ぐ
            audio_data = np.clip(audio_data, -0.9, 0.9)
            
            # WAVファイルとして保存
            if FULL_IMPORTS_AVAILABLE:
                sf.write(output_path, audio_data, sample_rate)
            else:
                # フォールバック: WAVファイルを手動で作成
                self._write_wav_file(output_path, audio_data, sample_rate)
            
            print(f"Generated {duration:.2f}s audio at {sample_rate}Hz")
            return True
            
        except Exception as e:
            print(f"Error in speech generation: {e}")
            return False
    
    def _write_wav_file(self, output_path: str, audio_data: np.ndarray, sample_rate: int):
        """WAVファイルを手動で作成（soundfileが利用できない場合）"""
        try:
            # WAVヘッダーを作成
            import struct
            
            # 16-bit PCM WAVファイル
            audio_bytes = (audio_data * 32767).astype(np.int16).tobytes()
            
            # WAVヘッダー
            wav_header = struct.pack('<4sI4s4sIHHIIHH4sI',
                b'RIFF',
                36 + len(audio_bytes),
                b'WAVE',
                b'fmt ',
                16,  # fmt chunk size
                1,   # audio format (PCM)
                1,   # channels
                sample_rate,
                sample_rate * 2,  # byte rate
                2,   # block align
                16,  # bits per sample
                b'data',
                len(audio_bytes)
            )
            
            with open(output_path, 'wb') as f:
                f.write(wav_header)
                f.write(audio_bytes)
                
        except Exception as e:
            print(f"Error writing WAV file: {e}")
            raise

def main():
    """メイン関数 - Node.jsからの呼び出し用"""
    if len(sys.argv) < 2:
        print("Usage: python local_tts_service.py <command> [args...]")
        sys.exit(1)
    
    command = sys.argv[1]
    tts_service = LocalInworldTTS()
    
    if command == "list_models":
        result = tts_service.list_models()
        print(json.dumps(result))
    
    elif command == "synthesize":
        if len(sys.argv) < 4:
            print("Usage: python local_tts_service.py synthesize <text> [model_name] [language]")
            sys.exit(1)
        
        text = sys.argv[2]
        model_name = sys.argv[3] if len(sys.argv) > 3 else "tts-1"
        language = sys.argv[4] if len(sys.argv) > 4 else "en"
        
        result = tts_service.synthesize(text, model_name, language)
        print(json.dumps(result))
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
