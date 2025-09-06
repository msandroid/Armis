import { VectorDatabaseService } from '@/services/vector/vector-database'
import { v4 as uuidv4 } from 'uuid'

export interface MemoryEntry {
  id: string
  content: string
  importance: number // 0-1
  timestamp: Date
  sourceAgent: string
  context: Record<string, any>
  tags: string[]
  expiresAt?: Date
  accessCount: number
  lastAccessed: Date
}

export interface ContextManager {
  sessionId: string
  currentContext: Record<string, any>
  contextHistory: Array<{
    timestamp: Date
    context: Record<string, any>
    trigger: string
  }>
}

export interface ImportanceEvaluator {
  evaluateImportance(content: string, context: Record<string, any>): Promise<number>
  updateImportance(memoryId: string, newImportance: number): Promise<void>
  decayImportance(memoryId: string, decayRate: number): Promise<void>
}

export class MultiAgentMemory {
  private sharedMemory: Map<string, MemoryEntry> = new Map()
  private vectorDB: VectorDatabaseService
  private contextManager: ContextManager
  private importanceEvaluator: ImportanceEvaluator
  private memoryConfig: {
    maxSharedMemorySize: number
    importanceDecayRate: number
    contextRetentionDays: number
    autoCleanupInterval: number
  }

  constructor(
    vectorDB: VectorDatabaseService,
    config?: Partial<MultiAgentMemory['memoryConfig']>
  ) {
    this.vectorDB = vectorDB
    this.memoryConfig = {
      maxSharedMemorySize: 1000,
      importanceDecayRate: 0.1,
      contextRetentionDays: 30,
      autoCleanupInterval: 24 * 60 * 60 * 1000, // 24時間
      ...config
    }
    
    this.contextManager = {
      sessionId: uuidv4(),
      currentContext: {},
      contextHistory: []
    }
    
    this.importanceEvaluator = new DefaultImportanceEvaluator()
    
    // 自動クリーンアップの設定
    this.setupAutoCleanup()
  }

  /**
   * 共有メモリに情報を追加
   */
  async addToSharedMemory(
    content: string,
    sourceAgent: string,
    context: Record<string, any> = {},
    tags: string[] = []
  ): Promise<string> {
    const memoryId = uuidv4()
    const importance = await this.importanceEvaluator.evaluateImportance(content, context)
    
    const memoryEntry: MemoryEntry = {
      id: memoryId,
      content,
      importance,
      timestamp: new Date(),
      sourceAgent,
      context,
      tags,
      accessCount: 0,
      lastAccessed: new Date()
    }

    this.sharedMemory.set(memoryId, memoryEntry)
    
    // ベクターデータベースにも保存
    await this.vectorDB.addDocument({
      id: memoryId,
      content,
      metadata: {
        type: 'shared_memory',
        sourceAgent,
        importance,
        tags,
        timestamp: memoryEntry.timestamp.toISOString()
      }
    })

    // メモリサイズ制限のチェック
    await this.enforceMemoryLimit()

    return memoryId
  }

  /**
   * 共有メモリから情報を検索
   */
  async searchSharedMemory(
    query: string,
    limit: number = 10,
    minImportance: number = 0.3
  ): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = []

    // ベクターデータベースで検索
    const vectorResults = await this.vectorDB.searchSimilar(query, limit * 2)
    
    for (const result of vectorResults) {
      const memoryEntry = this.sharedMemory.get(result.id)
      if (memoryEntry && memoryEntry.importance >= minImportance) {
        // アクセス回数を更新
        memoryEntry.accessCount++
        memoryEntry.lastAccessed = new Date()
        
        results.push(memoryEntry)
        
        if (results.length >= limit) break
      }
    }

    // 重要度でソート
    results.sort((a, b) => b.importance - a.importance)
    
    return results
  }

  /**
   * 長期記憶に情報を追加
   */
  async addToLongTermMemory(
    content: string,
    sourceAgent: string,
    context: Record<string, any> = {},
    tags: string[] = []
  ): Promise<string> {
    const memoryId = uuidv4()
    const importance = await this.importanceEvaluator.evaluateImportance(content, context)
    
    // 長期記憶用のドキュメントを作成
    await this.vectorDB.addDocument({
      id: memoryId,
      content,
      metadata: {
        type: 'long_term_memory',
        sourceAgent,
        importance,
        tags,
        timestamp: new Date().toISOString(),
        isLongTerm: true
      }
    })

    return memoryId
  }

  /**
   * 長期記憶から情報を検索
   */
  async searchLongTermMemory(
    query: string,
    limit: number = 10,
    timeRange?: { start: Date; end: Date }
  ): Promise<Array<{ id: string; content: string; metadata: Record<string, any> }>> {
    const results = await this.vectorDB.searchSimilar(query, limit)
    
    // 長期記憶のみをフィルタリング
    const longTermResults = results.filter(result => 
      result.metadata.type === 'long_term_memory'
    )

    // 時間範囲でフィルタリング
    if (timeRange) {
      return longTermResults.filter(result => {
        const timestamp = new Date(result.metadata.timestamp)
        return timestamp >= timeRange.start && timestamp <= timeRange.end
      })
    }

    return longTermResults
  }

  /**
   * 現在のコンテキストを更新
   */
  updateContext(newContext: Record<string, any>, trigger: string = 'manual'): void {
    this.contextManager.currentContext = {
      ...this.contextManager.currentContext,
      ...newContext
    }
    
    this.contextManager.contextHistory.push({
      timestamp: new Date(),
      context: { ...this.contextManager.currentContext },
      trigger
    })

    // コンテキスト履歴のサイズ制限
    if (this.contextManager.contextHistory.length > 100) {
      this.contextManager.contextHistory = this.contextManager.contextHistory.slice(-50)
    }
  }

  /**
   * 現在のコンテキストを取得
   */
  getCurrentContext(): Record<string, any> {
    return { ...this.contextManager.currentContext }
  }

  /**
   * コンテキスト履歴を取得
   */
  getContextHistory(limit: number = 10): Array<{
    timestamp: Date
    context: Record<string, any>
    trigger: string
  }> {
    return this.contextManager.contextHistory.slice(-limit)
  }

  /**
   * 重要度を更新
   */
  async updateImportance(memoryId: string, newImportance: number): Promise<void> {
    const memoryEntry = this.sharedMemory.get(memoryId)
    if (memoryEntry) {
      memoryEntry.importance = Math.max(0, Math.min(1, newImportance))
      await this.importanceEvaluator.updateImportance(memoryId, newImportance)
    }
  }

  /**
   * 重要度の減衰を適用
   */
  async decayImportance(memoryId: string, decayRate?: number): Promise<void> {
    const rate = decayRate || this.memoryConfig.importanceDecayRate
    await this.importanceEvaluator.decayImportance(memoryId, rate)
    
    const memoryEntry = this.sharedMemory.get(memoryId)
    if (memoryEntry) {
      memoryEntry.importance = Math.max(0, memoryEntry.importance - rate)
    }
  }

  /**
   * メモリサイズ制限の強制
   */
  private async enforceMemoryLimit(): Promise<void> {
    if (this.sharedMemory.size <= this.memoryConfig.maxSharedMemorySize) {
      return
    }

    // 重要度が低いメモリを削除
    const entries = Array.from(this.sharedMemory.values())
    entries.sort((a, b) => a.importance - b.importance)

    const toRemove = entries.slice(0, this.sharedMemory.size - this.memoryConfig.maxSharedMemorySize)
    
    for (const entry of toRemove) {
      this.sharedMemory.delete(entry.id)
    }
  }

  /**
   * 自動クリーンアップの設定
   */
  private setupAutoCleanup(): void {
    setInterval(async () => {
      await this.performCleanup()
    }, this.memoryConfig.autoCleanupInterval)
  }

  /**
   * クリーンアップの実行
   */
  private async performCleanup(): Promise<void> {
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - this.memoryConfig.contextRetentionDays * 24 * 60 * 60 * 1000)

    // 古いコンテキスト履歴を削除
    this.contextManager.contextHistory = this.contextManager.contextHistory.filter(
      entry => entry.timestamp > cutoffDate
    )

    // 期限切れのメモリを削除
    for (const [id, entry] of this.sharedMemory.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        this.sharedMemory.delete(id)
      }
    }

    // 重要度の減衰を適用
    for (const [id, entry] of this.sharedMemory.entries()) {
      if (entry.lastAccessed < cutoffDate) {
        await this.decayImportance(id)
      }
    }
  }

  /**
   * メモリ統計を取得
   */
  getMemoryStats(): {
    sharedMemorySize: number
    contextHistorySize: number
    averageImportance: number
    mostAccessedTags: string[]
  } {
    const entries = Array.from(this.sharedMemory.values())
    const averageImportance = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + entry.importance, 0) / entries.length 
      : 0

    // 最もアクセスされたタグを取得
    const tagCounts = new Map<string, number>()
    for (const entry of entries) {
      for (const tag of entry.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + entry.accessCount)
      }
    }

    const mostAccessedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag)

    return {
      sharedMemorySize: this.sharedMemory.size,
      contextHistorySize: this.contextManager.contextHistory.length,
      averageImportance,
      mostAccessedTags
    }
  }

  /**
   * メモリをクリア
   */
  clearMemory(type: 'shared' | 'context' | 'all' = 'all'): void {
    if (type === 'shared' || type === 'all') {
      this.sharedMemory.clear()
    }
    
    if (type === 'context' || type === 'all') {
      this.contextManager.contextHistory = []
      this.contextManager.currentContext = {}
    }
  }
}

/**
 * デフォルトの重要度評価器
 */
class DefaultImportanceEvaluator implements ImportanceEvaluator {
  async evaluateImportance(content: string, context: Record<string, any>): Promise<number> {
    // 基本的な重要度評価ロジック
    let importance = 0.5 // デフォルト重要度

    // コンテンツの長さによる調整
    if (content.length > 100) importance += 0.1
    if (content.length > 500) importance += 0.1

    // コンテキストによる調整
    if (context.priority === 'high') importance += 0.2
    if (context.priority === 'low') importance -= 0.2

    // タグによる調整
    if (context.tags && Array.isArray(context.tags)) {
      const importantTags = ['critical', 'urgent', 'important']
      const hasImportantTag = context.tags.some((tag: string) => 
        importantTags.includes(tag.toLowerCase())
      )
      if (hasImportantTag) importance += 0.15
    }

    return Math.max(0, Math.min(1, importance))
  }

  async updateImportance(memoryId: string, newImportance: number): Promise<void> {
    // 重要度の更新（実装は必要に応じて拡張）
  }

  async decayImportance(memoryId: string, decayRate: number): Promise<void> {
    // 重要度の減衰（実装は必要に応じて拡張）
  }
}
