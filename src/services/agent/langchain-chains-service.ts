import { 
  ChatOpenAI,
  OpenAI
} from '@langchain/openai'
import { 
  ChatAnthropic 
} from '@langchain/anthropic'
import { 
  ChatGoogleGenerativeAI 
} from '@langchain/google-genai'
import { 
  PromptTemplate 
} from '@langchain/core/prompts'
import { 
  StringOutputParser,
  StructuredOutputParser
} from '@langchain/core/output_parsers'
import { 
  RunnableSequence,
  RunnablePassthrough
} from '@langchain/core/runnables'
import { 
  // 基本的なchains
  LLMChain,
  ConversationChain,
  SequentialChain,
  SimpleSequentialChain,
  
  // ルーティングchains
  LLMRouterChain,
  RouterChain,
  MultiPromptChain,
  MultiRouteChain,
  
  // QA chains
  RetrievalQAChain,
  ConversationalRetrievalQAChain,
  VectorDBQAChain,
  ChatVectorDBQAChain,
  
  // ドキュメント処理chains
  StuffDocumentsChain,
  RefineDocumentsChain,
  MapReduceDocumentsChain,
  
  // その他のchains
  ConstitutionalChain,
  ConstitutionalPrinciple,
  APIChain,
  TransformChain,
  AnalyzeDocumentChain
} from 'langchain/chains'
import { 
  BaseRetriever 
} from '@langchain/core/retrievers'
import { 
  Document 
} from '@langchain/core/documents'
import { z } from 'zod'

export interface ChainConfig {
  modelType: 'openai' | 'anthropic' | 'google'
  modelName?: string
  temperature?: number
  maxTokens?: number
  apiKey?: string
}

export interface RouterDestination {
  name: string
  description: string
  promptTemplate: string
  chainType: string
}

export interface ChainResult {
  output: any
  executionTime: number
  chainType: string
  metadata?: Record<string, any>
}

export class LangChainChainsService {
  private llm: any
  private config: ChainConfig
  private chains: Map<string, any> = new Map()
  private isInitialized = false

  constructor(config: ChainConfig) {
    this.config = config
  }

  /**
   * サービスを初期化
   */
  async initialize(): Promise<void> {
    try {
      this.llm = await this.createLLM()
      this.isInitialized = true
      console.log('LangChain Chains Service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize LangChain Chains Service:', error)
      throw error
    }
  }

  /**
   * LLMを作成
   */
  private async createLLM(): Promise<any> {
    const apiKey = this.config.apiKey || process.env[`${this.config.modelType.toUpperCase()}_API_KEY`]
    
    if (!apiKey) {
      throw new Error(`API key for ${this.config.modelType} is required`)
    }

    switch (this.config.modelType) {
      case 'openai':
        return new ChatOpenAI({
          openAIApiKey: apiKey,
          modelName: this.config.modelName || 'gpt-3.5-turbo',
          temperature: this.config.temperature || 0,
          maxTokens: this.config.maxTokens
        })
      case 'anthropic':
        return new ChatAnthropic({
          apiKey: apiKey,
          model: this.config.modelName || 'claude-3-sonnet-20240229',
          temperature: this.config.temperature || 0,
          maxTokens: this.config.maxTokens
        })
      case 'google':
        return new ChatGoogleGenerativeAI({
          apiKey: apiKey,
          modelName: this.config.modelName || 'gemini-pro',
          temperature: this.config.temperature || 0,
          maxOutputTokens: this.config.maxTokens
        })
      default:
        throw new Error(`Unsupported model type: ${this.config.modelType}`)
    }
  }

  /**
   * 基本的なLLMChainを作成
   */
  createLLMChain(promptTemplate: string, chainName?: string): LLMChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const prompt = PromptTemplate.fromTemplate(promptTemplate)
    const chain = new LLMChain({
      llm: this.llm,
      prompt: prompt
    })

    const name = chainName || `llm_chain_${Date.now()}`
    this.chains.set(name, chain)
    return chain
  }

  /**
   * 会話Chainを作成
   */
  createConversationChain(): ConversationChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const chain = new ConversationChain({
      llm: this.llm
    })

    this.chains.set('conversation_chain', chain)
    return chain
  }

  /**
   * シーケンシャルChainを作成
   */
  createSequentialChain(
    chains: LLMChain[],
    inputVariables: string[],
    outputVariables: string[]
  ): SequentialChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const chain = new SequentialChain({
      chains: chains,
      inputVariables: inputVariables,
      outputVariables: outputVariables
    })

    this.chains.set('sequential_chain', chain)
    return chain
  }

  /**
   * シンプルシーケンシャルChainを作成
   */
  createSimpleSequentialChain(chains: LLMChain[]): SimpleSequentialChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const chain = new SimpleSequentialChain({
      chains: chains
    })

    this.chains.set('simple_sequential_chain', chain)
    return chain
  }

  /**
   * ルーターChainを作成
   */
  createRouterChain(
    destinations: RouterDestination[]
  ): MultiPromptChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const promptTemplates = destinations.map(dest => ({
      name: dest.name,
      description: dest.description,
      promptTemplate: PromptTemplate.fromTemplate(dest.promptTemplate)
    }))

    const chain = new MultiPromptChain({
      llm: this.llm,
      promptTemplates: promptTemplates,
      defaultChain: new LLMChain({
        llm: this.llm,
        prompt: PromptTemplate.fromTemplate('You are a helpful assistant.')
      })
    })

    this.chains.set('router_chain', chain)
    return chain
  }

  /**
   * RetrievalQAChainを作成
   */
  createRetrievalQAChain(retriever: BaseRetriever): RetrievalQAChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const chain = RetrievalQAChain.fromLLM(
      this.llm,
      retriever
    )

    this.chains.set('retrieval_qa_chain', chain)
    return chain
  }

  /**
   * ConversationalRetrievalQAChainを作成
   */
  createConversationalRetrievalQAChain(
    retriever: BaseRetriever
  ): ConversationalRetrievalQAChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const chain = ConversationalRetrievalQAChain.fromLLM(
      this.llm,
      retriever
    )

    this.chains.set('conversational_retrieval_qa_chain', chain)
    return chain
  }

  /**
   * StuffDocumentsChainを作成
   */
  createStuffDocumentsChain(
    promptTemplate: string
  ): StuffDocumentsChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const prompt = PromptTemplate.fromTemplate(promptTemplate)
    const chain = StuffDocumentsChain.fromLLM(
      this.llm,
      { prompt }
    )

    this.chains.set('stuff_documents_chain', chain)
    return chain
  }

  /**
   * RefineDocumentsChainを作成
   */
  createRefineDocumentsChain(
    promptTemplate: string,
    refinePromptTemplate: string
  ): RefineDocumentsChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const prompt = PromptTemplate.fromTemplate(promptTemplate)
    const refinePrompt = PromptTemplate.fromTemplate(refinePromptTemplate)

    const chain = RefineDocumentsChain.fromLLM(
      this.llm,
      { prompt, refinePrompt }
    )

    this.chains.set('refine_documents_chain', chain)
    return chain
  }

  /**
   * MapReduceDocumentsChainを作成
   */
  createMapReduceDocumentsChain(
    mapPromptTemplate: string,
    combinePromptTemplate: string
  ): MapReduceDocumentsChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const mapPrompt = PromptTemplate.fromTemplate(mapPromptTemplate)
    const combinePrompt = PromptTemplate.fromTemplate(combinePromptTemplate)

    const chain = MapReduceDocumentsChain.fromLLM(
      this.llm,
      { mapPrompt, combinePrompt }
    )

    this.chains.set('map_reduce_documents_chain', chain)
    return chain
  }

  /**
   * ConstitutionalChainを作成
   */
  createConstitutionalChain(
    principles: ConstitutionalPrinciple[]
  ): ConstitutionalChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const chain = ConstitutionalChain.fromLLM(
      this.llm,
      { constitutionalPrinciples: principles }
    )

    this.chains.set('constitutional_chain', chain)
    return chain
  }

  /**
   * APIChainを作成
   */
  createAPIChain(
    apiUrl: string,
    apiHeaders?: Record<string, string>
  ): APIChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const chain = APIChain.fromLLMAndAPIRequest(
      this.llm,
      {
        apiUrl,
        apiHeaders
      }
    )

    this.chains.set('api_chain', chain)
    return chain
  }

  /**
   * TransformChainを作成
   */
  createTransformChain(
    transformFunction: (input: any) => any,
    inputVariables: string[],
    outputVariables: string[]
  ): TransformChain {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const chain = new TransformChain({
      transform: transformFunction,
      inputVariables,
      outputVariables
    })

    this.chains.set('transform_chain', chain)
    return chain
  }

  /**
   * カスタムRunnableSequenceを作成
   */
  createCustomSequence(
    steps: any[],
    chainName?: string
  ): RunnableSequence {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const sequence = RunnableSequence.from(steps)
    const name = chainName || `custom_sequence_${Date.now()}`
    this.chains.set(name, sequence)
    return sequence
  }

  /**
   * Chainを実行
   */
  async executeChain(
    chainName: string,
    input: any
  ): Promise<ChainResult> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const chain = this.chains.get(chainName)
    if (!chain) {
      throw new Error(`Chain '${chainName}' not found`)
    }

    const startTime = Date.now()
    
    try {
      const output = await chain.invoke(input)
      
      return {
        output,
        executionTime: Date.now() - startTime,
        chainType: chainName,
        metadata: {
          inputKeys: Object.keys(input),
          outputKeys: Object.keys(output)
        }
      }
    } catch (error) {
      console.error(`Error executing chain '${chainName}':`, error)
      throw error
    }
  }

  /**
   * 複数のChainを並列実行
   */
  async executeChainsParallel(
    chainInputs: Array<{ chainName: string; input: any }>
  ): Promise<ChainResult[]> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.')
    }

    const promises = chainInputs.map(({ chainName, input }) =>
      this.executeChain(chainName, input)
    )

    return Promise.all(promises)
  }

  /**
   * Chainを削除
   */
  removeChain(chainName: string): boolean {
    return this.chains.delete(chainName)
  }

  /**
   * 利用可能なChainの一覧を取得
   */
  getAvailableChains(): string[] {
    return Array.from(this.chains.keys())
  }

  /**
   * Chainの詳細情報を取得
   */
  getChainInfo(chainName: string): any {
    const chain = this.chains.get(chainName)
    if (!chain) {
      return null
    }

    return {
      name: chainName,
      type: chain.constructor.name,
      inputKeys: chain.inputKeys || [],
      outputKeys: chain.outputKeys || []
    }
  }

  /**
   * サービスをクリーンアップ
   */
  async cleanup(): Promise<void> {
    this.chains.clear()
    this.isInitialized = false
    console.log('LangChain Chains Service cleaned up')
  }
}
