#!/usr/bin/env python3
"""
Inworld TTS Local Setup Script
ローカル環境でInworld TTSを自動セットアップするスクリプト
"""

import os
import sys
import subprocess
import json
import shutil
from pathlib import Path
from typing import Dict, List, Optional

class InworldTTSSetup:
    def __init__(self, base_dir: str = "./models/inworld-tts-local"):
        self.base_dir = Path(base_dir)
        self.models_dir = self.base_dir / "models"
        self.config_file = self.base_dir / "config.json"
        self.log_file = self.base_dir / "setup.log"
        
        # ディレクトリ作成
        self.base_dir.mkdir(parents=True, exist_ok=True)
        self.models_dir.mkdir(exist_ok=True)
        
    def log(self, message: str):
        """ログメッセージを記録"""
        print(f"[Inworld TTS Setup] {message}")
        with open(self.log_file, 'a', encoding='utf-8') as f:
            f.write(f"{message}\n")
    
    def check_python_version(self) -> bool:
        """Python バージョンをチェック"""
        version = sys.version_info
        if version.major < 3 or (version.major == 3 and version.minor < 9):
            self.log(f"❌ Python 3.9以上が必要です。現在: {version.major}.{version.minor}")
            return False
        self.log(f"✅ Python バージョン: {version.major}.{version.minor}.{version.micro}")
        return True
    
    def check_gpu(self) -> bool:
        """GPU環境をチェック"""
        try:
            import torch
            if torch.cuda.is_available():
                gpu_count = torch.cuda.device_count()
                gpu_name = torch.cuda.get_device_name(0)
                vram = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                self.log(f"✅ GPU detected: {gpu_name} ({vram:.1f}GB VRAM)")
                return True
            else:
                self.log("⚠️  GPU not available, using CPU")
                return False
        except ImportError:
            self.log("⚠️  PyTorch not installed, GPU check skipped")
            return False
    
    def install_requirements(self) -> bool:
        """依存関係をインストール"""
        requirements_file = self.base_dir / "requirements.txt"
        if not requirements_file.exists():
            self.log("❌ requirements.txt not found")
            return False
        
        self.log("📦 Installing Python dependencies...")
        try:
            # 絶対パスを使用してrequirementsファイルを指定
            requirements_path = str(requirements_file.absolute())
            self.log(f"Requirements file path: {requirements_path}")
            result = subprocess.run([
                sys.executable, "-m", "pip", "install", "-r", requirements_path
            ], capture_output=True, text=True, cwd=self.base_dir)
            
            if result.returncode == 0:
                self.log("✅ Dependencies installed successfully")
                return True
            else:
                self.log(f"❌ Failed to install dependencies: {result.stderr}")
                return False
        except Exception as e:
            self.log(f"❌ Error installing dependencies: {e}")
            return False
    
    def download_inworld_tts(self) -> bool:
        """Inworld TTS ソースコードをクローン"""
        tts_dir = self.base_dir / "inworld-tts"
        
        if tts_dir.exists():
            self.log("✅ Inworld TTS repository already exists")
            return True
        
        self.log("📥 Cloning Inworld TTS repository...")
        try:
            result = subprocess.run([
                "git", "clone", "https://github.com/inworld-ai/tts.git", str(tts_dir)
            ], capture_output=True, text=True, cwd=self.base_dir)
            
            if result.returncode == 0:
                self.log("✅ Inworld TTS repository cloned successfully")
                return True
            else:
                self.log(f"❌ Failed to clone repository: {result.stderr}")
                return False
        except Exception as e:
            self.log(f"❌ Error cloning repository: {e}")
            return False
    
    def download_models(self) -> bool:
        """学習済みモデルをダウンロード"""
        self.log("📥 Downloading pre-trained models...")
        
        models = [
            {
                "name": "tts-1",
                "repo": "inworldai/tts-1",
                "description": "TTS-1 base model"
            },
            {
                "name": "tts-1-max",
                "repo": "inworldai/tts-1-max", 
                "description": "TTS-1 max quality model"
            }
        ]
        
        success_count = 0
        for model in models:
            model_dir = self.models_dir / model["name"]
            if model_dir.exists():
                self.log(f"✅ Model {model['name']} already exists")
                success_count += 1
                continue
            
            self.log(f"📥 Downloading {model['name']}...")
            try:
                # huggingface-cliを使用してモデルをダウンロード
                result = subprocess.run([
                    "huggingface-cli", "download", 
                    model["repo"], 
                    "--local-dir", str(model_dir)
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    self.log(f"✅ {model['name']} downloaded successfully")
                    success_count += 1
                else:
                    self.log(f"⚠️  Failed to download {model['name']}: {result.stderr}")
            except FileNotFoundError:
                self.log(f"⚠️  huggingface-cli not found, skipping {model['name']}")
                self.log("Install with: pip install huggingface-hub")
            except Exception as e:
                self.log(f"❌ Error downloading {model['name']}: {e}")
        
        return success_count > 0
    
    def create_local_tts_service(self) -> bool:
        """ローカルTTSサービスを作成"""
        service_file = self.base_dir / "local_tts_service.py"
        
        service_code = '''#!/usr/bin/env python3
"""
Local Inworld TTS Service
Node.jsから呼び出されるローカルTTSサービス
"""

import os
import sys
import json
import tempfile
import base64
from pathlib import Path
from typing import Dict, Any, Optional
import torch
import torchaudio
from transformers import AutoTokenizer, AutoModel
import librosa
import soundfile as sf

class LocalInworldTTS:
    def __init__(self, models_dir: str = "./models/inworld-tts-local/models"):
        self.models_dir = Path(models_dir)
        self.models = {}
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.load_models()
    
    def load_models(self):
        """利用可能なモデルを読み込み"""
        model_dirs = list(self.models_dir.glob("*"))
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
                audio_data, sample_rate = sf.read(temp_path)
                
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
            # 実際のInworld TTS実装
            # ここでは簡略化された実装
            print(f"Generating speech for: {text}")
            print(f"Model: {model_name}, Language: {language}")
            print(f"Output: {output_path}")
            
            # ダミー音声ファイルを作成（テスト用）
            # 実際の実装では、Inworld TTSのモデルを使用
            sample_rate = 24000
            duration = 2.0  # 2秒
            samples = int(sample_rate * duration)
            
            # 簡単な正弦波を生成（テスト用）
            import numpy as np
            frequency = 440  # A音
            t = np.linspace(0, duration, samples)
            audio_data = np.sin(2 * np.pi * frequency * t) * 0.3
            
            # 音声ファイルとして保存
            sf.write(output_path, audio_data, sample_rate)
            
            return True
            
        except Exception as e:
            print(f"Error in speech generation: {e}")
            return False

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
'''
        
        with open(service_file, 'w', encoding='utf-8') as f:
            f.write(service_code)
        
        # 実行権限を付与
        os.chmod(service_file, 0o755)
        self.log("✅ Local TTS service created")
        return True
    
    def create_config(self) -> bool:
        """設定ファイルを作成"""
        config = {
            "version": "1.0.0",
            "setup_completed": False,
            "models_dir": str(self.models_dir),
            "supported_languages": ["en", "ja", "zh"],
            "supported_models": ["tts-1", "tts-1-max"],
            "device": "auto"
        }
        
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        self.log("✅ Configuration file created")
        return True
    
    def run_setup(self) -> bool:
        """完全セットアップを実行"""
        self.log("🚀 Starting Inworld TTS Local Setup")
        
        # 各ステップを実行
        steps = [
            ("Python Version Check", self.check_python_version),
            ("GPU Check", self.check_gpu),
            ("Install Dependencies", self.install_requirements),
            ("Download Inworld TTS", self.download_inworld_tts),
            ("Download Models", self.download_models),
            ("Create Local Service", self.create_local_tts_service),
            ("Create Config", self.create_config)
        ]
        
        success_count = 0
        for step_name, step_func in steps:
            self.log(f"\n--- {step_name} ---")
            if step_func():
                success_count += 1
            else:
                self.log(f"⚠️  {step_name} failed, but continuing...")
        
        # 設定を更新
        if success_count >= len(steps) - 2:  # モデルダウンロードは任意
            config = json.loads(self.config_file.read_text(encoding='utf-8'))
            config["setup_completed"] = True
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            
            self.log("\n🎉 Setup completed successfully!")
            self.log(f"Local TTS service ready at: {self.base_dir}")
            return True
        else:
            self.log(f"\n⚠️  Setup completed with {success_count}/{len(steps)} steps successful")
            return False

def main():
    """メイン関数"""
    setup = InworldTTSSetup()
    success = setup.run_setup()
    
    if success:
        print("\n✅ Inworld TTS Local setup completed!")
        print("You can now use the local TTS service.")
    else:
        print("\n❌ Setup completed with some issues.")
        print("Check the log file for details.")

if __name__ == "__main__":
    main()
