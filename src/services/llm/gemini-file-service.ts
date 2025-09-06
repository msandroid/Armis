import { GoogleGenerativeAI, Part } from "@google/generative-ai"

export interface GeminiFileUploadResponse {
  file: {
    uri: string
    name?: string
    displayName?: string
    mimeType?: string
    sizeBytes?: string | number
    createTime?: string
    updateTime?: string
    state?: 'PROCESSING' | 'ACTIVE' | 'FAILED' | string
  }
}

export interface GeminiChatResponse {
  text: string
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

export class GeminiFileService {
  private genAI: GoogleGenerativeAI | null = null
  private model = "gemini-1.5-flash"
  private apiKey: string | null = null

  /**
   * Gemini File Serviceを初期化
   */
  async configure(apiKey: string, model?: string): Promise<void> {
    console.log('=== Gemini File Service 設定開始 ===')
    console.log('API Key:', apiKey ? '設定済み' : '未設定')
    console.log('モデル:', model || this.model)
    
    try {
      this.apiKey = apiKey
      this.genAI = new GoogleGenerativeAI(apiKey)
      
      if (model) {
        this.model = model
      }
      
      console.log('Gemini File Service 設定完了')
    } catch (error) {
      console.error('Gemini File Service 設定エラー:', error)
      throw new Error(`Gemini File Service configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ファイルをGeminiにアップロード（サーバーサイド用）
   * 参考記事の実装に基づく
   */
  async uploadFile(filePath: string, mimeType?: string, displayName?: string): Promise<GeminiFileUploadResponse> {
    throw new Error('uploadFile method is not available in browser environment. Use uploadFileObject instead.')
  }

  /**
   * FileオブジェクトをGeminiにアップロード（ブラウザ環境用）
   */
  async uploadFileObject(file: File, displayName?: string): Promise<GeminiFileUploadResponse> {
    if (!this.genAI) {
      throw new Error('Gemini File Service not configured. Call configure() first.')
    }

    console.log('=== Fileオブジェクトアップロード開始 ===')
    console.log('ファイル名:', file.name)
    console.log('MIMEタイプ:', file.type)
    console.log('ファイルサイズ:', file.size)
    console.log('表示名:', displayName || file.name)

    // ファイルサイズ制限チェック（動画ファイルは制限を緩和）
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')
    
    // 動画ファイルは2GBまで、音声ファイルは100MBまで、その他のファイルは50MBまで
    const maxFileSize = isVideo ? 2 * 1024 * 1024 * 1024 : 
                       isAudio ? 100 * 1024 * 1024 : 
                       50 * 1024 * 1024 // 動画: 2GB, 音声: 100MB, その他: 50MB
    if (file.size > maxFileSize) {
      const maxSizeMB = isVideo ? 2048 : isAudio ? 100 : 50
      throw new Error(`File size exceeds limit. Maximum allowed: ${maxSizeMB}MB, Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
    }

    // サポートされているファイルタイプをチェック
    const supportedTypes = [
      // 画像
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
      // ドキュメント
      'application/pdf', 'text/plain', 'text/markdown', 'application/json', 'text/csv',
      // 動画
      'video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/webm', 'video/mkv', 'video/m4v',
      // 音声
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/aac', 'audio/flac', 'audio/m4a', 'audio/wma'
    ]

    if (!supportedTypes.includes(file.type) && !file.type.startsWith('text/')) {
      console.warn(`Unsupported file type: ${file.type}. Attempting to process anyway.`)
    }

    try {
      // 動画ファイルの場合は専用処理
      if (isVideo) {
        return await this.uploadVideoFile(file, displayName)
      }
      
      // 音声ファイルの場合は専用処理
      if (isAudio) {
        return await this.uploadAudioFile(file, displayName)
      }

      // ブラウザ環境では、Fileオブジェクトを直接使用してGemini APIに送信
      const model = this.genAI.getGenerativeModel({ model: this.model })
      
      // 効率的なBase64エンコード（大きなファイル対応）
      const base64String = await this.fileToBase64(file)
      
      // 一時的なファイルURIを作成
      const tempFileUri = `data:${file.type};base64,${base64String}`
      
      console.log('Fileオブジェクト処理完了:')
      console.log('- 一時URI:', tempFileUri.substring(0, 100) + '...')
      console.log('- Base64サイズ:', base64String.length)
      
      return {
        file: {
          uri: tempFileUri,
          name: file.name,
          displayName: displayName || file.name,
          mimeType: file.type,
          sizeBytes: file.size.toString(),
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          state: 'ACTIVE'
        }
      }
    } catch (error) {
      console.error('=== Fileオブジェクトアップロードエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`File object upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 動画ファイル専用のアップロード処理
   * Gemini Files APIを使用して最大90分の動画に対応
   */
  private async uploadVideoFile(file: File, displayName?: string): Promise<GeminiFileUploadResponse> {
    console.log('=== 動画ファイル処理開始 ===')
    
    try {
      // 動画のメタデータを取得
      const videoMetadata = await this.getVideoMetadata(file)
      console.log('動画メタデータ:', videoMetadata)
      
      // 動画の長さとサイズをチェック
      const videoDuration = videoMetadata.duration
      const fileSizeMB = file.size / 1024 / 1024
      
      console.log(`動画情報: ${fileSizeMB.toFixed(2)}MB, ${videoDuration.toFixed(2)}秒`)
      
      // Gemini Files APIの制限に基づく制限チェック
      // 動画: 最大90分（5400秒）、最大2GB
      const maxVideoDuration = 5400 // 90分
      const maxFileSizeMB = 2048 // 2GB
      
      if (videoDuration > maxVideoDuration) {
        throw new Error(`動画が長すぎます。最大90分まで対応しています。現在: ${(videoDuration / 60).toFixed(2)}分`)
      }
      
      if (fileSizeMB > maxFileSizeMB) {
        throw new Error(`動画ファイルが大きすぎます。最大2GBまで対応しています。現在: ${fileSizeMB.toFixed(2)}MB`)
      }
      
      // 長い動画（1分以上）または大きなファイル（50MB以上）の場合はFiles APIを使用
      if (videoDuration > 60 || fileSizeMB > 50) {
        console.log('長い動画または大きなファイルを検出、Files APIを使用します')
        return await this.uploadVideoWithFilesAPI(file, displayName, videoMetadata)
      }
      
      // 短い動画（1分以下）かつ小さなファイル（50MB以下）の場合は従来の方法を使用
      const base64String = await this.fileToBase64(file)
      
      // Base64サイズをチェック
      const base64SizeMB = base64String.length * 0.75 / 1024 / 1024
      console.log(`Base64サイズ: ${base64SizeMB.toFixed(2)}MB`)
      
      if (base64SizeMB > 50) {
        console.log('Base64サイズが大きすぎるため、Files APIを使用します')
        return await this.uploadVideoWithFilesAPI(file, displayName, videoMetadata)
      }
      
      // 一時的なファイルURIを作成
      const tempFileUri = `data:${file.type};base64,${base64String}`
      
      console.log('動画ファイル処理完了:')
      console.log('- 一時URI:', tempFileUri.substring(0, 100) + '...')
      console.log('- Base64サイズ:', base64String.length)
      console.log('- 動画長:', videoMetadata.duration)
      console.log('- 解像度:', videoMetadata.width + 'x' + videoMetadata.height)
      
      return {
        file: {
          uri: tempFileUri,
          name: file.name,
          displayName: displayName || file.name,
          mimeType: file.type,
          sizeBytes: file.size.toString(),
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          state: 'ACTIVE'
        }
      }
    } catch (error) {
      console.error('=== 動画ファイルアップロードエラー ===')
      console.error('エラー詳細:', error)
      
      // より詳細なエラーメッセージ
      if (error instanceof Error) {
        if (error.message.includes('Failed to load video metadata')) {
          throw new Error('動画ファイルの読み込みに失敗しました。ファイルが破損しているか、サポートされていない形式の可能性があります。')
        } else if (error.message.includes('動画が長すぎます')) {
          throw new Error(error.message)
        } else if (error.message.includes('動画ファイルが大きすぎます')) {
          throw new Error(error.message)
        } else if (error.message.includes('エンコード後のサイズが大きすぎます')) {
          throw new Error(error.message)
        }
      }
      
      throw new Error(`Video file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 音声ファイル専用のアップロード処理
   */
  private async uploadAudioFile(file: File, displayName?: string): Promise<GeminiFileUploadResponse> {
    console.log('=== 音声ファイル処理開始 ===')
    
    try {
      // 音声のメタデータを取得
      const audioMetadata = await this.getAudioMetadata(file)
      console.log('音声メタデータ:', audioMetadata)
      
      // 音声の長さとサイズをチェック
      const audioDuration = audioMetadata.duration
      const fileSizeMB = file.size / 1024 / 1024
      
      console.log(`音声情報: ${fileSizeMB.toFixed(2)}MB, ${audioDuration.toFixed(2)}秒`)
      
      // 音声処理の制限チェック - 制限を削除
      console.log(`音声ファイル情報: ${(audioDuration / 60).toFixed(2)}分 - 任意の長さの音声ファイルを処理します`)
      
      // 音声ファイルのサイズ制限を大幅に緩和（1GBまで）
      const maxAudioSizeMB = 1024
      if (fileSizeMB > maxAudioSizeMB) {
        throw new Error(`音声ファイルが大きすぎます。最大${maxAudioSizeMB}MBまで対応しています。現在: ${fileSizeMB.toFixed(2)}MB`)
      }
      
      // 効率的なBase64エンコード
      const base64String = await this.fileToBase64(file)
      
      // Base64サイズをチェック（音声ファイルは150MBまで許可）
      const base64SizeMB = base64String.length * 0.75 / 1024 / 1024
      console.log(`Base64サイズ: ${base64SizeMB.toFixed(2)}MB`)
      
      const maxBase64SizeMB = 150
      if (base64SizeMB > maxBase64SizeMB) {
        throw new Error(`エンコード後のサイズが大きすぎます。最大${maxBase64SizeMB}MBまで対応しています。現在: ${base64SizeMB.toFixed(2)}MB`)
      }
      
      // 一時的なファイルURIを作成
      const tempFileUri = `data:${file.type};base64,${base64String}`
      
      console.log('音声ファイル処理完了:')
      console.log('- 一時URI:', tempFileUri.substring(0, 100) + '...')
      console.log('- Base64サイズ:', base64String.length)
      console.log('- 音声長:', audioMetadata.duration)
      console.log('- サンプルレート:', audioMetadata.sampleRate)
      
      return {
        file: {
          uri: tempFileUri,
          name: file.name,
          displayName: displayName || file.name,
          mimeType: file.type,
          sizeBytes: file.size.toString(),
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          state: 'ACTIVE'
        }
      }
    } catch (error) {
      console.error('=== 音声ファイルアップロードエラー ===')
      console.error('エラー詳細:', error)
      
      // より詳細なエラーメッセージ
      if (error instanceof Error) {
        if (error.message.includes('Failed to load audio metadata')) {
          throw new Error('音声ファイルの読み込みに失敗しました。ファイルが破損しているか、サポートされていない形式の可能性があります。')
        } else if (error.message.includes('音声が長すぎます')) {
          throw new Error(error.message)
        } else if (error.message.includes('音声ファイルが大きすぎます')) {
          throw new Error(error.message)
        } else if (error.message.includes('エンコード後のサイズが大きすぎます')) {
          throw new Error(error.message)
        }
      }
      
      throw new Error(`Audio file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 長い動画ファイル用のアップロード処理
   * 制限を緩和して最大90分の動画に対応
   */
  private async uploadVideoWithFilesAPI(file: File, displayName?: string, videoMetadata?: any): Promise<GeminiFileUploadResponse> {
    console.log('=== 長い動画ファイル処理開始 ===')
    
    if (!this.genAI) {
      throw new Error('Gemini File Service not configured. Call configure() first.')
    }

    try {
      // 長い動画ファイルの場合は、より大きなサイズ制限でBase64エンコード
      const base64String = await this.fileToBase64(file)
      const base64SizeMB = base64String.length * 0.75 / 1024 / 1024
      
      // 長い動画の場合は200MBまで許可
      const maxSizeMB = 200
      if (base64SizeMB > maxSizeMB) {
        throw new Error(`エンコード後のサイズが大きすぎます。最大${maxSizeMB}MBまで対応しています。現在: ${base64SizeMB.toFixed(2)}MB`)
      }
      
      const tempFileUri = `data:${file.type};base64,${base64String}`
      
      console.log('長い動画ファイル処理完了:')
      console.log('- 一時URI:', tempFileUri.substring(0, 100) + '...')
      console.log('- Base64サイズ:', base64String.length)
      if (videoMetadata) {
        console.log('- 動画長:', videoMetadata.duration)
        console.log('- 解像度:', videoMetadata.width + 'x' + videoMetadata.height)
      }
      
      return {
        file: {
          uri: tempFileUri,
          name: file.name,
          displayName: displayName || file.name,
          mimeType: file.type,
          sizeBytes: file.size.toString(),
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          state: 'ACTIVE'
        }
      }
    } catch (error) {
      console.error('=== 長い動画ファイルアップロードエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Long video file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 大きな動画ファイル用のFiles APIアップロード処理（後方互換性のため残存）
   */
  private async uploadLargeVideoFile(file: File, displayName?: string, videoMetadata?: any): Promise<GeminiFileUploadResponse> {
    console.log('=== 大きな動画ファイル処理開始（後方互換性） ===')
    return await this.uploadVideoWithFilesAPI(file, displayName, videoMetadata)
  }

  /**
   * 大きなファイル用のアップロード処理（制限を緩和）
   */
  private async uploadLargeFile(file: File, displayName?: string): Promise<GeminiFileUploadResponse> {
    console.log('=== 大きなファイル処理開始（制限緩和版） ===')
    
    if (!this.genAI) {
      throw new Error('Gemini File Service not configured. Call configure() first.')
    }
    
    try {
      // ファイルタイプに応じて制限を設定
      const isVideo = file.type.startsWith('video/')
      const isAudio = file.type.startsWith('audio/')
      
      const maxFileSize = isVideo ? 2 * 1024 * 1024 * 1024 : 
                         isAudio ? 100 * 1024 * 1024 : 
                         50 * 1024 * 1024 // 動画: 2GB, 音声: 100MB, その他: 50MB
      
      if (file.size > maxFileSize) {
        const maxSizeMB = isVideo ? 2048 : isAudio ? 100 : 50
        throw new Error(`ファイルサイズが大きすぎます（${(file.size / 1024 / 1024).toFixed(2)}MB）。最大${maxSizeMB}MBまで対応しています。`)
      }
      
      // 効率的なBase64エンコード
      const base64String = await this.fileToBase64(file)
      
      // Base64サイズをチェック（ファイルタイプに応じて制限を設定）
      const base64SizeMB = base64String.length * 0.75 / 1024 / 1024
      console.log(`Base64サイズ: ${base64SizeMB.toFixed(2)}MB`)
      
      const maxBase64Size = isVideo ? 200 : isAudio ? 150 : 50
      if (base64SizeMB > maxBase64Size) {
        throw new Error(`エンコード後のサイズが大きすぎます。最大${maxBase64Size}MBまで対応しています。現在: ${base64SizeMB.toFixed(2)}MB`)
      }
      
      // 一時的なファイルURIを作成
      const tempFileUri = `data:${file.type};base64,${base64String}`
      
      console.log('大きなファイル処理完了:')
      console.log('- 一時URI:', tempFileUri.substring(0, 100) + '...')
      console.log('- Base64サイズ:', base64String.length)

      return {
        file: {
          uri: tempFileUri,
          name: file.name,
          displayName: displayName || file.name,
          mimeType: file.type,
          sizeBytes: file.size.toString(),
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
          state: 'ACTIVE'
        }
      }
    } catch (error) {
      console.error('=== 大きなファイルのアップロードエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Large file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 動画ファイルのメタデータを取得
   */
  private async getVideoMetadata(file: File): Promise<{duration: number, width: number, height: number}> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)
      
      // タイムアウト設定
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url)
        reject(new Error('動画メタデータの読み込みがタイムアウトしました'))
      }, 30000) // 30秒タイムアウト
      
      video.onloadedmetadata = () => {
        clearTimeout(timeout)
        const metadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight
        }
        URL.revokeObjectURL(url)
        resolve(metadata)
      }
      
      video.onerror = (e) => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        console.error('Video metadata error:', e)
        reject(new Error('Failed to load video metadata'))
      }
      
      video.onabort = () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        reject(new Error('動画メタデータの読み込みが中断されました'))
      }
      
      // 動画の読み込みを開始
      video.src = url
      video.load()
    })
  }

  /**
   * 音声ファイルのメタデータを取得
   */
  private async getAudioMetadata(file: File): Promise<{duration: number, sampleRate: number, channels: number}> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio')
      const url = URL.createObjectURL(file)
      
      // タイムアウト設定
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url)
        reject(new Error('音声メタデータの読み込みがタイムアウトしました'))
      }, 30000) // 30秒タイムアウト
      
      audio.onloadedmetadata = () => {
        clearTimeout(timeout)
        const metadata = {
          duration: audio.duration,
          sampleRate: 44100, // デフォルト値（実際の値は取得困難）
          channels: 2 // デフォルト値（実際の値は取得困難）
        }
        URL.revokeObjectURL(url)
        resolve(metadata)
      }
      
      audio.onerror = (e) => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        console.error('Audio metadata error:', e)
        reject(new Error('Failed to load audio metadata'))
      }
      
      audio.onabort = () => {
        clearTimeout(timeout)
        URL.revokeObjectURL(url)
        reject(new Error('音声メタデータの読み込みが中断されました'))
      }
      
      // 音声の読み込みを開始
      audio.src = url
      audio.load()
    })
  }

  /**
   * YouTube URLかどうかを判定
   */
  private isYouTubeUrl(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    return youtubeRegex.test(url)
  }

  /**
   * 動画についてチャット（YouTube URL対応）
   */
  async chatAboutVideo(videoSource: string, question: string): Promise<GeminiChatResponse> {
    if (!this.genAI) {
      throw new Error('Gemini File Service not configured. Call configure() first.')
    }

    console.log('=== 動画についてチャット開始 ===')
    console.log('動画ソース:', videoSource.substring(0, 100) + '...')
    console.log('質問:', question)

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model })
      
      let prompt: string
      
      if (this.isYouTubeUrl(videoSource)) {
        // YouTube URLの場合
        prompt = `以下のYouTube動画について質問に答えてください：
        
動画URL: ${videoSource}
質問: ${question}

動画の内容を詳しく分析し、質問に対する具体的で詳細な回答を提供してください。`
      } else {
        // ローカル動画ファイルの場合
        const isBase64Uri = videoSource.startsWith('data:')
        
        if (isBase64Uri) {
          // Base64エンコードされた動画の場合
          const mimeType = videoSource.split(';')[0].split(':')[1]
          const files: Array<Part> = [
            { 
              inlineData: {
                data: videoSource.split(',')[1],
                mimeType: mimeType
              }
            }
          ]
          
          const chat = model.startChat()
          
          // まず動画を送信
          await chat.sendMessage(files)
          
          // 質問を送信
          const response = await chat.sendMessage(question)
          
          console.log('動画チャット応答取得成功:')
          console.log('- 応答:', response.response.text())
          console.log('- 使用トークン:', response.response.usageMetadata)

          return {
            text: response.response.text(),
            usageMetadata: response.response.usageMetadata
          }
        } else {
          // 通常のファイルURIの場合
          const files: Array<Part> = [
            { 
              fileData: { 
                fileUri: videoSource, 
                mimeType: "video/mp4"
              } 
            }
          ]
          
          const chat = model.startChat()
          
          // まず動画を送信
          await chat.sendMessage(files)
          
          // 質問を送信
          const response = await chat.sendMessage(question)
          
          console.log('動画チャット応答取得成功:')
          console.log('- 応答:', response.response.text())
          console.log('- 使用トークン:', response.response.usageMetadata)

          return {
            text: response.response.text(),
            usageMetadata: response.response.usageMetadata
          }
        }
      }
      
      // YouTube URLの場合は通常のテキスト生成
      const response = await model.generateContent(prompt)
      
      console.log('YouTube動画チャット応答取得成功:')
      console.log('- 応答:', response.response.text())
      console.log('- 使用トークン:', response.response.usageMetadata)

      return {
        text: response.response.text(),
        usageMetadata: response.response.usageMetadata
      }
    } catch (error) {
      console.error('=== 動画チャットエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Video chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 音声についてチャット（音声認識・分析）
   */
  async chatAboutAudio(audioSource: string, question: string): Promise<GeminiChatResponse> {
    if (!this.genAI) {
      throw new Error('Gemini File Service not configured. Call configure() first.')
    }

    console.log('=== 音声についてチャット開始 ===')
    console.log('音声ソース:', audioSource.substring(0, 100) + '...')
    console.log('質問:', question)

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model })
      
      // ローカル音声ファイルの場合
      const isBase64Uri = audioSource.startsWith('data:')
      
      if (isBase64Uri) {
        // Base64エンコードされた音声の場合
        const mimeType = audioSource.split(';')[0].split(':')[1]
        
        // 音声ファイルサイズのチェック（制限なし）
        const audioSizeInBytes = this.calculateAudioSize(audioSource)
        const durationInHours = audioSizeInBytes / (16000 * 60 * 60)
        console.log(`音声ファイル情報: ${durationInHours.toFixed(2)}時間 - 任意の長さの音声ファイルを処理します`)
        
        // 制限を削除 - 任意の長さの音声ファイルを許可
        
        const files: Array<Part> = [
          { 
            inlineData: {
              data: audioSource.split(',')[1],
              mimeType: mimeType
            }
          }
        ]
        
        const chat = model.startChat()
        
        // まず音声を送信
        await chat.sendMessage(files)
        
        // 質問を送信
        const response = await chat.sendMessage(question)
        
        console.log('音声チャット応答取得成功:')
        console.log('- 応答:', response.response.text())
        console.log('- 使用トークン:', response.response.usageMetadata)

        return {
          text: response.response.text(),
          usageMetadata: response.response.usageMetadata
        }
      } else {
        // 通常のファイルURIの場合
        const files: Array<Part> = [
          { 
            fileData: { 
              fileUri: audioSource, 
              mimeType: "audio/mpeg"
            } 
          }
        ]
        
        const chat = model.startChat()
        
        // まず音声を送信
        await chat.sendMessage(files)
        
        // 質問を送信
        const response = await chat.sendMessage(question)
        
        console.log('音声チャット応答取得成功:')
        console.log('- 応答:', response.response.text())
        console.log('- 使用トークン:', response.response.usageMetadata)

        return {
          text: response.response.text(),
          usageMetadata: response.response.usageMetadata
        }
      }
    } catch (error) {
      console.error('=== 音声チャットエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Audio chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 音声データのサイズを計算
   */
  private calculateAudioSize(audioSource: string): number {
    // Base64データから実際のバイトサイズを計算
    const base64Data = audioSource.split(',')[1] || audioSource
    return (base64Data.length * 3) / 4 // Base64の概算サイズ
  }

  /**
   * Fileオブジェクトを効率的にBase64エンコード
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // data:image/jpeg;base64, の部分を除去
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        } else {
          reject(new Error('Failed to read file as base64'))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('FileReader error'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  /**
   * アップロードされたファイルについてチャット
   * 参考記事の実装に基づく
   */
  async chatAboutFile(fileUri: string, question: string): Promise<GeminiChatResponse> {
    if (!this.genAI) {
      throw new Error('Gemini File Service not configured. Call configure() first.')
    }

    console.log('=== ファイルについてチャット開始 ===')
    console.log('ファイルURI:', fileUri.substring(0, 100) + '...')
    console.log('質問:', question)

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model })
      
      // Base64エンコードされたファイルURIかどうかを判定
      const isBase64Uri = fileUri.startsWith('data:')
      
      let files: Array<Part>
      
      if (isBase64Uri) {
        // Base64エンコードされたファイルの場合
        const mimeType = fileUri.split(';')[0].split(':')[1]
        files = [
          { 
            inlineData: {
              data: fileUri.split(',')[1],
              mimeType: mimeType
            }
          }
        ]
      } else {
        // 通常のファイルURIの場合
        files = [
        { 
          fileData: { 
            fileUri: fileUri, 
            mimeType: "image/jpeg" // 必要に応じて動的に設定
          } 
        }
      ]
      }
      
      const chat = model.startChat()
      
      // まずファイルを送信
      await chat.sendMessage(files)
      
      // 質問を送信
      const response = await chat.sendMessage(question)
      
      console.log('チャット応答取得成功:')
      console.log('- 応答:', response.response.text())
      console.log('- 使用トークン:', response.response.usageMetadata)

      return {
        text: response.response.text(),
        usageMetadata: response.response.usageMetadata
      }
    } catch (error) {
      console.error('=== ファイルチャットエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`File chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 複数の質問を連続して実行
   */
  async chatAboutFileMultiple(fileUri: string, questions: string[]): Promise<GeminiChatResponse[]> {
    if (!this.genAI) {
      throw new Error('Gemini File Service not configured. Call configure() first.')
    }

    console.log('=== 複数質問チャット開始 ===')
    console.log('ファイルURI:', fileUri.substring(0, 100) + '...')
    console.log('質問数:', questions.length)

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model })
      
      // Base64エンコードされたファイルURIかどうかを判定
      const isBase64Uri = fileUri.startsWith('data:')
      
      let files: Array<Part>
      
      if (isBase64Uri) {
        // Base64エンコードされたファイルの場合
        const mimeType = fileUri.split(';')[0].split(':')[1]
        files = [
          { 
            inlineData: {
              data: fileUri.split(',')[1],
              mimeType: mimeType
            }
          }
        ]
      } else {
        // 通常のファイルURIの場合
        files = [
        { 
          fileData: { 
            fileUri: fileUri, 
            mimeType: "image/jpeg"
          } 
        }
      ]
      }
      
      const chat = model.startChat()
      const responses: GeminiChatResponse[] = []
      
      // まずファイルを送信
      await chat.sendMessage(files)
      
      // 各質問を順次送信
      for (const question of questions) {
        console.log('質問送信中:', question)
        const response = await chat.sendMessage(question)
        
        responses.push({
          text: response.response.text(),
          usageMetadata: response.response.usageMetadata
        })
      }

      console.log('複数質問チャット完了')
      return responses
    } catch (error) {
      console.error('=== 複数質問チャットエラー ===')
      console.error('エラー詳細:', error)
      throw new Error(`Multiple file chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * ファイルパスからMIMEタイプを自動判定
   */
  private detectMimeType(filePath: string): string {
    const extension = filePath.toLowerCase().split('.').pop()
    
    const mimeTypes: Record<string, string> = {
      // 画像
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      
      // ドキュメント
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'md': 'text/markdown',
      'markdown': 'text/markdown',
      'json': 'application/json',
      'xml': 'application/xml',
      'csv': 'text/csv',
      'tsv': 'text/tab-separated-values',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'rtf': 'application/rtf',
      'odt': 'application/vnd.oasis.opendocument.text',
      'ods': 'application/vnd.oasis.opendocument.spreadsheet',
      'odp': 'application/vnd.oasis.opendocument.presentation',
      
      // 動画
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
      'm4v': 'video/mp4',
      '3gp': 'video/3gpp',
      
      // 音声
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'aac': 'audio/aac',
      'flac': 'audio/flac',
      'm4a': 'audio/mp4',
      'wma': 'audio/x-ms-wma',
      'opus': 'audio/opus',
      'amr': 'audio/amr',
      '3ga': 'audio/3gpp',
      'ra': 'audio/x-realaudio',
      'mid': 'audio/midi',
      'midi': 'audio/midi',
      
      // アーカイブ
      'zip': 'application/zip',
      'rar': 'application/vnd.rar',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      
      // コード
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'py': 'text/x-python',
      'java': 'text/x-java-source',
      'cpp': 'text/x-c++src',
      'c': 'text/x-csrc',
      'html': 'text/html',
      'css': 'text/css',
      'php': 'application/x-httpd-php',
      'rb': 'text/x-ruby',
      'go': 'text/x-go',
      'rs': 'text/x-rust',
      'swift': 'text/x-swift',
      'kt': 'text/x-kotlin',
      'scala': 'text/x-scala',
      'pl': 'text/x-perl',
      'sh': 'application/x-sh',
      'bat': 'application/x-msdos-program',
      'ps1': 'application/x-powershell'
    }
    
    return mimeTypes[extension || ''] || 'application/octet-stream'
  }

  /**
   * サービスが設定されているかチェック
   */
  isConfigured(): boolean {
    return this.genAI !== null && this.apiKey !== null
  }

  /**
   * 現在のモデル名を取得
   */
  getCurrentModel(): string {
    return this.model
  }
}

