import { LlamaService } from './llama-service'
import { SequentialThinkingAgent } from '@/services/agent/sequential-thinking-agent'
import { VectorDatabaseService } from '@/services/vector/vector-database'
import { ArmisTools } from '@/services/tools/armis-tools'
import { GeminiFileService } from './gemini-file-service'
import { GeminiFileTools } from '@/services/tools/gemini-file-tools'
import { LLMConfig, RouterAgentConfig, AgentResponse } from '@/types/llm'
import { RouterAgent } from '@/services/agent/router-agent'
import {
  GeneralAgent,
  CodeAssistantAgent,
  FileProcessorAgent,
  DataAnalyzerAgent,
  CreativeWriterAgent,
  SequentialThinkingAgentWrapper
} from '@/services/agent/specialized-agents'

export class LLMManager {
  private llamaService: LlamaService
  private vectorDB: VectorDatabaseService
  private agent: SequentialThinkingAgent
  private tools: ArmisTools
  private geminiFileService: GeminiFileService
  private geminiFileTools: GeminiFileTools
  private routerAgent: RouterAgent
  private isInitialized = false

  constructor(config: LLMConfig) {
    this.llamaService = new LlamaService(config)
    this.vectorDB = new VectorDatabaseService()
    this.agent = new SequentialThinkingAgent(this.llamaService)
    this.tools = new ArmisTools(this.vectorDB)
    this.geminiFileService = new GeminiFileService()
    this.geminiFileTools = new GeminiFileTools(this.geminiFileService)
    
    // Initialize Router Agent with default configuration
    const routerConfig: RouterAgentConfig = {
      defaultAgent: 'general',
      confidenceThreshold: 0.7,
      enableFallback: true,
      maxRetries: 3
    }
    this.routerAgent = new RouterAgent(this.llamaService, routerConfig, this.vectorDB)
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing LLM Manager...')
      
      // Initialize vector database
      await this.vectorDB.initialize()
      
      // Initialize LLM service
      await this.llamaService.initialize()
      
      // Register tools with agent
      const allTools = this.tools.getAllTools()
      const geminiFileTools = this.geminiFileTools.getAllTools()
      allTools.forEach(tool => this.agent.registerTool(tool))
      geminiFileTools.forEach(tool => this.agent.registerTool(tool))
      
      // Initialize and register specialized agents with router
      await this.initializeRouterAgents()
      
      this.isInitialized = true
      console.log('LLM Manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LLM Manager:', error)
      throw error
    }
  }

  private async initializeRouterAgents(): Promise<void> {
    console.log('Initializing Router Agents...')
    
    // Create specialized agents
    const generalAgent = new GeneralAgent(this.llamaService)
    const codeAssistantAgent = new CodeAssistantAgent(this.llamaService)
    const fileProcessorAgent = new FileProcessorAgent(this.llamaService)
    const dataAnalyzerAgent = new DataAnalyzerAgent(this.llamaService)
    const creativeWriterAgent = new CreativeWriterAgent(this.llamaService)
    const sequentialThinkingWrapper = new SequentialThinkingAgentWrapper(this.agent)
    
    // Register all agents with router
    this.routerAgent.registerAgent(generalAgent)
    this.routerAgent.registerAgent(codeAssistantAgent)
    this.routerAgent.registerAgent(fileProcessorAgent)
    this.routerAgent.registerAgent(dataAnalyzerAgent)
    this.routerAgent.registerAgent(creativeWriterAgent)
    this.routerAgent.registerAgent(sequentialThinkingWrapper)
    
    console.log('Router Agents initialized successfully')
  }

  async processUserRequest(userInput: string, context?: Record<string, any>): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('LLM Manager not initialized. Call initialize() first.')
    }

    try {
      // Use router agent to determine and execute the best agent
      return await this.routerAgent.routeAndExecute(userInput, context)
    } catch (error) {
      console.error('Error processing user request:', error)
      throw error
    }
  }

  // Legacy method for backward compatibility
  async processUserRequestLegacy(userInput: string, context?: Record<string, any>): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('LLM Manager not initialized. Call initialize() first.')
    }

    try {
      return await this.agent.processUserIntent(userInput, context)
    } catch (error) {
      console.error('Error processing user request:', error)
      throw error
    }
  }

  async addUserPreference(userId: string, action: string, context: Record<string, any>, result: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('LLM Manager not initialized.')
    }

    await this.vectorDB.addUserPreference(userId, action, context, result)
  }

  async findSimilarWorkflows(userId: string, context: Record<string, any>): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('LLM Manager not initialized.')
    }

    return await this.vectorDB.findSimilarWorkflows(userId, context)
  }

  isReady(): boolean {
    return this.isInitialized
  }

  getLLMService(): LlamaService {
    return this.llamaService
  }

  getAgent(): SequentialThinkingAgent {
    return this.agent
  }

  getRouterAgent(): RouterAgent {
    return this.routerAgent
  }

  getVectorDB(): VectorDatabaseService {
    return this.vectorDB
  }

  getGeminiFileService(): GeminiFileService {
    return this.geminiFileService
  }

  getGeminiFileTools(): GeminiFileTools {
    return this.geminiFileTools
  }

  // Router Agent specific methods
  async routeAndExecute(userInput: string, context?: Record<string, any>): Promise<AgentResponse> {
    if (!this.isInitialized) {
      throw new Error('LLM Manager not initialized.')
    }

    return await this.routerAgent.routeAndExecute(userInput, context)
  }

  updateRouterConfig(newConfig: Partial<RouterAgentConfig>): void {
    this.routerAgent.updateConfig(newConfig)
  }

  getRouterConfig(): RouterAgentConfig {
    return this.routerAgent.getConfig()
  }

  getAvailableAgents(): any[] {
    return this.routerAgent.getAllAgents()
  }

  getRoutingHistory(): any[] {
    return this.routerAgent.getRoutingHistory()
  }

  // 新しいメソッド: 高度なシステムへのアクセス
  getMultiAgentMemory(): any {
    return this.routerAgent.getMultiAgentMemory()
  }

  getAdvancedRAG(): any {
    return this.routerAgent.getAdvancedRAG()
  }

  // メモリ統計の取得
  getMemoryStats(): any {
    return this.routerAgent.getMemoryStats()
  }

  // RAG統計の取得
  getRAGStats(): any {
    return this.routerAgent.getRAGStats()
  }

  // メモリ管理メソッド
  async addToSharedMemory(content: string, sourceAgent: string, context?: Record<string, any>, tags?: string[]): Promise<string> {
    const memory = this.routerAgent.getMultiAgentMemory()
    return await memory.addToSharedMemory(content, sourceAgent, context || {}, tags || [])
  }

  async searchSharedMemory(query: string, limit?: number, minImportance?: number): Promise<any[]> {
    const memory = this.routerAgent.getMultiAgentMemory()
    return await memory.searchSharedMemory(query, limit || 10, minImportance || 0.3)
  }

  async addToLongTermMemory(content: string, sourceAgent: string, context?: Record<string, any>, tags?: string[]): Promise<string> {
    const memory = this.routerAgent.getMultiAgentMemory()
    return await memory.addToLongTermMemory(content, sourceAgent, context || {}, tags || [])
  }

  // RAG管理メソッド
  async hybridSearch(query: string, context?: Record<string, any>): Promise<any[]> {
    const rag = this.routerAgent.getAdvancedRAG()
    return await rag.hybridSearch(query, context)
  }

  async contextualSearch(query: string, context: Record<string, any>): Promise<any[]> {
    const rag = this.routerAgent.getAdvancedRAG()
    return await rag.contextualSearch(query, context)
  }

  async multiSourceIntegration(sources: any[]): Promise<any> {
    const rag = this.routerAgent.getAdvancedRAG()
    return await rag.multiSourceIntegration(sources)
  }

  // コンテキスト管理メソッド
  updateContext(newContext: Record<string, any>, trigger?: string): void {
    const memory = this.routerAgent.getMultiAgentMemory()
    memory.updateContext(newContext, trigger || 'manual')
  }

  getCurrentContext(): Record<string, any> {
    const memory = this.routerAgent.getMultiAgentMemory()
    return memory.getCurrentContext()
  }

  getContextHistory(limit?: number): any[] {
    const memory = this.routerAgent.getMultiAgentMemory()
    return memory.getContextHistory(limit || 10)
  }

  // システム統計の取得
  getSystemStats(): {
    memory: any
    rag: any
    agents: any[]
    routingHistory: any[]
  } {
    return {
      memory: this.getMemoryStats(),
      rag: this.getRAGStats(),
      agents: this.getAvailableAgents(),
      routingHistory: this.getRoutingHistory()
    }
  }
}
