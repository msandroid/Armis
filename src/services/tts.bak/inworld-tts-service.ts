import type { 
  TTSService, 
  TTSResult, 
  TTSOptions, 
  TTSSpeaker, 
  TTSSpeakerConfig,
  InworldTTSConfig 
} from '../../types/tts'

// Inworld AI TTSで利用可能な音声の定義（公式ドキュメントベース）
const AVAILABLE_VOICES: TTSSpeaker[] = [
  { id: 'Ashley', name: 'Ashley', voiceName: 'Ashley', language: 'en', description: 'Natural female voice (Default) - Best for general use' },
  { id: 'Alex', name: 'Alex', voiceName: 'Alex', language: 'en', description: 'Natural male voice - Good for professional content' },
  { id: 'Hades', name: 'Hades', voiceName: 'Hades', language: 'en', description: 'Deep male voice - Suitable for dramatic content' }
]

// サポートされている言語
const SUPPORTED_LANGUAGES = [
  'en', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ko', 'zh', 'ja'
]

export interface InworldTTSResponse {
  audioContent: string // Base64 encoded audio data
  usage?: {
    processedCharactersCount: number
    modelId: string
  }
}

export interface InworldTTSRequest {
  text: string
  voiceId: string
  modelId: string
  audio_config?: {
    audio_encoding?: string
    sample_rate_hertz?: number
    speaking_rate?: number
    pitch?: number
    temperature?: number
  }
}

export class InworldTTSService implements TTSService {
  private config: InworldTTSConfig
  private isInitialized = false
  private apiKey: string | undefined
  private baseUrl = 'https://api.inworld.ai/tts/v1'

  constructor(config: InworldTTSConfig = {}) {
    this.config = {
      model: 'inworld-tts-1-max', // 公式ドキュメント推奨の8Bモデル（最高品質）
      defaultVoice: 'Ashley',
      defaultLanguage: 'en',
      workspace: 'default',
      ...config
    }
    
    this.apiKey = this.config.apiKey || 
                  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_INWORLD_API_KEY : undefined) ||
                  (typeof process !== 'undefined' ? process.env.INWORLD_API_KEY : undefined)
    
    if (this.apiKey) {
      this.initialize()
    }
  }

  private initialize() {
    if (!this.apiKey) {
      console.warn('Inworld TTS: API key not provided. Please set VITE_INWORLD_API_KEY environment variable or configure in Settings.')
      return
    }

    // APIキーの形式を検証
    try {
      this.validateApiKeyFormat(this.apiKey)
      this.isInitialized = true
      console.log('🎤 Inworld TTS Service initialized successfully')
    } catch (error) {
      console.error('🎤 Inworld TTS Service initialization failed:', error)
      this.isInitialized = false
    }
  }

  private validateApiKeyFormat(apiKey: string): void {
    // Inworld AIのAPIキーはBase64エンコードされた形式
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Inworld AI API key is required')
    }

    // Base64文字列の基本的な検証
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(apiKey)) {
      console.warn('Inworld AI API key format may be incorrect. Expected Base64 encoded format from Inworld Portal.')
    }

    // APIキーの長さをチェック（Inworld AIのAPIキーは通常64文字以上）
    if (apiKey.length < 20) {
      console.warn('Inworld AI API key seems too short. Please check if you copied the complete API key from Inworld Portal.')
    }
  }

  // APIキーを動的に設定するメソッド
  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    this.initialize()
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    if (!this.isInitialized || !this.apiKey) {
      throw new Error('Inworld TTS service is not initialized. Please provide an API key.')
    }

    try {
      const speaker = options.speaker || {
        voiceName: this.config.defaultVoice!,
        language: this.config.defaultLanguage
      }

      // Inworld TTSで利用可能な音声かどうかを検証
      const validVoices = ['Ashley', 'Alex', 'Hades']
      if (!validVoices.includes(speaker.voiceName)) {
        console.warn(`🎤 Inworld TTS: Invalid voice "${speaker.voiceName}" detected. Using "Ashley" instead.`)
        speaker.voiceName = 'Ashley'
      }

      // Inworld AI TTS APIのエンドポイント（公式ドキュメントに従った実装）
      const requestBody: InworldTTSRequest = {
        text: text,
        voiceId: speaker.voiceName,
        modelId: this.config.model!,
        audio_config: {
          audio_encoding: 'LINEAR16', // 公式ドキュメント推奨
          sample_rate_hertz: 48000, // 公式ドキュメント推奨
          speaking_rate: 1.0, // 話速（0.5-2.0）
          pitch: 0.0, // ピッチ調整（-20.0-20.0）
          temperature: 0.8 // 音声の多様性（0.0-1.0）
        }
      }

      console.log('🎤 Inworld TTS API Request:', {
        url: `${this.baseUrl}/voice`,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey.substring(0, 10)}...`,
          'Content-Type': 'application/json'
        },
        body: requestBody
      })

      const response = await fetch(`${this.baseUrl}/voice`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        let errorMessage = `Inworld TTS API error: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error('🎤 Inworld TTS API Error Response:', errorData)
          
          // 公式ドキュメントに基づくエラーハンドリング
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`
          } else if (errorData.message) {
            errorMessage += ` - ${errorData.message}`
          } else if (errorData.details) {
            errorMessage += ` - ${JSON.stringify(errorData.details)}`
          }
          
          // 特定のエラーに対する推奨解決策
          if (errorData.error?.includes('Unknown voice')) {
            errorMessage += '\n\n推奨解決策: 利用可能な音声（Ashley, Alex, Hades）を使用してください'
          } else if (errorData.error?.includes('model')) {
            errorMessage += '\n\n推奨解決策: 正しいモデルID（inworld-tts-1-max）を使用してください'
          } else if (response.status === 401) {
            errorMessage += '\n\n推奨解決策: APIキーを確認してください'
          } else if (response.status === 429) {
            errorMessage += '\n\n推奨解決策: レート制限に達しました。しばらく待ってから再試行してください'
          }
        } catch (parseError) {
          // JSON解析に失敗した場合、レスポンスのテキストを取得
          const errorText = await response.text()
          console.error('🎤 Inworld TTS API Error Text:', errorText)
          if (errorText) {
            errorMessage += ` - ${errorText}`
          }
        }
        throw new Error(errorMessage)
      }

      // Base64エンコードされたオーディオデータを取得
      const responseData: InworldTTSResponse = await response.json()
      
      console.log('🎤 Inworld TTS API Response:', {
        hasAudioContent: !!responseData.audioContent,
        audioContentLength: responseData.audioContent?.length || 0,
        usage: responseData.usage
      })
      
      if (!responseData.audioContent) {
        throw new Error('No audio data received from Inworld TTS API')
      }

      // Base64文字列をArrayBufferに変換
      const binaryString = atob(responseData.audioContent)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // デバッグ情報を出力
      console.log('Inworld TTS Audio Data Info:', {
        dataLength: responseData.audioContent.length,
        binaryLength: binaryString.length,
        bytesLength: bytes.length,
        processedCharacters: responseData.usage?.processedCharactersCount || 'N/A',
        modelId: responseData.usage?.modelId || 'N/A',
        voice: speaker.voiceName
      })
      
      return {
        audioData: bytes.buffer,
        format: 'wav', // 公式テンプレートに合わせて固定
        sampleRate: 48000, // 公式テンプレートに合わせて48kHz
        channels: 1
      }
    } catch (error) {
      console.error('Inworld TTS synthesis error:', error)
      throw new Error(`Inworld TTS synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAvailableSpeakers(): Promise<TTSSpeaker[]> {
    return AVAILABLE_VOICES
  }

  isAvailable(): boolean {
    const available = this.isInitialized && !!this.apiKey && this.apiKey.length > 0
    console.log('🎤 Inworld TTS Service Availability:', {
      isInitialized: this.isInitialized,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey?.length || 0,
      available
    })
    return available
  }

  getSupportedFormats(): string[] {
    return ['wav', 'mp3', 'ogg']
  }

  getSupportedLanguages(): string[] {
    return SUPPORTED_LANGUAGES
  }

  // Inworld AI固有のメソッド
  setWorkspace(workspace: string) {
    this.config.workspace = workspace
  }

  getWorkspace(): string | undefined {
    return this.config.workspace
  }
}

// ファクトリ関数
export function createInworldTTSService(config: InworldTTSConfig = {}): TTSService {
  return new InworldTTSService(config)
}
