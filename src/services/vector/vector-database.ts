export interface VectorDocument {
  id: string
  content: string
  metadata: Record<string, any>
  embedding?: number[]
}

export interface SearchResult {
  id: string
  content: string
  metadata: Record<string, any>
  distance: number
}

export class VectorDatabaseService {
  private documents: Map<string, VectorDocument> = new Map()
  private embeddings: Map<string, number[]> = new Map()
  private isInitialized = false

  async initialize(): Promise<void> {
    try {
      // ブラウザ環境ではインメモリストレージを使用
      this.isInitialized = true
      console.log('Vector database initialized (in-memory)')
    } catch (error) {
      console.error('Failed to initialize vector database:', error)
      throw error
    }
  }

  async addDocument(document: VectorDocument): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Vector database not initialized')
    }

    try {
      this.documents.set(document.id, document)
      if (document.embedding) {
        this.embeddings.set(document.id, document.embedding)
      }
    } catch (error) {
      console.error('Failed to add document to vector database:', error)
      throw error
    }
  }

  async searchSimilar(query: string, limit: number = 5): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      return []
    }

    try {
      // 簡易的なテキスト検索（実際のベクトル検索の代わり）
      const queryLower = query.toLowerCase()
      const results: SearchResult[] = []

      for (const [id, document] of this.documents) {
        const contentLower = document.content.toLowerCase()
        const metadataStr = JSON.stringify(document.metadata).toLowerCase()
        
        // テキストマッチングによる類似度計算
        let score = 0
        
        // コンテンツマッチング
        if (contentLower.includes(queryLower)) {
          score += 0.7
        }
        
        // メタデータマッチング
        if (metadataStr.includes(queryLower)) {
          score += 0.3
        }
        
        // シンボル名マッチング
        if (document.metadata.name && document.metadata.name.toLowerCase().includes(queryLower)) {
          score += 0.5
        }

        if (score > 0) {
          results.push({
            id,
            content: document.content,
            metadata: document.metadata,
            distance: 1 - score // 距離は類似度の逆数
          })
        }
      }

      // 類似度でソート（距離の昇順）
      results.sort((a, b) => a.distance - b.distance)
      
      return results.slice(0, limit)
    } catch (error) {
      console.error('Failed to search vector database:', error)
      return []
    }
  }

  async addUserPreference(
    userId: string,
    action: string,
    context: Record<string, any>,
    result: any
  ): Promise<void> {
    const document: VectorDocument = {
      id: `${userId}_${Date.now()}`,
      content: `User ${userId} performed action: ${action} with context: ${JSON.stringify(context)}`,
      metadata: {
        userId,
        action,
        context,
        result,
        timestamp: new Date().toISOString(),
        type: 'user_preference'
      }
    }

    await this.addDocument(document)
  }

  async findSimilarWorkflows(
    userId: string,
    currentContext: Record<string, any>,
    limit: number = 3
  ): Promise<SearchResult[]> {
    const query = `User ${userId} workflow patterns with context: ${JSON.stringify(currentContext)}`
    return this.searchSimilar(query, limit)
  }

  async addWorkflowTemplate(
    name: string,
    description: string,
    steps: any[],
    tags: string[]
  ): Promise<void> {
    const document: VectorDocument = {
      id: `template_${Date.now()}`,
      content: `Workflow template: ${name} - ${description}`,
      metadata: {
        name,
        description,
        steps,
        tags,
        type: 'workflow_template',
        timestamp: new Date().toISOString()
      }
    }

    await this.addDocument(document)
  }

  async findWorkflowTemplates(query: string, limit: number = 5): Promise<SearchResult[]> {
    const searchQuery = `Workflow template: ${query}`
    return this.searchSimilar(searchQuery, limit)
  }

  async addEmbedding(id: string, embedding: number[]): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Vector database not initialized')
    }

    this.embeddings.set(id, embedding)
  }

  async searchByEmbedding(
    queryEmbedding: number[],
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      return []
    }

    try {
      const results: SearchResult[] = []

      for (const [id, embedding] of this.embeddings) {
        const document = this.documents.get(id)
        if (!document) continue

        // コサイン類似度の計算
        const similarity = this.cosineSimilarity(queryEmbedding, embedding)
        
        if (similarity > 0.5) { // 類似度閾値
          results.push({
            id,
            content: document.content,
            metadata: document.metadata,
            distance: 1 - similarity
          })
        }
      }

      // 類似度でソート（距離の昇順）
      results.sort((a, b) => a.distance - b.distance)
      
      return results.slice(0, limit)
    } catch (error) {
      console.error('Failed to search by embedding:', error)
      return []
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i]
      normA += vecA[i] * vecA[i]
      normB += vecB[i] * vecB[i]
    }

    normA = Math.sqrt(normA)
    normB = Math.sqrt(normB)

    if (normA === 0 || normB === 0) {
      return 0
    }

    return dotProduct / (normA * normB)
  }

  getDocumentCount(): number {
    return this.documents.size
  }

  clear(): void {
    this.documents.clear()
    this.embeddings.clear()
  }
}
