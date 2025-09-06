import type { TTSService, TTSResult, TTSOptions, TTSSpeaker } from '../../types/tts'
import { createGeminiTTSService } from './gemini-tts-service'
import { createWebSpeechTTSService } from './web-speech-tts-service'
import { createOpenAITTSService } from './openai-tts-service'
import { createInworldTTSService } from './inworld-tts-service'
import { createLocalInworldTTSService } from './local-inworld-tts-service'
import { createCoquiXTTSService } from './coqui-xtts-service'
import { createCoquiXTTSWebService } from './coqui-xtts-web-service'

import { createTTSRequestAnalyzer, type TTSRequestAnalysis } from './tts-request-analyzer'
import { createTTSTextExtractor, type TTSTextExtractionResult } from './tts-text-extractor'

export interface TTSManagerConfig {
  primaryService?: 'gemini' | 'openai' | 'web-speech' | 'inworld' | 'local-inworld' | 'coqui-xtts' | 'coqui-xtts-web'
  enableFallback?: boolean
  geminiApiKey?: string
  openaiApiKey?: string
  inworldApiKey?: string
  huggingfaceApiKey?: string
  enableAdvancedAnalysis?: boolean
  enableTextExtraction?: boolean
  localInworldConfig?: {
    pythonPath?: string
    modelsDir?: string
    autoSetup?: boolean
  }
  coquiXTTSConfig?: {
    pythonPath?: string
    modelsDir?: string
    autoSetup?: boolean
  }
  coquiXTTSWebConfig?: {
    modelUrl?: string
    workerUrl?: string
    defaultVoice?: string
    defaultLanguage?: string
  }
}

export class TTSManager {
  private geminiService: TTSService
  private openaiService: TTSService
  private webSpeechService: TTSService
  private inworldService: TTSService
  private localInworldService: TTSService
  private coquiXTTSService: TTSService
  private coquiXTTSWebService: TTSService
  private ttsRequestAnalyzer: ReturnType<typeof createTTSRequestAnalyzer>
  private ttsTextExtractor: ReturnType<typeof createTTSTextExtractor>
  private primaryService: 'gemini' | 'openai' | 'web-speech' | 'inworld' | 'local-inworld' | 'coqui-xtts' | 'coqui-xtts-web'
  private enableFallback: boolean
  private enableAdvancedAnalysis: boolean
  private enableTextExtraction: boolean
  private lastError: string | null = null

  constructor(config: TTSManagerConfig = {}) {
    this.primaryService = config.primaryService || 'gemini'
    this.enableFallback = config.enableFallback !== false
    this.enableAdvancedAnalysis = config.enableAdvancedAnalysis !== false
    this.enableTextExtraction = config.enableTextExtraction !== false

    // Gemini TTSサービスの初期化
    this.geminiService = createGeminiTTSService({
      apiKey: config.geminiApiKey
    })

    // OpenAI TTSサービスの初期化
    this.openaiService = createOpenAITTSService({
      apiKey: config.openaiApiKey
    })

    // Web Speech TTSサービスの初期化
    this.webSpeechService = createWebSpeechTTSService()

    // Inworld AI TTSサービスの初期化
    this.inworldService = createInworldTTSService({
      apiKey: config.inworldApiKey
    })

    // Local Inworld TTSサービスの初期化
    this.localInworldService = createLocalInworldTTSService({
      pythonPath: config.localInworldConfig?.pythonPath,
      modelsDir: config.localInworldConfig?.modelsDir,
      autoSetup: config.localInworldConfig?.autoSetup
    })

    // Coqui XTTS-v2サービスの初期化
    this.coquiXTTSService = createCoquiXTTSService({
      pythonPath: config.coquiXTTSConfig?.pythonPath,
      modelsDir: config.coquiXTTSConfig?.modelsDir,
      autoSetup: config.coquiXTTSConfig?.autoSetup
    })

    // Coqui XTTS-v2 Webサービスの初期化
    this.coquiXTTSWebService = createCoquiXTTSWebService({
      modelUrl: config.coquiXTTSWebConfig?.modelUrl,
      workerUrl: config.coquiXTTSWebConfig?.workerUrl,
      defaultVoice: config.coquiXTTSWebConfig?.defaultVoice,
      defaultLanguage: config.coquiXTTSWebConfig?.defaultLanguage
    })

    // TTS要求解析器の初期化
    this.ttsRequestAnalyzer = createTTSRequestAnalyzer({
      apiKey: config.openaiApiKey
    })

    // TTSテキスト抽出器の初期化
    this.ttsTextExtractor = createTTSTextExtractor()
  }

  // APIキーを動的に設定
  setGeminiApiKey(apiKey: string) {
    if ('setApiKey' in this.geminiService) {
      (this.geminiService as any).setApiKey(apiKey)
    }
  }

  setOpenAIApiKey(apiKey: string) {
    this.ttsRequestAnalyzer.setApiKey(apiKey)
    if ('setApiKey' in this.openaiService) {
      (this.openaiService as any).setApiKey(apiKey)
    }
  }

  setInworldApiKey(apiKey: string) {
    if ('setApiKey' in this.inworldService) {
      (this.inworldService as any).setApiKey(apiKey)
    }
  }

  // LLMマネージャーを設定（テキスト抽出用）
  setLLMManager(llmManager: any) {
    this.ttsTextExtractor.setLLMManager(llmManager)
  }

  // 利用可能なTTSサービスを取得
  getAvailableServices(): { name: string; available: boolean }[] {
    return [
      { name: 'Gemini TTS', available: this.geminiService.isAvailable() },
      { name: 'OpenAI TTS', available: this.openaiService.isAvailable() },
      { name: 'Inworld AI TTS', available: this.inworldService.isAvailable() },
      { name: 'Local Inworld TTS', available: this.localInworldService.isAvailable() },
      { name: 'Coqui XTTS-v2', available: this.coquiXTTSService.isAvailable() },
      { name: 'Web Speech API', available: this.webSpeechService.isAvailable() }
    ]
  }

  // TTS要求を解析して音声合成を実行
  async processTTSRequest(userInput: string, aiResponse: string, options: TTSOptions = {}): Promise<TTSResult | null> {
    try {
      // TTS要求を解析
      const analysis = await this.ttsRequestAnalyzer.analyzeTTSRequest(userInput)
      
      console.log('TTS Request Analysis:', analysis)
      
      if (!analysis.isTTSRequest) {
        console.log('No TTS request detected')
        return null
      }

      // TTS処理に使用するテキストを決定
      let ttsText: string
      
      if (analysis.ttsText && analysis.ttsText.trim()) {
        // ユーザー入力から抽出されたTTSテキストを使用
        ttsText = analysis.ttsText
        console.log('Using extracted TTS text from user input:', ttsText)
      } else {
        // AIの応答を使用
        ttsText = aiResponse
        console.log('Using AI response as TTS text:', ttsText)
      }

      // 音声合成を実行
      return await this.synthesize(ttsText, options)
      
    } catch (error) {
      console.error('TTS request processing failed:', error)
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  // テキスト抽出機能付きTTS処理（Audio有効時用）
  async processTTSWithTextExtraction(userInput: string, options: TTSOptions = {}): Promise<TTSResult | null> {
    try {
      console.log('🎵 TTS Text Extraction: Starting processing for user input')
      
      let ttsText: string
      let extractionResult: TTSTextExtractionResult | null = null

      // テキスト抽出が有効な場合はLocal LLMを使用して抽出
      if (this.enableTextExtraction) {
        console.log('🎵 TTS Text Extraction: Using Local LLM for text extraction')
        extractionResult = await this.ttsTextExtractor.extractTTSText(userInput)
        
        if (extractionResult.shouldProcessTTS && extractionResult.extractedText.trim()) {
          ttsText = extractionResult.extractedText
          console.log('🎵 TTS Text Extraction: Successfully extracted text:', ttsText.substring(0, 50) + '...')
        } else {
          console.log('🎵 TTS Text Extraction: No valid text extracted, skipping TTS')
          return null
        }
      } else {
        // テキスト抽出が無効な場合は元のテキストを使用
        console.log('🎵 TTS Text Extraction: Text extraction disabled, using original input')
        ttsText = userInput
      }

      // 音声合成を実行
      const result = await this.synthesize(ttsText, options)
      
      console.log('🎵 TTS Text Extraction: TTS processing completed successfully')
      return result
      
    } catch (error) {
      console.error('🎵 TTS Text Extraction: Processing failed:', error)
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  // 音声合成を実行（フォールバック機能付き）
  async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult> {
    console.log('🎵 TTSManager.synthesize called with:', { 
      textLength: text.length, 
      options,
      primaryService: this.primaryService 
    })
    this.lastError = null

    // プライマリサービスで試行
    let primaryService: TTSService
    let fallbackServices: TTSService[] = []

    switch (this.primaryService) {
      case 'gemini':
        primaryService = this.geminiService
        fallbackServices = [this.webSpeechService, this.openaiService, this.inworldService, this.localInworldService] // Web Speech APIを含める
        break
      case 'openai':
        primaryService = this.openaiService
        fallbackServices = [this.webSpeechService, this.geminiService, this.inworldService, this.localInworldService] // Web Speech APIを含める
        break
      case 'inworld':
        primaryService = this.inworldService
        fallbackServices = [this.webSpeechService, this.geminiService, this.openaiService, this.localInworldService] // Web Speech APIを含める
        break
      case 'local-inworld':
        primaryService = this.localInworldService
        fallbackServices = [this.webSpeechService, this.openaiService, this.geminiService, this.inworldService] // Web Speech APIを優先フォールバック
        break
      case 'coqui-xtts':
        primaryService = this.coquiXTTSService
        fallbackServices = [this.webSpeechService, this.openaiService, this.geminiService, this.inworldService, this.localInworldService]
        break
      case 'coqui-xtts-web':
        primaryService = this.coquiXTTSWebService
        fallbackServices = [this.webSpeechService, this.openaiService, this.geminiService, this.inworldService]
        break
      case 'web-speech':
        primaryService = this.webSpeechService
        fallbackServices = [this.openaiService, this.geminiService, this.inworldService, this.localInworldService]
        break
      default:
        primaryService = this.geminiService
        fallbackServices = [this.webSpeechService, this.openaiService, this.inworldService, this.localInworldService] // Web Speech APIを含める
    }

    console.log('🎵 TTS Service Selection:', {
      primaryService: this.primaryService,
      primaryServiceAvailable: primaryService.isAvailable(),
      fallbackServicesCount: fallbackServices.length
    })

    try {
      if (primaryService.isAvailable()) {
        console.log(`🎵 Using primary TTS service: ${this.primaryService}`)
        const result = await primaryService.synthesize(text, options)
        
        // audioUrlを追加（ブラウザ環境でのみ）
        if (typeof window !== 'undefined' && result) {
          // WAVヘッダーを追加してブラウザで再生可能な形式に変換
          const wavData = this.addWavHeader(result.audioData, result.sampleRate || 24000, result.channels || 1, 16)
          const blob = new Blob([wavData], { type: 'audio/wav' })
          result.audioUrl = URL.createObjectURL(blob)
        }
        
        console.log('🎵 Primary TTS service succeeded:', result ? 'Yes' : 'No')
        return result
      } else {
        console.log(`🎵 Primary TTS service not available: ${this.primaryService}`)
        console.log('🎵 Service availability details:', {
          primaryService: this.primaryService,
          geminiAvailable: this.geminiService.isAvailable(),
          openaiAvailable: this.openaiService.isAvailable(),
          inworldAvailable: this.inworldService.isAvailable(),
          localInworldAvailable: this.localInworldService.isAvailable(),
          coquiXTTSAvailable: this.coquiXTTSService.isAvailable(),
          webSpeechAvailable: this.webSpeechService.isAvailable()
        })
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unknown error'
      console.warn(`🎵 Primary TTS service failed: ${this.lastError}`)
    }

    // フォールバックが有効な場合、利用可能なサービスを順次試行
    if (this.enableFallback) {
      console.log('🎵 Trying fallback services...')
      for (const fallbackService of fallbackServices) {
        if (fallbackService.isAvailable()) {
          try {
            const serviceName = fallbackService === this.geminiService ? 'Gemini TTS' :
                              fallbackService === this.openaiService ? 'OpenAI TTS' :
                              fallbackService === this.inworldService ? 'Inworld AI TTS' :
                              fallbackService === this.localInworldService ? 'Local Inworld TTS' :
                              fallbackService === this.coquiXTTSService ? 'Coqui XTTS-v2' : 'Web Speech API'
            console.log(`🎵 Falling back to: ${serviceName}`)
            const result = await fallbackService.synthesize(text, options)
            
            // audioUrlを追加（ブラウザ環境でのみ）
            if (typeof window !== 'undefined' && result) {
              // WAVヘッダーを追加してブラウザで再生可能な形式に変換
              const wavData = this.addWavHeader(result.audioData, result.sampleRate || 24000, result.channels || 1, 16)
              const blob = new Blob([wavData], { type: 'audio/wav' })
              result.audioUrl = URL.createObjectURL(blob)
            }
            
            console.log(`🎵 Fallback service ${serviceName} succeeded:`, result ? 'Yes' : 'No')
            return result
          } catch (error) {
            this.lastError = error instanceof Error ? error.message : 'Unknown error'
            const serviceName = fallbackService === this.geminiService ? 'Gemini TTS' :
                              fallbackService === this.openaiService ? 'OpenAI TTS' :
                              fallbackService === this.inworldService ? 'Inworld AI TTS' :
                              fallbackService === this.localInworldService ? 'Local Inworld TTS' :
                              fallbackService === this.coquiXTTSService ? 'Coqui XTTS-v2' : 'Web Speech API'
            console.warn(`🎵 Fallback service ${serviceName} failed: ${this.lastError}`)
          }
        } else {
          const serviceName = fallbackService === this.geminiService ? 'Gemini TTS' :
                            fallbackService === this.openaiService ? 'OpenAI TTS' :
                            fallbackService === this.inworldService ? 'Inworld AI TTS' :
                            fallbackService === this.localInworldService ? 'Local Inworld TTS' : 'Web Speech API'
          console.log(`🎵 Fallback service ${serviceName} not available`)
        }
      }
    }

    // すべてのサービスが失敗した場合
    console.error('🎵 All TTS services failed. Last error:', this.lastError || 'No services available')
    throw new Error(`All TTS services failed. Last error: ${this.lastError || 'No services available'}`)
  }

  // Web Speech APIの直接再生機能（フォールバック用）
  speak(text: string, options: TTSOptions = {}): void {
    if (this.webSpeechService.isAvailable() && 'speak' in this.webSpeechService) {
      (this.webSpeechService as any).speak(text, options)
    } else {
      console.warn('Web Speech API is not available for direct speech')
    }
  }

  // 利用可能な音声を取得（全サービスから）
  async getAvailableSpeakers(): Promise<TTSSpeaker[]> {
    const speakers: TTSSpeaker[] = []

    try {
      if (this.geminiService.isAvailable()) {
        const geminiSpeakers = await this.geminiService.getAvailableSpeakers()
        speakers.push(...geminiSpeakers.map(s => ({ ...s, service: 'gemini' })))
      }
    } catch (error) {
      console.warn('Failed to get Gemini speakers:', error)
    }

    try {
      if (this.openaiService.isAvailable()) {
        const openaiSpeakers = await this.openaiService.getAvailableSpeakers()
        speakers.push(...openaiSpeakers.map(s => ({ ...s, service: 'openai' })))
      }
    } catch (error) {
      console.warn('Failed to get OpenAI speakers:', error)
    }

    try {
      if (this.inworldService.isAvailable()) {
        const inworldSpeakers = await this.inworldService.getAvailableSpeakers()
        speakers.push(...inworldSpeakers.map(s => ({ ...s, service: 'inworld' })))
      }
    } catch (error) {
      console.warn('Failed to get Inworld AI speakers:', error)
    }

    try {
      if (this.localInworldService.isAvailable()) {
        const localInworldSpeakers = await this.localInworldService.getAvailableSpeakers()
        speakers.push(...localInworldSpeakers.map(s => ({ ...s, service: 'local-inworld' })))
      }
    } catch (error) {
      console.warn('Failed to get Local Inworld speakers:', error)
    }

    try {
      if (this.coquiXTTSService.isAvailable()) {
        const coquiXTTSSpeakers = await this.coquiXTTSService.getAvailableSpeakers()
        speakers.push(...coquiXTTSSpeakers.map(s => ({ ...s, service: 'coqui-xtts' })))
      }
    } catch (error) {
      console.warn('Failed to get Coqui XTTS-v2 speakers:', error)
    }

    try {
      if (this.webSpeechService.isAvailable()) {
        const webSpeechSpeakers = await this.webSpeechService.getAvailableSpeakers()
        speakers.push(...webSpeechSpeakers.map(s => ({ ...s, service: 'web-speech' })))
      }
    } catch (error) {
      console.warn('Failed to get Web Speech speakers:', error)
    }

    return speakers
  }

  // サポートされている言語を取得
  getSupportedLanguages(): string[] {
    const languages = new Set<string>()

    if (this.geminiService.isAvailable()) {
      this.geminiService.getSupportedLanguages().forEach(lang => languages.add(lang))
    }

    if (this.openaiService.isAvailable()) {
      this.openaiService.getSupportedLanguages().forEach(lang => languages.add(lang))
    }

    if (this.inworldService.isAvailable()) {
      this.inworldService.getSupportedLanguages().forEach(lang => languages.add(lang))
    }

    if (this.localInworldService.isAvailable()) {
      this.localInworldService.getSupportedLanguages().forEach(lang => languages.add(lang))
    }

    if (this.webSpeechService.isAvailable()) {
      this.webSpeechService.getSupportedLanguages().forEach(lang => languages.add(lang))
    }

    return Array.from(languages)
  }

  // サポートされている形式を取得
  getSupportedFormats(): string[] {
    const formats = new Set<string>()

    if (this.geminiService.isAvailable()) {
      this.geminiService.getSupportedFormats().forEach(format => formats.add(format))
    }

    if (this.openaiService.isAvailable()) {
      this.openaiService.getSupportedFormats().forEach(format => formats.add(format))
    }

    if (this.inworldService.isAvailable()) {
      this.inworldService.getSupportedFormats().forEach(format => formats.add(format))
    }

    if (this.localInworldService.isAvailable()) {
      this.localInworldService.getSupportedFormats().forEach(format => formats.add(format))
    }

    if (this.webSpeechService.isAvailable()) {
      this.webSpeechService.getSupportedFormats().forEach(format => formats.add(format))
    }

    return Array.from(formats)
  }

  // 最後のエラーを取得
  getLastError(): string | null {
    return this.lastError
  }

  // TTS要求解析を実行（結果のみ取得）
  async analyzeTTSRequest(userInput: string): Promise<TTSRequestAnalysis> {
    return await this.ttsRequestAnalyzer.analyzeTTSRequest(userInput)
  }

  // プライマリサービスを変更
  setPrimaryService(service: 'gemini' | 'openai' | 'web-speech' | 'inworld' | 'local-inworld') {
    this.primaryService = service
  }

  // フォールバック機能の有効/無効を切り替え
  setFallbackEnabled(enabled: boolean) {
    this.enableFallback = enabled
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

  // サービスが利用可能かどうかを確認
  isAnyServiceAvailable(): boolean {
    const availableServices = [
      { name: 'Gemini', available: this.geminiService.isAvailable() },
      { name: 'OpenAI', available: this.openaiService.isAvailable() },
      { name: 'Inworld', available: this.inworldService.isAvailable() },
      { name: 'Local Inworld', available: this.localInworldService.isAvailable() },
      { name: 'Web Speech', available: this.webSpeechService.isAvailable() }
    ]
    
    console.log('🔍 Available TTS Services:', availableServices)
    
    // Local Inworldが選択されているが利用できない場合の警告
    if (this.primaryService === 'local-inworld' && !this.localInworldService.isAvailable()) {
      console.warn('⚠️  Local Inworld TTS selected but not available. Consider using Web Speech API as fallback.')
    }
    
    const hasAvailable = availableServices.some(service => service.available)
    console.log(`✅ TTS Service Available: ${hasAvailable}`)
    
    return hasAvailable
  }
}

export function createTTSManager(config?: TTSManagerConfig): TTSManager {
  return new TTSManager(config)
}
