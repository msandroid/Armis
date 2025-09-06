import { LLMConfig, LLMResponse } from '@/types/llm'

export interface LlamaCppConfig {
  modelPath?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  contextSize?: number
  threads?: number
  gpuLayers?: number
  verbose?: boolean
}

export interface LlamaCppModel {
  name: string
  path: string
  size: number
  format: string
  parameters: number
}

export class LlamaCppService {
  private model: any = null
  private config: LlamaCppConfig
  private isInitialized = false
  private availableModels: LlamaCppModel[] = []

  constructor(config: LlamaCppConfig = {}) {
    this.config = {
      modelPath: config.modelPath || './models/unsloth/gpt-oss-20b-GGUF/gpt-oss-20b-F16.gguf',
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 2048,
      topP: config.topP || 0.9,
      topK: config.topK || 40,
      contextSize: config.contextSize || 16384,
      threads: config.threads || -1,
      gpuLayers: config.gpuLayers || 99,
      verbose: config.verbose || false,
      ...config
    }
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing LlamaCpp Service...')
      
      // Check if we're in a Node.js environment
      if (typeof window !== 'undefined') {
        console.warn('LlamaCpp Service is not available in browser environment')
        // In browser environment, just mark as initialized without actually loading
        this.isInitialized = true
        console.log('📝 LlamaCpp Service marked as initialized for browser environment')
        return
      }

      // Dynamically import node-llama-cpp
      const { getLlama } = await import('node-llama-cpp')
      
      // Check if model file exists
      const fs = await import('fs')
      const path = await import('path')
      
      if (!fs.existsSync(this.config.modelPath!)) {
        console.warn(`Model file not found at ${this.config.modelPath}`)
        console.log('Available models:')
        await this.scanAvailableModels()
        return
      }

      // Initialize the model using getLlama function
      this.model = await getLlama({
        modelPath: this.config.modelPath,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        topP: this.config.topP,
        topK: this.config.topK,
        contextSize: this.config.contextSize,
        threads: this.config.threads,
        gpuLayers: this.config.gpuLayers,
        verbose: this.config.verbose,
      })

      this.isInitialized = true
      console.log(`✅ LlamaCpp Service initialized with model: ${this.config.modelPath}`)
      
      // Test the model
      await this.testModel()
      
    } catch (error) {
      console.error('❌ Failed to initialize LlamaCpp Service:', error)
      throw error
    }
  }

  private async scanAvailableModels(): Promise<void> {
    try {
      console.log('🔍 Scanning for available models...')
      
      // Node.js環境では動的にモデルディレクトリをスキャン
      if (typeof window === 'undefined') {
        try {
          const fs = await import('fs')
          const path = await import('path')
          
          // modelsディレクトリを再帰的にスキャン
          const scanDirectory = (dir: string): string[] => {
            const files: string[] = []
            try {
              const items = fs.readdirSync(dir)
              for (const item of items) {
                const fullPath = path.join(dir, item)
                const stat = fs.statSync(fullPath)
                if (stat.isDirectory()) {
                  files.push(...scanDirectory(fullPath))
                } else if (item.endsWith('.gguf') || item.endsWith('.GGUF')) {
                  files.push(fullPath)
                }
              }
            } catch (error) {
              console.warn(`Could not scan directory ${dir}:`, error)
            }
            return files
          }
          
          const modelFiles = scanDirectory('./models')
          console.log(`🔍 Found ${modelFiles.length} GGUF files in models directory`)
          
          // 見つかったファイルを利用可能なモデルとして追加
          for (const modelPath of modelFiles) {
            const fileName = path.basename(modelPath)
            const modelName = fileName.replace('.gguf', '').replace('.GGUF', '')
            
            this.availableModels.push({
              name: modelName,
              path: modelPath,
              size: this.estimateModelSize(fileName),
              parameters: this.estimateParameters(fileName)
            })
          }
          
          console.log(`✅ Found ${this.availableModels.length} available GGUF models:`)
          this.availableModels.forEach(model => {
            console.log(`  - ${model.name} (${this.formatFileSize(model.size)})`)
          })
          return
        } catch (error) {
          console.warn('Dynamic model scanning failed, falling back to static list:', error)
        }
      }
      
      // ブラウザ環境では、ローカルファイルシステムへのアクセスは制限されている
      // 代わりに、一般的なモデルパスをチェックする
      const commonModelPaths = [
        './models/unsloth/gpt-oss-20b-GGUF/gpt-oss-20b-F16.gguf',
        './models/TheBloke/Llama-2-7B-Chat-GGUF/llama-2-7b-chat.Q4_K_M.gguf',
        './models/TheBloke/Llama-2-13B-Chat-GGUF/llama-2-13b-chat.Q4_K_M.gguf',
        './models/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/mistral-7b-instruct-v0.2.Q4_K_M.gguf',
        './models/TheBloke/Qwen-7B-Chat-GGUF/qwen-7b-chat.Q4_K_M.gguf',
        './models/TheBloke/CodeLlama-7B-Python-GGUF/codellama-7b-python.Q4_K_M.gguf',
        './models/TheBloke/Phi-2-GGUF/phi-2.Q4_K_M.gguf',
        './models/TheBloke/Phi-3.5-GGUF/phi-3.5.Q4_K_M.gguf',
        './models/TheBloke/LLaVA-1.5-7B-GGUF/llava-1.5-7b.Q4_K_M.gguf',
        './models/TheBloke/Vicuna-7B-v1.5-GGUF/vicuna-7b-v1.5.Q4_K_M.gguf',
        './models/TheBloke/Alpaca-7B-GGUF/alpaca-7b.Q4_K_M.gguf',
        './models/TheBloke/WizardLM-7B-V1.0-GGUF/wizardlm-7b-v1.0.Q4_K_M.gguf',
        './models/TheBloke/Orca-2-7B-GGUF/orca-2-7b.Q4_K_M.gguf',
        './models/TheBloke/MPT-7B-Instruct-GGUF/mpt-7b-instruct.Q4_K_M.gguf',
        './models/TheBloke/Falcon-7B-Instruct-GGUF/falcon-7b-instruct.Q4_K_M.gguf',
        './models/TheBloke/StarCoder-15B-GGUF/starcoder-15b.Q4_K_M.gguf',
        // Qwen3モデルのパスを追加（新しいディレクトリ構造に対応）
        './models/unsloth/Qwen3-0.6B-GGUF/Qwen3-0.6B-BF16.gguf',
        './models/unsloth/Qwen3-1.7B-GGUF/Qwen3-1.7B-BF16.gguf',
        './models/unsloth/Qwen3-4B-Instruct-2507-GGUF/Qwen3-4B-Instruct-2507-BF16.gguf',
        './models/unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF/DeepSeek-R1-0528-Qwen3-8B-BF16.gguf',
        './models/unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF/Qwen3-30B-A3B-Instruct-2507-BF16.gguf',
        // 従来のパスも保持（後方互換性のため）
        './models/Qwen3-0.6B-BF16.gguf'
      ]

      // 設定されたモデルパスを最初に追加
      if (this.config.modelPath && !commonModelPaths.includes(this.config.modelPath)) {
        commonModelPaths.unshift(this.config.modelPath)
      }

      // 各モデルパスをチェックして、利用可能なモデルとして追加
      for (const modelPath of commonModelPaths) {
        const fileName = modelPath.split('/').pop() || modelPath.split('\\').pop() || 'model.gguf'
        const modelName = fileName.replace('.gguf', '').replace('.GGUF', '')
        
        this.availableModels.push({
          name: modelName,
          path: modelPath,
          size: this.estimateModelSize(modelName),
          format: 'GGUF',
          parameters: this.estimateParameters(fileName)
        })
      }
      
      console.log(`✅ Found ${this.availableModels.length} available GGUF models:`)
      this.availableModels.forEach(model => {
        console.log(`  - ${model.name} (${this.formatFileSize(model.size)})`)
      })
    } catch (error) {
      console.error('Error scanning models:', error)
    }
  }

  private estimateParameters(filename: string): number {
    // Rough estimation based on filename patterns
    if (filename.includes('gpt-oss-20b')) return 20_900_000_000
    if (filename.includes('qwen2.5-omni-7b')) return 7_620_000_000
    if (filename.includes('qwen2.5-omni-3b')) return 3_400_000_000
    if (filename.includes('7b')) return 7_000_000_000
    if (filename.includes('13b')) return 13_000_000_000
    if (filename.includes('30b')) return 30_000_000_000
    if (filename.includes('70b')) return 70_000_000_000
    if (filename.includes('1b')) return 1_000_000_000
    if (filename.includes('3b')) return 3_000_000_000
    if (filename.includes('15b')) return 15_000_000_000
    if (filename.includes('2b')) return 2_000_000_000
    if (filename.includes('0.6b')) return 600_000_000
    if (filename.includes('1.7b')) return 1_700_000_000
    if (filename.includes('4b')) return 4_000_000_000
    if (filename.includes('8b')) return 8_000_000_000
    if (filename.includes('phi-2')) return 2_700_000_000
    if (filename.includes('phi-3.5')) return 3_800_000_000
    return 0
  }

  private estimateModelSize(modelName: string): number {
    // Rough estimation of model file size based on parameters and quantization
    const params = this.estimateParameters(modelName)
    
    // Estimate size based on quantization level
    if (modelName.includes('Q2_K')) return params * 0.25 / 8 // ~25% of parameters
    if (modelName.includes('Q3_K')) return params * 0.375 / 8 // ~37.5% of parameters
    if (modelName.includes('Q4_K')) return params * 0.5 / 8 // ~50% of parameters
    if (modelName.includes('Q5_K')) return params * 0.625 / 8 // ~62.5% of parameters
    if (modelName.includes('Q6_K')) return params * 0.75 / 8 // ~75% of parameters
    if (modelName.includes('Q8_K')) return params * 1.0 / 8 // ~100% of parameters
    if (modelName.includes('F16')) return params * 2 / 8 // 16-bit float
    if (modelName.includes('F32')) return params * 4 / 8 // 32-bit float
    
    // Default to Q4_K estimation
    return params * 0.5 / 8
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  private async testModel(): Promise<void> {
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        console.log('🧪 Model test skipped in browser environment')
        return
      }
      
      const testPrompt = "Hello, how are you?"
      const response = await this.generateResponse(testPrompt)
      console.log(`🧪 Model test successful: "${response.text.substring(0, 50)}..."`)
    } catch (error) {
      console.error('Model test failed:', error)
    }
  }

  async generateResponse(prompt: string): Promise<LLMResponse> {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.warn('LlamaCpp Service is not available in browser environment')
      return {
        text: `[Browser Mode] LlamaCpp is not available in browser environment. Prompt: ${prompt}`,
        tokens: this.estimateTokenCount(prompt),
        duration: 0
      }
    }

    if (!this.isInitialized || !this.model) {
      throw new Error('LlamaCpp Service not initialized or model not loaded')
    }

    const startTime = Date.now()
    
    try {
      const response = await this.model.invoke(prompt)
      const endTime = Date.now()
      
      return {
        text: response,
        tokens: this.estimateTokenCount(response),
        duration: endTime - startTime
      }
    } catch (error) {
      console.error('Error generating response:', error)
      throw error
    }
  }

  async generateStream(
    prompt: string,
    onChunk?: (chunk: string) => void
  ): Promise<LLMResponse> {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      console.warn('LlamaCpp Service is not available in browser environment')
      const mockResponse = `[Browser Mode] LlamaCpp is not available in browser environment. Prompt: ${prompt}`
      
      if (onChunk) {
        onChunk(mockResponse)
      }
      
      return {
        text: mockResponse,
        tokens: this.estimateTokenCount(mockResponse),
        duration: 0
      }
    }

    if (!this.isInitialized || !this.model) {
      throw new Error('LlamaCpp Service not initialized or model not loaded')
    }

    const startTime = Date.now()
    let fullResponse = ''
    
    try {
      // For streaming, we'll use the regular invoke but simulate streaming
      // In a real implementation, you'd use the streaming API if available
      const response = await this.model.invoke(prompt)
      const endTime = Date.now()
      
      // Simulate streaming by chunking the response
      const chunks = response.split(' ')
      for (const chunk of chunks) {
        fullResponse += chunk + ' '
        if (onChunk) {
          onChunk(chunk + ' ')
        }
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      
      return {
        text: fullResponse.trim(),
        tokens: this.estimateTokenCount(fullResponse),
        duration: endTime - startTime
      }
    } catch (error) {
      console.error('Error in stream generation:', error)
      throw error
    }
  }

  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ): Promise<LLMResponse> {
    // Convert messages to a single prompt
    const prompt = this.formatChatMessages(messages)
    return this.generateResponse(prompt)
  }

  private formatChatMessages(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): string {
    let prompt = ''
    
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          prompt += `[INST] <<SYS>>\n${message.content}\n<</SYS>>\n\n`
          break
        case 'user':
          prompt += `${message.content} [/INST]`
          break
        case 'assistant':
          prompt += `${message.content}\n[INST] `
          break
      }
    }
    
    return prompt
  }

  private estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4)
  }

  async loadModel(modelPath: string): Promise<void> {
    try {
      console.log(`🔄 Loading model: ${modelPath}`)
      
      // Check if we're in a Node.js environment
      if (typeof window !== 'undefined') {
        console.warn('LlamaCpp Service is not available in browser environment')
        // In browser environment, just update the config without actually loading
        this.config.modelPath = modelPath
        console.log(`📝 Model path updated for browser environment: ${modelPath}`)
        return
      }
      
      // Dynamically import node-llama-cpp
      const { getLlama } = await import('node-llama-cpp')
      
      // Close existing model if any
      if (this.model) {
        await this.model.close()
      }
      
      // Load new model using getLlama function (same as initialize)
      this.model = await getLlama({
        modelPath,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        topP: this.config.topP,
        topK: this.config.topK,
        contextSize: this.config.contextSize,
        threads: this.config.threads,
        gpuLayers: this.config.gpuLayers,
        verbose: this.config.verbose,
      })
      
      this.config.modelPath = modelPath
      this.isInitialized = true
      
      console.log(`✅ Model loaded successfully: ${modelPath}`)
      
      // Test the model
      await this.testModel()
    } catch (error) {
      console.error('❌ Failed to load model:', error)
      throw error
    }
  }

  async getAvailableModels(): Promise<LlamaCppModel[]> {
    if (this.availableModels.length === 0) {
      await this.scanAvailableModels()
    }
    return this.availableModels
  }

  async listModels(): Promise<LlamaCppModel[]> {
    return this.getAvailableModels()
  }

  getCurrentModelPath(): string | null {
    return this.config.modelPath || null
  }

  getModelInfo(): LlamaCppModel | null {
    if (!this.config.modelPath) return null
    
    return {
      name: this.config.modelPath.split('/').pop() || 'Unknown',
      path: this.config.modelPath,
      size: 0, // Would need to read file stats
      format: 'GGUF',
      parameters: this.estimateParameters(this.config.modelPath)
    }
  }

  updateConfig(newConfig: Partial<LlamaCppConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Configuration updated:', this.config)
  }

  isReady(): boolean {
    return this.isInitialized && this.model !== null
  }

  async close(): Promise<void> {
    if (this.model) {
      await this.model.close()
      this.model = null
      this.isInitialized = false
      console.log('LlamaCpp Service closed')
    }
  }
}
