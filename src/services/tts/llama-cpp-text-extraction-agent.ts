import { 
  AgentExecutor,
  createStructuredChatAgent,
  type AgentArgs,
  type AgentExecutorInput
} from 'langchain/agents'
import { ChatLlamaCpp } from '@langchain/community/chat_models/llama_cpp'
import { Tool } from '@langchain/core/tools'
import { PromptTemplate } from '@langchain/core/prompts'
import { LlamaCppTextExtractionChain, type LlamaCppTextExtractionConfig } from './llama-cpp-text-extraction-chain'
import { TTSManager } from './tts-manager'

export interface LlamaCppTextExtractionAgentConfig {
  modelPath: string
  temperature?: number
  maxTokens?: number
  contextSize?: number
  threads?: number
  gpuLayers?: number
  verbose?: boolean
  maxIterations?: number
}

export interface ExtractionAgentResult {
  extractedText: string
  confidence: number
  reasoning: string
  ttsResult?: any
  executionTime: number
  modelInfo?: {
    modelPath: string
    isInitialized: boolean
  }
}

export class LlamaCppTextExtractionAgent {
  private agent: AgentExecutor | null = null
  private config: LlamaCppTextExtractionAgentConfig
  private extractionChain: LlamaCppTextExtractionChain
  private ttsManager: TTSManager
  private isInitialized = false

  constructor(config: LlamaCppTextExtractionAgentConfig) {
    this.config = {
      temperature: 0.1,
      maxTokens: 2048,
      contextSize: 4096,
      threads: 4,
      gpuLayers: 0,
      verbose: false,
      maxIterations: 3,
      ...config
    }
    
    this.extractionChain = new LlamaCppTextExtractionChain({
      modelPath: this.config.modelPath,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      contextSize: this.config.contextSize,
      threads: this.config.threads,
      gpuLayers: this.config.gpuLayers,
      verbose: this.config.verbose
    })
    
    this.ttsManager = new TTSManager()
  }

  /**
   * エージェントを初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Node.js環境チェック
      if (typeof window !== 'undefined') {
        throw new Error('LlamaCppTextExtractionAgent is only available in Node.js environment')
      }

      await this.extractionChain.initialize()
      await this.ttsManager.initialize()
      this.agent = await this.createAgent()
      this.isInitialized = true
      console.log('LlamaCpp Text Extraction Agent initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LlamaCpp Text Extraction Agent:', error)
      throw error
    }
  }

  /**
   * LLMを作成
   */
  private async createLLM() {
    // Node.js環境チェック
    if (typeof window !== 'undefined') {
      throw new Error('LlamaCpp is only available in Node.js environment')
    }

    // モデルファイルの存在確認
    const fs = await import('fs')
    if (!fs.existsSync(this.config.modelPath)) {
      throw new Error(`Model file not found at ${this.config.modelPath}`)
    }

    return await ChatLlamaCpp.initialize({
      modelPath: this.config.modelPath,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
      contextSize: this.config.contextSize,
      threads: this.config.threads,
      gpuLayers: this.config.gpuLayers,
    })
  }

  /**
   * ツールを作成
   */
  private createTools(): Tool[] {
    return [
      new Tool({
        name: 'extract_main_text',
        description: '入力テキストからTTSに渡すべき本文部分を抽出します。指示文や説明文を除いて、音声化すべき主要なコンテンツのみを返します。',
        func: async (input: string) => {
          try {
            const result = await this.extractionChain.extractMainText(input)
            return JSON.stringify({
              mainText: result.mainText,
              confidence: result.confidence,
              reasoning: result.reasoning,
              hasInstructions: result.hasInstructions,
              instructionType: result.instructionType
            })
          } catch (error) {
            return `Error extracting text: ${error}`
          }
        }
      }),
      new Tool({
        name: 'generate_tts',
        description: '抽出された本文をTTSで音声化します。',
        func: async (input: string) => {
          try {
            // JSON文字列から本文を抽出
            let textToTTS = input
            try {
              const parsed = JSON.parse(input)
              textToTTS = parsed.mainText || input
            } catch {
              // JSONでない場合はそのまま使用
            }

            const ttsResult = await this.ttsManager.generateSpeech({
              text: textToTTS,
              voice: 'default',
              speed: 1.0
            })

            return JSON.stringify({
              success: true,
              audioUrl: ttsResult.audioUrl,
              duration: ttsResult.duration,
              text: textToTTS
            })
          } catch (error) {
            return `Error generating TTS: ${error}`
          }
        }
      })
    ]
  }

  /**
   * エージェントを作成
   */
  private async createAgent(): Promise<AgentExecutor> {
    const llm = await this.createLLM()
    const tools = this.createTools()

    const prompt = PromptTemplate.fromTemplate(`
あなたはテキスト処理とTTS（Text-to-Speech）生成の専門エージェントです。

ユーザーの入力に対して以下の手順で処理を行ってください：

1. **本文抽出**: extract_main_textツールを使用して、入力テキストからTTSに渡すべき本文部分を抽出
2. **TTS生成**: 抽出された本文をgenerate_ttsツールを使用して音声化

**処理ルール:**
- 入力に指示文や説明文が含まれている場合、それらを除いて本文のみを抽出
- 抽出された本文が空でないことを確認してからTTS処理を実行
- エラーが発生した場合は適切なエラーメッセージを返す

**利用可能なツール:**
{tools}

**入力:**
{input}

**思考プロセス:**
{agent_scratchpad}
`)

    const agent = await createStructuredChatAgent({
      llm,
      tools,
      prompt
    })

    return new AgentExecutor({
      agent,
      tools,
      maxIterations: this.config.maxIterations,
      verbose: this.config.verbose
    })
  }

  /**
   * テキストを処理（本文抽出 + TTS生成）
   */
  async processText(inputText: string): Promise<ExtractionAgentResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()

    try {
      // まず本文抽出を実行
      const extractionResult = await this.extractionChain.extractMainText(inputText)
      
      // TTS生成を実行
      let ttsResult = null
      if (extractionResult.mainText && extractionResult.mainText.trim()) {
        ttsResult = await this.ttsManager.generateSpeech({
          text: extractionResult.mainText,
          voice: 'default',
          speed: 1.0
        })
      }

      const executionTime = Date.now() - startTime

      return {
        extractedText: extractionResult.mainText,
        confidence: extractionResult.confidence,
        reasoning: extractionResult.reasoning,
        ttsResult,
        executionTime,
        modelInfo: this.extractionChain.getModelInfo()
      }

    } catch (error) {
      console.error('Text processing failed:', error)
      const executionTime = Date.now() - startTime
      
      return {
        extractedText: inputText,
        confidence: 0.0,
        reasoning: `処理中にエラーが発生しました: ${error}`,
        executionTime,
        modelInfo: this.extractionChain.getModelInfo()
      }
    }
  }

  /**
   * エージェントを使用した処理（より高度な制御）
   */
  async processWithAgent(inputText: string): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.agent) {
      throw new Error('Agent not initialized')
    }

    try {
      const result = await this.agent.invoke({
        input: `以下のテキストを処理してください：${inputText}`
      })

      return result
    } catch (error) {
      console.error('Agent processing failed:', error)
      throw error
    }
  }

  /**
   * バッチ処理
   */
  async processBatch(texts: string[]): Promise<ExtractionAgentResult[]> {
    const results: ExtractionAgentResult[] = []
    
    for (const text of texts) {
      const result = await this.processText(text)
      results.push(result)
    }
    
    return results
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<LlamaCppTextExtractionAgentConfig>) {
    this.config = { ...this.config, ...config }
    this.isInitialized = false // 再初期化が必要
  }

  /**
   * 利用可能かどうかを確認
   */
  isAvailable(): boolean {
    return this.isInitialized && this.extractionChain.isAvailable()
  }

  /**
   * モデル情報を取得
   */
  getModelInfo(): { modelPath: string; isInitialized: boolean } {
    return this.extractionChain.getModelInfo()
  }
}

export function createLlamaCppTextExtractionAgent(config: LlamaCppTextExtractionAgentConfig): LlamaCppTextExtractionAgent {
  return new LlamaCppTextExtractionAgent(config)
}
