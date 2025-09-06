import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from '@google/genai'
import { LLMResponse } from '@/types/llm'

export interface ImageGenerationResponse {
  images: string[] // Base64 encoded images
  prompt: string
  model: string
}

export interface VideoGenerationResponse {
  video: string // Base64 encoded video
  prompt: string
  model: string
}

export interface MultimodalResponse {
  text: string
  imageAnalysis: string
  tokens: number
  duration: number
}

export interface AudioVideoResponse {
  text: string
  analysis: string
  tokens: number
  duration: number
}

export interface DocumentResponse {
  text: string
  analysis: string
  tokens: number
  duration: number
  documentType?: string
  pageCount?: number
}

export interface ImageAnalysisResponse {
  text: string
  analysis: string
  tokens: number
  duration: number
  imageFormat?: string
  objects?: Array<{
    label: string
    box_2d?: number[]
    confidence?: number
  }>
  segmentation?: Array<{
    label: string
    box_2d: number[]
    mask: string
  }>
}

export interface VideoFileInfo {
  uri: string
  mimeType: string
  displayName: string
  name?: string
}

export interface FileUploadResponse {
  name: string
  uri: string
  mimeType: string
  displayName: string
  sizeBytes?: number
  createTime?: string
  updateTime?: string
  state?: 'PROCESSING' | 'ACTIVE' | 'FAILED'
}

export interface FileMetadata {
  name: string
  uri: string
  mimeType: string
  displayName: string
  sizeBytes?: number
  createTime?: string
  updateTime?: string
  state?: 'PROCESSING' | 'ACTIVE' | 'FAILED'
}

export class GoogleDirectService {
  private ai: GoogleGenAI | null = null
  private requestCount = 0
  private lastRequestTime = 0
  private readonly MAX_REQUESTS_PER_MINUTE = 60
  private readonly MIN_REQUEST_INTERVAL = 1000 // 1秒
  private currentModel = 'gemini-2.5-flash'

  async configure(apiKey: string, modelId?: string) {
    console.log('=== Google Direct Service 設定開始 ===')
    console.log('API Key:', apiKey ? '設定済み' : '未設定')
    console.log('モデル:', modelId || this.currentModel)
    
    try {
      this.ai = new GoogleGenAI({ apiKey })
      if (modelId) {
        this.currentModel = modelId
      }
      console.log('Google Direct Service 設定完了')
    } catch (error) {
      console.error('Google Direct Service 設定エラー:', error)
      throw new Error(`Google Direct Service configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ファイルをGemini Files APIにアップロード
   * Gemini Files APIドキュメントに基づく実装
   */
  async uploadFile(file: File, displayName?: string): Promise<FileUploadResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    console.log('=== ファイルアップロード開始 ===')
    console.log('ファイル名:', file.name)
    console.log('ファイルサイズ:', file.size, 'bytes')
    console.log('MIMEタイプ:', file.type)
    console.log('表示名:', displayName || file.name)

    try {
      // Files APIを使用してファイルをアップロード
      const uploadedFile = await this.ai.files.upload({
        file: file,
        config: {
          mimeType: file.type,
          displayName: displayName || file.name
        }
      })

      console.log('ファイルアップロード成功:')
      console.log('- 名前:', uploadedFile.name)
      console.log('- URI:', uploadedFile.uri)
      console.log('- MIMEタイプ:', uploadedFile.mimeType)
      console.log('- 表示名:', uploadedFile.displayName)

      return {
        name: uploadedFile.name || '',
        uri: uploadedFile.uri || '',
        mimeType: uploadedFile.mimeType || file.type,
        displayName: uploadedFile.displayName || file.name,
        sizeBytes: uploadedFile.sizeBytes,
        createTime: uploadedFile.createTime,
        updateTime: uploadedFile.updateTime,
        state: uploadedFile.state
      }
    } catch (error) {
      console.error('=== ファイルアップロードエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * アップロードされたファイルのメタデータを取得
   */
  async getFileMetadata(fileName: string): Promise<FileMetadata> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    console.log('=== ファイルメタデータ取得 ===')
    console.log('ファイル名:', fileName)

    try {
      const file = await this.ai.files.get({ name: fileName })
      
      console.log('ファイルメタデータ取得成功:')
      console.log('- 名前:', file.name)
      console.log('- URI:', file.uri)
      console.log('- 状態:', file.state)

      return {
        name: file.name || '',
        uri: file.uri || '',
        mimeType: file.mimeType || '',
        displayName: file.displayName || '',
        sizeBytes: file.sizeBytes,
        createTime: file.createTime,
        updateTime: file.updateTime,
        state: file.state
      }
    } catch (error) {
      console.error('=== ファイルメタデータ取得エラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`File metadata retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * アップロードされたファイルのリストを取得
   */
  async listFiles(pageSize: number = 10): Promise<FileMetadata[]> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    console.log('=== ファイルリスト取得 ===')
    console.log('ページサイズ:', pageSize)

    try {
      const listResponse = await this.ai.files.list({ config: { pageSize } })
      const files: FileMetadata[] = []

      for await (const file of listResponse) {
        files.push({
          name: file.name || '',
          uri: file.uri || '',
          mimeType: file.mimeType || '',
          displayName: file.displayName || '',
          sizeBytes: file.sizeBytes,
          createTime: file.createTime,
          updateTime: file.updateTime,
          state: file.state
        })
      }

      console.log('ファイルリスト取得成功:', files.length, '個のファイル')
      return files
    } catch (error) {
      console.error('=== ファイルリスト取得エラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`File list retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ファイルを削除
   */
  async deleteFile(fileName: string): Promise<void> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    console.log('=== ファイル削除 ===')
    console.log('ファイル名:', fileName)

    try {
      await this.ai.files.delete({ name: fileName })
      console.log('ファイル削除成功')
    } catch (error) {
      console.error('=== ファイル削除エラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`File deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ファイルを使用してコンテンツを生成
   * Gemini Files APIドキュメントに基づく実装
   */
  async generateContentWithFile(
    prompt: string, 
    fileUri: string, 
    mimeType: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    console.log('=== ファイルを使用したコンテンツ生成開始 ===')
    console.log('プロンプト:', prompt)
    console.log('ファイルURI:', fileUri)
    console.log('MIMEタイプ:', mimeType)

    try {
      const { createUserContent, createPartFromUri } = await import('@google/genai')

      if (onChunk) {
        // ストリーミングモード
        const stream = await this.ai.models.generateContentStream({
          model: this.currentModel,
          contents: createUserContent([
            createPartFromUri(fileUri, mimeType),
            prompt
          ])
        })

        let fullResponse = ''
        for await (const chunk of stream) {
          if (chunk.text) {
            fullResponse += chunk.text
            onChunk(chunk.text)
          }
        }

        console.log('ストリーミング完了')
        return fullResponse
      } else {
        // 通常モード
        const response = await this.ai.models.generateContent({
          model: this.currentModel,
          contents: createUserContent([
            createPartFromUri(fileUri, mimeType),
            prompt
          ])
        })

        console.log('コンテンツ生成完了')
        return response.text || ''
      }
    } catch (error) {
      console.error('=== ファイルを使用したコンテンツ生成エラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Content generation with file failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 動画ファイルをアップロード（Files API使用）
   */
  async uploadVideoFile(videoData: string, fileName: string = 'video.mp4'): Promise<VideoFileInfo> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    console.log('=== 動画ファイルアップロード開始 ===')
    console.log('ファイル名:', fileName)
    console.log('Base64データ長:', videoData.length)

    try {
      // Base64データをBlobに変換
      console.log('Base64データをBlobに変換中...')
      const binaryString = atob(videoData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: 'video/mp4' })
      console.log('Blob作成完了、サイズ:', blob.size, 'bytes')

      // Fileオブジェクトを作成
      const file = new File([blob], fileName, { type: 'video/mp4' })

      // Files APIを使用してアップロード
      console.log('Files APIを使用してアップロード開始...')
      const uploadedFile = await this.uploadFile(file, fileName)

      console.log('動画ファイルアップロード成功:')
      console.log('- URI:', uploadedFile.uri)
      console.log('- MIMEタイプ:', uploadedFile.mimeType)
      console.log('- 表示名:', uploadedFile.displayName)

      return {
        uri: uploadedFile.uri,
        mimeType: uploadedFile.mimeType,
        displayName: uploadedFile.displayName
      }
    } catch (error) {
      console.error('=== 動画ファイルアップロードエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Video file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 動画サイズが大きいかどうかを判定
   */
  private isVideoLarge(videoData: string): boolean {
    const sizeInBytes = (videoData.length * 3) / 4 // Base64の概算サイズ
    const sizeInMB = sizeInBytes / (1024 * 1024)
    const isLarge = sizeInBytes > 50 * 1024 * 1024
    console.log('=== 動画サイズチェック ===')
    console.log('Base64データ長:', videoData.length)
    console.log('概算サイズ:', sizeInMB.toFixed(2), 'MB')
    console.log('50MB制限:', isLarge ? '超過（File API使用）' : '未満（インライン処理）')
    return isLarge
  }

  /**
   * 画像サイズが大きいかどうかを判定
   */
  private isImageLarge(imageData: string): boolean {
    const sizeInBytes = (imageData.length * 3) / 4 // Base64の概算サイズ
    const sizeInMB = sizeInBytes / (1024 * 1024)
    const isLarge = sizeInBytes > 50 * 1024 * 1024
    console.log('=== 画像サイズチェック ===')
    console.log('Base64データ長:', imageData.length)
    console.log('概算サイズ:', sizeInMB.toFixed(2), 'MB')
    console.log('50MB制限:', isLarge ? '超過（File API使用）' : '未満（インライン処理）')
    return isLarge
  }

  async generateResponse(prompt: string, imageData?: string, videoData?: string, audioData?: string): Promise<LLMResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    const startTime = Date.now()
    
    try {
      let contents: any
      
      if (imageData || videoData || audioData) {
        // マルチモーダル（画像/ビデオ/音声 + テキスト）
        const parts: any[] = [{ text: prompt }]
        
        if (imageData) {
          parts.push({ inlineData: { data: imageData, mimeType: 'image/jpeg' } })
        }
        
        if (videoData) {
          // 動画サイズに応じて処理方法を選択
          if (this.isVideoLarge(videoData)) {
            // 大きな動画はFile APIを使用
            const videoFile = await this.uploadVideoFile(videoData)
            parts.push({ fileData: { fileUri: videoFile.uri, mimeType: videoFile.mimeType } })
          } else {
            // 小さな動画はインライン処理
            parts.push({ inlineData: { data: videoData, mimeType: 'video/mp4' } })
          }
        }
        
        if (audioData) {
          parts.push({ inlineData: { data: audioData, mimeType: 'audio/mpeg' } })
        }
        
        contents = [
          {
            role: 'user',
            parts: parts
          }
        ]
      } else {
        // テキストのみ
        contents = prompt
      }

      // Using the new centralized client architecture
      console.log('Sending request to model:', this.currentModel)
      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: contents
      })
      
      const endTime = Date.now()
      
      return {
        text: response.text || '',
        tokens: (response.text || '').length, // Approximate token count
        duration: endTime - startTime
      }
    } catch (error) {
      console.error('Error generating response with Google Direct Service:', error)
      throw new Error(`Google AI response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * リクエスト制限チェック
   */
  private checkRequestLimit(): void {
    const now = Date.now()
    
    // 1分間のリクエスト数制限
    if (now - this.lastRequestTime > 60000) {
      this.requestCount = 0
    }
    
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      throw new Error('Request limit exceeded. Please wait before making another request.')
    }
    
    // 最小間隔チェック
    if (now - this.lastRequestTime < this.MIN_REQUEST_INTERVAL) {
      throw new Error('Request too frequent. Please wait before making another request.')
    }
    
    this.requestCount++
    this.lastRequestTime = now
  }

  /**
   * ストリーミングレスポンス（Files API対応版）
   */
  async streamResponse(prompt: string, onChunk: (chunk: string) => void, imageData?: string, videoData?: string, audioData?: string, imageMimeType?: string, abortController?: AbortController): Promise<void> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    // リクエスト制限チェック
    this.checkRequestLimit()

    console.log('=== streamResponse開始 ===')
    console.log('使用モデル:', this.currentModel)
    console.log('プロンプト:', prompt)
    console.log('画像データ:', imageData ? `あり (${imageData.length} chars)` : 'なし')
    console.log('動画データ:', videoData ? `あり (${videoData.length} chars)` : 'なし')
    console.log('音声データ:', audioData ? `あり (${audioData.length} chars)` : 'なし')

    try {
      let contents: any

      if (imageData || videoData || audioData) {
        const parts: any[] = [{ text: prompt }]

        if (imageData) {
          // 画像のMIMEタイプを動的に設定
          const mimeType = imageMimeType || 'image/jpeg'
          console.log('画像データ処理開始 - MIMEタイプ:', mimeType)
          
          // 画像サイズに応じて処理方法を選択
          if (this.isImageLarge(imageData)) {
            console.log('大きな画像を検出、Files APIを使用')
            try {
              console.log('Files APIを使用して画像をアップロード開始...')
              const imageFile = await this.uploadImageFile(imageData, mimeType)
              console.log('画像ファイルアップロード完了:', imageFile.uri)
              parts.push({ fileData: { fileUri: imageFile.uri, mimeType: imageFile.mimeType } })
            } catch (error) {
              console.error('画像ファイルアップロードエラー、インライン処理にフォールバック:', error)
              // フォールバック: インライン処理を使用
              parts.push({ inlineData: { data: imageData, mimeType: mimeType } })
            }
          } else {
            console.log('小さな画像を検出、インライン処理を使用')
            parts.push({ inlineData: { data: imageData, mimeType: mimeType } })
          }
        }

        if (videoData) {
          console.log('動画データ処理開始')
          if (this.isVideoLarge(videoData)) {
            console.log('大きな動画を検出、Files APIを使用')
            const videoFile = await this.uploadVideoFile(videoData)
            console.log('動画ファイルアップロード完了:', videoFile.uri)
            parts.push({ fileData: { fileUri: videoFile.uri, mimeType: videoFile.mimeType } })
          } else {
            console.log('小さな動画を検出、インライン処理を使用')
            parts.push({ inlineData: { data: videoData, mimeType: 'video/mp4' } })
          }
        }

        if (audioData) {
          console.log('音声データを追加')
          parts.push({ inlineData: { data: audioData, mimeType: 'audio/mpeg' } })
        }

        // 新しいSDKのcreateUserContentとcreatePartFromUriを使用
        const contentParts = []
        
        // テキスト部分を追加
        contentParts.push(prompt)
        
        // ファイル部分を追加（Files APIを使用した場合）
        for (const part of parts) {
          if (part.fileData) {
            contentParts.push(createPartFromUri(part.fileData.fileUri, part.fileData.mimeType))
          } else if (part.inlineData) {
            // インライン処理の場合は従来の方法を使用
            contentParts.push(part)
          }
        }
        
        contents = createUserContent(contentParts)
        console.log('コンテンツ構成:', contentParts.length, 'パーツ')
        console.log('コンテンツ詳細:', JSON.stringify(contents, null, 2))
      } else {
        console.log('テキストのみの処理')
        contents = createUserContent([prompt])
      }

      console.log('Gemini API呼び出し開始:', this.currentModel)
      console.log('送信コンテンツ:', typeof contents === 'string' ? contents : 'マルチモーダル')
      
      // Gemini 2.5 Flash Lite用の特別な設定
      const requestOptions: any = {
        model: this.currentModel,
        contents: contents
      }
      
      // Gemini 2.5 Flash Liteの場合はストリーミング安定性を向上させる設定を追加
      if (this.currentModel.includes('gemini-2.5-flash-lite')) {
        requestOptions.generationConfig = {
          temperature: 0.3, // より一貫性のある応答のため低めに設定
          topP: 0.9,
          topK: 50,
          maxOutputTokens: 4096, // より長い応答を許可
          stopSequences: ['\n\n', '。', '.', '!', '?'] // 自然な停止シーケンス
        }
        console.log('Gemini 2.5 Flash Lite用の最適化設定を適用')
      }
      
      const stream = await this.ai.models.generateContentStream(requestOptions)

      console.log('ストリーミング開始')
      let chunkCount = 0
      let lastChunkText = '' // 重複チェック用
      let totalText = '' // 全体のテキストを追跡
      
      for await (const chunk of stream) {
        // 停止チェック
        if (abortController?.signal.aborted) {
          console.log('Google Direct Service streaming stopped by user')
          break
        }
        
        if (chunk.text && chunk.text !== lastChunkText) {
          chunkCount++
          totalText += chunk.text
          
          // デバッグ情報を改善
          console.log(`チャンク ${chunkCount}:`, {
            chunkText: chunk.text.substring(0, 50) + (chunk.text.length > 50 ? '...' : ''),
            chunkLength: chunk.text.length,
            totalLength: totalText.length,
            isDuplicate: chunk.text === lastChunkText
          })
          
          onChunk(chunk.text)
          lastChunkText = chunk.text
        }
      }
      
      console.log('ストリーミング完了:', {
        totalChunks: chunkCount,
        totalTextLength: totalText.length,
        finalText: totalText.substring(0, 100) + (totalText.length > 100 ? '...' : '')
      })
    } catch (error) {
      console.error('=== streamResponseエラー ===')
      console.error('エラー詳細:', error)
      console.error('エラースタック:', error instanceof Error ? error.stack : 'スタックトレースなし')
      
      // 停止によるエラーの場合は特別処理
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Google Direct Service streaming was aborted by user')
        return
      }
      
      throw new Error(`Google AI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 画像生成機能（現在は利用不可のため、将来の実装のためにプレースホルダー）
  async generateImages(prompt: string, count: number = 1): Promise<ImageGenerationResponse> {
    throw new Error('Image generation is not yet available in the current Google GenAI SDK version. This feature will be implemented when the API becomes available.')
  }

  // ビデオ生成機能（現在は利用不可のため、将来の実装のためにプレースホルダー）
  async generateVideo(prompt: string): Promise<VideoGenerationResponse> {
    throw new Error('Video generation is not yet available in the current Google GenAI SDK version. This feature will be implemented when the API becomes available.')
  }

  // マルチモーダル理解（画像 + テキスト）
  async analyzeImageWithText(imageData: string, textPrompt: string): Promise<MultimodalResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    const startTime = Date.now()

    try {
      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: [
          {
            role: 'user',
            parts: [
              { text: textPrompt },
              { inlineData: { data: imageData, mimeType: 'image/jpeg' } }
            ]
          }
        ]
      })

      const endTime = Date.now()

      return {
        text: response.text || '',
        imageAnalysis: response.text || '',
        tokens: (response.text || '').length,
        duration: endTime - startTime
      }
    } catch (error) {
      console.error('Error analyzing image with text:', error)
      throw new Error(`Multimodal analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }



  // ビデオ理解（修正版）
  async analyzeVideo(videoData: string, textPrompt?: string): Promise<AudioVideoResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    const startTime = Date.now()
    const prompt = textPrompt || 'このビデオの内容を詳しく説明してください。'

    try {
      let parts: any[] = [{ text: prompt }]

      // 動画サイズに応じて処理方法を選択
      if (this.isVideoLarge(videoData)) {
        // 大きな動画はFile APIを使用
        const videoFile = await this.uploadVideoFile(videoData)
        parts.push({ fileData: { fileUri: videoFile.uri, mimeType: videoFile.mimeType } })
      } else {
        // 小さな動画はインライン処理
        parts.push({ inlineData: { data: videoData, mimeType: 'video/mp4' } })
      }

      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: [
          {
            role: 'user',
            parts: parts
          }
        ]
      })

      const endTime = Date.now()

      return {
        text: response.text || '',
        analysis: response.text || '',
        tokens: (response.text || '').length,
        duration: endTime - startTime
      }
    } catch (error) {
      console.error('Error analyzing video:', error)
      throw new Error(`Video analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 音声理解
  async analyzeAudio(audioData: string, textPrompt?: string, mimeType?: string): Promise<AudioVideoResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    const startTime = Date.now()
    const prompt = textPrompt || 'この音声の内容を詳しく説明してください。'
    
    // MIMEタイプの判定
    const audioMimeType = mimeType || this.detectAudioMimeType(audioData)

    // 音声ファイルサイズのチェック（制限なし）
    const audioSizeInBytes = this.calculateAudioSize(audioData)
    const durationInHours = audioSizeInBytes / (16000 * 60 * 60)
    console.log(`音声ファイル情報: ${durationInHours.toFixed(2)}時間 - 任意の長さの音声ファイルを処理します`)
    
    // 制限を削除 - 任意の長さの音声ファイルを許可

    try {
      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: audioData, mimeType: audioMimeType } }
            ]
          }
        ]
      })

      const endTime = Date.now()

      return {
        text: response.text || '',
        analysis: response.text || '',
        tokens: (response.text || '').length,
        duration: endTime - startTime
      }
    } catch (error) {
      console.error('Error analyzing audio:', error)
      throw new Error(`Audio analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 音声データのMIMEタイプを判定
   */
  private detectAudioMimeType(audioData: string): string {
    // Base64データの先頭バイトから判定
    const base64Data = audioData.replace(/^data:audio\/[^;]+;base64,/, '')
    const bytes = atob(base64Data).slice(0, 12)
    const uint8Array = new Uint8Array(bytes.length)
    for (let i = 0; i < bytes.length; i++) {
      uint8Array[i] = bytes.charCodeAt(i)
    }

    // ファイルシグネチャによる判定
    const signature = Array.from(uint8Array).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
    
    if (signature.startsWith('FFFB') || signature.startsWith('494433')) {
      return 'audio/mpeg' // MP3
    } else if (signature.startsWith('52494646') && signature.includes('57415645')) {
      return 'audio/wav' // WAV
    } else if (signature.startsWith('4F676753')) {
      return 'audio/ogg' // OGG
    } else if (signature.startsWith('664C6143')) {
      return 'audio/flac' // FLAC
    } else if (signature.startsWith('FFFE') || signature.startsWith('FFFD')) {
      return 'audio/aac' // AAC
    } else if (signature.startsWith('464F524D') && signature.includes('41494646')) {
      return 'audio/aiff' // AIFF
    }
    
    // デフォルト
    return 'audio/mpeg'
  }

  /**
   * 音声データのサイズを計算
   */
  private calculateAudioSize(audioData: string): number {
    // Base64データから実際のバイトサイズを計算
    const base64Data = audioData.replace(/^data:audio\/[^;]+;base64,/, '')
    return (base64Data.length * 3) / 4 // Base64の概算サイズ
  }

  /**
   * 画像を分析してキャプション、オブジェクト検出、分類を実行
   * Gemini API Image Understandingドキュメントに基づく実装
   */
  async analyzeImage(
    imageData: string, 
    prompt: string = "この画像について詳しく説明してください",
    mimeType: string = 'image/jpeg'
  ): Promise<ImageAnalysisResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    console.log('=== 画像分析開始 ===')
    console.log('プロンプト:', prompt)
    console.log('MIMEタイプ:', mimeType)
    console.log('画像データサイズ:', imageData.length, 'characters')

    const startTime = Date.now()

    try {
      // 画像サイズをチェック（50MB制限）
      const sizeInBytes = (imageData.length * 3) / 4 // Base64の概算サイズ
      const sizeInMB = sizeInBytes / (1024 * 1024)
      console.log('画像サイズ:', sizeInMB.toFixed(2), 'MB')

      let response: string

      if (sizeInBytes > 50 * 1024 * 1024) {
        console.log('大きな画像を検出、Files APIを使用')
        // 大きな画像はFiles APIを使用
        const file = await this.uploadImageFile(imageData, mimeType)
        response = await this.generateContentWithFile(prompt, file.uri, file.mimeType)
      } else {
        console.log('小さな画像を検出、インライン処理を使用')
        // 小さな画像はインライン処理
        const result = await this.ai.models.generateContent({
          model: this.currentModel,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                { inlineData: { data: imageData, mimeType: mimeType } }
              ]
            }
          ]
        })
        
        response = result.text || ''
      }

      const duration = Date.now() - startTime
      console.log('画像分析完了:', duration, 'ms')

      return {
        text: response,
        analysis: response,
        tokens: Math.ceil(response.length / 4), // 概算トークン数
        duration: duration,
        imageFormat: mimeType
      }
    } catch (error) {
      console.error('=== 画像分析エラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Image analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 画像ファイルをアップロード（Files API使用）
   */
  async uploadImageFile(imageData: string, mimeType: string, fileName: string = 'image.jpg'): Promise<FileUploadResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    console.log('=== 画像ファイルアップロード開始 ===')
    console.log('ファイル名:', fileName)
    console.log('MIMEタイプ:', mimeType)
    console.log('Base64データ長:', imageData.length)

    try {
      // Base64データをBlobに変換
      console.log('Base64データをBlobに変換中...')
      const binaryString = atob(imageData)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: mimeType })
      console.log('Blob作成完了、サイズ:', blob.size, 'bytes')

      // Fileオブジェクトを作成
      const file = new File([blob], fileName, { type: mimeType })

      // Files APIを使用してアップロード
      console.log('Files APIを使用してアップロード開始...')
      const uploadedFile = await this.uploadFile(file, fileName)

      console.log('画像ファイルアップロード成功:')
      console.log('- URI:', uploadedFile.uri)
      console.log('- MIMEタイプ:', uploadedFile.mimeType)
      console.log('- 表示名:', uploadedFile.displayName)

      return uploadedFile
    } catch (error) {
      console.error('=== 画像ファイルアップロードエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Image file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 画像のオブジェクト検出を実行
   * Gemini 2.0以降のモデルで強化されたオブジェクト検出機能
   */
  async detectObjectsInImage(
    imageData: string,
    mimeType: string = 'image/jpeg',
    objectTypes?: string[]
  ): Promise<ImageAnalysisResponse> {
    const objectTypesText = objectTypes ? `特に以下のオブジェクトに注目してください: ${objectTypes.join(', ')}` : ''
    const prompt = `この画像内のオブジェクトを検出し、各オブジェクトの位置（2Dバウンディングボックス）と信頼度を提供してください。${objectTypesText}

結果をJSON形式で返してください。各オブジェクトには以下の情報を含めてください：
- label: オブジェクトの名前
- box_2d: [y0, x0, y1, x1] 形式の2Dバウンディングボックス（0-1000の正規化座標）
- confidence: 信頼度（0-100）

例:
{
  "objects": [
    {
      "label": "cat",
      "box_2d": [100, 200, 300, 400],
      "confidence": 95
    }
  ]
}`

    return this.analyzeImage(imageData, prompt, mimeType)
  }

  /**
   * 画像のセグメンテーションを実行
   * Gemini 2.5以降のモデルで強化されたセグメンテーション機能
   */
  async segmentImage(
    imageData: string,
    targetObjects: string[],
    mimeType: string = 'image/jpeg'
  ): Promise<ImageAnalysisResponse> {
    const prompt = `${targetObjects.join('と')}のセグメンテーションマスクを提供してください。

各エントリについて以下を含むJSONリストを出力してください：
- "box_2d": 2Dバウンディングボックス（0-1000の正規化座標）
- "mask": セグメンテーションマスク（PNG形式のBase64データURI）
- "label": 説明的なラベル

例:
[
  {
    "box_2d": [100, 200, 300, 400],
    "mask": "data:image/png;base64,...",
    "label": "wooden table"
  }
]`

    const response = await this.analyzeImage(imageData, prompt, mimeType)
    
    // セグメンテーション結果をパース
    try {
      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const segmentationData = JSON.parse(jsonMatch[0])
        response.segmentation = segmentationData
      }
    } catch (error) {
      console.warn('セグメンテーション結果のパースに失敗:', error)
    }

    return response
  }

  /**
   * 画像の詳細なキャプションを生成
   */
  async generateImageCaption(
    imageData: string,
    style: 'descriptive' | 'concise' | 'creative' = 'descriptive',
    mimeType: string = 'image/jpeg'
  ): Promise<ImageAnalysisResponse> {
    const stylePrompts = {
      descriptive: 'この画像について詳細で包括的な説明を提供してください。色、形、配置、雰囲気なども含めて説明してください。',
      concise: 'この画像を簡潔に説明してください。最も重要な要素に焦点を当ててください。',
      creative: 'この画像について創造的で魅力的な説明を書いてください。物語性を持たせて表現してください。'
    }

    return this.analyzeImage(imageData, stylePrompts[style], mimeType)
  }

  /**
   * 画像の視覚的質問応答
   */
  async answerVisualQuestion(
    imageData: string,
    question: string,
    mimeType: string = 'image/jpeg'
  ): Promise<ImageAnalysisResponse> {
    const prompt = `この画像を見て、以下の質問に答えてください：

質問: ${question}

画像の内容に基づいて詳細に回答してください。回答できない場合は、その理由を説明してください。`

    return this.analyzeImage(imageData, prompt, mimeType)
  }

  /**
   * 画像の分類
   */
  async classifyImage(
    imageData: string,
    categories?: string[],
    mimeType: string = 'image/jpeg'
  ): Promise<ImageAnalysisResponse> {
    const categoriesText = categories 
      ? `以下のカテゴリーの中から選択してください: ${categories.join(', ')}`
      : ''

    const prompt = `この画像を分類してください。${categoriesText}

分類結果を以下の形式で提供してください：
- メインカテゴリー
- サブカテゴリー（該当する場合）
- 信頼度（1-100）
- 分類の根拠

また、画像の内容についても簡潔に説明してください。`

    return this.analyzeImage(imageData, prompt, mimeType)
  }

  /**
   * 複数画像の比較分析
   */
  async compareImages(
    imageData1: string,
    imageData2: string,
    comparisonPrompt: string = "これらの画像の違いと共通点を分析してください",
    mimeType1: string = 'image/jpeg',
    mimeType2: string = 'image/jpeg'
  ): Promise<ImageAnalysisResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    console.log('=== 画像比較分析開始 ===')
    console.log('比較プロンプト:', comparisonPrompt)

    const startTime = Date.now()

    try {
      // 両方の画像をFiles APIにアップロード
      const file1 = await this.uploadImageFile(imageData1, mimeType1, 'image1.jpg')
      const file2 = await this.uploadImageFile(imageData2, mimeType2, 'image2.jpg')

      // 両方のファイルを使用してコンテンツを生成
      const response = await this.generateContentWithFile(
        comparisonPrompt,
        file1.uri,
        file1.mimeType
      )

      const duration = Date.now() - startTime

      console.log('画像比較分析完了:', duration, 'ms')

      return {
        text: response,
        analysis: response,
        tokens: Math.ceil(response.length / 4),
        duration: duration,
        imageFormat: 'comparison'
      }
    } catch (error) {
      console.error('=== 画像比較分析エラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Image comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // ドキュメント理解
  async analyzeDocument(documentData: string, mimeType: string, textPrompt?: string): Promise<DocumentResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    const startTime = Date.now()
    const prompt = textPrompt || 'このドキュメントの内容を詳しく説明してください。'

    try {
      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: documentData, mimeType: mimeType } }
            ]
          }
        ]
      })

      const endTime = Date.now()

      return {
        text: response.text || '',
        analysis: response.text || '',
        tokens: (response.text || '').length,
        duration: endTime - startTime,
        documentType: mimeType
      }
    } catch (error) {
      console.error('Error analyzing document:', error)
      throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 画像生成のストリーミング（現在は利用不可のため、将来の実装のためにプレースホルダー）
  async generateImagesStream(prompt: string, count: number = 1, onProgress?: (progress: number) => void): Promise<ImageGenerationResponse> {
    throw new Error('Image generation streaming is not yet available in the current Google GenAI SDK version. This feature will be implemented when the API becomes available.')
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.generateResponse('Hello, this is a test message.')
      return response.text.length > 0
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }
}
