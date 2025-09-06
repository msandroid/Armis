import { CodeChunk, Symbol } from './ast-parser'

export interface EmbeddingResult {
  id: string
  embedding: number[]
  content: string
  metadata: Record<string, any>
}

export interface SearchResult {
  id: string
  content: string
  metadata: Record<string, any>
  similarity: number
}

export class EmbeddingService {
  private batchSize = 100
  private maxRetries = 3

  async generateEmbeddings(chunks: CodeChunk[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = []
    
    // Process chunks in batches
    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const batch = chunks.slice(i, i + this.batchSize)
      const batchResults = await this.processBatch(batch)
      results.push(...batchResults)
    }

    return results
  }

  private async processBatch(chunks: CodeChunk[]): Promise<EmbeddingResult[]> {
    const texts = chunks.map(chunk => this.prepareTextForEmbedding(chunk))
    
    try {
      // ブラウザ環境では簡易的なハッシュベースのエンベディングを使用
      const embeddings = texts.map(text => this.generateSimpleEmbedding(text))

      return chunks.map((chunk, index) => ({
        id: chunk.id,
        embedding: embeddings[index],
        content: chunk.content,
        metadata: this.extractMetadata(chunk)
      }))
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw error
    }
  }

  private generateSimpleEmbedding(text: string): number[] {
    // 簡易的なハッシュベースのエンベディング（実際のAIエンベディングの代わり）
    const hash = this.simpleHash(text)
    const embedding: number[] = []
    
    // 128次元のベクトルを生成
    for (let i = 0; i < 128; i++) {
      const seed = hash + i * 31
      embedding.push(Math.sin(seed) * 0.5 + 0.5)
    }
    
    return embedding
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  private prepareTextForEmbedding(chunk: CodeChunk): string {
    const lines = chunk.content.split('\n')
    const symbolNames = chunk.symbols.map(s => s.name).join(', ')
    
    // Create a structured representation for better embedding
    const structuredText = `
File: ${chunk.relativePath}
Language: ${chunk.language}
Type: ${chunk.type}
Symbols: ${symbolNames}
Lines: ${chunk.startLine}-${chunk.endLine}

Code:
${chunk.content}
    `.trim()

    return structuredText
  }

  private extractMetadata(chunk: CodeChunk): Record<string, any> {
    return {
      filePath: chunk.filePath,
      relativePath: chunk.relativePath,
      language: chunk.language,
      type: chunk.type,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      symbols: chunk.symbols.map(s => ({
        name: s.name,
        type: s.type,
        line: s.line,
        signature: s.signature
      })),
      symbolCount: chunk.symbols.length,
      contentLength: chunk.content.length
    }
  }

  async generateSymbolEmbeddings(symbols: Symbol[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = []
    
    for (let i = 0; i < symbols.length; i += this.batchSize) {
      const batch = symbols.slice(i, i + this.batchSize)
      const batchResults = await this.processSymbolBatch(batch)
      results.push(...batchResults)
    }

    return results
  }

  private async processSymbolBatch(symbols: Symbol[]): Promise<EmbeddingResult[]> {
    const texts = symbols.map(symbol => this.prepareSymbolText(symbol))
    
    try {
      // ブラウザ環境では簡易的なハッシュベースのエンベディングを使用
      const embeddings = texts.map(text => this.generateSimpleEmbedding(text))

      return symbols.map((symbol, index) => ({
        id: `symbol_${symbol.filePath}_${symbol.name}_${symbol.line}`,
        embedding: embeddings[index],
        content: symbol.name,
        metadata: this.extractSymbolMetadata(symbol)
      }))
    } catch (error) {
      console.error('Error generating symbol embeddings:', error)
      throw error
    }
  }

  private prepareSymbolText(symbol: Symbol): string {
    const signature = symbol.signature || symbol.name
    const scope = symbol.scope || 'unknown'
    
    return `
Symbol: ${symbol.name}
Type: ${symbol.type}
File: ${symbol.relativePath}
Language: ${symbol.language}
Scope: ${scope}
Signature: ${signature}
Line: ${symbol.line}
    `.trim()
  }

  private extractSymbolMetadata(symbol: Symbol): Record<string, any> {
    return {
      name: symbol.name,
      type: symbol.type,
      filePath: symbol.filePath,
      relativePath: symbol.relativePath,
      language: symbol.language,
      line: symbol.line,
      column: symbol.column,
      signature: symbol.signature,
      scope: symbol.scope,
      imports: symbol.imports,
      exports: symbol.exports
    }
  }

  async searchSimilar(
    query: string,
    embeddings: EmbeddingResult[],
    topK: number = 10
  ): Promise<SearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = this.generateSimpleEmbedding(query)

      // Calculate similarities
      const similarities = embeddings.map(embedding => ({
        ...embedding,
        similarity: this.cosineSimilarity(queryEmbedding, embedding.embedding)
      }))

      // Sort by similarity and return top K results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(({ embedding, ...result }) => result)
    } catch (error) {
      console.error('Error searching similar embeddings:', error)
      throw error
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length')
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

  async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      return this.generateSimpleEmbedding(query)
    } catch (error) {
      console.error('Error generating query embedding:', error)
      throw error
    }
  }

  // Utility method to chunk large texts for embedding
  chunkText(text: string, maxChunkSize: number = 1000): string[] {
    const chunks: string[] = []
    const lines = text.split('\n')
    let currentChunk = ''

    for (const line of lines) {
      if ((currentChunk + line).length > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = line
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim())
    }

    return chunks
  }
}
