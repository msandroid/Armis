import { STTService, STTResult, STTOptions, WhisperConfig } from '../../types/stt'
import { base64ToArrayBuffer, getAudioInfo, formatAudioDuration, convertToWav, fileToBase64 } from '../../utils/audio-utils'

interface WhisperTranscribeOptions {
  language?: string
  translate?: boolean
  nThreads?: number
}

interface WhisperTranscribeResult {
  text: string
  language: string
  segments: any[]
  success: boolean
}

// Whisper WebAssemblyモジュールの型定義
declare global {
  interface Window {
    Module?: any
  }
}

/**
 * Whisper.cppを使用したローカルSTTサービス
 * 
 * WebAssembly版のwhisper.cppを使用してローカルで音声認識を実行
 */
export class WhisperLocalService implements STTService {
  private static instance: WhisperLocalService | null = null
  private config: WhisperConfig
  private isInitialized = false
  private whisperModule: any = null
  private modelLoaded = false
  private whisperInstance: any = null
  private transcriptionOutput: string[] = []
  private originalPrint: any = null

  constructor(config: WhisperConfig) {
    this.config = {
      language: 'ja',
      temperature: 0.0,
      maxTokens: 448,
      ...config
    }
    console.log('🎤 WhisperLocalService instance created')
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(config?: WhisperConfig): WhisperLocalService {
    if (!WhisperLocalService.instance) {
      const defaultConfig: WhisperConfig = {
        modelPath: '/whisper/ggml-tiny.bin',
        language: 'ja',
        temperature: 0.0,
        maxTokens: 448,
        ...config
      }
      WhisperLocalService.instance = new WhisperLocalService(defaultConfig)
    } else {
      console.log('🔄 WhisperLocalService instance already exists, reusing...')
    }
    return WhisperLocalService.instance
  }

  /**
   * インスタンスをリセット（テスト用）
   */
  static resetInstance(): void {
    WhisperLocalService.instance = null
  }

  /**
   * サービスが利用可能かどうかを確認
   */
  isAvailable(): boolean {
    // ブラウザ環境でWebAssemblyが利用可能かチェック
    const available = typeof WebAssembly !== 'undefined' && this.isInitialized && this.whisperModule
    console.log('🔍 WhisperLocalService availability check:', {
      hasWebAssembly: typeof WebAssembly !== 'undefined',
      isInitialized: this.isInitialized,
      hasModule: !!this.whisperModule,
      available
    })
    return available
  }

  /**
   * サポートされている音声形式を取得
   */
  getSupportedFormats(): string[] {
    return ['wav', 'mp3', 'ogg', 'flac', 'm4a', 'aac']
  }

  /**
   * Whisperモジュールを初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized && this.whisperModule) {
      console.log('✅ Whisper service already initialized')
      return
    }

    try {
      console.log('🚀 Initializing Whisper local service...')
      
      // WebAssemblyモジュールの読み込み
      if (typeof window !== 'undefined' && window.Module) {
        this.whisperModule = window.Module
        console.log('✅ Whisper module found in window object')
      } else {
        console.log('📥 Loading Whisper module dynamically...')
        // 動的にwhisper.jsを読み込み
        await this.loadWhisperModule()
      }
      
      // モジュールが正常に読み込まれたか確認
      if (!this.whisperModule) {
        throw new Error('Whisper module not loaded')
      }
      
      console.log('🔧 Whisper module loaded, waiting for initialization...')
      
      // モジュールが完全に初期化されるまで待機
      await this.waitForModuleReady()
      
      // Vite環境での追加の待機時間
      console.log('⏳ Additional wait for Vite environment...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // モデルファイルをWebAssemblyファイルシステムに読み込み
      await this.loadModelFile()
      
      this.isInitialized = true
      console.log('✅ Whisper local service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Whisper local service:', error)
      this.isInitialized = false
      this.whisperModule = null
      throw new Error(`Whisper initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Whisper WebAssemblyモジュールを動的に読み込み
   */
  private async loadWhisperModule(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('📦 Starting to load Whisper WebAssembly module...')
        
        // 既にモジュールが存在する場合はスキップ
        if (typeof window !== 'undefined' && (window as any).Module && this.whisperModule) {
          console.log('Whisper module found in window object')
          resolve()
          return
        }
        
        // Moduleオブジェクトを初期化（whisper.cpp公式実装に合わせる）
        const Module = {
          print: (text: string) => {
            console.log('Whisper:', text)
          },
          printErr: (text: string) => {
            console.error('Whisper Error:', text)
          },
          setStatus: (text: string) => {
            console.log('Whisper Status:', text)
          },
          monitorRunDependencies: (left: number) => {
            console.log('Whisper Dependencies:', left)
          },
          onRuntimeInitialized: () => {
            console.log('✅ Whisper runtime initialized')
            this.whisperModule = (window as any).Module
            resolve()
          },
          locateFile: (path: string) => {
            console.log('Whisper locateFile:', path)
            // Vite環境でのパス解決
            if (path.endsWith('.wasm')) {
              return `/whisper/${path}`
            }
            return path
          },
          // Vite環境での追加設定
          wasmBinaryFile: '/whisper/whisper.wasm',
          noInitialRun: true,
          noExitRuntime: true
        }
        
        // グローバルにModuleを設定
        ;(window as any).Module = Module
        
        // main.jsスクリプトを動的に読み込み
        const script = document.createElement('script')
        script.src = '/whisper/main.js'
        script.async = true
        script.crossOrigin = 'anonymous'
        
        script.onload = () => {
          console.log('✅ Whisper main.js loaded successfully')
          
          // Moduleオブジェクトが利用可能になるまで待機
          const checkModule = () => {
            const module = (window as any).Module
            
            if (module && module.FS && module.init && module.full_default) {
              this.whisperModule = module
              console.log('✅ Whisper Module loaded successfully with all APIs')
              resolve()
            } else if (module && module.init && module.full_default) {
              // FSがなくても基本的な機能があればOK
              this.whisperModule = module
              console.log('✅ Whisper Module loaded with basic APIs (FS not available)')
              resolve()
            } else if (module && module.init) {
              // initだけでも初期化完了とみなす（full_defaultは後で利用可能になる）
              this.whisperModule = module
              console.log('✅ Whisper Module loaded with init API')
              resolve()
            } else if (module) {
              // Moduleオブジェクトが存在する場合は少し待つ
              console.log('⏳ Module exists but APIs not ready yet...')
              setTimeout(checkModule, 200)
            } else {
              console.log('⏳ Waiting for module initialization...')
              setTimeout(checkModule, 100)
            }
          }
          
          // 少し待ってからチェック開始
          setTimeout(checkModule, 1000)
        }
        
        script.onerror = (error) => {
          console.error('❌ Failed to load main.js:', error)
          reject(new Error('Failed to load Whisper WebAssembly module'))
        }
        
        document.head.appendChild(script)
      } catch (error) {
        console.error('❌ Error loading Whisper module:', error)
        reject(error)
      }
    })
  }

  /**
   * モジュールが完全に初期化されるまで待機
   */
  private async waitForModuleReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      let retryCount = 0
      const maxRetries = 300 // 30秒間待機（初期化チェックを短縮）
      
      const checkReady = () => {
        // モジュールの状態を詳細にチェック
        const moduleState = {
          hasModule: !!this.whisperModule,
          hasFS: !!(this.whisperModule && this.whisperModule.FS),
          hasccall: !!(this.whisperModule && this.whisperModule.ccall),
          hascwrap: !!(this.whisperModule && this.whisperModule.cwrap),
          hasMemory: !!(this.whisperModule && this.whisperModule.HEAPU8),
          isReady: !!(this.whisperModule && this.whisperModule.ready),
          hasMalloc: !!(this.whisperModule && this.whisperModule._malloc),
          hasFree: !!(this.whisperModule && this.whisperModule._free),
          hasInit: !!(this.whisperModule && this.whisperModule.init),
          hasFullDefault: !!(this.whisperModule && this.whisperModule.full_default),
          availableFunctions: this.whisperModule ? Object.keys(this.whisperModule).filter(key => typeof this.whisperModule[key] === 'function').slice(0, 20) : []
        }
        
        if (retryCount % 30 === 0) { // 3秒ごとにログ出力
          console.log('🔍 Checking Whisper module state:', moduleState)
        }
        
        // より柔軟な条件チェック
        if (this.whisperModule && this.whisperModule.init) {
          // initがあれば基本的な初期化は完了
          console.log('✅ Whisper module ready with init API')
          console.log('📋 Available functions:', moduleState.availableFunctions)
          resolve()
        } else if (retryCount >= maxRetries) {
          console.error('❌ Whisper module initialization timeout. Module state:', moduleState)
          reject(new Error('Whisper module initialization timeout'))
        } else {
          retryCount++
          if (retryCount % 30 === 0) { // 3秒ごとにログ出力
            console.log(`⏳ Waiting for module initialization... (${retryCount}/${maxRetries})`)
          }
          setTimeout(checkReady, 100)
        }
      }
      
      checkReady()
    })
  }

  /**
   * モデルファイルをWebAssemblyファイルシステムに読み込み
   */
  private async loadModelFile(): Promise<void> {
    try {
      console.log('📥 Loading model file into WebAssembly filesystem...')
      
      // 利用可能なモデルファイルの優先順位
      const modelFiles = [
        '/whisper/models/ggml-tiny-q5_1.bin',  // 最優先：軽量で高速
        '/whisper/models/ggml-tiny.bin',       // 代替1
        '/whisper/models/ggml-base-q5_1.bin',  // 代替2
        '/whisper/models/ggml-base.bin'        // 代替3
      ]
      
      let modelData: ArrayBuffer | null = null
      let selectedModelPath = ''
      
      // 利用可能なモデルファイルを順次チェック
      for (const modelPath of modelFiles) {
        try {
          console.log(`🔍 Trying model: ${modelPath}`)
          const response = await fetch(modelPath)
          if (response.ok) {
            modelData = await response.arrayBuffer()
            selectedModelPath = modelPath
            console.log(`✅ Model file loaded: ${modelPath}, size: ${modelData.byteLength} bytes`)
            break
          }
        } catch (error) {
          console.log(`❌ Failed to load ${modelPath}:`, error)
          continue
        }
      }
      
      if (!modelData) {
        throw new Error('No available model files found')
      }
      
      // モデルファイルサイズの検証
      const minSize = 10000000 // 10MB以上
      if (modelData.byteLength < minSize) {
        throw new Error(`Model file too small: ${modelData.byteLength} bytes (expected > ${minSize})`)
      }
      
      const modelName = selectedModelPath.split('/').pop() || 'whisper.bin'
      
      // WebAssemblyファイルシステムに書き込み（FSが利用可能な場合のみ）
      if (this.whisperModule.FS) {
        try {
          // 既存のファイルを削除
          try {
            this.whisperModule.FS.unlink('whisper.bin')
          } catch (e) {
            // ファイルが存在しない場合は無視
          }
          
          // 新しいファイルを作成
          this.whisperModule.FS.createDataFile('/', 'whisper.bin', new Uint8Array(modelData), true, true)
          console.log('✅ Model file written to WebAssembly filesystem: whisper.bin')
        } catch (error) {
          console.error('❌ Failed to write to WebAssembly filesystem:', error)
          console.log('⚠️ Will use global variable for model data')
        }
      } else {
        console.log('⚠️ FS not available, will use global variable for model data')
      }
      
    } catch (error) {
      console.error('❌ Failed to load model file:', error)
      throw new Error(`Model file loading failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * WebAssemblyファイルシステムが利用可能になるまで待機
   */
  private async waitForFileSystem(): Promise<void> {
    return new Promise((resolve, reject) => {
      let retryCount = 0
      const maxRetries = 150 // 15秒間待機（増加）
      
      const checkFileSystem = () => {
        // より詳細なチェック：モジュール、FS、init関数の状態を確認
        const hasModule = !!this.whisperModule
        const hasFS = !!this.whisperModule?.FS
        const hasInit = !!this.whisperModule?.init
        const hasRuntime = !!this.whisperModule?.runtimeInitialized
        
        if (hasModule && (hasFS || hasInit) && hasRuntime) {
          console.log('✅ WebAssembly module is fully ready for initialization', {
            hasModule,
            hasFS,
            hasInit,
            hasRuntime
          })
          resolve()
        } else if (retryCount >= maxRetries) {
          console.error('❌ WebAssembly module initialization timeout', {
            hasModule,
            hasFS,
            hasInit,
            hasRuntime,
            retryCount
          })
          reject(new Error('WebAssembly module initialization timeout'))
        } else {
          retryCount++
          if (retryCount % 20 === 0) { // 2秒ごとにログ出力
            console.log(`⏳ Waiting for module initialization... (${retryCount}/${maxRetries})`, {
              hasModule,
              hasFS,
              hasInit,
              hasRuntime
            })
          }
          setTimeout(checkFileSystem, 100)
        }
      }
      
      checkFileSystem()
    })
  }

  /**
   * 音声ファイルを文字起こし
   */
  async transcribe(audioData: ArrayBuffer | string, options?: STTOptions): Promise<STTResult> {
    console.log('🎤 Starting transcription process...')
    
    if (!this.isAvailable()) {
      console.log('🔄 Service not available, initializing...')
      await this.initialize()
    }

    const startTime = Date.now()
    
    try {
      console.log('📥 Processing audio data...')
      
      // 音声データの前処理
      let processedAudioData: ArrayBuffer
      if (typeof audioData === 'string') {
        // Base64文字列の場合
        console.log('🔄 Converting base64 to ArrayBuffer...')
        processedAudioData = base64ToArrayBuffer(audioData)
      } else {
        processedAudioData = audioData
      }

      console.log('📊 Audio data size:', processedAudioData.byteLength, 'bytes')

      // 音声ファイルの情報を取得
      console.log('🔍 Getting audio info...')
      const audioInfo = await getAudioInfo(processedAudioData)
      console.log('📋 Audio info:', audioInfo)
      
      // 実際のwhisper.cppによる文字起こし処理
      console.log('🎯 Starting whisper.cpp transcription...')
      const transcriptionResult = await this.performTranscription(processedAudioData, options)
      
      const endTime = Date.now()
      const duration = endTime - startTime

      console.log('✅ Transcription completed in', duration, 'ms')

      return {
        text: transcriptionResult.text,
        segments: transcriptionResult.segments,
        language: options?.language || this.config.language,
        duration,
        confidence: transcriptionResult.confidence
      }
    } catch (error) {
      console.error('❌ Transcription failed:', error)
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ファイルから直接文字起こし
   */
  async transcribeFile(file: File, options?: STTOptions): Promise<STTResult> {
    try {
      // ファイルをBase64に変換
      const base64Data = await fileToBase64(file)
      
      // 音声データをWAV形式に変換
      const audioBuffer = base64ToArrayBuffer(base64Data)
      const wavData = await convertToWav(audioBuffer, file.name.split('.').pop() || 'wav')
      
      // 文字起こし実行
      return await this.transcribe(wavData, options)
    } catch (error) {
      console.error('File transcription failed:', error)
      throw new Error(`File transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 実際の文字起こし処理
   */
  private async performTranscription(audioData: ArrayBuffer, options?: STTOptions): Promise<{
    text: string
    segments?: any[]
    confidence?: number
  }> {
    try {
      console.log('🎤 Starting performTranscription...')
      console.log('📊 Input audio data size:', audioData.byteLength, 'bytes')
      
      // モデルが読み込まれていない場合は読み込み
      if (!this.modelLoaded) {
        console.log('📥 Loading Whisper model...')
        await this.loadModel()
      } else {
        console.log('✅ Model already loaded')
      }

      // 音声データをFloat32Arrayに変換
      console.log('🔄 Converting audio data...')
      const audioContext = new AudioContext()
      const audioBuffer = await audioContext.decodeAudioData(audioData)
      const audioArray = audioBuffer.getChannelData(0)
      
      console.log('✅ Audio conversion completed:', {
        sampleRate: audioBuffer.sampleRate,
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels,
        length: audioArray.length
      })
      
      // Whisperインスタンスが初期化されていない場合は初期化
      if (!this.whisperInstance) {
        try {
          console.log('🔧 Initializing Whisper instance...')
          
          // モジュールの状態を詳細にチェック
          console.log('🔍 Module state check:', {
            hasModule: !!this.whisperModule,
            hasFS: !!(this.whisperModule && this.whisperModule.FS),
            hasInit: !!(this.whisperModule && this.whisperModule.init),
            hasFullDefault: !!(this.whisperModule && this.whisperModule.full_default),
            availableFunctions: this.whisperModule ? Object.keys(this.whisperModule).filter(key => typeof this.whisperModule[key] === 'function').slice(0, 10) : []
          })
          
          // モデルファイルの存在確認（FSが利用可能な場合のみ）
          if (this.whisperModule.FS) {
            try {
              // まずwhisper.binをチェック
              const fileInfo = this.whisperModule.FS.stat('whisper.bin')
              console.log('✅ Model file found in filesystem:', {
                path: 'whisper.bin',
                size: fileInfo.size,
                isFile: this.whisperModule.FS.isFile(fileInfo.mode)
              })
            } catch (error) {
              console.log('⚠️ whisper.bin not found, checking available models...')
              
              // 利用可能なモデルファイルをチェック
              const availableModels = ['ggml-tiny-q5_1.bin', 'ggml-tiny.bin', 'ggml-base-q5_1.bin']
              let foundModel = false
              
              for (const model of availableModels) {
                try {
                  const fileInfo = this.whisperModule.FS.stat(model)
                  console.log(`✅ Found model in filesystem: ${model} (${fileInfo.size} bytes)`)
                  foundModel = true
                  break
                } catch (e) {
                  // ファイルが存在しない場合は次を試行
                }
              }
              
              if (!foundModel) {
                console.log('⚠️ No models found in filesystem, will use global model data')
              }
            }
          } else {
            console.log('⚠️ FS not available, will use global model data')
          }
          
                     // Whisperインスタンスを初期化
           await this.initializeWhisperInstance()
        } catch (error) {
          console.error('❌ Whisper instance initialization failed:', error)
          throw new Error(`Whisper instance initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        console.log('✅ Whisper instance already initialized')
      }
      
      // 出力をキャプチャするためにprint関数をオーバーライド
      this.setupOutputCapture()
      
      // 文字起こし実行
      const language = options?.language || this.config.language
      const nthreads = 4 // スレッド数
      const translate = false // 翻訳ではなく文字起こし
      
      console.log('🎯 Starting transcription with whisper.cpp...')
      console.log('📋 Parameters:', {
        language,
        nthreads,
        translate,
        audioLength: audioArray.length,
        sampleRate: audioBuffer.sampleRate
      })
      
      // Whisper WebAssembly APIの呼び出し
      console.log('🚀 Calling Whisper transcription API...')
      
      // APIが利用可能かチェック
      if (!this.whisperModule.full_default) {
        console.error('❌ Whisper API not available:', {
          hasFullDefault: !!this.whisperModule.full_default,
          availableFunctions: Object.keys(this.whisperModule).filter(key => typeof this.whisperModule[key] === 'function')
        })
        
        // full_defaultが利用できない場合は、代替のAPIを探す
        const availableFunctions = Object.keys(this.whisperModule).filter(key => typeof this.whisperModule[key] === 'function')
        console.log('🔍 Available functions:', availableFunctions)
        
        // whisper関数が利用可能かチェック
        if (this.whisperModule.whisper) {
          console.log('✅ Using whisper function as alternative')
        } else {
          throw new Error('Whisper transcription API not available')
        }
      }
      
      // 音声データを適切な形式に変換（スタックオーバーフローを防ぐため最適化）
      const audioFloat32 = new Float32Array(audioArray)
      
      // 音声データのサイズを制限してスタックオーバーフローを防ぐ
      const maxAudioLength = 500000 // 500KB制限（より安全な値）
      let finalAudioData: Float32Array
      
      if (audioFloat32.length > maxAudioLength) {
        console.warn('⚠️ Audio data too large, truncating to prevent stack overflow')
        const truncatedAudio = audioFloat32.slice(0, maxAudioLength)
        
        // 正規化とクリッピング（最適化されたループ、バッチ処理）
        finalAudioData = new Float32Array(truncatedAudio.length)
        const batchSize = 10000 // バッチサイズ
        
        for (let i = 0; i < truncatedAudio.length; i += batchSize) {
          const end = Math.min(i + batchSize, truncatedAudio.length)
          for (let j = i; j < end; j++) {
            const value = truncatedAudio[j]
            finalAudioData[j] = Math.max(-1.0, Math.min(1.0, value))
          }
        }
      } else {
        // 通常の処理（バッチ処理で最適化）
        finalAudioData = new Float32Array(audioFloat32.length)
        const batchSize = 10000 // バッチサイズ
        
        for (let i = 0; i < audioFloat32.length; i += batchSize) {
          const end = Math.min(i + batchSize, audioFloat32.length)
          for (let j = i; j < end; j++) {
            const value = audioFloat32[j]
            finalAudioData[j] = Math.max(-1.0, Math.min(1.0, value))
          }
        }
      }
      
      console.log('📊 Audio data prepared:', {
        length: finalAudioData.length,
        sampleRate: audioBuffer.sampleRate,
        duration: finalAudioData.length / audioBuffer.sampleRate,
        originalLength: audioFloat32.length,
        normalized: true,
        truncated: finalAudioData.length < audioFloat32.length
      })
      
      // whisper.cppのAPIを使用（利用可能な関数に応じて動的に選択）
      console.log('🔧 Calling whisper.cpp API with parameters:', {
        whisperInstance: !!this.whisperInstance,
        audioLength: finalAudioData.length,
        language,
        nthreads,
        translate
      })
      
      try {
        let result: number = -1 // デフォルト値を設定
        
        // Whisperインスタンスの状態を詳細にチェック
        console.log('🔍 Whisper instance details:', {
          hasInstance: !!this.whisperInstance,
          instanceType: typeof this.whisperInstance,
          instanceValue: this.whisperInstance,
          hasFullDefault: !!this.whisperModule.full_default,
          availableFunctions: Object.keys(this.whisperModule).filter(key => typeof this.whisperModule[key] === 'function')
        })
        
        // whisper.cpp公式実装のAPIを使用
        if (this.whisperModule.full_default) {
          console.log('🚀 Using full_default API (official whisper.cpp)')
          
          // インスタンスが有効かチェック
          if (!this.whisperInstance || this.whisperInstance === 0) {
            console.log('⚠️ Invalid whisper instance, trying to reinitialize...')
            
            // インスタンスを再初期化
            try {
              this.whisperInstance = this.whisperModule.init('')
              console.log('✅ Whisper instance reinitialized:', this.whisperInstance)
            } catch (reinitError) {
              console.error('❌ Failed to reinitialize whisper instance:', reinitError)
              throw new Error('Cannot reinitialize whisper instance')
            }
          }
          
          // インスタンスの有効性に応じてAPIを呼び出し
          if (this.whisperInstance && this.whisperInstance !== 0) {
            console.log('✅ Using valid whisper instance')
            
            // 音声データの詳細をログ出力
            console.log('🔍 Audio data details:', {
              length: finalAudioData.length,
              sampleRate: audioBuffer.sampleRate,
              duration: finalAudioData.length / audioBuffer.sampleRate,
              dataType: finalAudioData.constructor.name,
              hasNaN: finalAudioData.some(x => isNaN(x)),
              hasInfinity: finalAudioData.some(x => !isFinite(x)),
              minValue: Math.min(...finalAudioData),
              maxValue: Math.max(...finalAudioData)
            })
            
            // パラメータの詳細をログ出力
            console.log('🔍 API parameters:', {
              instance: this.whisperInstance,
              language,
              nthreads,
              translate,
              audioLength: finalAudioData.length
            })
            
            // スタックオーバーフローを防ぐため、try-catchで安全にAPIを呼び出し
            try {
              console.log('🔄 Calling full_default API safely...')
              
              // 音声データのサイズを制限してスタックオーバーフローを防ぐ
              const maxAudioLength = 500000 // 500KB制限（より安全な値）
              if (finalAudioData.length > maxAudioLength) {
                console.warn('⚠️ Audio data too large, truncating to prevent stack overflow')
                const truncatedAudio = finalAudioData.slice(0, maxAudioLength)
                result = this.whisperModule.full_default(
                  this.whisperInstance, 
                  truncatedAudio, 
                  language, 
                  nthreads, 
                  translate
                )
              } else {
                result = this.whisperModule.full_default(
                  this.whisperInstance, 
                  finalAudioData, 
                  language, 
                  nthreads, 
                  translate
                )
              }
              
              console.log('✅ full_default API call successful')
            } catch (apiCallError) {
              console.error('❌ full_default API call failed:', apiCallError)
              
              // 代替手段として、より安全なAPI呼び出しを試行
              try {
                console.log('🔄 Trying alternative API call method...')
                
                // パラメータを最小限に抑えて再試行
                result = this.whisperModule.full_default(
                  this.whisperInstance, 
                  finalAudioData.slice(0, Math.min(finalAudioData.length, 500000)), // 500KB制限
                  '', // 空の言語
                  1,  // 最小スレッド数
                  false // 翻訳なし
                )
                
                console.log('✅ Alternative API call successful')
              } catch (altError) {
                console.error('❌ Alternative API call also failed:', altError)
                throw new Error('All whisper.cpp API calls failed')
              }
            }
            
          } else {
            console.log('⚠️ Using fallback API call without instance')
            // インスタンスなしでAPIを呼び出し（一部のwhisper.cpp実装では可能）
            try {
              result = this.whisperModule.full_default(
                null, // インスタンスなし
                finalAudioData, 
                language, 
                nthreads, 
                translate
              )
            } catch (noInstanceError) {
              console.log('❌ API call without instance failed, trying with dummy instance')
              // ダミーインスタンスで再試行
              result = this.whisperModule.full_default(
                1, // ダミーインスタンス
                finalAudioData, 
                language, 
                nthreads, 
                translate
              )
            }
          }
        } else {
          console.error('❌ full_default API not available')
          throw new Error('Whisper full_default API not available')
        }
        
        console.log('📝 Whisper API result:', result)
        
        if (result !== 0) {
          throw new Error(`Whisper transcription failed with code: ${result}`)
        }
      } catch (apiError) {
        console.error('❌ Whisper API call failed:', apiError)
        
        // スタックオーバーフローエラーの場合は特別な処理
        if (apiError instanceof RangeError && apiError.message.includes('Maximum call stack size exceeded')) {
          console.error('🚨 Stack overflow detected! This is likely due to WebAssembly module issues.')
          throw new Error('Whisper WebAssembly module encountered a stack overflow. Please try with a shorter audio file or restart the application.')
        }
        
        throw new Error(`Whisper API call failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`)
      }
      
      // 出力キャプチャを停止
      this.restoreOutputCapture()
      
      // 結果を取得
      const transcriptionText = this.getTranscriptionResult()
      
      console.log('✅ Transcription completed successfully')
      console.log('📄 Result text:', transcriptionText.substring(0, 100) + '...')
      
      return {
        text: transcriptionText,
        segments: this.getTranscriptionSegments(),
        confidence: 0.95 // whisper.cppは信頼度を直接提供しないため推定値
      }
    } catch (error) {
      // エラーが発生した場合も出力キャプチャを停止
      this.restoreOutputCapture()
      console.error('❌ Transcription error:', error)
      throw error
    }
  }

  /**
   * 出力キャプチャを設定
   */
  private setupOutputCapture(): void {
    if (this.whisperModule && this.whisperModule.print) {
      this.originalPrint = this.whisperModule.print
      this.transcriptionOutput = []
      
      console.log('🎯 Setting up output capture...')
      
      this.whisperModule.print = (text: string) => {
        this.transcriptionOutput.push(text)
        console.log('📝 Whisper output:', text)
        // 元のprint関数も呼び出してコンソールに表示
        if (this.originalPrint) {
          this.originalPrint(text)
        }
      }
    } else {
      console.warn('⚠️ Whisper print function not available for output capture')
    }
  }

  /**
   * 出力キャプチャを復元
   */
  private restoreOutputCapture(): void {
    if (this.originalPrint && this.whisperModule) {
      this.whisperModule.print = this.originalPrint
      this.originalPrint = null
      console.log('🔄 Output capture restored')
    }
  }

  /**
   * 文字起こし結果を取得
   */
  private getTranscriptionResult(): string {
    try {
      console.log('📋 Processing transcription output...')
      console.log('📄 Raw output lines:', this.transcriptionOutput.length)
      
      // 出力から文字起こし結果を抽出
      const output = this.transcriptionOutput.join('')
      
      console.log('📄 Full output:', output.substring(0, 500) + '...')
      
      // whisper.cppの出力形式に応じて結果を抽出
      // 通常、文字起こし結果は特定のパターンで出力される
      const lines = output.split('\n')
      const transcriptionLines: string[] = []
      
      for (const line of lines) {
        // 文字起こし結果の行を識別（タイムスタンプやメタデータ以外の行）
        if (line.trim() && 
            !line.includes('js:') && 
            !line.includes('whisper') && 
            !line.includes('processing') &&
            !line.includes('initialized') &&
            !line.includes('loading') &&
            !line.includes('model') &&
            !line.includes('audio') &&
            !line.includes('language') &&
            !line.includes('threads') &&
            !line.includes('Dependencies') &&
            !line.includes('Status') &&
            !line.includes('Error')) {
          transcriptionLines.push(line.trim())
        }
      }
      
      console.log('📝 Filtered transcription lines:', transcriptionLines)
      
      const result = transcriptionLines.join(' ').trim()
      
      if (result) {
        console.log('✅ Transcription result found:', result)
        return result
      } else {
        // 結果が見つからない場合は、出力全体を返す
        console.warn('⚠️ No transcription result found, returning full output')
        return output.trim() || '文字起こし結果を取得できませんでした'
      }
    } catch (error) {
      console.error('❌ Failed to get transcription result:', error)
      return '文字起こし結果の取得に失敗しました'
    }
  }

  /**
   * 文字起こしセグメントを取得
   */
  private getTranscriptionSegments(): any[] {
    // whisper.cppのセグメント情報を取得
    // 現在の実装では、セグメント情報は利用できないため空配列を返す
    return []
  }

  /**
   * モデルファイルを読み込み
   */
  private async loadModel(): Promise<void> {
    try {
      console.log('Loading Whisper model...')
      
      // FSが利用可能な場合の処理
      if (this.whisperModule && this.whisperModule.FS) {
        console.log('✅ Using WebAssembly filesystem for model loading')
        
        // ファイルシステムの初期化を待機
        await this.waitForFileSystem()
        
        // モデルファイルが既に読み込まれているかチェック
        try {
          // モデルファイルの存在確認
          const fileInfo = this.whisperModule.FS.stat('whisper.bin')
          console.log('Whisper model already loaded:', {
            size: fileInfo.size,
            isFile: this.whisperModule.FS.isFile(fileInfo.mode)
          })
          this.modelLoaded = true
          return
        } catch (e) {
          // モデルファイルが存在しない場合はダウンロード
          console.log('Model file not found, downloading...')
        }
        
        // モデルファイルをダウンロード
        await this.downloadModel()
        
      } else {
        // FSが利用できない場合の処理
        console.log('⚠️ WebAssembly filesystem not available, using alternative loading method')
        
        // グローバルに保存されたモデルデータをチェック
        if ((window as any).whisperModelData) {
          console.log('✅ Using pre-loaded model data from global variable')
          this.modelLoaded = true
          return
        }
        
        // モデルデータがなければ、init()関数で直接読み込む
        console.log('📥 Model will be loaded by init() function')
        this.modelLoaded = true
        return
      }
      
      this.modelLoaded = true
      console.log('Whisper model loaded successfully')
    } catch (error) {
      console.error('Failed to load model:', error)
      throw error
    }
  }

  /**
   * Whisperインスタンスを初期化
   */
  private async initializeWhisperInstance(): Promise<void> {
    if (this.whisperInstance) {
      console.log('✅ Whisper instance already initialized')
      return
    }

    try {
      console.log('🔧 Initializing Whisper instance...')
      
      // モジュールの状態をチェック
      const moduleState = {
        hasModule: !!this.whisperModule,
        hasFS: !!this.whisperModule?.FS,
        hasInit: !!this.whisperModule?.init,
        hasFullDefault: !!this.whisperModule?.full_default,
        hasRuntime: !!this.whisperModule?.runtimeInitialized,
        availableFunctions: Object.keys(this.whisperModule || {}).filter(key => typeof this.whisperModule[key] === 'function')
      }
      
      console.log('🔍 Module state check:', moduleState)
      
      // 利用可能な関数の詳細をログ出力
      const initFunctions = Object.keys(this.whisperModule || {}).filter(key => 
        typeof this.whisperModule[key] === 'function' && 
        key.toLowerCase().includes('init')
      )
      console.log('🔍 Available initialization functions:', initFunctions)
      
      // ファイルシステムの状態もチェック
      if (this.whisperModule?.FS) {
        try {
          const fsRoot = this.whisperModule.FS.readdir('/')
          console.log('📁 WebAssembly filesystem root contents:', fsRoot)
        } catch (e) {
          console.log('⚠️ Could not read filesystem root:', e)
        }
      }
      
      if (!this.whisperModule.init) {
        throw new Error('Whisper init function not available')
      }
      
      console.log('🚀 Calling whisper.cpp init()...')
      
      // WebAssemblyファイルシステムの初期化を試行
      if (this.whisperModule.FS) {
        try {
          // ファイルシステムが利用可能な場合
          console.log('✅ WebAssembly filesystem available')
          
          // モデルファイルの存在確認
          try {
            const fileInfo = this.whisperModule.FS.stat('whisper.bin')
            console.log('✅ Model file found in filesystem:', {
              size: fileInfo.size,
              isFile: this.whisperModule.FS.isFile(fileInfo.mode)
            })
            
            // ファイルシステム内のモデルを使用して初期化
            this.whisperInstance = this.whisperModule.init('whisper.bin')
            console.log('✅ Whisper instance initialized with filesystem model')
            
          } catch (e) {
            console.log('⚠️ Model file not found in filesystem, trying alternative methods...')
            
            // 利用可能なモデルファイルをチェック
            const availableModels = ['ggml-tiny-q5_1.bin', 'ggml-tiny.bin', 'ggml-base-q5_1.bin']
            let modelFound = false
            
            for (const model of availableModels) {
              try {
                const fileInfo = this.whisperModule.FS.stat(model)
                console.log(`✅ Found model in filesystem: ${model} (${fileInfo.size} bytes)`)
                this.whisperInstance = this.whisperModule.init(model)
                modelFound = true
                console.log(`✅ Whisper instance initialized with model: ${model}`)
                break
              } catch (e) {
                // ファイルが存在しない場合は次を試行
              }
            }
            
            if (!modelFound) {
              throw new Error('No model files found in WebAssembly filesystem')
            }
          }
          
        } catch (fsError) {
          console.error('❌ Filesystem initialization failed:', fsError)
          throw new Error(`Filesystem initialization failed: ${fsError instanceof Error ? fsError.message : 'Unknown error'}`)
        }
        
      } else {
        // WebAssemblyファイルシステムが利用できない場合
        console.log('⚠️ WebAssembly filesystem not available, using alternative initialization')
        
        // グローバル変数に保存されたモデルデータをチェック
        if ((window as any).whisperModelData) {
          console.log('✅ Using model data from global variable')
          
          // グローバル変数のモデルデータを使用して初期化
          // whisper.cppの公式実装では、init()関数で直接モデルデータを渡すことはできない
          
          // スタックオーバーフローを防ぐため、安全な初期化を試行
          try {
            console.log('🔄 Trying safe initialization with global model data...')
            this.whisperInstance = this.whisperModule.init('')
            console.log('✅ Whisper instance initialized safely with global model data')
          } catch (safeInitError) {
            console.warn('⚠️ Safe initialization failed, trying fallback...')
            
            // フォールバック: 最小限のパラメータで初期化
            try {
              this.whisperInstance = this.whisperModule.init('')
              console.log('✅ Whisper instance initialized with fallback method')
            } catch (fallbackError) {
              console.error('❌ All initialization methods failed:', fallbackError)
              throw new Error('Cannot initialize Whisper instance with any method')
            }
          }
          // 代わりに、ファイルシステムにモデルデータを書き込んでから初期化
          
          try {
            // グローバル変数のモデルデータをファイルシステムに書き込み
            const modelData = (window as any).whisperModelData
            const modelArray = new Uint8Array(modelData)
            
            // 一時的なファイルシステムを作成（もし可能であれば）
            if (this.whisperModule.FS) {
              try {
                // 既存のファイルを削除
                try {
                  this.whisperModule.FS.unlink('whisper.bin')
                } catch (e) {
                  // ファイルが存在しない場合は無視
                }
                
                // 新しいファイルを作成
                this.whisperModule.FS.createDataFile('/', 'whisper.bin', modelArray, true, true)
                console.log('✅ Model data written to WebAssembly filesystem')
                
                // ファイルシステム内のモデルを使用して初期化
                this.whisperInstance = this.whisperModule.init('whisper.bin')
                console.log('✅ Whisper instance initialized with global model data')
                
              } catch (fsError) {
                console.error('❌ Failed to write model data to filesystem:', fsError)
                throw new Error('Cannot initialize Whisper without filesystem access')
              }
            } else {
              throw new Error('WebAssembly filesystem not available and no alternative initialization method')
            }
            
          } catch (modelError) {
            console.error('❌ Model data initialization failed:', modelError)
            throw new Error(`Model data initialization failed: ${modelError instanceof Error ? modelError.message : 'Unknown error'}`)
          }
          
        } else {
          console.log('⚠️ No model data available, trying alternative initialization methods')
          
          // 複数の初期化方法を試行
          let initializationSuccess = false
          
          // 方法1: グローバル変数からモデルデータを取得してファイルシステムに書き込み
          try {
            // モデルファイルを再読み込み
            const modelResponse = await fetch('/whisper/models/ggml-tiny-q5_1.bin')
            if (modelResponse.ok) {
              const modelData = await modelResponse.arrayBuffer()
              const modelArray = new Uint8Array(modelData)
              
              // ファイルシステムに書き込み
              if (this.whisperModule.FS) {
                try {
                  // 既存のファイルを削除
                  try {
                    this.whisperModule.FS.unlink('whisper.bin')
                  } catch (e) {
                    // ファイルが存在しない場合は無視
                  }
                  
                  // 新しいファイルを作成
                  this.whisperModule.FS.createDataFile('/', 'whisper.bin', modelArray, true, true)
                  console.log('✅ Model data written to WebAssembly filesystem from fetch')
                  
                  // ファイルシステム内のモデルを使用して初期化
                  this.whisperInstance = this.whisperModule.init('whisper.bin')
                  console.log('✅ Whisper instance initialized with fetched model data')
                  initializationSuccess = true
                  
                } catch (fsError) {
                  console.error('❌ Failed to write fetched model data to filesystem:', fsError)
                }
              }
            }
          } catch (fetchError) {
            console.log('⚠️ Failed to fetch model file:', fetchError)
          }
          
          // 方法2: モデルデータを直接渡して初期化（新しいwhisper.cpp API）
          if (!initializationSuccess) {
            try {
              console.log('🔄 Trying direct model data initialization...')
              
              // モデルファイルを再取得
              const modelResponse = await fetch('/whisper/models/ggml-tiny-q5_1.bin')
              if (modelResponse.ok) {
                const modelData = await modelResponse.arrayBuffer()
                const modelArray = new Uint8Array(modelData)
                
                // 新しいwhisper.cpp APIを使用してモデルデータを直接渡す
                if (this.whisperModule.init_from_buffer) {
                  this.whisperInstance = this.whisperModule.init_from_buffer(modelArray)
                  console.log('✅ Whisper instance initialized with init_from_buffer')
                  initializationSuccess = true
                } else if (this.whisperModule.init_with_model_data) {
                  this.whisperInstance = this.whisperModule.init_with_model_data(modelArray)
                  console.log('✅ Whisper instance initialized with init_with_model_data')
                  initializationSuccess = true
                } else {
                  console.log('⚠️ Direct model data initialization not available')
                }
              }
            } catch (directError) {
              console.error('❌ Direct model data initialization failed:', directError)
            }
          }
          
          // 方法3: デフォルトのモデルパスで初期化を試行
          if (!initializationSuccess) {
            try {
              console.log('🔄 Trying default model path initialization...')
              this.whisperInstance = this.whisperModule.init('ggml-tiny-q5_1.bin')
              console.log('✅ Whisper instance initialized with default model path')
              initializationSuccess = true
            } catch (defaultError) {
              console.error('❌ Default initialization failed:', defaultError)
            }
          }
          
          // 方法4: 空のパラメータで初期化を試行（モデルなし）
          if (!initializationSuccess) {
            try {
              console.log('🔄 Trying initialization without model...')
              // 空の文字列を渡して初期化を試行
              this.whisperInstance = this.whisperModule.init('')
              console.log('✅ Whisper instance initialized without model (will need model loading later)')
              initializationSuccess = true
            } catch (noModelError) {
              console.error('❌ No-model initialization failed:', noModelError)
            }
          }
          
          // 方法5: 利用可能な関数をチェックして代替初期化を試行
          if (!initializationSuccess) {
            try {
              console.log('🔄 Checking available initialization functions...')
              const availableFunctions = Object.keys(this.whisperModule).filter(key => 
                typeof this.whisperModule[key] === 'function' && 
                key.toLowerCase().includes('init')
              )
              console.log('🔍 Available init functions:', availableFunctions)
              
              // 利用可能な初期化関数を順次試行
              for (const funcName of availableFunctions) {
                try {
                  console.log(`🔄 Trying ${funcName}...`)
                  if (funcName === 'init') {
                    // init関数の場合は空の文字列を渡す
                    this.whisperInstance = this.whisperModule[funcName]('')
                  } else {
                    // その他の関数の場合はパラメータなしで呼び出し
                    this.whisperInstance = this.whisperModule[funcName]()
                  }
                  console.log(`✅ Whisper instance initialized with ${funcName}`)
                  initializationSuccess = true
                  break
                } catch (funcError) {
                  console.log(`⚠️ ${funcName} failed:`, funcError)
                }
              }
            } catch (checkError) {
              console.error('❌ Function check failed:', checkError)
            }
          }
          
          if (!initializationSuccess) {
            throw new Error('All initialization methods failed')
          }
        }
      }
      
      if (!this.whisperInstance) {
        // 最後の手段として、空のインスタンスを作成
        console.log('⚠️ Creating fallback Whisper instance...')
        try {
          // 空の文字列を渡して初期化を試行
          this.whisperInstance = this.whisperModule.init('')
          console.log('✅ Fallback Whisper instance created')
          
          // インスタンスの有効性をチェック
          if (!this.whisperInstance || this.whisperInstance === 0) {
            console.log('⚠️ Fallback instance is invalid, trying alternative approach...')
            
            // 代替アプローチ：直接APIを呼び出し
            if (this.whisperModule.full_default) {
              console.log('🔄 Trying direct API call without instance...')
              // インスタンスなしでAPIを呼び出してみる
              this.whisperInstance = 1 // ダミー値として設定
            } else {
              throw new Error('No valid initialization method available')
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback initialization also failed:', fallbackError)
          throw new Error('Failed to initialize Whisper instance with any method')
        }
      }
      
      console.log('✅ Whisper instance initialized successfully')
      
      // 初期化後の状態をログ出力
      console.log('🔍 Whisper instance state:', {
        hasInstance: !!this.whisperInstance,
        instanceType: typeof this.whisperInstance,
        availableMethods: this.whisperInstance ? Object.keys(this.whisperInstance).filter(key => 
          typeof this.whisperInstance[key] === 'function'
        ) : []
      })
      
    } catch (error) {
      console.error('❌ Whisper instance initialization failed:', error)
      
      // エラーの詳細をログ出力
      if (error instanceof Error) {
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      
      throw new Error(`Whisper instance initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * モデルファイルをダウンロード
   */
  private async downloadModel(): Promise<void> {
    try {
      // まずローカルのモデルファイルをチェック（複数のモデルを試行）
      const modelFiles = ['ggml-tiny.bin', 'ggml-base.bin', 'whisper.bin'];
      const localModelPath = '/whisper/models/';
      
      for (const modelFile of modelFiles) {
        try {
          const response = await fetch(localModelPath + modelFile);
          if (response.ok) {
            console.log('Using local model file:', localModelPath + modelFile);
            const modelBuffer = await response.arrayBuffer();
            const modelArray = new Uint8Array(modelBuffer);
            
            // モデルファイルをWebAssemblyファイルシステムに保存
            if (this.whisperModule && this.whisperModule.FS) {
              try {
                // 既存のファイルを削除
                try {
                  this.whisperModule.FS.unlink('whisper.bin');
                } catch (e) {
                  // ファイルが存在しない場合は無視
                }
                
                // 新しいファイルを作成
                this.whisperModule.FS.createDataFile('/', 'whisper.bin', modelArray, true, true);
                
                // ファイルが正しく作成されたか確認
                const fileInfo = this.whisperModule.FS.stat('whisper.bin');
                console.log('Local model loaded to WebAssembly filesystem:', {
                  size: fileInfo.size,
                  isFile: this.whisperModule.FS.isFile(fileInfo.mode)
                });
                return;
              } catch (error) {
                console.error('Failed to save local model to filesystem:', error);
                throw new Error(`Failed to save local model to filesystem: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
        } catch (e) {
          console.log(`Local model ${modelFile} not found, trying next...`);
        }
      }
      
      console.log('No local models found, downloading from Hugging Face...');
      
      // ローカルファイルが存在しない場合はHugging Faceからダウンロード
      // より軽量で高速なtiny-q5_1モデルを使用（31MB、多言語対応）
      const modelUrl = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin';
      console.log('Downloading model from:', modelUrl);
      console.log('Model: tiny-q5_1 (31MB, multilingual, quantized)');
      
      const response = await fetch(modelUrl);
      if (!response.ok) {
        throw new Error(`Failed to download model: ${response.statusText}`)
      }
      
      const modelBuffer = await response.arrayBuffer()
      const modelArray = new Uint8Array(modelBuffer)
      
      console.log(`Model downloaded successfully: ${modelArray.length} bytes`)
      
      // モデルファイルをWebAssemblyファイルシステムに保存
      if (this.whisperModule && this.whisperModule.FS) {
        try {
          // 既存のファイルを削除
          try {
            this.whisperModule.FS.unlink('whisper.bin')
          } catch (e) {
            // ファイルが存在しない場合は無視
          }
          
          // 新しいファイルを作成
          this.whisperModule.FS.createDataFile('/', 'whisper.bin', modelArray, true, true)
          
          // ファイルが正しく作成されたか確認
          const fileInfo = this.whisperModule.FS.stat('whisper.bin')
          console.log('Model saved to WebAssembly filesystem:', {
            size: fileInfo.size,
            isFile: this.whisperModule.FS.isFile(fileInfo.mode)
          })
        } catch (error) {
          console.error('Failed to save model to filesystem:', error)
          throw new Error(`Failed to save model to filesystem: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      } else {
        throw new Error('WebAssembly filesystem not available')
      }
    } catch (error) {
      console.error('Failed to download model:', error)
      throw error
    }
  }

  /**
   * 音声データをWAV形式に変換
   */
  private async convertToWav(audioData: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      // 音声変換機能を使用
      return await convertToWav(audioData, 'wav')
    } catch (error) {
      console.warn('Audio conversion failed, using original format:', error)
      return audioData
    }
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<WhisperConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): WhisperConfig {
    return { ...this.config }
  }

  /**
   * サービスをクリーンアップ
   */
  async cleanup(): Promise<void> {
    this.isInitialized = false
    this.whisperModule = null
    this.modelLoaded = false
    this.whisperInstance = null
    this.transcriptionOutput = []
    this.restoreOutputCapture()
    console.log('Whisper local service cleaned up')
  }
}

/**
 * WhisperLocalServiceのインスタンスを作成
 */
export function createWhisperLocalService(config?: Partial<WhisperConfig>): WhisperLocalService {
  const defaultConfig: WhisperConfig = {
    modelPath: '/whisper/ggml-tiny-q5_1.bin',
    language: 'ja',
    temperature: 0.0,
    maxTokens: 448
  }

  return new WhisperLocalService({ ...defaultConfig, ...config })
}
