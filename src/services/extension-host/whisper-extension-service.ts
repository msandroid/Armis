import { WhisperNodeService } from '../stt/whisper-node-service'
import { STTResult, STTOptions } from '../../types/stt'
import path from 'path'
import fs from 'fs'

/**
 * VSCodium拡張のExtension Host側でwhisper.cppを実行するサービス
 * 
 * このサービスはExtension Host（Node.js環境）で動作し、
 * Webview UIからの要求を受け取ってwhisper.cppを実行します
 */
export class WhisperExtensionService {
  private whisperService: WhisperNodeService
  private isInitialized = false

  constructor() {
    // whisper.cppのパスを設定
    const whisperPath = path.join(process.cwd(), 'whisper.cpp/build/bin/whisper-cli')
    const modelPath = path.join(process.cwd(), 'whisper.cpp/models/ggml-tiny.bin')

    this.whisperService = new WhisperNodeService({
      whisperPath,
      modelPath,
      language: 'en',
      outputFormat: 'txt'
    })
  }

  /**
   * サービスを初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    try {
      // whisper.cppの実行ファイルが存在するかチェック
      if (!fs.existsSync(this.whisperService['config'].whisperPath)) {
        throw new Error(`Whisper CLI not found: ${this.whisperService['config'].whisperPath}`)
      }

      // モデルファイルが存在するかチェック
      if (!fs.existsSync(this.whisperService['config'].modelPath)) {
        throw new Error(`Whisper model not found: ${this.whisperService['config'].modelPath}`)
      }

      this.isInitialized = true
      console.log('✅ WhisperExtensionService initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize WhisperExtensionService:', error)
      throw error
    }
  }

  /**
   * 音声ファイルを文字起こし
   */
  async transcribeFile(filePath: string, options?: STTOptions): Promise<STTResult> {
    await this.ensureInitialized()
    
    try {
      console.log(`🎤 Transcribing file: ${filePath}`)
      const startTime = Date.now()
      
      const result = await this.whisperService.transcribeFile(filePath, options)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`✅ Transcription completed in ${duration}ms`)
      console.log(`📝 Result: ${result.text.substring(0, 100)}...`)
      
      return result
    } catch (error) {
      console.error('❌ Transcription failed:', error)
      throw error
    }
  }

  /**
   * 音声データ（ArrayBuffer）を文字起こし
   */
  async transcribeAudio(audioData: ArrayBuffer, options?: STTOptions): Promise<STTResult> {
    await this.ensureInitialized()
    
    try {
      console.log(`🎤 Transcribing audio data (${audioData.byteLength} bytes)`)
      const startTime = Date.now()
      
      const result = await this.whisperService.transcribe(audioData, options)
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      console.log(`✅ Transcription completed in ${duration}ms`)
      console.log(`📝 Result: ${result.text.substring(0, 100)}...`)
      
      return result
    } catch (error) {
      console.error('❌ Transcription failed:', error)
      throw error
    }
  }

  /**
   * 複数の音声ファイルを一括処理
   */
  async transcribeBatch(filePaths: string[], options?: STTOptions): Promise<STTResult[]> {
    await this.ensureInitialized()
    
    const results: STTResult[] = []
    
    for (const filePath of filePaths) {
      try {
        console.log(`🎤 Processing: ${filePath}`)
        const result = await this.transcribeFile(filePath, options)
        results.push(result)
        console.log(`✅ ${filePath}: ${result.text.substring(0, 50)}...`)
      } catch (error) {
        console.error(`❌ Failed to process ${filePath}:`, error)
        // エラーが発生しても他のファイルの処理を継続
        results.push({
          text: '',
          language: options?.language || 'en',
          confidence: 0,
          duration: 0,
          segments: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    console.log(`📊 Batch processing completed: ${results.length}/${filePaths.length} files processed`)
    return results
  }

  /**
   * リアルタイム音声認識（ファイル監視）
   */
  async startRealtimeTranscription(
    watchDirectory: string,
    onTranscription: (filePath: string, result: STTResult) => void,
    onError?: (filePath: string, error: Error) => void
  ): Promise<void> {
    await this.ensureInitialized()
    
    // 監視ディレクトリを作成
    await fs.promises.mkdir(watchDirectory, { recursive: true })
    
    console.log(`👀 Starting real-time transcription for: ${watchDirectory}`)
    
    // ファイル監視を開始
    fs.watch(watchDirectory, async (eventType, filename) => {
      if (eventType === 'rename' && filename) {
        const filePath = path.join(watchDirectory, filename)
        
        // ファイルが完全に書き込まれるまで少し待機
        setTimeout(async () => {
          try {
            if (fs.existsSync(filePath)) {
              console.log(`🎵 New audio file detected: ${filename}`)
              
              const result = await this.transcribeFile(filePath)
              onTranscription(filePath, result)
              
              // 処理済みファイルを移動
              const processedDir = path.join(watchDirectory, 'processed')
              await fs.promises.mkdir(processedDir, { recursive: true })
              
              const newPath = path.join(processedDir, `transcribed_${Date.now()}_${filename}`)
              await fs.promises.rename(filePath, newPath)
              console.log(`✅ Moved to: ${newPath}`)
            }
          } catch (error) {
            console.error(`❌ Error processing ${filename}:`, error)
            if (onError) {
              onError(filePath, error instanceof Error ? error : new Error(String(error)))
            }
          }
        }, 1000)
      }
    })
  }

  /**
   * サポートされている音声形式を取得
   */
  getSupportedFormats(): string[] {
    return this.whisperService.getSupportedFormats()
  }

  /**
   * サービスが利用可能かチェック
   */
  isAvailable(): boolean {
    return this.whisperService.isAvailable() && this.isInitialized
  }

  /**
   * 初期化状態を確認
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<{
    language: string
    outputFormat: 'txt' | 'json' | 'srt' | 'vtt'
    modelPath: string
  }>): void {
    Object.assign(this.whisperService['config'], config)
    console.log('🔧 WhisperExtensionService config updated:', config)
  }

  /**
   * 利用可能なモデルを取得
   */
  async getAvailableModels(): Promise<string[]> {
    const modelsDir = path.join(process.cwd(), 'whisper.cpp/models')
    const models: string[] = []
    
    try {
      const files = await fs.promises.readdir(modelsDir)
      for (const file of files) {
        if (file.endsWith('.bin')) {
          models.push(file)
        }
      }
    } catch (error) {
      console.warn('Failed to read models directory:', error)
    }
    
    return models
  }
}

// シングルトンインスタンス
let whisperExtensionService: WhisperExtensionService | null = null

/**
 * WhisperExtensionServiceのインスタンスを取得
 */
export function getWhisperExtensionService(): WhisperExtensionService {
  if (!whisperExtensionService) {
    whisperExtensionService = new WhisperExtensionService()
  }
  return whisperExtensionService
}

/**
 * WhisperExtensionServiceを初期化
 */
export async function initializeWhisperExtensionService(): Promise<WhisperExtensionService> {
  const service = getWhisperExtensionService()
  await service.initialize()
  return service
}
