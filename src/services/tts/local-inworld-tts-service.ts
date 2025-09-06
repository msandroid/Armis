import type { 
  TTSService, 
  TTSResult, 
  TTSOptions, 
  TTSSpeaker, 
  TTSSpeakerConfig,
  InworldTTSConfig 
} from '../../types/tts'

// Electron APIの型定義を参照
declare global {
  interface Window {
    electronAPI?: {
      downloadFile: (options: any) => Promise<any>
      onDownloadProgress: (callback: (progress: any) => void) => void
      removeDownloadProgressListener: () => void
      generateImage: (options: any) => Promise<{ success: boolean; images?: string[]; error?: string }>
      generateImageWithGemini: (options: any) => Promise<{ success: boolean; images?: string[]; error?: string }>
      getEnvVars: () => Promise<any>
      checkGoogleAuth: () => Promise<any>
      localTTSSetup: (options: any) => Promise<{ success: boolean; output?: string; error?: string }>
      localTTSSynthesize: (options: any) => Promise<LocalInworldTTSResponse>
      localTTSListModels: (options: any) => Promise<{ success: boolean; models?: string[]; device?: string; error?: string }>
    }
  }
}

interface LocalInworldTTSResponse {
  success: boolean
  audio?: string
  format?: string
  sample_rate?: number
  duration?: number
  error?: string
}

// ローカルInworld TTSで利用可能な音声の定義
const AVAILABLE_VOICES: TTSSpeaker[] = [
  { id: 'tts-1-local', name: 'TTS-1 Local', voiceName: 'tts-1', language: 'en-US', description: 'Local TTS-1 model (high quality)' },
  { id: 'tts-1-max-local', name: 'TTS-1 Max Local', voiceName: 'tts-1-max', language: 'en-US', description: 'Local TTS-1 Max model (maximum quality)' }
]

// サポートされている言語
const SUPPORTED_LANGUAGES = [
  'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-BR', 'ru-RU', 'ko-KR', 'zh-CN', 'ja-JP'
]

// LocalInworldTTSResponseは既に上で定義済み

export interface LocalInworldTTSConfig extends InworldTTSConfig {
  pythonPath?: string
  modelsDir?: string
  autoSetup?: boolean
}

// Electron環境かどうかを判定
const isElectron = typeof window !== 'undefined' && !!window.electronAPI

export class LocalInworldTTSService implements TTSService {
  private config: LocalInworldTTSConfig
  private isInitialized = false
  private pythonPath: string
  private modelsDir: string
  private setupChecked = false

  constructor(config: LocalInworldTTSConfig = {}) {
    this.config = {
      model: 'tts-1',
      defaultVoice: 'tts-1',
      defaultLanguage: 'en-US',
      autoSetup: true,
      ...config
    }
    
    // Pythonパスの設定
    this.pythonPath = this.config.pythonPath || 'python3'
    this.modelsDir = this.config.modelsDir || './models/inworld-tts-local'
    
    this.initialize()
  }

  private async initialize() {
    try {
      console.log('🔧 Initializing Local Inworld TTS service...')
      console.log('Config:', {
        pythonPath: this.pythonPath,
        modelsDir: this.modelsDir,
        autoSetup: this.config.autoSetup,
        isElectron: isElectron,
        windowExists: typeof window !== 'undefined',
        electronAPIExists: typeof window !== 'undefined' && !!window.electronAPI
      })
      
      // Electron環境チェック
      if (!isElectron) {
        console.warn('⚠️  Local Inworld TTS requires Electron environment')
        console.warn('⚠️  Current environment:', {
          windowExists: typeof window !== 'undefined',
          electronAPIExists: typeof window !== 'undefined' && !!window.electronAPI,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        })
        this.isInitialized = false
        return
      }
      
      // セットアップチェック
      if (this.config.autoSetup && !this.setupChecked) {
        console.log('🔄 Running auto-setup...')
        await this.checkAndSetup()
      } else if (this.setupChecked) {
        console.log('✅ Setup already completed, skipping auto-setup')
      }
      
      this.isInitialized = true
      console.log('✅ Local Inworld TTS service initialized successfully')
    } catch (error) {
      console.error('❌ Local Inworld TTS initialization failed:', error)
      this.isInitialized = false
    }
  }

  private async checkAndSetup(): Promise<boolean> {
    try {
      console.log('🔍 Checking Local Inworld TTS setup...')
      
      if (isElectron && window.electronAPI) {
        // Electron環境の場合
        const result = await window.electronAPI.localTTSSetup({
          pythonPath: this.pythonPath,
          modelsDir: this.modelsDir
        })
        
        if (result.success) {
          console.log('✅ Local Inworld TTS setup completed in Electron')
          this.setupChecked = true
          return true
        } else {
          throw new Error(result.error)
        }
      } else {
        // ブラウザ環境の場合は警告を表示
        console.warn('⚠️  Local Inworld TTS is not available in browser environment')
        console.warn('Please use Electron version for local TTS functionality')
        return false
      }
    } catch (error) {
      console.error('❌ Setup check failed:', error)
      return false
    }
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    console.log('🎤 Starting Local Inworld TTS synthesis...')
    console.log('Synthesis options:', options)
    
    if (!this.isInitialized) {
      throw new Error('Local Inworld TTS service is not initialized')
    }

    // ブラウザ環境の場合はエラー
    if (!isElectron) {
      throw new Error('Local Inworld TTS is not available in browser environment. Please use Electron version.')
    }

    if (!window.electronAPI) {
      throw new Error('Electron API is not available. Please ensure you are running in Electron environment.')
    }

    try {
      const speaker = options.speaker || {
        voiceName: this.config.defaultVoice!,
        language: this.config.defaultLanguage
      }

      console.log('🎤 Local Inworld TTS synthesizing:', text.substring(0, 50))

      // Electron APIを使用して音声合成を実行
      const result = await window.electronAPI!.localTTSSynthesize({
        text,
        modelName: speaker.voiceName,
        language: speaker.language || 'en',
        pythonPath: this.pythonPath,
        modelsDir: this.modelsDir
      })

      if (!result.success) {
        throw new Error(result.error || 'Synthesis failed')
      }

      if (!result.audio) {
        throw new Error('No audio data received')
      }

      // Base64文字列をArrayBufferに変換
      const binaryString = atob(result.audio)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      console.log('✅ Local Inworld TTS synthesis completed:', {
        format: result.format,
        sampleRate: result.sample_rate,
        duration: result.duration
      })

      return {
        audioData: bytes.buffer,
        format: result.format || 'wav',
        sampleRate: result.sample_rate || 24000,
        channels: 1,
        duration: result.duration
      }
    } catch (error) {
      console.error('❌ Local Inworld TTS synthesis error:', error)
      throw new Error(`Local Inworld TTS synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAvailableSpeakers(): Promise<TTSSpeaker[]> {
    if (!isElectron) {
      console.warn('⚠️  Local Inworld TTS is not available in browser environment')
      return []
    }

    try {
      const result = await window.electronAPI!.localTTSListModels({
        pythonPath: this.pythonPath,
        modelsDir: this.modelsDir
      })
      
      if (result.success && result.models && result.models.length > 0) {
        // 利用可能なモデルに基づいてスピーカーを返す
        return AVAILABLE_VOICES.filter(voice => 
          result.models!.includes(voice.voiceName)
        )
      } else {
        console.warn('Failed to get available speakers, returning default list')
        return AVAILABLE_VOICES
      }
    } catch (error) {
      console.warn('Failed to get available speakers, returning default list:', error)
      return AVAILABLE_VOICES
    }
  }

  isAvailable(): boolean {
    const available = this.isInitialized && this.setupChecked && isElectron
    console.log('🔍 Local Inworld TTS Availability Check:', {
      isInitialized: this.isInitialized,
      setupChecked: this.setupChecked,
      isElectron: isElectron,
      windowExists: typeof window !== 'undefined',
      electronAPIExists: typeof window !== 'undefined' && !!window.electronAPI,
      available: available
    })
    
    if (!isElectron) {
      console.warn('⚠️  Local Inworld TTS not available: Not in Electron environment')
    }
    if (!this.isInitialized) {
      console.warn('⚠️  Local Inworld TTS not available: Service not initialized')
    }
    if (!this.setupChecked) {
      console.warn('⚠️  Local Inworld TTS not available: Setup not checked')
    }
    
    return available
  }

  getSupportedFormats(): string[] {
    return ['wav', 'mp3', 'ogg']
  }

  getSupportedLanguages(): string[] {
    return SUPPORTED_LANGUAGES
  }

  // ローカル固有のメソッド
  async getSetupStatus(): Promise<{ setup: boolean; models: string[]; device: string }> {
    if (!isElectron) {
      return {
        setup: false,
        models: [],
        device: 'browser'
      }
    }

    try {
      const result = await window.electronAPI!.localTTSListModels({
        pythonPath: this.pythonPath,
        modelsDir: this.modelsDir
      })
      
      return {
        setup: this.setupChecked,
        models: result.models || [],
        device: result.device || 'unknown'
      }
    } catch (error) {
      return {
        setup: false,
        models: [],
        device: 'unknown'
      }
    }
  }

  async runSetup(): Promise<boolean> {
    return await this.checkAndSetup()
  }

  setPythonPath(pythonPath: string) {
    this.pythonPath = pythonPath
  }

  setModelsDir(modelsDir: string) {
    this.modelsDir = modelsDir
  }
}

// ファクトリ関数
export function createLocalInworldTTSService(config: LocalInworldTTSConfig = {}): TTSService {
  return new LocalInworldTTSService(config)
}
