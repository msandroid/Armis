import { GoogleGenAI } from '@google/genai'
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

export class GoogleDirectService {
  private ai: GoogleGenAI | null = null
  private currentModel: string = 'gemini-2.5-flash'

  configure(apiKey: string, modelId: string = 'gemini-2.5-flash'): void {
    console.log('Configuring Google Direct Service with model:', modelId)
    console.log('API Key format check:', apiKey.startsWith('AIzaSy') ? 'Valid format' : 'Invalid format')
    console.log('API Key being used:', apiKey.substring(0, 20) + '...')
    
    // Using the new Google GenAI SDK with centralized client
    this.ai = new GoogleGenAI({ apiKey })
    this.currentModel = modelId
    
    console.log('Google Direct Service configured successfully with new GenAI SDK')
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
          parts.push({ inlineData: { data: videoData, mimeType: 'video/mp4' } })
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

  async streamResponse(prompt: string, onChunk: (chunk: string) => void, imageData?: string, videoData?: string, audioData?: string): Promise<void> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    try {
      let contents: any
      
      if (imageData || videoData || audioData) {
        // マルチモーダル（画像/ビデオ/音声 + テキスト）
        const parts: any[] = [{ text: prompt }]
        
        if (imageData) {
          parts.push({ inlineData: { data: imageData, mimeType: 'image/jpeg' } })
        }
        
        if (videoData) {
          parts.push({ inlineData: { data: videoData, mimeType: 'video/mp4' } })
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

      // Using the new streaming API
      console.log('Sending streaming request to model:', this.currentModel)
      const stream = await this.ai.models.generateContentStream({
        model: this.currentModel,
        contents: contents
      })
      
      for await (const chunk of stream) {
        if (chunk.text) {
          onChunk(chunk.text)
        }
      }
    } catch (error) {
      console.error('Error streaming response with Google Direct Service:', error)
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

  // 画像のみの分析
  async analyzeImage(imageData: string): Promise<MultimodalResponse> {
    return this.analyzeImageWithText(imageData, 'この画像の内容を詳しく説明してください。')
  }

  // ビデオ理解
  async analyzeVideo(videoData: string, textPrompt?: string): Promise<AudioVideoResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    const startTime = Date.now()
    const prompt = textPrompt || 'このビデオの内容を詳しく説明してください。'

    try {
      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: videoData, mimeType: 'video/mp4' } }
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
      console.error('Error analyzing video:', error)
      throw new Error(`Video analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // 音声理解
  async analyzeAudio(audioData: string, textPrompt?: string): Promise<AudioVideoResponse> {
    if (!this.ai) {
      throw new Error('Google Direct Service not configured. Call configure() first.')
    }

    const startTime = Date.now()
    const prompt = textPrompt || 'この音声の内容を詳しく説明してください。'

    try {
      const response = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { data: audioData, mimeType: 'audio/mpeg' } }
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
