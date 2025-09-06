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
import { v4 as uuidv4 } from 'uuid'
import { 
  ChatOpenAI, 
  HumanMessage, 
  SystemMessage,
  AIMessage 
} from '@langchain/openai'
import { 
  RunnableSequence, 
  RunnablePassthrough,
  RunnableLambda 
} from '@langchain/core/runnables'
import { 
  StringOutputParser,
  StructuredOutputParser 
} from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod'

export interface EnhancedAgent {
  type: AgentType
  name: string
  description: string
  keywords: string[]
  capabilities: AgentCapability[]
  execute: (input: string, context?: Record<string, any>) => Promise<AgentResponse>
  langchainChain?: RunnableSequence
}

export class LangChainEnhancedRouter {
  private llmService: LlamaService
  private agents: Map<AgentType, EnhancedAgent> = new Map()
  private config: RouterAgentConfig
  private executionHistory: Map<string, RouterDecision> = new Map()
  private multiAgentMemory: MultiAgentMemory
  private advancedRAG: AdvancedRAG
  private langchainLLM: ChatOpenAI | null = null

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
    
    // LangChain LLMの初期化
    this.initializeLangChainLLM()
  }

  private async initializeLangChainLLM() {
    try {
      // OpenAI APIキーが利用可能な場合
      if (process.env.OPENAI_API_KEY) {
        this.langchainLLM = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: 'gpt-4',
          temperature: 0.1
        })
      }
    } catch (error) {
      console.warn('LangChain LLM initialization failed, falling back to local LLM:', error)
    }
  }

  registerAgent(agent: EnhancedAgent): void {
    this.agents.set(agent.type, agent)
    
    // LangChainチェーンの作成
    if (this.langchainLLM) {
      agent.langchainChain = this.createAgentChain(agent)
    }
  }

  private createAgentChain(agent: EnhancedAgent): RunnableSequence {
    const prompt = PromptTemplate.fromTemplate(`
あなたは{agentName}エージェントです。
{agentDescription}

利用可能な機能:
{capabilities}

ユーザーの入力: {input}

コンテキスト情報:
{context}

上記の情報を基に、適切な応答を生成してください。
応答は構造化されたJSON形式で返してください。
    `)

    const outputParser = StructuredOutputParser.fromZodSchema(z.object({
      response: z.string().describe("エージェントの応答"),
      confidence: z.number().min(0).max(1).describe("応答の信頼度"),
      metadata: z.record(z.any()).describe("追加のメタデータ")
    }))

    return RunnableSequence.from([
      {
        agentName: () => agent.name,
        agentDescription: () => agent.description,
        capabilities: () => agent.capabilities.map(c => c.name).join(', '),
        input: new RunnablePassthrough(),
        context: new RunnablePassthrough()
      },
      prompt,
      this.langchainLLM!,
      outputParser
    ])
  }

  async routeAndExecute(
    userInput: string, 
    context?: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now()
    const requestId = uuidv4()

    try {
      // Step 1: コンテキストの更新
      this.updateContext(userInput, context)
      
      // Step 2: 関連情報の検索（Advanced RAG）
      const relevantInfo = await this.searchRelevantInformation(userInput, context)
      
      // Step 3: 共有メモリに情報を追加
      await this.addToSharedMemory(userInput, context, relevantInfo)
      
      // Step 4: LangChainを活用した入力分析とルーティング決定
      const decision = await this.analyzeAndRouteWithLangChain(userInput, context, relevantInfo)
      this.executionHistory.set(requestId, decision)

      // Step 5: 選択されたエージェントで実行
      const selectedAgent = this.agents.get(decision.selectedAgent)
      if (!selectedAgent) {
        throw new Error(`Agent ${decision.selectedAgent} not found`)
      }

      // Step 6: LangChainチェーンまたは従来の方法でエージェント実行
      let response: AgentResponse
      if (selectedAgent.langchainChain && this.langchainLLM) {
        response = await this.executeWithLangChain(selectedAgent, userInput, context, decision, relevantInfo)
      } else {
        response = await selectedAgent.execute(userInput, {
          ...context,
          routerDecision: decision,
          relevantInfo,
          memoryContext: await this.getMemoryContext()
        })
      }

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
          ragResults: relevantInfo.length,
          langchainUsed: !!selectedAgent.langchainChain
        }
      }

    } catch (error) {
      console.error('Error in LangChain enhanced router:', error)
      return await this.handleError(error, userInput, context)
    }
  }

  private async analyzeAndRouteWithLangChain(
    userInput: string, 
    context?: Record<string, any>,
    relevantInfo?: any[]
  ): Promise<RouterDecision> {
    if (this.langchainLLM) {
      return await this.analyzeWithLangChain(userInput, context, relevantInfo)
    } else {
      return await this.analyzeAndRoute(userInput, context, relevantInfo)
    }
  }

  private async analyzeWithLangChain(
    userInput: string, 
    context?: Record<string, any>,
    relevantInfo?: any[]
  ): Promise<RouterDecision> {
    const routingPrompt = PromptTemplate.fromTemplate(`
あなたは高度なルーティングエージェントです。
ユーザーの入力に基づいて、最適なエージェントを選択してください。

利用可能なエージェント:
{agents}

ユーザー入力: {input}

コンテキスト: {context}

関連情報: {relevantInfo}

以下のJSON形式で回答してください:
{
  "selectedAgent": "エージェントタイプ",
  "confidence": 0.0-1.0,
  "reasoning": "選択理由",
  "intent": "ユーザーの意図"
}
    `)

    const outputParser = StructuredOutputParser.fromZodSchema(z.object({
      selectedAgent: z.string().describe("選択されたエージェントタイプ"),
      confidence: z.number().min(0).max(1).describe("信頼度"),
      reasoning: z.string().describe("選択理由"),
      intent: z.string().describe("ユーザーの意図")
    }))

    const chain = RunnableSequence.from([
      {
        agents: () => Array.from(this.agents.values()).map(a => 
          `${a.type}: ${a.description} (${a.capabilities.map(c => c.name).join(', ')})`
        ).join('\n'),
        input: () => userInput,
        context: () => JSON.stringify(context || {}),
        relevantInfo: () => JSON.stringify(relevantInfo || [])
      },
      routingPrompt,
      this.langchainLLM!,
      outputParser
    ])

    const result = await chain.invoke({})
    
    return {
      selectedAgent: result.selectedAgent as AgentType,
      confidence: result.confidence,
      reasoning: result.reasoning,
      intent: result.intent as UserIntent,
      timestamp: new Date().toISOString()
    }
  }

  private async executeWithLangChain(
    agent: EnhancedAgent,
    userInput: string,
    context?: Record<string, any>,
    decision?: RouterDecision,
    relevantInfo?: any[]
  ): Promise<AgentResponse> {
    if (!agent.langchainChain) {
      throw new Error('LangChain chain not available for agent')
    }

    const result = await agent.langchainChain.invoke({
      input: userInput,
      context: {
        ...context,
        routerDecision: decision,
        relevantInfo,
        memoryContext: await this.getMemoryContext()
      }
    })

    return {
      content: result.response,
      confidence: result.confidence,
      metadata: {
        ...result.metadata,
        agentType: agent.type,
        executionMethod: 'langchain'
      }
    }
  }

  // 既存のメソッドの実装（簡略化）
  private updateContext(userInput: string, context?: Record<string, any>): void {
    // コンテキスト更新ロジック
  }

  private async searchRelevantInformation(userInput: string, context?: Record<string, any>): Promise<any[]> {
    return await this.advancedRAG.search(userInput, context)
  }

  private async addToSharedMemory(userInput: string, context?: Record<string, any>, relevantInfo?: any[]): Promise<void> {
    await this.multiAgentMemory.add(userInput, context, relevantInfo)
  }

  private async getMemoryContext(): Promise<any> {
    return await this.multiAgentMemory.getContext()
  }

  private async saveExecutionResult(agentType: AgentType, userInput: string, response: AgentResponse, decision: RouterDecision): Promise<void> {
    await this.multiAgentMemory.saveResult(agentType, userInput, response, decision)
  }

  private async analyzeAndRoute(userInput: string, context?: Record<string, any>, relevantInfo?: any[]): Promise<RouterDecision> {
    // 既存のルーティングロジック
    return {
      selectedAgent: AgentType.GENERAL,
      confidence: 0.8,
      reasoning: 'Default routing',
      intent: UserIntent.GENERAL_QUERY,
      timestamp: new Date().toISOString()
    }
  }

  private async handleFallback(userInput: string, context?: Record<string, any>, decision?: RouterDecision, originalResponse?: AgentResponse): Promise<AgentResponse> {
    // フォールバック処理
    return originalResponse || {
      content: '申し訳ございませんが、適切な応答を生成できませんでした。',
      confidence: 0.0,
      metadata: { fallback: true }
    }
  }

  private async handleError(error: any, userInput: string, context?: Record<string, any>): Promise<AgentResponse> {
    console.error('Router error:', error)
    return {
      content: 'エラーが発生しました。しばらく時間をおいてから再度お試しください。',
      confidence: 0.0,
      metadata: { error: error.message }
    }
  }
}
