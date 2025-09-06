import { LlamaService } from '@/services/llm/llama-service'
import { 
  AgentType, 
  AgentCapability, 
  RouterDecision, 
  RouterAgentConfig, 
  AgentResponse,
  UserIntent 
} from '@/types/llm'
import { SequentialThinkingAgent } from './sequential-thinking-agent'
import { MultiAgentMemory } from './multi-agent-memory'
import { AdvancedRAG } from './advanced-rag'
import { VectorDatabaseService } from '@/services/vector/vector-database'
import { InputClassifier, ClassificationResult } from './input-classifier'
import { v4 as uuidv4 } from 'uuid'

export interface Agent {
  type: AgentType
  name: string
  description: string
  keywords: string[]
  execute: (input: string, context?: Record<string, any>) => Promise<AgentResponse>
}

export class RouterAgent {
  private llmService: LlamaService
  private agents: Map<AgentType, Agent> = new Map()
  private config: RouterAgentConfig
  private executionHistory: Map<string, RouterDecision> = new Map()
  private multiAgentMemory: MultiAgentMemory
  private advancedRAG: AdvancedRAG
  private inputClassifier: InputClassifier

  constructor(
    llmService: LlamaService, 
    config: RouterAgentConfig,
    vectorDB: VectorDatabaseService
  ) {
    this.llmService = llmService
    this.config = config
    
    // 高度なシステムの初期化
    this.multiAgentMemory = new MultiAgentMemory(vectorDB)
    this.advancedRAG = new AdvancedRAG(vectorDB, llmService)
    this.inputClassifier = new InputClassifier()
  }

  registerAgent(agent: Agent): void {
    this.agents.set(agent.type, agent)
  }

  async routeAndExecute(
    userInput: string, 
    context?: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now()
    const requestId = uuidv4()

    try {
      // Step 1: 入力分類による雑談フィルター
      const classification = this.inputClassifier.classifyInput(userInput, context)
      
      // 雑談や挨拶の場合は通常のLLMで処理
      if (!classification.shouldRouteToAgent) {
        return await this.handleCasualInput(userInput, classification, context, startTime)
      }
      
      // Step 2: コンテキストの更新
      this.updateContext(userInput, context)
      
      // Step 3: 関連情報の検索（Advanced RAG）
      const relevantInfo = await this.searchRelevantInformation(userInput, context)
      
      // Step 4: 共有メモリに情報を追加
      await this.addToSharedMemory(userInput, context, relevantInfo)
      
      // Step 5: 入力分析とルーティング決定
      const decision = await this.analyzeAndRoute(userInput, context, relevantInfo, classification)
      this.executionHistory.set(requestId, decision)

      // Step 5: 選択されたエージェントで実行
      const selectedAgent = this.agents.get(decision.selectedAgent)
      if (!selectedAgent) {
        throw new Error(`Agent ${decision.selectedAgent} not found`)
      }

      // Step 6: エージェント実行（メモリ情報を含む）
      const response = await selectedAgent.execute(userInput, {
        ...context,
        routerDecision: decision,
        relevantInfo,
        memoryContext: await this.getMemoryContext()
      })

      // Step 7: 結果を共有メモリに保存
      await this.saveExecutionResult(selectedAgent.type, userInput, response, decision)

      // Step 8: フォールバック処理
      if (decision.confidence < this.config.confidenceThreshold && this.config.enableFallback) {
        return await this.handleFallback(userInput, context, decision, response)
      }

      return {
        ...response,
        executionTime: Date.now() - startTime,
        metadata: {
          ...response.metadata,
          memoryUsed: true,
          ragResults: relevantInfo.length
        }
      }

    } catch (error) {
      // Step 9: エラーハンドリング
      return await this.handleError(userInput, context, error, startTime)
    }
  }

  /**
   * コンテキストの更新
   */
  private updateContext(userInput: string, context?: Record<string, any>): void {
    const newContext = {
      lastInput: userInput,
      timestamp: new Date().toISOString(),
      ...context
    }
    
    this.multiAgentMemory.updateContext(newContext, 'user_input')
  }

  /**
   * 関連情報の検索
   */
  private async searchRelevantInformation(
    userInput: string,
    context?: Record<string, any>
  ): Promise<any[]> {
    try {
      // Advanced RAGを使用して関連情報を検索
      const searchResults = await this.advancedRAG.hybridSearch(userInput, context)
      
      // 共有メモリからも関連情報を検索
      const memoryResults = await this.multiAgentMemory.searchSharedMemory(
        userInput,
        5,
        0.3
      )

      // 結果を統合
      const integratedResult = await this.advancedRAG.multiSourceIntegration([
        ...searchResults,
        ...memoryResults.map(memory => ({
          id: memory.id,
          content: memory.content,
          relevance: memory.importance,
          source: 'shared_memory',
          metadata: memory.context,
          context: memory.content,
          confidence: memory.importance
        }))
      ])

      return [integratedResult]
    } catch (error) {
      console.warn('Failed to search relevant information:', error)
      return []
    }
  }

  /**
   * 共有メモリに情報を追加
   */
  private async addToSharedMemory(
    userInput: string,
    context?: Record<string, any>,
    relevantInfo?: any[]
  ): Promise<void> {
    try {
      // ユーザー入力を共有メモリに追加
      await this.multiAgentMemory.addToSharedMemory(
        userInput,
        'user',
        context || {},
        ['user_input']
      )

      // 関連情報があれば長期記憶に追加
      if (relevantInfo && relevantInfo.length > 0) {
        for (const info of relevantInfo) {
          await this.multiAgentMemory.addToLongTermMemory(
            info.content || info.reasoning || 'Relevant information found',
            'rag_system',
            {
              source: 'advanced_rag',
              relevance: info.confidence || 0.5
            },
            ['rag_result', 'relevant_info']
          )
        }
      }
    } catch (error) {
      console.warn('Failed to add to shared memory:', error)
    }
  }

  /**
   * メモリコンテキストを取得
   */
  private async getMemoryContext(): Promise<Record<string, any>> {
    try {
      const currentContext = this.multiAgentMemory.getCurrentContext()
      const contextHistory = this.multiAgentMemory.getContextHistory(5)
      const memoryStats = this.multiAgentMemory.getMemoryStats()

      return {
        currentContext,
        recentContext: contextHistory,
        memoryStats,
        sessionId: currentContext.sessionId
      }
    } catch (error) {
      console.warn('Failed to get memory context:', error)
      return {}
    }
  }

  /**
   * 実行結果を保存
   */
  private async saveExecutionResult(
    agentType: AgentType,
    userInput: string,
    response: AgentResponse,
    decision: RouterDecision
  ): Promise<void> {
    try {
      // 実行結果を共有メモリに保存
      await this.multiAgentMemory.addToSharedMemory(
        `Agent ${agentType} executed: ${userInput}`,
        agentType,
        {
          decision,
          response: {
            success: response.success,
            executionTime: response.executionTime,
            agentType: response.agentType
          }
        },
        ['execution_result', agentType]
      )

      // 成功した実行を長期記憶に保存
      if (response.success) {
        await this.multiAgentMemory.addToLongTermMemory(
          `Successful execution by ${agentType}: ${userInput}`,
          agentType,
          {
            confidence: decision.confidence,
            executionTime: response.executionTime,
            reasoning: decision.reasoning
          },
          ['successful_execution', agentType]
        )
      }
    } catch (error) {
      console.warn('Failed to save execution result:', error)
    }
  }

  private async analyzeAndRoute(
    userInput: string, 
    context?: Record<string, any>,
    relevantInfo?: any[],
    classification?: ClassificationResult
  ): Promise<RouterDecision> {
    const availableAgents = Array.from(this.agents.values())
    
    // 分類結果がある場合は、それを活用
    if (classification && classification.suggestedAgent) {
      const suggestedAgent = this.agents.get(classification.suggestedAgent)
      if (suggestedAgent) {
        return {
          selectedAgent: classification.suggestedAgent,
          confidence: classification.confidence,
          reasoning: classification.reasoning,
          fallbackAgent: this.config.defaultAgent,
          context: {
            classification,
            language: classification.language,
            category: classification.category
          }
        }
      }
    }
    
    // 関連情報を含めたルーティングプロンプト
    const relevantInfoText = relevantInfo && relevantInfo.length > 0
      ? `\nRelevant Information: ${relevantInfo.map(info => info.content || info.reasoning).join('\n')}`
      : ''
    
    const classificationText = classification 
      ? `\nClassification: ${JSON.stringify(classification)}`
      : ''
    
    const routingPrompt = `
Analyze the following user input and determine the most appropriate agent to handle it.

User Input: "${userInput}"
Context: ${JSON.stringify(context || {})}${relevantInfoText}${classificationText}

Available Agents:
${availableAgents.map(agent => `
- ${agent.type}: ${agent.description}
  Keywords: ${agent.keywords.join(', ')}
`).join('')}

Please provide a routing decision in JSON format:
{
  "selectedAgent": "agent_type",
  "confidence": 0.95,
  "reasoning": "detailed explanation of why this agent was chosen",
  "fallbackAgent": "alternative_agent_type",
  "context": {"additional_info": "value"}
}

Consider the following factors:
1. Input content and intent
2. Agent capabilities and keywords
3. Previous successful patterns
4. User preferences if available
5. Relevant information from memory and RAG
6. Input classification results if available
`

    const response = await this.llmService.generateResponse(routingPrompt)
    
    try {
      const parsed = JSON.parse(response.text)
      return {
        selectedAgent: parsed.selectedAgent as AgentType,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || 'No reasoning provided',
        fallbackAgent: parsed.fallbackAgent as AgentType,
        context: parsed.context || {}
      }
    } catch (error) {
      // Fallback to default agent
      return {
        selectedAgent: this.config.defaultAgent,
        confidence: 0.3,
        reasoning: 'JSON parsing failed, using default agent',
        context: {}
      }
    }
  }

  private async handleFallback(
    userInput: string,
    context: Record<string, any> | undefined,
    decision: RouterDecision,
    originalResponse: AgentResponse
  ): Promise<AgentResponse> {
    if (!decision.fallbackAgent) {
      return originalResponse
    }

    const fallbackAgent = this.agents.get(decision.fallbackAgent)
    if (!fallbackAgent) {
      return originalResponse
    }

    try {
      const fallbackResponse = await fallbackAgent.execute(userInput, {
        ...context,
        originalDecision: decision,
        isFallback: true
      })

      return {
        ...fallbackResponse,
        metadata: {
          ...fallbackResponse.metadata,
          originalAgent: decision.selectedAgent,
          fallbackReason: `Low confidence (${decision.confidence}) in original agent`,
          originalResponse
        }
      }
    } catch (error) {
      return originalResponse
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
          category: classification.category
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
          error: error instanceof Error ? error.message : String(error)
        },
        executionTime: Date.now() - startTime,
        success: true
      }
    }
  }

  private async handleError(
    userInput: string,
    context: Record<string, any> | undefined,
    error: any,
    startTime: number
  ): Promise<AgentResponse> {
    const defaultAgent = this.agents.get(this.config.defaultAgent)
    
    if (defaultAgent) {
      try {
        const response = await defaultAgent.execute(userInput, {
          ...context,
          error: error.message,
          isErrorFallback: true
        })

        return {
          ...response,
          executionTime: Date.now() - startTime,
          metadata: {
            ...response.metadata,
            error: error.message,
            isErrorFallback: true
          }
        }
      } catch (fallbackError) {
        // If even fallback fails, return error response
        return {
          agentType: this.config.defaultAgent,
          content: `エラーが発生しました: ${error.message}`,
          metadata: { error: error.message },
          executionTime: Date.now() - startTime,
          success: false,
          error: error.message
        }
      }
    }

    return {
      agentType: this.config.defaultAgent,
      content: `エラーが発生しました: ${error.message}`,
      metadata: { error: error.message },
      executionTime: Date.now() - startTime,
      success: false,
      error: error.message
    }
  }

  getAgent(type: AgentType): Agent | undefined {
    return this.agents.get(type)
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values())
  }

  getRoutingHistory(): RouterDecision[] {
    return Array.from(this.executionHistory.values())
  }

  updateConfig(newConfig: Partial<RouterAgentConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): RouterAgentConfig {
    return { ...this.config }
  }

  // 新しいメソッド: メモリシステムへのアクセス
  getMultiAgentMemory(): MultiAgentMemory {
    return this.multiAgentMemory
  }

  getAdvancedRAG(): AdvancedRAG {
    return this.advancedRAG
  }

  // メモリ統計の取得
  getMemoryStats(): any {
    return this.multiAgentMemory.getMemoryStats()
  }

  // RAG統計の取得
  getRAGStats(): any {
    return this.advancedRAG.getStats()
  }
}
