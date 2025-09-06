import { GptOssTextExtractionChain } from './gpt-oss-text-extraction-chain'
import { GptOssTextExtractionAgent } from './gpt-oss-text-extraction-agent'
import { TTSRequestAnalyzer } from './tts-request-analyzer'

export interface GptOssBackendConfig {
  modelPath: string
  temperature?: number
  maxTokens?: number
  contextSize?: number
  threads?: number
  gpuLayers?: number
  verbose?: boolean
  maxIterations?: number
  reasoningLevel?: 'low' | 'medium' | 'high'
}

export interface BackendExtractionRequest {
  text: string
  useAgent?: boolean
  batchMode?: boolean
  reasoningLevel?: 'low' | 'medium' | 'high'
}

export interface BackendExtractionResponse {
  success: boolean
  data?: any
  error?: string
  executionTime: number
  modelInfo?: {
    modelPath: string
    isInitialized: boolean
    reasoningLevel: string
    modelType: string
  }
}

export class GptOssBackendService {
  private extractionChain: GptOssTextExtractionChain | null = null
  private extractionAgent: GptOssTextExtractionAgent | null = null
  private ttsRequestAnalyzer: TTSRequestAnalyzer | null = null
  private config: GptOssBackendConfig
  private isInitialized = false

  constructor(config: GptOssBackendConfig) {
    this.config = {
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 8192, // gpt-oss-20bは長いコンテキストをサポート
      threads: 4,
      gpuLayers: 0,
      verbose: false,
      maxIterations: 3,
      reasoningLevel: 'medium',
      ...config
    }
  }

  /**
   * サービスを初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Node.js環境チェック
      if (typeof window !== 'undefined') {
        throw new Error('GptOssBackendService is only available in Node.js environment')
      }

      console.log('🚀 Initializing GptOss Backend Service...')

      // TextExtractionChainを初期化
      this.extractionChain = new GptOssTextExtractionChain({
        modelPath: this.config.modelPath,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        contextSize: this.config.contextSize,
        threads: this.config.threads,
        gpuLayers: this.config.gpuLayers,
        verbose: this.config.verbose,
        reasoningLevel: this.config.reasoningLevel
      })

      // TextExtractionAgentを初期化
      this.extractionAgent = new GptOssTextExtractionAgent({
        modelPath: this.config.modelPath,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        contextSize: this.config.contextSize,
        threads: this.config.threads,
        gpuLayers: this.config.gpuLayers,
        verbose: this.config.verbose,
        maxIterations: this.config.maxIterations,
        reasoningLevel: this.config.reasoningLevel
      })

      // TTSRequestAnalyzerを初期化（gpt-oss設定）
      this.ttsRequestAnalyzer = new TTSRequestAnalyzer({
        useGptOss: true,
        gptOssConfig: {
          modelPath: this.config.modelPath,
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
          contextSize: this.config.contextSize,
          threads: this.config.threads,
          gpuLayers: this.config.gpuLayers,
          verbose: this.config.verbose,
          reasoningLevel: this.config.reasoningLevel
        }
      })

      // 各サービスを初期化
      await this.extractionChain.initialize()
      await this.extractionAgent.initialize()

      this.isInitialized = true
      console.log('✅ GptOss Backend Service initialized successfully')

    } catch (error) {
      console.error('❌ Failed to initialize GptOss Backend Service:', error)
      throw error
    }
  }

  /**
   * 本文抽出を実行
   */
  async extractText(request: BackendExtractionRequest): Promise<BackendExtractionResponse> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()

    try {
      let data: any

      // 推論レベルが指定されている場合は更新
      if (request.reasoningLevel) {
        this.extractionChain?.updateReasoningLevel(request.reasoningLevel)
        this.extractionAgent?.updateReasoningLevel(request.reasoningLevel)
      }

      if (request.useAgent && this.extractionAgent) {
        // Agentを使用した処理
        data = await this.extractionAgent.processText(request.text)
      } else if (this.extractionChain) {
        // Chainを使用した処理
        if (request.batchMode) {
          // バッチ処理
          data = await this.extractionChain.extractBatch([request.text])
        } else {
          // 単一テキスト処理
          data = await this.extractionChain.extractMainText(request.text)
        }
      } else {
        throw new Error('No extraction service available')
      }

      const executionTime = Date.now() - startTime

      return {
        success: true,
        data,
        executionTime,
        modelInfo: this.extractionChain?.getModelInfo()
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('Text extraction failed:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        modelInfo: this.extractionChain?.getModelInfo()
      }
    }
  }

  /**
   * TTSリクエスト分析を実行
   */
  async analyzeTTSRequest(text: string): Promise<BackendExtractionResponse> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()

    try {
      if (!this.ttsRequestAnalyzer) {
        throw new Error('TTSRequestAnalyzer not available')
      }

      const analysis = await this.ttsRequestAnalyzer.analyzeTTSRequest(text)
      const executionTime = Date.now() - startTime

      return {
        success: true,
        data: analysis,
        executionTime,
        modelInfo: this.extractionChain?.getModelInfo()
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('TTS request analysis failed:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        modelInfo: this.extractionChain?.getModelInfo()
      }
    }
  }

  /**
   * バッチ処理を実行
   */
  async extractBatch(texts: string[]): Promise<BackendExtractionResponse> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()

    try {
      if (!this.extractionChain) {
        throw new Error('ExtractionChain not available')
      }

      const results = await this.extractionChain.extractBatch(texts)
      const executionTime = Date.now() - startTime

      return {
        success: true,
        data: results,
        executionTime,
        modelInfo: this.extractionChain.getModelInfo()
      }

    } catch (error) {
      const executionTime = Date.now() - startTime
      console.error('Batch extraction failed:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
        modelInfo: this.extractionChain?.getModelInfo()
      }
    }
  }

  /**
   * 推論レベルを更新
   */
  updateReasoningLevel(reasoningLevel: 'low' | 'medium' | 'high'): void {
    this.config.reasoningLevel = reasoningLevel
    this.extractionChain?.updateReasoningLevel(reasoningLevel)
    this.extractionAgent?.updateReasoningLevel(reasoningLevel)
  }

  /**
   * サービス状態を取得
   */
  getStatus(): {
    isInitialized: boolean
    modelInfo?: { 
      modelPath: string
      isInitialized: boolean
      reasoningLevel: string
      modelType: string
    }
    services: {
      extractionChain: boolean
      extractionAgent: boolean
      ttsRequestAnalyzer: boolean
    }
  } {
    return {
      isInitialized: this.isInitialized,
      modelInfo: this.extractionChain?.getModelInfo(),
      services: {
        extractionChain: this.extractionChain?.isAvailable() || false,
        extractionAgent: this.extractionAgent?.isAvailable() || false,
        ttsRequestAnalyzer: this.ttsRequestAnalyzer !== null
      }
    }
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<GptOssBackendConfig>): void {
    this.config = { ...this.config, ...config }
    this.isInitialized = false // 再初期化が必要
  }

  /**
   * サービスをクリーンアップ
   */
  async cleanup(): Promise<void> {
    try {
      // 必要に応じてリソースをクリーンアップ
      this.extractionChain = null
      this.extractionAgent = null
      this.ttsRequestAnalyzer = null
      this.isInitialized = false
      console.log('✅ GptOss Backend Service cleaned up')
    } catch (error) {
      console.error('❌ Cleanup failed:', error)
    }
  }
}

export function createGptOssBackendService(config: GptOssBackendConfig): GptOssBackendService {
  return new GptOssBackendService(config)
}
