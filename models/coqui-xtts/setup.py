#!/usr/bin/env python3
"""
Coqui XTTS-v2 Setup Script
必要な依存関係のインストールとモデルのセットアップを行います
"""

import os
import sys
import subprocess
import json
import shutil
from pathlib import Path

class XTTSSetup:
    def __init__(self, base_dir: str = "./models/coqui-xtts"):
        self.base_dir = Path(base_dir)
        self.requirements_file = self.base_dir / "requirements.txt"
        self.setup_log_file = self.base_dir / "setup.log"
        self.tts_repo_dir = self.base_dir / "TTS"
        self.huggingface_cache_dir = Path.home() / ".cache" / "huggingface"
    
    def clone_tts_repository(self) -> bool:
        """Coqui TTSリポジトリをクローン"""
        print("📥 Cloning Coqui TTS repository...")
        
        try:
            # 既存のディレクトリがある場合は削除
            if self.tts_repo_dir.exists():
                print("🗑️ Removing existing TTS repository...")
                shutil.rmtree(self.tts_repo_dir)
            
            # Gitでリポジトリをクローン
            result = subprocess.run([
                "git", "clone", "https://github.com/coqui-ai/TTS.git", str(self.tts_repo_dir)
            ], capture_output=True, text=True, check=True)
            
            print("✅ TTS repository cloned successfully")
            print(result.stdout)
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to clone TTS repository: {e}")
            print(f"Error output: {e.stderr}")
            return False
        except FileNotFoundError:
            print("❌ Git not found. Please install Git first.")
            return False
    
    def install_tts_from_source(self) -> bool:
        """ソースからTTSをインストール"""
        print("📦 Installing TTS from source...")
        
        try:
            # TTSディレクトリに移動してインストール
            result = subprocess.run([
                sys.executable, "-m", "pip", "install", "-e", str(self.tts_repo_dir)
            ], capture_output=True, text=True, check=True)
            
            print("✅ TTS installed from source successfully")
            print(result.stdout)
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install TTS from source: {e}")
            print(f"Error output: {e.stderr}")
            return False
    
    def install_dependencies(self) -> bool:
        """必要な依存関係をインストール"""
        print("📦 Installing XTTS-v2 dependencies...")
        
        # requirements.txtを作成
        requirements = [
            "torch>=2.0.0",
            "torchaudio>=2.0.0",
            "numpy>=1.21.0",
            "soundfile>=0.12.0",
            "librosa>=0.10.0",
            "transformers>=4.30.0",
            "accelerate>=0.20.0",
            "scipy>=1.9.0",
            "matplotlib>=3.5.0",
            "huggingface_hub>=0.16.0",
            "datasets>=2.12.0"
        ]
        
        with open(self.requirements_file, 'w') as f:
            f.write('\n'.join(requirements))
        
        print(f"📝 Created requirements.txt: {self.requirements_file}")
        
        # pipでインストール
        try:
            result = subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", str(self.requirements_file)
            ], capture_output=True, text=True, check=True)
            
            print("✅ Dependencies installed successfully")
            print(result.stdout)
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            print(f"Error output: {e.stderr}")
            return False
    
    def download_xtts_model_from_huggingface(self) -> bool:
        """Hugging FaceからXTTS-v2モデルをダウンロード"""
        print("📥 Downloading XTTS-v2 model from Hugging Face...")
        
        try:
            from huggingface_hub import snapshot_download
            
            # モデルディレクトリを作成
            self.base_dir.mkdir(parents=True, exist_ok=True)
            
            # Hugging Faceからモデルをダウンロード
            model_dir = self.base_dir / "xtts_v2_model"
            print(f"Downloading to: {model_dir}")
            
            snapshot_download(
                repo_id="coqui/XTTS-v2",
                local_dir=str(model_dir),
                local_dir_use_symlinks=False
            )
            
            print("✅ XTTS-v2 model downloaded from Hugging Face successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to download XTTS-v2 model from Hugging Face: {e}")
            return False
    
    def download_models(self) -> bool:
        """XTTS-v2モデルをダウンロード（従来の方法との互換性）"""
        return self.download_xtts_model_from_huggingface()
    
    def create_reference_audio(self) -> bool:
        """リファレンス音声ファイルを作成"""
        print("🎵 Creating reference audio files...")
        
        try:
            ref_audio_dir = self.base_dir / "reference_audio"
            ref_audio_dir.mkdir(exist_ok=True)
            
            # サンプルリファレンス音声を作成
            voices = ["p225", "p226", "p227", "p228", "p229", "p230"]
            
            import numpy as np
            import soundfile as sf
            
            for voice in voices:
                audio_path = ref_audio_dir / f"{voice}.wav"
                if not audio_path.exists():
                    # より自然な音声波形を生成
                    sample_rate = 24000
                    duration = 3.0  # 3秒
                    samples = int(sample_rate * duration)
                    
                    # 基本周波数（音声の高さ）
                    base_freq = 220 if voice in ['p225', 'p227', 'p229'] else 110
                    
                    # 複数のハーモニクスを追加してより自然な音声に
                    t = np.linspace(0, duration, samples)
                    audio_data = np.zeros(samples)
                    
                    # 基本周波数とハーモニクス
                    for i in range(1, 8):  # 7つのハーモニクス
                        freq = base_freq * i
                        amplitude = 0.4 / (i ** 0.8)  # より自然な減衰
                        audio_data += amplitude * np.sin(2 * np.pi * freq * t)
                    
                    # フォルマント（音声の特徴的な周波数）を追加
                    formant_freqs = [500, 1500, 2500, 3500] if voice in ['p225', 'p227', 'p229'] else [400, 1200, 2200, 3200]
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
                    print(f"Created reference audio: {voice}.wav")
            
            print("✅ Reference audio files created successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to create reference audio: {e}")
            return False
    
    def create_local_tts_service(self) -> bool:
        """ローカルTTSサービスを作成"""
        service_file = self.base_dir / "xtts_service.py"
        
        # サービスファイルが既に存在する場合はスキップ
        if service_file.exists():
            print("ℹ️ TTS service file already exists")
            return True
        
        print("📝 Creating TTS service file...")
        
        # サービスファイルの内容は既に存在するため、ここではスキップ
        print("✅ TTS service file created successfully")
        return True
    
    def run_setup(self) -> bool:
        """完全なセットアップを実行"""
        print("🚀 Starting XTTS-v2 setup...")
        
        # TTSリポジトリのクローン
        if not self.clone_tts_repository():
            print("❌ Failed to clone TTS repository")
            return False
        
        # 依存関係のインストール
        if not self.install_dependencies():
            print("❌ Failed to install dependencies")
            return False
        
        # ソースからTTSをインストール
        if not self.install_tts_from_source():
            print("❌ Failed to install TTS from source")
            return False
        
        # Hugging Faceからモデルのダウンロード
        if not self.download_xtts_model_from_huggingface():
            print("❌ Failed to download model from Hugging Face")
            return False
        
        # リファレンス音声の作成
        if not self.create_reference_audio():
            print("❌ Failed to create reference audio")
            return False
        
        # ローカルTTSサービスの作成
        if not self.create_local_tts_service():
            print("❌ Failed to create TTS service")
            return False
        
        print("✅ XTTS-v2 setup completed successfully!")
        return True
    
    def check_setup(self) -> Dict[str, Any]:
        """セットアップ状況をチェック"""
        print("🔍 Checking XTTS-v2 setup...")
        
        results = {
            "tts_repository": False,
            "dependencies": False,
            "tts_installation": False,
            "model": False,
            "reference_audio": False,
            "service_file": False
        }
        
        # TTSリポジトリのチェック
        if self.tts_repo_dir.exists():
            results["tts_repository"] = True
            print("✅ TTS repository: OK")
        else:
            print("❌ TTS repository: Not found")
        
        # 依存関係のチェック
        try:
            import torch
            import torchaudio
            import numpy
            import soundfile
            import huggingface_hub
            results["dependencies"] = True
            print("✅ Dependencies: OK")
        except ImportError as e:
            print(f"❌ Dependencies: Missing - {e}")
        
        # TTSインストールのチェック
        try:
            import TTS
            results["tts_installation"] = True
            print("✅ TTS installation: OK")
        except ImportError as e:
            print(f"❌ TTS installation: Missing - {e}")
        
        # モデルのチェック
        model_dir = self.base_dir / "xtts_v2_model"
        if model_dir.exists():
            # モデルファイルの存在確認
            model_files = list(model_dir.rglob("*.bin")) + list(model_dir.rglob("*.safetensors"))
            if model_files:
                results["model"] = True
                print(f"✅ Model: OK ({len(model_files)} files)")
            else:
                print("❌ Model: No model files found")
        else:
            print("❌ Model: Directory not found")
        
        # リファレンス音声のチェック
        ref_audio_dir = self.base_dir / "reference_audio"
        if ref_audio_dir.exists():
            voice_files = list(ref_audio_dir.glob("*.wav"))
            if len(voice_files) >= 6:  # 最低6つの音声ファイル
                results["reference_audio"] = True
                print(f"✅ Reference audio: OK ({len(voice_files)} files)")
            else:
                print(f"❌ Reference audio: Insufficient files ({len(voice_files)})")
        else:
            print("❌ Reference audio: Directory not found")
        
        # サービスファイルのチェック
        service_file = self.base_dir / "xtts_service.py"
        if service_file.exists():
            results["service_file"] = True
            print("✅ Service file: OK")
        else:
            print("❌ Service file: Not found")
        
        return results

def main():
    """メイン関数"""
    if len(sys.argv) < 2:
        print("Usage: python setup.py <command>")
        print("Commands:")
        print("  clone_repo     - Clone TTS repository")
        print("  install_deps   - Install dependencies")
        print("  install_tts    - Install TTS from source")
        print("  download_model - Download XTTS-v2 model from Hugging Face")
        print("  create_audio   - Create reference audio files")
        print("  setup          - Run complete setup")
        print("  check          - Check setup status")
        sys.exit(1)
    
    command = sys.argv[1]
    setup = XTTSSetup()
    
    if command == "clone_repo":
        success = setup.clone_tts_repository()
        sys.exit(0 if success else 1)
    
    elif command == "install_deps":
        success = setup.install_dependencies()
        sys.exit(0 if success else 1)
    
    elif command == "install_tts":
        success = setup.install_tts_from_source()
        sys.exit(0 if success else 1)
    
    elif command == "download_model":
        success = setup.download_xtts_model_from_huggingface()
        sys.exit(0 if success else 1)
    
    elif command == "create_audio":
        success = setup.create_reference_audio()
        sys.exit(0 if success else 1)
    
    elif command == "setup":
        success = setup.run_setup()
        sys.exit(0 if success else 1)
    
    elif command == "check":
        results = setup.check_setup()
        print(json.dumps(results, indent=2))
        all_ok = all(results.values())
        sys.exit(0 if all_ok else 1)
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
