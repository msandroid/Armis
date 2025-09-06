import { streamText, convertToModelMessages, UIMessage, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google, createGoogleGenerativeAI } from '@ai-sdk/google'
import { generativeUITools } from '../tools/generative-ui-tools'
import { AIProviderConfig } from '@/types/ai-sdk'
import { GoogleDirectService } from '../llm/google-direct-service'
import { GeminiImageService } from '../llm/gemini-image-service'

export class GenerativeUIService {
  private currentConfig: AIProviderConfig | null = null
  private googleDirectService: GoogleDirectService | null = null
  private geminiImageService: GeminiImageService | null = null
  private providerApiKeys: Record<string, string> = {}

  getCurrentConfig(): AIProviderConfig | null {
    return this.currentConfig
  }

  async configureProvider(config: AIProviderConfig): Promise<void> {
    this.currentConfig = config
    
    // Googleプロバイダーの場合はGoogle Direct Serviceを初期化
    if (config.providerId === 'google') {
      this.googleDirectService = new GoogleDirectService()
      this.googleDirectService.configure(config.apiKey, config.modelId)
      
      // Gemini Image Serviceも初期化
      this.geminiImageService = new GeminiImageService()
      const projectId = import.meta.env.VITE_GOOGLE_PROJECT_ID
      const location = import.meta.env.VITE_GOOGLE_LOCATION || 'us-central1'
      await this.geminiImageService.configure(config.apiKey, projectId, location)
    }
  }

  setProviderApiKeys(apiKeys: Record<string, string>): void {
    this.providerApiKeys = apiKeys
  }

  getProviderApiKeys(): Record<string, string> {
    return this.providerApiKeys
  }

  private getModel() {
    if (!this.currentConfig) {
      throw new Error('No provider configured')
    }

    const { providerId, modelId, apiKey, baseUrl } = this.currentConfig

    // APIキーの存在チェック
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(`API key is required for ${providerId} provider. Please configure your API key.`)
    }

    switch (providerId) {
      case 'openai':
        return openai(modelId)
      case 'anthropic':
        return anthropic(modelId)
      case 'google':
        // Googleプロバイダーの場合はGoogle Direct Serviceを使用
        if (this.googleDirectService) {
          // Google Direct Serviceを使用する場合は、ダミーモデルを返す
          // 実際の処理はstreamGenerativeUIで分岐する
          return google(modelId)
        }
        // GoogleプロバイダーのAPIキー形式チェック
        if (!apiKey.startsWith('AIza')) {
          throw new Error('Invalid Google API key format. Google API keys should start with "AIza". Please get your API key from https://aistudio.google.com/apikey')
        }
        console.log('Configuring Google provider with model:', modelId)
        console.log('API Key format check: Valid format')
        console.log('API Key being used:', apiKey.substring(0, 20) + '...')
        // AI SDK v5の正しい設定方法
        const customGoogle = createGoogleGenerativeAI({
          apiKey
        })
        return customGoogle(modelId)
      default:
        throw new Error(`Unsupported provider: ${providerId}`)
    }
  }

  async streamGenerativeUI(
    messages: UIMessage[],
    onChunk: (chunk: string) => void,
    onToolCall: (toolName: string, state: string, output?: any) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      if (!this.currentConfig) {
        throw new Error('No provider configured. Please configure an AI provider first.')
      }

      // Googleプロバイダーの場合はGoogle Direct Serviceを使用
      if (this.currentConfig.providerId === 'google' && this.googleDirectService) {
        // メッセージをプロンプトに変換
        const prompt = messages.map(msg => `${msg.role}: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`).join('\n')
        
        let fullResponse = ''
        await this.googleDirectService.streamResponse(prompt, (chunk: string) => {
          fullResponse += chunk
          onChunk(chunk)
        })
        
        // 空のレスポンスや無効なレスポンスの場合は空文字列を渡す
        const cleanResponse = fullResponse && 
          fullResponse.trim() !== '' && 
          fullResponse !== '{}' && 
          fullResponse !== '[]' && 
          fullResponse !== 'null' && 
          fullResponse !== 'undefined' &&
          fullResponse !== '[object Object]' &&
          fullResponse !== '[object Array]' &&
          !/^\s*\{\s*\}\s*$/.test(fullResponse) &&
          !/^\s*\[\s*\]\s*$/.test(fullResponse) 
          ? fullResponse 
          : ''
        onComplete(cleanResponse)
        return
      }

      // Googleプロバイダー以外の場合のみAI SDKを使用
      if (this.currentConfig.providerId !== 'google') {
        const model = this.getModel()

        const result = streamText({
          model,
          system: 'あなたは親切なAIアシスタントです。ユーザーの要求に応じて適切なツールを使用してください。',
          messages: convertToModelMessages(messages),
          stopWhen: stepCountIs(10),
          tools: generativeUITools,
        })

        let fullResponse = ''

        for await (const chunk of result.textStream) {
          fullResponse += chunk
          onChunk(chunk)
        }

        // ツール呼び出しの処理（Googleプロバイダーではスキップ）
        console.log('Tool calls processing for non-Google provider')
        
        // 空のレスポンスや無効なレスポンスの場合は空文字列を渡す
        const cleanResponse = fullResponse && 
          fullResponse.trim() !== '' && 
          fullResponse !== '{}' && 
          fullResponse !== '[]' && 
          fullResponse !== 'null' && 
          fullResponse !== 'undefined' &&
          fullResponse !== '[object Object]' &&
          fullResponse !== '[object Array]' &&
          !/^\s*\{\s*\}\s*$/.test(fullResponse) &&
          !/^\s*\[\s*\]\s*$/.test(fullResponse) 
          ? fullResponse 
          : ''
        onComplete(cleanResponse)
        return
      }

      // この部分は到達不可能（Googleプロバイダーは既に上で処理済み）
      throw new Error('Unexpected provider configuration')

    } catch (error) {
      console.error('Generative UI streaming error:', error)
      const errorObj = error instanceof Error ? error : new Error('Unknown error')
      onError(errorObj)
    }
  }

  async processGenerativeUIRequest(
    userMessage: string,
    onChunk: (chunk: string) => void,
    onToolCall: (toolName: string, state: string, output?: any) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      if (!this.currentConfig) {
        throw new Error('No provider configured. Please configure an AI provider first.')
      }

      // Googleプロバイダーの場合はGoogle Direct Serviceを使用
      if (this.currentConfig.providerId === 'google' && this.googleDirectService) {
        let fullResponse = ''
        await this.googleDirectService.streamResponse(userMessage, (chunk: string) => {
          fullResponse += chunk
          onChunk(chunk)
        })
        
        // 空のレスポンスや無効なレスポンスの場合は空文字列を渡す
        const cleanResponse = fullResponse && 
          fullResponse.trim() !== '' && 
          fullResponse !== '{}' && 
          fullResponse !== '[]' && 
          fullResponse !== 'null' && 
          fullResponse !== 'undefined' &&
          !/^\s*\{\s*\}\s*$/.test(fullResponse) &&
          !/^\s*\[\s*\]\s*$/.test(fullResponse) 
          ? fullResponse 
          : ''
        onComplete(cleanResponse)
        return
      }

      // その他のプロバイダーは現在サポートしていない
      throw new Error('Only Google provider is currently supported for Generative UI requests.')
    } catch (error) {
      console.error('Generative UI request error:', error)
      const errorObj = error instanceof Error ? error : new Error('Unknown error')
      onError(errorObj)
    }
  }

  isConfigured(): boolean {
    return this.currentConfig !== null
  }

  getGeminiImageService(): GeminiImageService | null {
    return this.geminiImageService
  }

  getGoogleDirectService(): GoogleDirectService | null {
    return this.googleDirectService
  }
}

// シングルトンインスタンス
export const generativeUIService = new GenerativeUIService()
