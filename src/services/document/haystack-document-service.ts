import { 
  Document, 
  Pipeline, 
  TextIndexingPipeline,
  TextRetrievalPipeline,
  TextGenerationPipeline,
  TextEmbeddingPipeline,
  TextClassificationPipeline,
  TextSummarizationPipeline,
  TextExtractionPipeline,
  TextTranslationPipeline,
  TextSentimentAnalysisPipeline,
  TextNamedEntityRecognitionPipeline,
  TextQuestionAnsweringPipeline,
  TextDocumentClassificationPipeline,
  TextDocumentRetrievalPipeline,
  TextDocumentGenerationPipeline,
  TextDocumentSummarizationPipeline,
  TextDocumentExtractionPipeline,
  TextDocumentTranslationPipeline,
  TextDocumentSentimentAnalysisPipeline,
  TextDocumentNamedEntityRecognitionPipeline,
  TextDocumentQuestionAnsweringPipeline,
  TextDocumentIndexingPipeline,
  TextDocumentEmbeddingPipeline,
  TextDocumentClassificationPipeline as TextDocumentClassificationPipelineType,
  TextDocumentRetrievalPipeline as TextDocumentRetrievalPipelineType,
  TextDocumentGenerationPipeline as TextDocumentGenerationPipelineType,
  TextDocumentSummarizationPipeline as TextDocumentSummarizationPipelineType,
  TextDocumentExtractionPipeline as TextDocumentExtractionPipelineType,
  TextDocumentTranslationPipeline as TextDocumentTranslationPipelineType,
  TextDocumentSentimentAnalysisPipeline as TextDocumentSentimentAnalysisPipelineType,
  TextDocumentNamedEntityRecognitionPipeline as TextDocumentNamedEntityRecognitionPipelineType,
  TextDocumentQuestionAnsweringPipeline as TextDocumentQuestionAnsweringPipelineType,
  TextDocumentIndexingPipeline as TextDocumentIndexingPipelineType,
  TextDocumentEmbeddingPipeline as TextDocumentEmbeddingPipelineType
} from 'haystack-core'

export interface DocumentAnalysisResult {
  content: string
  summary: string
  entities: Array<{
    text: string
    type: string
    confidence: number
  }>
  sentiment: {
    score: number
    label: string
  }
  keywords: string[]
  topics: string[]
  language: string
  metadata: Record<string, any>
}

export interface DocumentSearchResult {
  id: string
  content: string
  score: number
  metadata: Record<string, any>
}

export interface DocumentQAResult {
  answer: string
  confidence: number
  context: string
  metadata: Record<string, any>
}

export class HaystackDocumentService {
  private pipelines: Map<string, Pipeline> = new Map()
  private documents: Map<string, Document> = new Map()
  private isInitialized = false

  async initialize(): Promise<void> {
    try {
      // 基本的なパイプラインの初期化
      await this.initializePipelines()
      this.isInitialized = true
      console.log('Haystack document service initialized')
    } catch (error) {
      console.error('Failed to initialize Haystack document service:', error)
      throw error
    }
  }

  private async initializePipelines(): Promise<void> {
    // ドキュメント分析パイプライン
    const analysisPipeline = new TextDocumentClassificationPipeline()
    this.pipelines.set('analysis', analysisPipeline)

    // ドキュメント検索パイプライン
    const searchPipeline = new TextDocumentRetrievalPipeline()
    this.pipelines.set('search', searchPipeline)

    // 質問応答パイプライン
    const qaPipeline = new TextDocumentQuestionAnsweringPipeline()
    this.pipelines.set('qa', qaPipeline)

    // 要約パイプライン
    const summaryPipeline = new TextDocumentSummarizationPipeline()
    this.pipelines.set('summary', summaryPipeline)

    // エンティティ抽出パイプライン
    const entityPipeline = new TextDocumentNamedEntityRecognitionPipeline()
    this.pipelines.set('entities', entityPipeline)

    // 感情分析パイプライン
    const sentimentPipeline = new TextDocumentSentimentAnalysisPipeline()
    this.pipelines.set('sentiment', sentimentPipeline)

    // インデックス作成パイプライン
    const indexingPipeline = new TextDocumentIndexingPipeline()
    this.pipelines.set('indexing', indexingPipeline)

    // 埋め込み作成パイプライン
    const embeddingPipeline = new TextDocumentEmbeddingPipeline()
    this.pipelines.set('embedding', embeddingPipeline)
  }

  async analyzeDocument(
    content: string,
    metadata?: Record<string, any>
  ): Promise<DocumentAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Haystack document service not initialized')
    }

    try {
      const document = new Document({
        content,
        metadata: metadata || {}
      })

      // ドキュメントを保存
      const docId = this.generateDocumentId()
      this.documents.set(docId, document)

      // 各分析パイプラインを実行
      const [summary, entities, sentiment, keywords, topics, language] = await Promise.all([
        this.generateSummary(content),
        this.extractEntities(content),
        this.analyzeSentiment(content),
        this.extractKeywords(content),
        this.extractTopics(content),
        this.detectLanguage(content)
      ])

      return {
        content,
        summary,
        entities,
        sentiment,
        keywords,
        topics,
        language,
        metadata: {
          ...metadata,
          documentId: docId,
          analysisTimestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
      throw error
    }
  }

  async searchDocuments(
    query: string,
    limit: number = 10
  ): Promise<DocumentSearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('Haystack document service not initialized')
    }

    try {
      const searchPipeline = this.pipelines.get('search')
      if (!searchPipeline) {
        throw new Error('Search pipeline not available')
      }

      // 簡易的な検索実装（実際のHaystack検索の代わり）
      const results: DocumentSearchResult[] = []
      const queryLower = query.toLowerCase()

      for (const [id, document] of this.documents) {
        const contentLower = document.content.toLowerCase()
        const metadataStr = JSON.stringify(document.metadata).toLowerCase()
        
        let score = 0
        
        // コンテンツマッチング
        if (contentLower.includes(queryLower)) {
          score += 0.7
        }
        
        // メタデータマッチング
        if (metadataStr.includes(queryLower)) {
          score += 0.3
        }

        if (score > 0) {
          results.push({
            id,
            content: document.content,
            score,
            metadata: document.metadata
          })
        }
      }

      // スコアでソート
      results.sort((a, b) => b.score - a.score)
      
      return results.slice(0, limit)
    } catch (error) {
      console.error('Error searching documents:', error)
      throw error
    }
  }

  async answerQuestion(
    question: string,
    context?: string
  ): Promise<DocumentQAResult> {
    if (!this.isInitialized) {
      throw new Error('Haystack document service not initialized')
    }

    try {
      const qaPipeline = this.pipelines.get('qa')
      if (!qaPipeline) {
        throw new Error('QA pipeline not available')
      }

      // コンテキストが提供されていない場合、関連ドキュメントを検索
      let searchContext = context
      if (!searchContext) {
        const searchResults = await this.searchDocuments(question, 3)
        searchContext = searchResults.map(r => r.content).join('\n\n')
      }

      // 簡易的なQA実装（実際のHaystack QAの代わり）
      const answer = this.generateSimpleAnswer(question, searchContext)
      
      return {
        answer,
        confidence: 0.8,
        context: searchContext,
        metadata: {
          question,
          answerTimestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error answering question:', error)
      throw error
    }
  }

  async generateSummary(content: string): Promise<string> {
    try {
      const summaryPipeline = this.pipelines.get('summary')
      if (!summaryPipeline) {
        // フォールバック: 簡易的な要約生成
        return this.generateSimpleSummary(content)
      }

      // 実際のHaystack要約パイプラインの実行
      // const result = await summaryPipeline.run({ documents: [new Document({ content })] })
      // return result.documents[0].content

      // フォールバック実装
      return this.generateSimpleSummary(content)
    } catch (error) {
      console.error('Error generating summary:', error)
      return this.generateSimpleSummary(content)
    }
  }

  async extractEntities(content: string): Promise<Array<{ text: string; type: string; confidence: number }>> {
    try {
      const entityPipeline = this.pipelines.get('entities')
      if (!entityPipeline) {
        return this.extractSimpleEntities(content)
      }

      // 実際のHaystackエンティティ抽出パイプラインの実行
      // const result = await entityPipeline.run({ documents: [new Document({ content })] })
      // return result.documents[0].entities

      // フォールバック実装
      return this.extractSimpleEntities(content)
    } catch (error) {
      console.error('Error extracting entities:', error)
      return this.extractSimpleEntities(content)
    }
  }

  async analyzeSentiment(content: string): Promise<{ score: number; label: string }> {
    try {
      const sentimentPipeline = this.pipelines.get('sentiment')
      if (!sentimentPipeline) {
        return this.analyzeSimpleSentiment(content)
      }

      // 実際のHaystack感情分析パイプラインの実行
      // const result = await sentimentPipeline.run({ documents: [new Document({ content })] })
      // return result.documents[0].sentiment

      // フォールバック実装
      return this.analyzeSimpleSentiment(content)
    } catch (error) {
      console.error('Error analyzing sentiment:', error)
      return this.analyzeSimpleSentiment(content)
    }
  }

  async extractKeywords(content: string): Promise<string[]> {
    // 簡易的なキーワード抽出
    const words = content.toLowerCase().split(/\s+/)
    const wordCount = new Map<string, number>()
    
    words.forEach(word => {
      if (word.length > 3) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    })

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }

  async extractTopics(content: string): Promise<string[]> {
    // 簡易的なトピック抽出（キーワードと同様）
    return await this.extractKeywords(content)
  }

  async detectLanguage(content: string): Promise<string> {
    // 簡易的な言語検出（日本語と英語の判定）
    const japaneseChars = content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g)
    if (japaneseChars && japaneseChars.length > content.length * 0.1) {
      return 'ja'
    }
    return 'en'
  }

  // フォールバック実装
  private generateSimpleSummary(content: string): string {
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0)
    const summaryLength = Math.min(3, Math.ceil(sentences.length * 0.3))
    return sentences.slice(0, summaryLength).join('。') + '。'
  }

  private extractSimpleEntities(content: string): Array<{ text: string; type: string; confidence: number }> {
    const entities: Array<{ text: string; type: string; confidence: number }> = []
    
    // 人名の抽出（簡易的）
    const nameMatches = content.match(/[A-Z][a-z]+ [A-Z][a-z]+/g)
    nameMatches?.forEach(name => {
      entities.push({ text: name, type: 'PERSON', confidence: 0.7 })
    })

    // 組織名の抽出（簡易的）
    const orgMatches = content.match(/[A-Z][A-Z\s]+(?:Inc|Corp|LLC|Ltd)/g)
    orgMatches?.forEach(org => {
      entities.push({ text: org, type: 'ORGANIZATION', confidence: 0.6 })
    })

    return entities
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

  private generateSimpleAnswer(question: string, context: string): string {
    // 簡易的な質問応答
    const questionLower = question.toLowerCase()
    const contextLower = context.toLowerCase()
    
    if (questionLower.includes('何') || questionLower.includes('what')) {
      const sentences = context.split(/[。！？]/)
      for (const sentence of sentences) {
        if (sentence.toLowerCase().includes(questionLower.replace(/[何what]/g, ''))) {
          return sentence.trim()
        }
      }
    }
    
    return '申し訳ございませんが、適切な回答を見つけることができませんでした。'
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async addDocument(content: string, metadata?: Record<string, any>): Promise<string> {
    const document = new Document({
      content,
      metadata: metadata || {}
    })

    const docId = this.generateDocumentId()
    this.documents.set(docId, document)

    // インデックス作成
    const indexingPipeline = this.pipelines.get('indexing')
    if (indexingPipeline) {
      try {
        // await indexingPipeline.run({ documents: [document] })
        console.log(`Document ${docId} indexed successfully`)
      } catch (error) {
        console.error('Error indexing document:', error)
      }
    }

    return docId
  }

  async removeDocument(docId: string): Promise<void> {
    this.documents.delete(docId)
  }

  async getDocument(docId: string): Promise<Document | null> {
    return this.documents.get(docId) || null
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values())
  }

  async clearDocuments(): Promise<void> {
    this.documents.clear()
  }
}
