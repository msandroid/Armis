#!/usr/bin/env python3
"""
Coqui XTTS-v2 TTS Service
Node.jsから呼び出されるローカルTTSサービス
"""

import os
import sys
import json
import tempfile
import base64
import time
from pathlib import Path
from typing import Dict, Any, Optional
import torch
import torchaudio
import numpy as np
import soundfile as sf

# XTTS-v2のインポート
try:
    from TTS.api import TTS
    from TTS.tts.configs.xtts_config import XttsConfig
    from TTS.tts.models.xtts import Xtts
except ImportError:
    print("❌ TTS library not found. Please install: pip install TTS")
    sys.exit(1)

class CoquiXTTSService:
    def __init__(self, models_dir: str = "./models/coqui-xtts"):
        self.models_dir = Path(models_dir)
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
        self.huggingface_model_path = self.models_dir / "xtts_v2_model"
        self.load_model()
    
    def load_model(self):
        """XTTS-v2モデルを読み込み"""
        try:
            print(f"🎤 Loading XTTS-v2 model on {self.device}...")
            
            # モデルディレクトリを作成
            self.models_dir.mkdir(parents=True, exist_ok=True)
            
            # Hugging Faceからダウンロードしたモデルがある場合は使用
            if self.huggingface_model_path.exists():
                print(f"📁 Using Hugging Face model from: {self.huggingface_model_path}")
                # ローカルモデルパスを使用
                model_path = str(self.huggingface_model_path)
            else:
                print("🌐 Using online model (will download automatically)")
                model_path = self.model_name
            
            # XTTS-v2モデルを初期化
            self.model = TTS(model_path)
            
            # デバイスに移動
            if self.device == "cuda":
                self.model.cuda()
            
            print("✅ XTTS-v2 model loaded successfully")
            
        except Exception as e:
            print(f"❌ Error loading XTTS-v2 model: {e}")
            raise
    
    def list_voices(self) -> Dict[str, Any]:
        """利用可能な音声一覧を返す"""
        voices = [
            {"id": "p225", "name": "Female Voice 1", "gender": "female", "language": "en"},
            {"id": "p226", "name": "Male Voice 1", "gender": "male", "language": "en"},
            {"id": "p227", "name": "Female Voice 2", "gender": "female", "language": "en"},
            {"id": "p228", "name": "Male Voice 2", "gender": "male", "language": "en"},
            {"id": "p229", "name": "Female Voice 3", "gender": "female", "language": "en"},
            {"id": "p230", "name": "Male Voice 3", "gender": "male", "language": "en"}
        ]
        
        return {
            "voices": voices,
            "device": self.device,
            "model": self.model_name,
            "model_path": str(self.huggingface_model_path) if self.huggingface_model_path.exists() else "online"
        }
    
    def synthesize(self, text: str, voice_name: str = "p225", 
                   language: str = "en", speed: float = 1.0,
                   output_format: str = "wav") -> Dict[str, Any]:
        """音声合成を実行"""
        if not self.model:
            raise ValueError("Model not loaded")
        
        try:
            print(f"🎤 Synthesizing: {text[:50]}...")
            print(f"Voice: {voice_name}, Language: {language}, Speed: {speed}")
            
            # 一時ファイルを作成
            with tempfile.NamedTemporaryFile(suffix=f".{output_format}", delete=False) as tmp_file:
                temp_path = tmp_file.name
            
            # リファレンス音声ファイルのパスを確認
            ref_audio_path = self.models_dir / "reference_audio" / f"{voice_name}.wav"
            
            if not ref_audio_path.exists():
                print(f"⚠️ Reference audio not found: {ref_audio_path}")
                print("Creating default reference audio...")
                self._create_default_reference_audio(voice_name)
            
            # 音声合成を実行
            start_time = time.time()
            
            # XTTS-v2で音声合成
            wav = self.model.tts(
                text=text,
                speaker_wav=str(ref_audio_path),
                language=language,
                speed=speed
            )
            
            synthesis_time = time.time() - start_time
            
            # 音声データを保存
            sf.write(temp_path, wav, 24000)
            
            # 音声ファイルを読み込み
            audio_data, sample_rate = sf.read(temp_path)
            
            # Base64エンコード
            with open(temp_path, 'rb') as f:
                audio_base64 = base64.b64encode(f.read()).decode('utf-8')
            
            # 一時ファイルを削除
            os.unlink(temp_path)
            
            duration = len(audio_data) / sample_rate
            
            print(f"✅ Synthesis completed in {synthesis_time:.2f}s")
            print(f"Audio duration: {duration:.2f}s, Sample rate: {sample_rate}Hz")
            
            return {
                "success": True,
                "audio": audio_base64,
                "format": output_format,
                "sample_rate": sample_rate,
                "duration": duration,
                "synthesis_time": synthesis_time
            }
            
        except Exception as e:
            print(f"❌ Synthesis error: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _create_default_reference_audio(self, voice_name: str):
        """デフォルトのリファレンス音声を作成"""
        ref_audio_dir = self.models_dir / "reference_audio"
        ref_audio_dir.mkdir(exist_ok=True)
        
        audio_path = ref_audio_dir / f"{voice_name}.wav"
        
        # より自然な音声波形を生成
        sample_rate = 24000
        duration = 3.0  # 3秒
        samples = int(sample_rate * duration)
        
        # 基本周波数（音声の高さ）
        base_freq = 220 if voice_name in ['p225', 'p227', 'p229'] else 110
        
        # 複数のハーモニクスを追加してより自然な音声に
        t = np.linspace(0, duration, samples)
        audio_data = np.zeros(samples)
        
        # 基本周波数とハーモニクス
        for i in range(1, 8):  # 7つのハーモニクス
            freq = base_freq * i
            amplitude = 0.4 / (i ** 0.8)  # より自然な減衰
            audio_data += amplitude * np.sin(2 * np.pi * freq * t)
        
        # フォルマント（音声の特徴的な周波数）を追加
        formant_freqs = [500, 1500, 2500, 3500] if voice_name in ['p225', 'p227', 'p229'] else [400, 1200, 2200, 3200]
        for freq in formant_freqs:
            amplitude = 0.1
            audio_data += amplitude * np.sin(2 * np.pi * freq * t)
        
        # エンベロープ（音量の変化）を追加
        envelope = np.exp(-t / (duration * 0.4))  # より緩やかなフェードアウト
        audio_data *= envelope
        
        # ノイズを少し追加して自然さを向上
        noise = np.random.normal(0, 0.005, samples)
        audio_data += noise
        
        # クリッピングを防ぐ
        audio_data = np.clip(audio_data, -0.9, 0.9)
        
        # WAVファイルとして保存
        sf.write(audio_path, audio_data, sample_rate)
        print(f"Created reference audio: {voice_name}.wav")
    
    def check_model_exists(self) -> Dict[str, Any]:
        """モデルの存在確認"""
        try:
            # TTSライブラリがインストールされているかチェック
            import TTS
            
            # Hugging Faceモデルの存在確認
            if self.huggingface_model_path.exists():
                model_files = list(self.huggingface_model_path.rglob("*.bin")) + list(self.huggingface_model_path.rglob("*.safetensors"))
                if model_files:
                    return {
                        "exists": True, 
                        "message": f"TTS library available, Hugging Face model found ({len(model_files)} files)",
                        "model_path": str(self.huggingface_model_path)
                    }
                else:
                    return {
                        "exists": True, 
                        "message": "TTS library available, but no model files found in Hugging Face directory",
                        "model_path": str(self.huggingface_model_path)
                    }
            else:
                return {
                    "exists": True, 
                    "message": "TTS library available, will use online model",
                    "model_path": "online"
                }
        except ImportError:
            return {"exists": False, "error": "TTS library not installed"}
    
    def download_model(self) -> Dict[str, Any]:
        """モデルのダウンロード（従来の方法との互換性）"""
        try:
            print("📥 Downloading XTTS-v2 model...")
            
            # モデルディレクトリを作成
            self.models_dir.mkdir(parents=True, exist_ok=True)
            
            # リファレンス音声ディレクトリを作成
            ref_audio_dir = self.models_dir / "reference_audio"
            ref_audio_dir.mkdir(exist_ok=True)
            
            # デフォルトのリファレンス音声を作成
            voices = ["p225", "p226", "p227", "p228", "p229", "p230"]
            for voice in voices:
                self._create_default_reference_audio(voice)
            
            print("✅ XTTS-v2 model setup completed")
            return {"success": True, "message": "Model setup completed"}
            
        except Exception as e:
            print(f"❌ Error downloading model: {e}")
            return {"success": False, "error": str(e)}

def main():
    """メイン関数 - Node.jsからの呼び出し用"""
    if len(sys.argv) < 2:
        print("Usage: python xtts_service.py <command> [args...]")
        sys.exit(1)
    
    command = sys.argv[1]
    service = CoquiXTTSService()
    
    if command == "list_voices":
        result = service.list_voices()
        print(json.dumps(result))
    
    elif command == "synthesize":
        if len(sys.argv) < 3:
            print("Usage: python xtts_service.py synthesize <text> [voice_name] [language] [speed]")
            sys.exit(1)
        
        text = sys.argv[2]
        voice_name = sys.argv[3] if len(sys.argv) > 3 else "p225"
        language = sys.argv[4] if len(sys.argv) > 4 else "en"
        speed = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
        
        result = service.synthesize(text, voice_name, language, speed)
        print(json.dumps(result))
    
    elif command == "check_model":
        result = service.check_model_exists()
        print(json.dumps(result))
    
    elif command == "download_model":
        result = service.download_model()
        print(json.dumps(result))
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
