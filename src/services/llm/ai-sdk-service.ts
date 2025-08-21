import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google, createGoogleGenerativeAI } from '@ai-sdk/google'
import { mistral } from '@ai-sdk/mistral'
import { groq } from '@ai-sdk/groq'
import { perplexity } from '@ai-sdk/perplexity'
import { togetherai } from '@ai-sdk/togetherai'
import { fireworks } from '@ai-sdk/fireworks'
import { deepseek } from '@ai-sdk/deepseek'
import { xai } from '@ai-sdk/xai'
import { generateText, streamText } from 'ai'
import { AIProviderConfig, AIModel, AVAILABLE_PROVIDERS } from '@/types/ai-sdk'
import { LLMResponse } from '@/types/llm'
import { GoogleDirectService } from './google-direct-service'

export class AISDKService {
  private currentConfig: AIProviderConfig | null = null
  private providers: Map<string, any> = new Map()
  private isConfigured = false
  private googleDirectService: GoogleDirectService | null = null
  private currentAbortController: AbortController | null = null // 停止機能用

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders(): void {
    this.providers.set('openai', openai)
    this.providers.set('anthropic', anthropic)
    this.providers.set('google', google)
    this.providers.set('mistral', mistral)
    this.providers.set('groq', groq)
    this.providers.set('perplexity', perplexity)
    this.providers.set('togetherai', togetherai)
    this.providers.set('fireworks', fireworks)
    this.providers.set('deepseek', deepseek)
    this.providers.set('xai', xai)
  }

  async configureProvider(config: AIProviderConfig): Promise<void> {
    try {
      this.currentConfig = config
      this.isConfigured = true
      
      // Google providerの場合は直接サービスを使用
      if (config.providerId === 'google') {
        this.googleDirectService = new GoogleDirectService()
        this.googleDirectService.configure(config.apiKey, config.modelId)
        console.log(`Configured Google Direct Service with model: ${config.modelId}`)
      } else {
        // 他のプロバイダーは従来のAI SDKを使用
        console.log(`Configured AI SDK with provider: ${config.providerId}, model: ${config.modelId}`)
      }
    } catch (error) {
      this.isConfigured = false
      console.error('Failed to configure provider:', error)
      throw new Error(`Provider configuration failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async getConfiguredModel(providerId: string, modelId: string, apiKey: string, baseUrl?: string): Promise<any> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    // APIキーの存在チェック
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(`API key is required for ${providerId} provider. Please configure your API key.`)
    }

    // AI SDK 5での正しい設定方法
    const modelConfig: any = {
      apiKey: apiKey
    }

    // ベースURLが指定されている場合は追加
    if (baseUrl) {
      modelConfig.baseUrl = baseUrl
    }

    // AI SDK v5では環境変数の設定は不要
    // APIキーは直接プロバイダーに渡す



    // プロバイダー固有の設定（公式ドキュメントに基づく）
    switch (providerId) {
      case 'google':
        // Google: https://ai.google.dev/docs
        console.log('Configuring Google provider with model:', modelId)
        
        // GoogleプロバイダーのAPIキー形式チェック
        if (!apiKey.startsWith('AIza')) {
          throw new Error('Invalid Google API key format. Google API keys should start with "AIza". Please get your API key from https://aistudio.google.com/apikey')
        }
        
        console.log('API Key format check: Valid format')
        console.log('API Key being used:', apiKey.substring(0, 20) + '...')
        
        // AI SDK v5での正しいGoogle設定
        // createGoogleGenerativeAIを使用してカスタム設定を行う
        const customGoogle = createGoogleGenerativeAI({
          apiKey: apiKey,
          baseURL: baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
        })
        
        console.log('Google config:', { apiKey: '***', baseURL: baseUrl || 'https://generativelanguage.googleapis.com/v1beta' })
        
        return customGoogle(modelId)
        
      case 'anthropic':
        // Anthropic: https://docs.anthropic.com/ja/api/overview#type-script
        console.log('Configuring Anthropic provider with model:', modelId)
        console.log('API Key format check:', apiKey.startsWith('sk-ant-') ? 'Valid format' : 'Invalid format - should start with sk-ant-')
        console.log('API Key being used:', apiKey.substring(0, 20) + '...')
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'openai':
        // OpenAI: https://platform.openai.com/docs/guides/text
        console.log('Configuring OpenAI provider with model:', modelId)
        console.log('API Key format check:', apiKey.startsWith('sk-') ? 'Valid format' : 'Invalid format - should start with sk-')
        console.log('API Key being used:', apiKey.substring(0, 20) + '...')
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'fireworks':
        // Fireworks: https://docs.fireworks.ai/guides/querying-text-models
        console.log('Configuring Fireworks provider with model:', modelId)
        console.log('API Key format check:', (apiKey.startsWith('sk-') || apiKey.startsWith('fw_')) ? 'Valid format' : 'Invalid format - should start with sk- or fw_')
        console.log('API Key being used:', apiKey.substring(0, 20) + '...')
        console.log('API Key length:', apiKey.length)
        console.log('API Key is defined:', !!apiKey)
        console.log('Base URL:', baseUrl || 'Using default')
        
        // AI SDK v5での正しいFireworks設定
        console.log('Using AI SDK v5 Fireworks configuration')
        
        // Fireworks AIの正しいエンドポイントを使用
        const fireworksBaseUrl = baseUrl || 'https://api.fireworks.ai/inference/v1'
        console.log('Final Fireworks Base URL:', fireworksBaseUrl)
        console.log('Expected endpoint:', `${fireworksBaseUrl}/chat/completions`)
        
        // 標準的なfireworksプロバイダーを使用（ベースURLを含む）
        const fireworksConfig = {
          apiKey: apiKey,
          baseUrl: fireworksBaseUrl
        }
        console.log('Fireworks config:', fireworksConfig)
        
        return provider(modelId, fireworksConfig)
        
      case 'deepseek':
        // DeepSeek: https://api-docs.deepseek.com/
        console.log('Configuring DeepSeek provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'mistral':
        // Mistral
        console.log('Configuring Mistral provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'groq':
        // Groq
        console.log('Configuring Groq provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'perplexity':
        // Perplexity
        console.log('Configuring Perplexity provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'togetherai':
        // Together.ai
        console.log('Configuring Together.ai provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'cohere':
        // Cohere
        console.log('Configuring Cohere provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'deepinfra':
        // DeepInfra
        console.log('Configuring DeepInfra provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'cerebras':
        // Cerebras
        console.log('Configuring Cerebras provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'xai':
        // xAI Grok
        console.log('Configuring xAI Grok provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'amazon-bedrock':
        // Amazon Bedrock
        console.log('Configuring Amazon Bedrock provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'azure':
        // Azure OpenAI
        console.log('Configuring Azure OpenAI provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      case 'ollama':
        // Ollama (ローカル)
        console.log('Configuring Ollama provider with model:', modelId)
        
        return provider(modelId, {
          apiKey: apiKey
        })
        
      default:
        return provider(modelId, {
          apiKey: apiKey
        })
    }
  }

  async generateResponse(prompt: string): Promise<LLMResponse> {
    if (!this.currentConfig || !this.isConfigured) {
      throw new Error('No provider configured. Call configureProvider() first.')
    }

    // Google providerの場合は直接サービスを使用
    if (this.currentConfig.providerId === 'google' && this.googleDirectService) {
      return await this.googleDirectService.generateResponse(prompt)
    }

    // 他のプロバイダーは従来のAI SDKを使用
    const startTime = Date.now()
    
    try {
      // デバッグ情報を追加
      console.log('=== generateResponse Debug Info ===')
      console.log('Provider ID:', this.currentConfig.providerId)
      console.log('Model ID:', this.currentConfig.modelId)
      console.log('API Key length:', this.currentConfig.apiKey?.length || 0)
      console.log('API Key starts with:', this.currentConfig.apiKey?.substring(0, 10) + '...')
      console.log('Base URL:', this.currentConfig.baseUrl)
      
      const model = await this.getConfiguredModel(
        this.currentConfig.providerId,
        this.currentConfig.modelId,
        this.currentConfig.apiKey,
        this.currentConfig.baseUrl
      )
      
      // プロバイダー固有のリクエスト形式
      const requestOptions = this.getProviderSpecificRequestOptions(
        this.currentConfig.providerId,
        prompt,
        this.currentConfig.temperature || 0.7,
        this.currentConfig.maxOutputTokens || 4096
      )
      
      const result = await generateText({
        model,
        ...requestOptions
      })

      const endTime = Date.now()
      
      return {
        text: result.text,
        tokens: result.usage?.totalTokens || result.text.length,
        duration: endTime - startTime
      }
    } catch (error) {
      console.error('Error generating response with AI SDK:', error)
      throw new Error(`AI response generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    if (!this.currentConfig || !this.isConfigured) {
      throw new Error('No provider configured. Call configureProvider() first.')
    }

    // 新しいAbortControllerを作成
    this.currentAbortController = new AbortController()

    // Google providerの場合は直接サービスを使用
    if (this.currentConfig.providerId === 'google' && this.googleDirectService) {
      try {
        return await this.googleDirectService.streamResponse(prompt, onChunk, undefined, undefined, undefined, undefined, this.currentAbortController)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Google Direct Service streaming was aborted by user')
          return
        }
        throw error
      } finally {
        this.currentAbortController = null
      }
    }

    // 他のプロバイダーはAI SDKの最新ストリーミング機能を使用
    try {
      const model = await this.getConfiguredModel(
        this.currentConfig.providerId,
        this.currentConfig.modelId,
        this.currentConfig.apiKey,
        this.currentConfig.baseUrl
      )

      // プロバイダー固有のリクエスト形式
      const requestOptions = this.getProviderSpecificRequestOptions(
        this.currentConfig.providerId,
        prompt,
        this.currentConfig.temperature || 0.7,
        this.currentConfig.maxOutputTokens || 4096
      )

      // AI SDK 5の最新ストリーミング機能を使用
      const stream = await streamText({
        model,
        ...requestOptions
      })

      // ストリーミング処理の改善
      let isFirstChunk = true
      for await (const chunk of stream.textStream) {
        // 停止チェック
        if (this.currentAbortController?.signal.aborted) {
          console.log('Streaming stopped by user')
          break
        }
        
        // 最初のチャンクの場合は即座に送信
        if (isFirstChunk) {
          onChunk(chunk)
          isFirstChunk = false
        } else {
          // 後続のチャンクは適切な間隔で送信
          onChunk(chunk)
        }
      }

      // ストリーミング完了時の処理（停止されていない場合のみ）
      if (!this.currentAbortController?.signal.aborted && stream.finishReason) {
        console.log('Streaming completed with reason:', stream.finishReason)
      }

    } catch (error) {
      console.error('Error streaming response with AI SDK:', error)
      
      // 停止によるエラーの場合は特別処理
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Streaming was aborted by user')
        return
      }
      
      // より詳細なエラーハンドリング
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          throw new Error('レート制限に達しました。しばらく待ってから再試行してください。')
        } else if (error.message.includes('quota')) {
          throw new Error('APIクォータを超過しました。')
        } else if (error.message.includes('authentication')) {
          throw new Error('APIキーが無効です。設定を確認してください。')
        } else if (error.message.includes('network')) {
          throw new Error('ネットワークエラーが発生しました。接続を確認してください。')
        }
      }
      
      throw new Error(`ストリーミングに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      this.currentAbortController = null
    }
  }

  // 停止機能
  stopGeneration(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort()
      this.currentAbortController = null
      console.log('Generation stopped by user')
    }
  }

  // 新しいメソッド: チャット履歴を使用したストリーミング
  async streamChatResponse(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    onChunk: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    if (!this.currentConfig || !this.isConfigured) {
      const error = new Error('No provider configured. Call configureProvider() first.')
      onError?.(error)
      throw error
    }

    // 新しいAbortControllerを作成
    this.currentAbortController = new AbortController()

    try {
      const model = await this.getConfiguredModel(
        this.currentConfig.providerId,
        this.currentConfig.modelId,
        this.currentConfig.apiKey,
        this.currentConfig.baseUrl
      )

      // チャット履歴を含むリクエストオプション
      const requestOptions = {
        messages,
        temperature: this.currentConfig.temperature || 0.7,
        maxOutputTokens: this.currentConfig.maxOutputTokens || 4096,
        ...this.getProviderSpecificOptions(this.currentConfig.providerId)
      }

      const stream = await streamText({
        model,
        ...requestOptions
      })

      let fullResponse = ''
      
      for await (const chunk of stream.textStream) {
        // 停止チェック
        if (this.currentAbortController?.signal.aborted) {
          console.log('Streaming stopped by user')
          break
        }
        
        fullResponse += chunk
        onChunk(chunk)
      }

      // 完了時のコールバック（停止されていない場合のみ）
      if (!this.currentAbortController?.signal.aborted) {
        onComplete?.(fullResponse)
      }

    } catch (error) {
      console.error('Error in streamChatResponse:', error)
      
      // 停止によるエラーの場合は特別処理
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Streaming was aborted by user')
        return
      }
      
      const errorObj = error instanceof Error ? error : new Error('Unknown streaming error')
      onError?.(errorObj)
      throw errorObj
    } finally {
      this.currentAbortController = null
    }
  }

  // 新しいメソッド: 高速ストリーミング（低レイテンシー）
  async streamFastResponse(
    prompt: string,
    onChunk: (chunk: string) => void,
    options?: {
      temperature?: number
      maxTokens?: number
      systemPrompt?: string
    }
  ): Promise<string> {
    if (!this.currentConfig || !this.isConfigured) {
      throw new Error('No provider configured. Call configureProvider() first.')
    }

    // 新しいAbortControllerを作成
    this.currentAbortController = new AbortController()

    try {
      const model = await this.getConfiguredModel(
        this.currentConfig.providerId,
        this.currentConfig.modelId,
        this.currentConfig.apiKey,
        this.currentConfig.baseUrl
      )

      // システムプロンプトを含むメッセージ配列
      const messages = options?.systemPrompt 
        ? [
            { role: 'system' as const, content: options.systemPrompt },
            { role: 'user' as const, content: prompt }
          ]
        : [{ role: 'user' as const, content: prompt }]

      const stream = await streamText({
        model,
        messages,
        temperature: options?.temperature || this.currentConfig.temperature || 0.7,
        maxOutputTokens: options?.maxTokens || this.currentConfig.maxOutputTokens || 4096,
        ...this.getProviderSpecificOptions(this.currentConfig.providerId)
      })

      let fullResponse = ''
      
      // 高速ストリーミング処理
      for await (const chunk of stream.textStream) {
        // 停止チェック
        if (this.currentAbortController?.signal.aborted) {
          console.log('Fast streaming stopped by user')
          break
        }
        
        fullResponse += chunk
        onChunk(chunk)
      }

      return fullResponse

    } catch (error) {
      console.error('Error in streamFastResponse:', error)
      
      // 停止によるエラーの場合は特別処理
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Fast streaming was aborted by user')
        return ''
      }
      
      throw new Error(`Fast streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      this.currentAbortController = null
    }
  }

  // 新しいメソッド: ストリーミング状態の取得
  isStreamingSupported(): boolean {
    return this.isConfigured && this.currentConfig !== null
  }

  // 新しいメソッド: プロバイダー情報の取得
  getProviderInfo(): { providerId: string; modelId: string; isConfigured: boolean } | null {
    if (!this.currentConfig) return null
    
    return {
      providerId: this.currentConfig.providerId,
      modelId: this.currentConfig.modelId,
      isConfigured: this.isConfigured
    }
  }

  private getModelConfig(providerId: string, modelId: string): AIModel | undefined {
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId)
    return provider?.models.find(m => m.id === modelId)
  }

  private getProviderSpecificOptions(providerId: string): Record<string, any> {
    switch (providerId) {
      case 'google':
        return {
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        }
      default:
        return {}
    }
  }

  private getProviderSpecificRequestOptions(providerId: string, prompt: string, temperature: number, maxOutputTokens: number) {
    // 各プロバイダーの公式ドキュメントに基づくリクエスト形式
    switch (providerId) {
      case 'anthropic':
        // Anthropic: https://docs.anthropic.com/ja/api/overview#type-script
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 5
        }
        
      case 'openai':
        // OpenAI: https://platform.openai.com/docs/guides/text
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
        
      case 'google':
        // Google Generative AI: https://ai.google.dev/gemini-api/docs/text-generation?hl=ja#javascript
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.95,
          topK: 40
        }
        
      case 'fireworks':
        // Fireworks: https://docs.fireworks.ai/guides/querying-text-models
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40,
          repetitionPenalty: 1.1
        }
        
      case 'deepseek':
        // DeepSeek: https://api-docs.deepseek.com/
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40,
          repetitionPenalty: 1.1
        }
        
      case 'mistral':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40,
          safePrompt: false
        }
        
      case 'groq':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40
        }
        
      case 'perplexity':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40
        }
        
      case 'togetherai':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40,
          repetitionPenalty: 1.1
        }
        
      case 'cohere':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
        
      case 'deepinfra':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40
        }
        
      case 'cerebras':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40
        }
        
      case 'xai':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40
        }
        
      case 'amazon-bedrock':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 0.9,
          topK: 40
        }
        
      case 'azure':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
        
      case 'ollama':
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          topP: 0.9,
          topK: 40
        }
        
      default:
        return {
          messages: [{ role: 'user' as const, content: prompt }],
          temperature,
          maxOutputTokens
        }
    }
  }

  getAvailableProviders() {
    return AVAILABLE_PROVIDERS
  }

  getProviderModels(providerId: string): AIModel[] {
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId)
    return provider?.models || []
  }

  getCurrentConfig(): AIProviderConfig | null {
    return this.currentConfig
  }

  getCurrentModel(): AIModel | undefined {
    if (!this.currentConfig) return undefined
    
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === this.currentConfig!.providerId)
    return provider?.models.find(m => m.id === this.currentConfig!.modelId)
  }

  isProviderConfigured(): boolean {
    return this.isConfigured && this.currentConfig !== null
  }

  async testConnection(): Promise<boolean> {
    if (!this.currentConfig) {
      console.error('No configuration found for connection test')
      return false
    }

    const { providerId, modelId, apiKey } = this.currentConfig
    
    try {
      console.log('=== Starting Connection Test ===')
      console.log('Provider:', providerId)
      console.log('Model:', modelId)
      console.log('API Key format check:', apiKey.substring(0, 10) + '...')
      
      // ステップ1: API Key形式の検証
      console.log('Step 1: Validating API Key format...')
      this.validateApiKeyFormat(providerId, apiKey)
      console.log('✅ API Key format validation passed')
      
      // ステップ2: プロバイダー設定の検証
      console.log('Step 2: Validating provider configuration...')
      if (providerId === 'google') {
        // Google providerの場合は直接サービスを使用
        if (!this.googleDirectService) {
          throw new Error('Google Direct Service not configured')
        }
        console.log('✅ Google Direct Service configuration validation passed')
      } else {
        const provider = this.providers.get(providerId)
        if (!provider) {
          throw new Error(`Provider ${providerId} not found in available providers`)
        }
        console.log('✅ Provider configuration validation passed')
      }
      
      // ステップ3: モデル設定の検証
      console.log('Step 3: Validating model configuration...')
      if (providerId === 'google') {
        // Google providerの場合は直接サービスを使用
        console.log('Using Google Direct Service for model validation')
        console.log('✅ Google Direct Service model configuration validation passed')
      } else {
        try {
          const model = this.getConfiguredModel(providerId, modelId, apiKey, this.currentConfig.baseUrl)
          console.log('✅ Model configuration validation passed')
        } catch (modelError) {
          throw new Error(`Failed to configure model ${modelId} for provider ${providerId}: ${modelError instanceof Error ? modelError.message : 'Unknown error'}`)
        }
      }
      
      // ステップ4: 軽量なAPI呼び出しテスト
      console.log('Step 4: Testing API connection with lightweight request...')
      
      // 現在の設定を一時的に更新
      const originalConfig = this.currentConfig
      this.currentConfig = {
        providerId,
        modelId,
        apiKey,
        baseUrl: this.currentConfig?.baseUrl,
        temperature: this.currentConfig?.temperature,
        maxOutputTokens: this.currentConfig?.maxOutputTokens
      }
      
      const testPrompt = 'Test'
      const testResponse = await this.generateResponse(testPrompt)
      
      // 元の設定を復元
      this.currentConfig = originalConfig
      console.log('Test response received:', testResponse.text)
      console.log('Response length:', testResponse.text.length)
      console.log('Response duration:', testResponse.duration + 'ms')
      
      // ステップ5: レスポンスの妥当性チェック
      console.log('Step 5: Validating response...')
      const isValidResponse: boolean = Boolean(testResponse.text && testResponse.text.length > 0)
      console.log('Response validation result:', isValidResponse ? 'Valid' : 'Invalid')
      
      console.log('=== Connection Test Completed Successfully ===')
      return isValidResponse
      
    } catch (error) {
      console.error('=== Connection Test Failed ===')
      console.error('Error details:', error)
      
      // プロバイダー固有のエラーメッセージ
      this.handleProviderSpecificError(providerId, error)
      
      // より詳細なエラー情報を提供
      if (error instanceof Error) {
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      
      return false
    }
  }

  private validateApiKeyFormat(providerId: string, apiKey: string): void {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error(`API Key is required for provider: ${providerId}`)
    }

    switch (providerId) {
      case 'google':
        if (!apiKey.startsWith('AIzaSy')) {
          throw new Error('Google AI Studio API key must start with "AIzaSy". Please get your API key from: https://aistudio.google.com/apikey')
        }
        break
      case 'anthropic':
        if (!apiKey.startsWith('sk-ant-')) {
          throw new Error('Anthropic API key must start with "sk-ant-". Get your API key from: https://console.anthropic.com/')
        }
        break
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          throw new Error('OpenAI API key must start with "sk-". Get your API key from: https://platform.openai.com/api-keys')
        }
        break
      case 'fireworks':
        if (!apiKey.startsWith('sk-') && !apiKey.startsWith('fw_')) {
          throw new Error('Fireworks API key must start with "sk-" or "fw_". Get your API key from: https://console.fireworks.ai/')
        }
        break
      case 'deepseek':
        if (!apiKey.startsWith('sk-')) {
          throw new Error('DeepSeek API key must start with "sk-". Get your API key from: https://platform.deepseek.com/')
        }
        break
      case 'mistral':
        if (!apiKey.startsWith('sk-')) {
          throw new Error('Mistral API key must start with "sk-". Get your API key from: https://console.mistral.ai/')
        }
        break
      case 'groq':
        if (!apiKey.startsWith('gsk_')) {
          throw new Error('Groq API key must start with "gsk_". Get your API key from: https://console.groq.com/')
        }
        break
      case 'perplexity':
        if (!apiKey.startsWith('pplx-')) {
          throw new Error('Perplexity API key must start with "pplx-". Get your API key from: https://www.perplexity.ai/settings/api')
        }
        break
      case 'togetherai':
        if (!apiKey.startsWith('sk-')) {
          throw new Error('Together.ai API key must start with "sk-". Get your API key from: https://api.together.xyz/')
        }
        break
      case 'cohere':
        if (!apiKey.startsWith('sk-')) {
          throw new Error('Cohere API key must start with "sk-". Get your API key from: https://dashboard.cohere.ai/')
        }
        break
      case 'deepinfra':
        if (!apiKey.startsWith('sk-')) {
          throw new Error('DeepInfra API key must start with "sk-". Get your API key from: https://deepinfra.com/')
        }
        break
      case 'cerebras':
        if (!apiKey.startsWith('sk-')) {
          throw new Error('Cerebras API key must start with "sk-". Get your API key from: https://console.cerebras.ai/')
        }
        break
      case 'xai':
        if (!apiKey.startsWith('sk-')) {
          throw new Error('xAI API key must start with "sk-". Get your API key from: https://console.x.ai/')
        }
        break
      case 'amazon-bedrock':
        // AWS認証情報の検証
        if (!apiKey || apiKey.trim() === '') {
          throw new Error('AWS Access Key ID is required for Amazon Bedrock. Configure AWS credentials.')
        }
        break
      case 'azure':
        if (!apiKey.startsWith('sk-')) {
          throw new Error('Azure OpenAI API key must start with "sk-". Configure Azure OpenAI Service.')
        }
        break
      case 'ollama':
        // OllamaはAPI Keyが不要
        break
      default:
        // その他のプロバイダーは基本的な検証のみ
        if (!apiKey || apiKey.trim() === '') {
          throw new Error(`API Key is required for provider: ${providerId}`)
        }
    }
  }

  private handleProviderSpecificError(providerId: string, error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`=== ${providerId.toUpperCase()} API Error Analysis ===`)
    console.error('Error message:', errorMessage)
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    
    // ネットワークエラーのチェック
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
      console.error('🔴 Network Error Detected:')
      console.error('- Please check your internet connection')
      console.error('- Verify that the API endpoint is accessible')
      console.error('- Check if there are any firewall or proxy restrictions')
      return
    }
    
    // 認証エラーのチェック
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      console.error('🔴 Authentication Error Detected:')
      console.error('- API key is invalid or expired')
      console.error('- Please verify your API key format and validity')
      console.error('- Check if your API key has the necessary permissions')
      return
    }
    
    // レート制限エラーのチェック
    if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
      console.error('🟡 Rate Limit Error Detected:')
      console.error('- API rate limit exceeded')
      console.error('- Please wait before making another request')
      console.error('- Check your API usage limits in your account dashboard')
      return
    }
    
    // モデルエラーのチェック
    if (errorMessage.includes('model') || errorMessage.includes('not found') || errorMessage.includes('404')) {
      console.error('🔴 Model Error Detected:')
      console.error('- The specified model is not available')
      console.error('- Please check the model ID and availability')
      console.error('- Verify that the model is supported by your API plan')
      return
    }
    
    switch (providerId) {
      case 'google':
        console.error('🔍 Google AI Studio Specific Error Analysis:')
        if (errorMessage.includes('expired') || errorMessage.includes('API key expired')) {
          console.error('🔴 API Key Expired:')
          console.error('- Your Google AI Studio API key has expired')
          console.error('- Please generate a new API key from: https://aistudio.google.com/apikey')
          console.error('- Replace your current API key with the new one')
          console.error('- Google AI Studio API keys have expiration dates for security')
        } else if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid Google AI Studio API key (starts with "AIzaSy")')
          console.error('- Get your Google AI Studio API key from: https://aistudio.google.com/apikey')
          console.error('- Verify that your API key has access to the Gemini API')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Google AI Studio usage limits')
          console.error('- Visit: https://aistudio.google.com/app/apikey')
        } else if (errorMessage.includes('model') || errorMessage.includes('not found')) {
          console.error('- Verify the model ID is correct (e.g., "gemini-2.0-flash-exp")')
          console.error('- Check model availability: https://ai.google.dev/models')
        } else {
          console.error('- Unknown Google AI Studio error')
          console.error('- Check Google AI Studio status: https://status.ai.google.dev/')
        }
        break
        
      case 'anthropic':
        console.error('🔍 Anthropic Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid Anthropic API key (starts with "sk-ant-")')
          console.error('- Get your API key from: https://console.anthropic.com/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Anthropic usage limits')
          console.error('- Visit: https://console.anthropic.com/account/usage')
        } else {
          console.error('- Unknown Anthropic API error')
          console.error('- Check Anthropic status: https://status.anthropic.com/')
        }
        break
        
      case 'openai':
        console.error('🔍 OpenAI Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid OpenAI API key (starts with "sk-")')
          console.error('- Get your API key from: https://platform.openai.com/api-keys')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your OpenAI usage limits')
          console.error('- Visit: https://platform.openai.com/usage')
        } else {
          console.error('- Unknown OpenAI API error')
          console.error('- Check OpenAI status: https://status.openai.com/')
        }
        break
        
      case 'fireworks':
        console.error('🔍 Fireworks Specific Error Analysis:')
        console.error('Error message:', errorMessage)
        console.error('Error status:', error.status)
        console.error('Error code:', error.code)
        
        if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('missing')) {
          console.error('- Ensure you are using a valid Fireworks API key (starts with "sk-" or "fw_")')
          console.error('- Get your API key from: https://console.fireworks.ai/')
          console.error('- Verify that your API key has the necessary permissions')
          console.error('- Check that the API key is properly configured in the application')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Fireworks usage limits')
          console.error('- Visit: https://console.fireworks.ai/account/usage')
        } else if (errorMessage.includes('model') || errorMessage.includes('not found') || errorMessage.includes('404')) {
          console.error('- Verify the model ID is correct (e.g., "accounts/fireworks/models/llama-v3p3-70b-instruct")')
          console.error('- Check model availability: https://fireworks.ai/models')
          console.error('- Check the API endpoint: https://api.fireworks.ai/inference/v1/chat/completions')
        } else {
          console.error('- Unknown Fireworks API error')
          console.error('- Check Fireworks status: https://status.fireworks.ai/')
          console.error('- Refer to Fireworks troubleshooting: https://fireworks.ai/docs/troubleshooting/status_error_codes/inference_error_code')
          console.error('- Try testing the API directly: curl -X POST https://api.fireworks.ai/inference/v1/chat/completions')
        }
        break
        
      case 'deepseek':
        console.error('🔍 DeepSeek Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid DeepSeek API key (starts with "sk-")')
          console.error('- Get your API key from: https://platform.deepseek.com/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your DeepSeek usage limits')
          console.error('- Visit: https://platform.deepseek.com/account/usage')
        } else {
          console.error('- Unknown DeepSeek API error')
          console.error('- Check DeepSeek status: https://status.deepseek.com/')
        }
        break
        
      case 'mistral':
        console.error('🔍 Mistral Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid Mistral API key (starts with "sk-")')
          console.error('- Get your API key from: https://console.mistral.ai/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Mistral usage limits')
          console.error('- Visit: https://console.mistral.ai/account/usage')
        } else {
          console.error('- Unknown Mistral API error')
          console.error('- Check Mistral status: https://status.mistral.ai/')
        }
        break
        
      case 'groq':
        console.error('🔍 Groq Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid Groq API key (starts with "gsk_")')
          console.error('- Get your API key from: https://console.groq.com/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Groq usage limits')
          console.error('- Visit: https://console.groq.com/account/usage')
        } else {
          console.error('- Unknown Groq API error')
          console.error('- Check Groq status: https://status.groq.com/')
        }
        break
        
      case 'perplexity':
        console.error('🔍 Perplexity Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid Perplexity API key (starts with "pplx-")')
          console.error('- Get your API key from: https://www.perplexity.ai/settings/api')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Perplexity usage limits')
          console.error('- Visit: https://www.perplexity.ai/account/usage')
        } else {
          console.error('- Unknown Perplexity API error')
          console.error('- Check Perplexity status: https://status.perplexity.ai/')
        }
        break
        
      case 'togetherai':
        console.error('🔍 Together.ai Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid Together.ai API key (starts with "sk-")')
          console.error('- Get your API key from: https://api.together.xyz/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Together.ai usage limits')
          console.error('- Visit: https://api.together.xyz/account/usage')
        } else {
          console.error('- Unknown Together.ai API error')
          console.error('- Check Together.ai status: https://status.together.xyz/')
        }
        break
        
      case 'cohere':
        console.error('🔍 Cohere Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid Cohere API key (starts with "sk-")')
          console.error('- Get your API key from: https://dashboard.cohere.ai/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Cohere usage limits')
          console.error('- Visit: https://dashboard.cohere.ai/account/usage')
        } else {
          console.error('- Unknown Cohere API error')
          console.error('- Check Cohere status: https://status.cohere.ai/')
        }
        break
        
      case 'deepinfra':
        console.error('🔍 DeepInfra Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid DeepInfra API key (starts with "sk-")')
          console.error('- Get your API key from: https://deepinfra.com/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your DeepInfra usage limits')
          console.error('- Visit: https://deepinfra.com/account/usage')
        } else {
          console.error('- Unknown DeepInfra API error')
          console.error('- Check DeepInfra status: https://status.deepinfra.com/')
        }
        break
        
      case 'cerebras':
        console.error('🔍 Cerebras Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid Cerebras API key (starts with "sk-")')
          console.error('- Get your API key from: https://console.cerebras.ai/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Cerebras usage limits')
          console.error('- Visit: https://console.cerebras.ai/account/usage')
        } else {
          console.error('- Unknown Cerebras API error')
          console.error('- Check Cerebras status: https://status.cerebras.ai/')
        }
        break
        
      case 'xai':
        console.error('🔍 xAI Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid xAI API key (starts with "sk-")')
          console.error('- Get your API key from: https://console.x.ai/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your xAI usage limits')
          console.error('- Visit: https://console.x.ai/account/usage')
        } else {
          console.error('- Unknown xAI API error')
          console.error('- Check xAI status: https://status.x.ai/')
        }
        break
        
      case 'amazon-bedrock':
        console.error('🔍 Amazon Bedrock Specific Error Analysis:')
        if (errorMessage.includes('credentials') || errorMessage.includes('authentication')) {
          console.error('- AWS credentials error. Please configure AWS credentials for Amazon Bedrock')
          console.error('- Configure AWS credentials: https://aws.amazon.com/bedrock/')
          console.error('- Ensure you have the necessary IAM permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your AWS Bedrock usage limits')
          console.error('- Visit: https://console.aws.amazon.com/bedrock/')
        } else {
          console.error('- Unknown Amazon Bedrock API error')
          console.error('- Check AWS status: https://status.aws.amazon.com/')
        }
        break
        
      case 'azure':
        console.error('🔍 Azure OpenAI Specific Error Analysis:')
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('- Ensure you are using a valid Azure OpenAI API key (starts with "sk-")')
          console.error('- Configure Azure OpenAI Service: https://azure.microsoft.com/services/openai-service/')
          console.error('- Verify that your API key has the necessary permissions')
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          console.error('- Check your Azure OpenAI usage limits')
          console.error('- Visit: https://portal.azure.com/')
        } else {
          console.error('- Unknown Azure OpenAI API error')
          console.error('- Check Azure status: https://status.azure.com/')
        }
        break
        
      case 'ollama':
        console.error('🔍 Ollama Specific Error Analysis:')
        if (errorMessage.includes('connection') || errorMessage.includes('localhost')) {
          console.error('- Ollama connection error. Please ensure Ollama is running locally on http://localhost:11434')
          console.error('- Install and run Ollama: https://ollama.ai/')
          console.error('- Check if Ollama service is running: ollama serve')
        } else if (errorMessage.includes('model') || errorMessage.includes('not found')) {
          console.error('- Model not found. Please pull the required model: ollama pull <model-name>')
          console.error('- Check available models: ollama list')
        } else {
          console.error('- Unknown Ollama API error')
          console.error('- Check Ollama documentation: https://ollama.ai/docs')
        }
        break
        
      default:
        console.error(`🔍 Unknown Provider Error Analysis for ${providerId}:`)
        console.error('- This provider is not specifically handled in the error analysis')
        console.error('- Please check the provider documentation for troubleshooting')
        console.error('- Verify your API key format and permissions')
        console.error('- Check your network connection and firewall settings')
    }
  }

  getProviderCapabilities(providerId: string): {
    imageInput: boolean
    objectGeneration: boolean
    toolUsage: boolean
    toolStreaming: boolean
  } {
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId)
    if (!provider) {
      return {
        imageInput: false,
        objectGeneration: false,
        toolUsage: false,
        toolStreaming: false
      }
    }

    const hasImageInput = provider.models.some(m => m.capabilities.imageInput)
    const hasObjectGeneration = provider.models.some(m => m.capabilities.objectGeneration)
    const hasToolUsage = provider.models.some(m => m.capabilities.toolUsage)
    const hasToolStreaming = provider.models.some(m => m.capabilities.toolStreaming)

    return {
      imageInput: hasImageInput,
      objectGeneration: hasObjectGeneration,
      toolUsage: hasToolUsage,
      toolStreaming: hasToolStreaming
    }
  }

  getRecommendedModels(task: 'general' | 'coding' | 'reasoning' | 'creative' | 'fast'): AIModel[] {
    const recommendations: { [key: string]: string[] } = {
      general: [
        'gpt-5', 
        'claude-opus-4.1', 
        'gemini-2.5-pro',
        'gpt-4o',
        'claude-opus-4',
        'gemini-2.5-flash'
      ],
      coding: [
        'gpt-5', 
        'claude-opus-4.1', 
        'codestral',
        'llama-3.1-405b',
        'gpt-4o',
        'claude-3-7-sonnet'
      ],
      reasoning: [
        'claude-opus-4.1', 
        'claude-opus-4',
        'gpt-5',
        'gemini-2.5-pro',
        'llama-4-scout-17b-16e-instruct',
        'claude-3-7-sonnet'
      ],
      creative: [
        'gpt-5', 
        'claude-opus-4.1', 
        'gemini-2.5-pro',
        'gpt-4o',
        'claude-opus-4',
        'gemini-2.5-flash'
      ],
      fast: [
        'gpt-5-nano', 
        'claude-3-haiku', 
        'llama-3.1-8b-instant',
        'gemini-2.5-flash-lite',
        'gpt-4o-mini',
        'mistral-small-3.1'
      ]
    }

    const recommendedIds = recommendations[task] || []
    const allModels: AIModel[] = []
    
    AVAILABLE_PROVIDERS.forEach(provider => {
      provider.models.forEach(model => {
        if (recommendedIds.includes(model.id)) {
          allModels.push(model)
        }
      })
    })

    return allModels
  }

  resetConfiguration(): void {
    this.currentConfig = null
    this.isConfigured = false
  }
}
