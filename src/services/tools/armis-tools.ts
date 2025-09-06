import { Tool } from '@/services/agent/sequential-thinking-agent'
import { VectorDatabaseService } from '@/services/vector/vector-database'
import { AISDKService } from '@/services/llm/ai-sdk-service'
import { GraphAITools } from './graphai-tools'

// AI SDKサービスインスタンス
const aiSDKService = new AISDKService()

// ブラウザ環境かどうかをチェック
const isBrowser = typeof window !== 'undefined'

// MulmoCastツールインスタンス（Node.js環境でのみ作成）
let mulmoCastTools: any = null
if (!isBrowser) {
  try {
    const { MulmoCastTools } = require('./mulmocast-tools')
    mulmoCastTools = new MulmoCastTools()
  } catch (error) {
    console.warn('MulmoCast tools not available:', error)
  }
}

// GraphAIツールインスタンス
const graphAITools = new GraphAITools()

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

    onComplete(fullResponse || '')

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
    execute: async (args: Record<string, any>) => {
      try {
        const { url } = args
        if (!url) {
          return {
            success: false,
            error: 'URL is required',
            url: ''
          }
        }
        
        const response = await fetch(url)
        const html = await response.text()
        
        // Simple text extraction (in production, use a proper HTML parser)
        const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        
        return {
          success: true,
          content: textContent.substring(0, 1000), // Limit content length
          url: url
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          url: args.url || ''
        }
      }
    }
  }

  // Text summarizer tool
  textSummarizer: Tool = {
    name: 'textSummarizer',
    description: 'Summarize text content',
    execute: async (args: Record<string, any>) => {
      const { text, maxLength = 200 } = args
      
      if (!text) {
        return {
          success: false,
          error: 'Text is required',
          summary: '',
          originalLength: 0
        }
      }

      if (text.length <= maxLength) {
        return {
          success: true,
          summary: text,
          originalLength: text.length
        }
      }

      // Simple summarization by taking first sentences
      const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0)
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
    execute: async (args: Record<string, any>) => {
      const { script, voice = 'default' } = args
      
      if (!script) {
        return {
          success: false,
          error: 'Script is required',
          audioUrl: '',
          duration: 0,
          script: '',
          voice: ''
        }
      }
      
      // Mock TTS generation
      return {
        success: true,
        audioUrl: `mock://audio/${Date.now()}.mp3`,
        duration: Math.ceil(script.length / 10), // Rough estimate
        script: script,
        voice: voice
      }
    }
  }

  // Image generator tool
  imageGenerator: Tool = {
    name: 'imageGenerator',
    description: 'Generate images based on prompts',
    execute: async (args: Record<string, any>) => {
      const { prompt, style = 'realistic' } = args
      
      if (!prompt) {
        return {
          success: false,
          error: 'Prompt is required',
          imageUrl: '',
          prompt: '',
          style: ''
        }
      }
      
      // Mock image generation
      return {
        success: true,
        imageUrl: `mock://images/${Date.now()}.png`,
        prompt: prompt,
        style: style
      }
    }
  }

  // Video assembler tool
  videoAssembler: Tool = {
    name: 'videoAssembler',
    description: 'Assemble video from audio and images',
    execute: async (args: Record<string, any>) => {
      const { audio, images, duration = 60 } = args
      
      if (!audio || !images || !Array.isArray(images)) {
        return {
          success: false,
          error: 'Audio and images array are required',
          videoUrl: '',
          duration: 0,
          components: { audio: '', images: [] }
        }
      }
      
      // Mock video assembly
      return {
        success: true,
        videoUrl: `mock://videos/${Date.now()}.mp4`,
        duration: duration,
        components: {
          audio: audio,
          images: images
        }
      }
    }
  }

  // User preference lookup tool
  userPreferenceLookup: Tool = {
    name: 'userPreferenceLookup',
    description: 'Look up user preferences and past workflows',
    execute: async (args: Record<string, any>) => {
      const { userId, context } = args
      
      if (!userId || !context) {
        return {
          success: false,
          error: 'User ID and context are required',
          preferences: []
        }
      }
      
      try {
        const similarWorkflows = await this.vectorDB.findSimilarWorkflows(
          userId,
          context,
          3
        )

        return {
          success: true,
          preferences: similarWorkflows.map((wf: any) => ({
            action: wf.metadata.action,
            context: wf.metadata.context,
            result: wf.metadata.result,
            timestamp: wf.metadata.timestamp
          }))
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          preferences: []
        }
      }
    }
  }

  // Workflow template finder tool
  workflowTemplateFinder: Tool = {
    name: 'workflowTemplateFinder',
    description: 'Find suitable workflow templates',
    execute: async (args: Record<string, any>) => {
      const { query, tags } = args
      
      if (!query) {
        return {
          success: false,
          error: 'Query is required',
          templates: []
        }
      }
      
      try {
        const templates = await this.vectorDB.findWorkflowTemplates(query, 5)
        
        return {
          success: true,
          templates: templates.map((t: any) => ({
            name: t.metadata.name,
            description: t.metadata.description,
            steps: t.metadata.steps,
            tags: t.metadata.tags
          }))
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          templates: []
        }
      }
    }
  }

  // File processor tool
  fileProcessor: Tool = {
    name: 'fileProcessor',
    description: 'Process uploaded files',
    execute: async (args: Record<string, any>) => {
      const { filePath, type } = args
      
      if (!filePath || !type) {
        return {
          success: false,
          error: 'File path and type are required',
          processedData: null
        }
      }
      
      // Mock file processing
      return {
        success: true,
        processedData: {
          type: type,
          path: filePath,
          size: Math.random() * 1000000,
          processedAt: new Date().toISOString()
        }
      }
    }
  }

  // Get all available tools
  getAllTools(): Tool[] {
    const tools: Tool[] = [
      this.webScraper,
      this.textSummarizer,
      this.ttsGenerator,
      this.imageGenerator,
      this.videoAssembler,
      this.userPreferenceLookup,
      this.workflowTemplateFinder,
      this.fileProcessor,
    ]

    if (mulmoCastTools) {
      tools.push(...mulmoCastTools.getAllTools())
    }
    if (graphAITools) {
      tools.push(...graphAITools.getAllTools())
    }

    return tools
  }
}
