import { LlamaService } from '@/services/llm/llama-service'
import { VectorDatabaseService } from '@/services/vector/vector-database'
import { LangChainEnhancedRouter, EnhancedAgent } from '@/services/agent/langchain-enhanced-router'
import { HaystackDocumentService } from '@/services/document/haystack-document-service'
import { EnhancedVectorDatabase } from '@/services/vector/enhanced-vector-database'
import { AgentType, AgentCapability, RouterAgentConfig } from '@/types/llm'

export interface IntegrationConfig {
  enableLangChain: boolean
  enableHaystack: boolean
  enableEnhancedVectorDB: boolean
  openAIApiKey?: string
  confidenceThreshold: number
  enableFallback: boolean
}

export interface IntegrationStatus {
  langchain: {
    enabled: boolean
    initialized: boolean
    agentsCount: number
  }
  haystack: {
    enabled: boolean
    initialized: boolean
    documentsCount: number
  }
  enhancedVectorDB: {
    enabled: boolean
    initialized: boolean
    documentsCount: number
  }
}

export class Phase1IntegrationManager {
  private llamaService: LlamaService
  private config: IntegrationConfig
  private langchainRouter: LangChainEnhancedRouter | null = null
  private haystackService: HaystackDocumentService | null = null
  private enhancedVectorDB: EnhancedVectorDatabase | null = null
  private isInitialized = false

  constructor(llamaService: LlamaService, config: IntegrationConfig) {
    this.llamaService = llamaService
    this.config = config
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Phase 1 integration manager...')

      // 基本のベクトルデータベースを初期化
      const baseVectorDB = new VectorDatabaseService()
      await baseVectorDB.initialize()

      // LangChain強化ルーターの初期化
      if (this.config.enableLangChain) {
        await this.initializeLangChainRouter(baseVectorDB)
      }

      // Haystackドキュメントサービスの初期化
      if (this.config.enableHaystack) {
        await this.initializeHaystackService()
      }

      // 拡張ベクトルデータベースの初期化
      if (this.config.enableEnhancedVectorDB) {
        await this.initializeEnhancedVectorDB()
      }

      this.isInitialized = true
      console.log('Phase 1 integration manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Phase 1 integration manager:', error)
      throw error
    }
  }

  private async initializeLangChainRouter(vectorDB: VectorDatabaseService): Promise<void> {
    const routerConfig: RouterAgentConfig = {
      confidenceThreshold: this.config.confidenceThreshold,
      enableFallback: this.config.enableFallback,
      maxRetries: 3,
      timeout: 30000
    }

    this.langchainRouter = new LangChainEnhancedRouter(
      this.llamaService,
      routerConfig,
      vectorDB
    )

    // 基本的なエージェントを登録
    await this.registerBasicAgents()

    console.log('LangChain enhanced router initialized')
  }

  private async initializeHaystackService(): Promise<void> {
    this.haystackService = new HaystackDocumentService()
    await this.haystackService.initialize()
    console.log('Haystack document service initialized')
  }

  private async initializeEnhancedVectorDB(): Promise<void> {
    this.enhancedVectorDB = new EnhancedVectorDatabase(this.llamaService)
    await this.enhancedVectorDB.initialize()
    console.log('Enhanced vector database initialized')
  }

  private async registerBasicAgents(): Promise<void> {
    if (!this.langchainRouter) return

    // ドキュメント理解エージェント
    const documentAgent: EnhancedAgent = {
      type: AgentType.DOCUMENT_ANALYSIS,
      name: 'Document Analysis Agent',
      description: 'ドキュメントの内容を分析し、要約、エンティティ抽出、感情分析を行います',
      keywords: ['document', 'analysis', 'summary', 'entities', 'sentiment'],
      capabilities: [
        { name: 'Document Analysis', description: 'ドキュメントの詳細分析' },
        { name: 'Entity Extraction', description: 'エンティティの抽出' },
        { name: 'Sentiment Analysis', description: '感情分析' },
        { name: 'Summarization', description: '要約生成' }
      ],
      execute: async (input: string, context?: Record<string, any>) => {
        if (!this.haystackService) {
          throw new Error('Haystack service not available')
        }

        const result = await this.haystackService.analyzeDocument(input, context)
        return {
          content: `ドキュメント分析が完了しました。\n\n要約: ${result.summary}\n\nキーワード: ${result.keywords.join(', ')}\n\n感情: ${result.sentiment.label} (スコア: ${result.sentiment.score.toFixed(2)})`,
          confidence: 0.9,
          metadata: {
            agentType: AgentType.DOCUMENT_ANALYSIS,
            analysisResult: result
          }
        }
      }
    }

    // 検索エージェント
    const searchAgent: EnhancedAgent = {
      type: AgentType.SEARCH,
      name: 'Search Agent',
      description: 'ドキュメントや情報を検索し、関連性の高い結果を提供します',
      keywords: ['search', 'find', 'query', 'retrieve'],
      capabilities: [
        { name: 'Document Search', description: 'ドキュメント検索' },
        { name: 'Semantic Search', description: '意味的検索' },
        { name: 'Filtered Search', description: 'フィルタ付き検索' }
      ],
      execute: async (input: string, context?: Record<string, any>) => {
        if (!this.haystackService) {
          throw new Error('Haystack service not available')
        }

        const results = await this.haystackService.searchDocuments(input, 5)
        return {
          content: `検索結果: ${results.length}件見つかりました。\n\n${results.map((r, i) => `${i + 1}. ${r.content.substring(0, 100)}... (スコア: ${r.score.toFixed(2)})`).join('\n')}`,
          confidence: 0.8,
          metadata: {
            agentType: AgentType.SEARCH,
            searchResults: results
          }
        }
      }
    }

    // 質問応答エージェント
    const qaAgent: EnhancedAgent = {
      type: AgentType.QUESTION_ANSWERING,
      name: 'Question Answering Agent',
      description: 'ドキュメントに関する質問に回答します',
      keywords: ['question', 'answer', 'qa', 'query'],
      capabilities: [
        { name: 'Question Answering', description: '質問応答' },
        { name: 'Context Understanding', description: 'コンテキスト理解' },
        { name: 'Answer Generation', description: '回答生成' }
      ],
      execute: async (input: string, context?: Record<string, any>) => {
        if (!this.haystackService) {
          throw new Error('Haystack service not available')
        }

        const result = await this.haystackService.answerQuestion(input)
        return {
          content: `質問: ${input}\n\n回答: ${result.answer}\n\n信頼度: ${(result.confidence * 100).toFixed(1)}%`,
          confidence: result.confidence,
          metadata: {
            agentType: AgentType.QUESTION_ANSWERING,
            qaResult: result
          }
        }
      }
    }

    // エージェントを登録
    this.langchainRouter.registerAgent(documentAgent)
    this.langchainRouter.registerAgent(searchAgent)
    this.langchainRouter.registerAgent(qaAgent)

    console.log('Basic agents registered')
  }

  // 公開API
  async routeAndExecute(input: string, context?: Record<string, any>) {
    if (!this.isInitialized) {
      throw new Error('Integration manager not initialized')
    }

    if (this.langchainRouter) {
      return await this.langchainRouter.routeAndExecute(input, context)
    } else {
      throw new Error('LangChain router not available')
    }
  }

  async analyzeDocument(content: string, metadata?: Record<string, any>) {
    if (!this.haystackService) {
      throw new Error('Haystack service not available')
    }

    return await this.haystackService.analyzeDocument(content, metadata)
  }

  async searchDocuments(query: string, limit: number = 10) {
    if (!this.haystackService) {
      throw new Error('Haystack service not available')
    }

    return await this.haystackService.searchDocuments(query, limit)
  }

  async answerQuestion(question: string, context?: string) {
    if (!this.haystackService) {
      throw new Error('Haystack service not available')
    }

    return await this.haystackService.answerQuestion(question, context)
  }

  async addEnhancedDocument(document: any) {
    if (!this.enhancedVectorDB) {
      throw new Error('Enhanced vector database not available')
    }

    return await this.enhancedVectorDB.addEnhancedDocument(document)
  }

  async enhancedSearch(query: any) {
    if (!this.enhancedVectorDB) {
      throw new Error('Enhanced vector database not available')
    }

    return await this.enhancedVectorDB.enhancedSearch(query)
  }

  // 統計情報の取得
  async getStatus(): Promise<IntegrationStatus> {
    const status: IntegrationStatus = {
      langchain: {
        enabled: this.config.enableLangChain,
        initialized: !!this.langchainRouter,
        agentsCount: 0
      },
      haystack: {
        enabled: this.config.enableHaystack,
        initialized: !!this.haystackService,
        documentsCount: 0
      },
      enhancedVectorDB: {
        enabled: this.config.enableEnhancedVectorDB,
        initialized: !!this.enhancedVectorDB,
        documentsCount: 0
      }
    }

    // 詳細情報の取得
    if (this.haystackService) {
      try {
        const documents = await this.haystackService.getAllDocuments()
        status.haystack.documentsCount = documents.length
      } catch (error) {
        console.warn('Failed to get Haystack document count:', error)
      }
    }

    if (this.enhancedVectorDB) {
      try {
        const stats = await this.enhancedVectorDB.getDocumentStats()
        status.enhancedVectorDB.documentsCount = stats.totalDocuments
      } catch (error) {
        console.warn('Failed to get enhanced vector DB stats:', error)
      }
    }

    return status
  }

  // 設定の更新
  updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Integration config updated:', this.config)
  }

  // サービスの取得
  getLangChainRouter(): LangChainEnhancedRouter | null {
    return this.langchainRouter
  }

  getHaystackService(): HaystackDocumentService | null {
    return this.haystackService
  }

  getEnhancedVectorDB(): EnhancedVectorDatabase | null {
    return this.enhancedVectorDB
  }

  // クリーンアップ
  async cleanup(): Promise<void> {
    console.log('Cleaning up Phase 1 integration manager...')
    
    // 各サービスのクリーンアップ処理を実行
    if (this.haystackService) {
      try {
        await this.haystackService.clearDocuments()
      } catch (error) {
        console.warn('Failed to cleanup Haystack service:', error)
      }
    }

    if (this.enhancedVectorDB) {
      try {
        await this.enhancedVectorDB.clearDocuments()
      } catch (error) {
        console.warn('Failed to cleanup enhanced vector DB:', error)
      }
    }

    this.isInitialized = false
    console.log('Phase 1 integration manager cleanup completed')
  }
}
