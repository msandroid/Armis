import { VectorDatabaseService, VectorDocument, SearchResult } from './vector-database'
import { LlamaService } from '@/services/llm/llama-service'
import { 
  ChatOpenAI, 
  HumanMessage, 
  SystemMessage 
} from '@langchain/openai'
import { 
  PromptTemplate 
} from '@langchain/core/prompts'
import { 
  StructuredOutputParser 
} from '@langchain/core/output_parsers'
import { z } from 'zod'

export interface EnhancedVectorDocument extends VectorDocument {
  embedding?: number[]
  semanticHash?: string
  topics?: string[]
  entities?: Array<{
    text: string
    type: string
    confidence: number
  }>
  summary?: string
  language?: string
  sentiment?: {
    score: number
    label: string
  }
  lastAccessed?: Date
  accessCount?: number
}

export interface EnhancedSearchResult extends SearchResult {
  semanticScore?: number
  topicMatch?: boolean
  entityMatch?: boolean
  recencyScore?: number
  popularityScore?: number
}

export interface SearchQuery {
  text: string
  filters?: {
    topics?: string[]
    entities?: string[]
    dateRange?: {
      start: Date
      end: Date
    }
    language?: string
    sentiment?: string
  }
  weights?: {
    semantic?: number
    keyword?: number
    topic?: number
    entity?: number
    recency?: number
    popularity?: number
  }
}

export class EnhancedVectorDatabase extends VectorDatabaseService {
  private llamaService: LlamaService
  private langchainLLM: ChatOpenAI | null = null
  private enhancedDocuments: Map<string, EnhancedVectorDocument> = new Map()
  private documentTopics: Map<string, Set<string>> = new Map()
  private documentEntities: Map<string, Set<string>> = new Map()
  private accessHistory: Map<string, { count: number; lastAccessed: Date }> = new Map()

  constructor(llamaService: LlamaService) {
    super()
    this.llamaService = llamaService
    this.initializeLangChainLLM()
  }

  private async initializeLangChainLLM() {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.langchainLLM = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: 'gpt-4',
          temperature: 0.1
        })
      }
    } catch (error) {
      console.warn('LangChain LLM initialization failed:', error)
    }
  }

  async initialize(): Promise<void> {
    await super.initialize()
    console.log('Enhanced vector database initialized')
  }

  async addEnhancedDocument(document: EnhancedVectorDocument): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Enhanced vector database not initialized')
    }

    try {
      // 基本的なドキュメント追加
      await super.addDocument(document)

      // 拡張機能の処理
      const enhancedDoc = await this.processDocument(document)
      this.enhancedDocuments.set(document.id, enhancedDoc)

      // トピックとエンティティのインデックス更新
      await this.updateIndices(enhancedDoc)

      console.log(`Enhanced document ${document.id} added successfully`)
    } catch (error) {
      console.error('Failed to add enhanced document:', error)
      throw error
    }
  }

  private async processDocument(document: EnhancedVectorDocument): Promise<EnhancedVectorDocument> {
    const enhancedDoc: EnhancedVectorDocument = { ...document }

    // 並列処理で拡張機能を実行
    const [topics, entities, summary, language, sentiment] = await Promise.all([
      this.extractTopics(document.content),
      this.extractEntities(document.content),
      this.generateSummary(document.content),
      this.detectLanguage(document.content),
      this.analyzeSentiment(document.content)
    ])

    enhancedDoc.topics = topics
    enhancedDoc.entities = entities
    enhancedDoc.summary = summary
    enhancedDoc.language = language
    enhancedDoc.sentiment = sentiment
    enhancedDoc.lastAccessed = new Date()
    enhancedDoc.accessCount = 0

    return enhancedDoc
  }

  private async extractTopics(content: string): Promise<string[]> {
    try {
      if (this.langchainLLM) {
        const prompt = PromptTemplate.fromTemplate(`
以下のテキストから主要なトピックを抽出してください。
トピックは3-5個の単語またはフレーズで表現し、カンマ区切りで返してください。

テキスト: {content}

トピック:
        `)

        const outputParser = StructuredOutputParser.fromZodSchema(z.object({
          topics: z.string().describe("カンマ区切りのトピックリスト")
        }))

        const chain = prompt.pipe(this.langchainLLM).pipe(outputParser)
        const result = await chain.invoke({ content })
        
        return result.topics.split(',').map(t => t.trim()).filter(t => t.length > 0)
      } else {
        // フォールバック: 簡易的なトピック抽出
        return this.extractSimpleTopics(content)
      }
    } catch (error) {
      console.error('Error extracting topics:', error)
      return this.extractSimpleTopics(content)
    }
  }

  private async extractEntities(content: string): Promise<Array<{ text: string; type: string; confidence: number }>> {
    try {
      if (this.langchainLLM) {
        const prompt = PromptTemplate.fromTemplate(`
以下のテキストから重要なエンティティ（人名、組織名、地名など）を抽出してください。
JSON形式で返してください。

テキスト: {content}

エンティティ:
        `)

        const outputParser = StructuredOutputParser.fromZodSchema(z.object({
          entities: z.array(z.object({
            text: z.string(),
            type: z.string(),
            confidence: z.number()
          }))
        }))

        const chain = prompt.pipe(this.langchainLLM).pipe(outputParser)
        const result = await chain.invoke({ content })
        
        return result.entities
      } else {
        // フォールバック: 簡易的なエンティティ抽出
        return this.extractSimpleEntities(content)
      }
    } catch (error) {
      console.error('Error extracting entities:', error)
      return this.extractSimpleEntities(content)
    }
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      if (this.langchainLLM) {
        const prompt = PromptTemplate.fromTemplate(`
以下のテキストを簡潔に要約してください（100文字以内）:

{content}

要約:
        `)

        const chain = prompt.pipe(this.langchainLLM)
        const result = await chain.invoke({ content })
        
        return result.content
      } else {
        // フォールバック: 簡易的な要約生成
        return this.generateSimpleSummary(content)
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      return this.generateSimpleSummary(content)
    }
  }

  private async detectLanguage(content: string): Promise<string> {
    // 簡易的な言語検出
    const japaneseChars = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g)
    if (japaneseChars && japaneseChars.length > content.length * 0.1) {
      return 'ja'
    }
    return 'en'
  }

  private async analyzeSentiment(content: string): Promise<{ score: number; label: string }> {
    try {
      if (this.langchainLLM) {
        const prompt = PromptTemplate.fromTemplate(`
以下のテキストの感情分析を行い、-1から1のスコアと感情ラベルを返してください:

{content}

分析結果:
        `)

        const outputParser = StructuredOutputParser.fromZodSchema(z.object({
          score: z.number().min(-1).max(1),
          label: z.string()
        }))

        const chain = prompt.pipe(this.langchainLLM).pipe(outputParser)
        const result = await chain.invoke({ content })
        
        return result
      } else {
        // フォールバック: 簡易的な感情分析
        return this.analyzeSimpleSentiment(content)
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error)
      return this.analyzeSimpleSentiment(content)
    }
  }

  private async updateIndices(document: EnhancedVectorDocument): Promise<void> {
    // トピックインデックスの更新
    if (document.topics) {
      document.topics.forEach(topic => {
        if (!this.documentTopics.has(topic)) {
          this.documentTopics.set(topic, new Set())
        }
        this.documentTopics.get(topic)!.add(document.id)
      })
    }

    // エンティティインデックスの更新
    if (document.entities) {
      document.entities.forEach(entity => {
        const entityKey = `${entity.text}:${entity.type}`
        if (!this.documentEntities.has(entityKey)) {
          this.documentEntities.set(entityKey, new Set())
        }
        this.documentEntities.get(entityKey)!.add(document.id)
      })
    }
  }

  async enhancedSearch(query: SearchQuery): Promise<EnhancedSearchResult[]> {
    if (!this.isInitialized) {
      return []
    }

    try {
      const results: EnhancedSearchResult[] = []
      const queryLower = query.text.toLowerCase()

      for (const [id, document] of this.enhancedDocuments) {
        const baseResult = await this.calculateBaseScore(document, queryLower)
        const enhancedResult = await this.calculateEnhancedScores(document, query, baseResult)
        
        if (enhancedResult.distance < 1.0) { // 何らかのマッチがある場合
          results.push(enhancedResult)
        }
      }

      // 重み付けスコアでソート
      results.sort((a, b) => {
        const scoreA = this.calculateWeightedScore(a, query.weights)
        const scoreB = this.calculateWeightedScore(b, query.weights)
        return scoreB - scoreA
      })

      // アクセス履歴の更新
      results.slice(0, 5).forEach(result => {
        this.updateAccessHistory(result.id)
      })

      return results.slice(0, query.filters ? 20 : 10)
    } catch (error) {
      console.error('Error in enhanced search:', error)
      return []
    }
  }

  private async calculateBaseScore(document: EnhancedVectorDocument, query: string): Promise<EnhancedSearchResult> {
    const contentLower = document.content.toLowerCase()
    const metadataStr = JSON.stringify(document.metadata).toLowerCase()
    
    let score = 0
    
    // コンテンツマッチング
    if (contentLower.includes(query)) {
      score += 0.7
    }
    
    // メタデータマッチング
    if (metadataStr.includes(query)) {
      score += 0.3
    }

    return {
      id: document.id,
      content: document.content,
      metadata: document.metadata,
      distance: 1 - score,
      semanticScore: score
    }
  }

  private async calculateEnhancedScores(
    document: EnhancedVectorDocument, 
    query: SearchQuery, 
    baseResult: EnhancedSearchResult
  ): Promise<EnhancedSearchResult> {
    const result: EnhancedSearchResult = { ...baseResult }

    // トピックマッチング
    if (query.filters?.topics && document.topics) {
      const topicMatches = query.filters.topics.filter(topic => 
        document.topics!.some(docTopic => 
          docTopic.toLowerCase().includes(topic.toLowerCase())
        )
      )
      result.topicMatch = topicMatches.length > 0
      result.semanticScore = (result.semanticScore || 0) + (topicMatches.length * 0.2)
    }

    // エンティティマッチング
    if (query.filters?.entities && document.entities) {
      const entityMatches = query.filters.entities.filter(entity => 
        document.entities!.some(docEntity => 
          docEntity.text.toLowerCase().includes(entity.toLowerCase())
        )
      )
      result.entityMatch = entityMatches.length > 0
      result.semanticScore = (result.semanticScore || 0) + (entityMatches.length * 0.15)
    }

    // 新着度スコア
    if (document.lastAccessed) {
      const daysSinceAccess = (Date.now() - document.lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
      result.recencyScore = Math.max(0, 1 - (daysSinceAccess / 30)) // 30日で線形減少
    }

    // 人気度スコア
    const accessInfo = this.accessHistory.get(document.id)
    if (accessInfo) {
      result.popularityScore = Math.min(1, accessInfo.count / 100) // 100回アクセスで最大値
    }

    return result
  }

  private calculateWeightedScore(result: EnhancedSearchResult, weights?: SearchQuery['weights']): number {
    const defaultWeights = {
      semantic: 0.4,
      keyword: 0.3,
      topic: 0.1,
      entity: 0.1,
      recency: 0.05,
      popularity: 0.05
    }

    const w = weights || defaultWeights

    return (
      (result.semanticScore || 0) * w.semantic +
      (1 - result.distance) * w.keyword +
      (result.topicMatch ? 1 : 0) * w.topic +
      (result.entityMatch ? 1 : 0) * w.entity +
      (result.recencyScore || 0) * w.recency +
      (result.popularityScore || 0) * w.popularity
    )
  }

  private updateAccessHistory(documentId: string): void {
    const current = this.accessHistory.get(documentId) || { count: 0, lastAccessed: new Date() }
    this.accessHistory.set(documentId, {
      count: current.count + 1,
      lastAccessed: new Date()
    })

    // ドキュメントのアクセス情報も更新
    const document = this.enhancedDocuments.get(documentId)
    if (document) {
      document.lastAccessed = new Date()
      document.accessCount = (document.accessCount || 0) + 1
    }
  }

  // フォールバック実装
  private extractSimpleTopics(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/)
    const wordCount = new Map<string, number>()
    
    words.forEach(word => {
      if (word.length > 4) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    })

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  private extractSimpleEntities(content: string): Array<{ text: string; type: string; confidence: number }> {
    const entities: Array<{ text: string; type: string; confidence: number }> = []
    
    // 人名の抽出
    const nameMatches = content.match(/[A-Z][a-z]+ [A-Z][a-z]+/g)
    nameMatches?.forEach(name => {
      entities.push({ text: name, type: 'PERSON', confidence: 0.7 })
    })

    // 組織名の抽出
    const orgMatches = content.match(/[A-Z][A-Z\s]+(?:Inc|Corp|LLC|Ltd)/g)
    orgMatches?.forEach(org => {
      entities.push({ text: org, type: 'ORGANIZATION', confidence: 0.6 })
    })

    return entities
  }

  private generateSimpleSummary(content: string): string {
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0)
    const summaryLength = Math.min(2, Math.ceil(sentences.length * 0.2))
    return sentences.slice(0, summaryLength).join('。') + '。'
  }

  private analyzeSimpleSentiment(content: string): { score: number; label: string } {
    const positiveWords = ['良い', '素晴らしい', '優秀', '成功', '喜び', 'good', 'great', 'excellent', 'success']
    const negativeWords = ['悪い', '問題', '失敗', '悲しい', 'bad', 'problem', 'failure', 'sad']
    
    let positiveCount = 0
    let negativeCount = 0
    
    positiveWords.forEach(word => {
      const matches = content.toLowerCase().match(new RegExp(word, 'g'))
      if (matches) positiveCount += matches.length
    })
    
    negativeWords.forEach(word => {
      const matches = content.toLowerCase().match(new RegExp(word, 'g'))
      if (matches) negativeCount += matches.length
    })
    
    const score = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1)
    
    if (score > 0.1) return { score, label: 'positive' }
    if (score < -0.1) return { score, label: 'negative' }
    return { score, label: 'neutral' }
  }

  // 追加のユーティリティメソッド
  async getDocumentsByTopic(topic: string): Promise<EnhancedVectorDocument[]> {
    const documentIds = this.documentTopics.get(topic)
    if (!documentIds) return []

    return Array.from(documentIds)
      .map(id => this.enhancedDocuments.get(id))
      .filter((doc): doc is EnhancedVectorDocument => doc !== undefined)
  }

  async getDocumentsByEntity(entity: string, entityType?: string): Promise<EnhancedVectorDocument[]> {
    const entityKey = entityType ? `${entity}:${entityType}` : entity
    const documentIds = this.documentEntities.get(entityKey)
    if (!documentIds) return []

    return Array.from(documentIds)
      .map(id => this.enhancedDocuments.get(id))
      .filter((doc): doc is EnhancedVectorDocument => doc !== undefined)
  }

  async getPopularDocuments(limit: number = 10): Promise<EnhancedVectorDocument[]> {
    return Array.from(this.enhancedDocuments.values())
      .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
      .slice(0, limit)
  }

  async getRecentDocuments(limit: number = 10): Promise<EnhancedVectorDocument[]> {
    return Array.from(this.enhancedDocuments.values())
      .sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0))
      .slice(0, limit)
  }

  async getDocumentStats(): Promise<{
    totalDocuments: number
    totalTopics: number
    totalEntities: number
    averageAccessCount: number
  }> {
    const totalDocuments = this.enhancedDocuments.size
    const totalTopics = this.documentTopics.size
    const totalEntities = this.documentEntities.size
    
    const totalAccessCount = Array.from(this.enhancedDocuments.values())
      .reduce((sum, doc) => sum + (doc.accessCount || 0), 0)
    const averageAccessCount = totalDocuments > 0 ? totalAccessCount / totalDocuments : 0

    return {
      totalDocuments,
      totalTopics,
      totalEntities,
      averageAccessCount
    }
  }
}
