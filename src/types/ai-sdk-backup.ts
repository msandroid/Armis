export interface AIModel {
  id: string
  name: string
  provider: string
  description?: string
  maxOutputTokens?: number
  maxTokens?: number
  capabilities: {
    imageInput: boolean
    objectGeneration: boolean
    toolUsage: boolean
    toolStreaming: boolean
  }
}

export interface AIProvider {
  id: string
  name: string
  description: string
  apiKeyName: string
  requiresApiKey?: boolean
  baseUrl?: string
  models: AIModel[]
}

export interface AIProviderConfig {
  providerId: string
  modelId: string
  apiKey: string
  baseUrl?: string
  temperature?: number
  maxOutputTokens?: number
  maxTokens?: number
}

export interface EnabledModel {
  providerId: string
  modelId: string
  enabled: boolean
  priority?: number
}

export interface ModelSettings {
  enabledModels: EnabledModel[]
  defaultModel?: string // providerId:modelId format
  autoSwitch: boolean
}

// AI SDK 5の最新情報に基づくプロバイダーとモデル
export const AVAILABLE_PROVIDERS: AIProvider[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Vercel AI models',
    apiKeyName: 'VERCEL_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.vercel.com',
    models: [
      {
        id: 'v0-1.0-md',
        name: 'V0 1.0 MD',
        provider: 'Vercel',
        maxOutputTokens: 32768,
        description: 'Vercel AI model',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      }
    ]
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    description: 'xAI Grok models for reasoning, analysis, and real-time information',
    apiKeyName: 'XAI_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.x.ai/v1',
    models: [
      // Grok 4 シリーズ (最新)
      {
        id: 'grok-4',
        name: 'Grok-4',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'Most capable Grok model with superior reasoning and real-time knowledge',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'grok-4-mini',
        name: 'Grok-4 Mini',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'Fast and efficient Grok-4 variant',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Grok 3 シリーズ
      {
        id: 'grok-3',
        name: 'Grok-3',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'High-performance Grok model with real-time knowledge',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'grok-3-fast',
        name: 'Grok-3 Fast',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'Ultra-fast Grok-3 variant',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'grok-3-mini',
        name: 'Grok-3 Mini',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'Compact and efficient Grok-3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'grok-3-mini-fast',
        name: 'Grok-3 Mini Fast',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'Ultra-fast mini Grok-3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Grok 2 シリーズ
      {
        id: 'grok-2-1212',
        name: 'Grok-2 1212',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'Grok-2 model with real-time knowledge',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'grok-2-vision-1212',
        name: 'Grok-2 Vision 1212',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'Vision-capable Grok-2 model with real-time knowledge',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Grok Beta シリーズ
      {
        id: 'grok-beta',
        name: 'Grok Beta',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'Beta version of Grok with latest features',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'grok-vision-beta',
        name: 'Grok Vision Beta',
        provider: 'xAI Grok',
        maxTokens: 128000,
        description: 'Beta version of Grok with vision capabilities',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Grok 1 シリーズ (レガシー)
      {
        id: 'grok-1',
        name: 'Grok-1',
        provider: 'xAI Grok',
        maxTokens: 8192,
        description: 'Original Grok model (legacy)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'grok-1-vision',
        name: 'Grok-1 Vision',
        provider: 'xAI Grok',
        maxTokens: 8192,
        description: 'Original Grok model with vision (legacy)',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-5, GPT-4, GPT-3.5, DALL-E, Whisper, TTS models',
    apiKeyName: 'OPENAI_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.openai.com/v1',
    models: [
      // GPT-4o シリーズ (より一般的で利用可能)
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Latest GPT-4 model with enhanced capabilities and vision',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Fast and efficient GPT-4o variant',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // GPT-5 シリーズ (最新 - 利用制限がある場合がある)
      {
        id: 'gpt-5',
        name: 'GPT-5',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Latest and most capable model for complex reasoning',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-5-mini',
        name: 'GPT-5 Mini',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Fast and efficient GPT-5 variant',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-5-nano',
        name: 'GPT-5 Nano',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Ultra-fast GPT-5 variant',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-5-chat-latest',
        name: 'GPT-5 Chat Latest',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Latest GPT-5 chat model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // 推論モデル (o1, o3, o4 シリーズ)
      {
        id: 'o1',
        name: 'O1',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Advanced reasoning model with enhanced problem-solving capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'o3',
        name: 'O3',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'High-performance reasoning model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'o3-mini',
        name: 'O3 Mini',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Fast reasoning model for quick problem-solving',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'o4-mini',
        name: 'O4 Mini',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Latest mini reasoning model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // GPT-4o シリーズ
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Latest GPT-4 model with enhanced capabilities and vision',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Fast and efficient GPT-4o variant',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-4o-preview',
        name: 'GPT-4o Preview',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Preview version of GPT-4o with latest features',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // GPT-4 シリーズ
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Enhanced GPT-4 model with improved performance',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo Preview',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'Preview version of GPT-4 Turbo',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OpenAI',
        maxTokens: 8192,
        description: 'Original GPT-4 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // GPT-3.5 シリーズ
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OpenAI',
        maxTokens: 16385,
        description: 'Fast and cost-effective model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-3.5-turbo-instruct',
        name: 'GPT-3.5 Turbo Instruct',
        provider: 'OpenAI',
        maxTokens: 16385,
        description: 'Instruction-tuned GPT-3.5 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // 埋め込みモデル
      {
        id: 'text-embedding-3-large',
        name: 'Text Embedding 3 Large',
        provider: 'OpenAI',
        maxTokens: 8192,
        description: 'High-quality text embedding model with 3072 dimensions',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'text-embedding-3-small',
        name: 'Text Embedding 3 Small',
        provider: 'OpenAI',
        maxTokens: 8192,
        description: 'Efficient text embedding model with 1536 dimensions',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'text-embedding-ada-002',
        name: 'Text Embedding Ada 002',
        provider: 'OpenAI',
        maxTokens: 8192,
        description: 'Legacy text embedding model with 1536 dimensions',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      // 画像生成モデル
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        provider: 'OpenAI',
        maxTokens: 4000,
        description: 'Latest image generation model with high quality',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'dall-e-2',
        name: 'DALL-E 2',
        provider: 'OpenAI',
        maxTokens: 1000,
        description: 'Image generation model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'gpt-image-1',
        name: 'GPT Image 1',
        provider: 'OpenAI',
        maxTokens: 4000,
        description: 'Advanced image generation model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      // 音声認識モデル
      {
        id: 'whisper-1',
        name: 'Whisper',
        provider: 'OpenAI',
        maxTokens: 448,
        description: 'Speech recognition model for audio transcription',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'gpt-4o-mini-transcribe',
        name: 'GPT-4o Mini Transcribe',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'GPT-4o Mini with transcription capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'gpt-4o-transcribe',
        name: 'GPT-4o Transcribe',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'GPT-4o with transcription capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      // 音声合成モデル
      {
        id: 'tts-1',
        name: 'TTS-1',
        provider: 'OpenAI',
        maxTokens: 4096,
        description: 'Text-to-speech model for audio generation',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'tts-1-hd',
        name: 'TTS-1 HD',
        provider: 'OpenAI',
        maxTokens: 4096,
        description: 'High-definition text-to-speech model',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'gpt-4o-mini-tts',
        name: 'GPT-4o Mini TTS',
        provider: 'OpenAI',
        maxTokens: 128000,
        description: 'GPT-4o Mini with text-to-speech capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      }
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for reasoning, analysis, and coding',
    apiKeyName: 'ANTHROPIC_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.anthropic.com',
    models: [
      // Claude 4 シリーズ (最新)
      {
        id: 'claude-opus-4-1-20250805',
        name: 'Claude Opus 4.1',
        provider: 'Anthropic',
        maxTokens: 200000,
        description: 'Most capable and intelligent Claude model yet with superior reasoning',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        provider: 'Anthropic',
        maxTokens: 200000,
        description: 'Most powerful and capable Claude model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        provider: 'Anthropic',
        maxTokens: 200000,
        description: 'High-performance model with exceptional reasoning capabilities',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Claude 3.7 シリーズ
      {
        id: 'claude-3-7-sonnet-20250219',
        name: 'Claude 3.7 Sonnet',
        provider: 'Anthropic',
        maxTokens: 200000,
        description: 'Enhanced Sonnet model with improved performance',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Claude 3.5 シリーズ
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'Anthropic',
        maxTokens: 200000,
        description: 'Fast and efficient Sonnet model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        provider: 'Anthropic',
        maxTokens: 200000,
        description: 'Ultra-fast and cost-effective model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Claude 3 シリーズ (非推奨だが利用可能)
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        maxTokens: 200000,
        description: 'Claude 3 Opus model (deprecated - use Claude 4 models)',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        maxTokens: 200000,
        description: 'Claude 3 Sonnet model (deprecated - use Claude 4 models)',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'Anthropic',
        maxTokens: 200000,
        description: 'Fast Claude 3 Haiku model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Claude 2 シリーズ (非推奨だが利用可能)
      {
        id: 'claude-2.1',
        name: 'Claude 2.1',
        provider: 'Anthropic',
        maxTokens: 100000,
        description: 'Claude 2.1 model (deprecated - use Claude 4 models)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-2.0',
        name: 'Claude 2.0',
        provider: 'Anthropic',
        maxTokens: 100000,
        description: 'Claude 2.0 model (deprecated - use Claude 4 models)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Claude Instant シリーズ (非推奨だが利用可能)
      {
        id: 'claude-instant-1.2',
        name: 'Claude Instant 1.2',
        provider: 'Anthropic',
        maxTokens: 100000,
        description: 'Claude Instant 1.2 model (deprecated - use Claude 3.5 Haiku)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-instant-1.1',
        name: 'Claude Instant 1.1',
        provider: 'Anthropic',
        maxTokens: 100000,
        description: 'Claude Instant 1.1 model (deprecated - use Claude 3.5 Haiku)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-instant-1.0',
        name: 'Claude Instant 1.0',
        provider: 'Anthropic',
        maxTokens: 100000,
        description: 'Claude Instant 1.0 model (deprecated - use Claude 3.5 Haiku)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Claude 1 シリーズ (非推奨だが利用可能)
      {
        id: 'claude-1.3',
        name: 'Claude 1.3',
        provider: 'Anthropic',
        maxTokens: 100000,
        description: 'Claude 1.3 model (deprecated - use Claude 4 models)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-1.2',
        name: 'Claude 1.2',
        provider: 'Anthropic',
        maxTokens: 100000,
        description: 'Claude 1.2 model (deprecated - use Claude 4 models)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-1.1',
        name: 'Claude 1.1',
        provider: 'Anthropic',
        maxTokens: 100000,
        description: 'Claude 1.1 model (deprecated - use Claude 4 models)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'claude-1.0',
        name: 'Claude 1.0',
        provider: 'Anthropic',
        maxTokens: 100000,
        description: 'Claude 1.0 model (deprecated - use Claude 4 models)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'google',
    name: 'Google Generative AI',
    description: 'Gemini, Imagen, Veo models for text, image, and video generation',
    apiKeyName: 'GOOGLE_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://generativelanguage.googleapis.com',
    models: [
      // Gemini 2.5 シリーズ (最新)
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'Google Generative AI',
        maxTokens: 1000000,
        description: 'Latest and most capable Gemini model for complex reasoning',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google Generative AI',
        maxTokens: 1000000,
        description: 'Fast and efficient Gemini 2.5 model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        provider: 'Google Generative AI',
        maxTokens: 1000000,
        description: 'Ultra-fast and cost-effective Gemini 2.5 model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Gemini 2.0 シリーズ
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'Google Generative AI',
        maxTokens: 1000000,
        description: 'Fast Gemini 2.0 model with enhanced capabilities',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemini-2.0-flash-lite',
        name: 'Gemini 2.0 Flash Lite',
        provider: 'Google Generative AI',
        maxTokens: 1000000,
        description: 'Ultra-fast Gemini 2.0 model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Gemini 1.5 シリーズ
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'Google Generative AI',
        maxTokens: 1000000,
        description: 'Most capable Gemini 1.5 model for complex reasoning',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'Google Generative AI',
        maxTokens: 1000000,
        description: 'Fast and efficient Gemini 1.5 model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Imagen 4.0 シリーズ (画像生成)
      {
        id: 'imagen-4.0-generate',
        name: 'Imagen 4.0 Generate',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Latest Imagen model for high-quality image generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'imagen-4.0-fast-generate',
        name: 'Imagen 4.0 Fast Generate',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Fast Imagen 4.0 model for quick image generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'imagen-4.0-ultra-generate',
        name: 'Imagen 4.0 Ultra Generate',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Ultra-high quality Imagen 4.0 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      // Imagen 3.0 シリーズ
      {
        id: 'imagen-3.0-generate-002',
        name: 'Imagen 3.0 Generate 002',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Enhanced Imagen 3.0 model for image generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'imagen-3.0-generate-001',
        name: 'Imagen 3.0 Generate 001',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Imagen 3.0 model for image generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'imagen-3.0-fast-generate-001',
        name: 'Imagen 3.0 Fast Generate 001',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Fast Imagen 3.0 model for quick image generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'imagen-3.0-capability-001',
        name: 'Imagen 3.0 Capability 001',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Imagen 3.0 model with enhanced capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      // Veo シリーズ (動画生成)
      {
        id: 'veo-2',
        name: 'Veo 2',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Latest Veo model for video generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'veo-3',
        name: 'Veo 3',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Enhanced Veo 3 model for video generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'veo-3-fast',
        name: 'Veo 3 Fast',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Fast Veo 3 model for quick video generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'veo-3-preview',
        name: 'Veo 3 Preview',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Preview version of Veo 3 with latest features',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'veo-3-fast-preview',
        name: 'Veo 3 Fast Preview',
        provider: 'Google Generative AI',
        maxTokens: 4000,
        description: 'Preview version of fast Veo 3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      }
    ]
  },
  {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral models for text generation, vision, audio, and coding',
    apiKeyName: 'MISTRAL_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.mistral.ai/v1',
    models: [
      // Premier Models (最新)
      {
        id: 'mistral-medium-2508',
        name: 'Mistral Medium 3.1',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Frontier-class multimodal model with improved tone and performance',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'magistral-medium-2507',
        name: 'Magistral Medium 1.1',
        provider: 'Mistral',
        maxTokens: 40000,
        description: 'Frontier-class reasoning model for complex problem solving',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'codestral-2508',
        name: 'Codestral 2508',
        provider: 'Mistral',
        maxTokens: 256000,
        description: 'Cutting-edge language model specialized for coding tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'voxtral-mini-2507',
        name: 'Voxtral Mini Transcribe',
        provider: 'Mistral',
        maxTokens: 32768,
        description: 'Efficient audio input model optimized for transcription',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'devstral-medium-2507',
        name: 'Devstral Medium',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Enterprise-grade text model for software engineering agents',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-ocr-2505',
        name: 'Mistral OCR 2505',
        provider: 'Mistral',
        maxTokens: 8192,
        description: 'OCR service for extracting text from images and documents',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'magistral-medium-2506',
        name: 'Magistral Medium 1',
        provider: 'Mistral',
        maxTokens: 40000,
        description: 'First frontier-class reasoning model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'ministral-3b-2410',
        name: 'Ministral 3B',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'World\'s best edge model for on-device inference',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'ministral-8b-2410',
        name: 'Ministral 8B',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Powerful edge model with high performance/price ratio',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-medium-2505',
        name: 'Mistral Medium 3',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Frontier-class multimodal model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'codestral-2501',
        name: 'Codestral 2501',
        provider: 'Mistral',
        maxTokens: 256000,
        description: 'Cutting-edge language model for coding with FIM and test generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-large-2411',
        name: 'Mistral Large 2.1',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Top-tier large model for high-complexity tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'pixtral-large-2411',
        name: 'Pixtral Large',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'First frontier-class multimodal model with vision capabilities',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-small-2407',
        name: 'Mistral Small 2',
        provider: 'Mistral',
        maxTokens: 32768,
        description: 'Updated small version with improved performance',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-embed',
        name: 'Mistral Embed',
        provider: 'Mistral',
        maxTokens: 8192,
        description: 'State-of-the-art semantic embedding for text representation',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'codestral-embed',
        name: 'Codestral Embed',
        provider: 'Mistral',
        maxTokens: 8192,
        description: 'State-of-the-art semantic embedding for code representation',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'mistral-moderation-2411',
        name: 'Mistral Moderation',
        provider: 'Mistral',
        maxTokens: 8192,
        description: 'Moderation service for detecting harmful text content',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Open Models
      {
        id: 'magistral-small-2507',
        name: 'Magistral Small 1.1',
        provider: 'Mistral',
        maxTokens: 40000,
        description: 'Small reasoning model for efficient problem solving',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'voxtral-small-2507',
        name: 'Voxtral Small',
        provider: 'Mistral',
        maxTokens: 32768,
        description: 'First model with audio input capabilities for instruct use cases',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'voxtral-mini-2507',
        name: 'Voxtral Mini',
        provider: 'Mistral',
        maxTokens: 32768,
        description: 'Mini version of audio input model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-small-2506',
        name: 'Mistral Small 3.2',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Updated small model with improved capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'magistral-small-2506',
        name: 'Magistral Small 1',
        provider: 'Mistral',
        maxTokens: 40000,
        description: 'First small reasoning model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'devstral-small-2507',
        name: 'Devstral Small 1.1',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Open source model for software engineering agents',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-small-2503',
        name: 'Mistral Small 3.1',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'New leader in small models with image understanding',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-small-2501',
        name: 'Mistral Small 3',
        provider: 'Mistral',
        maxTokens: 32768,
        description: 'New leader in small models category',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'devstral-small-2505',
        name: 'Devstral Small 1',
        provider: 'Mistral',
        maxTokens: 128000,
        description: '24B text model for software engineering agents',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'pixtral-12b-2409',
        name: 'Pixtral 12B',
        provider: 'Mistral',
        maxTokens: 128000,
        description: '12B model with image understanding capabilities',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'open-mistral-nemo',
        name: 'Mistral Nemo 12B',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Best multilingual open source model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Latest aliases
      {
        id: 'mistral-medium-latest',
        name: 'Mistral Medium Latest',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Latest Mistral Medium model (currently Mistral Medium 3.1)',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large Latest',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Latest Mistral Large model (currently Mistral Large 2.1)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'pixtral-large-latest',
        name: 'Pixtral Large Latest',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Latest Pixtral Large model (currently Pixtral Large)',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small Latest',
        provider: 'Mistral',
        maxTokens: 128000,
        description: 'Latest Mistral Small model (currently Mistral Small 3.2)',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference models',
    apiKeyName: 'GROQ_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      {
        id: 'meta-llama/llama-4-scout-17b-16e-instruct',
        name: 'Llama 4 Scout 17B',
        provider: 'Groq',
        maxTokens: 32768,
        description: 'Advanced Llama 4 Scout model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        provider: 'Groq',
        maxTokens: 32768,
        description: 'Versatile Llama 3.3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        provider: 'Groq',
        maxTokens: 32768,
        description: 'Ultra-fast responses',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B 32768',
        provider: 'Groq',
        maxTokens: 32768,
        description: 'High-performance Mixtral model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemma2-9b-it',
        name: 'Gemma2 9B IT',
        provider: 'Groq',
        maxTokens: 32768,
        description: 'Instruction-tuned Gemma2 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    description: 'High-performance AI models',
    apiKeyName: 'FIREWORKS_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    models: [
      {
        id: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        name: 'Llama v3.3 70B Instruct',
        provider: 'Fireworks',
        maxTokens: 32768,
        description: 'High-performance Llama v3.3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/llama-v3p1-8b-instruct',
        name: 'Llama v3.1 8B Instruct',
        provider: 'Fireworks',
        maxTokens: 32768,
        description: 'Fast Llama v3.1 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/mixtral-8x7b-instruct',
        name: 'Mixtral 8x7B Instruct',
        provider: 'Fireworks',
        maxTokens: 32768,
        description: 'High-quality Mixtral model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/deepseek-r1',
        name: 'DeepSeek R1',
        provider: 'Fireworks',
        maxTokens: 32768,
        description: 'Advanced reasoning model with thinking capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    description: 'Search-enhanced AI models',
    apiKeyName: 'PERPLEXITY_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.perplexity.ai',
    models: [
      {
        id: 'llama-3.1-70b-versatile',
        name: 'Llama 3.1 70B Versatile',
        provider: 'Perplexity',
        maxTokens: 32768,
        description: 'Versatile model with search capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        provider: 'Perplexity',
        maxTokens: 32768,
        description: 'Fast model with search capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Advanced reasoning models',
    apiKeyName: 'DEEPSEEK_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'DeepSeek',
        maxTokens: 32768,
        description: 'Advanced reasoning model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        provider: 'DeepSeek',
        maxTokens: 32768,
        description: 'Specialized reasoning model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    description: 'High-performance AI models',
    apiKeyName: 'CEREBRAS_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.cerebras.ai/v1',
    models: [
      {
        id: 'llama3.1-8b',
        name: 'Llama3.1 8B',
        provider: 'Cerebras',
        maxTokens: 32768,
        description: 'Fast 8B parameter model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llama3.1-70b',
        name: 'Llama3.1 70B',
        provider: 'Cerebras',
        maxTokens: 32768,
        description: 'High-performance 70B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llama3.3-70b',
        name: 'Llama3.3 70B',
        provider: 'Cerebras',
        maxTokens: 32768,
        description: 'Latest 70B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'togetherai',
    name: 'Together.ai',
    description: 'Open source AI models',
    apiKeyName: 'TOGETHER_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.together.xyz/v1',
    models: [
      {
        id: 'meta-llama/Llama-3.1-70B-Instruct',
        name: 'Llama 3.1 70B Instruct',
        provider: 'Together.ai',
        maxTokens: 32768,
        description: 'High-performance open source model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'meta-llama/Llama-3.1-8B-Instruct',
        name: 'Llama 3.1 8B Instruct',
        provider: 'Together.ai',
        maxTokens: 32768,
        description: 'Fast open source model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'cohere',
    name: 'Cohere',
    description: 'Enterprise AI models',
    apiKeyName: 'COHERE_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.cohere.ai/v1',
    models: [
      {
        id: 'command-r-plus',
        name: 'Command R Plus',
        provider: 'Cohere',
        maxTokens: 32768,
        description: 'Enterprise-grade model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'command-r',
        name: 'Command R',
        provider: 'Cohere',
        maxTokens: 32768,
        description: 'Balanced enterprise model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'deepinfra',
    name: 'DeepInfra',
    description: 'Open source AI models',
    apiKeyName: 'DEEPINFRA_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    models: [
      {
        id: 'meta-llama/Llama-3.1-70B-Instruct',
        name: 'Llama 3.1 70B Instruct',
        provider: 'DeepInfra',
        maxTokens: 32768,
        description: 'High-performance open source model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'meta-llama/Llama-3.1-8B-Instruct',
        name: 'Llama 3.1 8B Instruct',
        provider: 'DeepInfra',
        maxTokens: 32768,
        description: 'Fast open source model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'amazon-bedrock',
    name: 'Amazon Bedrock',
    description: 'AWS managed AI models',
    apiKeyName: 'AWS_ACCESS_KEY_ID',
    requiresApiKey: true,
    baseUrl: 'https://bedrock-runtime.us-east-1.amazonaws.com',
    models: [
      {
        id: 'anthropic.claude-3-sonnet-20240229-v1:0',
        name: 'Claude 3 Sonnet',
        provider: 'Amazon Bedrock',
        maxTokens: 200000,
        description: 'AWS-hosted Claude 3 Sonnet',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'anthropic.claude-3-haiku-20240307-v1:0',
        name: 'Claude 3 Haiku',
        provider: 'Amazon Bedrock',
        maxTokens: 200000,
        description: 'AWS-hosted Claude 3 Haiku',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    description: 'Microsoft Azure OpenAI Service',
    apiKeyName: 'AZURE_OPENAI_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://your-resource.openai.azure.com',
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'Azure OpenAI',
        maxTokens: 128000,
        description: 'Azure-hosted GPT-4o',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'Azure OpenAI',
        maxTokens: 128000,
        description: 'Azure-hosted GPT-4o Mini',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  },
  {
    id: 'fireworks',
    name: 'Fireworks.ai',
    description: 'High-performance AI models for enterprise',
    apiKeyName: 'FIREWORKS_API_KEY',
    requiresApiKey: true,
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    models: [
      // Llama 3.1 シリーズ
      {
        id: 'llama-v3.1-70b-instruct',
        name: 'Llama 3.1 70B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'High-performance Llama 3.1 70B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/llama-v3.1-8b-instruct',
        name: 'Llama 3.1 8B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'Fast and efficient Llama 3.1 8B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Llama 3.0 シリーズ
      {
        id: 'accounts/fireworks/models/llama-v3-70b-instruct',
        name: 'Llama 3.0 70B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 8192,
        description: 'Llama 3.0 70B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/llama-v3-8b-instruct',
        name: 'Llama 3.0 8B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 8192,
        description: 'Llama 3.0 8B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Code Llama シリーズ
      {
        id: 'accounts/fireworks/models/codellama-70b-instruct',
        name: 'Code Llama 70B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 100000,
        description: 'Specialized for code generation and analysis',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/codellama-34b-instruct',
        name: 'Code Llama 34B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 100000,
        description: 'Balanced code generation model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/codellama-13b-instruct',
        name: 'Code Llama 13B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 100000,
        description: 'Fast code generation model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/codellama-7b-instruct',
        name: 'Code Llama 7B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 100000,
        description: 'Ultra-fast code generation model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Mistral シリーズ
      {
        id: 'accounts/fireworks/models/mistral-7b-instruct',
        name: 'Mistral 7B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'High-quality instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/mixtral-8x7b-instruct',
        name: 'Mixtral 8x7B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'High-performance mixture of experts model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Gemma シリーズ
      {
        id: 'accounts/fireworks/models/gemma-2-27b-it',
        name: 'Gemma 2 27B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 8192,
        description: 'Google\'s Gemma 2 27B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/gemma-2-9b-it',
        name: 'Gemma 2 9B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 8192,
        description: 'Google\'s Gemma 2 9B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/gemma-2-2b-it',
        name: 'Gemma 2 2B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 8192,
        description: 'Google\'s Gemma 2 2B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Phi シリーズ
      {
        id: 'accounts/fireworks/models/phi-3.5-14b-instruct',
        name: 'Phi 3.5 14B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 16384,
        description: 'Microsoft\'s Phi 3.5 14B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/phi-3.5-4b-instruct',
        name: 'Phi 3.5 4B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 16384,
        description: 'Microsoft\'s Phi 3.5 4B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Qwen シリーズ
      {
        id: 'accounts/fireworks/models/qwen2.5-72b-instruct',
        name: 'Qwen 2.5 72B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'Alibaba\'s Qwen 2.5 72B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/qwen2.5-32b-instruct',
        name: 'Qwen 2.5 32B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'Alibaba\'s Qwen 2.5 32B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/qwen2.5-14b-instruct',
        name: 'Qwen 2.5 14B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'Alibaba\'s Qwen 2.5 14B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/qwen2.5-7b-instruct',
        name: 'Qwen 2.5 7B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'Alibaba\'s Qwen 2.5 7B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/qwen2.5-4b-instruct',
        name: 'Qwen 2.5 4B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'Alibaba\'s Qwen 2.5 4B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/qwen2.5-1.5b-instruct',
        name: 'Qwen 2.5 1.5B Instruct',
        provider: 'Fireworks.ai',
        maxTokens: 32768,
        description: 'Alibaba\'s Qwen 2.5 1.5B instruction-tuned model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Yi シリーズ
      {
        id: 'accounts/fireworks/models/yi-1.5-34b-chat',
        name: 'Yi 1.5 34B Chat',
        provider: 'Fireworks.ai',
        maxTokens: 4096,
        description: '01.AI\'s Yi 1.5 34B chat model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/yi-1.5-9b-chat',
        name: 'Yi 1.5 9B Chat',
        provider: 'Fireworks.ai',
        maxTokens: 4096,
        description: '01.AI\'s Yi 1.5 9B chat model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'accounts/fireworks/models/yi-1.5-6b-chat',
        name: 'Yi 1.5 6B Chat',
        provider: 'Fireworks.ai',
        maxTokens: 4096,
        description: '01.AI\'s Yi 1.5 6B chat model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // 埋め込みモデル
      {
        id: 'accounts/fireworks/models/text-embedding-ada-002',
        name: 'Text Embedding Ada 002',
        provider: 'Fireworks.ai',
        maxTokens: 8191,
        description: 'OpenAI-compatible text embedding model',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      }
    ]
  },
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Local AI models for text generation, vision, and coding',
    apiKeyName: '',
    requiresApiKey: false,
    baseUrl: 'http://localhost:11434',
    models: [
      // GPT-OSS シリーズ
      {
        id: 'gpt-oss:20b',
        name: 'GPT-OSS 20B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'OpenAI\'s open-weight model for powerful reasoning and agentic tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gpt-oss:120b',
        name: 'GPT-OSS 120B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'OpenAI\'s large open-weight model for complex reasoning',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // DeepSeek シリーズ
      {
        id: 'deepseek-r1:1.5b',
        name: 'DeepSeek-R1 1.5B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Open reasoning model with performance approaching leading models',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'deepseek-r1:7b',
        name: 'DeepSeek-R1 7B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Balanced reasoning model for various tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'deepseek-r1:32b',
        name: 'DeepSeek-R1 32B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'High-performance reasoning model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'deepseek-r1:70b',
        name: 'DeepSeek-R1 70B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Large reasoning model for complex tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Gemma 3 シリーズ
      {
        id: 'gemma3:270m',
        name: 'Gemma 3 270M',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Ultra-compact model that runs on a single GPU',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemma3:1b',
        name: 'Gemma 3 1B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Compact model for efficient inference',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemma3:4b',
        name: 'Gemma 3 4B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Balanced model for general use',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemma3:12b',
        name: 'Gemma 3 12B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'High-performance model for complex tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemma3:27b',
        name: 'Gemma 3 27B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Most capable Gemma 3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Qwen 3 シリーズ
      {
        id: 'qwen3:0.6b',
        name: 'Qwen 3 0.6B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Ultra-compact Qwen 3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen3:1.7b',
        name: 'Qwen 3 1.7B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Compact Qwen 3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen3:4b',
        name: 'Qwen 3 4B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Balanced Qwen 3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen3:8b',
        name: 'Qwen 3 8B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'High-performance Qwen 3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen3:14b',
        name: 'Qwen 3 14B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Large Qwen 3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen3:30b',
        name: 'Qwen 3 30B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Very large Qwen 3 model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen3:32b',
        name: 'Qwen 3 32B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Large Qwen 3 model with enhanced capabilities',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen3:235b',
        name: 'Qwen 3 235B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Massive Qwen 3 model for complex reasoning',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Llama 3.1 シリーズ
      {
        id: 'llama3.1:8b',
        name: 'Llama 3.1 8B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Meta\'s latest 8B model with state-of-the-art performance',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llama3.1:70b',
        name: 'Llama 3.1 70B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Meta\'s latest 70B model for complex tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llama3.1:405b',
        name: 'Llama 3.1 405B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Meta\'s massive 405B model for advanced reasoning',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Llama 3.2 シリーズ
      {
        id: 'llama3.2:1b',
        name: 'Llama 3.2 1B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Meta\'s compact 1B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llama3.2:3b',
        name: 'Llama 3.2 3B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Meta\'s efficient 3B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Llama 3.2 Vision シリーズ
      {
        id: 'llama3.2-vision:11b',
        name: 'Llama 3.2 Vision 11B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Meta\'s vision-capable 11B model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llama3.2-vision:90b',
        name: 'Llama 3.2 Vision 90B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Meta\'s large vision-capable 90B model',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Llama 3.3 シリーズ
      {
        id: 'llama3.3:70b',
        name: 'Llama 3.3 70B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'New state-of-the-art 70B model with performance similar to Llama 3.1 405B',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // 埋め込みモデル
      {
        id: 'nomic-embed-text',
        name: 'Nomic Embed Text',
        provider: 'Ollama',
        maxTokens: 8192,
        description: 'High-performing open embedding model with large token context window',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'mxbai-embed-large',
        name: 'MXBAI Embed Large',
        provider: 'Ollama',
        maxTokens: 8192,
        description: 'State-of-the-art large embedding model from mixedbread.ai',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      {
        id: 'bge-m3',
        name: 'BGE-M3',
        provider: 'Ollama',
        maxTokens: 8192,
        description: 'Versatile embedding model for Multi-Functionality, Multi-Linguality, and Multi-Granularity',
        capabilities: {
          imageInput: false,
          objectGeneration: false,
          toolUsage: false,
          toolStreaming: false
        }
      },
      // ビジョンモデル
      {
        id: 'llava:7b',
        name: 'LLaVA 7B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'End-to-end trained large multimodal model for visual and language understanding',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llava:13b',
        name: 'LLaVA 13B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Large multimodal model for visual and language understanding',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'llava:34b',
        name: 'LLaVA 34B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Very large multimodal model for advanced visual understanding',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'minicpm-v:8b',
        name: 'MiniCPM-V 8B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Multimodal LLM designed for vision-language understanding',
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Phi シリーズ
      {
        id: 'phi3:3.8b',
        name: 'Phi-3 3.8B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Microsoft\'s lightweight 3.8B state-of-the-art model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'phi3:14b',
        name: 'Phi-3 14B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Microsoft\'s 14B state-of-the-art model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'phi4:14b',
        name: 'Phi-4 14B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Microsoft\'s 14B parameter state-of-the-art model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Gemma 2 シリーズ
      {
        id: 'gemma2:2b',
        name: 'Gemma 2 2B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Google\'s high-performing and efficient 2B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemma2:9b',
        name: 'Gemma 2 9B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Google\'s balanced 9B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'gemma2:27b',
        name: 'Gemma 2 27B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Google\'s high-performance 27B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Qwen 2.5 シリーズ
      {
        id: 'qwen2.5:0.5b',
        name: 'Qwen 2.5 0.5B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Alibaba\'s compact 0.5B model with 128K context',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5:1.5b',
        name: 'Qwen 2.5 1.5B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Alibaba\'s efficient 1.5B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5:3b',
        name: 'Qwen 2.5 3B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Alibaba\'s balanced 3B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5:7b',
        name: 'Qwen 2.5 7B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Alibaba\'s high-performance 7B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5:14b',
        name: 'Qwen 2.5 14B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Alibaba\'s large 14B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5:32b',
        name: 'Qwen 2.5 32B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Alibaba\'s very large 32B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5:72b',
        name: 'Qwen 2.5 72B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Alibaba\'s massive 72B model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // Qwen 2.5 Coder シリーズ
      {
        id: 'qwen2.5-coder:0.5b',
        name: 'Qwen 2.5 Coder 0.5B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Code-specific Qwen model for code generation and reasoning',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5-coder:1.5b',
        name: 'Qwen 2.5 Coder 1.5B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Code-specific Qwen model for efficient coding',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5-coder:3b',
        name: 'Qwen 2.5 Coder 3B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Code-specific Qwen model for balanced coding tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5-coder:7b',
        name: 'Qwen 2.5 Coder 7B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Code-specific Qwen model for high-performance coding',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5-coder:14b',
        name: 'Qwen 2.5 Coder 14B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Code-specific Qwen model for complex coding tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwen2.5-coder:32b',
        name: 'Qwen 2.5 Coder 32B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Code-specific Qwen model for advanced coding tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      // その他の人気モデル
      {
        id: 'codellama:7b',
        name: 'Code Llama 7B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Large language model specialized for code generation',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'codellama:13b',
        name: 'Code Llama 13B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Balanced code generation model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'codellama:34b',
        name: 'Code Llama 34B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'High-performance code generation model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'codellama:70b',
        name: 'Code Llama 70B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Most capable code generation model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'dolphin3:8b',
        name: 'Dolphin 3.0 8B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Ultimate general purpose local model for coding, math, and agentic tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-nemo:12b',
        name: 'Mistral Nemo 12B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'State-of-the-art 12B model with 128k context length',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'olmo2:7b',
        name: 'OLMo 2 7B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: '7B model trained on up to 5T tokens with competitive performance',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'olmo2:13b',
        name: 'OLMo 2 13B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: '13B model trained on up to 5T tokens',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'deepseek-v3:671b',
        name: 'DeepSeek V3 671B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Strong Mixture-of-Experts model with 671B total parameters',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'qwq:32b',
        name: 'QwQ 32B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Reasoning model of the Qwen series',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-small:22b',
        name: 'Mistral Small 22B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'New benchmark in small Large Language Models category',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'mistral-small:24b',
        name: 'Mistral Small 24B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'High-performance small model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'smollm2:135m',
        name: 'SmolLM2 135M',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Ultra-compact 135M parameter model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'smollm2:360m',
        name: 'SmolLM2 360M',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Compact 360M parameter model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'smollm2:1.7b',
        name: 'SmolLM2 1.7B',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Balanced 1.7B parameter model',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      },
      {
        id: 'codestral',
        name: 'Codestral',
        provider: 'Ollama',
        maxTokens: 32768,
        description: 'Specialized for coding tasks',
        capabilities: {
          imageInput: false,
          objectGeneration: true,
          toolUsage: true,
          toolStreaming: true
        }
      }
    ]
  }
]
