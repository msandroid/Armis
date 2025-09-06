import { TTSService, TTSResult, TTSOptions, TTSSpeaker } from '../../types/tts'

interface XTTSResponse {
  success: boolean
  audio?: string
  format?: string
  sample_rate?: number
  duration?: number
  error?: string
}

export interface CoquiXTTSConfig {
  pythonPath?: string
  modelsDir?: string
  autoSetup?: boolean
  defaultVoice?: string
  defaultLanguage?: string
}

// XTTS-v2で利用可能な音声
const AVAILABLE_VOICES: TTSSpeaker[] = [
  {
    id: 'p225',
    name: 'Female Voice 1',
    voiceName: 'p225',
    language: 'en',
    gender: 'female',
    style: 'neutral'
  },
  {
    id: 'p226',
    name: 'Male Voice 1',
    voiceName: 'p226',
    language: 'en',
    gender: 'male',
    style: 'neutral'
  },
  {
    id: 'p227',
    name: 'Female Voice 2',
    voiceName: 'p227',
    language: 'en',
    gender: 'female',
    style: 'neutral'
  },
  {
    id: 'p228',
    name: 'Male Voice 2',
    voiceName: 'p228',
    language: 'en',
    gender: 'male',
    style: 'neutral'
  },
  {
    id: 'p229',
    name: 'Female Voice 3',
    voiceName: 'p229',
    language: 'en',
    gender: 'female',
    style: 'neutral'
  },
  {
    id: 'p230',
    name: 'Male Voice 3',
    voiceName: 'p230',
    language: 'en',
    gender: 'male',
    style: 'neutral'
  }
]

// サポートされている言語
const SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'tr', 'ru', 'nl', 'cs', 'ar', 'zh-cn', 'ja', 'ko', 'hi'
]

// サポートされているフォーマット
const SUPPORTED_FORMATS = ['wav', 'mp3', 'flac']

export class CoquiXTTSService implements TTSService {
  private config: CoquiXTTSConfig
  private isInitialized = false
  private pythonPath: string
  private modelsDir: string

  constructor(config: CoquiXTTSConfig = {}) {
    this.config = {
      pythonPath: 'python3',
      modelsDir: './models/coqui-xtts',
      autoSetup: true,
      defaultVoice: 'p225',
      defaultLanguage: 'en',
      ...config
    }
    
    this.pythonPath = this.config.pythonPath!
    this.modelsDir = this.config.modelsDir!
    
    if (this.config.autoSetup) {
      this.initialize()
    }
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🎤 Initializing Coqui XTTS-v2 service...')
      
      // Electron環境かどうかをチェック
      const isElectron = typeof window !== 'undefined' && window.electronAPI
      
      if (!isElectron) {
        console.warn('⚠️ Coqui XTTS-v2 requires Electron environment')
        return
      }

      // モデルの存在確認
      const modelExists = await this.checkModelExists()
      if (!modelExists) {
        console.log('📥 XTTS-v2 model not found, attempting setup...')
        await this.setupModel()
      }

      this.isInitialized = true
      console.log('✅ Coqui XTTS-v2 service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Coqui XTTS-v2 service:', error)
      this.isInitialized = false
    }
  }

  private async checkModelExists(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await (window.electronAPI as any).checkXTTSModel({
          modelsDir: this.modelsDir
        })
        return result.exists
      }
      return false
    } catch (error) {
      console.error('Error checking XTTS model:', error)
      return false
    }
  }

  private async setupModel(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('🚀 Setting up XTTS-v2...')
        await (window.electronAPI as any).xttsSetup({
          modelsDir: this.modelsDir,
          pythonPath: this.pythonPath
        })
        console.log('✅ XTTS-v2 setup completed successfully')
      }
    } catch (error) {
      console.error('❌ Failed to setup XTTS-v2:', error)
      throw error
    }
  }

  private async downloadModel(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('📥 Downloading XTTS-v2 model...')
        await (window.electronAPI as any).downloadXTTSModel({
          modelsDir: this.modelsDir,
          pythonPath: this.pythonPath
        })
        console.log('✅ XTTS-v2 model downloaded successfully')
      }
    } catch (error) {
      console.error('❌ Failed to download XTTS-v2 model:', error)
      throw error
    }
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    console.log('🎤 Starting Coqui XTTS-v2 synthesis...')
    console.log('Synthesis options:', options)
    
    if (!this.isInitialized) {
      throw new Error('Coqui XTTS-v2 service is not initialized')
    }

    // ブラウザ環境の場合はエラー
    if (typeof window === 'undefined' || !window.electronAPI) {
      throw new Error('Coqui XTTS-v2 is not available in browser environment. Please use Electron version.')
    }

    try {
      const speaker = options.speaker || {
        voiceName: this.config.defaultVoice!,
        language: this.config.defaultLanguage
      }

      console.log('🎤 Coqui XTTS-v2 synthesizing:', text.substring(0, 50))

      // Electron APIを使用して音声合成を実行
      const result = await (window.electronAPI as any).xttsSynthesize({
        text,
        voiceName: speaker.voiceName,
        language: speaker.language || 'en',
        speed: options.speed || 1.0,
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

      console.log('✅ Coqui XTTS-v2 synthesis completed:', {
        format: result.format,
        sampleRate: result.sample_rate,
        duration: result.duration
      })

      return {
        audioData: bytes.buffer,
        format: result.format || 'wav',
        sampleRate: result.sample_rate || 24000,
        channels: 1
      }
    } catch (error) {
      console.error('❌ Coqui XTTS-v2 synthesis error:', error)
      throw new Error(`Coqui XTTS-v2 synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAvailableSpeakers(): Promise<TTSSpeaker[]> {
    return AVAILABLE_VOICES
  }

  isAvailable(): boolean {
    return this.isInitialized && typeof window !== 'undefined' && !!window.electronAPI
  }

  getSupportedFormats(): string[] {
    return SUPPORTED_FORMATS
  }

  getSupportedLanguages(): string[] {
    return SUPPORTED_LANGUAGES
  }

  // APIキーを動的に設定するメソッド（XTTS-v2では不要だが、インターフェースの一貫性のため）
  setApiKey(apiKey: string) {
    // XTTS-v2はローカルモデルのため、APIキーは不要
    console.log('ℹ️ Coqui XTTS-v2 does not require API key')
  }

  // 設定を動的に更新
  updateConfig(config: Partial<CoquiXTTSConfig>) {
    this.config = { ...this.config, ...config }
    if (config.pythonPath) this.pythonPath = config.pythonPath
    if (config.modelsDir) this.modelsDir = config.modelsDir
  }
}

// ファクトリ関数
export function createCoquiXTTSService(config: CoquiXTTSConfig = {}): TTSService {
  return new CoquiXTTSService(config)
}
