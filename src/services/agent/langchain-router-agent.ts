import { 
  ChatOpenAI,
  OpenAI
} from '@langchain/openai'
import { 
  PromptTemplate 
} from '@langchain/core/prompts'
import { 
  LLMRouterChain,
  RouterChain,
  MultiPromptChain
} from 'langchain/chains'
import { LlamaService } from '@/services/llm/llama-service'
import { InputClassifier, ClassificationResult } from './input-classifier'
import { AgentType, AgentResponse } from '@/types/llm'
import { v4 as uuidv4 } from 'uuid'

export interface LangChainRouterConfig {
  enableCasualFilter: boolean
  confidenceThreshold: number
  enableFallback: boolean
  defaultAgent: AgentType
  maxRetries: number
  timeout: number
}

export interface RouterDestination {
  name: string
  description: string
  promptTemplate: string
  agentType: AgentType
}

export class LangChainRouterAgent {
  private llmService: LlamaService
  private inputClassifier: InputClassifier
  private config: LangChainRouterConfig
  private routerChain: RouterChain | null = null
  private multiPromptChain: MultiPromptChain | null = null
  private destinations: RouterDestination[] = []
  private isInitialized = false

  constructor(
    llmService: LlamaService,
    config: LangChainRouterConfig
  ) {
    this.llmService = llmService
    this.config = config
    this.inputClassifier = new InputClassifier()
  }

  /**
   * ルーターエージェントを初期化
   */
  async initialize(): Promise<void> {
    try {
      // LangChain LLMの初期化
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-3.5-turbo',
        temperature: 0
      })

      // デフォルトのエージェント設定
      this.destinations = [
        {
          name: 'general',
          description: '一般的な会話や質問に対応',
          promptTemplate: 'あなたは親切で役立つアシスタントです。ユーザーの質問や要求に丁寧に答えてください。',
          agentType: 'general'
        },
        {
          name: 'code_assistant',
          description: 'プログラミングやコード関連のタスクを処理',
          promptTemplate: 'あなたは経験豊富なプログラマーです。コードの作成、修正、デバッグ、最適化を支援します。',
          agentType: 'code_assistant'
        },
        {
          name: 'file_processor',
          description: 'ファイル処理やデータ変換タスクを処理',
          promptTemplate: 'あなたはファイル処理の専門家です。ファイルの解析、変換、処理を支援します。',
          agentType: 'file_processor'
        },
        {
          name: 'data_analyzer',
          description: 'データ分析や統計処理タスクを処理',
          promptTemplate: 'あなたはデータ分析の専門家です。データの分析、可視化、統計処理を支援します。',
          agentType: 'data_analyzer'
        },
        {
          name: 'creative_writer',
          description: '文章作成やコンテンツ生成タスクを処理',
          promptTemplate: 'あなたは創造的なライターです。文章作成、コンテンツ生成、ストーリーテリングを支援します。',
          agentType: 'creative_writer'
        }
      ]

      // シンプルなルーティングロジックを使用
      // LangChain.jsの最新バージョンでは、RouterChainの実装が変更されているため、
      // カスタムルーティングロジックを使用
      console.log('Using custom routing logic instead of LangChain RouterChain')

      this.isInitialized = true
      console.log('LangChain Router Agent initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LangChain Router Agent:', error)
      throw error
    }
  }

  /**
   * カスタムエージェントを追加
   */
  addDestination(destination: RouterDestination): void {
    this.destinations.push(destination)
    console.log(`Added destination: ${destination.name} (${destination.agentType})`)
  }

  /**
   * メインのルーティング処理
   */
  async routeAndExecute(
    userInput: string, 
    context?: Record<string, any>
  ): Promise<AgentResponse> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()
    const requestId = uuidv4()

    try {
      // Step 1: 入力分類による雑談フィルター
      if (this.config.enableCasualFilter) {
        const classification = this.inputClassifier.classifyInput(userInput, context)
        
        // 雑談や挨拶の場合は通常のLLMで処理
        if (!classification.shouldRouteToAgent) {
          return await this.handleCasualInput(userInput, classification, context, startTime)
        }
      }

      // Step 2: LangChain RouterChainを使用したルーティング
      const routingResult = await this.routeWithLangChain(userInput, context)

      // Step 3: 選択されたエージェントで実行
      const response = await this.executeWithSelectedAgent(
        routingResult.selectedAgent,
        userInput,
        context,
        routingResult
      )

      return {
        ...response,
        executionTime: Date.now() - startTime,
        metadata: {
          ...response.metadata,
          routingMethod: 'langchain_router',
          confidence: routingResult.confidence,
          reasoning: routingResult.reasoning
        }
      }

    } catch (error) {
      console.error('Routing error:', error)
      
      // フォールバック処理
      if (this.config.enableFallback) {
        return await this.handleFallback(userInput, context, error, startTime)
      }
      
      throw error
    }
  }

  /**
   * カスタムルーティングロジック
   */
  private async routeWithLangChain(
    userInput: string,
    context?: Record<string, any>
  ): Promise<{
    selectedAgent: AgentType
    confidence: number
    reasoning: string
    destination: string
  }> {
    try {
      // 入力分類をベースにしたルーティング
      const classification = this.inputClassifier.classifyInput(userInput, context)
      
      // タスク要求の場合は、キーワードベースでエージェントを選択
      if (classification.category === 'task_request' && classification.suggestedAgent) {
        const selectedDestination = this.destinations.find(d => d.agentType === classification.suggestedAgent)
        
        if (selectedDestination) {
          return {
            selectedAgent: selectedDestination.agentType,
            confidence: classification.confidence,
            reasoning: `Task-based routing: ${classification.reasoning}`,
            destination: selectedDestination.name
          }
        }
      }
      
      // 質問の場合は、一般的なエージェントを使用
      if (classification.category === 'question') {
        const generalDestination = this.destinations.find(d => d.name === 'general')
        
        if (generalDestination) {
          return {
            selectedAgent: generalDestination.agentType,
            confidence: classification.confidence,
            reasoning: `Question routing: ${classification.reasoning}`,
            destination: generalDestination.name
          }
        }
      }
      
      // コマンドの場合は、適切なエージェントを選択
      if (classification.category === 'command') {
        // コマンドの内容に基づいてエージェントを選択
        const lowerInput = userInput.toLowerCase()
        
        if (lowerInput.includes('code') || lowerInput.includes('refactor') || lowerInput.includes('debug')) {
          const codeDestination = this.destinations.find(d => d.name === 'code_assistant')
          if (codeDestination) {
            return {
              selectedAgent: codeDestination.agentType,
              confidence: 0.8,
              reasoning: 'Command routing: Code-related command detected',
              destination: codeDestination.name
            }
          }
        }
        
        if (lowerInput.includes('file') || lowerInput.includes('process') || lowerInput.includes('upload')) {
          const fileDestination = this.destinations.find(d => d.name === 'file_processor')
          if (fileDestination) {
            return {
              selectedAgent: fileDestination.agentType,
              confidence: 0.8,
              reasoning: 'Command routing: File-related command detected',
              destination: fileDestination.name
            }
          }
        }
      }
      
      // デフォルト: 一般的なエージェント
      const generalDestination = this.destinations.find(d => d.name === 'general')
      
      return {
        selectedAgent: generalDestination?.agentType || this.config.defaultAgent,
        confidence: classification.confidence,
        reasoning: `Default routing: ${classification.reasoning}`,
        destination: generalDestination?.name || 'general'
      }

    } catch (error) {
      console.warn('Custom routing failed, using fallback:', error)
      
      // フォールバック: 入力分類を使用
      const classification = this.inputClassifier.classifyInput(userInput, context)
      
      return {
        selectedAgent: classification.suggestedAgent || this.config.defaultAgent,
        confidence: classification.confidence,
        reasoning: `Fallback to input classification: ${classification.reasoning}`,
        destination: 'fallback'
      }
    }
  }

  /**
   * 選択されたエージェントで実行
   */
  private async executeWithSelectedAgent(
    agentType: AgentType,
    userInput: string,
    context?: Record<string, any>,
    routingResult?: any
  ): Promise<AgentResponse> {
    try {
      // 通常のLLMサービスを使用して実行
      const response = await this.llmService.generateResponse(userInput)
      
      return {
        agentType,
        content: response.text,
        metadata: {
          routingResult,
          context,
          success: true
        },
        executionTime: 0,
        success: true
      }

    } catch (error) {
      throw new Error(`Failed to execute agent ${agentType}: ${error}`)
    }
  }

  /**
   * 雑談や挨拶の処理
   */
  private async handleCasualInput(
    userInput: string,
    classification: ClassificationResult,
    context: Record<string, any> | undefined,
    startTime: number
  ): Promise<AgentResponse> {
    try {
      // 通常のLLMサービスを使用して雑談に応答
      const response = await this.llmService.generateResponse(userInput)
      
      return {
        agentType: 'general',
        content: response.text,
        metadata: {
          classification,
          isCasualInput: true,
          language: classification.language,
          category: classification.category,
          routingMethod: 'casual_filter'
        },
        executionTime: Date.now() - startTime,
        success: true
      }
    } catch (error) {
      // エラーの場合はデフォルトの応答
      const defaultResponses = {
        greeting: {
          en: "Hello! How can I help you today?",
          ja: "こんにちは！何かお手伝いできることはありますか？",
          zh: "你好！今天我能为您做些什么？",
          ko: "안녕하세요! 오늘 무엇을 도와드릴까요?",
          es: "¡Hola! ¿En qué puedo ayudarte hoy?",
          fr: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
          de: "Hallo! Wie kann ich Ihnen heute helfen?"
        },
        casual_chat: {
          en: "I'm here to help! What would you like to work on?",
          ja: "お手伝いします！何か作業したいことはありますか？",
          zh: "我在这里帮助您！您想做什么工作？",
          ko: "도와드리겠습니다! 어떤 작업을 하고 싶으신가요?",
          es: "¡Estoy aquí para ayudar! ¿En qué te gustaría trabajar?",
          fr: "Je suis là pour vous aider ! Sur quoi aimeriez-vous travailler ?",
          de: "Ich bin hier, um zu helfen! Woran möchten Sie arbeiten?"
        }
      }

      const responses = (classification.category === 'greeting' || classification.category === 'casual_chat') 
        ? defaultResponses[classification.category] 
        : defaultResponses.casual_chat
      const response = (responses as any)[classification.language] || responses.en

      return {
        agentType: 'general',
        content: response,
        metadata: {
          classification,
          isCasualInput: true,
          language: classification.language,
          category: classification.category,
          routingMethod: 'casual_filter',
          error: error instanceof Error ? error.message : String(error)
        },
        executionTime: Date.now() - startTime,
        success: true
      }
    }
  }

  /**
   * フォールバック処理
   */
  private async handleFallback(
    userInput: string,
    context: Record<string, any> | undefined,
    error: any,
    startTime: number
  ): Promise<AgentResponse> {
    try {
      // デフォルトエージェントで実行
      const response = await this.llmService.generateResponse(userInput)
      
      return {
        agentType: this.config.defaultAgent,
        content: response.text,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          isFallback: true,
          routingMethod: 'fallback'
        },
        executionTime: Date.now() - startTime,
        success: true
      }

    } catch (fallbackError) {
      // 最終的なフォールバック
      return {
        agentType: this.config.defaultAgent,
        content: `申し訳ございませんが、エラーが発生しました。もう一度お試しください。`,
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          isFallback: true,
          routingMethod: 'final_fallback'
        },
        executionTime: Date.now() - startTime,
        success: false
      }
    }
  }

  /**
   * デバッグ用：ルーティング結果の詳細表示
   */
  async debugRouting(input: string, context?: Record<string, any>): Promise<void> {
    console.log('=== LangChain Router Debug ===')
    console.log('Input:', input)
    
    if (this.config.enableCasualFilter) {
      const classification = this.inputClassifier.classifyInput(input, context)
      console.log('Classification:', classification)
    }
    
    try {
      const routingResult = await this.routeWithLangChain(input, context)
      console.log('Routing Result:', routingResult)
    } catch (error) {
      console.log('Routing Error:', error)
    }
    
    console.log('=============================')
  }
}
