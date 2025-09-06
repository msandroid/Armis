import { VectorDatabaseService } from '@/services/vector/vector-database'
import { LlamaService } from '@/services/llm/llama-service'

export interface SearchResult {
  id: string
  content: string
  relevance: number
  source: string
  metadata: Record<string, any>
  context: string
  confidence: number
}

export interface IntegratedResult {
  content: string
  sources: SearchResult[]
  confidence: number
  reasoning: string
  metadata: Record<string, any>
}

export interface Document {
  id: string
  content: string
  metadata: Record<string, any>
  embedding?: number[]
  lastUpdated: Date
}

export interface RAGConfig {
  hybridSearchWeight: number // ベクトル検索とキーワード検索の重み
  maxResults: number
  minRelevance: number
  contextWindow: number
  enableRealTimeUpdate: boolean
}

export class AdvancedRAG {
  private vectorDB: VectorDatabaseService
  private llmService: LlamaService
  private config: RAGConfig
  private documentCache: Map<string, Document> = new Map()

  constructor(
    vectorDB: VectorDatabaseService,
    llmService: LlamaService,
    config?: Partial<RAGConfig>
  ) {
    this.vectorDB = vectorDB
    this.llmService = llmService
    this.config = {
      hybridSearchWeight: 0.7,
      maxResults: 20,
      minRelevance: 0.3,
      contextWindow: 1000,
      enableRealTimeUpdate: true,
      ...config
    }
  }

  /**
   * ハイブリッド検索（ベクトル検索 + キーワード検索）
   */
  async hybridSearch(
    query: string,
    context?: Record<string, any>
  ): Promise<SearchResult[]> {
    // ベクトル検索
    const vectorResults = await this.vectorDB.searchSimilar(query, this.config.maxResults)
    
    // キーワード検索
    const keywordResults = await this.keywordSearch(query, this.config.maxResults)
    
    // 結果の統合
    const combinedResults = this.combineSearchResults(vectorResults, keywordResults)
    
    // 関連性スコアの計算
    const scoredResults = await this.calculateRelevanceScores(combinedResults, query, context)
    
    // フィルタリングとソート
    const filteredResults = scoredResults
      .filter(result => result.relevance >= this.config.minRelevance)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, this.config.maxResults)

    return filteredResults
  }

  /**
   * 文脈を考慮した検索
   */
  async contextualSearch(
    query: string,
    context: Record<string, any>
  ): Promise<SearchResult[]> {
    // クエリの意図を分析
    const enhancedQuery = await this.analyzeQueryIntent(query, context)
    
    // 文脈を考慮した検索実行
    const results = await this.hybridSearch(enhancedQuery, context)
    
    // 文脈との関連性を再評価
    const contextualResults = await this.reweightByContext(results, context)
    
    return contextualResults
  }

  /**
   * マルチソース統合
   */
  async multiSourceIntegration(
    sources: SearchResult[]
  ): Promise<IntegratedResult> {
    if (sources.length === 0) {
      return {
        content: '',
        sources: [],
        confidence: 0,
        reasoning: 'No relevant sources found',
        metadata: {}
      }
    }

    // ソースの重複除去と統合
    const uniqueSources = this.deduplicateSources(sources)
    
    // 内容の統合
    const integratedContent = await this.integrateContent(uniqueSources)
    
    // 信頼性の計算
    const confidence = this.calculateConfidence(uniqueSources)
    
    // 推論過程の生成
    const reasoning = await this.generateReasoning(uniqueSources, integratedContent)

    return {
      content: integratedContent,
      sources: uniqueSources,
      confidence,
      reasoning,
      metadata: {
        sourceCount: uniqueSources.length,
        averageRelevance: uniqueSources.reduce((sum, s) => sum + s.relevance, 0) / uniqueSources.length,
        integrationMethod: 'advanced_rag'
      }
    }
  }

  /**
   * リアルタイム更新
   */
  async realTimeUpdate(document: Document): Promise<void> {
    if (!this.config.enableRealTimeUpdate) {
      return
    }

    // ドキュメントキャッシュを更新
    this.documentCache.set(document.id, {
      ...document,
      lastUpdated: new Date()
    })

    // ベクターデータベースを更新
    await this.vectorDB.addDocument({
      id: document.id,
      content: document.content,
      metadata: {
        ...document.metadata,
        lastUpdated: document.lastUpdated.toISOString()
      }
    })

    // 関連ドキュメントの再インデックス化（必要に応じて）
    await this.reindexRelatedDocuments(document)
  }

  /**
   * キーワード検索
   */
  private async keywordSearch(query: string, limit: number): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    const queryTerms = query.toLowerCase().split(/\s+/)
    
    // 簡易的なキーワードマッチング
    for (const [id, document] of this.documentCache.entries()) {
      const content = document.content.toLowerCase()
      let matchScore = 0
      
      for (const term of queryTerms) {
        if (content.includes(term)) {
          matchScore += 1
        }
      }
      
      if (matchScore > 0) {
        const relevance = matchScore / queryTerms.length
        results.push({
          id,
          content: document.content,
          relevance,
          source: 'keyword_search',
          metadata: document.metadata,
          context: this.extractContext(document.content, query),
          confidence: relevance
        })
      }
    }

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
  }

  /**
   * 検索結果の統合
   */
  private combineSearchResults(
    vectorResults: any[],
    keywordResults: SearchResult[]
  ): SearchResult[] {
    const combined = new Map<string, SearchResult>()
    
    // ベクトル検索結果を追加
    for (const result of vectorResults) {
      combined.set(result.id, {
        id: result.id,
        content: result.content,
        relevance: result.distance ? 1 - result.distance : 0.5,
        source: 'vector_search',
        metadata: result.metadata,
        context: this.extractContext(result.content, ''),
        confidence: result.distance ? 1 - result.distance : 0.5
      })
    }
    
    // キーワード検索結果を統合
    for (const result of keywordResults) {
      if (combined.has(result.id)) {
        // 既存の結果と統合
        const existing = combined.get(result.id)!
        existing.relevance = this.config.hybridSearchWeight * existing.relevance + 
                           (1 - this.config.hybridSearchWeight) * result.relevance
        existing.confidence = Math.max(existing.confidence, result.confidence)
      } else {
        combined.set(result.id, result)
      }
    }
    
    return Array.from(combined.values())
  }

  /**
   * 関連性スコアの計算
   */
  private async calculateRelevanceScores(
    results: SearchResult[],
    query: string,
    context?: Record<string, any>
  ): Promise<SearchResult[]> {
    const enhancedResults = [...results]
    
    for (let i = 0; i < enhancedResults.length; i++) {
      const result = enhancedResults[i]
      
      // 基本的な関連性スコア
      let relevance = result.relevance
      
      // コンテキストによる調整
      if (context) {
        relevance = await this.adjustRelevanceByContext(result, context)
      }
      
      // クエリとの類似度による調整
      relevance = await this.adjustRelevanceByQuerySimilarity(result, query)
      
      enhancedResults[i] = {
        ...result,
        relevance: Math.max(0, Math.min(1, relevance))
      }
    }
    
    return enhancedResults
  }

  /**
   * クエリ意図の分析
   */
  private async analyzeQueryIntent(
    query: string,
    context: Record<string, any>
  ): Promise<string> {
    const analysisPrompt = `
以下のクエリの意図を分析し、より効果的な検索クエリを生成してください。

クエリ: "${query}"
コンテキスト: ${JSON.stringify(context)}

分析のポイント:
1. クエリの主要な意図
2. 必要な情報の種類
3. 検索に適したキーワード

改善されたクエリを返してください。
`

    try {
      const response = await this.llmService.generateResponse(analysisPrompt)
      return response.text.trim()
    } catch (error) {
      console.warn('Query intent analysis failed, using original query:', error)
      return query
    }
  }

  /**
   * 文脈による再重み付け
   */
  private async reweightByContext(
    results: SearchResult[],
    context: Record<string, any>
  ): Promise<SearchResult[]> {
    const reweightedResults = [...results]
    
    for (let i = 0; i < reweightedResults.length; i++) {
      const result = reweightedResults[i]
      const adjustedRelevance = await this.adjustRelevanceByContext(result, context)
      
      reweightedResults[i] = {
        ...result,
        relevance: adjustedRelevance
      }
    }
    
    return reweightedResults.sort((a, b) => b.relevance - a.relevance)
  }

  /**
   * ソースの重複除去
   */
  private deduplicateSources(sources: SearchResult[]): SearchResult[] {
    const unique = new Map<string, SearchResult>()
    
    for (const source of sources) {
      if (!unique.has(source.id)) {
        unique.set(source.id, source)
      } else {
        // 既存のソースと統合（より高い関連性を保持）
        const existing = unique.get(source.id)!
        if (source.relevance > existing.relevance) {
          unique.set(source.id, source)
        }
      }
    }
    
    return Array.from(unique.values())
  }

  /**
   * コンテンツの統合
   */
  private async integrateContent(sources: SearchResult[]): Promise<string> {
    if (sources.length === 1) {
      return sources[0].content
    }

    const integrationPrompt = `
以下の複数のソースから情報を統合し、一貫性のある回答を生成してください。

ソース:
${sources.map((source, index) => `
${index + 1}. ${source.content}
   関連性: ${source.relevance.toFixed(2)}
   信頼性: ${source.confidence.toFixed(2)}
`).join('\n')}

統合された回答を生成してください。重複する情報は除去し、矛盾する情報がある場合は最も信頼性の高い情報を優先してください。
`

    try {
      const response = await this.llmService.generateResponse(integrationPrompt)
      return response.text.trim()
    } catch (error) {
      console.warn('Content integration failed, using first source:', error)
      return sources[0]?.content || ''
    }
  }

  /**
   * 信頼性の計算
   */
  private calculateConfidence(sources: SearchResult[]): number {
    if (sources.length === 0) return 0
    
    const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length
    const sourceCountBonus = Math.min(sources.length / 10, 0.2) // 最大20%のボーナス
    
    return Math.min(1, avgConfidence + sourceCountBonus)
  }

  /**
   * 推論過程の生成
   */
  private async generateReasoning(
    sources: SearchResult[],
    integratedContent: string
  ): Promise<string> {
    const reasoningPrompt = `
以下の情報統合の推論過程を説明してください。

統合された内容: ${integratedContent}

使用したソース数: ${sources.length}
平均関連性: ${(sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length).toFixed(2)}

推論過程を簡潔に説明してください。
`

    try {
      const response = await this.llmService.generateResponse(reasoningPrompt)
      return response.text.trim()
    } catch (error) {
      return `Integrated ${sources.length} sources with average relevance of ${(sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length).toFixed(2)}`
    }
  }

  /**
   * コンテキスト抽出
   */
  private extractContext(content: string, query: string): string {
    const maxLength = this.config.contextWindow
    if (content.length <= maxLength) {
      return content
    }

    // クエリに関連する部分を中心に抽出
    const queryTerms = query.toLowerCase().split(/\s+/)
    let bestPosition = 0
    let bestScore = 0

    for (let i = 0; i <= content.length - maxLength; i += 100) {
      const segment = content.substring(i, i + maxLength).toLowerCase()
      let score = 0
      
      for (const term of queryTerms) {
        if (segment.includes(term)) {
          score += 1
        }
      }
      
      if (score > bestScore) {
        bestScore = score
        bestPosition = i
      }
    }

    return content.substring(bestPosition, bestPosition + maxLength)
  }

  /**
   * コンテキストによる関連性調整
   */
  private async adjustRelevanceByContext(
    result: SearchResult,
    context: Record<string, any>
  ): Promise<number> {
    // 簡易的なコンテキスト調整
    let adjustment = 0
    
    // メタデータとの一致
    for (const [key, value] of Object.entries(context)) {
      if (result.metadata[key] === value) {
        adjustment += 0.1
      }
    }
    
    // タグとの一致
    if (context.tags && result.metadata.tags) {
      const contextTags = Array.isArray(context.tags) ? context.tags : [context.tags]
      const resultTags = Array.isArray(result.metadata.tags) ? result.metadata.tags : [result.metadata.tags]
      
      const commonTags = contextTags.filter(tag => resultTags.includes(tag))
      adjustment += commonTags.length * 0.05
    }
    
    return Math.max(0, Math.min(1, result.relevance + adjustment))
  }

  /**
   * クエリ類似度による関連性調整
   */
  private async adjustRelevanceByQuerySimilarity(
    result: SearchResult,
    query: string
  ): Promise<number> {
    // 簡易的な類似度計算
    const queryWords = query.toLowerCase().split(/\s+/)
    const contentWords = result.content.toLowerCase().split(/\s+/)
    
    const commonWords = queryWords.filter(word => contentWords.includes(word))
    const similarity = commonWords.length / queryWords.length
    
    return Math.max(0, Math.min(1, result.relevance + similarity * 0.2))
  }

  /**
   * 関連ドキュメントの再インデックス化
   */
  private async reindexRelatedDocuments(document: Document): Promise<void> {
    // 必要に応じて関連ドキュメントを再インデックス化
    // 実装は具体的な要件に応じて拡張
  }

  /**
   * 設定の更新
   */
  updateConfig(newConfig: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 統計情報の取得
   */
  getStats(): {
    documentCount: number
    cacheSize: number
    config: RAGConfig
  } {
    return {
      documentCount: this.documentCache.size,
      cacheSize: this.documentCache.size,
      config: { ...this.config }
    }
  }
}
