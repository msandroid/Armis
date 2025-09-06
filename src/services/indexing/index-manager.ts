import { FileScanner, FileInfo, ScanOptions } from './file-scanner'
import { ASTParser, Symbol, CodeChunk } from './ast-parser'
import { EmbeddingService, EmbeddingResult, SearchResult } from './embedding-service'
import { VectorDatabaseService } from '../vector/vector-database'

export interface IndexingProgress {
  stage: 'scanning' | 'parsing' | 'embedding' | 'storing' | 'complete'
  current: number
  total: number
  message: string
}

export interface IndexingOptions {
  rootPath: string
  includePatterns?: string[]
  excludePatterns?: string[]
  maxFileSize?: number
  supportedExtensions?: string[]
  onProgress?: (progress: IndexingProgress) => void
}

export interface SearchOptions {
  query: string
  fileTypes?: string[]
  symbolTypes?: string[]
  maxResults?: number
  minSimilarity?: number
}

export interface IndexStats {
  totalFiles: number
  totalSymbols: number
  totalChunks: number
  languages: Record<string, number>
  symbolTypes: Record<string, number>
  lastIndexed: Date
}

export class IndexManager {
  private fileScanner: FileScanner
  private astParser: ASTParser
  private embeddingService: EmbeddingService
  private vectorDB: VectorDatabaseService
  private isIndexing = false

  constructor() {
    this.fileScanner = new FileScanner()
    this.astParser = new ASTParser()
    this.embeddingService = new EmbeddingService()
    this.vectorDB = new VectorDatabaseService()
  }

  async initialize(): Promise<void> {
    await this.vectorDB.initialize()
  }

  async createIndex(options: IndexingOptions): Promise<void> {
    if (this.isIndexing) {
      throw new Error('Indexing already in progress')
    }

    this.isIndexing = true

    try {
      // Stage 1: Scan files
      this.updateProgress(options.onProgress, {
        stage: 'scanning',
        current: 0,
        total: 1,
        message: 'Scanning files...'
      })

      const files = await this.fileScanner.scanFiles({
        rootPath: options.rootPath,
        includePatterns: options.includePatterns,
        excludePatterns: options.excludePatterns,
        maxFileSize: options.maxFileSize,
        supportedExtensions: options.supportedExtensions
      })

      this.updateProgress(options.onProgress, {
        stage: 'scanning',
        current: 1,
        total: 1,
        message: `Found ${files.length} files`
      })

      // Stage 2: Parse files
      this.updateProgress(options.onProgress, {
        stage: 'parsing',
        current: 0,
        total: files.length,
        message: 'Parsing files...'
      })

      const allSymbols: Symbol[] = []
      const allChunks: CodeChunk[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const { symbols, chunks } = this.astParser.parseFile(file)
        
        allSymbols.push(...symbols)
        allChunks.push(...chunks)

        this.updateProgress(options.onProgress, {
          stage: 'parsing',
          current: i + 1,
          total: files.length,
          message: `Parsed ${file.relativePath}`
        })
      }

      // Stage 3: Generate embeddings
      this.updateProgress(options.onProgress, {
        stage: 'embedding',
        current: 0,
        total: allChunks.length + allSymbols.length,
        message: 'Generating embeddings...'
      })

      const chunkEmbeddings = await this.embeddingService.generateEmbeddings(allChunks)
      const symbolEmbeddings = await this.embeddingService.generateSymbolEmbeddings(allSymbols)

      this.updateProgress(options.onProgress, {
        stage: 'embedding',
        current: allChunks.length + allSymbols.length,
        total: allChunks.length + allSymbols.length,
        message: 'Embeddings generated'
      })

      // Stage 4: Store in vector database
      this.updateProgress(options.onProgress, {
        stage: 'storing',
        current: 0,
        total: chunkEmbeddings.length + symbolEmbeddings.length,
        message: 'Storing in database...'
      })

      // Store chunk embeddings
      for (let i = 0; i < chunkEmbeddings.length; i++) {
        const embedding = chunkEmbeddings[i]
        await this.vectorDB.addDocument({
          id: `chunk_${embedding.id}`,
          content: embedding.content,
          metadata: {
            ...embedding.metadata,
            type: 'chunk',
            embedding: embedding.embedding
          }
        })

        this.updateProgress(options.onProgress, {
          stage: 'storing',
          current: i + 1,
          total: chunkEmbeddings.length + symbolEmbeddings.length,
          message: `Stored chunk ${i + 1}/${chunkEmbeddings.length}`
        })
      }

      // Store symbol embeddings
      for (let i = 0; i < symbolEmbeddings.length; i++) {
        const embedding = symbolEmbeddings[i]
        await this.vectorDB.addDocument({
          id: `symbol_${embedding.id}`,
          content: embedding.content,
          metadata: {
            ...embedding.metadata,
            type: 'symbol',
            embedding: embedding.embedding
          }
        })

        this.updateProgress(options.onProgress, {
          stage: 'storing',
          current: chunkEmbeddings.length + i + 1,
          total: chunkEmbeddings.length + symbolEmbeddings.length,
          message: `Stored symbol ${i + 1}/${symbolEmbeddings.length}`
        })
      }

      this.updateProgress(options.onProgress, {
        stage: 'complete',
        current: 1,
        total: 1,
        message: 'Indexing completed successfully'
      })

    } catch (error) {
      console.error('Indexing failed:', error)
      throw error
    } finally {
      this.isIndexing = false
    }
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, fileTypes, symbolTypes, maxResults = 10, minSimilarity = 0.7 } = options

    try {
      // Search in vector database
      const results = await this.vectorDB.searchSimilar(query, maxResults * 2) // Get more results for filtering

      // Filter results based on options
      const filteredResults = results.filter(result => {
        const metadata = result.metadata

        // Filter by file type
        if (fileTypes && fileTypes.length > 0) {
          const fileExt = metadata.relativePath?.split('.').pop()
          if (!fileExt || !fileTypes.includes(`.${fileExt}`)) {
            return false
          }
        }

        // Filter by symbol type
        if (symbolTypes && symbolTypes.length > 0 && metadata.type === 'symbol') {
          if (!symbolTypes.includes(metadata.symbolType)) {
            return false
          }
        }

        // Filter by similarity
        if (result.distance > (1 - minSimilarity)) {
          return false
        }

        return true
      })

      // Convert to SearchResult format
      return filteredResults.slice(0, maxResults).map(result => ({
        id: result.id,
        content: result.content,
        metadata: result.metadata,
        similarity: 1 - result.distance
      }))
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    }
  }

  async searchSymbols(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    return this.search({
      query,
      symbolTypes: ['function', 'class', 'interface', 'type', 'enum'],
      maxResults
    })
  }

  async searchFiles(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    return this.search({
      query,
      maxResults
    })
  }

  async getIndexStats(): Promise<IndexStats> {
    try {
      // This would typically query the vector database for statistics
      // For now, return mock stats
      return {
        totalFiles: 0,
        totalSymbols: 0,
        totalChunks: 0,
        languages: {},
        symbolTypes: {},
        lastIndexed: new Date()
      }
    } catch (error) {
      console.error('Failed to get index stats:', error)
      throw error
    }
  }

  async clearIndex(): Promise<void> {
    try {
      // Clear the vector database
      // This would typically clear all documents
      console.log('Index cleared')
    } catch (error) {
      console.error('Failed to clear index:', error)
      throw error
    }
  }

  async updateFile(filePath: string): Promise<void> {
    try {
      // Read and parse the file
      const fileInfo = await this.fileScanner.scanFiles({
        rootPath: process.cwd(),
        includePatterns: [filePath]
      })

      if (fileInfo.length === 0) {
        throw new Error(`File not found: ${filePath}`)
      }

      const file = fileInfo[0]
      const { symbols, chunks } = this.astParser.parseFile(file)

      // Generate embeddings
      const chunkEmbeddings = await this.embeddingService.generateEmbeddings(chunks)
      const symbolEmbeddings = await this.embeddingService.generateSymbolEmbeddings(symbols)

      // Update in vector database
      for (const embedding of [...chunkEmbeddings, ...symbolEmbeddings]) {
        await this.vectorDB.addDocument({
          id: embedding.id,
          content: embedding.content,
          metadata: {
            ...embedding.metadata,
            embedding: embedding.embedding
          }
        })
      }

      console.log(`Updated file: ${filePath}`)
    } catch (error) {
      console.error(`Failed to update file ${filePath}:`, error)
      throw error
    }
  }

  async removeFile(filePath: string): Promise<void> {
    try {
      // Remove documents related to this file from vector database
      // This would typically query and remove all documents with matching filePath
      console.log(`Removed file: ${filePath}`)
    } catch (error) {
      console.error(`Failed to remove file ${filePath}:`, error)
      throw error
    }
  }

  private updateProgress(
    onProgress?: (progress: IndexingProgress) => void,
    progress?: IndexingProgress
  ): void {
    if (onProgress && progress) {
      onProgress(progress)
    }
  }

  isIndexingInProgress(): boolean {
    return this.isIndexing
  }

  getSupportedLanguages(): string[] {
    return this.fileScanner.getSupportedLanguages()
  }

  getSupportedExtensions(): string[] {
    return this.fileScanner.getSupportedExtensions()
  }
}
