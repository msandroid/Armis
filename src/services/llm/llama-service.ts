import { LLMConfig, LLMResponse } from '@/types/llm'
import { LlamaCpp } from 'langchain/llms/llama_cpp'

export class LlamaService {
  private model: LlamaCpp | null = null
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    try {
      this.model = new LlamaCpp({
        modelPath: this.config.modelPath,
        temperature: this.config.temperature,
        maxTokens: this.config.contextSize,
        topP: this.config.topP,
        topK: this.config.topK,
        repeatPenalty: this.config.repeatPenalty,
        verbose: false,
      })

      console.log('Llama 3 8B model initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Llama model:', error)
      throw error
    }
  }

  async generateResponse(prompt: string): Promise<LLMResponse> {
    if (!this.model) {
      throw new Error('Model not initialized. Call initialize() first.')
    }

    const startTime = Date.now()
    
    try {
      const response = await this.model.call(prompt)
      const endTime = Date.now()
      
      return {
        text: response,
        tokens: response.length, // Approximate token count
        duration: endTime - startTime
      }
    } catch (error) {
      console.error('Error generating response:', error)
      throw error
    }
  }

  async generateWithTools(prompt: string, availableTools: string[]): Promise<LLMResponse> {
    const toolPrompt = `
${prompt}

Available tools: ${availableTools.join(', ')}

Please think step by step and determine which tools to use. If you need to use a tool, format your response as:
TOOL_CALL: {"tool": "tool_name", "arguments": {"param": "value"}}

Otherwise, provide a direct response.
`

    return this.generateResponse(toolPrompt)
  }

  isInitialized(): boolean {
    return this.model !== null
  }

  getConfig(): LLMConfig {
    return this.config
  }
}
