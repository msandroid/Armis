import { LlamaService } from '@/services/llm/llama-service'
import { 
  ChatOpenAI
} from '@langchain/openai'
import { 
  PromptTemplate 
} from '@langchain/core/prompts'
import { 
  StructuredOutputParser 
} from '@langchain/core/output_parsers'
import { z } from 'zod'

// RAGドキュメントの定義
export interface RAGDocument {
  id: string
  content: string
  metadata: Record<string, any>
  chunks: RAGChunk[]
  embeddings?: number[][]
  structure?: DocumentStructure
}

// RAGチャンクの定義
export interface RAGChunk {
  id: string
  content: string
  metadata: {
    chunk_index: number
    start_position: number
    end_position: number
    chunk_type: 'paragraph' | 'heading' | 'list' | 'table' | 'code'
  }
  embedding?: number[]
  keywords?: string[]
  entities?: Array<{
    text: string
    type: string
    confidence: number
  }>
}

// ドキュメント構造の定義
export interface DocumentStructure {
  sections: Section[]
  hierarchy: HierarchyNode[]
  relationships: Relationship[]
  patterns: Pattern[]
}

export interface Section {
  id: string
  title: string
  content: string
  level: number
  start_position: number
  end_position: number
  children: string[]
  keywords: string[]
  summary: string
}

export interface HierarchyNode {
  id: string
  type: 'section' | 'subsection' | 'paragraph' | 'list' | 'table'
  title: string
  level: number
  children: string[]
  parent?: string
}

export interface Relationship {
  source: string
  target: string
  type: 'references' | 'defines' | 'examples' | 'contradicts' | 'supports'
  confidence: number
  context: string
}

export interface Pattern {
  type: 'repetition' | 'sequence' | 'contrast' | 'causation' | 'definition'
  elements: string[]
  frequency: number
  confidence: number
  description: string
}

// 検索結果の定義
export interface RAGSearchResult {
  chunk: RAGChunk
  score: number
  relevance_factors: {
    semantic_similarity: number
    keyword_match: number
    structural_relevance: number
  }
  context: {
    surrounding_chunks: RAGChunk[]
    section_context: Section | null
  }
}

// 構造抽出結果の定義
export interface StructureExtractionResult {
  structure: DocumentStructure
  confidence: number
  extraction_methods: string[]
  validation_results: {
    is_valid: boolean
    issues: string[]
    suggestions: string[]
  }
  metadata: {
    extraction_time: number
    chunk_count: number
    section_count: number
  }
}

export class RAGFromScratchService {
  private llamaService: LlamaService
  private langchainLLM: ChatOpenAI | null = null
  private documents: Map<string, RAGDocument> = new Map()
  private chunkIndex: Map<string, RAGChunk[]> = new Map()
  private isInitialized = false

  constructor(llamaService: LlamaService) {
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
    try {
      this.isInitialized = true
      console.log('RAG from Scratch service initialized')
    } catch (error) {
      console.error('Failed to initialize RAG from Scratch service:', error)
      throw error
    }
  }

  // ドキュメントの追加と構造抽出
  async addDocument(content: string, metadata?: Record<string, any>): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('RAG from Scratch service not initialized')
    }

    try {
      const docId = this.generateDocumentId()
      
      // チャンク分割
      const chunks = await this.chunkDocument(content)
      
      // 構造抽出
      const structure = await this.extractStructure(content, chunks)
      
      // エンベディング生成
      const embeddings = await this.generateEmbeddings(chunks)
      
      // ドキュメント作成
      const document: RAGDocument = {
        id: docId,
        content,
        metadata: metadata || {},
        chunks,
        embeddings,
        structure
      }

      this.documents.set(docId, document)
      this.chunkIndex.set(docId, chunks)

      console.log(`Document ${docId} added with ${chunks.length} chunks`)
      return docId
    } catch (error) {
      console.error('Failed to add document:', error)
      throw error
    }
  }

  // チャンク分割
  private async chunkDocument(content: string): Promise<RAGChunk[]> {
    const chunks: RAGChunk[] = []
    const lines = content.split('\n')
    let currentChunk = ''
    let chunkIndex = 0
    let startPosition = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmedLine = line.trim()

      // チャンクの境界を決定
      const shouldStartNewChunk = this.shouldStartNewChunk(trimmedLine, currentChunk)
      
      if (shouldStartNewChunk && currentChunk.trim()) {
        // 現在のチャンクを保存
        const chunk: RAGChunk = {
          id: `chunk_${chunkIndex}`,
          content: currentChunk.trim(),
          metadata: {
            chunk_index: chunkIndex,
            start_position: startPosition,
            end_position: startPosition + currentChunk.length,
            chunk_type: this.determineChunkType(currentChunk)
          }
        }

        // チャンクの詳細分析
        const enrichedChunk = await this.enrichChunk(chunk)
        chunks.push(enrichedChunk)

        // 新しいチャンクを開始
        currentChunk = line
        startPosition = content.indexOf(line, startPosition)
        chunkIndex++
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line
      }
    }

    // 最後のチャンクを処理
    if (currentChunk.trim()) {
      const chunk: RAGChunk = {
        id: `chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        metadata: {
          chunk_index: chunkIndex,
          start_position: startPosition,
          end_position: startPosition + currentChunk.length,
          chunk_type: this.determineChunkType(currentChunk)
        }
      }

      const enrichedChunk = await this.enrichChunk(chunk)
      chunks.push(enrichedChunk)
    }

    return chunks
  }

  // チャンク開始の判定
  private shouldStartNewChunk(line: string, currentChunk: string): boolean {
    // 見出しの検出
    if (line.match(/^#{1,6}\s+/)) return true
    
    // 大きな段落の分割（500文字以上）
    if (currentChunk.length > 500) return true
    
    // リストの開始
    if (line.match(/^[\s]*[-*+]\s+/) || line.match(/^[\s]*\d+\.\s+/)) return true
    
    return false
  }

  // チャンクタイプの判定
  private determineChunkType(content: string): RAGChunk['metadata']['chunk_type'] {
    if (content.match(/^#{1,6}\s+/)) return 'heading'
    if (content.match(/^[\s]*[-*+]\s+/) || content.match(/^[\s]*\d+\.\s+/)) return 'list'
    if (content.includes('|') && content.split('\n').some(line => line.includes('|'))) return 'table'
    if (content.includes('```') || content.includes('`')) return 'code'
    return 'paragraph'
  }

  // チャンクの詳細分析
  private async enrichChunk(chunk: RAGChunk): Promise<RAGChunk> {
    const enrichedChunk = { ...chunk }

    // キーワード抽出
    enrichedChunk.keywords = this.extractKeywords(chunk.content)

    // エンティティ抽出
    enrichedChunk.entities = this.extractEntities(chunk.content)

    // エンベディング生成
    enrichedChunk.embedding = await this.generateEmbedding(chunk.content)

    return enrichedChunk
  }

  // 構造抽出
  private async extractStructure(content: string, chunks: RAGChunk[]): Promise<DocumentStructure> {
    try {
      // セクション抽出
      const sections = await this.extractSections(content, chunks)
      
      // 階層構造の構築
      const hierarchy = this.buildHierarchy(sections, chunks)
      
      // 関係性の抽出
      const relationships = await this.extractRelationships(chunks, sections)
      
      // パターンの検出
      const patterns = this.detectPatterns(content, chunks)

      return {
        sections,
        hierarchy,
        relationships,
        patterns
      }
    } catch (error) {
      console.error('Structure extraction error:', error)
      return this.createDefaultStructure(chunks)
    }
  }

  // セクション抽出
  private async extractSections(content: string, chunks: RAGChunk[]): Promise<Section[]> {
    const sections: Section[] = []
    let currentSection: Partial<Section> | null = null

    for (const chunk of chunks) {
      if (chunk.metadata.chunk_type === 'heading') {
        // 前のセクションを保存
        if (currentSection) {
          sections.push(currentSection as Section)
        }

        // 新しいセクションを開始
        const level = this.getHeadingLevel(chunk.content)
        currentSection = {
          id: `section_${sections.length}`,
          title: chunk.content.replace(/^#{1,6}\s+/, ''),
          content: chunk.content,
          level,
          start_position: chunk.metadata.start_position,
          end_position: chunk.metadata.end_position,
          children: [],
          keywords: chunk.keywords || [],
          summary: await this.generateSummary(chunk.content)
        }
      } else if (currentSection) {
        // 現在のセクションにコンテンツを追加
        currentSection.content += '\n' + chunk.content
        currentSection.end_position = chunk.metadata.end_position
        currentSection.children.push(chunk.id)
      }
    }

    // 最後のセクションを保存
    if (currentSection) {
      sections.push(currentSection as Section)
    }

    return sections
  }

  // 見出しレベルの取得
  private getHeadingLevel(content: string): number {
    const match = content.match(/^(#{1,6})\s+/)
    return match ? match[1].length : 1
  }

  // 要約生成
  private async generateSummary(content: string): Promise<string> {
    try {
      if (this.langchainLLM) {
        const prompt = PromptTemplate.fromTemplate(`
以下のテキストを簡潔に要約してください（50文字以内）:

{content}

要約:
        `)

        const chain = prompt.pipe(this.langchainLLM)
        const result = await chain.invoke({ content })
        
        return typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
      } else {
        // フォールバック: 簡易的な要約
        const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0)
        return sentences.slice(0, 1).join('。') + '。'
      }
    } catch (error) {
      console.error('Summary generation error:', error)
      return content.substring(0, 50) + '...'
    }
  }

  // 階層構造の構築
  private buildHierarchy(sections: Section[], chunks: RAGChunk[]): HierarchyNode[] {
    const hierarchy: HierarchyNode[] = []

    // セクションの階層を構築
    sections.forEach(section => {
      const node: HierarchyNode = {
        id: section.id,
        type: 'section',
        title: section.title,
        level: section.level,
        children: section.children,
        parent: this.findParentSection(section, sections)
      }
      hierarchy.push(node)
    })

    return hierarchy
  }

  // 親セクションの検索
  private findParentSection(section: Section, sections: Section[]): string | undefined {
    for (let i = sections.indexOf(section) - 1; i >= 0; i--) {
      if (sections[i].level < section.level) {
        return sections[i].id
      }
    }
    return undefined
  }

  // 関係性の抽出
  private async extractRelationships(chunks: RAGChunk[], sections: Section[]): Promise<Relationship[]> {
    const relationships: Relationship[] = []

    // 簡易的な関係性抽出
    for (let i = 0; i < chunks.length; i++) {
      for (let j = i + 1; j < chunks.length; j++) {
        const chunk1 = chunks[i]
        const chunk2 = chunks[j]

        // キーワードの重複をチェック
        const commonKeywords = chunk1.keywords?.filter(k => 
          chunk2.keywords?.includes(k)
        ) || []

        if (commonKeywords.length > 0) {
          relationships.push({
            source: chunk1.id,
            target: chunk2.id,
            type: 'references',
            confidence: commonKeywords.length / Math.max(chunk1.keywords?.length || 1, chunk2.keywords?.length || 1),
            context: `共通キーワード: ${commonKeywords.join(', ')}`
          })
        }
      }
    }

    return relationships
  }

  // パターンの検出
  private detectPatterns(content: string, chunks: RAGChunk[]): Pattern[] {
    const patterns: Pattern[] = []

    // 繰り返しパターンの検出
    const repetitionPattern = this.detectRepetitionPattern(chunks)
    if (repetitionPattern) patterns.push(repetitionPattern)

    // シーケンスパターンの検出
    const sequencePattern = this.detectSequencePattern(chunks)
    if (sequencePattern) patterns.push(sequencePattern)

    return patterns
  }

  // 繰り返しパターンの検出
  private detectRepetitionPattern(chunks: RAGChunk[]): Pattern | null {
    const phraseCount = new Map<string, number>()
    
    chunks.forEach(chunk => {
      const phrases = this.extractPhrases(chunk.content)
      phrases.forEach(phrase => {
        phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1)
      })
    })

    const repeatedPhrases = Array.from(phraseCount.entries())
      .filter(([_, count]) => count > 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    if (repeatedPhrases.length > 0) {
      return {
        type: 'repetition',
        elements: repeatedPhrases.map(([phrase]) => phrase),
        frequency: repeatedPhrases[0][1],
        confidence: 0.8,
        description: `繰り返しフレーズ: ${repeatedPhrases.map(([phrase, count]) => `${phrase}(${count}回)`).join(', ')}`
      }
    }

    return null
  }

  // シーケンスパターンの検出
  private detectSequencePattern(chunks: RAGChunk[]): Pattern | null {
    const numberedChunks = chunks.filter(chunk => 
      chunk.content.match(/^\d+\.\s+/) || chunk.content.match(/^第\d+[章節]/)
    )

    if (numberedChunks.length > 2) {
      return {
        type: 'sequence',
        elements: numberedChunks.map(chunk => chunk.id),
        frequency: numberedChunks.length,
        confidence: 0.9,
        description: `番号付きシーケンス: ${numberedChunks.length}個の項目`
      }
    }

    return null
  }

  // フレーズ抽出
  private extractPhrases(content: string): string[] {
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0)
    const phrases: string[] = []

    sentences.forEach(sentence => {
      const words = sentence.split(/\s+/)
      for (let i = 0; i < words.length - 2; i++) {
        phrases.push(words.slice(i, i + 3).join(' '))
      }
    })

    return phrases
  }

  // デフォルト構造の作成
  private createDefaultStructure(chunks: RAGChunk[]): DocumentStructure {
    return {
      sections: [],
      hierarchy: chunks.map(chunk => ({
        id: chunk.id,
        type: chunk.metadata.chunk_type as any,
        title: chunk.content.substring(0, 50),
        level: 1,
        children: [],
        parent: undefined
      })),
      relationships: [],
      patterns: []
    }
  }

  // エンベディング生成
  private async generateEmbeddings(chunks: RAGChunk[]): Promise<number[][]> {
    const embeddings: number[][] = []
    
    for (const chunk of chunks) {
      const embedding = await this.generateEmbedding(chunk.content)
      embeddings.push(embedding)
    }

    return embeddings
  }

  private async generateEmbedding(content: string): Promise<number[]> {
    // 簡易的なエンベディング生成
    const words = content.toLowerCase().split(/\s+/)
    const embedding = new Array(128).fill(0)
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word)
      embedding[hash % 128] += 1
    })

    // 正規化
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => val / magnitude)
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  // キーワード抽出
  private extractKeywords(content: string): string[] {
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

  // エンティティ抽出
  private extractEntities(content: string): Array<{ text: string; type: string; confidence: number }> {
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

  // 検索機能
  async search(query: string, documentId?: string, limit: number = 10): Promise<RAGSearchResult[]> {
    if (!this.isInitialized) {
      throw new Error('RAG from Scratch service not initialized')
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query)
      const results: RAGSearchResult[] = []

      const targetDocuments = documentId 
        ? [this.documents.get(documentId)].filter(Boolean)
        : Array.from(this.documents.values())

      for (const document of targetDocuments) {
        if (!document) continue

        for (let i = 0; i < document.chunks.length; i++) {
          const chunk = document.chunks[i]
          const embedding = document.embeddings?.[i] || await this.generateEmbedding(chunk.content)

          // 類似度計算
          const semanticSimilarity = this.calculateCosineSimilarity(queryEmbedding, embedding)
          const keywordMatch = this.calculateKeywordMatch(query, chunk.keywords || [])
          const structuralRelevance = this.calculateStructuralRelevance(chunk, document.structure)

          const score = semanticSimilarity * 0.5 + keywordMatch * 0.3 + structuralRelevance * 0.2

          if (score > 0.1) {
            results.push({
              chunk,
              score,
              relevance_factors: {
                semantic_similarity: semanticSimilarity,
                keyword_match: keywordMatch,
                structural_relevance: structuralRelevance
              },
              context: {
                surrounding_chunks: this.getSurroundingChunks(chunk, document.chunks),
                section_context: this.getSectionContext(chunk, document.structure)
              }
            })
          }
        }
      }

      // スコアでソート
      results.sort((a, b) => b.score - a.score)
      
      return results.slice(0, limit)
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }

  // コサイン類似度計算
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  // キーワードマッチ計算
  private calculateKeywordMatch(query: string, keywords: string[]): number {
    const queryWords = query.toLowerCase().split(/\s+/)
    const matches = queryWords.filter(word => 
      keywords.some(keyword => keyword.includes(word) || word.includes(keyword))
    )
    return matches.length / queryWords.length
  }

  // 構造的関連性計算
  private calculateStructuralRelevance(chunk: RAGChunk, structure?: DocumentStructure): number {
    if (!structure) return 0.5

    // 見出しチャンクは高スコア
    if (chunk.metadata.chunk_type === 'heading') return 0.9

    // セクション内の位置を考慮
    const section = this.getSectionContext(chunk, structure)
    if (section) return 0.8

    return 0.5
  }

  // 周辺チャンクの取得
  private getSurroundingChunks(chunk: RAGChunk, chunks: RAGChunk[]): RAGChunk[] {
    const chunkIndex = chunks.findIndex(c => c.id === chunk.id)
    if (chunkIndex === -1) return []

    const start = Math.max(0, chunkIndex - 1)
    const end = Math.min(chunks.length, chunkIndex + 2)
    
    return chunks.slice(start, end).filter(c => c.id !== chunk.id)
  }

  // セクションコンテキストの取得
  private getSectionContext(chunk: RAGChunk, structure?: DocumentStructure): Section | null {
    if (!structure) return null

    return structure.sections.find(section => 
      chunk.metadata.start_position >= section.start_position &&
      chunk.metadata.end_position <= section.end_position
    ) || null
  }

  // 構造抽出の実行
  async extractStructureFromDocument(documentId: string): Promise<StructureExtractionResult> {
    const document = this.documents.get(documentId)
    if (!document) {
      throw new Error(`Document ${documentId} not found`)
    }

    const startTime = Date.now()

    try {
      // 構造抽出の実行
      const structure = await this.extractStructure(document.content, document.chunks)
      
      // ドキュメントの構造を更新
      document.structure = structure
      this.documents.set(documentId, document)

      const extractionTime = Date.now() - startTime

      // 検証結果の生成
      const validationResults = this.validateStructure(structure)

      return {
        structure,
        confidence: this.calculateStructureConfidence(structure),
        extraction_methods: ['chunk_analysis', 'hierarchy_building', 'relationship_extraction', 'pattern_detection'],
        validation_results: validationResults,
        metadata: {
          extraction_time: extractionTime,
          chunk_count: document.chunks.length,
          section_count: structure.sections.length
        }
      }
    } catch (error) {
      console.error('Structure extraction error:', error)
      throw error
    }
  }

  // 構造の妥当性検証
  private validateStructure(structure: DocumentStructure): {
    is_valid: boolean
    issues: string[]
    suggestions: string[]
  } {
    const issues: string[] = []
    const suggestions: string[] = []

    // セクションの検証
    if (structure.sections.length === 0) {
      issues.push("セクションが見つかりません")
    }

    // 階層の検証
    if (structure.hierarchy.length === 0) {
      issues.push("階層構造が構築できませんでした")
    }

    // 関係性の検証
    if (structure.relationships.length === 0) {
      suggestions.push("関係性の抽出を改善することを推奨します")
    }

    return {
      is_valid: issues.length === 0,
      issues,
      suggestions
    }
  }

  // 構造信頼度の計算
  private calculateStructureConfidence(structure: DocumentStructure): number {
    let confidence = 0
    let totalFactors = 0

    // セクションの信頼度
    if (structure.sections.length > 0) {
      confidence += 0.4
      totalFactors++
    }

    // 階層の信頼度
    if (structure.hierarchy.length > 0) {
      confidence += 0.4
      totalFactors++
    }

    // 関係性の信頼度
    if (structure.relationships.length > 0) {
      confidence += 0.2
      totalFactors++
    }

    return totalFactors > 0 ? confidence / totalFactors : 0
  }

  // ユーティリティメソッド
  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 公開API
  getDocument(documentId: string): RAGDocument | null {
    return this.documents.get(documentId) || null
  }

  getAllDocuments(): RAGDocument[] {
    return Array.from(this.documents.values())
  }

  removeDocument(documentId: string): void {
    this.documents.delete(documentId)
    this.chunkIndex.delete(documentId)
  }

  clearDocuments(): void {
    this.documents.clear()
    this.chunkIndex.clear()
  }

  getDocumentStats(): {
    totalDocuments: number
    totalChunks: number
    averageChunksPerDocument: number
  } {
    const totalDocuments = this.documents.size
    const totalChunks = Array.from(this.documents.values())
      .reduce((sum, doc) => sum + doc.chunks.length, 0)
    const averageChunksPerDocument = totalDocuments > 0 ? totalChunks / totalDocuments : 0

    return {
      totalDocuments,
      totalChunks,
      averageChunksPerDocument
    }
  }
}
