import type { 
  TTSService, 
  TTSResult, 
  TTSOptions, 
  TTSSpeaker, 
  TTSSpeakerConfig 
} from '../../types/tts'

// Web Speech APIで利用可能な音声の定義
const AVAILABLE_VOICES: TTSSpeaker[] = [
  { id: 'default', name: 'Default', voiceName: 'default', language: 'ja-JP', description: 'Default voice' },
  { id: 'google-japanese', name: 'Google Japanese', voiceName: 'Google 日本語', language: 'ja-JP', description: 'Google Japanese voice' },
  { id: 'microsoft-haruka', name: 'Microsoft Haruka', voiceName: 'Microsoft Haruka Desktop', language: 'ja-JP', description: 'Microsoft Japanese voice' }
]

// サポートされている言語
const SUPPORTED_LANGUAGES = [
  'ja-JP', 'en-US', 'en-GB', 'de-DE', 'fr-FR', 'es-ES', 'it-IT', 'pt-BR', 'ru-RU', 'ko-KR', 'zh-CN'
]

export class WebSpeechTTSService implements TTSService {
  private speechSynthesis: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.speechSynthesis = window.speechSynthesis
      this.loadVoices()
      this.isInitialized = true
    } else {
      console.warn('Web Speech API is not supported in this environment')
    }
  }

  private loadVoices() {
    if (!this.speechSynthesis) return

    // 音声リストを取得
    this.voices = this.speechSynthesis.getVoices()

    // 音声リストが空の場合は、音声が読み込まれるまで待機
    if (this.voices.length === 0) {
      this.speechSynthesis.onvoiceschanged = () => {
        this.voices = this.speechSynthesis!.getVoices()
        console.log('Web Speech API voices loaded:', this.voices.length)
      }
    }
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    if (!this.isInitialized || !this.speechSynthesis) {
      throw new Error('Web Speech API is not available')
    }

    return new Promise((resolve, reject) => {
      try {
        // 既存の音声を停止
        this.speechSynthesis!.cancel()

        const utterance = new SpeechSynthesisUtterance(text)
        
        // 音声設定
        const speaker = options.speaker || {
          voiceName: 'default',
          language: 'ja-JP'
        }

        // 適切な音声を選択
        const selectedVoice = this.voices.find(voice => 
          voice.lang === speaker.language || 
          voice.name.includes(speaker.voiceName)
        ) || this.voices.find(voice => voice.lang.startsWith('ja')) || this.voices[0]

        if (selectedVoice) {
          utterance.voice = selectedVoice
        }

        // 音声パラメータを設定
        utterance.rate = options.speed || 1.0
        utterance.pitch = options.pitch || 1.0
        utterance.volume = options.volume || 1.0

        // 音声合成の完了を待機
        utterance.onend = () => {
          // Web Speech APIは直接音声データを取得できないため、
          // 代わりに音声再生の成功を示すダミーデータを返す
          const dummyAudioData = new ArrayBuffer(0)
          resolve({
            audioData: dummyAudioData,
            format: 'web-speech',
            sampleRate: 22050,
            channels: 1
          })
        }

        utterance.onerror = (event) => {
          reject(new Error(`Web Speech API error: ${event.error}`))
        }

        // 音声合成を開始
        this.speechSynthesis!.speak(utterance)

      } catch (error) {
        reject(new Error(`Web Speech API synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    })
  }

  async getAvailableSpeakers(): Promise<TTSSpeaker[]> {
    if (!this.isInitialized) {
      return AVAILABLE_VOICES
    }

    // 実際に利用可能な音声を返す
    return this.voices.map(voice => ({
      id: voice.name.toLowerCase().replace(/\s+/g, '-'),
      name: voice.name,
      voiceName: voice.name,
      language: voice.lang,
      description: `${voice.lang} voice`
    }))
  }

  isAvailable(): boolean {
    return this.isInitialized
  }

  getSupportedFormats(): string[] {
    return ['web-speech']
  }

  getSupportedLanguages(): string[] {
    return SUPPORTED_LANGUAGES
  }

  // 音声を直接再生するメソッド（Web Speech API用）
  speak(text: string, options: TTSOptions = {}): void {
    if (!this.isInitialized || !this.speechSynthesis) {
      console.warn('Web Speech API is not available')
      return
    }

    try {
      // 既存の音声を停止
      this.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      
      // 音声設定
      const speaker = options.speaker || {
        voiceName: 'default',
        language: 'ja-JP'
      }

      // 適切な音声を選択
      const selectedVoice = this.voices.find(voice => 
        voice.lang === speaker.language || 
        voice.name.includes(speaker.voiceName)
      ) || this.voices.find(voice => voice.lang.startsWith('ja')) || this.voices[0]

      if (selectedVoice) {
        utterance.voice = selectedVoice
      }

              // 音声パラメータを設定
        utterance.rate = options.speed || 1.0
        utterance.pitch = options.pitch || 1.0
        utterance.volume = options.volume || 1.0

      // 音声合成を開始
      this.speechSynthesis.speak(utterance)

    } catch (error) {
      console.error('Error with Web Speech API:', error)
    }
  }
}

export function createWebSpeechTTSService(): WebSpeechTTSService {
  return new WebSpeechTTSService()
}
