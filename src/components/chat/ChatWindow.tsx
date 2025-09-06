import React, { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChatMessage, ChatMessageProps } from './ChatMessage'
import { PromptInputBox } from './PromptInputBox'

import { EnhancedFilePreview } from './EnhancedFilePreview'
import { ArmisSettings } from '@/components/settings/ArmisSettings'
import { createTTSManager } from '@/services/tts'
import { AISDKService } from '@/services/llm/ai-sdk-service'
import { GeminiFileService } from '@/services/llm/gemini-file-service'
import { AIProviderConfig, ModelSettings, AVAILABLE_PROVIDERS } from '@/types/ai-sdk'
import { cn } from '@/lib/utils'
import { FactCheckingService, FactCheckResult } from '@/services/llm/fact-checking-service'
import { 
  Settings, 
  Brain, 
  X, 
  Paperclip,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  AlertCircle,
  Wrench,
  Bot,
  Zap,
  Terminal as TerminalIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { ShimmerText } from '@/components/ui/shimmer-text'
import { SequentialThinkingPanel } from './SequentialThinkingPanel'
import { SequentialThinkingPlan } from '@/types/llm'
import { LLMManager } from '@/services/llm/llm-manager'
import { InputAnalyzer, InputAnalysis } from '@/services/agent/input-analyzer'
import { AgentType } from '@/types/llm'
import { AgentInfoDisplay } from './AgentInfoDisplay'
import { browserWebSearchService, WebSearchResult } from '@/services/web-search/browser-web-search'
import { webSearchManager } from '@/services/web-search/web-search-manager'
import { EmbeddedCLI } from './EmbeddedCLI'
import { TaskShimmerDisplay } from '@/components/ui/task-shimmer-display'
import { useTaskExecution } from '@/hooks/useTaskExecution'
import { FileCreationLoader } from '@/components/ui/file-creation-loader'
import { useFileCreation } from '@/hooks/useFileCreation'
import { ModelDownloadShimmer } from '@/components/ui/model-download-shimmer'
import { GeminiImageService } from '@/services/llm/gemini-image-service'
import { checkGoogleAIConfig, logConfigStatus } from '@/utils/env-checker'
import { VeoService } from '@/services/video/veo-service'

import { useTheme } from '@/components/theme-provider'
import { STTSettingsService } from '@/services/stt/stt-settings-service'

interface ChatWindowProps {
  className?: string
  useEnhancedPreview?: boolean // 拡張プレビューを使用するかどうか
}

// AI Elements helper functions
const createAIElementsMessage = (
  content: string,
  sources?: Array<{ id: string; href: string; title?: string; description?: string }>,
  tasks?: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'error';
    items?: Array<{
      id: string;
      text: string;
      status: 'pending' | 'in_progress' | 'completed' | 'error';
      file?: { name: string; icon?: React.ReactNode };
    }>;
  }>,
  citations?: Array<{
    id: string;
    text: string;
    sources: Array<{
      id: string;
      url: string;
      title?: string;
      description?: string;
      quote?: string;
    }>;
  }>,
  tools?: Array<{
    id: string;
    type: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
    input: any;
    output?: any;
    errorText?: string;
  }>,
  webPreviews?: Array<{
    id: string;
    url: string;
    title?: string;
    consoleLogs?: Array<{ level: 'log' | 'warn' | 'error'; message: string; timestamp: Date }>;
  }>
): ChatMessageProps => ({
  id: Date.now().toString(),
  content,
  role: 'assistant',
  useAIElements: true,
  sources,
  tasks,
  citations,
  tools,
  webPreviews,
  isStreaming: false
})

// Sample AI Elements messages for demonstration
const sampleAIElementsMessages: ChatMessageProps[] = [
  createAIElementsMessage(
    `# AI SDK Response Component

This is a **markdown** response that demonstrates various features:

## Features

- **Bold text** and *italic text*
- \`inline code\` and code blocks
- Lists and numbered lists
- Links and images
- Math equations
- Tables

### Code Example

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### Math Equation

Inline math: $E = mc^2$

Block math:
$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

### Table Example

| Feature | Support | Description |
|---------|---------|-------------|
| Markdown | ✅ | Full markdown support |
| Code Highlighting | ✅ | Syntax highlighting |
| Math Equations | ✅ | KaTeX integration |
| Copy Button | ✅ | One-click code copying |

### Task List

- [x] Implement basic markdown rendering
- [x] Add code syntax highlighting
- [x] Integrate math equation support
- [ ] Add custom components support
- [ ] Implement streaming support

Visit [AI SDK Documentation](https://ai-sdk.dev) for more information.

> This is a blockquote that demonstrates the styling of quoted text.`,
    [
      {
        id: '1',
        href: 'https://ai-sdk.dev/elements/components/response',
        title: 'AI SDK Response Component',
        description: 'Official documentation for the Response component'
      },
      {
        id: '2',
        href: 'https://vercel.com/ai',
        title: 'Vercel AI',
        description: 'Build AI applications with Vercel'
      },
      {
        id: '3',
        href: 'https://radix-ui.com/primitives/docs/components/collapsible',
        title: 'Radix UI Collapsible',
        description: 'Unstyled, accessible collapsible component'
      }
    ],
    [
      {
        id: '1',
        title: 'Project Setup',
        status: 'completed',
        items: [
          { id: '1-1', text: 'Initialize project with npm', status: 'completed' },
          { id: '1-2', text: 'Install dependencies', status: 'completed' },
          { id: '1-3', text: 'Configure build tools', status: 'completed' }
        ]
      },
      {
        id: '2',
        title: 'Component Development',
        status: 'in_progress',
        items: [
          { id: '2-1', text: 'Create component structure', status: 'completed' },
          { id: '2-2', text: 'Implement core functionality', status: 'in_progress' },
          { id: '2-3', text: 'Add styling and animations', status: 'pending' },
          { id: '2-4', text: 'Write unit tests', status: 'pending' }
        ]
      },
      {
        id: '3',
        title: 'Documentation',
        status: 'pending',
        items: [
          { id: '3-1', text: 'Write API documentation', status: 'pending' },
          { id: '3-2', text: 'Create usage examples', status: 'pending' }
        ]
      }
    ]
  )
]

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  className,
  useEnhancedPreview = true // デフォルトで拡張プレビューを使用
}) => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [streamingResponse, setStreamingResponse] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showSequentialThinking, setShowSequentialThinking] = useState(false)
  const [sequentialThinkingPlan, setSequentialThinkingPlan] = useState<SequentialThinkingPlan | null>(null)
  const [showAgentInfo, setShowAgentInfo] = useState(false)
  const [agentType, setAgentType] = useState<AgentType>('general')
  const [showEmbeddedCLI, setShowEmbeddedCLI] = useState(false)
  const [isWebSearching, setIsWebSearching] = useState(false)
  const [webSearchResults, setWebSearchResults] = useState<WebSearchResult[]>([])
  const [isVideoGenerating, setIsVideoGenerating] = useState(false)
  const [videoGenerationProgress, setVideoGenerationProgress] = useState(0)
  const [isImageGenerating, setIsImageGenerating] = useState(false)
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0)
  const [isAudioGenerating, setIsAudioGenerating] = useState(false)
  const [audioGenerationProgress, setAudioGenerationProgress] = useState(0)
  const [isSTTTranscribing, setIsSTTTranscribing] = useState(false)
  const [sttFileName, setSttFileName] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  
  // Theme management
  const { theme, setTheme } = useTheme()
  
  // isGeneratingの状態変更をログ出力
  useEffect(() => {
    console.log('🔄 ChatWindow isGenerating changed:', isGenerating)
  }, [isGenerating])
  const [isTTSProcessing, setIsTTSProcessing] = useState(false) // TTS処理中状態
  
  // モデルダウンロード状態
  const [modelDownloadState, setModelDownloadState] = useState<{
    isDownloading: boolean;
    modelName: string;
    progress: number;
    status: 'starting' | 'downloading' | 'verifying' | 'completed' | 'error';
    downloadedBytes?: number;
    totalBytes?: number;
  }>({
    isDownloading: false,
    modelName: '',
    progress: 0,
    status: 'starting',
    downloadedBytes: undefined,
    totalBytes: undefined
  })

  // ダウンロード状態のデバッグ用ログ
  useEffect(() => {
    console.log('🔄 modelDownloadState changed:', modelDownloadState)
  }, [modelDownloadState])

  const [currentPlan, setCurrentPlan] = useState<SequentialThinkingPlan | null>(null)
  const [currentProviderConfig, setCurrentProviderConfig] = useState<AIProviderConfig | null>(null)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  
  // Fact checking settings state
  const [factCheckingSettings, setFactCheckingSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('armis_fact_checking_settings')
      return saved ? JSON.parse(saved) : {
        enabled: false,
        model: 'ollama',
        temperature: 0.1,
        maxTokens: 1000,
        includeSources: true,
        strictMode: false,
        autoCheck: false,
        checkThreshold: 0.7
      }
    } catch (error) {
      console.error('Failed to load fact checking settings from localStorage:', error)
      return {
        enabled: false,
        model: 'ollama',
        temperature: 0.1,
        maxTokens: 1000,
        includeSources: true,
        strictMode: false,
        autoCheck: false,
        checkThreshold: 0.7
      }
    }
  })

  // Generation settings state
  const [generationSettings, setGenerationSettings] = useState(() => {
    // ローカルストレージから設定を読み込み
    try {
      const saved = localStorage.getItem('armis_generation_settings')
      return saved ? JSON.parse(saved) : {
        image: {
          enabled: false, // 画像生成機能を無効化
          provider: 'google',
          models: {
            'gemini-2.0-flash-preview-image-generation': { enabled: false, priority: 1 },
            'imagen-3.0-generate-002': { enabled: false, priority: 2 },
            'imagen-3.0-generate-001': { enabled: false, priority: 3 },
            'imagen-3.0-fast-generate-001': { enabled: false, priority: 4 },
            'imagen-4.0-generate-001': { enabled: false, priority: 5 },
            'imagen-4.0-fast-generate-001': { enabled: false, priority: 6 },
            'imagen-4.0-ultra-generate-001': { enabled: false, priority: 7 }
          }
        },
        audio: {
          enabled: false,
          provider: 'google',
          models: {
            'gemini-2.5-flash-preview-tts': { enabled: false, priority: 1 },
            'gemini-2.5-pro-preview-tts': { enabled: false, priority: 2 }
          },
          tts: {
            defaultVoice: 'Kore',
            defaultLanguage: 'ja-JP',
            defaultStyle: '',
            apiKey: ''
          }
        },
        video: {
          enabled: false,
          provider: 'openai',
          models: {}
        },
        code: {
          enabled: false,
          provider: 'openai',
          models: {}
        }
      }
    } catch (error) {
      console.error('Failed to load generation settings from localStorage:', error)
      return {
        image: {
          enabled: false, // 画像生成機能を無効化
          provider: 'google',
          models: {
            'gemini-2.0-flash-preview-image-generation': { enabled: false, priority: 1 },
            'imagen-3.0-generate-002': { enabled: false, priority: 2 },
            'imagen-3.0-generate-001': { enabled: false, priority: 3 },
            'imagen-3.0-fast-generate-001': { enabled: false, priority: 4 },
            'imagen-4.0-generate-001': { enabled: false, priority: 5 },
            'imagen-4.0-fast-generate-001': { enabled: false, priority: 6 },
            'imagen-4.0-ultra-generate-001': { enabled: false, priority: 7 }
          }
        },
        audio: {
          enabled: false,
          provider: 'google',
          models: {
            'gemini-2.5-flash-preview-tts': { enabled: false, priority: 1 },
            'gemini-2.5-pro-preview-tts': { enabled: false, priority: 2 }
          },
          tts: {
            defaultVoice: 'Kore',
            defaultLanguage: 'ja-JP',
            defaultStyle: '',
            apiKey: ''
          }
        },
        video: {
          enabled: false,
          provider: 'openai',
          models: {}
        },
        code: {
          enabled: false,
          provider: 'openai',
          models: {}
        }
      }
    }
  })
  
  const [createImageEnabled, setCreateImageEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [currentTTSModel, setCurrentTTSModel] = useState<string>(() => {
    // ローカルストレージからTTSモデル設定を読み込み
    try {
      const saved = localStorage.getItem('armis_tts_model')
      return saved || 'auto'
    } catch (error) {
      console.error('Failed to load TTS model from localStorage:', error)
      return 'auto'
    }
  })

  const [currentSTTModel, setCurrentSTTModel] = useState<string>(() => {
    // ローカルストレージからSTTモデル設定を読み込み
    try {
      const saved = localStorage.getItem('armis_stt_model')
      return saved || 'auto'
    } catch (error) {
      console.error('Failed to load STT model from localStorage:', error)
      return 'auto'
    }
  })

  // TTSモデル設定を設定画面のAudio設定と同期
  useEffect(() => {
    if (generationSettings.audio.enabled && generationSettings.audio.models) {
      // 有効なTTSモデルを優先度順にソート
      const enabledTTSModels = Object.entries(generationSettings.audio.models)
        .filter(([_, config]: [string, any]) => config.enabled)
        .sort(([_, a]: [string, any], [__, b]: [string, any]) => (a.priority || 999) - (b.priority || 999))
      
      // 現在選択されているTTSモデルが有効でない場合、最高優先度のモデルに設定
      if (currentTTSModel !== 'auto' && !enabledTTSModels.find(([model, _]) => model === currentTTSModel)) {
        const defaultModel = enabledTTSModels.length > 0 ? enabledTTSModels[0][0] : 'auto'
        setCurrentTTSModel(defaultModel)
        localStorage.setItem('armis_tts_model', defaultModel)
        console.log('TTS model synchronized with settings:', defaultModel)
      }
    }
  }, [generationSettings.audio.enabled, generationSettings.audio.models, currentTTSModel])

  // STT設定サービス
  const [sttSettingsService] = useState(() => STTSettingsService.getInstance())
  
  // Create Imageボタンの状態をGeneration設定と同期
  useEffect(() => {
    // 初期化時は必ずfalseに設定
    if (generationSettings.image.enabled === false) {
      setCreateImageEnabled(false)
      console.log('Create Image enabled: false (initialized)')
    } else {
      setCreateImageEnabled(generationSettings.image.enabled)
      console.log('Create Image enabled:', generationSettings.image.enabled)
    }
  }, [generationSettings.image.enabled])

  // Audioボタンの状態をGeneration設定と同期
  useEffect(() => {
    // 初期化時は必ずfalseに設定
    if (generationSettings.audio.enabled === false) {
      setAudioEnabled(false)
      console.log('Audio enabled: false (initialized)')
    } else {
      setAudioEnabled(generationSettings.audio.enabled)
      console.log('Audio enabled:', generationSettings.audio.enabled)
    }
  }, [generationSettings.audio.enabled])

  // Videoボタンの状態をGeneration設定と同期
  useEffect(() => {
    // 初期化時は必ずfalseに設定
    if (generationSettings.video.enabled === false) {
      setVideoEnabled(false)
      console.log('Video enabled: false (initialized)')
    } else {
      setVideoEnabled(generationSettings.video.enabled)
      console.log('Video enabled:', generationSettings.video.enabled)
    }
  }, [generationSettings.video.enabled])

  // 初期化時にCreateImage、Audio、Videoを確実にfalseに設定
  useEffect(() => {
    setCreateImageEnabled(false)
    setAudioEnabled(false)
    setVideoEnabled(false)
    console.log('Initialized CreateImage, Audio, and Video to false')
  }, [])

  // Generation設定の永続化
  useEffect(() => {
    localStorage.setItem('armis_generation_settings', JSON.stringify(generationSettings))
    console.log('🎛️ Generation settings updated:', {
      audioProvider: generationSettings.audio.provider,
      audioEnabled: generationSettings.audio.enabled,
      audioModels: generationSettings.audio.models,
      videoProvider: generationSettings.video.provider,
      videoEnabled: generationSettings.video.enabled
    })
  }, [generationSettings])

  // ファクトチェック設定の永続化
  useEffect(() => {
    localStorage.setItem('armis_fact_checking_settings', JSON.stringify(factCheckingSettings))
    console.log('🔍 Fact checking settings updated:', {
      enabled: factCheckingSettings.enabled,
      model: factCheckingSettings.model,
      autoCheck: factCheckingSettings.autoCheck
    })
  }, [factCheckingSettings])

  // 初回起動時にlocalStorageをクリアして新しい設定で初期化
  useEffect(() => {
    // 強制的にlocalStorageをクリアして新しい設定で初期化
    localStorage.removeItem('armis_generation_settings')
    localStorage.setItem('armis_first_run', 'true')
    console.log('Generation settings reset to default (false)')
    
    // 強制的に設定をリセット（開発用）
    const forceReset = localStorage.getItem('armis_force_reset_generation')
    if (forceReset === 'true') {
      localStorage.removeItem('armis_generation_settings')
      localStorage.removeItem('armis_force_reset_generation')
      console.log('Force reset generation settings')
    }
  }, [])
  
  // ローディング状態管理
  const [loadingState, setLoadingState] = useState<'idle' | 'text' | 'media'>('idle')
  const [modelSettings, setModelSettings] = useState<ModelSettings>(() => {
    // localStorageからモデル設定を読み込み
    try {
      const saved = localStorage.getItem('armis_model_settings')
      return saved ? JSON.parse(saved) : {
        enabledModels: [
          { providerId: 'openai', modelId: 'gpt-4o', enabled: true, priority: 1 },
          { providerId: 'anthropic', modelId: 'claude-opus-4.1', enabled: true, priority: 3 },
          { providerId: 'google', modelId: 'gemini-2.5-flash-lite', enabled: true, priority: 4 },
          { providerId: 'ollama', modelId: 'gemma3:1b', enabled: true, priority: 2 }
        ],
        defaultModel: 'ollama:gemma3:1b',
        autoSwitch: true
      }
    } catch (error) {
      console.error('Failed to load model settings from localStorage:', error)
      return {
        enabledModels: [
          { providerId: 'openai', modelId: 'gpt-4o', enabled: true, priority: 1 },
          { providerId: 'anthropic', modelId: 'claude-opus-4.1', enabled: true, priority: 3 },
          { providerId: 'google', modelId: 'gemini-2.5-flash-lite', enabled: true, priority: 4 },
          { providerId: 'ollama', modelId: 'gemma3:1b', enabled: true, priority: 2 }
        ],
        defaultModel: 'ollama:gemma3:1b',
        autoSwitch: true
      }
    }
  })
  
  // プロバイダーごとのAPI Key管理
  const [providerApiKeys, setProviderApiKeys] = useState<Record<string, string>>(() => {
    // localStorageからAPIキーを読み込み
    try {
      const saved = localStorage.getItem('armis_provider_api_keys')
      const apiKeys = saved ? JSON.parse(saved) : {}
      
      // Web Search ManagerにAPIキーを設定
      webSearchManager.setProviderApiKeys(apiKeys)
      
      return apiKeys
    } catch (error) {
      console.error('Failed to load API keys from localStorage:', error)
      return {}
    }
  })
  const [aiSDKService] = useState(() => new AISDKService())
  const [geminiFileService] = useState(() => new GeminiFileService())

  // Router Agent System関連の状態
  const [llmManager, setLlmManager] = useState<LLMManager | null>(null)
  const [inputAnalyzer] = useState(() => new InputAnalyzer())
  const [currentAnalysis, setCurrentAnalysis] = useState<InputAnalysis | null>(null)
  const [agentInfo, setAgentInfo] = useState<{
    type: AgentType | null
    confidence: number
    reasoning: string
  } | null>(null)

  // モデルダウンロード関連の状態
  const [downloadProgress, setDownloadProgress] = useState<any>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // CLI関連の状態
  const [showCLI, setShowCLI] = useState(false)
  const [isCLIMinimized, setIsCLIMinimized] = useState(false)
  
  // CLIフォント設定の状態
  const [cliFontSettings, setCliFontSettings] = useState(() => {
    // localStorageからフォント設定を読み込み
    try {
      const saved = localStorage.getItem('armis_cli_font_settings')
      return saved ? JSON.parse(saved) : {
        fontFamily: 'Cascadia Code',
        fontSize: 12,
        fontLigatures: true
      }
    } catch (error) {
      console.error('Failed to load CLI font settings from localStorage:', error)
      return {
        fontFamily: 'Cascadia Code',
        fontSize: 12,
        fontLigatures: true
      }
    }
  })

  // APIキーをlocalStorageに保存する関数
  const saveApiKeysToStorage = (apiKeys: Record<string, string>) => {
    try {
      localStorage.setItem('armis_provider_api_keys', JSON.stringify(apiKeys))
    } catch (error) {
      console.error('Failed to save API keys to localStorage:', error)
    }
  }

  // CLIフォント設定をlocalStorageに保存する関数
  const saveCliFontSettingsToStorage = (settings: { fontFamily: string; fontSize: number; fontLigatures: boolean }) => {
    try {
      localStorage.setItem('armis_cli_font_settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save CLI font settings to localStorage:', error)
    }
  }

  // モデル設定をlocalStorageに保存する関数
  const saveModelSettingsToStorage = (settings: ModelSettings) => {
    try {
      localStorage.setItem('armis_model_settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save model settings to localStorage:', error)
    }
  }

  // APIキー更新時のハンドラー
  const handleProviderApiKeysChange = (newApiKeys: Record<string, string>) => {
    setProviderApiKeys(newApiKeys)
    saveApiKeysToStorage(newApiKeys)
    
    // Web Search ManagerにAPIキーを設定
    webSearchManager.setProviderApiKeys(newApiKeys)
  }

  // CLIフォント設定更新時のハンドラー
  const handleCliFontSettingsChange = (settings: { fontFamily: string; fontSize: number; fontLigatures: boolean }) => {
    setCliFontSettings(settings)
    saveCliFontSettingsToStorage(settings)
  }

  // モデル設定更新時のハンドラー
  const handleModelSettingsChange = (settings: ModelSettings) => {
    setModelSettings(settings)
    saveModelSettingsToStorage(settings)
  }

  // ファクトチェック設定をlocalStorageに保存する関数
  const saveFactCheckingSettingsToStorage = (settings: any) => {
    try {
      localStorage.setItem('armis_fact_checking_settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save fact checking settings to localStorage:', error)
    }
  }

  // ファクトチェック設定更新時のハンドラー
  const handleFactCheckingSettingsChange = (settings: any) => {
    setFactCheckingSettings(settings)
    saveFactCheckingSettingsToStorage(settings)
  }

  // ファクトチェック実行関数
  const performFactCheck = async (text: string): Promise<FactCheckResult | null> => {
    if (!factCheckingSettings.enabled) {
      return null
    }

    try {
      // 現在選択されているモデルに基づいてファクトチェックモデルを決定
      let factCheckModel = factCheckingSettings.model as any
      let ollamaModel = 'gemma3:1b'
      let ollamaBaseUrl = 'http://localhost:11434'

      // 現在のモデル設定を確認
      if (currentSelectedModel) {
        if (currentSelectedModel.startsWith('ollama:')) {
          factCheckModel = 'ollama'
          ollamaModel = currentSelectedModel.replace('ollama:', '')
        } else if (currentSelectedModel.startsWith('llama-cpp:')) {
          factCheckModel = 'ollama'
          ollamaModel = currentSelectedModel.replace('llama-cpp:', '')
        }
      }

      const factChecker = new FactCheckingService({
        model: factCheckModel,
        temperature: factCheckingSettings.temperature,
        maxTokens: factCheckingSettings.maxTokens,
        includeSources: factCheckingSettings.includeSources,
        strictMode: factCheckingSettings.strictMode,
        ollamaModel: ollamaModel,
        ollamaBaseUrl: ollamaBaseUrl
      })

      const result = await factChecker.checkFacts(text)
      return result
    } catch (error) {
      console.error('Fact checking failed:', error)
      return null
    }
  }

  // ハルシネーション検出実行関数
  const detectHallucinations = async (text: string): Promise<any | null> => {
    if (!factCheckingSettings.enabled) {
      return null
    }

    try {
      const factChecker = new FactCheckingService({
        model: factCheckingSettings.model as any,
        temperature: factCheckingSettings.temperature,
        maxTokens: factCheckingSettings.maxTokens,
        includeSources: factCheckingSettings.includeSources,
        strictMode: factCheckingSettings.strictMode
      })

      const result = await factChecker.detectHallucinations(text)
      return result
    } catch (error) {
      console.error('Hallucination detection failed:', error)
      return null
    }
  }
  const [lastError, setLastError] = useState<string | null>(null)

  // タスク実行管理
  const {
    activeTasks,
    addTask,
    updateTask,
    removeTask,
    clearCompletedTasks,
    getTask,
    isTaskActive
  } = useTaskExecution()

  // ファイル作成管理
  const {
    activeFileCreations,
    addFileCreation,
    updateFileCreation,
    removeFileCreation,
    clearCompletedFileCreations,
    getFileCreation,
    isFileCreationActive
  } = useFileCreation()

  // LLM Manager初期化
  useEffect(() => {
    const initializeLLMManager = async () => {
      try {
        // 環境変数の設定状況をログ出力
        logConfigStatus()
        
        // 既に初期化済みの場合は早期リターン
        if (llmManager) {
          return
        }
        
        const config: any = { // LLMManagerの型定義を修正
          useOllama: true,
          useLlamaCpp: false,
          defaultModel: 'gemma3:1b',
          vectorDBConfig: {
            type: 'in-memory'
          }
        }
        
        const manager = new LLMManager(config)
        
        // 初期化時にOllamaを優先的に使用し、gemma3:1bを自動ダウンロード
        try {
          await manager.initialize()
          
          // Ollamaが利用可能な場合は、gemma3:1bが利用可能かチェック
          if (manager.isUsingOllama()) {
            const models = await manager.listOllamaModels()
            const gemmaExists = models.some(m => m.name === 'gemma3:1b')
            
            if (!gemmaExists) {
              await manager.pullOllamaModelWithProgress(
                'gemma3:1b',
                (progress) => {
                  // プログレスログを非表示
                }
              )
            }
          }
        } catch (error) {
          console.warn('⚠️ Ollama initialization failed, using fallback:', error)
        }
        
        setLlmManager(manager)
      } catch (error) {
        console.error('❌ Failed to initialize LLM Manager:', error)
        setLastError('Router Agent Systemの初期化に失敗しました')
      }
    }

    initializeLLMManager()
  }, [])
  const [currentToolCalls, setCurrentToolCalls] = useState<any[]>([])
  const [isAgentMode, setIsAgentMode] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, streamingResponse])

  // デバッグ用：メッセージの変更を監視
  useEffect(() => {
    console.log('📝 Messages state changed:', {
      messageCount: messages.length,
      messages: messages.map(msg => ({
        id: msg.id,
        content: msg.content?.substring(0, 30) + (msg.content && msg.content.length > 30 ? '...' : ''),
        contentLength: msg.content?.length,
        role: msg.role
      }))
    })

    // メッセージが追加された後にisTypingをリセット
    if (messages.length > 0 && isTyping) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && lastMessage.content && lastMessage.content.trim() !== '') {
        console.log('🔄 Resetting isTyping after assistant message added')
        setIsTyping(false)
        setLoadingState('idle')
      }
    }
  }, [messages, isTyping])

  // isTypingの状態を監視して、長時間trueのままの場合はリセット
  useEffect(() => {
    if (isTyping) {
      const timeout = setTimeout(() => {
        console.log('⚠️ isTyping timeout - resetting state')
        setIsTyping(false)
        setLoadingState('idle')
      }, 30000) // 30秒後にリセット

      return () => clearTimeout(timeout)
    }
  }, [isTyping])

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+T (Mac) または Ctrl+T (Windows/Linux) でTTSモデル切り替え
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault()
        // TTSモデル切り替えのロジックをここに追加
        console.log('TTS model switch shortcut triggered')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-configure provider on mount
  useEffect(() => {
    autoConfigureProvider()
  }, [])

  // ファイルアップロード処理
  const handleFileUpload = (files: FileList | File[]) => {
    const newFiles = Array.from(files)
    setSelectedFiles(prev => [...prev, ...newFiles])
  }

  const removeAttachment = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ドラッグ&ドロップ処理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  // 利用可能なモデルを自動選択する関数
  const autoConfigureProvider = async () => {
    // 保存されたAPIキーがあるかチェック
    const savedApiKeys = Object.entries(providerApiKeys).filter(([_, apiKey]) => apiKey && apiKey.trim() !== '')

    if (savedApiKeys.length === 0) {
      console.log('No API keys available for auto-configuration')
      return
    }

    // 有効なモデルを優先度順にソート
    const enabledModels = modelSettings.enabledModels
      .filter(model => model.enabled)
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))

    // 利用可能なAPIキーを持つモデルをフィルタリング
    const availableModels = enabledModels.filter(model => {
      const hasApiKey = savedApiKeys.some(([providerId, _]) => providerId === model.providerId)
      const provider = AVAILABLE_PROVIDERS.find((p: any) => p.id === model.providerId)
      const modelExists = provider?.models.some((m: any) => m.id === model.modelId)
      return hasApiKey && modelExists
    })

    if (availableModels.length === 0) {
      console.log('No available models with valid API keys')
      return
    }

    // 最高優先度のモデルを選択
    const selectedModel = availableModels[0]
    const apiKey = savedApiKeys.find(([providerId, _]) => providerId === selectedModel.providerId)?.[1]

    if (!apiKey) {
      console.error('API key not found for selected model')
      return
    }

    const config: AIProviderConfig = {
      providerId: selectedModel.providerId,
      modelId: selectedModel.modelId,
      apiKey
    }

    try {
      await handleProviderSelect(config)
      console.log(`Auto-selected model: ${selectedModel.providerId}:${selectedModel.modelId} (priority: ${selectedModel.priority})`)
    } catch (error) {
      console.error('Failed to auto-configure provider:', error)
      
      // フォールバック: 次の優先度の高いモデルを試す
      if (availableModels.length > 1) {
        const fallbackModel = availableModels[1]
        const fallbackApiKey = savedApiKeys.find(([providerId, _]) => providerId === fallbackModel.providerId)?.[1]
        
        if (fallbackApiKey) {
          const fallbackConfig: AIProviderConfig = {
            providerId: fallbackModel.providerId,
            modelId: fallbackModel.modelId,
            apiKey: fallbackApiKey
          }
          
          try {
            await handleProviderSelect(fallbackConfig)
            console.log(`Fallback to model: ${fallbackModel.providerId}:${fallbackModel.modelId}`)
          } catch (fallbackError) {
            console.error('Failed to configure fallback provider:', fallbackError)
          }
        }
      }
    }
  }

  // メッセージ編集ハンドラー
  const handleMessageEdit = (messageId: string, newContent: string) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent }
          : msg
      )
    )
    
    // 編集されたメッセージを再送信
    handleSendMessage(newContent)
  }

  // メッセージ編集キャンセルハンドラー
  const handleMessageEditCancel = (messageId: string) => {
    // 編集キャンセル時の処理（必要に応じて実装）
    console.log('Message edit cancelled for:', messageId)
  }

  // 停止ハンドラー
  const handleStopGeneration = () => {
    console.log('🛑 Stopping AI generation...')
    console.log('🔄 Current isGenerating state before stop:', isGenerating)
    
    // AI SDK Serviceの停止処理を実行
    aiSDKService.stopGeneration()
    
    // 状態をリセット
    setIsGenerating(false)
    setIsTyping(false)
    setLoadingState('idle')
    setStreamingResponse('')
    
    // 最後のメッセージが空の場合は削除
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1]
      if (lastMessage && lastMessage.role === 'assistant' && (!lastMessage.content || lastMessage.content.trim() === '')) {
        return prev.slice(0, -1)
      }
      return prev
    })
    
    console.log('✅ AI generation stopped successfully')
    console.log('🔄 isGenerating state after stop: false')
  }

  // WebSearch切り替えハンドラー
  const handleWebSearchToggle = (enabled: boolean) => {
    setWebSearchEnabled(enabled)
    console.log('WebSearch enabled:', enabled)
  }

  // TTS Model選択ハンドラー
  const handleTTSModelSelect = (modelId: string) => {
    setCurrentTTSModel(modelId)
    // ローカルストレージに保存
    try {
      localStorage.setItem('armis_tts_model', modelId)
    } catch (error) {
      console.error('Failed to save TTS model to localStorage:', error)
    }
    console.log('TTS Model selected:', modelId)
  }

  // Create Image切り替えハンドラー
  const handleCreateImageToggle = (enabled: boolean) => {
    setCreateImageEnabled(enabled)
    console.log('Create Image enabled:', enabled)
    
    // Generation設定と連携
    if (enabled && !generationSettings.image.enabled) {
      setGenerationSettings((prev: any) => ({
        ...prev,
        image: {
          ...prev.image,
          enabled: true
        }
      }))
    }
  }

  // Audio切り替えハンドラー
  const handleAudioToggle = (enabled: boolean) => {
    setAudioEnabled(enabled)
    console.log('Audio enabled:', enabled)
    
    // Generation設定と連携
    if (enabled && !generationSettings.audio.enabled) {
      setGenerationSettings((prev: any) => ({
        ...prev,
        audio: {
          ...prev.audio,
          enabled: true
        }
      }))
    }
  }

  // Video切り替えハンドラー
  const handleVideoToggle = (enabled: boolean) => {
    setVideoEnabled(enabled)
    console.log('Video enabled:', enabled)
    
    // Generation設定と連携
    if (enabled && !generationSettings.video.enabled) {
      setGenerationSettings((prev: any) => ({
        ...prev,
        video: {
          ...prev.video,
          enabled: true
        }
      }))
    }
  }

  // 現在のメッセージを取得する関数
  const getCurrentMessage = () => {
    const textarea = document.querySelector('textarea[placeholder*="Plan, search, build"]') as HTMLTextAreaElement
    return textarea ? textarea.value : ''
  }

  // 動画生成開始
  const startVideoGeneration = async (videoPrompt: string) => {
    setIsGeneratingVideo(true)
    setVideoProgress(0)
    
    // 動画生成中のメッセージを追加
    const loadingMessageId = (Date.now() + 1).toString()
    const loadingMessage: ChatMessageProps = {
      id: loadingMessageId,
      content: 'Video generating...',
      role: 'assistant',
      isVideoLoading: true,
      videoProgress: 0
    }
    
    setMessages(prev => [...prev, loadingMessage])

    try {
      const veoService = new VeoService(providerApiKeys['google'] || '')
      
      // プログレス更新のシミュレーション
      const progressInterval = setInterval(() => {
        setVideoProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 15, 90)
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === loadingMessageId 
                ? { ...msg, videoProgress: newProgress }
                : msg
            )
          )
          return newProgress
        })
      }, 500)

      // 動画生成の実行
      const result = await veoService.generateVideo({
        prompt: videoPrompt,
        duration: 8,
        aspectRatio: '16:9',
        quality: 'high'
      })
      
      let finalResult = result
      
      if (result.status === 'processing') {
        console.log('🔄 Starting video polling for ID:', result.id)
        finalResult = await veoService.pollVideoStatus(result.id, (status) => {
          console.log('Video generation status:', status)
        })
        console.log('✅ Video polling completed:', finalResult)
      }

      clearInterval(progressInterval)
      setVideoProgress(100)

      // 生成完了メッセージに置き換え
      const isSimulation = finalResult.isSimulation || finalResult.id?.startsWith('veo_sim_')
      const completedMessage: ChatMessageProps = {
        id: loadingMessageId,
        content: isSimulation 
          ? 'Video generation completed! (Simulation mode - API quota exceeded)'
          : 'Video generation completed!',
        role: 'assistant',
        videoUrl: finalResult.videoUrl,
        videoDetails: {
          duration: finalResult.duration || 8,
          aspectRatio: '16:9',
          quality: 'high',
          provider: 'google',
          model: 'veo-3.0-generate-preview',
          isSimulation: isSimulation
        }
      }
      
      console.log('🎬 Final video message:', {
        id: completedMessage.id,
        content: completedMessage.content,
        videoUrl: completedMessage.videoUrl,
        videoDetails: completedMessage.videoDetails
      })

      setMessages(prev => {
        console.log('🔄 Updating messages with video:', {
          loadingMessageId,
          completedMessage,
          prevMessages: prev.map(m => ({ id: m.id, content: m.content?.substring(0, 50), videoUrl: m.videoUrl }))
        })
        
        const updated = prev.map(msg => 
          msg.id === loadingMessageId ? completedMessage : msg
        )
        
        console.log('✅ Updated messages:', updated.map(m => ({ id: m.id, content: m.content?.substring(0, 50), videoUrl: m.videoUrl })))
        
        return updated
      })

    } catch (error) {
      console.error('Video generation error:', error)
      
      // エラーメッセージを生成
      let errorContent = 'Video generation failed: Unknown error'
      
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
          errorContent = `Video generation failed: API quota exceeded. 

To resolve this issue:
1. Check your Google Cloud billing status
2. Verify your API quota limits at https://ai.google.dev/gemini-api/docs/rate-limits
3. Consider upgrading your billing plan
4. Wait for quota reset (usually daily)

Currently using simulation mode for demonstration.`
        } else if (error.message.includes('API quota exceeded')) {
          errorContent = `Video generation failed: ${error.message}`
        } else {
          errorContent = `Video generation failed: ${error.message}`
        }
      }
      
      // エラーメッセージに置き換え
      const errorMessage: ChatMessageProps = {
        id: loadingMessageId,
        content: errorContent,
        role: 'assistant'
      }

      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessageId ? errorMessage : msg
        )
      )
    } finally {
      setIsGeneratingVideo(false)
      setIsGenerating(false)
      setVideoProgress(0)
      // Videoボタンは無効化しない（ユーザーが手動で切り替える）
    }
  }

  // TTS要求を検出する関数（基本的な検出）
  const detectTTSRequest = (text: string): boolean => {
    const ttsKeywords = [
      '音声を作成', '音声で', '音声化', 'TTS', '音声合成',
      '音声を生成', '音声に変換', '音声で読み上げ',
      'audio', 'voice', 'speech', 'tts', '音声'
    ]
    
    const lowerText = text.toLowerCase()
    return ttsKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()))
  }

  // TTS処理を行う関数（新しい高度な解析機能付き）
  const processTTS = async (userInput: string, aiResponse: string) => {
    console.log('🎵 TTS processing started:', { audioEnabled, generationSettingsAudioEnabled: generationSettings.audio.enabled, userInput: userInput.substring(0, 50) + '...', aiResponse: aiResponse.substring(0, 50) + '...' })
    
    if (!audioEnabled || !generationSettings.audio.enabled) {
      console.log('❌ TTS processing cancelled: Audio not enabled')
      return
    }

    // Audioがオンの場合は、Router Agentの判断に関係なく常にTTS処理を実行
    const shouldProcessTTS = audioEnabled && generationSettings.audio.enabled
    console.log('✅ TTS processing will proceed:', shouldProcessTTS)
    

    // TTS処理開始時にローディングメッセージを追加
    const loadingMessageId = (Date.now() + 1).toString()
    const loadingMessage: ChatMessageProps = {
      id: loadingMessageId,
      content: 'audio generating...',
      role: 'assistant',
      isTTSLoading: true, // ローディング状態を示すフラグ
      ttsInfo: {
        provider: 'loading',
        model: 'loading',
        voice: 'loading',
        language: 'loading',
        text: 'audio generating...'
      }
    }
    
    setMessages(prev => [...prev, loadingMessage])

    try {
      // APIキーを取得（優先順位: Settings API Keys > TTS Settings > 環境変数）
      const geminiApiKey = providerApiKeys['google'] || 
                           generationSettings.audio.tts?.apiKey || 
                           (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GOOGLE_GENAI_API_KEY : undefined) ||
                           (typeof process !== 'undefined' ? process.env.GOOGLE_GENAI_API_KEY : undefined)

      // OpenAI APIキーを取得（TTS要求解析用）
      const openaiApiKey = providerApiKeys['openai'] || 
                           (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_API_KEY : undefined) ||
                           (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined)

      if (!geminiApiKey && !openaiApiKey) {
        console.warn('TTS: No API keys available. Please configure Google or OpenAI API key in Settings → API Keys or set environment variables.')
        return
      }

      // Hugging Face APIキーを取得
      const huggingfaceApiKey = providerApiKeys['huggingface'] || 
                                (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_HUGGINGFACE_API_KEY : undefined) ||
                                (typeof process !== 'undefined' ? process.env.HUGGINGFACE_API_KEY : undefined)

      // 設定から選択されたTTSプロバイダーとモデルを取得
      const selectedTTSProvider = generationSettings.audio.provider || 'google'
      const selectedTTSModels = generationSettings.audio.models || {}
      
      console.log('🎵 TTS Provider Selection Debug:', {
        generationSettingsAudioProvider: generationSettings.audio.provider,
        selectedTTSProvider,
        generationSettingsAudio: generationSettings.audio,
        currentTTSModel,
        audioEnabled
      })
      
      // 有効なTTSモデルを優先度順にソート
      const enabledTTSModels = Object.entries(selectedTTSModels)
        .filter(([_, config]: [string, any]) => config.enabled)
        .sort(([_, a]: [string, any], [__, b]: [string, any]) => (a.priority || 999) - (b.priority || 999))
      
      // 選択されたTTSモデルまたは最高優先度のTTSモデルを選択（設定画面と完全に同期）
      let primaryTTSModel = currentTTSModel !== 'auto' ? currentTTSModel : 
                           enabledTTSModels.length > 0 ? enabledTTSModels[0][0] : 'gemini-2.5-flash-preview-tts'
      
      // 設定画面のプロバイダー設定に基づいてモデルを選択
      if (selectedTTSProvider === 'openai') {
        // OpenAIプロバイダーが選択されている場合、OpenAIモデルを優先
        const openaiModel = enabledTTSModels.find(([model, config]: [string, any]) => model === 'gpt-4o-mini-tts')
        if (openaiModel) {
          primaryTTSModel = 'gpt-4o-mini-tts'
        }
      } else if (selectedTTSProvider === 'google') {
        // Googleプロバイダーが選択されている場合、Googleモデルを優先
        const googleModel = enabledTTSModels.find(([model, config]: [string, any]) => 
          model === 'gemini-2.5-flash-preview-tts' || model === 'gemini-2.5-pro-preview-tts'
        )
        if (googleModel) {
          primaryTTSModel = googleModel[0]
        }
      }
      
      console.log('TTS Settings:', {
        provider: selectedTTSProvider,
        selectedModel: currentTTSModel,
        primaryModel: primaryTTSModel,
        enabledModels: enabledTTSModels.map(([model, config]: [string, any]) => ({ model, priority: config.priority }))
      })



      // Inworld AI APIキーを取得
      const inworldApiKey = providerApiKeys?.['inworld'] || 
                           (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_INWORLD_API_KEY : undefined) ||
                           (typeof process !== 'undefined' ? process.env.INWORLD_API_KEY : undefined)

      console.log('🎤 Inworld API Key Debug:', {
        fromProviderApiKeys: !!providerApiKeys?.['inworld'],
        fromEnv: !!(typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_INWORLD_API_KEY : undefined),
        fromProcess: !!(typeof process !== 'undefined' ? process.env.INWORLD_API_KEY : undefined),
        finalApiKey: !!inworldApiKey,
        apiKeyLength: inworldApiKey?.length || 0
      })

      // ローカルInworld設定
      const localInworldConfig = {
        pythonPath: process.env.PYTHON_PATH || 'python3',
        modelsDir: './models/inworld-tts-local',
        autoSetup: true
      }

      // TTSマネージャーを作成（設定から選択されたプロバイダーを使用）
      const primaryService = (() => {
        switch (selectedTTSProvider) {
          case 'google':
            return 'gemini'
          case 'openai':
            return 'openai'
          case 'inworld':
            return 'inworld'
          case 'local-inworld':
            return 'local-inworld'
          default:
            return 'gemini'
        }
      })()

      console.log('🎵 TTS Manager Configuration:', {
        selectedTTSProvider,
        primaryService,
        hasGeminiApiKey: !!geminiApiKey,
        hasOpenaiApiKey: !!openaiApiKey,
        hasInworldApiKey: !!inworldApiKey,
        hasHuggingfaceApiKey: !!huggingfaceApiKey,
        inworldApiKeyLength: inworldApiKey?.length || 0,
        providerApiKeysKeys: Object.keys(providerApiKeys || {}),
        inworldInProviderApiKeys: !!providerApiKeys?.['inworld']
      })

      const ttsManager = createTTSManager({
        primaryService,
        enableFallback: true, // フォールバックを有効化して利用可能なサービスを使用
        geminiApiKey: geminiApiKey,
        openaiApiKey: openaiApiKey,
        inworldApiKey: inworldApiKey,
        huggingfaceApiKey: huggingfaceApiKey,
        localInworldConfig: localInworldConfig,
        enableAdvancedAnalysis: true,
        enableTextExtraction: true // テキスト抽出機能を有効化
      })

      // LLMマネージャーをTTSマネージャーに設定（テキスト抽出用）
      if (llmManager) {
        ttsManager.setLLMManager(llmManager)
      }

      if (!ttsManager.isAnyServiceAvailable()) {
        console.warn('No TTS services are available')
        
        // Local Inworld TTSが選択されているが利用できない場合の特別なメッセージ
        if (selectedTTSProvider === 'local-inworld') {
          console.warn('⚠️  Local Inworld TTS requires Electron environment. Please use the Electron version of the application.')
          // ユーザーに通知（オプション）
          if (typeof window !== 'undefined' && !window.electronAPI) {
            alert('Local Inworld TTS requires Electron environment. Please use the Electron version of the application for local TTS functionality.')
          }
        }
        return
      }

      // TTS処理オプションを設定（設定画面と完全に同期）
      const ttsOptions = {
        speaker: {
          voiceName: (() => {
            // 設定画面のプロバイダー設定に基づいてデフォルト音声を選択
            switch (selectedTTSProvider) {
              case 'openai':
                return generationSettings.audio.tts?.defaultVoice || 'alloy'
              case 'inworld':
                return generationSettings.audio.tts?.defaultVoice || 'Ashley'
              case 'local-inworld':
                return generationSettings.audio.tts?.defaultVoice || 'tts-1'
              case 'google':
              default:
                return generationSettings.audio.tts?.defaultVoice || 'Kore'
            }
          })(),
          language: (() => {
            // 設定画面のプロバイダー設定に基づいてデフォルト言語を選択
            switch (selectedTTSProvider) {
              case 'openai':
                return generationSettings.audio.tts?.defaultLanguage || 'en-US'
              case 'inworld':
                return generationSettings.audio.tts?.defaultLanguage || 'en'
              case 'local-inworld':
                return generationSettings.audio.tts?.defaultLanguage || 'en-US'
              case 'google':
              default:
                return generationSettings.audio.tts?.defaultLanguage || 'ja-JP'
            }
          })(),
          style: generationSettings.audio.tts?.defaultStyle
        },
        model: primaryTTSModel // 選択されたモデルを指定
      }

      console.log('🎵 TTS Processing Options:', {
        provider: selectedTTSProvider,
        selectedModel: currentTTSModel,
        model: primaryTTSModel,
        voice: ttsOptions.speaker.voiceName,
        language: ttsOptions.speaker.language,
        style: ttsOptions.speaker.style,
        localInworldConfig: selectedTTSProvider === 'local-inworld' ? localInworldConfig : undefined,
        isElectron: typeof window !== 'undefined' && !!window.electronAPI,
        windowElectronAPI: typeof window !== 'undefined' ? !!window.electronAPI : 'window undefined'
      })

      console.log('🎵 TTS Voice Selection Debug (1st):', {
        selectedTTSProvider,
        defaultVoiceFromSettings: generationSettings.audio.tts?.defaultVoice,
        selectedVoiceName: ttsOptions.speaker.voiceName,
        inworldCase: selectedTTSProvider === 'inworld' ? 'Ashley' : 'not inworld'
      })

      // TTSサービスの利用可能性を詳細にチェック
      console.log('🔍 TTS Service Availability Check:', {
        selectedProvider: selectedTTSProvider,
        isLocalInworld: selectedTTSProvider === 'local-inworld',
        electronEnvironment: typeof window !== 'undefined' && !!window.electronAPI,
        ttsManagerAvailable: ttsManager.isAnyServiceAvailable()
      })

      // Audioがオンの場合は自動的にTTS処理を実行、そうでない場合はTTS要求を検出
      let result
      console.log('🎵 Starting TTS synthesis with options:', ttsOptions)
      
      if (shouldProcessTTS) {
        // Audioがオンの場合は、TTS要求の検出をスキップして直接音声合成を実行
        console.log('🎵 Direct TTS synthesis (Audio enabled)')
        result = await ttsManager.synthesize(aiResponse, ttsOptions)
        console.log('🎵 TTS synthesis completed:', result ? 'Success' : 'Failed')
      } else {
        // Audioがオフの場合は、TTS要求を検出してから音声合成を実行
        console.log('🎵 TTS request analysis (Audio disabled)')
        result = await ttsManager.processTTSRequest(userInput, aiResponse, ttsOptions)

        // TTS要求でない場合は処理を終了
        if (!result) {
          console.log('No TTS request detected or processing cancelled')
          return
        }
      }

      // TTSResultからaudioUrlを使用（既にWAVヘッダーが追加済み）
      const audioUrl = result.audioUrl || (() => {
        // フォールバック: WAVヘッダーを追加してブラウザで再生可能な形式に変換
        const wavData = addWavHeader(result.audioData, 24000, 1, 16)
        const blob = new Blob([wavData], { type: 'audio/wav' })
        return URL.createObjectURL(blob)
      })()

      // ローディングメッセージを実際のTTS結果に置き換え
      const ttsMessage: ChatMessageProps = {
        id: loadingMessageId, // 同じIDを使用してローディングメッセージを置き換え
        content: `Audio has been generated using ${selectedTTSProvider} (${primaryTTSModel})!`,
        role: 'assistant',
        audioUrl: audioUrl,
        audioData: result.audioData,
        isTTSLoading: false, // ローディング完了
        ttsInfo: {
          provider: selectedTTSProvider,
          model: primaryTTSModel,
          selectedModel: currentTTSModel,
          voice: (() => {
            // 設定画面のプロバイダー設定に基づいてデフォルト音声を選択
            switch (selectedTTSProvider) {
              case 'vibevoice':
                return generationSettings.audio.tts?.defaultVoice || 'vibevoice-japanese'
              case 'openai':
                return generationSettings.audio.tts?.defaultVoice || 'alloy'
              case 'google':
              default:
                return generationSettings.audio.tts?.defaultVoice || 'Kore'
            }
          })(),
          language: (() => {
            // 設定画面のプロバイダー設定に基づいてデフォルト言語を選択
            switch (selectedTTSProvider) {
              case 'vibevoice':
                return generationSettings.audio.tts?.defaultLanguage || 'ja-JP'
              case 'openai':
                return generationSettings.audio.tts?.defaultLanguage || 'en-US'
              case 'google':
              default:
                return generationSettings.audio.tts?.defaultLanguage || 'ja-JP'
            }
          })(),
          style: generationSettings.audio.tts?.defaultStyle,
          text: aiResponse.substring(0, 100) + (aiResponse.length > 100 ? '...' : '')
        }
      }
      
      setMessages(prev => prev.map(msg => msg.id === loadingMessageId ? ttsMessage : msg))
      
      console.log('TTS processing completed for:', aiResponse.substring(0, 50) + '...')
    } catch (error) {
      console.error('TTS processing failed:', error)
      
      // エラーメッセージをユーザーに表示
      const errorMessage = error instanceof Error ? error.message : 'Unknown TTS error'
      
      // ローディングメッセージをエラーメッセージに置き換え
      const errorMsg: ChatMessageProps = {
        id: loadingMessageId, // 同じIDを使用してローディングメッセージを置き換え
        content: errorMessage.includes('quota exceeded') || errorMessage.includes('429') 
          ? `⚠️ **TTS Quota Exceeded**\n\nGemini TTSの1日の利用制限（15回）に達しました。\n\n**解決方法:**\n• 24時間後に再試行してください\n• 設定でWeb Speech APIに切り替えてください\n• 有料プランにアップグレードしてください`
          : `❌ **TTS Error**\n\n${errorMessage}\n\n**解決方法:**\n• APIキーを確認してください\n• 設定でTTSサービスを変更してください`,
        role: 'assistant',
        isError: true,
        isTTSLoading: false // ローディング完了
      }
      
      setMessages(prev => prev.map(msg => msg.id === loadingMessageId ? errorMsg : msg))
    } finally {
      setIsTyping(false)
      setIsGenerating(false)
      setLoadingState('idle')
    }
  }

  // テキスト抽出機能付きTTS処理を行う関数
  const processTTSWithTextExtraction = async (userInput: string) => {
    console.log('🎵 TTS Text Extraction processing started:', { audioEnabled, generationSettingsAudioEnabled: generationSettings.audio.enabled, userInput: userInput.substring(0, 50) + '...' })
    
    if (!audioEnabled || !generationSettings.audio.enabled) {
      console.log('❌ TTS Text Extraction processing cancelled: Audio not enabled')
      return
    }

    // TTS処理開始時にローディングメッセージを追加
    const loadingMessageId = (Date.now() + 1).toString()
    const loadingMessage: ChatMessageProps = {
      id: loadingMessageId,
      content: 'audio generating...',
      role: 'assistant',
      isTTSLoading: true, // ローディング状態を示すフラグ
      ttsInfo: {
        provider: 'loading',
        model: 'loading',
        voice: 'loading',
        language: 'loading',
        text: 'audio generating...'
      }
    }
    
    setMessages(prev => [...prev, loadingMessage])

    try {
      // APIキーを取得（優先順位: Settings API Keys > TTS Settings > 環境変数）
      const geminiApiKey = providerApiKeys['google'] || 
                           generationSettings.audio.tts?.apiKey || 
                           (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GOOGLE_GENAI_API_KEY : undefined) ||
                           (typeof process !== 'undefined' ? process.env.GOOGLE_GENAI_API_KEY : undefined)

      // OpenAI APIキーを取得（TTS要求解析用）
      const openaiApiKey = providerApiKeys['openai'] || 
                           (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_API_KEY : undefined) ||
                           (typeof process !== 'undefined' ? process.env.OPENAI_API_KEY : undefined)

      if (!geminiApiKey && !openaiApiKey) {
        console.warn('TTS: No API keys available. Please configure Google or OpenAI API key in Settings → API Keys or set environment variables.')
        return
      }

      // Hugging Face APIキーを取得
      const huggingfaceApiKey = providerApiKeys['huggingface'] || 
                                (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_HUGGINGFACE_API_KEY : undefined) ||
                                (typeof process !== 'undefined' ? process.env.HUGGINGFACE_API_KEY : undefined)

      // 設定から選択されたTTSプロバイダーとモデルを取得
      const selectedTTSProvider = generationSettings.audio.provider || 'google'
      const selectedTTSModels = generationSettings.audio.models || {}
      
      // 有効なTTSモデルを優先度順にソート
      const enabledTTSModels = Object.entries(selectedTTSModels)
        .filter(([_, config]: [string, any]) => config.enabled)
        .sort(([_, a]: [string, any], [__, b]: [string, any]) => (a.priority || 999) - (b.priority || 999))
      
      // 選択されたTTSモデルまたは最高優先度のTTSモデルを選択（設定画面と完全に同期）
      let primaryTTSModel = currentTTSModel !== 'auto' ? currentTTSModel : 
                           enabledTTSModels.length > 0 ? enabledTTSModels[0][0] : 'gemini-2.5-flash-preview-tts'
      
      // 設定画面のプロバイダー設定に基づいてモデルを選択
      if (selectedTTSProvider === 'openai') {
        // OpenAIプロバイダーが選択されている場合、OpenAIモデルを優先
        const openaiModel = enabledTTSModels.find(([model, config]: [string, any]) => model === 'gpt-4o-mini-tts')
        if (openaiModel) {
          primaryTTSModel = 'gpt-4o-mini-tts'
        }
      } else if (selectedTTSProvider === 'google') {
        // Googleプロバイダーが選択されている場合、Googleモデルを優先
        const googleModel = enabledTTSModels.find(([model, config]: [string, any]) => 
          model === 'gemini-2.5-flash-preview-tts' || model === 'gemini-2.5-pro-preview-tts'
        )
        if (googleModel) {
          primaryTTSModel = googleModel[0]
        }
      }

      // Inworld AI APIキーを取得
      const inworldApiKey = providerApiKeys['inworld'] || 
                           (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_INWORLD_API_KEY : undefined) ||
                           (typeof process !== 'undefined' ? process.env.INWORLD_API_KEY : undefined)

      // ローカルInworld設定
      const localInworldConfig = {
        pythonPath: process.env.PYTHON_PATH || 'python3',
        modelsDir: './models/inworld-tts-local',
        autoSetup: true
      }

      // TTSマネージャーを作成（設定から選択されたプロバイダーを使用）
      const primaryService = (() => {
        switch (selectedTTSProvider) {
          case 'google':
            return 'gemini'
          case 'openai':
            return 'openai'
          case 'inworld':
            return 'inworld'
          case 'local-inworld':
            return 'local-inworld'
          default:
            return 'gemini'
        }
      })()

      const ttsManager = createTTSManager({
        primaryService,
        enableFallback: true, // フォールバックを有効化して利用可能なサービスを使用
        geminiApiKey: geminiApiKey,
        openaiApiKey: openaiApiKey,
        inworldApiKey: inworldApiKey,
        huggingfaceApiKey: huggingfaceApiKey,
        localInworldConfig: localInworldConfig,
        enableAdvancedAnalysis: true,
        enableTextExtraction: true // テキスト抽出機能を有効化
      })

      // LLMマネージャーをTTSマネージャーに設定（テキスト抽出用）
      if (llmManager) {
        ttsManager.setLLMManager(llmManager)
      }

      if (!ttsManager.isAnyServiceAvailable()) {
        console.warn('No TTS services are available')
        return
      }

      // TTS処理オプションを設定（設定画面と完全に同期）
      const ttsOptions = {
        speaker: {
          voiceName: (() => {
            // 設定画面のプロバイダー設定に基づいてデフォルト音声を選択
            switch (selectedTTSProvider) {
              case 'openai':
                return generationSettings.audio.tts?.defaultVoice || 'alloy'
              case 'inworld':
                return generationSettings.audio.tts?.defaultVoice || 'Ashley'
              case 'local-inworld':
                return generationSettings.audio.tts?.defaultVoice || 'tts-1'
              case 'google':
              default:
                return generationSettings.audio.tts?.defaultVoice || 'Kore'
            }
          })(),
          language: (() => {
            // 設定画面のプロバイダー設定に基づいてデフォルト言語を選択
            switch (selectedTTSProvider) {
              case 'openai':
                return generationSettings.audio.tts?.defaultLanguage || 'en-US'
              case 'inworld':
                return generationSettings.audio.tts?.defaultLanguage || 'en'
              case 'local-inworld':
                return generationSettings.audio.tts?.defaultLanguage || 'en-US'
              case 'google':
              default:
                return generationSettings.audio.tts?.defaultLanguage || 'ja-JP'
            }
          })(),
          style: generationSettings.audio.tts?.defaultStyle
        },
        model: primaryTTSModel // 選択されたモデルを指定
      }

      console.log('🎵 TTS Text Extraction: Starting synthesis with options:', ttsOptions)
      
      console.log('🎵 TTS Voice Selection Debug (2nd):', {
        selectedTTSProvider,
        defaultVoiceFromSettings: generationSettings.audio.tts?.defaultVoice,
        selectedVoiceName: ttsOptions.speaker.voiceName,
        inworldCase: selectedTTSProvider === 'inworld' ? 'Ashley' : 'not inworld'
      })
      
      // テキスト抽出機能付きTTS処理を実行
      const result = await ttsManager.processTTSWithTextExtraction(userInput, ttsOptions)
      
      if (!result) {
        console.log('🎵 TTS Text Extraction: No result returned, skipping audio generation')
        // ローディングメッセージを削除
        setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId))
        return
      }

      // TTSResultからaudioUrlを使用（既にWAVヘッダーが追加済み）
      const audioUrl = result.audioUrl || (() => {
        // フォールバック: WAVヘッダーを追加してブラウザで再生可能な形式に変換
        const wavData = addWavHeader(result.audioData, 24000, 1, 16)
        const audioBlob = new Blob([wavData], { type: 'audio/wav' })
        return URL.createObjectURL(audioBlob)
      })()

      // TTS情報を設定
      const ttsInfo = {
        provider: selectedTTSProvider,
        model: primaryTTSModel,
        voice: ttsOptions.speaker.voiceName,
        language: ttsOptions.speaker.language,
        style: ttsOptions.speaker.style,
        text: userInput
      }

      // ローディングメッセージをTTS結果メッセージに置き換え
      const ttsMessage: ChatMessageProps = {
        id: loadingMessageId, // 同じIDを使用してローディングメッセージを置き換え
        content: `Audio has been generated using ${selectedTTSProvider} (${primaryTTSModel})!`,
        role: 'assistant',
        audioUrl: audioUrl,
        audioData: result.audioData,
        ttsInfo: ttsInfo,
        isTTSLoading: false // ローディング完了
      }
      
      setMessages(prev => prev.map(msg => msg.id === loadingMessageId ? ttsMessage : msg))
      
      console.log('🎵 TTS Text Extraction processing completed for:', userInput.substring(0, 50) + '...')
    } catch (error) {
      console.error('🎵 TTS Text Extraction processing failed:', error)
      
      // エラーメッセージをユーザーに表示
      const errorMessage = error instanceof Error ? error.message : 'Unknown TTS error'
      
      // ローディングメッセージをエラーメッセージに置き換え
      const errorMsg: ChatMessageProps = {
        id: loadingMessageId, // 同じIDを使用してローディングメッセージを置き換え
        content: errorMessage.includes('quota exceeded') || errorMessage.includes('429') 
          ? `⚠️ **TTS Quota Exceeded**\n\nGemini TTSの1日の利用制限（15回）に達しました。\n\n**解決方法:**\n• 24時間後に再試行してください\n• 設定でWeb Speech APIに切り替えてください\n• 有料プランにアップグレードしてください`
          : `❌ **TTS Error**\n\n${errorMessage}\n\n**解決方法:**\n• APIキーを確認してください\n• 設定でTTSサービスを変更してください`,
        role: 'assistant',
        isError: true,
        isTTSLoading: false // ローディング完了
      }
      
      setMessages(prev => prev.map(msg => msg.id === loadingMessageId ? errorMsg : msg))
    } finally {
      setIsTyping(false)
      setIsGenerating(false)
      setLoadingState('idle')
    }
  }

  // WAVヘッダーを追加するヘルパー関数
  function addWavHeader(pcmData: ArrayBuffer, sampleRate: number, channels: number, bitsPerSample: number): ArrayBuffer {
    const dataLength = pcmData.byteLength
    const headerLength = 44
    const totalLength = headerLength + dataLength
    
    const buffer = new ArrayBuffer(totalLength)
    const view = new DataView(buffer)
    
    // WAVヘッダーを書き込み
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    // RIFFヘッダー
    writeString(0, 'RIFF')
    view.setUint32(4, totalLength - 8, true) // ファイルサイズ - 8
    writeString(8, 'WAVE')
    
    // fmt チャンク
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // fmtチャンクサイズ
    view.setUint16(20, 1, true) // PCM形式
    view.setUint16(22, channels, true) // チャンネル数
    view.setUint32(24, sampleRate, true) // サンプルレート
    view.setUint32(28, sampleRate * channels * bitsPerSample / 8, true) // バイトレート
    view.setUint16(32, channels * bitsPerSample / 8, true) // ブロックアライメント
    view.setUint16(34, bitsPerSample, true) // ビット深度
    
    // data チャンク
    writeString(36, 'data')
    view.setUint32(40, dataLength, true) // データサイズ
    
    // PCMデータをコピー
    const pcmView = new Uint8Array(pcmData)
    const bufferView = new Uint8Array(buffer)
    bufferView.set(pcmView, headerLength)
    
    return buffer
  }

  // 画像生成リクエストを処理する関数
  const handleImageGenerationRequest = async (content: string) => {
    let taskId: string | undefined
    try {
      // Audioがオンの場合はテキスト生成をスキップ
      if (audioEnabled && generationSettings.audio.enabled) {
        const audioMessage: ChatMessageProps = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: '',
          role: 'assistant',
          metadata: {
            title: 'Audio Mode Active'
          }
        }
        setMessages(prev => [...prev, audioMessage])
        return
      }

      console.log('🎨 Starting image generation process...')
      
      // プロンプトから画像生成用のテキストを抽出
      const imagePrompt = content
        .replace(/画像を生成|create image|generate image|draw|paint|画像を作成|絵を描いて/gi, '')
        .trim()
      
      if (!imagePrompt) {
        const errorMessage = '画像生成のプロンプトを入力してください。例: "美しい夕日を画像で生成"'
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          content: errorMessage,
          role: 'assistant'
        }])
        return
      }

      // タスク実行を開始
      taskId = await startTask({
        taskType: 'generation',
        title: 'Image Generation',
        description: `画像生成中: ${imagePrompt.substring(0, 50)}${imagePrompt.length > 50 ? '...' : ''}`,
        estimatedDuration: 15000,
        metadata: {
          complexity: 'medium',
          priority: 'medium',
          resources: ['AI Image Model']
        }
      })

      // 環境変数の設定状況を確認
      const config = await checkGoogleAIConfig()
      
      if (!config.isConfigured) {
        // 環境変数が設定されていない場合のフォールバック処理
        const setupMessage = `## 🎨 画像生成の設定が必要です

画像生成機能を使用するには、Google AI APIの設定が必要です。

### 📋 設定手順:

1. **Google Cloud Console**でプロジェクトを作成
2. **Vertex AI API**を有効化
3. **API Key**を作成
4. **Project ID**を取得

### 🔧 環境変数の設定:

プロジェクトのルートディレクトリに\`.env\`ファイルを作成し、以下を追加してください：

\`\`\`bash
# Google AI API Key for Gemini File Upload and Image Generation
VITE_GOOGLE_API_KEY=your_google_api_key_here

# Google Cloud Project ID for Vertex AI Image Generation
VITE_GOOGLE_PROJECT_ID=your_google_cloud_project_id_here

# Google Cloud Location for Vertex AI (default: us-central1)
VITE_GOOGLE_LOCATION=us-central1
\`\`\`

### 📖 詳細な設定方法:

詳細な設定方法については、[README.md](./README.md)の「Gemini Image Generation Integration」セクションを参照してください。

### 🔄 設定後の再起動:

環境変数を設定した後、アプリケーションを再起動してください。

---
**現在のプロンプト:** ${imagePrompt}
**状態:** 設定待ち`

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          content: setupMessage,
          role: 'assistant'
        }])
        
        // タスク完了
        if (taskId) {
          completeTask(taskId, false)
        }
        return
      }

      // Gemini Image Serviceを使用して画像生成
      const geminiImageService = new GeminiImageService()

      // LLMサービスを取得（プロンプト補完エージェント用）
      let llmService = null
      try {
        if (llmManager) {
          // 現在のLLMサービスを取得
          llmService = llmManager.getLLMService()
        }
      } catch (error) {
        console.warn('LLMサービスが利用できません。プロンプト補完機能は無効になります:', error)
      }

      // Gemini Image Serviceを設定（プロンプト補完エージェント付き）
      await geminiImageService.configure(
        config.googleApiKey!, 
        config.googleProjectId!, 
        config.googleLocation,
        llmService || undefined,
        true, // プロンプト補完機能を有効化
        true  // APIキー検証をスキップ（画像生成時に実際のテストを行う）
      )

      // 画像生成リクエストを作成
      const imageRequest = {
        prompt: imagePrompt,
        model: 'gemini-2.0-flash-preview-image-generation',
        aspectRatio: '1:1' as const,
        quality: 'standard' as const,
        style: 'photorealistic' as const,
        safetyFilter: 'block_some' as const,
        personGeneration: 'dont_allow' as const
      }

      console.log('🔄 Generating image with prompt:', imagePrompt)
      
      // 画像生成を実行
      const imageResponse = await geminiImageService.generateImage(imageRequest)
      
      console.log('✅ Image generation completed:', imageResponse)

      // 生成された画像をメッセージとして追加
      const assistantMessage: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        content: `image generated!`,
        role: 'assistant',
        images: imageResponse.images // 生成された画像データを追加
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // タスク完了
      if (taskId) {
        completeTask(taskId, true)
      }

    } catch (error) {
      console.error('❌ Image generation failed:', error)
      
      const errorMessage = `画像生成中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        role: 'assistant'
      }])
      
      // タスクエラー
      if (taskId) {
        completeTask(taskId, false)
      }
    } finally {
      setIsTyping(false)
      setIsGenerating(false)
      setLoadingState('idle')
    }
  }

  // ウェブ検索を実行する関数
  const performWebSearch = async (query: string): Promise<string | null> => {
    if (!webSearchEnabled) {
      return null
    }

    try {
      console.log('Performing web search for:', query)
      const searchResult = await webSearchManager.performWebSearch(query, 'google', 'auto')
      
      // 検索結果をMarkdown形式でフォーマット
      const searchContext = webSearchManager.formatSearchResultAsMarkdown(searchResult)
      
      return searchContext
    } catch (error) {
      console.error('Web search failed:', error)
      return `**ウェブ検索エラー:** ${error instanceof Error ? error.message : '検索に失敗しました'}\n`
    }
  }

  const handleSendMessage = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>) => {
    if (!content.trim() && selectedFiles.length === 0) return

    setIsTyping(true)
    console.log('🔄 Setting isGenerating to true in handleSendMessage')
    setIsGenerating(true)
    setLoadingState('text')

    // ウェブ検索を実行（有効な場合）
    let searchContext = ''
    if (webSearchEnabled) {
      try {
        const searchResult = await performWebSearch(content.trim())
        if (searchResult) {
          searchContext = searchResult + '\n\n'
        }
      } catch (error) {
        console.error('Web search error during message send:', error)
      }
    }

    // YouTube URLを検出
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/
    const isYouTubeUrl = youtubeRegex.test(content.trim())

    // ユーザーメッセージを追加（ファイル付き）
    const userMessage: ChatMessageProps = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      files: selectedFiles.length > 0 ? selectedFiles : undefined
    }
    console.log('➕ Adding user message:', userMessage)
    setMessages(prev => [...prev, userMessage])

    // ファイルを一時保存（API呼び出し後にクリア）
    const filesToSend = [...selectedFiles]
    setSelectedFiles([])

    try {
      // Videoが有効な場合は動画生成を実行
      if (videoEnabled) {
        await startVideoGeneration(content.trim())
        return
      }

      // 現在のプロバイダー設定をチェック
      const currentConfig = aiSDKService.getCurrentConfig()
      
      // OllamaまたはLlamaCppモデルの場合、モデル存在チェックと自動ダウンロード
      if (currentConfig && (currentConfig.providerId === 'ollama' || currentConfig.providerId === 'llama-cpp') && llmManager) {
        try {
          setIsDownloading(true)
          setDownloadProgress({ status: 'checking', message: 'Checking model availability...' })

          // モデルが利用可能かチェックし、必要に応じてダウンロード
          await llmManager.ensureModelAvailable(currentConfig.modelId, (progress) => {
            // ダウンロードが開始されたら「Checking model availability...」を非表示にする
            if (progress && progress.status === 'downloading') {
              setDownloadProgress(null)
            }
            // 進行状況が存在する場合のみ更新（checking状態の重複を防ぐ）
            if (progress && (progress.status === 'starting' || progress.status === 'downloading' || progress.status === 'verifying' || progress.status === 'completed' || progress.status === 'error')) {
              setDownloadProgress(progress)
            }
            console.log('Model availability check progress:', progress)
            console.log('Progress status:', progress?.status)
            console.log('Progress message:', progress?.message)
          })

          setDownloadProgress({ status: 'completed', message: 'Model ready!' })
        } catch (error) {
          console.error('Failed to ensure model availability:', error)
          setLastError(`Model not available: ${error}`)
          setIsTyping(false)
          setIsGenerating(false)
          setLoadingState('idle')
          return
        } finally {
          setIsDownloading(false)
          setDownloadProgress(null)
        }
      }

      if (content.toLowerCase().includes('sequential') || content.toLowerCase().includes('step by step') || content.toLowerCase().includes('plan')) {
        await handleSequentialThinkingRequest(content, contexts)
      } else if (isYouTubeUrl && selectedFiles.length === 0) {
        // YouTube URLの場合は動画分析を実行
        await handleYouTubeVideoRequest(content, contexts)
      } else {
        await handleRegularChatRequest(content, contexts, filesToSend, searchContext)
      }
    } catch (error) {
      console.error('Error handling message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setLastError(errorMessage)
      setIsTyping(false)
      setIsGenerating(false)
      setLoadingState('idle')
    }
  }

  // タスク実行ヘルパー関数
  const startTask = async (taskInfo: {
    taskType: 'analysis' | 'generation' | 'processing' | 'search' | 'computation' | 'optimization' | 'learning' | 'custom'
    title: string
    description: string
    estimatedDuration?: number
    metadata?: {
      model?: string
      complexity?: string
      priority?: 'low' | 'medium' | 'high'
      resources?: string[]
    }
  }) => {
    // Chat Response Generationタスクを除外
    if (taskInfo.title && taskInfo.title.includes('Chat Response Generation')) {
      return `excluded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const taskId = await addTask({
      ...taskInfo,
      status: 'pending',
      progress: 0
    })

    // すぐに実行中に変更
    setTimeout(() => {
      updateTask(taskId, { status: 'running', progress: 10 })
    }, 100)

    return taskId
  }

  const updateTaskProgress = (taskId: string, progress: number, step?: string, stepIndex?: number) => {
    updateTask(taskId, { 
      progress, 
      currentStep: step,
      currentStepIndex: stepIndex
    })
  }

  const completeTask = (taskId: string, success: boolean = true) => {
    updateTask(taskId, { 
      status: success ? 'completed' : 'error',
      progress: 100
    })
  }

  // ファイル作成ヘルパー関数
  const startFileCreation = (fileInfo: {
    fileName: string
    fileType: 'text' | 'image' | 'video' | 'audio' | 'code' | 'archive' | 'document' | 'other'
    estimatedDuration?: number
    metadata?: {
      size?: number
      format?: string
      quality?: string
      compression?: string
    }
  }) => {
    const fileCreationId = addFileCreation({
      ...fileInfo,
      status: 'creating',
      progress: 0
    })

    // すぐに処理中に変更
    setTimeout(() => {
      updateFileCreation(fileCreationId, { status: 'processing', progress: 10 })
    }, 100)

    return fileCreationId
  }

  const updateFileCreationProgress = (fileCreationId: string, progress: number, step?: string, stepIndex?: number) => {
    updateFileCreation(fileCreationId, { 
      progress, 
      currentStep: step,
      currentStepIndex: stepIndex
    })
  }

  const completeFileCreation = (fileCreationId: string, success: boolean = true) => {
    updateFileCreation(fileCreationId, { 
      status: success ? 'completed' : 'error',
      progress: 100
    })
  }

  const handleSequentialThinkingRequest = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>) => {
    let taskId: string | undefined
    try {
      // Audioがオンの場合はテキスト生成をスキップ
      if (audioEnabled && generationSettings.audio.enabled) {
        // 空のメッセージは追加しない
        return
      }

      setIsAgentMode(true)
      setShowSequentialThinking(true)

      // タスク実行を開始
      taskId = await startTask({
        taskType: 'analysis',
        title: 'Sequential Thinking Analysis',
        description: `複雑なタスク「${content}」の段階的思考分析を実行中`,
        estimatedDuration: 30000, // 30秒
        metadata: {
          complexity: 'high',
          priority: 'high',
          resources: ['AI Model', 'Planning Tools']
        }
      })

      if (aiSDKService.isProviderConfigured()) {
        // 現在のプロバイダー設定を取得
        const currentConfig = aiSDKService.getCurrentConfig()
        if (!currentConfig) {
          throw new Error('No provider configured')
        }

        // プロバイダーのAPI Keyを取得
        const apiKey = providerApiKeys[currentConfig.providerId]
        if (!apiKey) {
          throw new Error(`API Key not found for provider: ${currentConfig.providerId}`)
        }

        // API Keyでプロバイダーを再設定
        await aiSDKService.configureProvider({
          ...currentConfig,
          apiKey: apiKey
        })

        // タスク進捗を更新
        if (taskId) {
          updateTaskProgress(taskId, 30, 'AIモデル設定完了', 1)
        }

        // Use AI SDK with tools for Sequential Thinking
        let fullResponse = ''
        const toolCalls: any[] = []
        
        if (taskId) {
          updateTaskProgress(taskId, 50, 'AI分析実行中', 2)
        }
        
        setIsTyping(true) // ストリーミング開始時にisTypingをtrueに設定
        let lastFullResponse = '' // 重複チェック用
        await aiSDKService.streamResponse(
          `You are an AI assistant specialized in video production and media editing. The user wants to: ${content}. 
           Use the available tools to accomplish this task step by step. Think through the process and use tools when needed.
           ${contexts ? `Context: ${contexts.map(ctx => `@${ctx.name}`).join(', ')}` : ''}`,
          (chunk: string) => {
            fullResponse += chunk
            // 重複チェック
            if (fullResponse !== lastFullResponse) {
              setStreamingResponse(fullResponse)
              lastFullResponse = fullResponse
            }
          }
        )

        if (taskId) {
          updateTaskProgress(taskId, 80, '結果生成中', 3)
        }

        // Create Sequential Thinking plan
        const plan: SequentialThinkingPlan = {
          id: Date.now().toString(),
          steps: [
            {
              id: '1',
              type: 'thinking',
              content: `Analyzing user request: "${content}". This appears to be a request for ${content.toLowerCase().includes('video') ? 'video creation' : 'content processing'}.`,
              timestamp: new Date()
            },
            ...toolCalls.map((toolCall, index) => ({
              id: (index + 2).toString(),
              type: 'tool_call' as const,
              content: '',
              toolCall: {
                name: toolCall.name,
                arguments: toolCall.arguments
              },
              timestamp: new Date()
            }))
          ],
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        setCurrentPlan(plan)

        // Add assistant message
        const assistantMessage: ChatMessageProps = {
          id: (Date.now() + 1).toString(),
          content: fullResponse,
          role: 'assistant',
        }
        setMessages(prev => [...prev, assistantMessage])
        setStreamingResponse('')
        setIsTyping(false) // ストリーミング完了時にisTypingをfalseに設定
        setIsGenerating(false)
      } else {
        // Fallback to mock Sequential Thinking
        const mockPlan: SequentialThinkingPlan = {
          id: Date.now().toString(),
          steps: [
            {
              id: '1',
              type: 'thinking',
              content: `Analyzing user request: "${content}". This appears to be a request for ${content.toLowerCase().includes('video') ? 'video creation' : 'content processing'}.`,
              timestamp: new Date()
            },
            {
              id: '2',
              type: 'tool_call',
              content: '',
              toolCall: {
                name: content.toLowerCase().includes('url') ? 'web_scraper' : 'file_processor',
                arguments: content.toLowerCase().includes('url') ? { url: 'https://example.com' } : { filePath: 'input.txt', type: 'text' }
              },
              timestamp: new Date()
            },
            {
              id: '3',
              type: 'result',
              content: '',
              result: { success: true, processedData: 'Sample processed data' },
              timestamp: new Date()
            }
          ],
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        setCurrentPlan(mockPlan)

        // タスク完了
        if (taskId) {
          completeTask(taskId, true)
        }

        setTimeout(() => {
          const assistantMessage: ChatMessageProps = {
            id: (Date.now() + 1).toString(),
            content: `I've processed your request using Sequential Thinking! Here's what I did:\n\n1. Analyzed your request\n2. Used appropriate tools to process the content\n3. Generated the results\n\n${content.toLowerCase().includes('video') ? 'Your video is ready!' : 'Your content has been processed successfully!'}`,
            role: 'assistant',
          }
          setMessages(prev => [...prev, assistantMessage])
          setIsTyping(false)
          setIsGenerating(false)
        }, 3000)
      }
    } catch (error) {
      console.error('Error in Sequential Thinking:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastError(errorMessage)
      
      // タスクエラー
      if (taskId) {
        completeTask(taskId, false)
      }
      
      const assistantMessage: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        content: `❌ Sequential Thinking failed: ${errorMessage}`,
        role: 'assistant',
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsGenerating(false)
    } finally {
      setIsTyping(false)
      setIsGenerating(false)
      setLoadingState('idle')
      setIsAgentMode(false)
    }
  }

  const handleRegularChatRequest = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>, files?: File[], searchContext?: string) => {
    let taskId: string | undefined
    try {

      // 画像生成リクエストの検出（より柔軟な検出）
      const isImageGenerationRequest = createImageEnabled && (
        content.toLowerCase().includes('画像を生成') || 
        content.toLowerCase().includes('create image') ||
        content.toLowerCase().includes('generate image') ||
        content.toLowerCase().includes('draw') ||
        content.toLowerCase().includes('paint') ||
        content.toLowerCase().includes('画像を作成') ||
        content.toLowerCase().includes('絵を描いて') ||
        content.toLowerCase().includes('画像') && content.toLowerCase().includes('作って') ||
        content.toLowerCase().includes('picture') && content.toLowerCase().includes('create') ||
        content.toLowerCase().includes('image') && content.toLowerCase().includes('generate')
      )

      if (isImageGenerationRequest) {
        console.log('🖼️ Image generation request detected')
        console.log('📊 Image generation settings:', {
          createImageEnabled,
          generationSettings: generationSettings.image,
          content: content.substring(0, 100) + '...'
        })
        await handleImageGenerationRequest(content)
        return
      }

      // 検索コンテキストを含めてcontentを拡張
      let enhancedContent = content
      if (searchContext) {
        enhancedContent = `${searchContext}**ユーザーからの質問:**\n${content}`
      }
      
      // 入力分析を実行（Audioの状態を含める）
      const analysis = inputAnalyzer.analyzeInput(enhancedContent, { 
        files,
        audioEnabled: audioEnabled && generationSettings.audio.enabled
      })
      setCurrentAnalysis(analysis)
      
      console.log('Input Analysis:', analysis)

      // タスク実行を開始
      taskId = await startTask({
        taskType: analysis.complexity === 'complex' ? 'analysis' : 'generation',
        title: analysis.suggestedAgent && analysis.suggestedAgent !== 'file_processor' ? `${analysis.suggestedAgent} Agent Execution` : 'Chat Response Generation',
        description: `ユーザーのリクエスト「${content.substring(0, 50)}${content.length > 50 ? '...' : ''}」を処理中`,
        estimatedDuration: analysis.complexity === 'complex' ? 15000 : 8000,
        metadata: {
          complexity: analysis.complexity,
          priority: analysis.complexity === 'complex' ? 'high' : 'medium',
          resources: files && files.length > 0 ? ['File Processing', 'AI Model'] : ['AI Model']
        }
      })
      
      // Router Agent Systemが利用可能で、Router Agentが必要な場合
      if (llmManager && analysis.needsRouterAgent) {
        // エージェント情報を設定（reasoningは非表示）
        setAgentInfo({
          type: analysis.suggestedAgent || null,
          confidence: analysis.confidence,
          reasoning: ''
        })
        
        // Router Agent Systemで処理
        const response = await llmManager.routeAndExecute(enhancedContent, {
          files,
          contexts,
          analysis
        })
        
        // Audioが有効な場合は、テキストレスポンスを非表示にしてTTS処理のみを実行
        const shouldHideInAudioMode = audioEnabled && generationSettings.audio.enabled
        
        // 空のレスポンスや無効なレスポンスの場合はメッセージを追加しない
        if (response.content && 
            response.content.trim() !== '' && 
            response.content !== '{}' && 
            response.content !== '[]' && 
            response.content !== 'null' && 
            response.content !== 'undefined' &&
            response.content !== '[object Object]' &&
            response.content !== '[object Array]' &&
            !/^\s*\{\s*\}\s*$/.test(response.content) &&
            !/^\s*\[\s*\]\s*$/.test(response.content) &&
            !response.content.includes('[object Object]') &&
            !response.content.includes('[object Array]') &&
            !response.content.includes('{}') &&
            !response.content.includes('[]') &&
            !shouldHideInAudioMode) {
          
          // アシスタントメッセージを追加
          const assistantMessage: ChatMessageProps = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content: response.content,
            role: 'assistant',
            images: response.images, // 生成された画像データを追加
            metadata: response.agentType && response.agentType !== 'file_processor' ? {
              agentType: response.agentType,
              confidence: response.confidence || analysis.confidence,
              executionTime: response.executionTime,
              complexity: analysis.complexity,
              title: `${response.agentType} Agent Execution`
            } : {
              title: 'Chat Response Generation'
            }
          }
          
          console.log('✅ Adding Router Agent message:', assistantMessage)
          setMessages(prev => [...prev, assistantMessage])
        } else {
          if (shouldHideInAudioMode) {
            console.log('🎵 Audio mode active - hiding text response for TTS processing')
          } else {
            console.log('❌ Skipping empty Router Agent response:', response.content)
          }
        }
        
        // Audioが有効な場合はテキスト抽出機能付きTTS処理を実行
        if (audioEnabled && generationSettings.audio.enabled) {
          console.log('🎵 Audio enabled, performing TTS processing with text extraction')
          await processTTSWithTextExtraction(content)
        }
        
        return
      }
      
      // 通常のLLM処理（Router Agentが不要な場合）
      setAgentInfo(null)
      
      // 現在選択されているモデルを確認し、適切なサービスを選択
      if (currentSelectedModel && currentSelectedModel !== 'auto') {
        const [selectedProviderId, selectedModelId] = currentSelectedModel.split(':')
        
        // OllamaまたはLlamaCppモデルの場合、LLM Managerを使用
        if (selectedProviderId === 'ollama' || selectedProviderId === 'llama-cpp') {
          if (llmManager) {
            // LLM Managerを使用してチャット処理
            const response = await llmManager.processUserRequestLegacy(enhancedContent, {
              files,
              contexts,
              analysis
            })
            
            // レスポンスの内容を取得
            let responseContent = ''
            if (typeof response === 'string') {
              responseContent = response
            } else if (response && typeof response === 'object') {
              // 優先順位: content > response > text
              responseContent = response.content || response.response || response.text || ''
              
              // デバッグ用：レスポンスが空の場合のログ
              if (!responseContent || responseContent.trim() === '') {
                console.warn('Empty response content detected:', {
                  content: response.content,
                  response: response.response,
                  text: response.text,
                  fullResponse: response
                })
              }
            } else {
              responseContent = 'Error: Invalid response format'
            }
            
            // デバッグ用：レスポンス内容をログ出力
            console.log('🔍 Response content check:', {
              responseContent: responseContent?.substring(0, 50) + (responseContent && responseContent.length > 50 ? '...' : ''),
              isEmpty: !responseContent || responseContent.trim() === '',
              isObject: responseContent === '{}',
              isArray: responseContent === '[]',
              isNull: responseContent === 'null',
              isUndefined: responseContent === 'undefined',
              hasWhitespaceOnly: /^\s*$/.test(responseContent),
              hasWhitespaceObject: /^\s*\{\s*\}\s*$/.test(responseContent),
              hasWhitespaceArray: /^\s*\[\s*\]\s*$/.test(responseContent)
            })
            
            // Audioが有効な場合は、テキストレスポンスを非表示にしてTTS処理のみを実行
            const shouldHideInAudioMode = audioEnabled && generationSettings.audio.enabled
            
            // 空のレスポンスや無効なレスポンスの場合はメッセージを追加しない
            if (responseContent && 
                responseContent.trim() !== '' && 
                responseContent !== '{}' && 
                responseContent !== '[]' && 
                responseContent !== 'null' && 
                responseContent !== 'undefined' &&
                responseContent !== '[object Object]' &&
                responseContent !== '[object Array]' &&
                !/^\s*\{\s*\}\s*$/.test(responseContent) &&
                !/^\s*\[\s*\]\s*$/.test(responseContent) &&
                !responseContent.includes('[object Object]') &&
                !responseContent.includes('[object Array]') &&
                !responseContent.includes('{}') &&
                !responseContent.includes('[]') &&
                !shouldHideInAudioMode) {
              const assistantMessage: ChatMessageProps = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                content: responseContent,
                role: 'assistant',
                metadata: {
                  title: analysis.suggestedAgent && analysis.suggestedAgent !== 'file_processor' ? `${analysis.suggestedAgent} Agent Execution` : 'Chat Response Generation'
                }
              }
              
              console.log('✅ Adding assistant message:', assistantMessage)
              setMessages(prev => [...prev, assistantMessage])
            } else {
              if (shouldHideInAudioMode) {
                console.log('🎵 Audio mode active - hiding text response for TTS processing')
              } else {
                console.log('❌ Skipping empty/invalid response:', responseContent)
              }
            }
            
            // Audioが有効な場合はTTS処理を実行（ユーザーの入力テキストを処理）
            if (audioEnabled && generationSettings.audio.enabled) {
              console.log('🎵 Audio enabled, performing TTS processing for user input')
              await processTTS(content, content)
            }
            
            return
          }
        } else {
          // 通常のAPIプロバイダーの場合、AI SDK Serviceを使用
          const apiKey = providerApiKeys[selectedProviderId]
          if (apiKey) {
            await aiSDKService.configureProvider({
              providerId: selectedProviderId,
              modelId: selectedModelId,
              apiKey
            })
          }
        }
      }
      
      // 現在選択されているモデルがOllamaまたはLlamaCppでない場合のみ、AI SDK Serviceを使用
      const shouldUseAISDK = !currentSelectedModel || 
        (!currentSelectedModel.startsWith('ollama:') && !currentSelectedModel.startsWith('llama-cpp:'))
      
      if (shouldUseAISDK && aiSDKService.isProviderConfigured()) {
        // 現在のプロバイダー設定を取得
        const currentConfig = aiSDKService.getCurrentConfig()
        if (!currentConfig) {
          throw new Error('No provider configured')
        }

        // プロバイダーのAPI Keyを取得
        const apiKey = providerApiKeys[currentConfig.providerId]
        if (!apiKey) {
          throw new Error(`API Key not found for provider: ${currentConfig.providerId}`)
        }

        // API Keyでプロバイダーを再設定
        await aiSDKService.configureProvider({
          ...currentConfig,
          apiKey: apiKey
        })

        // ファイルがある場合はGemini APIを使用
        if (files && files.length > 0 && currentConfig.providerId === 'google') {
          await handleFileChatRequest(enhancedContent, contexts, files, apiKey)
          return
        }

        // 通常のテキストチャット（ファイルなし）
        const chatHistory = messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        }))

        // 新しいユーザーメッセージを追加
        const updatedHistory = [
          ...chatHistory,
          { role: 'user' as const, content: enhancedContent }
        ]

        // システムメッセージを追加（コンテキストがある場合）
        if (contexts && contexts.length > 0) {
          const systemMessage = {
            role: 'system' as const,
            content: `Context: ${contexts.map(ctx => `@${ctx.name}`).join(', ')}`
          }
          updatedHistory.unshift(systemMessage)
        }

        // ストリーミングレスポンス用のアシスタントメッセージを作成
        const assistantMessageId = (Date.now() + 1).toString()
        const assistantMessage: ChatMessageProps = {
          id: assistantMessageId,
          content: '', // 空文字列に設定
          role: 'assistant',
          metadata: {
            title: analysis.suggestedAgent && analysis.suggestedAgent !== 'file_processor' ? `${analysis.suggestedAgent} Agent Execution` : 'Chat Response Generation'
          }
        }
        
        setStreamingResponse('')

                // タスク進捗を更新
        if (taskId) {
          updateTaskProgress(taskId, 50, 'AIモデル設定完了', 1)
        }

        // AI SDK UIのreadUIMessageStreamを使用した新しいストリーミング機能
        console.log('🚀 Starting AI streaming...')
        setIsTyping(true) // ストリーミング開始時にisTypingをtrueに設定
        
        // ストリーミング開始時にはメッセージを追加しない（空のメッセージを避けるため）
        // 代わりに、最初の有効なチャンクが到着した時にメッセージを追加する
        
        let lastFullResponse = '' // 重複チェック用
        let hasAddedMessage = false // メッセージ追加フラグ
        let chunkCount = 0 // チャンクカウンター
        
        console.log('🚀 Gemini 2.5 Flash Lite ストリーミング開始')
        
        await aiSDKService.streamUIMessageResponse(
          updatedHistory,
          (chunk: string) => {
            chunkCount++
            
            // 空のチャンクや無効なチャンクをスキップ
            if (!chunk || chunk.trim() === '' || chunk === '{}' || chunk === '[]' || chunk === 'null' || chunk === 'undefined') {
              console.log(`🔄 無効なチャンクをスキップ (チャンク ${chunkCount}):`, chunk)
              return
            }
            
            // ストリーミングチャンクを処理
            setStreamingResponse(prev => {
              const newResponse = prev + chunk
              
              // 重複チェック：前回と同じレスポンスの場合はスキップ
              if (newResponse === lastFullResponse) {
                console.log(`🔄 重複レスポンスをスキップ (チャンク ${chunkCount})`)
                return prev
              }
              lastFullResponse = newResponse
              
              console.log(`📝 チャンク ${chunkCount} 処理:`, {
                chunkLength: chunk.length,
                totalLength: newResponse.length,
                chunkPreview: chunk.substring(0, 30) + (chunk.length > 30 ? '...' : '')
              })
              
              // デバッグ用：ストリーミングチャンクの内容をログ出力
              console.log('🔍 Streaming chunk check:', {
                chunk: chunk?.substring(0, 30) + (chunk && chunk.length > 30 ? '...' : ''),
                newResponse: newResponse?.substring(0, 50) + (newResponse && newResponse.length > 50 ? '...' : ''),
                isEmpty: !newResponse || newResponse.trim() === '',
                isObject: newResponse === '{}',
                isArray: newResponse === '[]',
                isNull: newResponse === 'null',
                isUndefined: newResponse === 'undefined',
                hasWhitespaceOnly: /^\s*$/.test(newResponse),
                hasWhitespaceObject: /^\s*\{\s*\}\s*$/.test(newResponse),
                hasWhitespaceArray: /^\s*\[\s*\]\s*$/.test(newResponse)
              })
              
              // Audioが有効でgeneralエージェントでmoderate複雑度の場合は、TTS処理中はUIに表示しない
              const shouldHideInAudioMode = audioEnabled && generationSettings.audio.enabled
              
              // 空でないレスポンスの場合のみメッセージを更新または追加（一度だけ）
              if (newResponse && 
                  newResponse.trim() !== '' && 
                  newResponse !== '{}' && 
                  newResponse !== '[]' && 
                  newResponse !== 'null' && 
                  newResponse !== 'undefined' &&
                  newResponse !== '[object Object]' &&
                  newResponse !== '[object Array]' &&
                  !/^\s*\{\s*\}\s*$/.test(newResponse) &&
                  !/^\s*\[\s*\]\s*$/.test(newResponse) &&
                  !newResponse.includes('[object Object]') &&
                  !newResponse.includes('[object Array]') &&
                  !newResponse.includes('{}') &&
                  !newResponse.includes('[]') &&
                  !hasAddedMessage &&
                  !shouldHideInAudioMode &&
                  chunk.length > 0) { // チャンクが空でないことを確認
                
                hasAddedMessage = true
                
                // メッセージ追加を非同期で実行（無限ループを防ぐため）
                setTimeout(() => {
                  setMessages(prevMessages => {
                    // 既存のメッセージがあるかチェック
                    const existingMessage = prevMessages.find(msg => msg.id === assistantMessageId)
                    
                    if (existingMessage) {
                      // 既存のメッセージを更新
                      return prevMessages.map(msg => 
                        msg.id === assistantMessageId 
                          ? { ...msg, content: newResponse }
                          : msg
                      )
                    } else {
                      // 新しいメッセージを追加
                      return [...prevMessages, { ...assistantMessage, content: newResponse }]
                    }
                  })
                }, 0)
              }
              
              return newResponse
            })
          },
          (fullResponse: string) => {
            // ストリーミング完了時の処理
            console.log('✅ AI streaming completed')
            
            // デバッグ用：ストリーミング完了時のレスポンス内容をログ出力
            console.log('🔍 Streaming completion check:', {
              fullResponse: fullResponse?.substring(0, 50) + (fullResponse && fullResponse.length > 50 ? '...' : ''),
              isEmpty: !fullResponse || fullResponse.trim() === '',
              isObject: fullResponse === '{}',
              isArray: fullResponse === '[]',
              isNull: fullResponse === 'null',
              isUndefined: fullResponse === 'undefined',
              hasWhitespaceOnly: /^\s*$/.test(fullResponse),
              hasWhitespaceObject: /^\s*\{\s*\}\s*$/.test(fullResponse),
              hasWhitespaceArray: /^\s*\[\s*\]\s*$/.test(fullResponse)
            })
            
            // Audioが有効な場合は、テキストレスポンスを非表示にしてTTS処理のみを実行
            const shouldHideInAudioMode = audioEnabled && generationSettings.audio.enabled
            
            // 空のレスポンスや無効なレスポンスの場合はメッセージを削除
            if (!fullResponse || 
                fullResponse.trim() === '' || 
                fullResponse.length === 0 ||
                fullResponse === '{}' ||
                fullResponse === '[]' ||
                fullResponse === 'null' ||
                fullResponse === 'undefined' ||
                fullResponse === '[object Object]' ||
                fullResponse === '[object Array]' ||
                fullResponse.replace(/\s/g, '').length === 0 ||
                /^\s*\{\s*\}\s*$/.test(fullResponse) ||
                /^\s*\[\s*\]\s*$/.test(fullResponse) ||
                fullResponse.includes('[object Object]') ||
                fullResponse.includes('[object Array]') ||
                fullResponse.includes('{}') ||
                fullResponse.includes('[]') ||
                shouldHideInAudioMode) {
              if (shouldHideInAudioMode) {
                console.log('🎵 Audio mode active - removing text response for TTS processing')
              } else {
                console.log('🗑️ Removing empty/invalid response message')
              }
              setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
            } else {
              // 空でないレスポンスの場合のみメッセージを更新
              console.log('✅ Updating message with response:', fullResponse.substring(0, 50) + '...')
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: fullResponse }
                    : msg
                )
              )
            }
            setStreamingResponse('')
            setIsTyping(false) // ストリーミング完了時にisTypingをfalseに設定
            console.log('🔄 Streaming completed: setting isGenerating to false')
            setIsGenerating(false)
            
            // 空のメッセージを確実に削除
            setMessages(prev => prev.filter(msg => 
              msg.content && 
              msg.content.trim() !== '' && 
              msg.content.length > 0 &&
              msg.content !== ' ' &&
              msg.content !== '\n' &&
              msg.content !== '\t' &&
              msg.content !== 'Chat Response Generation' &&
              msg.content !== 'Audio Mode Active' &&
              msg.content !== '{}' &&
              msg.content !== '[]' &&
              msg.content !== 'null' &&
              msg.content !== 'undefined' &&
              msg.content !== '[object Object]' &&
              msg.content !== '[object Array]' &&
              !/^\s*$/.test(msg.content) &&
              msg.content.replace(/\s/g, '').length > 0 &&
              !/^\s*\{\s*\}\s*$/.test(msg.content) &&
              !/^\s*\[\s*\]\s*$/.test(msg.content) &&
              !msg.content.includes('[object Object]') &&
              !msg.content.includes('[object Array]') &&
              !msg.content.includes('{}') &&
              !msg.content.includes('[]')
            ))
            
            // ファクトチェック処理を実行
            if (factCheckingSettings.enabled && factCheckingSettings.autoCheck && fullResponse) {
              // 非同期でファクトチェックを実行
              performFactCheck(fullResponse).then(factCheckResult => {
                if (factCheckResult && !factCheckResult.isFactual) {
                  // ファクトチェックで問題が見つかった場合、警告メッセージを追加
                  const warningMessage: ChatMessageProps = {
                    id: `fact-check-${Date.now()}`,
                    content: `**Fact Check Warning**: This response may contain inaccuracies.\n\n**Issues Found**:\n${factCheckResult.issues.map(issue => `• ${issue}`).join('\n')}\n\n**Confidence**: ${factCheckResult.confidence}%\n\n**Explanation**: ${factCheckResult.explanation}`,
                    role: 'assistant',
                    metadata: {
                      title: 'Fact Check Warning'
                    }
                  }
                  setMessages(prev => [...prev, warningMessage])
                }
              }).catch(error => {
                console.error('Fact check failed:', error)
              })
            }
            
            // TTS処理を実行（テキスト抽出機能付き）
            if (audioEnabled && generationSettings.audio.enabled) {
              processTTSWithTextExtraction(content)
            }
            
            // タスク完了
            if (taskId) {
              completeTask(taskId, true)
            }
          },
          (error: Error) => {
            // エラー処理
            console.error('❌ Streaming error:', error)
            
            // Audioが有効な場合は、エラーメッセージも表示しない
            const shouldHideInAudioMode = audioEnabled && generationSettings.audio.enabled
            
            if (!shouldHideInAudioMode) {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: `❌ エラーが発生しました: ${error.message}` }
                    : msg
                )
              )
            } else {
              console.log('🎵 Audio mode active - hiding error message for TTS processing')
              // エラーメッセージを削除
              setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
            }
            
            setStreamingResponse('')
            setLastError(error.message)
            setIsTyping(false) // エラー時もisTypingをfalseに設定
            console.log('🔄 Streaming error: setting isGenerating to false')
            setIsGenerating(false)
            
            // 空のメッセージを確実に削除
            setMessages(prev => prev.filter(msg => 
              msg.content && 
              msg.content.trim() !== '' && 
              msg.content.length > 0 &&
              msg.content !== ' ' &&
              msg.content !== '\n' &&
              msg.content !== '\t' &&
              msg.content !== 'Chat Response Generation' &&
              msg.content !== 'Audio Mode Active' &&
              msg.content !== '{}' &&
              msg.content !== '[]' &&
              msg.content !== 'null' &&
              msg.content !== 'undefined' &&
              msg.content !== '[object Object]' &&
              msg.content !== '[object Array]' &&
              !/^\s*$/.test(msg.content) &&
              msg.content.replace(/\s/g, '').length > 0 &&
              !/^\s*\{\s*\}\s*$/.test(msg.content) &&
              !/^\s*\[\s*\]\s*$/.test(msg.content) &&
              !msg.content.includes('[object Object]') &&
              !msg.content.includes('[object Array]') &&
              !msg.content.includes('{}') &&
              !msg.content.includes('[]')
            ))
            
            // タスクエラー
            if (taskId) {
              completeTask(taskId, false)
            }
          }
        )
      } else {
        // Fallback to mock response
        const mockResponse = `I understand you're asking about: "${content}". However, I need to be configured with an AI provider to provide meaningful responses. Please configure an AI provider in the settings.`
        
        const assistantMessage: ChatMessageProps = {
          id: (Date.now() + 1).toString(),
          content: mockResponse,
          role: 'assistant',
          metadata: {
            title: 'Chat Response Generation'
          }
        }
        setMessages(prev => [...prev, assistantMessage])
        setLastError('No AI provider configured')
        setIsGenerating(false)
      }
    } catch (error) {
      console.error('Error in handleRegularChatRequest:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setLastError(errorMessage)
      
      // エラーメッセージを追加
      const errorResponse: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        content: `❌ エラーが発生しました: ${errorMessage}`,
        role: 'assistant',
        metadata: {
          title: 'Chat Response Generation'
        }
      }
      setMessages(prev => [...prev, errorResponse])
      setIsGenerating(false)
    } finally {
      console.log('🔄 Finally block: setting isTyping to false, isGenerating to false and loadingState to idle')
      setIsTyping(false)
      setIsGenerating(false)
      setLoadingState('idle')
    }
  }

  // YouTube動画リクエスト処理
  const handleYouTubeVideoRequest = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>) => {
    try {
      // Audioがオンの場合はテキスト生成をスキップ
      if (audioEnabled && generationSettings.audio.enabled) {
        // 空のメッセージは追加しない
        return
      }

      if (aiSDKService.isProviderConfigured()) {
        // 現在のプロバイダー設定を取得
        const currentConfig = aiSDKService.getCurrentConfig()
        if (!currentConfig) {
          throw new Error('No provider configured')
        }

        // プロバイダーのAPI Keyを取得
        const apiKey = providerApiKeys[currentConfig.providerId]
        if (!apiKey) {
          throw new Error(`API Key not found for provider: ${currentConfig.providerId}`)
        }

        // API Keyでプロバイダーを再設定
        await aiSDKService.configureProvider({
          ...currentConfig,
          apiKey: apiKey
        })

        // ストリーミングレスポンス用のアシスタントメッセージを作成
        const assistantMessageId = (Date.now() + 1).toString()
        const assistantMessage: ChatMessageProps = {
          id: assistantMessageId,
          content: '',
          role: 'assistant',
        }
        
        // アシスタントメッセージを即座に追加（ストリーミング表示用）
        setMessages(prev => [...prev, assistantMessage])

        // GeminiFileServiceを初期化
        const geminiFileService = new GeminiFileService()
        await geminiFileService.configure(apiKey, 'gemini-1.5-flash')

        // YouTube動画についてチャット
        const question = content.trim() || 'この動画について説明してください'
        const chatResponse = await geminiFileService.chatAboutVideo(content.trim(), question)

        // レスポンスを表示
        const fullResponse = chatResponse.text
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullResponse }
              : msg
          )
        )
        setStreamingResponse('')
        setIsGenerating(false)
        
        // TTS処理は最後のストリーミング完了時に実行されるため、ここでは実行しない

      } else {
        // Fallback to mock response
        const mockResponse = `I understand you want to analyze a YouTube video: "${content}". However, I need to be configured with an AI provider to provide meaningful responses. Please configure an AI provider in the settings.`
        
        const assistantMessage: ChatMessageProps = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: mockResponse,
          role: 'assistant',
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // TTS処理は最後のストリーミング完了時に実行されるため、ここでは実行しない
        
        setLastError('No AI provider configured')
        setIsGenerating(false)
      }
    } catch (error) {
      console.error('Error in handleYouTubeVideoRequest:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setLastError(errorMessage)
      
      // エラーメッセージを追加
      const errorResponse: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        content: `❌ YouTube動画分析エラー: ${errorMessage}`,
        role: 'assistant',
      }
      setMessages(prev => [...prev, errorResponse])
      setStreamingResponse('')
      setIsGenerating(false)
    } finally {
      setIsTyping(false)
      setIsGenerating(false)
      setLoadingState('idle')
    }
  }

  // ファイルチャットリクエスト処理
  const handleFileChatRequest = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>, files?: File[], apiKey?: string) => {
    if (!files || files.length === 0 || !apiKey) {
      throw new Error('Files and API key are required for file chat')
    }

    // Audioがオンの場合はテキスト生成をスキップ
    if (audioEnabled && generationSettings.audio.enabled) {
      // 空のメッセージは追加しない
      return
    }

    try {
      // GeminiFileServiceを初期化
      const geminiFileService = new GeminiFileService()
      await geminiFileService.configure(apiKey, 'gemini-1.5-flash')

      // ストリーミングレスポンス用のアシスタントメッセージを作成
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: ChatMessageProps = {
        id: assistantMessageId,
        content: '',
        role: 'assistant',
      }
      
      // アシスタントメッセージを即座に追加（ストリーミング表示用）
      setMessages(prev => [...prev, assistantMessage])

      // ファイルをアップロード
      const uploadPromises = files.map(async (file, index) => {
        try {
          const fileType = file.type.startsWith('video/') ? '🎥' : 
                          file.type.startsWith('image/') ? '🖼️' : 
                          file.type.startsWith('audio/') ? '🎵' : '📄'
          
          // 動画ファイルの場合は追加情報を表示
          if (file.type.startsWith('video/')) {
            const fileSizeMB = file.size / 1024 / 1024
            if (fileSizeMB > 15) {
            }
          }
          
          // 音声ファイルの場合は追加情報を表示
          if (file.type.startsWith('audio/')) {
            const fileSizeMB = file.size / 1024 / 1024
            if (fileSizeMB > 15) {
            }
          }
          
          // Fileオブジェクトを直接アップロード
          const uploadResponse = await geminiFileService.uploadFileObject(file, file.name)
          
          console.log(`File uploaded successfully: ${file.name}`)
          return uploadResponse.file.uri
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error)
          
          // 動画ファイルの場合はより詳細なエラーメッセージ
          if (file.type.startsWith('video/')) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            if (errorMessage.includes('動画が長すぎます')) {
              throw new Error(`動画ファイル "${file.name}" が長すぎます。最大60秒まで対応しています。`)
            } else if (errorMessage.includes('動画ファイルが大きすぎます')) {
              throw new Error(`動画ファイル "${file.name}" が大きすぎます。最大50MBまで対応しています。`)
            } else if (errorMessage.includes('動画ファイルの読み込みに失敗しました')) {
              throw new Error(`動画ファイル "${file.name}" の読み込みに失敗しました。ファイルが破損しているか、サポートされていない形式の可能性があります。`)
            }
          }
          
          // 音声ファイルの場合はより詳細なエラーメッセージ
          if (file.type.startsWith('audio/')) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            if (errorMessage.includes('音声が長すぎます')) {
              throw new Error(`音声ファイル "${file.name}" が長すぎます。最大30分まで対応しています。`)
            } else if (errorMessage.includes('音声ファイルが大きすぎます')) {
              throw new Error(`音声ファイル "${file.name}" が大きすぎます。最大50MBまで対応しています。`)
            } else if (errorMessage.includes('音声ファイルの読み込みに失敗しました')) {
              throw new Error(`音声ファイル "${file.name}" の読み込みに失敗しました。ファイルが破損しているか、サポートされていない形式の可能性があります。`)
            }
          }
          
          throw new Error(`Failed to upload file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      })

      const fileUris = await Promise.all(uploadPromises)
      
      const question = content.trim() || 'このファイルについて説明してください'
      
      let chatResponse
      if (files.length === 1) {
        // 単一ファイルの場合
        const file = files[0]
        
        if (file.type.startsWith('video/')) {
          // 動画ファイルの場合は専用メソッドを使用
          chatResponse = await geminiFileService.chatAboutVideo(fileUris[0], question)
        } else if (file.type.startsWith('audio/')) {
          // 音声ファイルの場合は専用メソッドを使用
          chatResponse = await geminiFileService.chatAboutAudio(fileUris[0], question)
        } else {
          // その他のファイル
          chatResponse = await geminiFileService.chatAboutFile(fileUris[0], question)
        }
      } else {
        // 複数ファイルの場合（現在は最初のファイルのみ処理）
        console.log(`Multiple files detected (${files.length}), processing first file: ${files[0].name}`)
        const firstFile = files[0]
        
        if (firstFile.type.startsWith('video/')) {
          chatResponse = await geminiFileService.chatAboutVideo(fileUris[0], question)
        } else if (firstFile.type.startsWith('audio/')) {
          chatResponse = await geminiFileService.chatAboutAudio(fileUris[0], question)
        } else {
          chatResponse = await geminiFileService.chatAboutFile(fileUris[0], question)
        }
      }

      // レスポンスを表示
      const fullResponse = chatResponse.text
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullResponse }
            : msg
        )
      )
      setStreamingResponse('')
      setIsGenerating(false)
      
      // TTS処理は最後のストリーミング完了時に実行されるため、ここでは実行しない

    } catch (error) {
      console.error('Error in handleFileChatRequest:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setLastError(errorMessage)
      
      // エラーメッセージを追加
      const errorResponse: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        content: `❌ ファイル処理エラー: ${errorMessage}`,
        role: 'assistant',
      }
      setMessages(prev => [...prev, errorResponse])
      setStreamingResponse('')
      setIsGenerating(false)
    } finally {
      setIsTyping(false)
      setIsGenerating(false)
      setLoadingState('idle')
    }
  }

  const handleFilesAdded = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files])
  }

  const handleTranscriptionComplete = (text: string) => {
    // 文字起こし結果をチャットに送信
    handleSendMessage(`音声の文字起こし結果:\n\n${text}`)
  }

  const handleAttachFiles = () => {
    // This function is no longer needed as we use direct file selection
  }

  const handleCancelSequentialThinking = () => {
    setShowSequentialThinking(false)
    setCurrentPlan(null)
    setIsTyping(false)
    setIsAgentMode(false)
  }

  const handleProviderSelect = async (config: AIProviderConfig) => {
    try {
      setLastError(null)
      
      await aiSDKService.configureProvider(config)
      setCurrentProviderConfig(config)
      
      console.log(`Provider configured: ${config.providerId} with model: ${config.modelId}`)
    } catch (error) {
      console.error('Failed to configure provider:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastError(errorMessage)
    }
  }

  // 現在選択されているモデルを追跡
  const [currentSelectedModel, setCurrentSelectedModel] = useState<string | null>(null)

  // モデルダウンロード進捗処理関数
  const handleModelDownloadProgress = (progress: any, modelId?: string) => {
    if (progress && typeof progress === 'object') {
      console.log('📊 Received progress:', progress)
      console.log('📊 Progress keys:', Object.keys(progress))
      console.log('📊 actualModelId:', progress.actualModelId)
      console.log('📊 originalModelId:', progress.originalModelId)
      console.log('📊 modelId:', progress.modelId)
      console.log('📊 message:', progress.message)
      console.log('📊 Input modelId parameter:', modelId)
      
      // 進捗情報の構造を統一（ollama-service.tsからの新しい形式に対応）
      const status = progress.status || (progress.message?.includes('completed') ? 'completed' : 'downloading')
      const progressValue = progress.progress || progress.percentage || 0
      const downloaded = progress.downloaded || 0
      const total = progress.total || 0
      
      console.log(`📊 Parsed progress: status=${status}, progress=${progressValue}, downloaded=${downloaded}, total=${total}`)
      
      // モデル名を抽出（providerId:modelId の形式から modelId のみを取得）
      let modelName = 'Unknown Model'
      const targetModelId = modelId || currentSelectedModel
      if (targetModelId) {
        const parts = targetModelId.split(':')
        const modelIdPart = parts.length > 1 ? parts[1] : targetModelId
        
        // 実際にダウンロードされているモデル名を取得
        // progress.modelId または progress.message から実際のモデル名を抽出
        let actualModelName = modelIdPart
        
        // プログレス情報から実際のモデル名を抽出
        if (progress.actualModelId) {
          // LLM Managerから提供された実際のモデルIDを使用
          const actualModelId = progress.actualModelId
          
          // 実際のダウンロードモデルIDから表示用モデル名へのマッピング
          const actualModelMapping: { [key: string]: string } = {
            'unsloth/Qwen3-0.6B-GGUF': 'qwen3:0.6b',
            'unsloth/Qwen3-1.7B-GGUF': 'qwen3:1.7b',
            'unsloth/Qwen3-4B-Instruct-2507-GGUF': 'qwen3:4b',
            'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF': 'qwen3:8b',
            'unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF': 'qwen3:30b',
            'unsloth/gpt-oss-20b-GGUF': 'gpt-oss-20b',
            'TheBloke/Llama-2-7B-Chat-GGUF': 'llama-2-7b-chat',
            'TheBloke/Llama-2-13B-Chat-GGUF': 'llama-2-13b-chat',
            'TheBloke/Mistral-7B-Instruct-v0.2-GGUF': 'mistral-7b-instruct',
            'TheBloke/Qwen2-7B-Instruct-GGUF': 'qwen2-7b-instruct',
            'TheBloke/CodeLlama-7B-Instruct-GGUF': 'codellama-7b-instruct',
            'TheBloke/Gemma-2-9B-IT-GGUF': 'gemma-2-9b-it'
          }
          
          actualModelName = actualModelMapping[actualModelId] || actualModelId
        } else if (progress.modelId) {
          // Ollamaモデルの場合、modelIdが実際のモデル名
          actualModelName = progress.modelId
        } else if (progress.message) {
          // メッセージからモデル名を抽出
          const message = progress.message
          
          // メッセージ内の実際のモデルIDから表示用モデル名へのマッピング
          const messageModelMapping: { [key: string]: string } = {
            'unsloth/Qwen3-0.6B-GGUF': 'qwen3:0.6b',
            'unsloth/Qwen3-1.7B-GGUF': 'qwen3:1.7b',
            'unsloth/Qwen3-4B-Instruct-2507-GGUF': 'qwen3:4b',
            'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF': 'qwen3:8b',
            'unsloth/Qwen3-30B-A3B-Instruct-2507-GGUF': 'qwen3:30b',
            'unsloth/gpt-oss-20b-GGUF': 'gpt-oss-20b',
            'TheBloke/Llama-2-7B-Chat-GGUF': 'llama-2-7b-chat',
            'TheBloke/Llama-2-13B-Chat-GGUF': 'llama-2-13b-chat',
            'TheBloke/Mistral-7B-Instruct-v0.2-GGUF': 'mistral-7b-instruct',
            'TheBloke/Qwen2-7B-Instruct-GGUF': 'qwen2-7b-instruct',
            'TheBloke/CodeLlama-7B-Instruct-GGUF': 'codellama-7b-instruct',
            'TheBloke/Gemma-2-9B-IT-GGUF': 'gemma-2-9b-it'
          }
          
          // メッセージ内でマッチするモデルIDを検索
          for (const [modelId, displayName] of Object.entries(messageModelMapping)) {
            if (message.includes(modelId)) {
              actualModelName = displayName
              break
            }
          }
          
          // マッチしない場合は元のモデル名を使用
          if (!actualModelName) {
            actualModelName = modelIdPart
          }
        }
        
        // デバッグ用：実際のモデル名をログ出力
        console.log(`📊 Debug - actualModelName: ${actualModelName}, modelIdPart: ${modelIdPart}, progress.modelId: ${progress.modelId}, progress.message: ${progress.message}`)
        
        // モデル名をより詳細に表示
        const modelNameMapping: { [key: string]: string } = {
          'qwen3': 'Qwen3 4B Instruct',
          'qwen3:0.6b': 'Qwen3 0.6B',
          'qwen3-0.6b': 'Qwen3 0.6B',
          'qwen3:1.7b': 'Qwen3 1.7B',
          'qwen3-1.7b': 'Qwen3 1.7B',
          'qwen3-4b': 'Qwen3 4B Instruct',
          'qwen3-8b': 'Qwen3 8B',
          'qwen3-30b': 'Qwen3 30B Instruct',
          'gpt-oss-20b': 'GPT-OSS-20B',
          'gpt-oss-20b-GGUF': 'GPT-OSS-20B',
          'gemma3:1b': 'Gemma3 1B',
          'gemma-2-9b-it': 'Gemma 2 9B IT',
          'llama-2-7b-chat': 'Llama 2 7B Chat',
          'llama-2-13b-chat': 'Llama 2 13B Chat',
          'mistral-7b-instruct': 'Mistral 7B Instruct',
          'qwen2-7b-instruct': 'Qwen2 7B Instruct',
          'codellama-7b-instruct': 'CodeLlama 7B Instruct'
        }
        
        modelName = modelNameMapping[actualModelName] || actualModelName
      }
      
      console.log(`📊 Setting model download state: ${modelName}, progress: ${progressValue}%, downloaded: ${downloaded}, total: ${total}`)
      
      const newState = {
        isDownloading: status === 'starting' || status === 'downloading' || status === 'verifying',
        modelName: modelName,
        progress: progressValue,
        status: status,
        downloadedBytes: downloaded,
        totalBytes: total
      }
      
      console.log(`📊 New model download state:`, newState)
      setModelDownloadState(newState)
      
      // modelDownloadStateが使用されている場合は、downloadProgressをクリア
      if (newState.isDownloading) {
        setDownloadProgress(null)
      }
      
      // ダウンロード完了またはエラーの場合、少し遅延してから状態をリセット
      if (status === 'completed' || status === 'error') {
        setTimeout(() => {
          setModelDownloadState({
            isDownloading: false,
            modelName: '',
            progress: 0,
            status: 'starting',
            downloadedBytes: undefined,
            totalBytes: undefined
          })
        }, 3000) // 3秒後にリセット
      }
    }
  }

  // モデル選択ハンドラー
  const handleModelSelect = async (modelId: string) => {
    try {
      setLastError(null)
      
      if (modelId === 'auto') {
        // Auto mode: 利用可能なモデルを自動選択
        console.log('Auto mode selected - finding best available model...')
        await autoConfigureProvider()
        return
      }

      // TTSモデルの場合
      if (modelId.startsWith('tts:')) {
        const ttsModelId = modelId.replace('tts:', '')
        console.log(`TTS model selected: ${ttsModelId}`)
        
        // TTSモデルに応じて適切なプロバイダーを決定
        let provider = 'google' // デフォルト
        if (ttsModelId.startsWith('inworld-tts')) {
          provider = 'inworld'
        } else if (ttsModelId.startsWith('gpt-')) {
          provider = 'openai'
        } else if (ttsModelId.startsWith('gemini-')) {
          provider = 'google'
        }
        
        // TTSモデルとプロバイダーを設定画面で有効にする
        setGenerationSettings((prev: any) => {
          const newSettings = {
            ...prev,
            audio: {
              ...prev.audio,
              provider: provider, // プロバイダーを更新
              models: {
                ...prev.audio.models,
                [ttsModelId]: {
                  ...prev.audio.models[ttsModelId],
                  enabled: true
                }
              }
            }
          }
          
          // 他のTTSモデルを無効にする
          Object.keys(newSettings.audio.models).forEach(key => {
            if (key !== ttsModelId) {
              newSettings.audio.models[key].enabled = false
            }
          })
          
          return newSettings
        })
        
        // 現在のTTSモデルを更新
        setCurrentTTSModel(ttsModelId)
        localStorage.setItem('armis_tts_model', ttsModelId)
        
        console.log(`TTS model activated: ${ttsModelId} with provider: ${provider}`)
        return
      }

      // STTモデルの場合
      if (modelId.startsWith('stt:')) {
        const sttModelId = modelId.replace('stt:', '')
        console.log(`STT model selected: ${sttModelId}`)
        
        // STT設定サービスを取得
        const sttService = STTSettingsService.getInstance()
        
        // 選択されたモデルを有効にする
        sttService.toggleModel(sttModelId)
        
        // 他のモデルを無効にする
        const settings = sttService.getSettings()
        Object.keys(settings.models).forEach(key => {
          if (key !== sttModelId) {
            settings.models[key].enabled = false
          }
        })
        
        // 設定を保存
        sttService.updateSettings({ models: settings.models })
        
        // 現在のSTTモデルを更新
        setCurrentSTTModel(sttModelId)
        localStorage.setItem('armis_stt_model', sttModelId)
        
        console.log(`STT model activated: ${sttModelId}`)
        return
      }

      // modelIdの形式: "providerId:modelId" (modelIdに:が含まれる場合がある)
      const firstColonIndex = modelId.indexOf(':')
      if (firstColonIndex === -1) {
        console.error('Invalid model ID format:', modelId)
        return
      }
      
      const providerId = modelId.substring(0, firstColonIndex)
      const selectedModelId = modelId.substring(firstColonIndex + 1)
      
      if (!providerId || !selectedModelId) {
        console.error('Invalid model ID format:', modelId)
        return
      }

      // 現在選択されているモデルを更新
      setCurrentSelectedModel(modelId)

      // OllamaまたはLlamaCppモデルの場合、自動ダウンロード機能を使用
      if (providerId === 'ollama' || providerId === 'llama-cpp') {
        if (!llmManager) {
          setLastError('LLM Manager not available')
          return
        }

        try {
          setIsDownloading(true)
          setDownloadProgress({ status: 'checking', message: 'Checking model availability...' })

          // モデル切り替えと自動ダウンロード
          await llmManager.switchToModel(selectedModelId, (progress) => {
            console.log('🔄 LLM Manager progress callback received:', progress)
            
            // ダウンロードが開始されたら「Checking model availability...」を非表示にする
            if (progress && progress.status === 'downloading') {
              setDownloadProgress(null)
            }
            // 進行状況が存在する場合のみ更新（checking状態の重複を防ぐ）
            if (progress && (progress.status === 'starting' || progress.status === 'downloading' || progress.status === 'verifying' || progress.status === 'completed' || progress.status === 'error')) {
              console.log('📊 Calling handleModelDownloadProgress with:', progress)
              handleModelDownloadProgress(progress, modelId)
            }
            console.log('Download progress:', progress)
            console.log('Progress status:', progress?.status)
            console.log('Progress message:', progress?.message)
          })

          setDownloadProgress({ status: 'completed', message: 'Model ready!' })
          console.log(`Model selected and ready: ${providerId}:${selectedModelId}`)
        } catch (error) {
          console.error('Failed to switch to model:', error)
          setLastError(`Failed to switch to model: ${error}`)
        } finally {
          setIsDownloading(false)
          setDownloadProgress(null)
        }
        return
      }

      // 通常のAPIプロバイダーの場合
      const apiKey = providerApiKeys[providerId]
      if (!apiKey) {
        setLastError(`API Key not found for provider: ${providerId}`)
        return
      }

      // プロバイダー設定を作成
      const config: AIProviderConfig = {
        providerId,
        modelId: selectedModelId,
        apiKey
      }

      // プロバイダーを設定
      await aiSDKService.configureProvider(config)
      setCurrentProviderConfig(config)
      
      console.log(`Model selected: ${providerId}:${selectedModelId}`)
    } catch (error) {
      console.error('Failed to select model:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLastError(errorMessage)
    }
  }

  return (
    <div 
      className={cn("h-full flex flex-col bg-background", className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header with Settings and CLI Buttons */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {isAgentMode && (
            <div className="flex items-center gap-1 text-blue-500">
              <Brain className="w-4 h-4" />
              <span className="text-sm">Agent Mode</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowCLI(!showCLI)}
            variant={showCLI ? "default" : "ghost"}
            size="sm"
            className="flex items-center justify-center w-8 h-8 p-0"
            title={showCLI ? 'Hide CLI' : 'Show CLI'}
          >
            <TerminalIcon className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {lastError && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{lastError}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLastError(null)}
              className="ml-auto h-6 px-2 text-xs"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Download Progress Display - Only show when modelDownloadState is not active */}
      {isDownloading && downloadProgress && !modelDownloadState.isDownloading && (
        <div className="p-3">
          <div className="flex items-center gap-2 text-white text-sm">
            <ShimmerText className="text-white">
              {downloadProgress.message}
            </ShimmerText>
            {downloadProgress.status === 'downloading' && downloadProgress.progress && (
              <span className="text-xs text-white">
                {downloadProgress.progress.percentage ? `${downloadProgress.progress.percentage.toFixed(1)}%` : ''}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tool Calls Display */}
      {currentToolCalls.length > 0 && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Wrench className="w-4 h-4" />
            <span>Using tools: {currentToolCalls.map(tc => tc.name).join(', ')}</span>
          </div>
        </div>
      )}

      {/* Sequential Thinking Panel */}
      {showSequentialThinking && (
        <div className="p-4 border-b border-border">
          <SequentialThinkingPanel
            plan={currentPlan}
            onCancel={handleCancelSequentialThinking}
          />
        </div>
      )}

      {/* Message display area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-2">
          {messages
            .filter((message) => {
              // デバッグ用：メッセージ内容をログ出力
              console.log('🔍 Message filter check:', {
                id: message.id,
                content: message.content?.substring(0, 30) + (message.content && message.content.length > 30 ? '...' : ''),
                contentLength: message.content?.length,
                isEmpty: !message.content || message.content.trim() === '',
                isObject: message.content === '{}',
                isArray: message.content === '[]',
                isNull: message.content === 'null',
                isUndefined: message.content === 'undefined',
                hasWhitespaceOnly: /^\s*$/.test(message.content),
                hasWhitespaceObject: /^\s*\{\s*\}\s*$/.test(message.content),
                hasWhitespaceArray: /^\s*\[\s*\]\s*$/.test(message.content)
              })
              
              // 空のメッセージや無効なメッセージを非表示にする（動画がある場合は除外）
              if ((!message || 
                  !message.content || 
                  message.content.trim() === '' || 
                  message.content.length === 0 ||
                  message.content === undefined ||
                  message.content === null ||
                  typeof message.content !== 'string' ||
                  message.content === 'Chat Response Generation' ||
                  message.content === ' ' ||
                  message.content === '\n' ||
                  message.content === '\t' ||
                  message.content === '{}' ||
                  message.content === '[]' ||
                  message.content === 'null' ||
                  message.content === 'undefined' ||
                  message.content === '[object Object]' ||
                  message.content === '[object Array]' ||
                  message.id === 'streaming' ||
                  /^\s*$/.test(message.content) ||
                  message.content.replace(/\s/g, '').length === 0 ||
                  message.content === 'Audio Mode Active' ||
                  // 空のオブジェクトや配列の文字列表現をチェック
                  /^\s*\{\s*\}\s*$/.test(message.content) ||
                  /^\s*\[\s*\]\s*$/.test(message.content) ||
                  // より厳密な空のオブジェクトチェック
                  message.content.includes('[object Object]') ||
                  message.content.includes('[object Array]') ||
                  message.content.includes('{}') ||
                  message.content.includes('[]')) && 
                  !message.videoUrl) {
                console.log('❌ Filtering out message:', message.id, message.content)
                return false
              }
              
              console.log('✅ Keeping message:', message.id, message.content)
              return true
            })
            .map((message) => (
              <ChatMessage 
                key={message.id} 
                {...message} 
                useEnhancedPreview={useEnhancedPreview}
                onEdit={handleMessageEdit}
                onCancelEdit={handleMessageEditCancel}
                audioEnabled={audioEnabled}
              />
            ))}
          
          {/* Agent Info Display - Hidden for Router Agents */}
          {/* {agentInfo && agentInfo.type && currentAnalysis && !isTTSProcessing && (
            <AgentInfoDisplay
              agentType={agentInfo.type}
              confidence={agentInfo.confidence}
              reasoning={agentInfo.reasoning}
              complexity={currentAnalysis.complexity}
            />
          )} */}
          {isTyping && !streamingResponse && (
                          <>
                {console.log('🔍 isTyping state:', { isTyping, loadingState, streamingResponse })}
                {loadingState === 'text' ? (
                  <JumpingDots className="text-blue-500" />
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-lg border-[0.5px] border-[#2B2B2B]">
                    <div className="flex items-center gap-2">
                      {loadingState === 'media' ? (
                        <>
                          <CircleSpinner size="sm" className="text-blue-500" />
                          <span className="text-sm text-muted-foreground">Generating...</span>
                        </>
                      ) : (
                        <>
                          <CircleSpinner size="sm" className="text-blue-500" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
          )}
          {streamingResponse && 
           streamingResponse.trim() !== '' && 
           streamingResponse.length > 0 && 
           streamingResponse !== '{}' && 
           streamingResponse !== '[]' && 
           streamingResponse !== 'null' && 
           streamingResponse !== 'undefined' &&
           !/^\s*\{\s*\}\s*$/.test(streamingResponse) &&
           !/^\s*\[\s*\]\s*$/.test(streamingResponse) && (
            <ChatMessage
              id="streaming"
              content={streamingResponse}
              role="assistant"
              isStreaming={isTyping}
              audioEnabled={audioEnabled}
            />
          )}

          {/* モデルダウンロード表示（Shimmer Effect） */}
          {modelDownloadState.isDownloading && (
            <ModelDownloadShimmer
              modelName={modelDownloadState.modelName}
              progress={modelDownloadState.progress}
              status={modelDownloadState.status}
              downloadedBytes={modelDownloadState.downloadedBytes}
              totalBytes={modelDownloadState.totalBytes}
              className="animate-in slide-in-from-bottom-2 duration-300"
            />
          )}

          {/* STT実行中表示（Shimmer Effect） */}
          {isSTTTranscribing && (
            <div className="flex items-center p-3 animate-in slide-in-from-bottom-2 duration-300">
              <ShimmerText className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Transcribing audio file...
              </ShimmerText>
              {sttFileName && (
                <span className="text-xs text-muted-foreground ml-2">
                  {sttFileName}
                </span>
              )}
            </div>
          )}

          {/* タスク実行表示（Shimmer Effect） */}
          {activeTasks
            .filter(task => !task.title.includes('Chat Response Generation'))
            .filter(task => task.status === 'running' || task.status === 'pending')
            .map((task) => (
            <TaskShimmerDisplay
              key={task.id}
              task={task}
              className="animate-in slide-in-from-bottom-2 duration-300"
            />
          ))}

          {/* ファイル作成表示 */}
          {activeFileCreations.length > 0 && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  ファイル作成中 ({activeFileCreations.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompletedFileCreations}
                  className="text-xs"
                >
                  完了済みをクリア
                </Button>
              </div>
              {activeFileCreations.map((fileCreation) => (
                <FileCreationLoader
                  key={fileCreation.id}
                  fileInfo={fileCreation}
                  className="animate-in slide-in-from-bottom-2 duration-300"
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-4">
        {/* 添付ファイル表示 */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 bg-muted rounded-lg p-2">
                {useEnhancedPreview ? (
                  <EnhancedFilePreview 
                    file={file} 
                    onRemove={() => removeAttachment(index)}
                    showPreview={true}
                    googleService={geminiFileService}
                    onTranscriptionComplete={handleTranscriptionComplete}
                  />
                ) : (
                  <EnhancedFilePreview 
                    file={file}
                    googleService={geminiFileService}
                    onTranscriptionComplete={handleTranscriptionComplete}
                  />
                )}
                {!useEnhancedPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Embedded CLI */}
        {showCLI && (
          <div className="mb-3">
            <EmbeddedCLI
              onClose={() => setShowCLI(false)}
              isMinimized={isCLIMinimized}
              onToggleMinimize={() => setIsCLIMinimized(!isCLIMinimized)}
              fontSettings={cliFontSettings}
            />
          </div>
        )}

        <PromptInputBox
          onSend={handleSendMessage}
          onAttachFiles={handleFilesAdded}
          onStop={handleStopGeneration}
          disabled={isTyping}
          placeholder=""
          modelSettings={modelSettings}
          onModelSettingsChange={handleModelSettingsChange}
          onModelSelect={handleModelSelect}
          providerApiKeys={providerApiKeys}
          loadingState={loadingState}
          selectedFiles={selectedFiles}
          currentProviderConfig={currentProviderConfig}
          isGenerating={isGenerating}
          webSearchEnabled={webSearchEnabled}
          onWebSearchToggle={handleWebSearchToggle}
          createImageEnabled={createImageEnabled}
          onCreateImageToggle={handleCreateImageToggle}
          audioEnabled={audioEnabled}
          onAudioToggle={handleAudioToggle}
          videoEnabled={videoEnabled}
          onVideoToggle={handleVideoToggle}
          onGetCurrentMessage={getCurrentMessage}
          generationSettings={generationSettings}
          onSTTStatusChange={(isTranscribing, fileName) => {
            setIsSTTTranscribing(isTranscribing)
            setSttFileName(fileName || '')
          }}
        />
      </div>

      {/* ドラッグオーバーレイ */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50"
          >
            <div className="text-center">
              <Paperclip className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm font-medium">ファイルをドロップしてアップロード</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Settings Modal */}
      {showSettings && (
        <ArmisSettings
          onClose={() => setShowSettings(false)}
          onProviderSelect={handleProviderSelect}
                  currentModelSettings={modelSettings}
        onModelSettingsChange={handleModelSettingsChange}
          providerApiKeys={providerApiKeys}
          onProviderApiKeysChange={setProviderApiKeys}
          llmManager={llmManager}
          generationSettings={generationSettings}
          onGenerationSettingsChange={setGenerationSettings}
          onCliFontSettingsChange={handleCliFontSettingsChange}
          currentCliFontSettings={cliFontSettings}
          currentTheme={theme}
          onThemeChange={setTheme}
          factCheckingSettings={factCheckingSettings}
          onFactCheckingSettingsChange={handleFactCheckingSettingsChange}
        />
      )}


    </div>
  )
}
