

export interface HuggingFaceOllamaModel {
  id: string
  name: string
  description: string
  downloads: number
  likes: number
  tags: string[]
  model_type: string
  size: number
  format: string
  quantization: string
  updated_at: string
  author: string
  parameter_size?: string
  family?: string
}

export interface OllamaModelSearchOptions {
  query?: string
  limit?: number
  sort?: 'trending' | 'downloads' | 'likes' | 'updated'
  direction?: 'asc' | 'desc'
}

export class HuggingFaceOllamaService {
  private baseUrl = 'https://huggingface.co/api'
  private modelsCache: HuggingFaceOllamaModel[] = []
  private lastFetchTime: number = 0
  private cacheDuration = 5 * 60 * 1000 // 5分間キャッシュ

  /**
   * Ollama対応モデルを検索して取得
   */
  async searchOllamaModels(options: OllamaModelSearchOptions = {}): Promise<HuggingFaceOllamaModel[]> {
    const {
      query = '',
      limit = 50,
      sort = 'trending',
      direction = 'desc'
    } = options

    // キャッシュが有効な場合はキャッシュを返す
    if (this.isCacheValid()) {
      return this.filterCachedModels(query, limit)
    }

    try {
      console.log(`🔍 Searching for Ollama models with query: "${query}"`)

      // Hugging Face APIでGGUFモデルを検索
      const searchParams = new URLSearchParams({
        search: query ? `${query} gguf` : 'gguf',
        sort: sort,
        direction: direction === 'desc' ? '-1' : '1',
        limit: limit.toString()
      })

      const response = await fetch(`${this.baseUrl}/models?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const models: HuggingFaceOllamaModel[] = []

      for (const model of data) {
        // GGUFタグがあるかチェック
        const hasGGUFTag = model.tags?.some((tag: string) => 
          tag.toLowerCase().includes('gguf')
        )

        if (hasGGUFTag) {
          // パラメータサイズを抽出
          const parameterSize = this.extractParameterSize(model.id, model.tags)
          
          // モデルファミリーを抽出
          const family = this.extractModelFamily(model.id, model.tags)

          // 量子化レベルを抽出
          const quantization = this.extractQuantization(model.id, model.tags)

          models.push({
            id: model.id,
            name: model.modelId || model.id,
            description: model.description || 'No description available',
            downloads: model.downloads || 0,
            likes: model.likes || 0,
            tags: model.tags || [],
            model_type: model.model_type || 'unknown',
            size: 0, // APIからは直接取得できないため0に設定
            format: 'GGUF',
            quantization: quantization,
            updated_at: model.lastModified || new Date().toISOString(),
            author: model.author || 'unknown',
            parameter_size: parameterSize,
            family: family
          })
        }
      }

      // キャッシュを更新
      this.modelsCache = models
      this.lastFetchTime = Date.now()

      console.log(`✅ Found ${models.length} Ollama models`)
      return models

    } catch (error) {
      console.error('Error fetching Ollama models:', error)
      throw error
    }
  }

  /**
   * 人気のOllamaモデルを取得
   */
  async getPopularOllamaModels(limit: number = 20): Promise<HuggingFaceOllamaModel[]> {
    return this.searchOllamaModels({
      limit,
      sort: 'downloads',
      direction: 'desc'
    })
  }

  /**
   * トレンドのOllamaモデルを取得
   */
  async getTrendingOllamaModels(limit: number = 20): Promise<HuggingFaceOllamaModel[]> {
    return this.searchOllamaModels({
      limit,
      sort: 'trending',
      direction: 'desc'
    })
  }

  /**
   * 特定のモデルファミリーのモデルを検索
   */
  async searchModelsByFamily(family: string, limit: number = 20): Promise<HuggingFaceOllamaModel[]> {
    const models = await this.searchOllamaModels({ limit: 100 })
    return models
      .filter(model => 
        model.family?.toLowerCase().includes(family.toLowerCase()) ||
        model.name.toLowerCase().includes(family.toLowerCase())
      )
      .slice(0, limit)
  }

  /**
   * キャッシュが有効かチェック
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastFetchTime < this.cacheDuration
  }

  /**
   * キャッシュされたモデルをフィルタリング
   */
  private filterCachedModels(query: string, limit: number): HuggingFaceOllamaModel[] {
    if (!query) {
      return this.modelsCache.slice(0, limit)
    }

    const filtered = this.modelsCache.filter(model =>
      model.name.toLowerCase().includes(query.toLowerCase()) ||
      model.description.toLowerCase().includes(query.toLowerCase()) ||
      model.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    )

    return filtered.slice(0, limit)
  }

  /**
   * モデルIDとタグから量子化レベルを抽出
   */
  private extractQuantization(modelId: string, tags: string[]): string {
    const quantizationPatterns = [
      /Q2_K/, /Q3_K/, /Q4_K/, /Q5_K/, /Q6_K/, /Q8_K/,
      /Q2/, /Q3/, /Q4/, /Q5/, /Q6/, /Q8/,
      /F16/, /F32/, /BF16/
    ]

    // モデルIDから検索
    for (const pattern of quantizationPatterns) {
      if (pattern.test(modelId)) {
        return pattern.source.replace(/[\/\\]/g, '')
      }
    }

    // タグから検索
    for (const tag of tags) {
      for (const pattern of quantizationPatterns) {
        if (pattern.test(tag)) {
          return pattern.source.replace(/[\/\\]/g, '')
        }
      }
    }

    return 'unknown'
  }

  /**
   * モデルIDとタグからパラメータサイズを抽出
   */
  private extractParameterSize(modelId: string, tags: string[]): string {
    const sizePatterns = [
      /(\d+(?:\.\d+)?)b/i,
      /(\d+(?:\.\d+)?)B/i,
      /(\d+(?:\.\d+)?)billion/i
    ]

    // モデルIDから検索
    for (const pattern of sizePatterns) {
      const match = modelId.match(pattern)
      if (match) {
        return `${match[1]}B`
      }
    }

    // タグから検索
    for (const tag of tags) {
      for (const pattern of sizePatterns) {
        const match = tag.match(pattern)
        if (match) {
          return `${match[1]}B`
        }
      }
    }

    return 'unknown'
  }

  /**
   * モデルIDとタグからモデルファミリーを抽出
   */
  private extractModelFamily(modelId: string, tags: string[]): string {
    const familyPatterns = [
      /llama/i,
      /gemma/i,
      /qwen/i,
      /deepseek/i,
      /mistral/i,
      /phi/i,
      /llava/i,
      /codellama/i,
      /vicuna/i,
      /alpaca/i
    ]

    // モデルIDから検索
    for (const pattern of familyPatterns) {
      if (pattern.test(modelId)) {
        return pattern.source.replace(/[\/\\]/g, '').toLowerCase()
      }
    }

    // タグから検索
    for (const tag of tags) {
      for (const pattern of familyPatterns) {
        if (pattern.test(tag)) {
          return pattern.source.replace(/[\/\\]/g, '').toLowerCase()
        }
      }
    }

    return 'unknown'
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.modelsCache = []
    this.lastFetchTime = 0
  }

  /**
   * ファイルサイズを人間が読みやすい形式に変換
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 日付を人間が読みやすい形式に変換
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}
