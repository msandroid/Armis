import { 
  AgentExecutor,
  createStructuredChatAgent,
  type AgentArgs,
  type AgentExecutorInput
} from 'langchain/agents'
import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { Tool } from '@langchain/core/tools'
import { PromptTemplate } from '@langchain/core/prompts'
import { TextExtractionChain, type TextExtractionConfig } from './text-extraction-chain'
import { TTSManager } from './tts-manager'

export interface TextExtractionAgentConfig {
  modelType: 'openai' | 'anthropic' | 'google'
  modelName?: string
  temperature?: number
  apiKey?: string
  maxIterations?: number
  verbose?: boolean
}

export interface ExtractionAgentResult {
  extractedText: string
  confidence: number
  reasoning: string
  ttsResult?: any
  executionTime: number
}

export class TextExtractionAgent {
  private agent: AgentExecutor
  private config: TextExtractionAgentConfig
  private extractionChain: TextExtractionChain
  private ttsManager: TTSManager
  private isInitialized = false

  constructor(config: TextExtractionAgentConfig) {
    this.config = {
      modelType: 'openai',
      modelName: 'gpt-3.5-turbo',
      temperature: 0.1,
      maxIterations: 3,
      verbose: false,
      ...config
    }
    
    this.extractionChain = new TextExtractionChain({
      modelType: this.config.modelType,
      modelName: this.config.modelName,
      temperature: this.config.temperature,
      apiKey: this.config.apiKey
    })
    
    this.ttsManager = new TTSManager()
  }

  /**
   * エージェントを初期化
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.extractionChain.initialize()
      await this.ttsManager.initialize()
      this.agent = await this.createAgent()
      this.isInitialized = true
      console.log('Text Extraction Agent initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Text Extraction Agent:', error)
      throw error
    }
  }

  /**
   * LLMを作成
   */
  private createLLM() {
    if (!this.config.apiKey) {
      throw new Error('API key is required for Text Extraction Agent')
    }

    switch (this.config.modelType) {
      case 'openai':
        return new ChatOpenAI({
          modelName: this.config.modelName || 'gpt-3.5-turbo',
          temperature: this.config.temperature || 0.1,
          openAIApiKey: this.config.apiKey,
        })
      case 'anthropic':
        return new ChatAnthropic({
          modelName: this.config.modelName || 'claude-3-sonnet-20240229',
          temperature: this.config.temperature || 0.1,
          anthropicApiKey: this.config.apiKey,
        })
      case 'google':
        return new ChatGoogleGenerativeAI({
          model: this.config.modelName || 'gemini-pro',
          temperature: this.config.temperature || 0.1,
          googleApiKey: this.config.apiKey,
        })
      default:
        throw new Error(`Unsupported model type: ${this.config.modelType}`)
    }
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
    const llm = this.createLLM()
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
        executionTime
      }

    } catch (error) {
      console.error('Text processing failed:', error)
      const executionTime = Date.now() - startTime
      
      return {
        extractedText: inputText,
        confidence: 0.0,
        reasoning: `処理中にエラーが発生しました: ${error}`,
        executionTime
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
  updateConfig(config: Partial<TextExtractionAgentConfig>) {
    this.config = { ...this.config, ...config }
    this.isInitialized = false // 再初期化が必要
  }

  /**
   * 利用可能かどうかを確認
   */
  isAvailable(): boolean {
    return this.isInitialized && this.extractionChain.isAvailable()
  }
}

export function createTextExtractionAgent(config: TextExtractionAgentConfig): TextExtractionAgent {
  return new TextExtractionAgent(config)
}
