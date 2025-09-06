import { TTSService, TTSResult, TTSOptions, TTSSpeaker } from '../../types/tts'

export interface CoquiXTTSWebConfig {
  modelUrl?: string
  workerUrl?: string
  defaultVoice?: string
  defaultLanguage?: string
}

// Web対応の音声（制限あり）
const AVAILABLE_VOICES: TTSSpeaker[] = [
  {
    id: 'web-voice-1',
    name: 'Web Voice 1',
    voiceName: 'web-voice-1',
    language: 'en',
    gender: 'female',
    style: 'neutral'
  },
  {
    id: 'web-voice-2',
    name: 'Web Voice 2',
    voiceName: 'web-voice-2',
    language: 'en',
    gender: 'male',
    style: 'neutral'
  }
]

export class CoquiXTTSWebService implements TTSService {
  private config: CoquiXTTSWebConfig
  private isInitialized = false
  private worker: Worker | null = null

  constructor(config: CoquiXTTSWebConfig = {}) {
    this.config = {
      modelUrl: 'https://huggingface.co/coqui/XTTS-v2/resolve/main/model.onnx',
      workerUrl: '/workers/xtts-worker.js',
      defaultVoice: 'web-voice-1',
      defaultLanguage: 'en',
      ...config
    }
    
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      console.log('🎤 Initializing Coqui XTTS-v2 Web service...')
      
      // Web Workerの初期化
      if (typeof Worker !== 'undefined') {
        this.worker = new Worker(this.config.workerUrl!)
        this.worker.onmessage = this.handleWorkerMessage.bind(this)
        this.worker.onerror = this.handleWorkerError.bind(this)
        
        // モデルの初期化を要求
        this.worker.postMessage({
          type: 'init',
          modelUrl: this.config.modelUrl
        })
        
        this.isInitialized = true
        console.log('✅ Coqui XTTS-v2 Web service initialized')
      } else {
        throw new Error('Web Workers are not supported in this browser')
      }
    } catch (error) {
      console.error('❌ Failed to initialize Coqui XTTS-v2 Web service:', error)
      this.isInitialized = false
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { type, data, error } = event.data
    
    switch (type) {
      case 'init_complete':
        console.log('✅ XTTS-v2 Web Worker initialized')
        break
      case 'synthesis_complete':
        console.log('✅ XTTS-v2 Web synthesis completed')
        break
      case 'error':
        console.error('❌ XTTS-v2 Web Worker error:', error)
        break
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('❌ XTTS-v2 Web Worker error:', error)
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Coqui XTTS-v2 Web service is not initialized')
    }

    return new Promise((resolve, reject) => {
      const speaker = options.speaker || {
        voiceName: this.config.defaultVoice!,
        language: this.config.defaultLanguage
      }

      // 一時的なメッセージハンドラーを設定
      const messageHandler = (event: MessageEvent) => {
        const { type, data, error } = event.data
        
        if (type === 'synthesis_complete') {
          this.worker!.removeEventListener('message', messageHandler)
          
          if (error) {
            reject(new Error(error))
          } else {
            resolve({
              audioData: data.audioData,
              format: data.format || 'wav',
              sampleRate: data.sampleRate || 24000,
              channels: 1
            })
          }
        }
      }

      this.worker.addEventListener('message', messageHandler)

      // 音声合成を要求
      this.worker.postMessage({
        type: 'synthesize',
        text,
        voiceName: speaker.voiceName,
        language: speaker.language || 'en',
        speed: options.speed || 1.0
      })

      // タイムアウト設定
      setTimeout(() => {
        this.worker!.removeEventListener('message', messageHandler)
        reject(new Error('Synthesis timeout'))
      }, 30000) // 30秒タイムアウト
    })
  }

  async getAvailableSpeakers(): Promise<TTSSpeaker[]> {
    return AVAILABLE_VOICES
  }

  isAvailable(): boolean {
    return this.isInitialized && typeof Worker !== 'undefined'
  }

  getSupportedFormats(): string[] {
    return ['wav', 'mp3']
  }

  getSupportedLanguages(): string[] {
    return ['en'] // Web版では制限
  }

  setApiKey(apiKey: string) {
    // Web版ではAPIキーは不要
    console.log('ℹ️ Coqui XTTS-v2 Web does not require API key')
  }

  updateConfig(config: Partial<CoquiXTTSWebConfig>) {
    this.config = { ...this.config, ...config }
  }
}

// ファクトリ関数
export function createCoquiXTTSWebService(config: CoquiXTTSWebConfig = {}): TTSService {
  return new CoquiXTTSWebService(config)
}
