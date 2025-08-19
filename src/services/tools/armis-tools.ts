import { Tool } from '@/services/agent/sequential-thinking-agent'
import { VectorDatabaseService } from '@/services/vector/vector-database'
import { AISDKService } from '@/services/llm/ai-sdk-service'

// AI SDKサービスインスタンス
const aiSDKService = new AISDKService()

/**
 * 改善されたストリーミングチャット機能
 * AI SDKの最新機能を活用した高品質なストリーミング
 */
export async function sendEnhancedStreamingChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void,
  modelId?: string,
  options?: {
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
  }
): Promise<void> {
  try {
    // プロバイダーが設定されているかチェック
    if (!aiSDKService.isStreamingSupported()) {
      throw new Error('AI provider not configured. Please configure an AI provider first.')
    }

    // システムプロンプトがある場合は追加
    let enhancedMessages = [...messages]
    if (options?.systemPrompt) {
      enhancedMessages = [
        { role: 'system' as const, content: options.systemPrompt },
        ...messages
      ]
    }

    // 新しいストリーミングチャット機能を使用
    await aiSDKService.streamChatResponse(
      enhancedMessages,
      onChunk,
      onComplete,
      onError
    )

  } catch (error) {
    console.error('Enhanced streaming chat error:', error)
    const errorObj = error instanceof Error ? error : new Error('Unknown streaming error')
    onError(errorObj)
  }
}

/**
 * 高速ストリーミングチャット機能
 * 低レイテンシーで高品質なストリーミング
 */
export async function sendFastStreamingChat(
  prompt: string,
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: Error) => void,
  options?: {
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
  }
): Promise<void> {
  try {
    // プロバイダーが設定されているかチェック
    if (!aiSDKService.isStreamingSupported()) {
      throw new Error('AI provider not configured. Please configure an AI provider first.')
    }

    // 高速ストリーミング機能を使用
    const fullResponse = await aiSDKService.streamFastResponse(
      prompt,
      onChunk,
      options
    )

    onComplete(fullResponse)

  } catch (error) {
    console.error('Fast streaming chat error:', error)
    const errorObj = error instanceof Error ? error : new Error('Unknown streaming error')
    onError(errorObj)
  }
}

/**
 * ストリーミング状態の取得
 */
export function getStreamingStatus(): {
  isSupported: boolean
  providerInfo: { providerId: string; modelId: string; isConfigured: boolean } | null
} {
  return {
    isSupported: aiSDKService.isStreamingSupported(),
    providerInfo: aiSDKService.getProviderInfo()
  }
}

/**
 * プロバイダー設定のヘルパー関数
 */
export async function configureAIProvider(
  providerId: string,
  modelId: string,
  apiKey: string,
  options?: {
    baseUrl?: string
    temperature?: number
    maxOutputTokens?: number
  }
): Promise<void> {
  try {
    await aiSDKService.configureProvider({
      providerId,
      modelId,
      apiKey,
      baseUrl: options?.baseUrl,
      temperature: options?.temperature || 0.7,
      maxOutputTokens: options?.maxOutputTokens || 4096
    })
    
    console.log(`AI provider configured: ${providerId} with model: ${modelId}`)
  } catch (error) {
    console.error('Failed to configure AI provider:', error)
    throw error
  }
}

export class ArmisTools {
  private vectorDB: VectorDatabaseService

  constructor(vectorDB: VectorDatabaseService) {
    this.vectorDB = vectorDB
  }

  // Web scraping tool
  webScraper: Tool = {
    name: 'webScraper',
    description: 'Scrape content from a web URL',
    execute: async (args: { url: string }) => {
      try {
        const response = await fetch(args.url)
        const html = await response.text()
        
        // Simple text extraction (in production, use a proper HTML parser)
        const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        
        return {
          success: true,
          content: textContent.substring(0, 1000), // Limit content length
          url: args.url
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          url: args.url
        }
      }
    }
  }

  // Text summarizer tool
  textSummarizer: Tool = {
    name: 'textSummarizer',
    description: 'Summarize text content',
    execute: async (args: { text: string, maxLength?: number }) => {
      const maxLength = args.maxLength || 200
      const text = args.text

      if (text.length <= maxLength) {
        return {
          success: true,
          summary: text,
          originalLength: text.length
        }
      }

      // Simple summarization by taking first sentences
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
      const summary = sentences.slice(0, 3).join('. ') + '.'
      
      return {
        success: true,
        summary: summary.substring(0, maxLength),
        originalLength: text.length
      }
    }
  }

  // TTS generator tool
  ttsGenerator: Tool = {
    name: 'ttsGenerator',
    description: 'Generate text-to-speech audio',
    execute: async (args: { script: string, voice?: string }) => {
      // Mock TTS generation
      return {
        success: true,
        audioUrl: `mock://audio/${Date.now()}.mp3`,
        duration: Math.ceil(args.script.length / 10), // Rough estimate
        script: args.script,
        voice: args.voice || 'default'
      }
    }
  }

  // Image generator tool
  imageGenerator: Tool = {
    name: 'imageGenerator',
    description: 'Generate images based on prompts',
    execute: async (args: { prompt: string, style?: string }) => {
      // Mock image generation
      return {
        success: true,
        imageUrl: `mock://images/${Date.now()}.png`,
        prompt: args.prompt,
        style: args.style || 'realistic'
      }
    }
  }

  // Video assembler tool
  videoAssembler: Tool = {
    name: 'videoAssembler',
    description: 'Assemble video from audio and images',
    execute: async (args: { audio: string, images: string[], duration?: number }) => {
      // Mock video assembly
      return {
        success: true,
        videoUrl: `mock://videos/${Date.now()}.mp4`,
        duration: args.duration || 60,
        components: {
          audio: args.audio,
          images: args.images
        }
      }
    }
  }

  // User preference lookup tool
  userPreferenceLookup: Tool = {
    name: 'userPreferenceLookup',
    description: 'Look up user preferences and past workflows',
    execute: async (args: { userId: string, context: Record<string, any> }) => {
      try {
        const similarWorkflows = await this.vectorDB.findSimilarWorkflows(
          args.userId,
          args.context,
          3
        )

        return {
          success: true,
          preferences: similarWorkflows.map(wf => ({
            action: wf.metadata.action,
            context: wf.metadata.context,
            result: wf.metadata.result,
            timestamp: wf.metadata.timestamp
          }))
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          preferences: []
        }
      }
    }
  }

  // Workflow template finder tool
  workflowTemplateFinder: Tool = {
    name: 'workflowTemplateFinder',
    description: 'Find suitable workflow templates',
    execute: async (args: { query: string, tags?: string[] }) => {
      try {
        const templates = await this.vectorDB.findWorkflowTemplates(args.query, 5)
        
        return {
          success: true,
          templates: templates.map(t => ({
            name: t.metadata.name,
            description: t.metadata.description,
            steps: t.metadata.steps,
            tags: t.metadata.tags
          }))
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          templates: []
        }
      }
    }
  }

  // File processor tool
  fileProcessor: Tool = {
    name: 'fileProcessor',
    description: 'Process uploaded files',
    execute: async (args: { filePath: string, type: string }) => {
      // Mock file processing
      return {
        success: true,
        processedData: {
          type: args.type,
          path: args.filePath,
          size: Math.random() * 1000000,
          processedAt: new Date().toISOString()
        }
      }
    }
  }

  // Get all available tools
  getAllTools(): Tool[] {
    return [
      this.webScraper,
      this.textSummarizer,
      this.ttsGenerator,
      this.imageGenerator,
      this.videoAssembler,
      this.userPreferenceLookup,
      this.workflowTemplateFinder,
      this.fileProcessor
    ]
  }
}
