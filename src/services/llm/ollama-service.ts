export interface OllamaConfig {
  baseUrl?: string
  defaultModel?: string
  timeout?: number
}

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
  digest: string
  details?: {
    format: string
    family: string
    families?: string[]
    parameter_size: string
    quantization_level: string
  }
}

export interface OllamaGenerateRequest {
  model: string
  prompt: string
  system?: string
  template?: string
  context?: number[]
  options?: {
    temperature?: number
    top_p?: number
    top_k?: number
    num_predict?: number
    tfs_z?: number
    typical_p?: number
    repeat_last_n?: number
    repeat_penalty?: number
    presence_penalty?: number
    frequency_penalty?: number
    mirostat?: number
    mirostat_tau?: number
    mirostat_eta?: number
    penalize_newline?: boolean
    seed?: number
    numa?: boolean
    num_ctx?: number
    num_gpu?: number
    num_thread?: number
    rope_freq_base?: number
    rope_freq_scale?: number
    mul_mat_q?: boolean
    f16_kv?: boolean
    logits_all?: boolean
    vocab_only?: boolean
    use_mmap?: boolean
    use_mlock?: boolean
    embedding_only?: boolean
    rope_scaling?: Record<string, any>
    num_keep?: number
    stop?: string[]
    stream?: boolean
  }
}

export interface OllamaGenerateResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

export interface OllamaListResponse {
  models: OllamaModel[]
}

export class OllamaService {
  private baseUrl: string
  private defaultModel: string
  private timeout: number
  private isInitialized = false
  private currentModel: string

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434'
    this.defaultModel = config.defaultModel || 'gemma3:1b'
    this.currentModel = this.defaultModel
    this.timeout = config.timeout || 30000
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing Ollama Service...')
      
      // Check if Ollama is running
      await this.checkHealth()
      
      // Verify default model is available
      await this.ensureModelAvailable(this.defaultModel)
      
      this.isInitialized = true
      console.log(`Ollama Service initialized with model: ${this.defaultModel}`)
    } catch (error) {
      console.error('Failed to initialize Ollama Service:', error)
      throw error
    }
  }

  private async checkHealth(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`Ollama health check failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Ollama connection timeout. Please check if Ollama is running at ${this.baseUrl}`)
      }
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error(`Ollama is not running or not accessible at ${this.baseUrl}. Please start Ollama first.`)
      }
      throw new Error(`Ollama health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async ensureModelAvailable(modelName: string): Promise<void> {
    try {
      const models = await this.listModels()
      const modelExists = models.some(model => model.name === modelName)
      
      if (!modelExists) {
        console.log(`Model ${modelName} not found. Automatically downloading...`)
        await this.pullModelWithProgress(modelName)
        console.log(`✅ Model ${modelName} downloaded and ready to use`)
      } else {
        console.log(`✅ Model ${modelName} is already available`)
      }
    } catch (error) {
      console.error(`Failed to ensure model ${modelName} is available:`, error)
      throw new Error(`Failed to download model ${modelName}. Please check your internet connection and try again.`)
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status} ${response.statusText}`)
      }

      const data: OllamaListResponse = await response.json()
      return data.models
    } catch (error) {
      console.error('Error listing models:', error)
      throw error
    }
  }

  async pullModel(modelName: string): Promise<void> {
    return this.pullModelWithProgress(modelName)
  }

  async pullModelWithProgress(modelName: string, onProgress?: (progressData: any) => void): Promise<void> {
    try {
      console.log(`📥 Starting download of model: ${modelName}`)
      
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
        signal: AbortSignal.timeout(this.timeout * 10) // Longer timeout for model pulling
      })

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.status} ${response.statusText}`)
      }

      console.log(`✅ Response received: ${response.status} ${response.statusText}`)
      console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()))

      // ダウンロード開始を通知
      if (onProgress) {
        onProgress({
          status: 'starting',
          message: `Starting download of ${modelName}...`,
          progress: 0,
          modelId: modelName
        })
      }

      // Wait for the pull to complete with progress tracking
      const reader = response.body?.getReader()
      if (reader) {
        let progress = 0
        let status = 'starting'
        
        console.log(`📖 Starting to read response stream...`)
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            console.log(`📖 Stream reading completed`)
            break
          }
          
          const chunk = new TextDecoder().decode(value)
          console.log(`📦 Received chunk: ${chunk.length} bytes`)
          
          const lines = chunk.split('\n').filter(line => line.trim())
          console.log(`📄 Parsed ${lines.length} lines from chunk`)
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              
              // Update progress based on status
              if (data.status === 'downloading') {
                status = 'downloading'
                if (data.completed && data.total) {
                  progress = Math.round((data.completed / data.total) * 100)
                }
                const message = `Downloading ${modelName}... ${progress}%`
                console.log(message)
                if (onProgress) {
                  onProgress({
                    status: 'downloading',
                    message: message,
                    progress: progress,
                    modelId: modelName,
                    downloaded: data.completed,
                    total: data.total
                  })
                }
              } else if (data.status === 'verifying') {
                status = 'verifying'
                progress = 95
                const message = `Verifying ${modelName}...`
                console.log(message)
                if (onProgress) {
                  onProgress({
                    status: 'verifying',
                    message: message,
                    progress: progress,
                    modelId: modelName
                  })
                }
              } else if (data.status === 'success') {
                status = 'success'
                progress = 100
                const message = `✅ ${modelName} downloaded successfully!`
                console.log(message)
                if (onProgress) {
                  onProgress({
                    status: 'completed',
                    message: message,
                    progress: progress,
                    modelId: modelName
                  })
                }
                return
              } else if (data.status === 'error') {
                throw new Error(`Download failed: ${data.error || 'Unknown error'}`)
              }
            } catch (e) {
              console.log(`⚠️ JSON parse error for line: "${line}" - Error: ${e}`)
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }
      
      // If we reach here without success, throw an error
      throw new Error(`Download of ${modelName} did not complete successfully`)
    } catch (error) {
      console.error(`❌ Error downloading model ${modelName}:`, error)
      throw error
    }
  }

  async generate(
    prompt: string,
    options: Partial<OllamaGenerateRequest> = {}
  ): Promise<OllamaGenerateResponse> {
    console.log(`🚀 Ollama generate() called with prompt: "${prompt.substring(0, 50)}..."`)
    console.log(`🔍 generate() options:`, options)
    
    if (!this.isInitialized) {
      throw new Error('Ollama Service not initialized. Call initialize() first.')
    }

    try {
      // Ollamaは常にストリーミングレスポンスを返すため、ストリーミングモードで処理
      console.log(`📞 Calling generateStream() from generate()`)
      return await this.generateStream(prompt, options)
    } catch (error) {
      console.error('Error generating response:', error)
      throw error
    }
  }

  async generateStream(
    prompt: string,
    options: Partial<OllamaGenerateRequest> = {},
    onChunk?: (chunk: OllamaGenerateResponse) => void
  ): Promise<OllamaGenerateResponse> {
    if (!this.isInitialized) {
      throw new Error('Ollama Service not initialized. Call initialize() first.')
    }

    try {
      const modelToUse = options.model || this.currentModel || this.defaultModel
      console.log(`🔍 Using model for generation: ${modelToUse}`)
      console.log(`🔍 currentModel: ${this.currentModel}`)
      console.log(`🔍 defaultModel: ${this.defaultModel}`)
      
      const request: OllamaGenerateRequest = {
        model: modelToUse,
        prompt,
        system: options.system,
        template: options.template,
        context: options.context,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 2048,
          stream: true,
          ...options.options
        }
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`Stream generation failed: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body available for streaming')
      }

      let finalResponse: OllamaGenerateResponse | null = null
      let combinedResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data: OllamaGenerateResponse = JSON.parse(line)
            
            // レスポンステキストを結合
            if (data.response !== undefined) {
              combinedResponse += data.response
            }
            
            // 最終的なレスポンスを更新
            finalResponse = {
              ...data,
              response: combinedResponse
            }
            
            if (onChunk) {
              onChunk(finalResponse)
            }

            if (data.done) {
              console.log(`Stream completed. Final response: "${combinedResponse}"`)
              return finalResponse
            }
          } catch (e) {
            console.warn('Failed to parse chunk:', e)
          }
        }
      }

      // ストリームが完了したがdone: trueがない場合
      if (finalResponse) {
        console.log(`Stream ended without done: true. Final response: "${combinedResponse}"`)
        return {
          ...finalResponse,
          done: true
        }
      }

      return { 
        model: request.model, 
        created_at: new Date().toISOString(), 
        response: combinedResponse || '', 
        done: true 
      }
    } catch (error) {
      console.error('Error in stream generation:', error)
      throw error
    }
  }

  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    options: Partial<OllamaGenerateRequest> = {}
  ): Promise<OllamaGenerateResponse> {
    if (!this.isInitialized) {
      throw new Error('Ollama Service not initialized. Call initialize() first.')
    }

    // Convert messages to prompt format
    const prompt = messages
      .map(msg => {
        if (msg.role === 'system') {
          return `System: ${msg.content}\n\n`
        } else if (msg.role === 'user') {
          return `User: ${msg.content}\n\n`
        } else {
          return `Assistant: ${msg.content}\n\n`
        }
      })
      .join('') + 'Assistant: '

    return this.generate(prompt, options)
  }

  async setDefaultModel(modelName: string): Promise<void> {
    await this.ensureModelAvailable(modelName)
    this.defaultModel = modelName
    console.log(`Default model changed to: ${modelName}`)
  }

  async setModel(modelName: string): Promise<void> {
    await this.ensureModelAvailable(modelName)
    this.currentModel = modelName
    console.log(`Current model changed to: ${modelName}`)
  }

  getDefaultModel(): string {
    return this.defaultModel
  }

  getCurrentModel(): string {
    return this.currentModel
  }

  isReady(): boolean {
    return this.isInitialized
  }

  async getModelInfo(modelName: string): Promise<OllamaModel | null> {
    const models = await this.listModels()
    return models.find(model => model.name === modelName) || null
  }

  async deleteModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
        signal: AbortSignal.timeout(this.timeout)
      })

      if (!response.ok) {
        throw new Error(`Failed to delete model: ${response.status} ${response.statusText}`)
      }

      console.log(`Model ${modelName} deleted successfully`)
    } catch (error) {
      console.error(`Error deleting model ${modelName}:`, error)
      throw error
    }
  }
}
