import { LlamaService } from './llama-service'
import { SequentialThinkingAgent } from '@/services/agent/sequential-thinking-agent'
import { VectorDatabaseService } from '@/services/vector/vector-database'
import { ArmisTools } from '@/services/tools/armis-tools'
import { LLMConfig } from '@/types/llm'

export class LLMManager {
  private llamaService: LlamaService
  private vectorDB: VectorDatabaseService
  private agent: SequentialThinkingAgent
  private tools: ArmisTools
  private isInitialized = false

  constructor(config: LLMConfig) {
    this.llamaService = new LlamaService(config)
    this.vectorDB = new VectorDatabaseService()
    this.agent = new SequentialThinkingAgent(this.llamaService)
    this.tools = new ArmisTools(this.vectorDB)
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
      allTools.forEach(tool => this.agent.registerTool(tool))
      
      this.isInitialized = true
      console.log('LLM Manager initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LLM Manager:', error)
      throw error
    }
  }

  async processUserRequest(userInput: string, context?: Record<string, any>): Promise<any> {
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

  getVectorDB(): VectorDatabaseService {
    return this.vectorDB
  }
}
