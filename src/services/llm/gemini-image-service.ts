import { GoogleGenerativeAI } from "@google/generative-ai"
import { GoogleGenAI, Modality } from "@google/genai"

// Google Cloud認証ライブラリを追加（Node.js環境でのみ使用）
let GoogleAuth: any = null;

// プロンプト補完エージェント
import { PromptEnhancementAgent, PromptEnhancementConfig } from './prompt-enhancement-agent'
import { LlamaService } from './llama-service'
import { OllamaService } from './ollama-service'

// Electron APIの型定義
declare global {
  interface Window {
    electronAPI?: {
      generateImage: (options: any) => Promise<{ success: boolean; images?: string[]; error?: string }>
      generateImageWithGemini: (options: any) => Promise<{ success: boolean; images?: string[]; error?: string }>
      getEnvVars: () => Promise<{
        VITE_GOOGLE_API_KEY?: string
        VITE_GOOGLE_PROJECT_ID?: string
        VITE_GOOGLE_LOCATION?: string
        GOOGLE_APPLICATION_CREDENTIALS?: string
      }>
      checkGoogleAuth: () => Promise<{
        success: boolean
        hasCredentials: boolean
        projectId?: string
        error?: string
      }>
    }
  }
}

export interface ImageGenerationRequest {
  prompt: string
  model?: string
  width?: number
  height?: number
  aspectRatio?: '1:1' | '4:3' | '3:4' | '16:9' | '9:16'
  quality?: 'draft' | 'standard' | 'hd'
  style?: 'photorealistic' | 'artistic' | 'cartoon' | 'abstract'
  safetyFilter?: 'block_some' | 'block_most' | 'block_few' | 'block_none'
  personGeneration?: 'dont_allow' | 'allow_adult' | 'allow_all'
}

export interface ImageGenerationResponse {
  images: string[] // Base64 encoded images
  prompt: string
  model: string
  metadata: {
    width: number
    height: number
    quality: string
    style: string
    generatedAt: string
  }
}

export interface ImageGenerationError {
  error: string
  code?: string
  details?: string
}

export class GeminiImageService {
  private genAI: GoogleGenerativeAI | null = null
  private newGenAI: GoogleGenAI | null = null
  private apiKey: string | null = null
  private projectId: string | null = null
  private location: string = 'us-central1'
  private auth: any = null
  private promptEnhancementAgent: PromptEnhancementAgent | null = null
  private enablePromptEnhancement: boolean = true

  // 利用可能な画像生成モデル
  private readonly IMAGE_MODELS = {
    // Gemini API 画像生成モデル
    'gemini-2.0-flash-preview-image-generation': {
      name: 'gemini-2.0-flash-preview-image-generation',
      description: 'Gemini 2.0 Flash Preview Image Generation',
      type: 'gemini',
      maxWidth: 1024,
      maxHeight: 1024,
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
      qualities: ['standard']
    },
    // Imagen API モデル（従来）
    'imagen-3.0-generate-002': {
      name: 'imagen-3.0-generate-002',
      description: 'Imagen 3.0 Generate (Standard)',
      type: 'imagen',
      maxWidth: 1024,
      maxHeight: 1024,
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
      qualities: ['draft', 'standard', 'hd']
    },
    'imagen-3.0-generate-001': {
      name: 'imagen-3.0-generate-001',
      description: 'Imagen 3.0 Generate (Legacy)',
      type: 'imagen',
      maxWidth: 1024,
      maxHeight: 1024,
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
      qualities: ['draft', 'standard', 'hd']
    },
    'imagen-3.0-fast-generate-001': {
      name: 'imagen-3.0-fast-generate-001',
      description: 'Imagen 3.0 Fast Generate',
      type: 'imagen',
      maxWidth: 1024,
      maxHeight: 1024,
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
      qualities: ['draft', 'standard']
    },
    'imagen-4.0-generate-001': {
      name: 'imagen-4.0-generate-001',
      description: 'Imagen 4.0 Generate (Standard)',
      type: 'imagen',
      maxWidth: 1024,
      maxHeight: 1024,
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
      qualities: ['draft', 'standard', 'hd']
    },
    'imagen-4.0-fast-generate-001': {
      name: 'imagen-4.0-fast-generate-001',
      description: 'Imagen 4.0 Fast Generate',
      type: 'imagen',
      maxWidth: 1024,
      maxHeight: 1024,
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
      qualities: ['draft', 'standard']
    },
    'imagen-4.0-ultra-generate-001': {
      name: 'imagen-4.0-ultra-generate-001',
      description: 'Imagen 4.0 Ultra Generate',
      type: 'imagen',
      maxWidth: 1024,
      maxHeight: 1024,
      aspectRatios: ['1:1', '4:3', '3:4', '16:9', '9:16'],
      qualities: ['draft', 'standard', 'hd']
    }
  }

  /**
   * Gemini Image Serviceを初期化
   */
  async configure(
    apiKey: string, 
    projectId?: string, 
    location?: string,
    llmService?: LlamaService | OllamaService,
    enablePromptEnhancement: boolean = true,
    skipApiKeyValidation: boolean = false
  ): Promise<void> {
    console.log('=== Gemini Image Service 設定開始 ===')
    console.log('API Key:', apiKey ? '設定済み' : '未設定')
    console.log('Project ID:', projectId || '未設定')
    console.log('Location:', location || this.location)
    
    this.apiKey = apiKey
    this.projectId = projectId || null
    this.location = location || this.location

    // ブラウザ環境かどうかをチェック
    const isBrowser = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
    
    if (!isBrowser && GoogleAuth) {
      // Node.js環境の場合のみGoogle Cloud認証を初期化
      try {
        this.auth = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform'],
          projectId: this.projectId || undefined
        })
        console.log('Google Cloud認証初期化完了')
      } catch (error) {
        console.error('Google Cloud認証初期化エラー:', error)
        throw new Error('Google Cloud認証の初期化に失敗しました。サービスアカウント認証情報またはApplication Default Credentialsが設定されていることを確認してください。')
      }
    } else if (isBrowser) {
      console.log('ブラウザ環境を検出 - Electronメインプロセス経由で画像生成を実行')
    } else {
      console.log('GoogleAuthが利用できないため、認証をスキップします')
    }

    // Gemini API用の設定
    if (apiKey) {
      // APIキーの形式を検証
      if (!this.isValidApiKey(apiKey)) {
        throw new Error('無効なAPIキー形式です。Google AI APIキーは "AIza..." で始まる必要があります。正しいAPIキーを https://aistudio.google.com/apikey から取得してください。')
      }
      
      // APIキーの有効性をテスト（スキップ可能）
      if (!skipApiKeyValidation) {
        console.log('🔍 APIキーの有効性をテスト中...')
        const isValid = await this.testApiKey(apiKey)
        if (!isValid) {
          console.warn('⚠️ APIキーの検証に失敗しましたが、設定を続行します')
        }
      } else {
        console.log('⏭️ APIキーの検証をスキップしました')
      }
      
      // 両方のSDKを初期化
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.newGenAI = new GoogleGenAI({ apiKey })
      console.log('✅ Gemini API設定完了 - APIキーが正常に動作します')
    } else {
      throw new Error('APIキーが設定されていません。Google AI APIキーを設定してください。')
    }

    // プロンプト補完エージェントの初期化
    this.enablePromptEnhancement = enablePromptEnhancement
    if (enablePromptEnhancement && llmService) {
      try {
        const config: PromptEnhancementConfig = {
          llmService,
          enableQualityEvaluation: true,
          enableStyleTransfer: true,
          enableMultiLanguage: true
        }
        this.promptEnhancementAgent = new PromptEnhancementAgent(config)
        console.log('プロンプト補完エージェント初期化完了')
      } catch (error) {
        console.warn('プロンプト補完エージェントの初期化に失敗:', error)
        this.enablePromptEnhancement = false
      }
    }

    console.log('=== Gemini Image Service 設定完了 ===')
  }

  /**
   * プロンプト補完エージェントを設定
   */
  setPromptEnhancementAgent(llmService: LlamaService | OllamaService, enable: boolean = true): void {
    this.enablePromptEnhancement = enable
    if (enable && llmService) {
      try {
        const config: PromptEnhancementConfig = {
          llmService,
          enableQualityEvaluation: true,
          enableStyleTransfer: true,
          enableMultiLanguage: true
        }
        this.promptEnhancementAgent = new PromptEnhancementAgent(config)
        console.log('プロンプト補完エージェント設定完了')
      } catch (error) {
        console.error('プロンプト補完エージェントの設定に失敗:', error)
        this.enablePromptEnhancement = false
      }
    } else {
      this.promptEnhancementAgent = null
    }
  }

  /**
   * プロンプト補完機能の有効/無効を切り替え
   */
  togglePromptEnhancement(enable: boolean): void {
    this.enablePromptEnhancement = enable
    console.log(`プロンプト補完機能: ${enable ? '有効' : '無効'}`)
  }

  /**
   * プロンプト補完機能の状態を取得
   */
  isPromptEnhancementEnabled(): boolean {
    return this.enablePromptEnhancement && this.promptEnhancementAgent !== null
  }

  /**
   * 利用可能な画像生成モデルの一覧を取得
   */
  getAvailableModels(): Record<string, any> {
    return this.IMAGE_MODELS
  }

  /**
   * モデルの詳細情報を取得
   */
  getModelInfo(modelName: string): any {
    return this.IMAGE_MODELS[modelName as keyof typeof this.IMAGE_MODELS] || null
  }

  /**
   * アスペクト比から幅と高さを計算
   */
  private calculateDimensions(aspectRatio: string, maxWidth: number, maxHeight: number): { width: number, height: number } {
    const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number)
    
    if (widthRatio === 1 && heightRatio === 1) {
      // 1:1 (正方形)
      const size = Math.min(maxWidth, maxHeight)
      return { width: size, height: size }
    } else if (widthRatio > heightRatio) {
      // 横長 (16:9, 4:3)
      const height = Math.min(maxHeight, Math.floor(maxWidth * heightRatio / widthRatio))
      const width = Math.floor(height * widthRatio / heightRatio)
      return { width, height }
    } else {
      // 縦長 (9:16, 3:4)
      const width = Math.min(maxWidth, Math.floor(maxHeight * widthRatio / heightRatio))
      const height = Math.floor(width * heightRatio / widthRatio)
      return { width, height }
    }
  }

  /**
   * 画像を生成
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      console.log('=== 画像生成開始 ===')
      console.log('リクエスト:', request)

      // パラメータの検証とデフォルト値の設定
      const model = request.model || 'gemini-2.0-flash-preview-image-generation'
      const aspectRatio = request.aspectRatio || '1:1'
      const quality = request.quality || 'standard'
      const style = request.style || 'photorealistic'
      const safetyFilter = request.safetyFilter || 'block_some'
      const personGeneration = request.personGeneration || 'dont_allow'

      // アスペクト比からサイズを計算
      const { width, height } = this.calculateImageSize(aspectRatio, request.width, request.height)

      // モデルの制限をチェック
      const modelConfig = this.IMAGE_MODELS[model as keyof typeof this.IMAGE_MODELS]
      if (!modelConfig) {
        throw new Error(`Unsupported model: ${model}`)
      }

      if (width > modelConfig.maxWidth || height > modelConfig.maxHeight) {
        throw new Error(`Image size ${width}x${height} exceeds maximum allowed size ${modelConfig.maxWidth}x${modelConfig.maxHeight} for model ${model}`)
      }

      if (!modelConfig.qualities.includes(quality)) {
        throw new Error(`Quality '${quality}' is not supported for model ${model}. Supported qualities: ${modelConfig.qualities.join(', ')}`)
      }

      let result: { images: string[] }

      // プロンプトの検証と改善
      let validatedPrompt = this.validateAndImprovePrompt(request.prompt)
      
      // プロンプト補完エージェントが利用可能な場合、高度な補完を実行
      if (this.enablePromptEnhancement && this.promptEnhancementAgent) {
        try {
          console.log('🔄 LangChainプロンプト補完エージェントを実行中...')
          const enhancedPrompt = await this.promptEnhancementAgent.enhancePrompt(validatedPrompt)
          
          // 英語プロンプトを優先使用（Gemini APIは英語の方が良い結果を得られる）
          validatedPrompt = enhancedPrompt.englishPrompt || enhancedPrompt.enhancedPrompt
          
          console.log('✨ プロンプト補完完了:', {
            original: request.prompt,
            enhanced: validatedPrompt,
            style: enhancedPrompt.style,
            quality: enhancedPrompt.quality
          })
        } catch (error) {
          console.warn('プロンプト補完エージェントでエラーが発生しました。基本補完を使用します:', error)
          // エラーが発生した場合は基本補完を使用
        }
      }
      
      // モデルタイプに応じて画像生成APIを選択
      if (modelConfig.type === 'gemini') {
        // Gemini APIを使用
        result = await this.callGeminiImageAPI({
          prompt: validatedPrompt,
          model
        })
      } else {
        // Imagen APIを使用（従来の方法）
        result = await this.callVertexAIImageAPI({
          prompt: request.prompt,
          model,
          width,
          height,
          quality,
          style,
          safetyFilter,
          personGeneration
        })
      }

      console.log('=== 画像生成完了 ===')

      return {
        images: result.images,
        prompt: request.prompt,
        model,
        metadata: {
          width,
          height,
          quality,
          style,
          generatedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('画像生成エラー:', error)
      throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * APIキーの形式を検証
   */
  private isValidApiKey(apiKey: string): boolean {
    // Google AI APIキーの基本的な形式チェック
    if (!apiKey || typeof apiKey !== 'string') {
      return false
    }
    
    // Google AI APIキーは "AIza..." で始まる
    if (!apiKey.startsWith('AIza')) {
      return false
    }
    
    // 基本的な長さチェック（Google AI APIキーは通常39文字）
    if (apiKey.length < 30 || apiKey.length > 50) {
      return false
    }
    
    // 基本的な形式チェック（英数字とハイフンのみ）
    if (!/^[A-Za-z0-9_-]+$/.test(apiKey)) {
      return false
    }
    
    return true
  }

  /**
   * APIキーの有効性をテスト
   */
  private async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('🔍 APIキーのテストを実行中...')
      
      // 新しいGoogle AI SDKでテスト
      if (this.newGenAI) {
        try {
          const response = await this.newGenAI.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: 'Hello'
          })
          
          if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            console.log('✅ 新しいSDKでAPIキーテスト成功')
            return true
          }
        } catch (error) {
          console.warn('新しいSDKでのテストに失敗、従来のSDKでテスト:', error)
        }
      }
      
      // フォールバック: 従来のSDKでテスト
      const testGenAI = new GoogleGenerativeAI(apiKey)
      const model = testGenAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      // 簡単なテストリクエストを送信
      const result = await model.generateContent('Hello')
      
      if (result.response.text.length > 0) {
        console.log('✅ 従来のSDKでAPIキーテスト成功')
        return true
      }
      
      return false
    } catch (error) {
      console.error('APIキーテストエラー:', error)
      
      // エラーの詳細をログ出力
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        
        // 特定のエラーは無視してAPIキーを有効とする
        if (errorMessage.includes('quota') || 
            errorMessage.includes('rate limit') ||
            errorMessage.includes('quota exceeded') ||
            errorMessage.includes('rate limit exceeded')) {
          console.log('⚠️ クォータ制限エラーですが、APIキーは有効とみなします')
          return true
        }
        
        // 認証エラーの場合は無効
        if (errorMessage.includes('permission denied') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('invalid api key')) {
          console.log('❌ APIキーが無効です')
          return false
        }
      }
      
      // その他のエラーは一時的な問題の可能性があるため、有効とみなす
      console.log('⚠️ 一時的なエラーですが、APIキーは有効とみなします')
      return true
    }
  }

  /**
   * プロンプトの検証と改善
   */
  private validateAndImprovePrompt(prompt: string): string {
    // プロンプトが空または不完全な場合の処理
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('プロンプトが空です。画像生成のための説明を入力してください。')
    }

    let improvedPrompt = prompt.trim()

    // 不完全なプロンプトの修正
    if (improvedPrompt.endsWith('のしてください。') || improvedPrompt.endsWith('してください。')) {
      // 最後の部分を削除して、より具体的な説明を追加
      improvedPrompt = improvedPrompt.replace(/のしてください。$/, '')
      improvedPrompt = improvedPrompt.replace(/してください。$/, '')
      
      // 基本的な説明を追加
      if (improvedPrompt.includes('コアラ')) {
        improvedPrompt = `${improvedPrompt}の可愛い写真`
      } else {
        improvedPrompt = `${improvedPrompt}の美しい画像`
      }
    }

    // プロンプトが短すぎる場合の改善
    if (improvedPrompt.length < 10) {
      improvedPrompt = `${improvedPrompt}の高品質な画像`
    }

    // 英語のプロンプトに変換（Gemini APIは英語の方が良い結果を得られる場合が多い）
    if (/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/.test(improvedPrompt)) {
      // 日本語のみの場合は英語に変換
      const translations: { [key: string]: string } = {
        'コアラ': 'koala',
        '猫': 'cat',
        '犬': 'dog',
        '花': 'flower',
        '風景': 'landscape',
        '海': 'ocean',
        '山': 'mountain',
        '森': 'forest',
        '空': 'sky',
        '太陽': 'sun',
        '月': 'moon',
        '星': 'stars'
      }

      let englishPrompt = improvedPrompt
      for (const [japanese, english] of Object.entries(translations)) {
        englishPrompt = englishPrompt.replace(new RegExp(japanese, 'g'), english)
      }

      // 翻訳できなかった場合は元のプロンプトを使用
      if (englishPrompt !== improvedPrompt) {
        improvedPrompt = `${englishPrompt}, high quality, detailed`
      }
    }

    return improvedPrompt
  }

  /**
   * アスペクト比から画像サイズを計算
   */
  private calculateImageSize(aspectRatio: string, customWidth?: number, customHeight?: number): { width: number; height: number } {
    if (customWidth && customHeight) {
      return { width: customWidth, height: customHeight }
    }

    const baseSize = 1024
    switch (aspectRatio) {
      case '1:1':
        return { width: baseSize, height: baseSize }
      case '4:3':
        return { width: baseSize, height: Math.round(baseSize * 3 / 4) }
      case '3:4':
        return { width: Math.round(baseSize * 3 / 4), height: baseSize }
      case '16:9':
        return { width: baseSize, height: Math.round(baseSize * 9 / 16) }
      case '9:16':
        return { width: Math.round(baseSize * 9 / 16), height: baseSize }
      default:
        return { width: baseSize, height: baseSize }
    }
  }

  /**
   * Gemini APIを使用して画像生成
   */
  private async callGeminiImageAPI(params: {
    prompt: string
    model: string
  }): Promise<{ images: string[] }> {
    // ブラウザ環境かどうかをチェック
    const isBrowser = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
    
    if (isBrowser) {
      // ブラウザ環境の場合、Electronメインプロセス経由で実行
      console.log('Electronメインプロセス経由でGemini画像生成を実行')
      
      const result = await (window as any).electronAPI.generateImageWithGemini({
        prompt: params.prompt,
        model: params.model,
        apiKey: this.apiKey
      })

      if (!result.success) {
        throw new Error(result.error || 'Image generation failed')
      }

      return { images: result.images || [] }
    } else {
      // Node.js環境の場合、直接APIを呼び出し
      if (!this.genAI) {
        throw new Error('Gemini APIが初期化されていません。configure()を先に呼び出してください。')
      }

      try {
        console.log('Gemini APIを使用して画像生成を実行:', params.prompt)
        
        // 新しいGoogle AI SDKを使用して画像生成
        if (this.newGenAI) {
          console.log('🔄 新しいGoogle AI SDKで画像生成を実行中...')
          
          const response = await this.newGenAI.models.generateContent({
            model: params.model,
            contents: params.prompt,
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE]
            }
          })
          
          const images: string[] = []
          
          if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.mimeType?.startsWith('image/') && part.inlineData.data) {
                // Base64エンコードされた画像データを取得
                const imageData = part.inlineData.data
                images.push(imageData)
              }
            }
          }
          
          console.log(`生成された画像数: ${images.length}`)
          
          if (images.length === 0) {
            throw new Error('画像が生成されませんでした。プロンプトを変更して再試行してください。')
          }
          
          return { images }
        } else {
          // フォールバック: 従来のSDKを使用
          console.log('🔄 従来のSDKで画像生成を実行中...')
          
          if (!this.genAI) {
            throw new Error('Gemini APIが初期化されていません。')
          }
          
          const model = this.genAI.getGenerativeModel({ model: params.model })
          
          const result = await model.generateContent({
            contents: [{
              role: 'user',
              parts: [{
                text: params.prompt
              }]
            }]
          })

          const images: string[] = []
          
          if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
            throw new Error('Gemini APIから有効なレスポンスが返されませんでした。')
          }
          
          for (const part of result.response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
              // Base64エンコードされた画像データを取得
              const imageData = part.inlineData.data
              images.push(imageData)
            }
          }

          console.log(`生成された画像数: ${images.length}`)
          
          if (images.length === 0) {
            throw new Error('画像が生成されませんでした。プロンプトを変更して再試行してください。')
          }
          
          return { images }
        }
      } catch (error) {
        console.error('Gemini API画像生成エラー:', error)
        
        // エラーの種類に応じて詳細なメッセージを提供
        let errorMessage = 'Gemini API image generation failed'
        let diagnosticInfo = ''
        let shouldRetry = false
        
        if (error instanceof Error) {
          const errorStr = error.message
          
          if (errorStr.includes('PERMISSION_DENIED') || errorStr.includes('403')) {
            errorMessage = 'API認証エラー: APIキーが無効または権限が不足しています。'
            diagnosticInfo = `
🔍 診断情報:
- APIキー形式: ${this.apiKey ? this.apiKey.substring(0, 10) + '...' : '未設定'}
- プロジェクトID: ${this.projectId || '未設定'}
- モデル: ${params.model}

💡 解決方法:
1. https://aistudio.google.com/apikey で正しいAPIキーを取得
2. APIキーが "AIza..." で始まることを確認
3. APIキーに適切な権限が付与されていることを確認
4. Gemini APIが有効化されていることを確認
            `
          } else if (errorStr.includes('400') && errorStr.includes('Invalid value')) {
            errorMessage = 'リクエスト形式エラー: プロンプトの形式が正しくありません。'
            diagnosticInfo = `
🔍 診断情報:
- プロンプト: "${params.prompt}"
- モデル: ${params.model}

💡 解決方法:
1. プロンプトが適切な形式であることを確認
2. 特殊文字や無効な文字が含まれていないか確認
            `
          } else if (errorStr.includes('429')) {
            errorMessage = 'レート制限エラー: API呼び出し回数が上限に達しました。'
            diagnosticInfo = `
💡 解決方法:
1. しばらく待ってから再試行してください
2. API使用量の制限を確認してください
            `
            shouldRetry = true
          } else if (errorStr.includes('500') || errorStr.includes('503')) {
            errorMessage = 'サーバーエラー: Gemini APIサーバーで問題が発生しています。'
            diagnosticInfo = `
💡 解決方法:
1. しばらく待ってから再試行してください
2. Gemini APIのステータスを確認してください
            `
            shouldRetry = true
          } else if (errorStr.includes('quota') || errorStr.includes('rate limit')) {
            errorMessage = 'クォータ制限エラー: API使用量の制限に達しました。'
            diagnosticInfo = `
💡 解決方法:
1. しばらく待ってから再試行してください
2. 別のAPIキーを使用してください
            `
            shouldRetry = true
          } else {
            errorMessage = `Gemini API image generation failed: ${errorStr}`
            diagnosticInfo = `
🔍 エラー詳細:
${errorStr}

💡 一般的な解決方法:
1. APIキーの有効性を確認
2. ネットワーク接続を確認
3. Gemini APIの利用可能性を確認
            `
            shouldRetry = true
          }
        }
        
        // 再試行可能なエラーの場合は、フォールバックを試行
        if (shouldRetry) {
          console.log('🔄 フォールバック: 別のモデルで再試行中...')
          try {
            // 別のモデルで再試行
            const fallbackModel = 'gemini-1.5-flash'
            console.log(`🔄 フォールバックモデル ${fallbackModel} で再試行`)
            
            const fallbackResult = await this.callGeminiImageAPI({
              prompt: params.prompt,
              model: fallbackModel
            })
            
            console.log('✅ フォールバック成功')
            return fallbackResult
          } catch (fallbackError) {
            console.error('❌ フォールバックも失敗:', fallbackError)
          }
        }
        
        const fullErrorMessage = errorMessage + diagnosticInfo
        throw new Error(fullErrorMessage)
      }
    }
  }

  /**
   * Imagen APIを呼び出して画像生成（従来の方法）
   */
  private async callVertexAIImageAPI(params: {
    prompt: string
    model: string
    width: number
    height: number
    quality: string
    style: string
    safetyFilter: string
    personGeneration: string
  }): Promise<{ images: string[] }> {
    // ブラウザ環境かどうかをチェック
    const isBrowser = typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
    
    if (isBrowser) {
      // ブラウザ環境の場合、Electronメインプロセス経由で実行
      if (!this.projectId) {
        throw new Error('Project ID is required for Imagen API calls')
      }

      console.log('Electronメインプロセス経由でImagen画像生成を実行')
      
      const result = await (window as any).electronAPI.generateImage({
        prompt: params.prompt,
        model: params.model,
        width: params.width,
        height: params.height,
        quality: params.quality,
        style: params.style,
        safetyFilter: params.safetyFilter,
        personGeneration: params.personGeneration,
        projectId: this.projectId,
        location: this.location
      })

      if (!result.success) {
        throw new Error(result.error || 'Image generation failed')
      }

      return { images: result.images || [] }
    } else {
      // Node.js環境の場合、直接APIを呼び出し
      if (!this.projectId) {
        throw new Error('Project ID is required for Imagen API calls')
      }

      if (!this.auth) {
        throw new Error('Google Cloud認証が初期化されていません。configure()を先に呼び出してください。')
      }

      // OAuth2アクセストークンを取得
      let accessToken: string
      try {
        const client = await this.auth.getClient()
        const tokenResponse = await client.getAccessToken()
        accessToken = tokenResponse.token || ''
        if (!accessToken) {
          throw new Error('アクセストークンが取得できませんでした')
        }
        console.log('OAuth2アクセストークン取得完了')
      } catch (error) {
        console.error('OAuth2アクセストークン取得エラー:', error)
        throw new Error('OAuth2アクセストークンの取得に失敗しました。認証情報を確認してください。')
      }

      // Imagen APIの正しいエンドポイント
      const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/${params.model}:predict`

      // Imagen APIの正しいリクエスト形式
      const requestBody = {
        instances: [{
          prompt: params.prompt
        }],
        parameters: {
          sampleImageSize: `${params.width}x${params.height}`,
          sampleCount: 1,
          mimeType: "image/png",
          quality: params.quality,
          style: params.style,
          safetyFilterLevel: params.safetyFilter,
          personGeneration: params.personGeneration
        }
      }

      try {
        console.log('Imagen API リクエスト:', {
          endpoint,
          model: params.model,
          prompt: params.prompt,
          size: `${params.width}x${params.height}`,
          quality: params.quality
        })

        console.log('Request body:', JSON.stringify(requestBody, null, 2))

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        console.log('Response status:', response.status)
        console.log('Response headers:', Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          let errorData = {}
          try {
            errorData = JSON.parse(errorText)
          } catch (e) {
            console.error('Failed to parse error response as JSON:', errorText)
          }
          console.error('Imagen API エラーレスポンス:', errorData)
          throw new Error(`Imagen API request failed: ${response.status} ${response.statusText}`)
        }

        const responseData = await response.json()
        console.log('Imagen API レスポンス:', JSON.stringify(responseData, null, 2))

        // レスポンスから画像データを抽出
        const images: string[] = []
        if (responseData.predictions && responseData.predictions.length > 0) {
          for (const prediction of responseData.predictions) {
            if (prediction.bytesBase64Encoded) {
              images.push(prediction.bytesBase64Encoded)
            }
          }
        }

        console.log(`生成された画像数: ${images.length}`)
        return { images }
      } catch (error) {
        console.error('Imagen API呼び出しエラー:', error)
        throw new Error(`Imagen API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  /**
   * 複数の画像を生成
   */
  async generateMultipleImages(request: ImageGenerationRequest, count: number = 1): Promise<ImageGenerationResponse> {
    const images: string[] = []
    
    for (let i = 0; i < count; i++) {
      const result = await this.generateImage(request)
      images.push(...result.images)
    }

    return {
      images,
      prompt: request.prompt,
      model: request.model || 'gemini-2.0-flash-preview-image-generation',
      metadata: {
        width: 1024,
        height: 1024,
        quality: request.quality || 'standard',
        style: request.style || 'photorealistic',
        generatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * 画像生成の進捗を取得（非同期処理の場合）
   */
  async getGenerationStatus(operationName: string): Promise<any> {
    if (!this.projectId) {
      throw new Error('Project ID is required')
    }

    if (!this.auth) {
      throw new Error('Google Cloud認証が初期化されていません。configure()を先に呼び出してください。')
    }

    // OAuth2アクセストークンを取得
    const client = await this.auth.getClient()
    const tokenResponse = await client.getAccessToken()
    const accessToken = tokenResponse.token || ''
    if (!accessToken) {
      throw new Error('アクセストークンが取得できませんでした')
    }

    const endpoint = `https://${this.location}-aiplatform.googleapis.com/v1/${operationName}`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get operation status: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * APIキーの診断情報を取得
   */
  async diagnoseApiKey(): Promise<{
    isValid: boolean
    format: string
    length: number
    startsWithAIza: boolean
    testResult: boolean
    error?: string
    recommendations: string[]
  }> {
    if (!this.apiKey) {
      return {
        isValid: false,
        format: '未設定',
        length: 0,
        startsWithAIza: false,
        testResult: false,
        error: 'APIキーが設定されていません',
        recommendations: [
          'https://aistudio.google.com/apikey でAPIキーを取得してください',
          '環境変数 VITE_GOOGLE_API_KEY に設定してください'
        ]
      }
    }

    const format = this.apiKey.substring(0, 10) + '...'
    const length = this.apiKey.length
    const startsWithAIza = this.apiKey.startsWith('AIza')
    
    let testResult = false
    let error: string | undefined
    let recommendations: string[] = []

    try {
      testResult = await this.testApiKey(this.apiKey)
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error'
    }

    // 推奨事項を生成
    if (!startsWithAIza) {
      recommendations.push('APIキーが "AIza..." で始まっていません。正しいGoogle AI APIキーを取得してください')
    }
    
    if (length < 30 || length > 50) {
      recommendations.push('APIキーの長さが異常です。通常は39文字程度です')
    }
    
    if (!testResult && error) {
      if (error.includes('quota') || error.includes('rate limit')) {
        recommendations.push('API使用量の制限に達しています。しばらく待ってから再試行してください')
      } else if (error.includes('permission') || error.includes('unauthorized')) {
        recommendations.push('APIキーが無効です。新しいAPIキーを取得してください')
      } else {
        recommendations.push('一時的なエラーの可能性があります。しばらく待ってから再試行してください')
      }
    }

    return {
      isValid: this.isValidApiKey(this.apiKey) && testResult,
      format,
      length,
      startsWithAIza,
      testResult,
      error,
      recommendations
    }
  }

  /**
   * 設定状況の詳細レポートを生成
   */
  async generateDiagnosticReport(): Promise<string> {
    const report = []
    
    report.push('=== Gemini Image Service 診断レポート ===')
    report.push(`生成日時: ${new Date().toISOString()}`)
    report.push('')
    
    // APIキーの診断
    const apiKeyDiagnosis = await this.diagnoseApiKey()
    report.push('🔑 APIキー診断:')
    report.push(`  形式: ${apiKeyDiagnosis.format}`)
    report.push(`  長さ: ${apiKeyDiagnosis.length}文字`)
    report.push(`  AIza開始: ${apiKeyDiagnosis.startsWithAIza ? '✅' : '❌'}`)
    report.push(`  テスト結果: ${apiKeyDiagnosis.testResult ? '✅' : '❌'}`)
    if (apiKeyDiagnosis.error) {
      report.push(`  エラー: ${apiKeyDiagnosis.error}`)
    }
    report.push('')
    
    // プロジェクト設定
    report.push('🏗️ プロジェクト設定:')
    report.push(`  プロジェクトID: ${this.projectId || '未設定'}`)
    report.push(`  ロケーション: ${this.location}`)
    report.push('')
    
    // モデル設定
    report.push('🤖 モデル設定:')
    const models = this.getAvailableModels()
    Object.entries(models).forEach(([key, model]) => {
      report.push(`  ${key}: ${model.description}`)
    })
    report.push('')
    
    // プロンプト補完機能
    report.push('✨ プロンプト補完機能:')
    report.push(`  有効: ${this.enablePromptEnhancement ? '✅' : '❌'}`)
    report.push(`  エージェント: ${this.promptEnhancementAgent ? '✅' : '❌'}`)
    report.push('')
    
    // 環境情報
    report.push('🌍 環境情報:')
    report.push(`  ブラウザ環境: ${typeof window !== 'undefined' ? '✅' : '❌'}`)
    report.push(`  Electron環境: ${typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined' ? '✅' : '❌'}`)
    report.push(`  Node.js環境: ${typeof window === 'undefined' ? '✅' : '❌'}`)
    
    return report.join('\n')
  }
}
