import type { 
  TTSService, 
  TTSResult, 
  TTSOptions, 
  TTSSpeaker, 
  TTSSpeakerConfig 
} from '../../types/tts'

// OpenAI TTSで利用可能な音声の定義
const AVAILABLE_VOICES: TTSSpeaker[] = [
  { id: 'alloy', name: 'Alloy', voiceName: 'alloy', language: 'en-US', description: 'Alloy voice - balanced and versatile' },
  { id: 'echo', name: 'Echo', voiceName: 'echo', language: 'en-US', description: 'Echo voice - warm and expressive' },
  { id: 'fable', name: 'Fable', voiceName: 'fable', language: 'en-US', description: 'Fable voice - clear and engaging' },
  { id: 'onyx', name: 'Onyx', voiceName: 'onyx', language: 'en-US', description: 'Onyx voice - deep and authoritative' },
  { id: 'nova', name: 'Nova', voiceName: 'nova', language: 'en-US', description: 'Nova voice - bright and energetic' },
  { id: 'shimmer', name: 'Shimmer', voiceName: 'shimmer', language: 'en-US', description: 'Shimmer voice - soft and melodic' }
]

// サポートされている言語
const SUPPORTED_LANGUAGES = [
  'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-BR', 'ru-RU', 'ko-KR', 'zh-CN', 'ja-JP'
]

export interface OpenAITTSConfig {
  apiKey?: string
  model?: string
  defaultVoice?: string
  defaultLanguage?: string
}

export class OpenAITTSService implements TTSService {
  private config: OpenAITTSConfig
  private isInitialized = false
  private apiKey: string | undefined

  constructor(config: OpenAITTSConfig = {}) {
    this.config = {
      model: 'gpt-4o-mini-tts',
      defaultVoice: 'alloy',
      defaultLanguage: 'en-US',
      ...config
    }
    
    this.apiKey = this.config.apiKey || 
                  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_API_KEY : undefined) ||
                  (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined)
    
    if (this.apiKey) {
      this.initialize()
    }
  }

  private initialize() {
    if (!this.apiKey) {
      console.warn('OpenAI TTS service requires an API key')
      return
    }

    this.isInitialized = true
    console.log('OpenAI TTS service initialized with model:', this.config.model)
  }

  // APIキーを動的に設定するメソッド
  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    this.initialize()
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    if (!this.isInitialized || !this.apiKey) {
      throw new Error('OpenAI TTS service is not initialized. Please provide an API key.')
    }

    try {
      const speaker = options.speaker || {
        voiceName: this.config.defaultVoice!,
        language: this.config.defaultLanguage
      }

      // OpenAI TTS APIのエンドポイント
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          input: text,
          voice: speaker.voiceName,
          response_format: 'pcm',
          speed: options.speed || 1.0
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI TTS API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const audioBuffer = await response.arrayBuffer()
      
      // デバッグ情報を出力
      console.log('OpenAI TTS Audio Data Info:', {
        dataLength: audioBuffer.byteLength,
        model: this.config.model,
        voice: speaker.voiceName,
        speed: options.speed || 1.0
      })
      
      return {
        audioData: audioBuffer,
        format: 'pcm',
        sampleRate: 24000,
        channels: 1
      }
    } catch (error) {
      console.error('OpenAI TTS synthesis error:', error)
      throw new Error(`OpenAI TTS synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAvailableSpeakers(): Promise<TTSSpeaker[]> {
    return AVAILABLE_VOICES
  }

  isAvailable(): boolean {
    return this.isInitialized && !!this.apiKey
  }

  getSupportedFormats(): string[] {
    return ['pcm', 'wav', 'mp3']
  }

  getSupportedLanguages(): string[] {
    return SUPPORTED_LANGUAGES
  }

  // 音声を直接再生するメソッド
  speak(text: string, options: TTSOptions = {}): void {
    if (!this.isInitialized || !this.apiKey) {
      console.warn('OpenAI TTS service is not available')
      return
    }

    // 非同期で音声合成を実行
    this.synthesize(text, options).then(result => {
      // WAVヘッダーを追加してブラウザで再生可能な形式に変換
      const wavData = this.addWavHeader(result.audioData, result.sampleRate || 24000, result.channels || 1, 16)
      const blob = new Blob([wavData], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      
      const audio = new Audio(url)
      audio.play().catch(error => {
        console.error('Failed to play audio:', error)
      })
      
      // メモリリークを防ぐためにURLを解放
      audio.onended = () => {
        URL.revokeObjectURL(url)
      }
    }).catch(error => {
      console.error('OpenAI TTS synthesis failed:', error)
    })
  }

  // WAVヘッダーを追加するヘルパーメソッド
  private addWavHeader(audioData: ArrayBuffer, sampleRate: number, channels: number, bitsPerSample: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + audioData.byteLength)
    const view = new DataView(buffer)
    
    // WAVヘッダーを書き込み
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + audioData.byteLength, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, channels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true)
    view.setUint16(32, channels * bitsPerSample / 8, true)
    view.setUint16(34, bitsPerSample, true)
    writeString(36, 'data')
    view.setUint32(40, audioData.byteLength, true)
    
    // 音声データをコピー
    const audioView = new Uint8Array(audioData)
    const bufferView = new Uint8Array(buffer, 44)
    bufferView.set(audioView)
    
    return buffer
  }
}

export function createOpenAITTSService(config: OpenAITTSConfig = {}): OpenAITTSService {
  return new OpenAITTSService(config)
}
