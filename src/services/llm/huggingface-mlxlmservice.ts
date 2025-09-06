export interface HuggingFaceMlxLmModel {
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

export interface MlxLmModelSearchOptions {
  query?: string
  limit?: number
  sort?: 'trending' | 'downloads' | 'likes' | 'updated'
  direction?: 'asc' | 'desc'
}

export class HuggingFaceMlxLmService {
  private baseUrl = 'https://huggingface.co/api'
  private modelsCache: HuggingFaceMlxLmModel[] = []
  private lastFetchTime: number = 0
  private cacheDuration = 5 * 60 * 1000 // 5分間キャッシュ

  /**
   * MLX LM対応モデルを検索して取得
   */
  async searchMlxLmModels(options: MlxLmModelSearchOptions = {}): Promise<HuggingFaceMlxLmModel[]> {
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
      console.log(`🔍 Searching for MLX LM models with query: "${query}"`)

      // Hugging Face APIでMLX LM対応モデルを検索
      const searchParams = new URLSearchParams({
        search: query ? `${query} mlx` : 'mlx',
        filter: 'other:mlx-lm',
        sort: sort,
        direction: direction === 'desc' ? '-1' : '1',
        limit: limit.toString()
      })

      const response = await fetch(`${this.baseUrl}/models?${searchParams}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const models: HuggingFaceMlxLmModel[] = []

      for (const model of data) {
        // MLXタグがあるかチェック
        const hasMlxTag = model.tags?.some((tag: string) => 
          tag.toLowerCase().includes('mlx')
        )

        if (hasMlxTag) {
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
            format: 'MLX',
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

      console.log(`✅ Found ${models.length} MLX LM models`)
      return models

    } catch (error) {
      console.error('Error fetching MLX LM models:', error)
      throw error
    }
  }

  /**
   * 人気のMLX LMモデルを取得
   */
  async getPopularMlxLmModels(limit: number = 20): Promise<HuggingFaceMlxLmModel[]> {
    return this.searchMlxLmModels({
      limit,
      sort: 'downloads',
      direction: 'desc'
    })
  }

  /**
   * トレンドのMLX LMモデルを取得
   */
  async getTrendingMlxLmModels(limit: number = 20): Promise<HuggingFaceMlxLmModel[]> {
    return this.searchMlxLmModels({
      limit,
      sort: 'trending',
      direction: 'desc'
    })
  }

  /**
   * 特定のモデルファミリーのモデルを検索
   */
  async searchModelsByFamily(family: string, limit: number = 20): Promise<HuggingFaceMlxLmModel[]> {
    const models = await this.searchMlxLmModels({ limit: 100 })
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
  private filterCachedModels(query: string, limit: number): HuggingFaceMlxLmModel[] {
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
      /(\d+)bit/i,
      /(\d+)bit/i,
      /fp16/i,
      /fp32/i,
      /bf16/i
    ]

    // モデルIDから検索
    for (const pattern of quantizationPatterns) {
      if (pattern.test(modelId)) {
        const match = modelId.match(pattern)
        if (match) {
          return match[0].toUpperCase()
        }
      }
    }

    // タグから検索
    for (const tag of tags) {
      for (const pattern of quantizationPatterns) {
        if (pattern.test(tag)) {
          const match = tag.match(pattern)
          if (match) {
            return match[0].toUpperCase()
          }
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
