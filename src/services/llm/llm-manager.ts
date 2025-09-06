import { LlamaService } from './llama-service'
import { OllamaService } from './ollama-service'
import { LlamaCppService } from './llama-cpp-service'
import { HuggingFaceModelDownloader, HuggingFaceModel, DownloadProgress } from './huggingface-model-downloader'
import { SequentialThinkingAgent } from '@/services/agent/sequential-thinking-agent'
import { VectorDatabaseService } from '@/services/vector/vector-database'
import { ArmisTools } from '@/services/tools/armis-tools'
import { GeminiFileService } from './gemini-file-service'
import { GeminiFileTools } from '@/services/tools/gemini-file-tools'
import { GeminiImageService } from './gemini-image-service'
import { LLMConfig, RouterAgentConfig, AgentResponse } from '@/types/llm'
import { AVAILABLE_PROVIDERS } from '@/types/ai-sdk'
import { RouterAgent } from '@/services/agent/router-agent'
import { LangChainRouterAgent } from '@/services/agent/langchain-router-agent'
import {
  GeneralAgent,
  CodeAssistantAgent,
  FileProcessorAgent,
  DataAnalyzerAgent,
  CreativeWriterAgent,
  SequentialThinkingAgentWrapper
} from '@/services/agent/specialized-agents-fixed'
import { ImageGenerationAgent } from '@/services/agent/image-generation-agent'

export class LLMManager {
  private llamaService: LlamaService
  private ollamaService: OllamaService
  private llamaCppService: LlamaCppService
  private huggingFaceDownloader: HuggingFaceModelDownloader
  private vectorDB: VectorDatabaseService
  private agent: SequentialThinkingAgent
  private tools: ArmisTools
  private geminiFileService: GeminiFileService
  private geminiFileTools: GeminiFileTools
  private geminiImageService: GeminiImageService
  private routerAgent: RouterAgent
  private isInitialized = false
  private isInitializing = false // 初期化中の重複を防ぐフラグ
  private useOllama: boolean = true // Default to Ollama
  private useLlamaCpp: boolean = false // New flag for LlamaCpp

  constructor(config: LLMConfig) {
    this.llamaService = new LlamaService(config)
    this.ollamaService = new OllamaService({
      defaultModel: 'gemma3:1b',
      baseUrl: 'http://localhost:11434'
    })
    this.llamaCppService = new LlamaCppService({
      modelPath: config.modelPath || './models/gpt-oss-20b-GGUF.gguf',
      temperature: config.temperature,
      maxTokens: config.contextSize,
      topP: config.topP,
      topK: config.topK,
      contextSize: config.contextSize,
      threads: 4,
      gpuLayers: 0,
      verbose: false
    })
    this.huggingFaceDownloader = new HuggingFaceModelDownloader()
    this.vectorDB = new VectorDatabaseService()
    this.agent = new SequentialThinkingAgent(this.llamaService)
    this.tools = new ArmisTools(this.vectorDB)
    this.geminiFileService = new GeminiFileService()
    this.geminiFileTools = new GeminiFileTools(this.geminiFileService)
    this.geminiImageService = new GeminiImageService()
    
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
    // 既に初期化中または初期化済みの場合は早期リターン
    if (this.isInitializing || this.isInitialized) {
      console.log('🔄 LLM Manager is already initializing or initialized')
      return
    }

    this.isInitializing = true
    
    try {
      console.log('🚀 Initializing LLM Manager...')
      
      // 既存のモデルを新しいディレクトリ構造にマイグレーション
      try {
        await this.migrateExistingModels()
      } catch (error) {
        console.warn('⚠️ Model migration failed, continuing with initialization:', error)
      }
      
      // Initialize vector database
      await this.vectorDB.initialize()
      
      // Initialize LLM service based on preference
      if (this.useLlamaCpp) {
        try {
          console.log('🔄 Attempting to initialize LlamaCpp service...')
          await this.llamaCppService.initialize()
          console.log('✅ LlamaCpp service initialized successfully')
        } catch (error) {
          console.warn('⚠️ LlamaCpp initialization failed, falling back to Ollama:', error)
          this.useLlamaCpp = false
          this.useOllama = true
          try {
            console.log('🔄 Attempting to initialize Ollama service...')
            await this.ollamaService.initialize()
            console.log('✅ Ollama service initialized successfully')
          } catch (ollamaError) {
            console.warn('⚠️ Ollama initialization failed, falling back to Llama service:', ollamaError)
            await this.llamaService.initialize()
            this.useOllama = false
          }
        }
      } else if (this.useOllama) {
        try {
          console.log('🔄 Attempting to initialize Ollama service...')
          await this.ollamaService.initialize()
          console.log('✅ Ollama service initialized successfully')
        } catch (error) {
          console.warn('⚠️ Ollama initialization failed, falling back to Llama service:', error)
          await this.llamaService.initialize()
          this.useOllama = false
        }
      } else {
        await this.llamaService.initialize()
      }
      
      // Register tools with agent
      const allTools = this.tools.getAllTools()
      const geminiFileTools = this.geminiFileTools.getAllTools()
      allTools.forEach(tool => this.agent.registerTool(tool))
      geminiFileTools.forEach(tool => this.agent.registerTool(tool))
      
      // Initialize and register specialized agents with router
      await this.initializeRouterAgents()
      
      this.isInitialized = true
      console.log('✅ LLM Manager initialized successfully')
      
      // Log current configuration
      const stats = this.getSystemStats()
      console.log(`📊 Current configuration: ${stats.llmService}${stats.ollamaModel ? ` (${stats.ollamaModel})` : ''}`)
    } catch (error) {
      console.error('❌ Failed to initialize LLM Manager:', error)
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  private async initializeRouterAgents(): Promise<void> {
    console.log('Initializing Router Agents...')
    
    // Get the appropriate LLM service
    const llmService = this.useOllama ? this.ollamaService : this.llamaService
    
    // Create specialized agents
    const generalAgent = new GeneralAgent(llmService)
    const codeAssistantAgent = new CodeAssistantAgent(llmService)
    const fileProcessorAgent = new FileProcessorAgent(llmService)
    const dataAnalyzerAgent = new DataAnalyzerAgent(llmService)
    const creativeWriterAgent = new CreativeWriterAgent(llmService)
    const sequentialThinkingWrapper = new SequentialThinkingAgentWrapper(llmService)
    const imageGenerationAgent = new ImageGenerationAgent(llmService)
    
    // Register all agents with router
    this.routerAgent.registerAgent(generalAgent)
    this.routerAgent.registerAgent(codeAssistantAgent)
    this.routerAgent.registerAgent(fileProcessorAgent)
    this.routerAgent.registerAgent(dataAnalyzerAgent)
    this.routerAgent.registerAgent(creativeWriterAgent)
    this.routerAgent.registerAgent(sequentialThinkingWrapper)
    this.routerAgent.registerAgent(imageGenerationAgent)
    
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
      // 直接LLMサービスを使用してシンプルなレスポンスを生成
      const llmService = this.getLLMService()
      
      if (this.useOllama) {
        // OllamaServiceの場合
        const response = await (llmService as OllamaService).generate(userInput)
        console.log('Ollama response:', response)
        console.log('Ollama response type:', typeof response)
        console.log('Ollama response keys:', response ? Object.keys(response) : 'null/undefined')
        
        // レスポンスが正常かチェック
        if (response && response.response) {
          const responseText = response.response
          // 空のレスポンスや無効なレスポンスの場合は空文字列を返す
          const cleanResponse = responseText && 
            responseText.trim() !== '' && 
            responseText !== '{}' && 
            responseText !== '[]' && 
            responseText !== 'null' && 
            responseText !== 'undefined' &&
            !/^\s*\{\s*\}\s*$/.test(responseText) &&
            !/^\s*\[\s*\]\s*$/.test(responseText) 
            ? responseText 
            : ''
          
          return {
            content: cleanResponse,
            response: cleanResponse,
            success: true
          }
        } else if (response && typeof response === 'object' && 'response' in response) {
          // レスポンスオブジェクトの構造を確認
          const responseText = response.response || ''
          // 空のレスポンスや無効なレスポンスの場合は空文字列を返す
          const cleanResponse = responseText && 
            responseText.trim() !== '' && 
            responseText !== '{}' && 
            responseText !== '[]' && 
            responseText !== 'null' && 
            responseText !== 'undefined' &&
            !/^\s*\{\s*\}\s*$/.test(responseText) &&
            !/^\s*\[\s*\]\s*$/.test(responseText) 
            ? responseText 
            : ''
          
          return {
            content: cleanResponse,
            response: cleanResponse,
            success: true
          }
        } else {
          console.error('Invalid Ollama response structure:', response)
          throw new Error('Invalid response from Ollama service')
        }
      } else {
        // LlamaServiceの場合
        const response = await (llmService as LlamaService).generateResponse(userInput)
        return {
          content: response.text,
          response: response.text,
          success: true
        }
      }
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

  getLLMService(): LlamaService | OllamaService {
    return this.useOllama ? this.ollamaService : this.llamaService
  }

  getOllamaService(): OllamaService {
    return this.ollamaService
  }

  getLlamaService(): LlamaService {
    return this.llamaService
  }

  getLlamaCppService(): LlamaCppService {
    return this.llamaCppService
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
    llmService: string
    ollamaModel?: string
    llamaCppModel?: string
  } {
    return {
      memory: this.getMemoryStats(),
      rag: this.getRAGStats(),
      agents: this.getAvailableAgents(),
      routingHistory: this.getRoutingHistory(),
      llmService: this.useLlamaCpp ? 'LlamaCpp' : this.useOllama ? 'Ollama' : 'Llama',
      ollamaModel: this.useOllama ? this.ollamaService.getDefaultModel() : undefined,
      llamaCppModel: this.useLlamaCpp ? this.llamaCppService.getModelInfo()?.name : undefined
    }
  }

  // Ollama固有のメソッド
  async switchToOllama(): Promise<void> {
    if (!this.useOllama) {
      await this.ollamaService.initialize()
      this.useOllama = true
      console.log('Switched to Ollama service')
    }
  }

  async switchToLlama(): Promise<void> {
    if (this.useOllama) {
      await this.llamaService.initialize()
      this.useOllama = false
      console.log('Switched to Llama service')
    }
  }

  async setOllamaModel(modelName: string): Promise<void> {
    if (this.useOllama) {
      await this.ollamaService.setDefaultModel(modelName)
    } else {
      throw new Error('Ollama is not currently active. Call switchToOllama() first.')
    }
  }

  async listOllamaModels(): Promise<any[]> {
    return await this.ollamaService.listModels()
  }

  async pullOllamaModel(modelName: string): Promise<void> {
    await this.ollamaService.pullModel(modelName)
  }

  isUsingOllama(): boolean {
    return this.useOllama
  }

  // LlamaCpp固有のメソッド
  async switchToLlamaCpp(): Promise<void> {
    if (!this.useLlamaCpp) {
      await this.llamaCppService.initialize()
      this.useLlamaCpp = true
      this.useOllama = false
      console.log('Switched to LlamaCpp service')
    }
  }

  async loadLlamaCppModel(modelPath: string): Promise<void> {
    if (this.useLlamaCpp) {
      await this.llamaCppService.loadModel(modelPath)
    } else {
      throw new Error('LlamaCpp is not currently active. Call switchToLlamaCpp() first.')
    }
  }

  async getAvailableLlamaCppModels(): Promise<any[]> {
    return await this.llamaCppService.getAvailableModels()
  }

  async updateLlamaCppConfig(config: any): Promise<void> {
    if (this.useLlamaCpp) {
      this.llamaCppService.updateConfig(config)
    } else {
      throw new Error('LlamaCpp is not currently active. Call switchToLlamaCpp() first.')
    }
  }

  isUsingLlamaCpp(): boolean {
    return this.useLlamaCpp
  }

  // Hugging Faceモデルダウンロード関連のメソッド
  async searchHuggingFaceModels(query: string = '', limit: number = 50): Promise<HuggingFaceModel[]> {
    return await this.huggingFaceDownloader.searchLlamaCppModels(query, limit)
  }

  async getHuggingFaceModelDetails(modelId: string): Promise<HuggingFaceModel | null> {
    return await this.huggingFaceDownloader.getModelDetails(modelId)
  }

  async downloadHuggingFaceModel(
    modelId: string,
    onProgress?: (progress: DownloadProgress) => void,
    onComplete?: (modelPath: string) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    return await this.huggingFaceDownloader.downloadModel({
      modelId,
      onProgress,
      onComplete,
      onError
    })
  }

  async cancelHuggingFaceDownload(modelId: string): Promise<void> {
    await this.huggingFaceDownloader.cancelDownload(modelId)
  }

  isHuggingFaceDownloading(modelId: string): boolean {
    return this.huggingFaceDownloader.isDownloading(modelId)
  }

  getHuggingFaceDownloadingModels(): string[] {
    return this.huggingFaceDownloader.getDownloadingModels()
  }

  // 現在アクティブなサービスを取得
  getActiveService(): 'LlamaCpp' | 'Ollama' | 'Llama' {
    if (this.useLlamaCpp) return 'LlamaCpp'
    if (this.useOllama) return 'Ollama'
    return 'Llama'
  }

  // 現在アクティブなサービスで応答生成
  async generateResponse(prompt: string): Promise<any> {
    if (this.useLlamaCpp) {
      return await this.llamaCppService.generateResponse(prompt)
    } else if (this.useOllama) {
      return await this.ollamaService.generate(prompt)
    } else {
      return await this.llamaService.generateResponse(prompt)
    }
  }

  // Gemini Image Service関連のメソッド
  async configureGeminiImageService(apiKey: string, projectId?: string, location?: string): Promise<void> {
    try {
      await this.geminiImageService.configure(apiKey, projectId, location)
      console.log('✅ Gemini Image Service configured successfully')
    } catch (error) {
      console.error('❌ Failed to configure Gemini Image Service:', error)
      throw error
    }
  }

  async generateImage(request: any): Promise<any> {
    if (!this.geminiImageService) {
      throw new Error('Gemini Image Service not configured. Call configureGeminiImageService() first.')
    }
    return await this.geminiImageService.generateImage(request)
  }

  async generateMultipleImages(request: any, count: number = 1): Promise<any> {
    if (!this.geminiImageService) {
      throw new Error('Gemini Image Service not configured. Call configureGeminiImageService() first.')
    }
    return await this.geminiImageService.generateMultipleImages(request, count)
  }

  getAvailableImageModels(): Record<string, any> {
    if (!this.geminiImageService) {
      throw new Error('Gemini Image Service not configured.')
    }
    return this.geminiImageService.getAvailableModels()
  }

  getImageModelInfo(modelName: string): any {
    if (!this.geminiImageService) {
      throw new Error('Gemini Image Service not configured.')
    }
    return this.geminiImageService.getModelInfo(modelName)
  }

  // モデルIDからプロバイダー情報を取得
  getModelProviderInfo(modelId: string): { providerId: string; modelId: string } {
    console.log(`🔍 Getting provider info for model: ${modelId}`)
    
    // AVAILABLE_PROVIDERSからモデルを検索
    for (const provider of AVAILABLE_PROVIDERS) {
      const model = provider.models.find(m => m.id === modelId)
      if (model) {
        console.log(`✅ Found model ${modelId} in provider ${provider.id}`)
        return { providerId: provider.id, modelId: model.id }
      }
    }
    
    console.log(`❌ Model ${modelId} not found in direct search, checking mappings...`)
    
    // 特殊なマッピング（qwen3シリーズ）
    const modelMappings: { [key: string]: string } = {
      // デフォルトマッピングを削除し、明示的なマッピングのみ残す
      'qwen3-0.6b': 'qwen3:0.6b',
      'qwen3-1.7b': 'qwen3:1.7b',
      'qwen3-4b': 'qwen3:4b',
      'qwen3-8b': 'qwen3:8b',
      'qwen3-14b': 'qwen3:14b',
      'qwen3-30b': 'qwen3:30b',
      'qwen3-32b': 'qwen3:32b',
      // Llama.cpp用のマッピング
      'qwen3-0.6b-gguf': 'qwen3-0.6b-gguf',
      'qwen3-1.7b-gguf': 'qwen3-1.7b-gguf',
      'qwen3-4b-gguf': 'qwen3-4b-gguf',
      'qwen3-8b-gguf': 'qwen3-8b-gguf',
      'qwen3-30b-gguf': 'qwen3-30b-gguf',
      // Hugging Face用のマッピング
      'qwen3-0.6b-hf': 'qwen3-0.6b-hf',
      'qwen3-1.7b-hf': 'qwen3-1.7b-hf',
      'qwen3-4b-hf': 'qwen3-4b-hf',
      'qwen3-8b-hf': 'qwen3-8b-hf',
      'qwen3-30b-hf': 'qwen3-30b-hf'
    }
    
    const mappedModelId = modelMappings[modelId]
    if (mappedModelId) {
      console.log(`🔍 Found mapping: ${modelId} → ${mappedModelId}`)
      // マッピングされたモデルIDで再検索
      for (const provider of AVAILABLE_PROVIDERS) {
        const model = provider.models.find(m => m.id === mappedModelId)
        if (model) {
          console.log(`✅ Found mapped model ${mappedModelId} in provider ${provider.id}`)
          return { providerId: provider.id, modelId: mappedModelId }
        }
      }
      console.log(`❌ Mapped model ${mappedModelId} not found in any provider`)
    } else {
      console.log(`❌ No mapping found for model ${modelId}`)
    }
    
    // デバッグ用：利用可能なプロバイダーとモデルを表示
    console.log(`🔍 Available providers:`, AVAILABLE_PROVIDERS.map(p => ({ id: p.id, name: p.name, modelCount: p.models.length })))
    console.log(`🔍 Ollama models:`, AVAILABLE_PROVIDERS.find(p => p.id === 'ollama')?.models.map(m => m.id) || [])
    
    // モデルが見つからない場合は、デフォルトでllama-cppとして扱う
    console.warn(`Model ${modelId} not found in AVAILABLE_PROVIDERS, defaulting to llama-cpp`)
    return { providerId: 'llama-cpp', modelId }
  }



  // モデル存在チェックと自動ダウンロード機能
  async ensureModelAvailable(modelId: string, onProgress?: (progress: any) => void): Promise<boolean> {
    try {
      console.log(`🔍 Checking if model ${modelId} is available...`)
      
      // プロバイダー情報を取得
      const { providerId, modelId: mappedModelId } = this.getModelProviderInfo(modelId)
      console.log(`🔍 Model ${modelId} is mapped to provider: ${providerId}`)
      console.log(`🔍 Mapped model ID: ${mappedModelId}`)
      
      // Ollamaプロバイダーの場合
      if (providerId === 'ollama') {
        // 既にマッピングされたモデルIDを使用
        const actualModelId = mappedModelId
        const availableModels = await this.listOllamaModels()
        console.log(`🔍 Available Ollama models:`, availableModels.map((m: any) => m.name))
        console.log(`🔍 Looking for model: ${actualModelId}`)
        
        const modelExists = availableModels.some((model: any) => 
          model.name === actualModelId || model.name.includes(actualModelId)
        )
        
        console.log(`🔍 Model exists: ${modelExists}`)
        
        if (!modelExists) {
          console.log(`📥 Model ${actualModelId} not found in Ollama, downloading...`)
          console.log(`🔍 Original model ID: ${modelId}`)
          console.log(`🔍 Mapped model ID: ${actualModelId}`)
          await this.pullOllamaModelWithProgress(actualModelId, onProgress)
          return true
        }
        
        console.log(`✅ Model ${modelId} is already available in Ollama`)
        return true
      }
      
      // LlamaCppプロバイダーの場合
      if (providerId === 'llama-cpp') {
        console.log(`🔍 Checking LlamaCpp for model: ${modelId}`)
        
        // まず、ローカルの利用可能なモデルをチェック
        const availableModels = await this.getAvailableLlamaCppModels()
        const localModel = availableModels.find((model: any) => {
          const modelNameLower = model.name.toLowerCase()
          const modelPathLower = model.path.toLowerCase()
          const searchIdLower = modelId.toLowerCase()
          
          // より柔軟なマッチング（大文字小文字を無視し、部分一致を強化）
          return modelNameLower.includes(searchIdLower) || 
                 modelPathLower.includes(searchIdLower) ||
                 modelNameLower.includes(searchIdLower.replace(':', '')) ||
                 modelPathLower.includes(searchIdLower.replace(':', ''))
        })
        
        if (localModel) {
          console.log(`✅ Model ${modelId} found locally: ${localModel.path}`)
          return true
        }
        
        // ローカルにない場合はHugging Faceからダウンロード
        console.log(`📥 Model ${modelId} not found locally, searching on Hugging Face...`)
        
        // モデル名のマッピング（Hugging Face用）
        const modelNameMapping: { [key: string]: string } = {
          'gpt-oss-20b-gguf': 'unsloth/gpt-oss-20b-GGUF',
          'gpt-oss-20b-GGUF': 'unsloth/gpt-oss-20b-GGUF',
          'gpt-oss-20b': 'unsloth/gpt-oss-20b-GGUF',
          'llama-2-7b-chat': 'TheBloke/Llama-2-7B-Chat-GGUF',
          'llama-2-13b-chat': 'TheBloke/Llama-2-13B-Chat-GGUF',
          'mistral-7b-instruct': 'TheBloke/Mistral-7B-Instruct-v0.2-GGUF',
          'qwen2-7b-instruct': 'TheBloke/Qwen2-7B-Instruct-GGUF',
          // Qwen2.5-Omni マッピング
          'qwen2.5-omni-3b-gguf': 'unsloth/Qwen2.5-Omni-3B-GGUF',
          'qwen2.5-omni-3b': 'unsloth/Qwen2.5-Omni-3B-GGUF',
          'qwen2.5-omni-7b-gguf': 'unsloth/Qwen2.5-Omni-7B-GGUF',
          'qwen2.5-omni-7b': 'unsloth/Qwen2.5-Omni-7B-GGUF',
          // Qwen3 マッピング（Llama.cpp用）
          'qwen3': 'unsloth/Qwen3-4B-Instruct-2507-GGUF',
          'qwen3:0.6b': 'unsloth/Qwen3-0.6B-GGUF',
          'qwen3-0.6b': 'unsloth/Qwen3-0.6B-GGUF',
          'qwen3-0.6b-gguf': 'unsloth/Qwen3-0.6B-GGUF',
          'qwen3-1.7b': 'unsloth/Qwen3-1.7B-GGUF',
          'qwen3-1.7b-gguf': 'unsloth/Qwen3-1.7B-GGUF',
          'qwen3-4b': 'unsloth/Qwen3-4B-Instruct-2507-GGUF',
          'qwen3-4b-gguf': 'unsloth/Qwen3-4B-Instruct-2507-GGUF',
          'qwen3-4b-instruct': 'unsloth/Qwen3-4B-Instruct-2507-GGUF',
          'qwen3-8b': 'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF',
          'qwen3-8b-gguf': 'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF',
          'qwen3-8b-instruct': 'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF',
          'qwen3-30b': 'unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF',
          'qwen3-30b-gguf': 'unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF',
          'qwen3-30b-instruct': 'unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF',
          'gemma-2-9b-it': 'TheBloke/Gemma-2-9B-IT-GGUF',
          'codellama-7b-instruct': 'TheBloke/CodeLlama-7B-Instruct-GGUF'
        }
        
        const searchQuery = modelNameMapping[modelId] || modelId
        console.log(`🔍 Searching for model: ${searchQuery} on Hugging Face...`)
        
        // Hugging Faceからモデルを検索してダウンロード
        const models = await this.searchHuggingFaceModels(searchQuery, 5)
        if (models.length > 0) {
          const bestModel = models[0] // 最も人気の高いモデルを選択
          console.log(`📥 Found model: ${bestModel.id}, downloading...`)
          await this.downloadHuggingFaceModel(
            bestModel.id,
            (progress) => {
              console.log(`📊 Hugging Face download progress:`, progress)
              if (onProgress) {
                // 実際にダウンロードされているモデル名をプログレス情報に追加
                const enhancedProgress = {
                  ...progress,
                  actualModelId: bestModel.id,
                  originalModelId: modelId
                }
                onProgress(enhancedProgress)
              }
            },
            (modelPath) => console.log(`✅ Model downloaded: ${modelPath}`),
            (error) => console.error(`❌ Download failed: ${error}`)
          )
          return true
        } else {
          throw new Error(`No models found for ${modelId} on Hugging Face`)
        }
      }
      
      // その他のプロバイダー（Hugging Face、OpenAI等）の場合は既に利用可能とみなす
      console.log(`✅ Model ${modelId} is available for provider ${providerId}`)
      return true
    } catch (error) {
      console.error(`❌ Failed to ensure model availability: ${error}`)
      throw error
    }
  }

  // Ollamaモデルの進捗付きダウンロード
  async pullOllamaModelWithProgress(modelName: string, onProgress?: (progress: any) => void): Promise<void> {
    try {
      console.log(`🚀 ===== LLM MANAGER: MODEL DOWNLOAD STARTED =====`)
      console.log(`📥 Model: ${modelName}`)
      console.log(`⏰ Start time: ${new Date().toLocaleString()}`)
      console.log(`🔧 Service: Ollama`)
      console.log(`================================================`)
      
      await this.ollamaService.pullModelWithProgress(modelName, (progressData) => {
        if (onProgress) {
          onProgress(progressData)
        }
        // 詳細なプログレス情報をコンソールに出力
        console.log(`📊 [LLM Manager] ${progressData.message}`)
      }).catch(async (error) => {
        console.error(`💥 LLM Manager: Download failed for ${modelName}:`, error)
        
        // エラーメッセージを改善
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Unknown download error'
        
        if (onProgress) {
          onProgress({ 
            status: 'error', 
            message: `Download failed: ${errorMessage}`,
            progress: 0
          })
        }
        
        throw error
      })
      
      if (onProgress) {
        onProgress({ status: 'completed', message: `Download completed: ${modelName}` })
      }
      
      console.log(`🎉 ===== LLM MANAGER: DOWNLOAD COMPLETED =====`)
      console.log(`✅ Ollama model downloaded successfully: ${modelName}`)
      console.log(`⏰ End time: ${new Date().toLocaleString()}`)
      console.log(`==============================================`)
    } catch (error) {
      console.error(`💥 ===== LLM MANAGER: DOWNLOAD FAILED =====`)
      console.error(`❌ Failed to download Ollama model: ${error}`)
      console.error(`📥 Model: ${modelName}`)
      console.error(`⏰ Time: ${new Date().toLocaleString()}`)
      console.error(`============================================`)
      if (onProgress) {
        onProgress({ status: 'error', message: `Download failed: ${error}` })
      }
      throw error
    }
  }

  // モデル切り替えと自動ダウンロード
  async switchToModel(modelId: string, onProgress?: (progress: any) => void): Promise<void> {
    try {
      console.log(`🔄 Switching to model: ${modelId}`)
      
      // プロバイダー情報を取得
      const { providerId, modelId: mappedModelId } = this.getModelProviderInfo(modelId)
      
      // モデルが利用可能かチェックし、必要に応じてダウンロード
      await this.ensureModelAvailable(modelId, onProgress)
      
      // プロバイダーに基づいてサービスを切り替え
      if (providerId === 'ollama') {
        // Ollamaプロバイダーの場合
        this.useOllama = true
        this.useLlamaCpp = false
        await this.ollamaService.setModel(mappedModelId)
        console.log(`✅ Switched to Ollama model: ${mappedModelId}`)
      } else if (providerId === 'llama-cpp') {
        // LlamaCppプロバイダーの場合
        this.useOllama = false
        this.useLlamaCpp = true
        
        // LlamaCppの場合はモデルを読み込み
        const availableModels = await this.getAvailableLlamaCppModels()
        
        // より柔軟なモデル検索（大文字小文字を無視し、部分一致を強化）
        const targetModel = availableModels.find((model: any) => {
          const modelNameLower = model.name.toLowerCase()
          const modelPathLower = model.path.toLowerCase()
          const searchIdLower = modelId.toLowerCase()
          
          // 完全一致、部分一致、またはファイル名の部分一致をチェック
          return modelNameLower.includes(searchIdLower) || 
                 modelPathLower.includes(searchIdLower) ||
                 modelNameLower.includes(searchIdLower.replace(':', '')) ||
                 modelPathLower.includes(searchIdLower.replace(':', ''))
        })
        
        if (targetModel) {
          await this.loadLlamaCppModel(targetModel.path)
          console.log(`✅ Switched to LlamaCpp model: ${targetModel.path}`)
        } else {
          console.warn(`⚠️ Model ${modelId} not found in available LlamaCpp models`)
          console.log(`🔍 Available models:`, availableModels.map(m => ({ name: m.name, path: m.path })))
        }
      } else {
        // その他のプロバイダー（Hugging Face、OpenAI等）の場合は現在のサービスを維持
        console.log(`✅ Using model ${modelId} with provider ${providerId}`)
      }
      
      console.log(`✅ Successfully switched to model: ${modelId}`)
    } catch (error) {
      console.error(`❌ Failed to switch to model: ${error}`)
      throw error
    }
  }

  // 既存のダウンロードされたファイルを新しいディレクトリ構造に移動
  async migrateExistingModels(): Promise<void> {
    try {
      console.log('🔄 Migrating existing models to new directory structure...')
      
      const availableModels = await this.getAvailableLlamaCppModels()
      
      for (const model of availableModels) {
        const fileName = model.path.split('/').pop() || model.path.split('\\').pop() || ''
        
        // Qwen3モデルの場合、適切なディレクトリに移動
        if (fileName.toLowerCase().includes('qwen3')) {
          const modelId = this.detectModelIdFromFileName(fileName)
          if (modelId) {
            const newPath = `./models/${modelId}/${fileName}`
            console.log(`📁 Migrating ${fileName} to ${newPath}`)
            
            // 実際の移動処理はElectron環境でのみ実行
            if (typeof window !== 'undefined' && (window as any).electronAPI) {
              try {
                await (window as any).electronAPI.moveFile({
                  oldPath: model.path,
                  newPath: newPath
                })
                console.log(`✅ Successfully migrated ${fileName}`)
              } catch (error) {
                console.warn(`⚠️ Failed to migrate ${fileName}:`, error)
              }
            }
          }
        }
      }
      
      console.log('✅ Model migration completed')
    } catch (error) {
      console.error('❌ Model migration failed:', error)
    }
  }

  // ファイル名からモデルIDを検出
  private detectModelIdFromFileName(fileName: string): string | null {
    const fileNameLower = fileName.toLowerCase()
    
    if (fileNameLower.includes('qwen3-0.6b')) {
      return 'unsloth/Qwen3-0.6B-GGUF'
    } else if (fileNameLower.includes('qwen3-1.7b')) {
      return 'unsloth/Qwen3-1.7B-GGUF'
    } else if (fileNameLower.includes('qwen3-4b')) {
      return 'unsloth/Qwen3-4B-Instruct-2507-GGUF'
    } else if (fileNameLower.includes('qwen3-8b')) {
      return 'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF'
    } else if (fileNameLower.includes('qwen3-30b')) {
      return 'unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF'
    }
    
    return null
  }
}
