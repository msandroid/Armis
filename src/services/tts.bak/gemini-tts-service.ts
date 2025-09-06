import { GoogleGenAI } from '@google/genai'
import type { 
  TTSService, 
  TTSResult, 
  TTSOptions, 
  TTSSpeaker, 
  TTSSpeakerConfig,
  GeminiTTSConfig 
} from '../../types/tts'

// Gemini TTSで利用可能な音声の定義（30種類）
const AVAILABLE_VOICES: TTSSpeaker[] = [
  { id: 'zephyr', name: 'Zephyr', voiceName: 'Zephyr', language: 'en-US', description: 'Bright' },
  { id: 'puck', name: 'Puck', voiceName: 'Puck', language: 'en-US', description: 'Upbeat' },
  { id: 'charon', name: 'Charon', voiceName: 'Charon', language: 'en-US', description: 'Informative' },
  { id: 'kore', name: 'Kore', voiceName: 'Kore', language: 'ja-JP', description: 'Firm' },
  { id: 'fenrir', name: 'Fenrir', voiceName: 'Fenrir', language: 'en-US', description: 'Excitable' },
  { id: 'leda', name: 'Leda', voiceName: 'Leda', language: 'en-US', description: 'Youthful' },
  { id: 'orus', name: 'Orus', voiceName: 'Orus', language: 'en-US', description: 'Firm' },
  { id: 'aoede', name: 'Aoede', voiceName: 'Aoede', language: 'en-US', description: 'Breezy' },
  { id: 'callirrhoe', name: 'Callirrhoe', voiceName: 'Callirrhoe', language: 'en-US', description: 'Easy-going' },
  { id: 'autonoe', name: 'Autonoe', voiceName: 'Autonoe', language: 'en-US', description: 'Bright' },
  { id: 'enceladus', name: 'Enceladus', voiceName: 'Enceladus', language: 'en-US', description: 'Breathy' },
  { id: 'iapetus', name: 'Iapetus', voiceName: 'Iapetus', language: 'en-US', description: 'Clear' },
  { id: 'umbriel', name: 'Umbriel', voiceName: 'Umbriel', language: 'en-US', description: 'Easy-going' },
  { id: 'algieba', name: 'Algieba', voiceName: 'Algieba', language: 'en-US', description: 'Smooth' },
  { id: 'despina', name: 'Despina', voiceName: 'Despina', language: 'en-US', description: 'Smooth' },
  { id: 'erinome', name: 'Erinome', voiceName: 'Erinome', language: 'en-US', description: 'Clear' },
  { id: 'algenib', name: 'Algenib', voiceName: 'Algenib', language: 'en-US', description: 'Gravelly' },
  { id: 'rasalgethi', name: 'Rasalgethi', voiceName: 'Rasalgethi', language: 'en-US', description: 'Informative' },
  { id: 'laomedeia', name: 'Laomedeia', voiceName: 'Laomedeia', language: 'en-US', description: 'Upbeat' },
  { id: 'achernar', name: 'Achernar', voiceName: 'Achernar', language: 'en-US', description: 'Soft' },
  { id: 'alnilam', name: 'Alnilam', voiceName: 'Alnilam', language: 'en-US', description: 'Firm' },
  { id: 'schedar', name: 'Schedar', voiceName: 'Schedar', language: 'en-US', description: 'Even' },
  { id: 'gacrux', name: 'Gacrux', voiceName: 'Gacrux', language: 'en-US', description: 'Mature' },
  { id: 'pulcherrima', name: 'Pulcherrima', voiceName: 'Pulcherrima', language: 'en-US', description: 'Forward' },
  { id: 'achird', name: 'Achird', voiceName: 'Achird', language: 'en-US', description: 'Friendly' },
  { id: 'zubenelgenubi', name: 'Zubenelgenubi', voiceName: 'Zubenelgenubi', language: 'en-US', description: 'Casual' },
  { id: 'vindemiatrix', name: 'Vindemiatrix', voiceName: 'Vindemiatrix', language: 'en-US', description: 'Gentle' },
  { id: 'sadachbia', name: 'Sadachbia', voiceName: 'Sadachbia', language: 'en-US', description: 'Lively' },
  { id: 'sadaltager', name: 'Sadaltager', voiceName: 'Sadaltager', language: 'en-US', description: 'Knowledgeable' },
  { id: 'sulafat', name: 'Sulafat', voiceName: 'Sulafat', language: 'en-US', description: 'Warm' }
]

// サポートされている言語
const SUPPORTED_LANGUAGES = [
  'ar-EG', 'de-DE', 'en-US', 'es-US', 'fr-FR', 'hi-IN', 'id-ID', 
  'it-IT', 'ja-JP', 'ko-KR', 'pt-BR', 'ru-RU', 'nl-NL', 'pl-PL', 
  'th-TH', 'tr-TR', 'vi-VN', 'ro-RO', 'uk-UA', 'bn-BD', 'en-IN', 
  'mr-IN', 'ta-IN', 'te-IN'
]

export class GeminiTTSService implements TTSService {
  private client!: GoogleGenAI
  private config: GeminiTTSConfig
  private isInitialized = false
  private apiKey: string | undefined

  constructor(config: GeminiTTSConfig = {}) {
    this.config = {
      model: 'gemini-2.5-flash-preview-tts',
      defaultVoice: 'Kore',
      defaultLanguage: 'ja-JP',
      ...config
    }
    
    this.apiKey = this.config.apiKey || 
                  (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GOOGLE_GENAI_API_KEY : undefined) ||
                  (typeof process !== 'undefined' ? process.env.GOOGLE_GENAI_API_KEY : undefined)
    
    if (this.apiKey) {
      this.initialize()
    }
  }

  private initialize() {
    if (!this.apiKey) {
      console.warn('Gemini TTS: API key not provided. Please set VITE_GOOGLE_GENAI_API_KEY environment variable or configure in Settings.')
      return
    }

    this.client = new GoogleGenAI({ apiKey: this.apiKey })
    this.isInitialized = true
  }

  // APIキーを動的に設定するメソッド
  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    this.initialize()
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    console.log('🎵 Gemini TTS synthesize called:', { textLength: text.length, isInitialized: this.isInitialized, hasApiKey: !!this.apiKey })
    
    if (!this.isInitialized) {
      console.error('🎵 Gemini TTS not initialized')
      throw new Error('Gemini TTS service is not initialized. Please provide an API key.')
    }

    try {
      const speaker = options.speaker || {
        voiceName: this.config.defaultVoice!,
        language: this.config.defaultLanguage
      }

      // 音声スタイルの設定
      let prompt = text
      if (speaker.style) {
        prompt = `${speaker.style}: ${text}`
      }

      console.log('🎵 Gemini TTS API call:', { model: this.config.model, voiceName: speaker.voiceName, language: speaker.language, promptLength: prompt.length })
      
      const response = await this.client.models.generateContent({
        model: this.config.model!,
        contents: prompt,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: speaker.voiceName
              }
            }
          }
        }
      })
      
      console.log('🎵 Gemini TTS API response received:', { hasCandidates: !!response.candidates, candidateCount: response.candidates?.length })

      if (!response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
        console.error('🎵 No audio data in Gemini TTS response')
        throw new Error('No audio data received from Gemini TTS')
      }
      
      console.log('🎵 Audio data found in Gemini TTS response')

      const audioData = response.candidates[0].content.parts[0].inlineData.data
      
      // Base64文字列をArrayBufferに変換
      const binaryString = atob(audioData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      
      // デバッグ情報を出力
      console.log('🎵 TTS Audio Data Info:', {
        dataLength: audioData.length,
        binaryLength: binaryString.length,
        bytesLength: bytes.length,
        mimeType: response.candidates[0].content.parts[0].inlineData.mimeType
      })
      
      const result = {
        audioData: bytes.buffer,
        format: 'pcm', // Gemini APIは生のPCMデータを返す
        sampleRate: 24000,
        channels: 1
      }
      
      console.log('🎵 Gemini TTS synthesis completed successfully:', { audioDataSize: result.audioData.byteLength })
      return result
    } catch (error) {
      console.error('🎵 Gemini TTS synthesis error:', error)
      
      // 429エラー（クォータ超過）の特別な処理
      if (error instanceof Error && error.message.includes('429')) {
        throw new Error('Gemini TTS quota exceeded. Please try again later or use a different TTS service.')
      }
      
      // APIキー関連のエラー
      if (error instanceof Error && error.message.includes('API_KEY')) {
        throw new Error('Invalid Gemini API key. Please check your API key configuration.')
      }
      
      throw new Error(`TTS synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAvailableSpeakers(): Promise<TTSSpeaker[]> {
    return AVAILABLE_VOICES
  }

  isAvailable(): boolean {
    const available = this.isInitialized
    console.log('🎵 Gemini TTS Service Availability:', {
      isInitialized: this.isInitialized,
      available
    })
    return available
  }

  getSupportedFormats(): string[] {
    return ['wav']
  }

  getSupportedLanguages(): string[] {
    return SUPPORTED_LANGUAGES
  }

  // 音声ファイルを保存するヘルパーメソッド
  async saveToFile(audioData: ArrayBuffer, filename: string): Promise<void> {
    const fs = await import('fs')
    const path = await import('path')
    
    const buffer = Buffer.from(audioData)
    const fullPath = path.resolve(filename)
    
    fs.writeFileSync(fullPath, buffer)
    console.log(`Audio saved to: ${fullPath}`)
  }

  // 音声を再生するヘルパーメソッド（ブラウザ環境）
  playAudio(audioData: ArrayBuffer): void {
    if (typeof window === 'undefined') {
      console.warn('playAudio is only available in browser environment')
      return
    }

    try {
      // WAVヘッダーを追加してブラウザで再生可能な形式に変換
      const wavData = this.addWavHeader(audioData, 24000, 1, 16)
      const blob = new Blob([wavData], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      
      audio.play().catch(error => {
        console.error('Error playing audio:', error)
      })

      // クリーンアップ
      audio.onended = () => {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error creating audio blob:', error)
    }
  }

  // WAVヘッダーを追加するヘルパーメソッド
  private addWavHeader(pcmData: ArrayBuffer, sampleRate: number, channels: number, bitsPerSample: number): ArrayBuffer {
    const dataLength = pcmData.byteLength
    const headerLength = 44
    const totalLength = headerLength + dataLength
    
    const buffer = new ArrayBuffer(totalLength)
    const view = new DataView(buffer)
    
    // WAVヘッダーを書き込み
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    // RIFFヘッダー
    writeString(0, 'RIFF')
    view.setUint32(4, totalLength - 8, true) // ファイルサイズ - 8
    writeString(8, 'WAVE')
    
    // fmt チャンク
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmtチャンクサイズ
    view.setUint16(20, 1, true) // PCM形式
    view.setUint16(22, channels, true) // チャンネル数
    view.setUint32(24, sampleRate, true) // サンプルレート
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true) // バイトレート
    view.setUint16(32, channels * bitsPerSample / 8, true) // ブロックアライメント
    view.setUint16(34, bitsPerSample, true) // ビット深度
    
    // data チャンク
    writeString(36, 'data')
    view.setUint32(40, dataLength, true) // データサイズ
    
    // PCMデータをコピー
    const pcmView = new Uint8Array(pcmData)
    const bufferView = new Uint8Array(buffer)
    bufferView.set(pcmView, headerLength)
    
    return buffer
  }
}

export function createGeminiTTSService(config?: GeminiTTSConfig): GeminiTTSService {
  return new GeminiTTSService(config)
}
