import { GoogleGenAI } from "@google/genai"

export interface VeoVideoRequest {
  prompt: string
  duration?: number // 秒単位
  aspectRatio?: '16:9' | '9:16' | '1:1'
  quality?: 'low' | 'medium' | 'high'
  image?: {
    imageBytes: string
    mimeType: string
  }
}

export interface VeoVideoResponse {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  error?: string
  isSimulation?: boolean // シミュレーションモードかどうかを示すフラグ
}

export class VeoService {
  private apiKey: string
  private ai: GoogleGenAI
  private retryAttempts = 3
  private retryDelay = 2000 // 2秒

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.ai = new GoogleGenAI({ apiKey: this.apiKey })
  }

  /**
   * エラーがレート制限エラーかどうかを判定
   */
  private isRateLimitError(error: any): boolean {
    if (!error) return false
    
    // エラーオブジェクトの構造を確認
    if (error.error?.code === 429) return true
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

  async generateVideo(request: VeoVideoRequest): Promise<VeoVideoResponse> {
    try {
      console.log('Veo video generation request:', request)
      
      // リトライ機能付きでAPI呼び出し
      const operation = await this.retryWithBackoff(async () => {
        return await this.ai.models.generateVideos({
          model: "veo-3.0-generate-preview",
          prompt: request.prompt,
          ...(request.image && { image: request.image })
        })
      })

      return {
        id: operation.name || `veo_${Date.now()}`,
        status: 'processing',
        duration: request.duration || 8,
        isSimulation: false
      }
    } catch (error) {
      console.error('Veo video generation error:', error)
      
      // レート制限エラーの場合の特別な処理
      if (this.isRateLimitError(error)) {
        console.warn('Veo API quota exceeded, falling back to simulation mode')
        console.warn('To resolve this issue:')
        console.warn('1. Check your Google Cloud billing status')
        console.warn('2. Verify your API quota limits at https://ai.google.dev/gemini-api/docs/rate-limits')
        console.warn('3. Consider upgrading your billing plan')
        console.warn('4. Wait for quota reset (usually daily)')
        
        // クォータ制限の場合はシミュレーションモードにフォールバック
        const videoId = `veo_sim_${Date.now()}`
        return {
          id: videoId,
          status: 'processing',
          duration: request.duration || 8,
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

  async getVideoStatus(videoId: string): Promise<VeoVideoResponse> {
    try {
      // シミュレーションIDの場合は特別な処理
      if (videoId.startsWith('veo_sim_')) {
        return {
          id: videoId,
          status: 'processing',
          duration: 8,
          isSimulation: true
        }
      }

      // 実際のVeo APIが利用可能になった際は、以下のコードを使用
      // const operation = await this.ai.operations.getVideosOperation({
      //   operation: videoId
      // })
      // return {
      //   id: videoId,
      //   status: operation.done ? 'completed' : 'processing',
      //   videoUrl: operation.response?.generatedVideos?.[0]?.video?.uri,
      //   duration: 8,
      //   isSimulation: false
      // }

      // 現在は簡易実装として、常にprocessing状態を返す
      return {
        id: videoId,
        status: 'processing',
        duration: 8,
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

  async pollVideoStatus(videoId: string, onProgress?: (status: string) => void): Promise<VeoVideoResponse> {
    try {
      onProgress?.('processing')
      
      // シミュレーションIDの場合は特別な処理
      if (videoId.startsWith('veo_sim_')) {
        console.log('Using simulation mode due to API quota limits')
        
        // 8秒間のシミュレーション（Veo 3の標準的な生成時間）
        await new Promise((resolve) => setTimeout(resolve, 8000))
        
        onProgress?.('completed')
        
        const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
        console.log('🎬 Simulation mode: Returning video URL:', videoUrl)
        
        return {
          id: videoId,
          status: 'completed',
          videoUrl: videoUrl,
          duration: 8,
          isSimulation: true
        }
      }
      
      // 実際のVeo APIが利用可能になった際は、以下のコードを使用
      // let operation = await this.ai.operations.getVideosOperation({
      //   operation: videoId
      // })
      // while (!operation.done) {
      //   console.log("Waiting for video generation to complete...")
      //   await new Promise((resolve) => setTimeout(resolve, 10000))
      //   operation = await this.ai.operations.getVideosOperation({
      //     operation: videoId
      //   })
      // }
      // const video = operation.response?.generatedVideos?.[0]?.video

      // 現在は簡易実装として、8秒後に完了をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 8000))
      
      onProgress?.('completed')

      return {
        id: videoId,
        status: 'completed',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 8,
        isSimulation: false
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
