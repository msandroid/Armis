export interface RunwayVideoRequest {
  prompt: string
  duration?: number // 秒単位
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4'
  quality?: 'low' | 'medium' | 'high'
  guidanceScale?: number // 1.0 to 20.0
  numFrames?: number // 生成フレーム数
  seed?: number // シード値（再現性のため）
  image?: {
    imageBytes: string
    mimeType: string
  }
}

export interface RunwayVideoResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  error?: string
  isSimulation?: boolean // シミュレーションモードかどうかを示すフラグ
}

export class RunwayService {
  private apiKey: string
  private baseUrl: string = 'https://api.dev.runwayml.com/v1'
  private retryAttempts = 3
  private retryDelay = 2000 // 2秒

  constructor(apiKey: string) {
    // 環境変数からAPIキーを取得する場合のサポート
    this.apiKey = apiKey || process.env.RUNWAYML_API_SECRET || ''
    if (!this.apiKey) {
      throw new Error('Runway ML API key is required. Set RUNWAYML_API_SECRET environment variable or pass apiKey parameter.')
    }
  }

  /**
   * Runway ML APIへのHTTP リクエスト
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    const response = await fetch(url, {
      ...defaultOptions,
      ...options
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw {
        status: response.status,
        message: errorData.message || `HTTP ${response.status}`,
        error: errorData
      }
    }

    return response.json()
  }

  /**
   * 利用可能なモデルを取得
   */
  async getAvailableModels(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/models')
      console.log('Available Runway ML models:', response)
      return response
    } catch (error) {
      console.error('Error fetching available models:', error)
      throw error
    }
  }

  /**
   * エラーがレート制限エラーかどうかを判定
   */
  private isRateLimitError(error: any): boolean {
    if (!error) return false
    
    // エラーオブジェクトの構造を確認
    if (error.status === 429) return true
    if (error.code === 429) return true
    
    // メッセージでの判定
    const message = error.message || error.error?.message || ''
    return message.includes('429') || 
           message.includes('quota') || 
           message.includes('rate limit') ||
           message.includes('RESOURCE_EXHAUSTED')
  }

  /**
   * 一時的なエラーかどうかを判定（リトライ可能か）
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false
    
    // レート制限エラーは一時的な場合がある
    if (this.isRateLimitError(error)) return true
    
    // ネットワークエラーなど
    const message = error.message || error.error?.message || ''
    return message.includes('network') || 
           message.includes('timeout') ||
           message.includes('ECONNRESET') ||
           message.includes('ENOTFOUND')
  }

  /**
   * 指数バックオフでリトライ
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>, 
    maxAttempts: number = this.retryAttempts
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (!this.isRetryableError(error) || attempt === maxAttempts) {
          throw error
        }
        
        // 指数バックオフ: 2秒, 4秒, 8秒...
        const delay = this.retryDelay * Math.pow(2, attempt - 1)
        console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }



  async generateVideo(request: RunwayVideoRequest): Promise<RunwayVideoResponse> {
    try {
      console.log('Runway video generation request:', request)
      
              // リトライ機能付きでAPI呼び出し
        const operation = await this.retryWithBackoff(async () => {
          // Runway ML APIを直接呼び出し
          let payload
          
          if (request.image) {
            // 画像からビデオ生成
            payload = {
              model: 'gen3_video',
              prompt: request.prompt,
              duration: request.duration || 5,
              aspect_ratio: request.aspectRatio || '16:9',
              quality: request.quality || 'medium',
              guidance_scale: request.guidanceScale || 7.5,
              num_frames: request.numFrames || 120,
              ...(request.seed && { seed: request.seed }),
              init_image: request.image.imageBytes,
              init_image_mime_type: request.image.mimeType
            }
          } else {
            // テキストからビデオ生成
            payload = {
              model: 'gen3_video',
              prompt: request.prompt,
              duration: request.duration || 5,
              aspect_ratio: request.aspectRatio || '16:9',
              quality: request.quality || 'medium',
              guidance_scale: request.guidanceScale || 7.5,
              num_frames: request.numFrames || 120,
              ...(request.seed && { seed: request.seed })
            }
          }

          const response = await this.makeRequest('/image_to_video', {
            method: 'POST',
            body: JSON.stringify(payload)
          })

          const taskId = response.id
          console.log('Runway ML task created with ID:', taskId)
          return { id: taskId }
        })

      return {
        id: operation.id || `runway_${Date.now()}`,
        status: 'processing',
        duration: request.duration || 5,
        isSimulation: false
      }
    } catch (error) {
      console.error('Runway video generation error:', error)
      
      // レート制限エラーの場合の特別な処理
      if (this.isRateLimitError(error)) {
        console.warn('Runway ML API quota exceeded, falling back to simulation mode')
        console.warn('To resolve this issue:')
        console.warn('1. Check your Runway ML billing status')
        console.warn('2. Verify your API quota limits')
        console.warn('3. Consider upgrading your billing plan')
        console.warn('4. Wait for quota reset')
        
        // クォータ制限の場合はシミュレーションモードにフォールバック
        const videoId = `runway_sim_${Date.now()}`
        return {
          id: videoId,
          status: 'processing',
          duration: request.duration || 5,
          isSimulation: true
        }
      }
      
      // その他のエラーの場合
      return {
        id: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        isSimulation: false
      }
    }
  }

  async getVideoStatus(videoId: string): Promise<RunwayVideoResponse> {
    try {
      // シミュレーションIDの場合は特別な処理
      if (videoId.startsWith('runway_sim_')) {
        return {
          id: videoId,
          status: 'processing',
          duration: 5,
          isSimulation: true
        }
      }

          // 実際のRunway ML APIでビデオステータスを取得
    const task = await this.makeRequest(`/tasks/${videoId}`)
    
    return {
        id: videoId,
        status: task.status === 'SUCCEEDED' ? 'completed' : 'processing',
        videoUrl: task.output?.[0]?.url,
        thumbnailUrl: task.output?.[0]?.thumbnail_url,
        duration: task.output?.[0]?.duration,
        isSimulation: false
    }
    } catch (error) {
      console.error('Error getting video status:', error)
      return {
        id: videoId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        isSimulation: false
      }
    }
  }

  async pollVideoStatus(videoId: string, onProgress?: (status: string) => void): Promise<RunwayVideoResponse> {
    try {
      onProgress?.('processing')
      
      // シミュレーションIDの場合は特別な処理
      if (videoId.startsWith('runway_sim_')) {
        console.log('Using simulation mode due to API quota limits')
        
        // 5秒間のシミュレーション（Runwayの標準的な生成時間）
        await new Promise((resolve) => setTimeout(resolve, 5000))
        
        onProgress?.('completed')
        
        const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        console.log('🎬 Simulation mode: Returning video URL:', videoUrl)
        
        return {
          id: videoId,
          status: 'completed',
          videoUrl: videoUrl,
          duration: 5,
          isSimulation: true
        }
      }
      
      // 実際のRunway ML APIでポーリング
      try {
        let attempts = 0
        const maxAttempts = 120 // 10分間（5秒間隔）
        const timeout = 10 * 60 * 1000 // 10分
        const startTime = Date.now()
        
        while (attempts < maxAttempts) {
          const task = await this.makeRequest(`/tasks/${videoId}`)
          
          if (task.status === 'SUCCEEDED') {
            onProgress?.('completed')
            console.log('Runway ML task completed successfully:', task.id)
            console.log('Output:', task.output)
            
            return {
              id: videoId,
              status: 'completed',
              videoUrl: task.output?.[0]?.url,
              thumbnailUrl: task.output?.[0]?.thumbnail_url,
              duration: task.output?.[0]?.duration,
              isSimulation: false
            }
          } else if (task.status === 'FAILED') {
            console.error('Task failed:', task)
            return {
              id: videoId,
              status: 'failed',
              error: task.error?.message || 'Task failed',
              isSimulation: false
            }
          }
          
          // タイムアウトチェック
          if (Date.now() - startTime > timeout) {
            console.error('Task timed out')
            return {
              id: videoId,
              status: 'failed',
              error: 'Task timed out after 10 minutes',
              isSimulation: false
            }
          }
          
          attempts++
          console.log(`Polling attempt ${attempts}/${maxAttempts}, status: ${task.status}`)
          await new Promise(resolve => setTimeout(resolve, 5000)) // 5秒間隔
        }
        
        return {
          id: videoId,
          status: 'failed',
          error: 'Max polling attempts reached',
          isSimulation: false
        }
      } catch (taskError) {
        console.error('Runway ML task error:', taskError)
        return {
          id: videoId,
          status: 'failed',
          error: taskError instanceof Error ? taskError.message : 'Task failed',
          isSimulation: false
        }
      }
    } catch (error) {
      console.error('Error polling video status:', error)
      return {
        id: videoId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        isSimulation: false
      }
    }
  }
}
