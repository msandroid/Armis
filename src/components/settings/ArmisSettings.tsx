import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { 
  Settings, 
  Brain, 
  FileText, 
  Database, 
  BrainCircuit, 
  Network, 
  Wrench, 
  Monitor, 
  Download,
  Upload,
  Save,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  Sparkles,
  Search,
  Filter,
  Grid,
  List,
  ArrowRight,
  Image,
  Video,
  Music,
  Code,
  Type,
  Key,
  Square,
  Moon,
  Sun,
  Palette,
  BookOpen,
  Mic
} from 'lucide-react'
import { getProviderIcon, CuboidIcon } from '@/components/icons/provider-icons'
import { AIProviderConfig, AVAILABLE_PROVIDERS, EnabledModel, ModelSettings, AIModel } from '@/types/ai-sdk'
import { AISDKService } from '@/services/llm/ai-sdk-service'
import LangChainAgentsService, { LangChainAgentConfig, AgentCreationOptions } from '@/services/agent/langchain-agents-service'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { STTSettingsPanel } from './STTSettingsPanel'





interface ArmisSettingsProps {
  onClose: () => void
  className?: string
  onProviderSelect?: (config: AIProviderConfig) => Promise<void>
  onModelSettingsChange?: (settings: ModelSettings) => void
  currentModelSettings?: ModelSettings
  providerApiKeys?: Record<string, string>
  onProviderApiKeysChange?: (apiKeys: Record<string, string>) => void
  llmManager?: any
  generationSettings?: any
  onGenerationSettingsChange?: (settings: any) => void
  onCliFontSettingsChange?: (settings: { fontFamily: string; fontSize: number; fontLigatures: boolean }) => void
  currentCliFontSettings?: { fontFamily: string; fontSize: number; fontLigatures: boolean }
  currentTheme?: 'light' | 'dark' | 'system'
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void
  factCheckingSettings?: any
  onFactCheckingSettingsChange?: (settings: any) => void
}

export const ArmisSettings: React.FC<ArmisSettingsProps> = ({
  onClose,
  className,
  onProviderSelect,
  onModelSettingsChange,
  currentModelSettings,
  providerApiKeys: externalProviderApiKeys,
  onProviderApiKeysChange,
  llmManager,
  generationSettings: externalGenerationSettings,
  onGenerationSettingsChange,
  onCliFontSettingsChange,
  currentCliFontSettings,
  currentTheme,
  onThemeChange,
  factCheckingSettings: externalFactCheckingSettings,
  onFactCheckingSettingsChange,
}) => {
  const [activeTab, setActiveTab] = useState('api-keys')
  
  // Theme management - use props if provided, otherwise use local state
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [mounted, setMounted] = useState(false)
  
  // Use external theme management if provided, otherwise use local
  const theme = currentTheme !== undefined ? currentTheme : localTheme
  const setTheme = onThemeChange || setLocalTheme

  useEffect(() => {
    setMounted(true)
    
    // Only initialize theme if not provided externally
    if (currentTheme === undefined) {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
      setLocalTheme(savedTheme)
    }
  }, [currentTheme])

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    
    // Apply theme to document
    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      if (systemTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Generation settings state
  const [generationSettings, setGenerationSettings] = useState(() => {
    if (externalGenerationSettings) {
      return externalGenerationSettings
    }
    
    return {
      image: {
        enabled: false,
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
            'gemini-2.5-pro-preview-tts': { enabled: false, priority: 2 },
            'gpt-4o-mini-tts': { enabled: false, priority: 3 },
    
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
  })

  // LangChain Agents state
  const [agentType, setAgentType] = useState('basic')
  const [agentModelType, setAgentModelType] = useState('openai')
  const [agentTemperature, setAgentTemperature] = useState('0.0')
  const [agentMaxTokens, setAgentMaxTokens] = useState('1000')
  const [agentApiKey, setAgentApiKey] = useState('')
  const [agentTools, setAgentTools] = useState({
    webSearch: false,
    fileOperations: false,
    codeExecution: false,
    databaseAccess: false
  })
  const [agentSettings, setAgentSettings] = useState({
    verboseMode: false,
    returnIntermediate: false
  })
  const [isCreatingAgent, setIsCreatingAgent] = useState(false)

  // LangChain Agents handlers
  const handleCreateAgent = async () => {
    if (!agentApiKey.trim()) {
      alert('Please enter an API key')
      return
    }

    setIsCreatingAgent(true)
    try {
      const agentConfig: LangChainAgentConfig = {
        modelType: agentModelType as any,
        modelName: 'gpt-3.5-turbo', // Default model name
        temperature: parseFloat(agentTemperature),
        maxTokens: parseInt(agentMaxTokens),
        apiKey: agentApiKey
      }

      const agentOptions: AgentCreationOptions = {
        verbose: agentSettings.verboseMode,
        maxIterations: 10,
        returnIntermediateSteps: agentSettings.returnIntermediate
      }

      const service = new LangChainAgentsService(agentConfig)
      const agent = await service.createBasicAgent(agentOptions)
      
      console.log('Agent created successfully:', agent)
      alert('Agent created successfully!')
      
      // Reset form
      setAgentApiKey('')
    } catch (error) {
      console.error('Failed to create agent:', error)
      alert(`Failed to create agent: ${error}`)
    } finally {
      setIsCreatingAgent(false)
    }
  }

  const handleToolToggle = (toolName: keyof typeof agentTools) => {
    setAgentTools(prev => ({
      ...prev,
      [toolName]: !prev[toolName]
    }))
  }

  const handleSettingToggle = (settingName: keyof typeof agentSettings) => {
    setAgentSettings(prev => ({
      ...prev,
      [settingName]: !prev[settingName]
    }))
  }

  // Generation settings handlers
  const handleGenerationToggle = (type: 'image' | 'audio' | 'video' | 'code') => {
    setGenerationSettings((prev: any) => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled
      }
    }))
    
    // Notify parent component
    if (onGenerationSettingsChange) {
      const updatedSettings = {
        ...generationSettings,
        [type]: {
          ...generationSettings[type],
          enabled: !generationSettings[type].enabled
        }
      }
      onGenerationSettingsChange(updatedSettings)
    }
  }

  const handleGenerationModelToggle = (type: 'image' | 'audio' | 'video' | 'code', modelId: string) => {
    setGenerationSettings((prev: any) => ({
      ...prev,
      [type]: {
        ...prev[type],
        models: {
          ...prev[type].models,
          [modelId]: {
            ...(prev[type].models as any)[modelId],
            enabled: !(prev[type].models as any)[modelId]?.enabled
          }
        }
      }
    }))
    
    // Notify parent component
    if (onGenerationSettingsChange) {
      const updatedSettings = {
        ...generationSettings,
        [type]: {
          ...generationSettings[type],
          models: {
            ...generationSettings[type].models,
            [modelId]: {
              ...(generationSettings[type].models as any)[modelId],
              enabled: !(generationSettings[type].models as any)[modelId]?.enabled
            }
          }
        }
      }
      onGenerationSettingsChange(updatedSettings)
    }
  }

  const handleGenerationProviderChange = (type: 'image' | 'audio' | 'video' | 'code', provider: string) => {
    console.log('🎛️ Generation provider change:', { type, provider, currentSettings: generationSettings[type] })
    
    setGenerationSettings((prev: any) => {
      const updatedSettings = {
        ...prev,
        [type]: {
          ...prev[type],
          provider
        }
      }
      
      // TTSプロバイダーが変更された場合、適切なデフォルト音声を設定
      if (type === 'audio' && provider) {
        let defaultVoice = 'Kore' // デフォルト
        let defaultLanguage = 'ja-JP' // デフォルト
        
        switch (provider) {
          case 'openai':
            defaultVoice = 'alloy'
            defaultLanguage = 'en-US'
            break
          case 'inworld':
            defaultVoice = 'Ashley'
            defaultLanguage = 'en'
            break
          case 'local-inworld':
            defaultVoice = 'tts-1'
            defaultLanguage = 'en-US'
            break
          case 'google':
          default:
            defaultVoice = 'Kore'
            defaultLanguage = 'ja-JP'
            break
        }
        
        updatedSettings[type] = {
          ...updatedSettings[type],
          tts: {
            ...updatedSettings[type].tts,
            defaultVoice,
            defaultLanguage
          }
        }
        
        console.log('🎛️ TTS Provider changed to', provider, '- Setting default voice to', defaultVoice)
      }
      
      return updatedSettings
    })
    
    // Notify parent component
    if (onGenerationSettingsChange) {
      const updatedSettings = {
        ...generationSettings,
        [type]: {
          ...generationSettings[type],
          provider
        }
      }
      
      // TTSプロバイダーが変更された場合、適切なデフォルト音声を設定
      if (type === 'audio' && provider) {
        let defaultVoice = 'Kore' // デフォルト
        let defaultLanguage = 'ja-JP' // デフォルト
        
        switch (provider) {
          case 'openai':
            defaultVoice = 'alloy'
            defaultLanguage = 'en-US'
            break
          case 'inworld':
            defaultVoice = 'Ashley'
            defaultLanguage = 'en'
            break
          case 'local-inworld':
            defaultVoice = 'tts-1'
            defaultLanguage = 'en-US'
            break
          case 'google':
          default:
            defaultVoice = 'Kore'
            defaultLanguage = 'ja-JP'
            break
        }
        
        updatedSettings[type] = {
          ...updatedSettings[type],
          tts: {
            ...updatedSettings[type].tts,
            defaultVoice,
            defaultLanguage
          }
        }
      }
      
      console.log('🎛️ Notifying parent of generation settings change:', updatedSettings)
      onGenerationSettingsChange(updatedSettings)
    }
  }

  const handleTTSSettingChange = (setting: string, value: string) => {
    setGenerationSettings((prev: any) => ({
      ...prev,
      audio: {
        ...prev.audio,
        tts: {
          ...prev.audio.tts,
          [setting]: value
        }
      }
    }))
    
    // Notify parent component
    if (onGenerationSettingsChange) {
      const updatedSettings = {
        ...generationSettings,
        audio: {
          ...generationSettings.audio,
          tts: {
            ...generationSettings.audio.tts,
            [setting]: value
          }
        }
      }
      onGenerationSettingsChange(updatedSettings)
    }
  }


  const [modelSearchTerm, setModelSearchTerm] = useState('')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [taskFilter, setTaskFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // API Key management for each provider
  const [providerApiKeys, setProviderApiKeys] = useState<Record<string, string>>(externalProviderApiKeys || {})

  // Initialize model settings
  const [modelSettings, setModelSettings] = useState<ModelSettings>(() => {
    if (currentModelSettings) {
      return currentModelSettings
    }
    
    // localStorageからモデル設定を読み込み
    try {
      const saved = localStorage.getItem('armis_model_settings')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load model settings from localStorage:', error)
    }
    
    // Enable recommended models by default
    const defaultEnabledModels: EnabledModel[] = [
      { providerId: 'openai', modelId: 'gpt-4o', enabled: true, priority: 1 },
      { providerId: 'anthropic', modelId: 'claude-opus-4.1', enabled: true, priority: 3 },
      { providerId: 'google', modelId: 'gemini-2.5-flash-lite', enabled: true, priority: 9 },
      { providerId: 'ollama', modelId: 'gemma3:1b', enabled: true, priority: 2 },
      { providerId: 'llama-cpp', modelId: 'gpt-oss-20b', enabled: true, priority: 5 }
    ]
    
    return {
      enabledModels: defaultEnabledModels,
      defaultModel: 'ollama:gemma3:1b',
      autoSwitch: true
    }
  })

  // llama.cppモデルを動的に取得
  const [llamaCppModels, setLlamaCppModels] = useState<AIModel[]>([])
  const [isLoadingLlamaCppModels, setIsLoadingLlamaCppModels] = useState(false)

  // llama.cppモデルを取得する関数
  const loadLlamaCppModels = async () => {
    if (!llmManager) return
    
    try {
      setIsLoadingLlamaCppModels(true)
      const huggingFaceService = new (await import('@/services/llm/huggingface-llamacpp-service')).HuggingFaceLlamaCppService()
      const models = await huggingFaceService.getTrendingLlamaCppModels(20)
      
      // HuggingFaceLlamaCppModelをAIModelに変換
      const convertedModels: AIModel[] = models.map(model => ({
        id: model.id,
        name: model.name,
        provider: 'Llama.cpp',
        description: model.description,
        maxTokens: 4096,
        capabilities: {
          imageInput: model.id.includes('qwen2.5-omni') || model.id.includes('llava') || model.id.includes('vision'),
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      }))
      
      // Qwen2.5-Omni-3B-GGUFモデルを優先的に追加
      const qwenOmniModel: AIModel = {
        id: 'unsloth/Qwen2.5-Omni-3B-GGUF',
        name: 'Qwen2.5-Omni-3B-GGUF',
        provider: 'Llama.cpp',
        description: 'Any-to-Any Multimodal Model - End-to-end multimodal model supporting text, image, audio, video input/output with real-time speech generation. Features Thinker-Talker architecture with TMRoPE position embedding.',
        maxTokens: 4096,
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      }
      
      // 既存のモデルリストにQwen2.5-Omniを追加（重複を避けて）
      const existingModelIds = convertedModels.map(m => m.id)
      if (!existingModelIds.includes(qwenOmniModel.id)) {
        convertedModels.unshift(qwenOmniModel) // 最上位に追加
      }
      
      setLlamaCppModels(convertedModels)
    } catch (error) {
      console.error('Failed to load llama.cpp models:', error)
      
      // エラー時はQwen2.5-Omni-3B-GGUFモデルをフォールバックとして追加
      const fallbackModel: AIModel = {
        id: 'unsloth/Qwen2.5-Omni-3B-GGUF',
        name: 'Qwen2.5-Omni-3B-GGUF',
        provider: 'Llama.cpp',
        description: 'Any-to-Any Multimodal Model - End-to-end multimodal model supporting text, image, audio, video input/output with real-time speech generation. Features Thinker-Talker architecture with TMRoPE position embedding.',
        maxTokens: 4096,
        capabilities: {
          imageInput: true,
          objectGeneration: true,
          toolUsage: false,
          toolStreaming: false
        }
      }
      setLlamaCppModels([fallbackModel])
    } finally {
      setIsLoadingLlamaCppModels(false)
    }
  }

  // llama.cppモデルを読み込む
  React.useEffect(() => {
    if (llmManager && activeTab === 'models') {
      loadLlamaCppModels()
    }
  }, [llmManager, activeTab])

  const [settings, setSettings] = useState({
    // Model-related settings
    models: {
      whisper: 'whisper-large-v3',
      lmm: 'gpt-4',
      tts: 'vits2',
      autoSwitch: true
    },
    // Fact checking settings
    factChecking: externalFactCheckingSettings || {
      enabled: false,
      model: 'ollama',
      temperature: 0.1,
      maxTokens: 1000,
      includeSources: true,
      strictMode: false,
      autoCheck: false,
      checkThreshold: 0.7
    },
    // API key settings
    apiKeys: {
      openai: '',
      anthropic: '',
      google: '',
      mistral: '',
      groq: '',
      togetherai: '',
      fireworks: '',
      deepseek: '',
      xai: '',
      perplexity: ''
    },
    // Workflow rules
    workflow: {
      promptTemplates: [],
      mulmoScriptTemplates: [],
      scope: 'global' // 'global' | 'project'
    },
    // Indexing settings
    indexing: {
      autoIndex: true,
      excludedExtensions: ['.mp4', '.avi', '.mov'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      indexList: []
    },
    // Memory settings
    memory: {
      enabled: true,
      maxEntries: 1000,
      autoCleanup: true
    },
    // Network settings
    network: {
      scrapingEnabled: true,
      http2Enabled: true,
      timeout: 30000
    },
    // Tool settings
    tools: {
      whisper: true,
      pySceneDetect: true,
      tts: true,
      diffBuild: true,
      customWorkflows: []
    },
    // UI/Performance settings
    performance: {
      previewSpeed: 30, // seconds
      gpuEnabled: true,
      telemetry: false
    },
    // Input/Output settings
    output: {
      videoCodec: 'h264',
      audioCodec: 'aac',
      resolution: '1080p',
      fps: 30,
      supportedFormats: ['.png', '.jpg', '.mp4', '.mp3', '.wav']
    },
    // CLI Font settings
    cli: currentCliFontSettings || {
      fontFamily: 'Cascadia Code',
      fontSize: 12,
      fontLigatures: true
    }
  })

  const handleSave = () => {
    // Save model settings
    if (onModelSettingsChange) {
      onModelSettingsChange(modelSettings)
    }
    
    // Save model settings to localStorage
    try {
      localStorage.setItem('armis_model_settings', JSON.stringify(modelSettings))
    } catch (error) {
      console.error('Failed to save model settings to localStorage:', error)
    }
    
    // Save CLI font settings
    if (onCliFontSettingsChange) {
      onCliFontSettingsChange(settings.cli)
    }
    
    // TODO: Save settings processing
    console.log('Settings saved:', settings)
    console.log('Model settings saved:', modelSettings)
    console.log('CLI font settings saved:', settings.cli)
    onClose()
  }









  // Model settings management
  const toggleModelEnabled = (providerId: string, modelId: string) => {
    setModelSettings(prev => {
      const existingIndex = prev.enabledModels.findIndex(
        m => m.providerId === providerId && m.modelId === modelId
      )
      
      let updatedSettings: ModelSettings
      
      if (existingIndex >= 0) {
        // Update existing model
        const updatedModels = [...prev.enabledModels]
        updatedModels[existingIndex] = {
          ...updatedModels[existingIndex],
          enabled: !updatedModels[existingIndex].enabled
        }
        updatedSettings = { ...prev, enabledModels: updatedModels }
      } else {
        // Add new model
        const newModel: EnabledModel = {
          providerId,
          modelId,
          enabled: true,
          priority: prev.enabledModels.length + 1
        }
        updatedSettings = {
          ...prev,
          enabledModels: [...prev.enabledModels, newModel]
        }
      }

      // Apply changes in real-time
      if (onModelSettingsChange) {
        onModelSettingsChange(updatedSettings)
      }

      // Save to localStorage in real-time
      try {
        localStorage.setItem('armis_model_settings', JSON.stringify(updatedSettings))
      } catch (error) {
        console.error('Failed to save model settings to localStorage:', error)
      }

      return updatedSettings
    })
  }

  const setDefaultModel = (providerId: string, modelId: string) => {
    setModelSettings(prev => {
      const updatedSettings = {
        ...prev,
        defaultModel: `${providerId}:${modelId}`
      }

      // Apply changes in real-time
      if (onModelSettingsChange) {
        onModelSettingsChange(updatedSettings)
      }

      // Save to localStorage in real-time
      try {
        localStorage.setItem('armis_model_settings', JSON.stringify(updatedSettings))
      } catch (error) {
        console.error('Failed to save model settings to localStorage:', error)
      }

      return updatedSettings
    })
  }

  const isModelEnabled = (providerId: string, modelId: string): boolean => {
    return modelSettings.enabledModels.some(
      m => m.providerId === providerId && m.modelId === modelId && m.enabled
    )
  }

  const isDefaultModel = (providerId: string, modelId: string): boolean => {
    return modelSettings.defaultModel === `${providerId}:${modelId}`
  }

  // Filtered model list (grouped by provider)
  const getFilteredModelsByProvider = () => {
    const filteredProviders: Array<{ provider: any; models: any[] }> = []
    
    const providersSorted = [...AVAILABLE_PROVIDERS].sort((a, b) => a.name.localeCompare(b.name))

    providersSorted.forEach(provider => {
      let models = provider.models
      
      // llama.cppプロバイダーの場合、動的に取得したモデルを使用
      if (provider.id === 'llama-cpp' && llamaCppModels.length > 0) {
        models = llamaCppModels
      }
      
      const filteredModels = models.filter(model => {
        // Search filter
        const matchesSearch = !modelSearchTerm || 
          model.name.toLowerCase().includes(modelSearchTerm.toLowerCase()) ||
          model.description?.toLowerCase().includes(modelSearchTerm.toLowerCase()) ||
          provider.name.toLowerCase().includes(modelSearchTerm.toLowerCase())
        
        // Category filter
        let matchesFilter = true
        switch (modelFilter) {
          case 'enabled':
            matchesFilter = isModelEnabled(provider.id, model.id)
            break
          case 'disabled':
            matchesFilter = !isModelEnabled(provider.id, model.id)
            break
          case 'image':
            matchesFilter = model.capabilities.imageInput
            break
          case 'tools':
            matchesFilter = model.capabilities.toolUsage
            break
          case 'fast':
            matchesFilter = model.name.toLowerCase().includes('nano') || 
                           model.name.toLowerCase().includes('mini') ||
                           model.name.toLowerCase().includes('instant') ||
                           model.name.toLowerCase().includes('flash')
            break
        }

        // Task filter
        let matchesTask = true
        switch (taskFilter) {
          case 'llm':
            matchesTask = !model.capabilities.imageInput && !model.capabilities.objectGeneration
            break
          case 'vision':
            matchesTask = model.capabilities.imageInput
            break
          case 'audio':
            // Identify audio-related models (from name or description)
            matchesTask = model.name.toLowerCase().includes('whisper') ||
                         model.name.toLowerCase().includes('tts') ||
                         model.name.toLowerCase().includes('transcribe') ||
                         model.name.toLowerCase().includes('audio') ||
                         (model.description?.toLowerCase().includes('speech') || false) ||
                         (model.description?.toLowerCase().includes('audio') || false) ||
                         (model.description?.toLowerCase().includes('transcription') || false)
            break
          case 'tools':
            matchesTask = model.capabilities.toolUsage
            break
          case 'json':
            matchesTask = model.capabilities.objectGeneration
            break
        }
        
        return matchesSearch && matchesFilter && matchesTask
      })
      
      if (filteredModels.length > 0) {
        filteredProviders.push({ provider, models: filteredModels })
      }
    })
    
    return filteredProviders
  }





  // Update provider API Key
  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    const updatedApiKeys = {
      ...providerApiKeys,
      [providerId]: apiKey
    }
    setProviderApiKeys(updatedApiKeys)
    
    // Clear verification results when API Key is changed
    if (verificationResults[providerId]) {
      setVerificationResults(prev => {
        const newResults = { ...prev }
        delete newResults[providerId]
        return newResults
      })
    }
    
    // Also call external callback
    if (onProviderApiKeysChange) {
      onProviderApiKeysChange(updatedApiKeys)
    }
  }

  // API Key verification
  const [verifyingStates, setVerifyingStates] = useState<Record<string, boolean>>({})
  const [verificationResults, setVerificationResults] = useState<Record<string, { success: boolean; message: string }>>({})

  const handleVerifyApiKey = async (providerId: string) => {
    // Prevent duplicate verification if already in progress
    if (verifyingStates[providerId]) {
      console.log(`Verification already in progress for ${providerId}`)
      return
    }

    const apiKey = providerApiKeys[providerId]
    if (!apiKey || apiKey.trim() === '') {
      setVerificationResults(prev => ({
        ...prev,
        [providerId]: { success: false, message: 'API Key is required' }
      }))
      return
    }

    setVerifyingStates(prev => ({ ...prev, [providerId]: true }))
    
    try {
      console.log(`=== Starting API Key verification for ${providerId} ===`)
      
      // Create temporary AI SDK service for verification
      const tempAISDKService = new AISDKService()
      
      // Get provider information
      const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId)
      if (!provider) {
        throw new Error(`Provider ${providerId} not found in available providers`)
      }

      // Select default model
      let defaultModel = provider.models[0]
      if (!defaultModel) {
        throw new Error(`No models available for provider ${providerId}`)
      }

      // OpenAIの場合はより一般的なモデルを優先
      if (providerId === 'openai') {
        // gpt-5が利用できない場合があるため、より一般的なgpt-4oを使用
        defaultModel = provider.models.find(m => m.id === 'gpt-4o') || 
                      provider.models.find(m => m.id === 'gpt-4o-mini') || 
                      provider.models.find(m => m.id === 'gpt-3.5-turbo') || 
                      defaultModel
      } else if (providerId === 'inworld') {
        // Inworld AIの場合はTTS専用モデルを選択
        defaultModel = provider.models.find(m => m.id === 'inworld-tts-1') || defaultModel
      }

      console.log(`Using model: ${defaultModel.id} for verification`)

      // Configure provider
      await tempAISDKService.configureProvider({
        providerId,
        modelId: defaultModel.id,
        apiKey: apiKey,
        temperature: 0.7,
        maxOutputTokens: 100
      })

      // Connection test
      let isConnected = false
      
      if (providerId === 'inworld') {
        // Inworld AIの場合はTTS専用テスト
        try {
          const response = await fetch('https://api.inworld.ai/tts/v1/voice', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: 'Test',
              voiceId: 'Ashley',
              modelId: 'inworld-tts-1'
            })
          })
          
          isConnected = response.ok
          console.log(`Inworld AI TTS API test result: ${response.status} ${response.statusText}`)
        } catch (error) {
          console.error('Inworld AI TTS API test failed:', error)
          isConnected = false
        }
      } else {
        // その他のプロバイダーは通常の接続テスト
        isConnected = await tempAISDKService.testConnection()
      }
      
      if (isConnected) {
        console.log(`API Key verification successful for ${providerId}`)
        setVerificationResults(prev => ({
          ...prev,
          [providerId]: { success: true, message: 'Verified' }
        }))
        
        // Update provider settings on successful verification
        if (onProviderSelect) {
          onProviderSelect({
            providerId,
            modelId: defaultModel.id,
            apiKey: apiKey,
            temperature: 0.7,
            maxOutputTokens: 1000
          })
        }
      } else {
        console.log(`API Key verification failed for ${providerId}: Connection test returned false`)
        setVerificationResults(prev => ({
          ...prev,
          [providerId]: { success: false, message: 'failed - please check your API key and network connection' }
        }))
      }
    } catch (error) {
      console.error(`API Key verification error for ${providerId}:`, error)
      
      let errorMessage = 'Unknown error occurred during verification'
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Provide more specific error messages
        if (errorMessage.includes('account is not active') || errorMessage.includes('billing')) {
          errorMessage = `Account billing issue: Your OpenAI account is not active. Please check your billing details at https://platform.openai.com/account/billing`
        } else if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          errorMessage = `Rate limit exceeded: You have exceeded the API rate limits. Please wait before making another request.`
        } else if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          errorMessage = `Authentication failed: ${errorMessage}. Please check your API key format and validity.`
        } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          errorMessage = `Network error: ${errorMessage}. Please check your internet connection.`
        } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          errorMessage = `Rate limit/quota exceeded: ${errorMessage}. Please check your API usage limits.`
        } else if (errorMessage.includes('model') || errorMessage.includes('not found')) {
          errorMessage = `Model configuration error: ${errorMessage}. Please check the selected model.`
        }
      }
      
      setVerificationResults(prev => ({
        ...prev,
        [providerId]: { success: false, message: errorMessage }
      }))
    } finally {
      setVerifyingStates(prev => ({ ...prev, [providerId]: false }))
      console.log(`=== API Key verification completed for ${providerId} ===`)
    }
  }

  return (
    <div className={cn("fixed inset-0 bg-black/50 flex items-center justify-center z-50", className)}>
      <div className="bg-background rounded-lg shadow-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex">
            <TabsList className="flex flex-col w-48 h-full rounded-none border-r border-border">
              <TabsTrigger value="api-keys" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Key className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">API Keys</span>
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <CuboidIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Models</span>
              </TabsTrigger>
              <TabsTrigger value="generation" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Generation</span>
              </TabsTrigger>

              <TabsTrigger value="workflow" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Workflow</span>
              </TabsTrigger>
              <TabsTrigger value="indexing" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Database className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Indexing</span>
              </TabsTrigger>
              <TabsTrigger value="memory" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <BrainCircuit className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Memory</span>
              </TabsTrigger>
              <TabsTrigger value="network" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Network className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Network</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Wrench className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Tools</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Monitor className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Performance</span>
              </TabsTrigger>
              <TabsTrigger value="output" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Download className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Output</span>
              </TabsTrigger>
              <TabsTrigger value="cli-font" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Type className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">CLI Font</span>
              </TabsTrigger>
              <TabsTrigger value="langchain-agents" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Brain className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">LangChain Agents</span>
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Palette className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Theme</span>
              </TabsTrigger>
              <TabsTrigger value="fact-checking" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Fact Checking</span>
              </TabsTrigger>
              <TabsTrigger value="stt" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10 text-left w-full">
                <Mic className="w-4 h-4 flex-shrink-0" />
                <span className="text-left">Speech to Text</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 p-6 overflow-y-auto flex justify-start">
              {/* API Keys Tab */}
              <TabsContent value="api-keys" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">API Keys Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter API keys for the AI providers you want to use. Only enabled providers will be available in the chat.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {(() => {
                      // 優先プロバイダーを最初に表示
                      const priorityProviders = ['openai', 'google', 'anthropic']
                      const sortedProviders = [...AVAILABLE_PROVIDERS].sort((a, b) => {
                        const aPriority = priorityProviders.indexOf(a.id)
                        const bPriority = priorityProviders.indexOf(b.id)
                        
                        // 優先プロバイダーが先に来るようにソート
                        if (aPriority !== -1 && bPriority !== -1) {
                          return aPriority - bPriority
                        }
                        if (aPriority !== -1) return -1
                        if (bPriority !== -1) return 1
                        
                        // その他は名前順
                        return a.name.localeCompare(b.name)
                      })
                      
                      return sortedProviders.map((provider) => (
                        <div key={provider.id} className="space-y-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                              {React.createElement(getProviderIcon(provider.id), {
                                className: "w-4 h-4",
                                size: 16
                              })}
                            </div>
                            <h3 className="text-lg font-semibold">{provider.name} API Key</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {provider.id === 'openai' && "You can put in your OpenAI key to use Cursor at public API costs. Note: this can cost more than pro and won't work for custom model features."}
                            {provider.id === 'anthropic' && "Enter your Anthropic API key to use Claude models. Get your key from the Anthropic Console."}
                            {provider.id === 'google' && "Enter your Google AI Studio API key to use Gemini models. Get your key from Google AI Studio."}
                            {provider.id === 'xai' && "Enter your xAI API key to use Grok models. Get your key from the xAI Console."}
                            {provider.id === 'fireworks' && "Enter your Fireworks API key to use their models. Get your key from the Fireworks Console."}
                            {provider.id === 'groq' && "Enter your Groq API key to use their fast inference models. Get your key from the Groq Console."}
                            {provider.id === 'mistral' && "Enter your Mistral API key to use their models. Get your key from the Mistral Console."}
                            {provider.id === 'perplexity' && "Enter your Perplexity API key to use their models. Get your key from Perplexity API Settings."}
                            {provider.id === 'deepseek' && "Enter your DeepSeek API key to use their models. Get your key from the DeepSeek Platform."}
                            {provider.id === 'togetherai' && "Enter your Together AI API key to use their models. Get your key from Together AI."}
                            {provider.id === 'cohere' && "Enter your Cohere API key to use their models. Get your key from the Cohere Dashboard."}
                            {provider.id === 'cerebras' && "Enter your Cerebras API key to use their models. Get your key from the Cerebras Console."}
                            {provider.id === 'deepinfra' && "Enter your DeepInfra API key to use their models. Get your key from DeepInfra."}
                            {provider.id === 'veo' && "Veo 3.0 Generate Preview uses Google Gemini API. Please configure your Google API key above to use Veo functionality."}
                            {provider.id === 'runway' && "Enter your Runway ML API key to use Gen-3 video generation. Get your key from the Runway ML Developer Portal. NOTE: Minimum $10 credit required."}
                            {provider.id === 'inworld' && "Enter your Inworld AI API key to use their TTS models. Get your key from Inworld Studio."}
                            {provider.id === 'local-inworld' && "Local Inworld TTS - No API key required. Automatically downloads and runs models locally."}
                            {provider.id === 'amazon-bedrock' && "Configure AWS credentials to use Amazon Bedrock models. Requires AWS authentication."}
                            {provider.id === 'azure' && "Configure Azure credentials to use Azure OpenAI Service. Requires Azure authentication."}

                            {!['openai', 'anthropic', 'google', 'xai', 'fireworks', 'groq', 'mistral', 'perplexity', 'deepseek', 'togetherai', 'cohere', 'cerebras', 'deepinfra', 'veo', 'runway', 'inworld', 'local-inworld', 'amazon-bedrock', 'azure'].includes(provider.id) && `Enter your ${provider.name} API key to use their models.`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={providerApiKeys[provider.id] || ''}
                            onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                            placeholder={provider.id === 'runway' ? "key_123456789012345678901234567890" : `Enter your ${provider.name} API Key`}
                            className="flex-1"
                            disabled={false}
                          />
                          {provider.requiresApiKey !== false && (
                            <Button
                              onClick={() => handleVerifyApiKey(provider.id)}
                              disabled={verifyingStates[provider.id] || !providerApiKeys[provider.id] || providerApiKeys[provider.id].trim() === ''}
                              className="px-4"
                            >
                              {verifyingStates[provider.id] ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : verificationResults[provider.id]?.success ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <>
                                  <span>{provider.id === 'runway' ? 'Test & Setup' : 'Verify'}</span>
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        {provider.id === 'veo' && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Veo 3.0 Generate Preview uses Google Gemini API for video generation</p>
                            <p>• Configure your Google API key above to use Veo functionality</p>
                            <p>• Currently in simulation mode - actual video generation not yet available</p>
                            <p>• Video generation functionality only - not for chat models</p>
                          </div>
                        )}
                        {provider.id === 'runway' && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>• <strong>📋 Setup Required:</strong> <a href="https://docs.dev.runwayml.com/guides/setup/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Runway ML Developer Portal</a></p>
                            <p>• <strong>💰 Billing:</strong> Minimum $10 credit required ($0.01/credit)</p>
                            <p>• <strong>🔑 API Key Format:</strong> Must start with "key_" (e.g., key_1234567890...)</p>
                            <p>• <strong>🎬 Function:</strong> Video generation only - Gen-3 model</p>
                            <p>• <strong>⚠️ Important:</strong> API key is shown only once - save it securely</p>
                          </div>
                        )}
                        {provider.id === 'inworld' && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Get your API key from <a href="https://studio.inworld.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Inworld Studio</a></p>
                            <p>• Click <strong>Get API Key</strong> in Overview tab, or go to <strong>Settings {'>'}</strong> API Keys</p>
                            <p>• Generate a Runtime API key and copy the Base64 credentials</p>
                            <p>• TTS functionality only - not for chat models</p>
                          </div>
                        )}
                        {verificationResults[provider.id] && (
                          <div className={cn(
                            "text-xs mt-1 p-2 rounded",
                            verificationResults[provider.id].success 
                              ? "text-green-700 bg-green-50 border border-green-200" 
                              : "text-red-700 bg-red-50 border border-red-200"
                          )}>
                            <div className="flex items-center gap-1">
                              {verificationResults[provider.id].success ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                              <span>{verificationResults[provider.id].message}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                    })()}
                  </div>
                </div>
              </TabsContent>

              {/* Models Tab */}
              <TabsContent value="models" className="space-y-6">
                <div className="space-y-4">
                  {/* Model Management Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Model Management</h3>
                      <p className="text-sm text-muted-foreground">
                        Enable/disable models and set default model for chat
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      >
                        {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search models..."
                        value={modelSearchTerm}
                        onChange={(e) => setModelSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={modelFilter} onValueChange={setModelFilter}>
                      <SelectTrigger className="w-48">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Models</SelectItem>
                        <SelectItem value="enabled">Enabled Only</SelectItem>
                        <SelectItem value="disabled">Disabled Only</SelectItem>
                        <SelectItem value="image">Image Support</SelectItem>
                        <SelectItem value="tools">Tool Usage</SelectItem>
                        <SelectItem value="fast">Fast Models</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={taskFilter} onValueChange={setTaskFilter}>
                      <SelectTrigger className="w-48">
                        <Brain className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value="llm">Text Generation</SelectItem>
                        <SelectItem value="vision">Vision/Image</SelectItem>
                        <SelectItem value="audio">Audio/Speech</SelectItem>
                        <SelectItem value="tools">Tool Usage</SelectItem>
                        <SelectItem value="json">JSON Output</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Default Model Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Default Model</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select 
                        value={modelSettings.defaultModel || ''} 
                        onValueChange={(value) => {
                          const [providerId, modelId] = value.split(':')
                          setDefaultModel(providerId, modelId)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select default model" />
                        </SelectTrigger>
                        <SelectContent>
                          {modelSettings.enabledModels
                            .filter(m => m.enabled)
                            .map((enabledModel) => {
                              const provider = AVAILABLE_PROVIDERS.find(p => p.id === enabledModel.providerId)
                              const model = provider?.models.find(m => m.id === enabledModel.modelId)
                              return (
                                <SelectItem key={`${enabledModel.providerId}:${enabledModel.modelId}`} 
                                           value={`${enabledModel.providerId}:${enabledModel.modelId}`}>
                                  {model?.name || enabledModel.modelId} ({provider?.name || enabledModel.providerId})
                                </SelectItem>
                              )
                            })}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  {/* Model Grid/List - Grouped by provider */}
                  <div className="space-y-6">
                    {getFilteredModelsByProvider().map(({ provider, models }) => (
                      <div key={provider.id} className="space-y-3">
                        {/* Provider header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                              {React.createElement(getProviderIcon(provider.id), {
                                className: "w-4 h-4",
                                size: 16
                              })}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{provider.name}</h3>
                              <p className="text-sm text-muted-foreground">{provider.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {models.length} model{models.length !== 1 ? 's' : ''}
                            </Badge>
                            {providerApiKeys[provider.id] && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                API Key Set
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Model list */}
                        <div className={cn(
                          viewMode === 'grid' 
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                            : "space-y-2"
                        )}>
                          {/* llama.cppプロバイダーの場合、ローディング状態を表示 */}
                          {provider.id === 'llama-cpp' && isLoadingLlamaCppModels && (
                            <div className="col-span-full flex items-center justify-center py-8">
                              <CircleSpinner size="lg" />
                              <span className="ml-2">Loading llama.cpp models...</span>
                            </div>
                          )}
                          {models.map((model) => (
                            <Card 
                              key={`${provider.id}:${model.id}`}
                              className={cn(
                                "cursor-pointer transition-all",
                                isModelEnabled(provider.id, model.id) 
                                  ? "border-primary/50 bg-primary/5" 
                                  : "border-border hover:border-muted-foreground/50",
                                isDefaultModel(provider.id, model.id) && "ring-2 ring-primary/20",
                                model.id.includes('qwen2.5-omni') && "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                              )}
                              onClick={() => toggleModelEnabled(provider.id, model.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm">{model.name}</h4>
                                      {isModelEnabled(provider.id, model.id) && (
                                        <Badge variant="secondary" className="text-xs">
                                        </Badge>
                                      )}
                                      {isDefaultModel(provider.id, model.id) && (
                                        <Badge variant="default" className="text-xs">Default</Badge>
                                      )}
                                      {/* Qwen2.5-Omniモデルの特別なバッジ */}
                                      {model.id.includes('qwen2.5-omni') && (
                                        <Badge variant="default" className="text-xs bg-blue-600 hover:bg-blue-700">Any-to-Any</Badge>
                                      )}
                                    </div>
                                    {model.description && (
                                      <p className={cn(
                                        "text-xs mb-2",
                                        model.id.includes('qwen2.5-omni') 
                                          ? "text-blue-600 dark:text-blue-400" 
                                          : "text-muted-foreground"
                                      )}>
                                        {model.description}
                                      </p>
                                    )}
                                    <div className="flex gap-1 mb-2">
                                      {/* Text - Basic text generation functionality */}
                                      {(model.capabilities.toolUsage || model.capabilities.objectGeneration || 
                                        model.capabilities.toolStreaming) && 
                                       !model.name.toLowerCase().includes('whisper') && 
                                       !model.name.toLowerCase().includes('tts') && 
                                       !model.name.toLowerCase().includes('transcribe') &&
                                       !model.name.toLowerCase().includes('dall-e') &&
                                       !model.name.toLowerCase().includes('gpt-image') &&
                                       !model.name.toLowerCase().includes('embedding') && (
                                        <Badge variant="secondary" className="text-xs">
                                          Text
                                        </Badge>
                                      )}
                                      
                                      {/* Vision - Image input functionality */}
                                      {model.capabilities.imageInput && (
                                        <Badge variant="secondary" className="text-xs">
                                          Vision
                                        </Badge>
                                      )}
                                      
                                      {/* Image - Image generation functionality */}
                                      {(model.name.toLowerCase().includes('dall-e') || 
                                        model.name.toLowerCase().includes('gpt-image') ||
                                        model.name.toLowerCase().includes('imagen') ||
                                        (model.capabilities.objectGeneration && 
                                         (model.name.toLowerCase().includes('image') || 
                                          model.description?.toLowerCase().includes('image generation')))) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Image
                                        </Badge>
                                      )}
                                      
                                      {/* Speech - Speech generation functionality */}
                                      {(model.name.toLowerCase().includes('tts') || 
                                        model.name.toLowerCase().includes('speech') ||
                                        model.description?.toLowerCase().includes('text-to-speech') ||
                                        model.description?.toLowerCase().includes('audio generation')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Speech
                                        </Badge>
                                      )}
                                      
                                      {/* Audio - Speech recognition functionality */}
                                      {(model.name.toLowerCase().includes('whisper') || 
                                        model.name.toLowerCase().includes('transcribe') ||
                                        model.description?.toLowerCase().includes('speech recognition') ||
                                        model.description?.toLowerCase().includes('audio transcription')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Audio
                                        </Badge>
                                      )}
                                      
                                      {/* Video - Video generation functionality */}
                                      {(model.name.toLowerCase().includes('veo') ||
                                        model.description?.toLowerCase().includes('video generation')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Video
                                        </Badge>
                                      )}
                                      
                                      {/* Embedding - Embedding functionality */}
                                      {(model.name.toLowerCase().includes('embedding') ||
                                        model.description?.toLowerCase().includes('embedding') ||
                                        model.description?.toLowerCase().includes('text embedding')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Embedding
                                        </Badge>
                                      )}
                                      
                                      {/* Reasoning - Reasoning functionality */}
                                      {(model.name.toLowerCase().includes('o1') || 
                                        model.name.toLowerCase().includes('o3') || 
                                        model.name.toLowerCase().includes('o4') ||
                                        model.description?.toLowerCase().includes('reasoning') ||
                                        model.description?.toLowerCase().includes('problem-solving')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Reasoning
                                        </Badge>
                                      )}
                                      
                                      {/* Tools - Tool usage functionality */}
                                      {model.capabilities.toolUsage && 
                                       !model.name.toLowerCase().includes('embedding') &&
                                       !model.name.toLowerCase().includes('whisper') &&
                                       !model.name.toLowerCase().includes('tts') &&
                                       !model.name.toLowerCase().includes('dall-e') && (
                                        <Badge variant="secondary" className="text-xs">
                                          Tools
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={isModelEnabled(provider.id, model.id)}
                                      onCheckedChange={() => toggleModelEnabled(provider.id, model.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className={cn(
                                        isModelEnabled(provider.id, model.id) && 
                                        "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                      )}
                                    />
                                    {isDefaultModel(provider.id, model.id) && (
                                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))})
                  </div>

                  {getFilteredModelsByProvider().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No models found matching your criteria</p>
                      <p className="text-xs mt-2">Try adjusting your search terms or filters</p>
                    </div>
                  )}



                </div>
              </TabsContent>



              {/* Generation Tab */}
              <TabsContent value="generation" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">Generation Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure AI generation capabilities for different media types
                    </p>
                  </div>

                  <Tabs defaultValue="image" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="image" className="flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Image
                      </TabsTrigger>
                      <TabsTrigger value="video" className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        Video
                      </TabsTrigger>
                      <TabsTrigger value="audio" className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        Audio
                      </TabsTrigger>
                      <TabsTrigger value="code" className="flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        Code
                      </TabsTrigger>
                    </TabsList>

                    {/* Image Generation Tab */}
                    <TabsContent value="image" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Image className="w-5 h-5" />
                            Image Generation
                          </CardTitle>
                          <CardDescription>
                            Configure image generation models and settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Enable Image Generation</h4>
                              <p className="text-sm text-muted-foreground">
                                Allow AI to generate images from text prompts
                              </p>
                            </div>
                            <Switch
                              checked={generationSettings.image.enabled}
                              onCheckedChange={() => handleGenerationToggle('image')}
                            />
                          </div>

                                                     {generationSettings.image.enabled && (
                             <>
                               <div className="space-y-2">
                                 <label className="text-sm font-medium">Provider</label>
                                 <div className="space-y-3">
                                   {/* Google Provider */}
                                   <Card 
                                     className={cn(
                                       "cursor-pointer transition-all",
                                       generationSettings.image.provider === 'google'
                                         ? "border-primary/50 bg-primary/5" 
                                         : "border-border hover:border-muted-foreground/50"
                                     )}
                                     onClick={() => handleGenerationProviderChange('image', 'google')}
                                   >
                                     <CardContent className="p-4">
                                       <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                           {React.createElement(getProviderIcon('google'), {
                                             className: "w-8 h-8",
                                             size: 32
                                           })}
                                           <div>
                                             <h4 className="font-medium">Google (Imagen)</h4>
                                             <p className="text-sm text-muted-foreground">High-quality image generation</p>
                                           </div>
                                         </div>
                                         <Switch
                                           checked={generationSettings.image.provider === 'google'}
                                           onCheckedChange={() => handleGenerationProviderChange('image', 'google')}
                                           onClick={(e) => e.stopPropagation()}
                                         />
                                       </div>
                                     </CardContent>
                                   </Card>

                                   {/* OpenAI Provider */}
                                   <Card 
                                     className={cn(
                                       "cursor-pointer transition-all",
                                       generationSettings.image.provider === 'openai'
                                         ? "border-primary/50 bg-primary/5" 
                                         : "border-border hover:border-muted-foreground/50"
                                     )}
                                     onClick={() => handleGenerationProviderChange('image', 'openai')}
                                   >
                                     <CardContent className="p-4">
                                       <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                           {React.createElement(getProviderIcon('openai'), {
                                             className: "w-8 h-8",
                                             size: 32
                                           })}
                                           <div>
                                             <h4 className="font-medium">OpenAI (DALL-E)</h4>
                                             <p className="text-sm text-muted-foreground">Creative and artistic images</p>
                                           </div>
                                         </div>
                                         <Switch
                                           checked={generationSettings.image.provider === 'openai'}
                                           onCheckedChange={() => handleGenerationProviderChange('image', 'openai')}
                                           onClick={(e) => e.stopPropagation()}
                                         />
                                       </div>
                                     </CardContent>
                                   </Card>

                                   {/* Anthropic Provider */}
                                   <Card 
                                     className={cn(
                                       "cursor-pointer transition-all",
                                       generationSettings.image.provider === 'anthropic'
                                         ? "border-primary/50 bg-primary/5" 
                                         : "border-border hover:border-muted-foreground/50"
                                     )}
                                     onClick={() => handleGenerationProviderChange('image', 'anthropic')}
                                   >
                                     <CardContent className="p-4">
                                       <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-3">
                                           {React.createElement(getProviderIcon('anthropic'), {
                                             className: "w-8 h-8",
                                             size: 32
                                           })}
                                           <div>
                                             <h4 className="font-medium">Anthropic (Claude)</h4>
                                             <p className="text-sm text-muted-foreground">Advanced AI image generation</p>
                                           </div>
                                         </div>
                                         <Switch
                                           checked={generationSettings.image.provider === 'anthropic'}
                                           onCheckedChange={() => handleGenerationProviderChange('image', 'anthropic')}
                                           onClick={(e) => e.stopPropagation()}
                                         />
                                       </div>
                                     </CardContent>
                                   </Card>
                                 </div>
                               </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Available Models</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Object.entries(generationSettings.image.models).map(([modelId, model]) => (
                                    <Card 
                                      key={modelId}
                                      className={cn(
                                        "cursor-pointer transition-all",
                                        (model as any).enabled 
                                          ? "border-primary/50 bg-primary/5" 
                                          : "border-border hover:border-muted-foreground/50"
                                      )}
                                      onClick={() => handleGenerationModelToggle('image', modelId)}
                                    >
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="font-medium text-sm">{modelId}</h4>
                                              {(model as any).enabled && (
                                                <Badge variant="secondary" className="text-xs">
                                                  Enabled
                                                </Badge>
                                              )}
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-2">
                                              Priority: {(model as any).priority}
                                            </div>
                                            <div className="flex gap-1 mb-2">
                                              <Badge variant="secondary" className="text-xs">
                                                Image Generation
                                              </Badge>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={(model as any).enabled}
                                              onCheckedChange={() => handleGenerationModelToggle('image', modelId)}
                                              onClick={(e) => e.stopPropagation()}
                                              className={cn(
                                                (model as any).enabled && 
                                                "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                              )}
                                            />
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Video Generation Tab */}
                    <TabsContent value="video" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Video className="w-5 h-5" />
                            Video Generation
                          </CardTitle>
                          <CardDescription>
                            Configure video generation models and settings using Google Veo 3.0 Generate Preview
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Enable Video Generation</h4>
                              <p className="text-sm text-muted-foreground">
                                Allow AI to generate videos from text prompts
                              </p>
                            </div>
                            <Switch
                              checked={generationSettings.video.enabled}
                              onCheckedChange={() => handleGenerationToggle('video')}
                            />
                          </div>

                          {generationSettings.video.enabled && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Provider</label>
                              <Select
                                value={generationSettings.video.provider}
                                onValueChange={(value) => handleGenerationProviderChange('video', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="openai">OpenAI (Sora)</SelectItem>
                                  <SelectItem value="runway">Runway ML (Gen-3)</SelectItem>
                                  <SelectItem value="google">Google (Veo 3.0 Generate Preview)</SelectItem>
                                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Audio Generation Tab */}
                    <TabsContent value="audio" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Music className="w-5 h-5" />
                            Audio Generation
                          </CardTitle>
                          <CardDescription>
                            Configure audio generation models and TTS settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Enable Audio Generation</h4>
                              <p className="text-sm text-muted-foreground">
                                Allow AI to generate audio from text prompts
                              </p>
                            </div>
                            <Switch
                              checked={generationSettings.audio.enabled}
                              onCheckedChange={() => handleGenerationToggle('audio')}
                            />
                          </div>

                          {generationSettings.audio.enabled && (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Provider</label>
                                <Select
                                  value={generationSettings.audio.provider}
                                  onValueChange={(value) => handleGenerationProviderChange('audio', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="google">Google (Gemini TTS)</SelectItem>
                                    <SelectItem value="openai">OpenAI (TTS)</SelectItem>
                                    <SelectItem value="inworld">Inworld AI (TTS)</SelectItem>
                                    <SelectItem value="local-inworld">Local Inworld AI (TTS) - Free</SelectItem>
                                    <SelectItem value="vibevoice">Microsoft (VibeVoice)</SelectItem>
                                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* TTS Settings for Local Inworld */}
                              {generationSettings.audio.provider === 'local-inworld' && (
                                <div className="space-y-4 border-t pt-4">
                                  <h4 className="font-medium text-sm">Local Inworld TTS Settings</h4>
                                  
                                  <div className="p-3 bg-muted rounded-md">
                                    <p className="text-sm text-muted-foreground">
                                      <strong>✓ Completely Free & Offline</strong> - No API key required
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Automatically downloads models locally. Requires Electron environment.
                                    </p>
                                  </div>

                                  {/* Setup Status Check */}
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Setup Status</label>
                                                                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-800">
                                      <strong>Debug Information:</strong>
                                    </p>
                                    <p className="text-xs text-blue-700 mt-1">
                                      Environment: {typeof window !== 'undefined' && !!window.electronAPI ? 'Electron' : 'Browser'}
                                    </p>
                                    <p className="text-xs text-blue-700">
                                      Python Path: {process.env.PYTHON_PATH || 'python3'}
                                    </p>
                                    <p className="text-xs text-blue-700">
                                      Models Directory: ./models/inworld-tts-local
                                    </p>
                                    {typeof window !== 'undefined' && !window.electronAPI && (
                                      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                                        <p className="text-xs text-yellow-800">
                                          ⚠️ <strong>Electron Required:</strong> Local Inworld TTS requires Electron environment. 
                                          Use the Electron version for local TTS functionality.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        console.log('Testing Local Inworld TTS setup...')
                                        console.log('Environment:', typeof window !== 'undefined' && !!window.electronAPI ? 'Electron' : 'Browser')
                                        console.log('Python Path:', process.env.PYTHON_PATH || 'python3')
                                        console.log('Models Directory: ./models/inworld-tts-local')
                                        
                                        // Electron環境でのテスト
                                        if (typeof window !== 'undefined' && window.electronAPI) {
                                          window.electronAPI.localTTSListModels({
                                            pythonPath: process.env.PYTHON_PATH || 'python3',
                                            modelsDir: './models/inworld-tts-local'
                                          }).then(result => {
                                            console.log('Local TTS Models Test Result:', result)
                                            alert(`Setup Test Result: ${result.success ? 'Success' : 'Failed'}\nModels: ${result.models?.join(', ') || 'None'}\nDevice: ${result.device || 'Unknown'}`)
                                          }).catch(error => {
                                            console.error('Local TTS Test Error:', error)
                                            alert(`Setup Test Error: ${error.message}`)
                                          })
                                        } else {
                                          alert('This feature requires Electron environment')
                                        }
                                      }}
                                    >
                                      Test Setup
                                    </Button>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Voice</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultVoice || 'tts-1'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultVoice', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="tts-1">TTS-1 Local - High Quality</SelectItem>
                                        <SelectItem value="tts-1-max">TTS-1 Max Local - Maximum Quality</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Language</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultLanguage || 'en-US'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultLanguage', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="en-US">英語 (米国)</SelectItem>
                                        <SelectItem value="ja-JP">日本語 (日本)</SelectItem>
                                        <SelectItem value="zh-CN">中国語 (簡体)</SelectItem>
                                        <SelectItem value="ko-KR">韓国語 (韓国)</SelectItem>
                                        <SelectItem value="en-GB">英語 (英国)</SelectItem>
                                        <SelectItem value="de-DE">ドイツ語 (ドイツ)</SelectItem>
                                        <SelectItem value="fr-FR">フランス語 (フランス)</SelectItem>
                                        <SelectItem value="es-ES">スペイン語 (スペイン)</SelectItem>
                                        <SelectItem value="it-IT">イタリア語 (イタリア)</SelectItem>
                                        <SelectItem value="pt-BR">ポルトガル語 (ブラジル)</SelectItem>
                                        <SelectItem value="ru-RU">ロシア語 (ロシア)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}

                              {/* TTS Settings for Inworld */}
                              {generationSettings.audio.provider === 'inworld' && (
                                <div className="space-y-4 border-t pt-4">
                                  <h4 className="font-medium text-sm">Inworld TTS Settings</h4>
                                  
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">API Key</label>
                                    <div className="p-3 bg-muted rounded-md">
                                      <p className="text-sm text-muted-foreground">
                                        Inworld API Key is configured in <strong>Settings → API Keys → Inworld AI</strong>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Voice</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultVoice || 'Ashley'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultVoice', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Ashley">Ashley - Natural Female Voice</SelectItem>
                                        <SelectItem value="Alex">Alex - Natural Male Voice</SelectItem>
                                        <SelectItem value="Hades">Hades - Deep Male Voice</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Language</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultLanguage || 'en'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultLanguage', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="en">英語 (English)</SelectItem>
                                        <SelectItem value="de">ドイツ語 (German)</SelectItem>
                                        <SelectItem value="fr">フランス語 (French)</SelectItem>
                                        <SelectItem value="es">スペイン語 (Spanish)</SelectItem>
                                        <SelectItem value="it">イタリア語 (Italian)</SelectItem>
                                        <SelectItem value="pt">ポルトガル語 (Portuguese)</SelectItem>
                                        <SelectItem value="ru">ロシア語 (Russian)</SelectItem>
                                        <SelectItem value="ko">韓国語 (Korean)</SelectItem>
                                        <SelectItem value="zh">中国語 (Chinese)</SelectItem>
                                        <SelectItem value="ja">日本語 (Japanese)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}

                              {/* TTS Settings for Google */}
                              {generationSettings.audio.provider === 'google' && (
                                <div className="space-y-4 border-t pt-4">
                                  <h4 className="font-medium text-sm">Gemini TTS Settings</h4>
                                  
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">API Key</label>
                                    <div className="p-3 bg-muted rounded-md">
                                      <p className="text-sm text-muted-foreground">
                                        Google API Key is configured in <strong>Settings → API Keys → Google</strong>
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        The same API key used for Gemini models will be used for TTS functionality.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Voice</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultVoice || 'Kore'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultVoice', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Kore">Kore - 明るく親しみやすい</SelectItem>
                                        <SelectItem value="Irrhoe">Irrhoe - おおらか</SelectItem>
                                        <SelectItem value="Autonoe">Autonoe - Bright</SelectItem>
                                        <SelectItem value="Enceladus">Enceladus - Breathy</SelectItem>
                                        <SelectItem value="Iapetus">Iapetus - Clear</SelectItem>
                                        <SelectItem value="Umbriel">Umbriel - Easy-going</SelectItem>
                                        <SelectItem value="Algieba">Algieba - Smooth</SelectItem>
                                        <SelectItem value="Despina">Despina - Smooth</SelectItem>
                                        <SelectItem value="Erinome">Erinome - クリア</SelectItem>
                                        <SelectItem value="Algenib">Algenib - Gravelly</SelectItem>
                                        <SelectItem value="Rasalgethi">Rasalgethi - 情報が豊富</SelectItem>
                                        <SelectItem value="Laomedeia">Laomedeia - アップビート</SelectItem>
                                        <SelectItem value="Achernar">Achernar - Soft</SelectItem>
                                        <SelectItem value="Alnilam">Alnilam - Firm</SelectItem>
                                        <SelectItem value="Schedar">Schedar - Even</SelectItem>
                                        <SelectItem value="Gacrux">Gacrux - 成人向け</SelectItem>
                                        <SelectItem value="Pulcherrima">Pulcherrima - Forward</SelectItem>
                                        <SelectItem value="Achird">Achird - フレンドリー</SelectItem>
                                        <SelectItem value="Zubenelgenubi">Zubenelgenubi - カジュアル</SelectItem>
                                        <SelectItem value="Vindemiatrix">Vindemiatrix - Gentle</SelectItem>
                                        <SelectItem value="Sadachbia">Sadachbia - Lively</SelectItem>
                                        <SelectItem value="Sadaltager">Sadaltager - Knowledgeable</SelectItem>
                                        <SelectItem value="Sulafat">Sulafat - Warm</SelectItem>
                                        
                                        {/* VibeVoice音声オプション */}
                                        <SelectItem value="vibevoice-default">VibeVoice Default - 自然で表現力豊か</SelectItem>
                                        <SelectItem value="vibevoice-japanese">VibeVoice Japanese - 日本語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-chinese">VibeVoice Chinese - 中国語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-korean">VibeVoice Korean - 韓国語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-english">VibeVoice English - 英語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-spanish">VibeVoice Spanish - スペイン語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-french">VibeVoice French - フランス語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-german">VibeVoice German - ドイツ語に最適化</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Language</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultLanguage || 'ja-JP'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultLanguage', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="ja-JP">日本語 (日本)</SelectItem>
                                        <SelectItem value="en-US">英語 (米国)</SelectItem>
                                        <SelectItem value="ko-KR">韓国語 (韓国)</SelectItem>
                                        <SelectItem value="zh-CN">中国語 (簡体)</SelectItem>
                                        <SelectItem value="fr-FR">フランス語 (フランス)</SelectItem>
                                        <SelectItem value="de-DE">ドイツ語 (ドイツ)</SelectItem>
                                        <SelectItem value="es-ES">スペイン語 (スペイン)</SelectItem>
                                        <SelectItem value="it-IT">イタリア語 (イタリア)</SelectItem>
                                        <SelectItem value="pt-BR">ポルトガル語 (ブラジル)</SelectItem>
                                        <SelectItem value="ru-RU">ロシア語 (ロシア)</SelectItem>
                                        <SelectItem value="ar-EG">アラビア語 (エジプト)</SelectItem>
                                        <SelectItem value="hi-IN">ヒンディー語 (インド)</SelectItem>
                                        <SelectItem value="th-TH">タイ語 (タイ)</SelectItem>
                                        <SelectItem value="tr-TR">トルコ語 (トルコ)</SelectItem>
                                        <SelectItem value="vi-VN">ベトナム語 (ベトナム)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Style (Optional)</label>
                                    <Input
                                      placeholder="例: cheerfully, softly, excitedly"
                                      value={generationSettings.audio.tts?.defaultStyle || ''}
                                      onChange={(e) => handleTTSSettingChange('defaultStyle', e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                      Natural language style instructions for voice generation
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Available Models</label>
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id="tts-flash"
                                          checked={generationSettings.audio.models['gemini-2.5-flash-preview-tts']?.enabled || false}
                                          onChange={(e) => {
                                            setGenerationSettings((prev: any) => ({
                                              ...prev,
                                              audio: {
                                                ...prev.audio,
                                                models: {
                                                  ...prev.audio.models,
                                                  'gemini-2.5-flash-preview-tts': {
                                                    ...prev.audio.models['gemini-2.5-flash-preview-tts'],
                                                    enabled: e.target.checked
                                                  }
                                                }
                                              }
                                            }))
                                          }}
                                        />
                                        <label htmlFor="tts-flash" className="text-sm">
                                          Gemini 2.5 Flash TTS (Recommended)
                                        </label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id="tts-pro"
                                          checked={generationSettings.audio.models['gemini-2.5-pro-preview-tts']?.enabled || false}
                                          onChange={(e) => {
                                            setGenerationSettings((prev: any) => ({
                                              ...prev,
                                              audio: {
                                                ...prev.audio,
                                                models: {
                                                  ...prev.audio.models,
                                                  'gemini-2.5-pro-preview-tts': {
                                                    ...prev.audio.models['gemini-2.5-pro-preview-tts'],
                                                    enabled: e.target.checked
                                                  }
                                                }
                                              }
                                            }))
                                          }}
                                        />
                                        <label htmlFor="tts-pro" className="text-sm">
                                          Gemini 2.5 Pro TTS
                                        </label>
                                      </div>

                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* TTS Settings for OpenAI */}
                              {generationSettings.audio.provider === 'openai' && (
                                <div className="space-y-4 border-t pt-4">
                                  <h4 className="font-medium text-sm">OpenAI TTS Settings</h4>
                                  
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">API Key</label>
                                    <div className="p-3 bg-muted rounded-md">
                                      <p className="text-sm text-muted-foreground">
                                        OpenAI API Key is configured in <strong>Settings → API Keys → OpenAI</strong>
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        The same API key used for OpenAI models will be used for TTS functionality.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Voice</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultVoice || 'alloy'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultVoice', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="alloy">Alloy - バランスの取れた多用途</SelectItem>
                                        <SelectItem value="echo">Echo - 温かく表現力豊か</SelectItem>
                                        <SelectItem value="fable">Fable - クリアで魅力的</SelectItem>
                                        <SelectItem value="onyx">Onyx - 深みがあり権威的</SelectItem>
                                        <SelectItem value="nova">Nova - 明るくエネルギッシュ</SelectItem>
                                        <SelectItem value="shimmer">Shimmer - ソフトでメロディアス</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Language</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultLanguage || 'en-US'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultLanguage', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="en-US">英語 (米国)</SelectItem>
                                        <SelectItem value="en-GB">英語 (英国)</SelectItem>
                                        <SelectItem value="de-DE">ドイツ語 (ドイツ)</SelectItem>
                                        <SelectItem value="fr-FR">フランス語 (フランス)</SelectItem>
                                        <SelectItem value="es-ES">スペイン語 (スペイン)</SelectItem>
                                        <SelectItem value="it-IT">イタリア語 (イタリア)</SelectItem>
                                        <SelectItem value="pt-BR">ポルトガル語 (ブラジル)</SelectItem>
                                        <SelectItem value="ru-RU">ロシア語 (ロシア)</SelectItem>
                                        <SelectItem value="ko-KR">韓国語 (韓国)</SelectItem>
                                        <SelectItem value="zh-CN">中国語 (簡体)</SelectItem>
                                        <SelectItem value="ja-JP">日本語 (日本)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Available Models</label>
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id="openai-tts-mini"
                                          checked={generationSettings.audio.models['gpt-4o-mini-tts']?.enabled || false}
                                          onChange={(e) => {
                                            setGenerationSettings((prev: any) => ({
                                              ...prev,
                                              audio: {
                                                ...prev.audio,
                                                models: {
                                                  ...prev.audio.models,
                                                  'gpt-4o-mini-tts': {
                                                    ...prev.audio.models['gpt-4o-mini-tts'],
                                                    enabled: e.target.checked
                                                  }
                                                }
                                              }
                                            }))
                                          }}
                                        />
                                        <label htmlFor="openai-tts-mini" className="text-sm">
                                          GPT-4o Mini TTS (Recommended)
                                        </label>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* TTS Settings for VibeVoice */}
                              {generationSettings.audio.provider === 'vibevoice' && (
                                <div className="space-y-4 border-t pt-4">
                                  <h4 className="font-medium text-sm">VibeVoice TTS Settings</h4>
                                  
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">API Key</label>
                                    <div className="p-3 bg-muted rounded-md">
                                      <p className="text-sm text-muted-foreground">
                                        Hugging Face API Key is configured in <strong>Settings → API Keys → Hugging Face</strong>
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        VibeVoice uses Hugging Face Inference API for text-to-speech generation.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Voice</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultVoice || 'vibevoice-default'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultVoice', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="vibevoice-default">VibeVoice Default - 自然で表現力豊か</SelectItem>
                                        <SelectItem value="vibevoice-japanese">VibeVoice Japanese - 日本語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-chinese">VibeVoice Chinese - 中国語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-korean">VibeVoice Korean - 韓国語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-english">VibeVoice English - 英語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-spanish">VibeVoice Spanish - スペイン語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-french">VibeVoice French - フランス語に最適化</SelectItem>
                                        <SelectItem value="vibevoice-german">VibeVoice German - ドイツ語に最適化</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Default Language</label>
                                    <Select
                                      value={generationSettings.audio.tts?.defaultLanguage || 'en-US'}
                                      onValueChange={(value) => handleTTSSettingChange('defaultLanguage', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="en-US">英語 (米国)</SelectItem>
                                        <SelectItem value="ja-JP">日本語 (日本)</SelectItem>
                                        <SelectItem value="zh-CN">中国語 (簡体)</SelectItem>
                                        <SelectItem value="ko-KR">韓国語 (韓国)</SelectItem>
                                        <SelectItem value="es-ES">スペイン語 (スペイン)</SelectItem>
                                        <SelectItem value="fr-FR">フランス語 (フランス)</SelectItem>
                                        <SelectItem value="de-DE">ドイツ語 (ドイツ)</SelectItem>
                                        <SelectItem value="it-IT">イタリア語 (イタリア)</SelectItem>
                                        <SelectItem value="pt-BR">ポルトガル語 (ブラジル)</SelectItem>
                                        <SelectItem value="ru-RU">ロシア語 (ロシア)</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Available Models</label>
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">

                                      </div>
                                    </div>
                                  </div>


                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Code Generation Tab */}
                    <TabsContent value="code" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            Code Generation
                          </CardTitle>
                          <CardDescription>
                            Configure code generation models and settings
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">Enable Code Generation</h4>
                              <p className="text-sm text-muted-foreground">
                                Allow AI to generate code from text prompts
                              </p>
                            </div>
                            <Switch
                              checked={generationSettings.code.enabled}
                              onCheckedChange={() => handleGenerationToggle('code')}
                            />
                          </div>

                          {generationSettings.code.enabled && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Provider</label>
                              <Select
                                value={generationSettings.code.provider}
                                onValueChange={(value) => handleGenerationProviderChange('code', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                                  <SelectItem value="google">Google (Gemini)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              {/* Workflow Tab */}
              <TabsContent value="workflow" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Workflow Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Scope</label>
                      <Select value={settings.workflow.scope} onValueChange={(value) => 
                        setSettings(prev => ({ ...prev, workflow: { ...prev.workflow, scope: value } }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prompt Templates</label>
                      <Textarea 
                        placeholder="Add your prompt templates here..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">MulmoScript Templates</label>
                      <Textarea 
                        placeholder="Add your MulmoScript templates here..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Indexing Tab */}
              <TabsContent value="indexing" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-5 h-5" />
                        Indexing Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Auto Index Materials</label>
                        <Switch 
                          checked={settings.indexing.autoIndex}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, indexing: { ...prev.indexing, autoIndex: checked } }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Max File Size (MB)</label>
                        <Input
                          type="number"
                          value={Math.round(settings.indexing.maxFileSize / (1024 * 1024))}
                          onChange={(e) => 
                            setSettings(prev => ({ 
                              ...prev, 
                              indexing: { 
                                ...prev.indexing, 
                                maxFileSize: parseInt(e.target.value) * 1024 * 1024 
                              } 
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Excluded Extensions</label>
                        <Input
                          value={settings.indexing.excludedExtensions.join(', ')}
                          onChange={(e) => 
                            setSettings(prev => ({ 
                              ...prev, 
                              indexing: { 
                                ...prev.indexing, 
                                excludedExtensions: e.target.value.split(',').map(ext => ext.trim()) 
                              } 
                            }))
                          }
                          placeholder=".mp4, .avi, .mov"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Index List</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        No indexed materials found.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Memory Tab */}
              <TabsContent value="memory" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5" />
                      Memory Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Enable Memory</label>
                      <Switch 
                        checked={settings.memory.enabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, memory: { ...prev.memory, enabled: checked } }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Entries</label>
                      <Input
                        type="number"
                        value={settings.memory.maxEntries}
                        onChange={(e) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            memory: { ...prev.memory, maxEntries: parseInt(e.target.value) } 
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Auto Cleanup</label>
                      <Switch 
                        checked={settings.memory.autoCleanup}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, memory: { ...prev.memory, autoCleanup: checked } }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Network Tab */}
              <TabsContent value="network" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="w-5 h-5" />
                      Network Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Enable Scraping</label>
                      <Switch 
                        checked={settings.network.scrapingEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, network: { ...prev.network, scrapingEnabled: checked } }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">HTTP/2 Support</label>
                      <Switch 
                        checked={settings.network.http2Enabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, network: { ...prev.network, http2Enabled: checked } }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Timeout (ms)</label>
                      <Input
                        type="number"
                        value={settings.network.timeout}
                        onChange={(e) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            network: { ...prev.network, timeout: parseInt(e.target.value) } 
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="w-5 h-5" />
                      Tools & Modes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Whisper Analysis</label>
                        <Switch 
                          checked={settings.tools.whisper}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, tools: { ...prev.tools, whisper: checked } }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">PySceneDetect</label>
                        <Switch 
                          checked={settings.tools.pySceneDetect}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, tools: { ...prev.tools, pySceneDetect: checked } }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">TTS Generation</label>
                        <Switch 
                          checked={settings.tools.tts}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, tools: { ...prev.tools, tts: checked } }))
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Diff Build</label>
                        <Switch 
                          checked={settings.tools.diffBuild}
                          onCheckedChange={(checked) => 
                            setSettings(prev => ({ ...prev, tools: { ...prev.tools, diffBuild: checked } }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Performance Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Preview Speed Target (seconds)</label>
                      <Input
                        type="number"
                        value={settings.performance.previewSpeed}
                        onChange={(e) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            performance: { ...prev.performance, previewSpeed: parseInt(e.target.value) } 
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">GPU Acceleration</label>
                      <Switch 
                        checked={settings.performance.gpuEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, performance: { ...prev.performance, gpuEnabled: checked } }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Telemetry</label>
                      <Switch 
                        checked={settings.performance.telemetry}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, performance: { ...prev.performance, telemetry: checked } }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Output Tab */}
              <TabsContent value="output" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        Output Format
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Video Codec</label>
                        <Select value={settings.output.videoCodec} onValueChange={(value) => 
                          setSettings(prev => ({ ...prev, output: { ...prev.output, videoCodec: value } }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="h264">H.264</SelectItem>
                            <SelectItem value="h265">H.265</SelectItem>
                            <SelectItem value="vp9">VP9</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Audio Codec</label>
                        <Select value={settings.output.audioCodec} onValueChange={(value) => 
                          setSettings(prev => ({ ...prev, output: { ...prev.output, audioCodec: value } }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aac">AAC</SelectItem>
                            <SelectItem value="mp3">MP3</SelectItem>
                            <SelectItem value="opus">Opus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Resolution</label>
                        <Select value={settings.output.resolution} onValueChange={(value) => 
                          setSettings(prev => ({ ...prev, output: { ...prev.output, resolution: value } }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="720p">720p</SelectItem>
                            <SelectItem value="1080p">1080p</SelectItem>
                            <SelectItem value="4k">4K</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Frame Rate</label>
                        <Select value={settings.output.fps.toString()} onValueChange={(value) => 
                          setSettings(prev => ({ ...prev, output: { ...prev.output, fps: parseInt(value) } }))
                        }>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="24">24 fps</SelectItem>
                            <SelectItem value="30">30 fps</SelectItem>
                            <SelectItem value="60">60 fps</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Supported Formats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {settings.output.supportedFormats.map((format) => (
                          <Badge key={format} variant="secondary">
                            {format}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* CLI Font Tab */}
              <TabsContent value="cli-font" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">CLI Font Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize the terminal font appearance for better readability and coding experience.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Type className="w-5 h-5" />
                          Font Selection
                        </CardTitle>
                        <CardDescription>
                          Choose from popular programming fonts optimized for CLI usage
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Font Family</label>
                          <Select 
                            value={settings.cli.fontFamily} 
                            onValueChange={(value) => {
                              const newSettings = {
                                ...settings.cli,
                                fontFamily: value
                              }
                              setSettings(prev => ({ 
                                ...prev, 
                                cli: newSettings
                              }))
                              if (onCliFontSettingsChange) {
                                onCliFontSettingsChange(newSettings)
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Fira Code">Fira Code</SelectItem>
                              <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                              <SelectItem value="Cascadia Code">Cascadia Code</SelectItem>
                              <SelectItem value="IBM Plex Mono">IBM Plex Mono</SelectItem>
                              <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                              <SelectItem value="Ubuntu Mono">Ubuntu Mono</SelectItem>
                              <SelectItem value="Monaco">Monaco</SelectItem>
                              <SelectItem value="Menlo">Menlo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Font Size</label>
                          <Select 
                            value={settings.cli.fontSize.toString()} 
                            onValueChange={(value) => {
                              const newSettings = {
                                ...settings.cli,
                                fontSize: parseInt(value)
                              }
                              setSettings(prev => ({ 
                                ...prev, 
                                cli: newSettings
                              }))
                              if (onCliFontSettingsChange) {
                                onCliFontSettingsChange(newSettings)
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="10">10px</SelectItem>
                              <SelectItem value="11">11px</SelectItem>
                              <SelectItem value="12">12px</SelectItem>
                              <SelectItem value="13">13px</SelectItem>
                              <SelectItem value="14">14px</SelectItem>
                              <SelectItem value="16">16px</SelectItem>
                              <SelectItem value="18">18px</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="font-ligatures"
                            checked={settings.cli.fontLigatures}
                            onCheckedChange={(checked) => {
                              const newSettings = {
                                ...settings.cli,
                                fontLigatures: checked
                              }
                              setSettings(prev => ({ 
                                ...prev, 
                                cli: newSettings
                              }))
                              if (onCliFontSettingsChange) {
                                onCliFontSettingsChange(newSettings)
                              }
                            }}
                          />
                          <label htmlFor="font-ligatures" className="text-sm font-medium">
                            Enable Font Ligatures
                          </label>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Font Preview</CardTitle>
                        <CardDescription>
                          Preview how the selected font will look in the terminal
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="p-4 bg-black text-green-400 rounded-md font-mono text-sm overflow-auto"
                          style={{
                            fontFamily: `"${settings.cli.fontFamily}", monospace`,
                            fontSize: `${settings.cli.fontSize}px`,
                            fontFeatureSettings: settings.cli.fontLigatures ? '"liga" 1, "calt" 1' : 'normal'
                          }}
                        >
                          <div className="mb-1">$ npm install @armis/cli</div>
                          <div className="mb-1">$ git clone https://github.com/armis/cli</div>
                          <div className="mb-1">$ docker run -it armis/cli</div>
                          <div className="mb-1">const result = await fetch("/api/data");</div>
                          <div className="mb-1">if (condition) {`{`}</div>
                          <div className="mb-1">  console.log("Hello World");</div>
                          <div className="mb-1">{`}`}</div>
                          <div className="text-yellow-400">// リガチャ対応フォントでは =&gt; が矢印になります</div>
                          <div className="text-cyan-400">=&gt; 矢印の例</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* LangChain Agents Tab */}
              <TabsContent value="langchain-agents" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">LangChain Agents Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure and manage LangChain agents for advanced AI workflows and automation.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          Agent Management
                        </CardTitle>
                        <CardDescription>
                          Create and manage LangChain agents for different use cases
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                                                 <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-sm font-medium">Agent Type</label>
                             <Select value={agentType} onValueChange={setAgentType}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Select agent type" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="basic">Basic Agent</SelectItem>
                                 <SelectItem value="chat">Chat Agent</SelectItem>
                                 <SelectItem value="zero-shot">Zero-Shot Agent</SelectItem>
                                 <SelectItem value="react">ReAct Agent</SelectItem>
                                 <SelectItem value="openai-functions">OpenAI Functions Agent</SelectItem>
                                 <SelectItem value="openai-tools">OpenAI Tools Agent</SelectItem>
                                 <SelectItem value="tool-calling">Tool Calling Agent</SelectItem>
                                 <SelectItem value="json">JSON Agent</SelectItem>
                                 <SelectItem value="openapi">OpenAPI Agent</SelectItem>
                                 <SelectItem value="vectorstore">VectorStore Agent</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                           
                           <div className="space-y-2">
                             <label className="text-sm font-medium">Model Type</label>
                             <Select value={agentModelType} onValueChange={setAgentModelType}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Select model type" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="openai">OpenAI</SelectItem>
                                 <SelectItem value="anthropic">Anthropic</SelectItem>
                                 <SelectItem value="google">Google</SelectItem>
                                 <SelectItem value="ollama">Ollama</SelectItem>
                                 <SelectItem value="llama-cpp">Llama.cpp</SelectItem>
                               </SelectContent>
                             </Select>
                           </div>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-sm font-medium">Temperature</label>
                             <Input 
                               type="number" 
                               min="0" 
                               max="2" 
                               step="0.1" 
                               placeholder="0.0" 
                               value={agentTemperature}
                               onChange={(e) => setAgentTemperature(e.target.value)}
                             />
                           </div>
                           
                           <div className="space-y-2">
                             <label className="text-sm font-medium">Max Tokens</label>
                             <Input 
                               type="number" 
                               min="1" 
                               placeholder="1000" 
                               value={agentMaxTokens}
                               onChange={(e) => setAgentMaxTokens(e.target.value)}
                             />
                           </div>
                         </div>

                         <div className="space-y-2">
                           <label className="text-sm font-medium">API Key</label>
                           <Input 
                             type="password" 
                             placeholder="Enter API key for the selected model" 
                             value={agentApiKey}
                             onChange={(e) => setAgentApiKey(e.target.value)}
                           />
                         </div>

                         <div className="flex gap-2">
                           <Button 
                             className="flex-1" 
                             onClick={handleCreateAgent}
                             disabled={isCreatingAgent}
                           >
                             {isCreatingAgent ? (
                               <>
                                 <CircleSpinner size="sm" className="mr-2" />
                                 Creating...
                               </>
                             ) : (
                               <>
                                 <Brain className="w-4 h-4 mr-2" />
                                 Create Agent
                               </>
                             )}
                           </Button>
                           <Button variant="outline" className="flex-1">
                             <Wrench className="w-4 h-4 mr-2" />
                             Manage Agents
                           </Button>
                         </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Wrench className="w-5 h-5" />
                          Agent Tools
                        </CardTitle>
                        <CardDescription>
                          Configure tools and capabilities for your agents
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                                                 <div className="space-y-2">
                           <label className="text-sm font-medium">Available Tools</label>
                           <div className="grid grid-cols-2 gap-2">
                             <div className="flex items-center space-x-2">
                               <Switch 
                                 id="web-search" 
                                 checked={agentTools.webSearch}
                                 onCheckedChange={() => handleToolToggle('webSearch')}
                               />
                               <label htmlFor="web-search" className="text-sm">Web Search</label>
                             </div>
                             <div className="flex items-center space-x-2">
                               <Switch 
                                 id="file-operations" 
                                 checked={agentTools.fileOperations}
                                 onCheckedChange={() => handleToolToggle('fileOperations')}
                               />
                               <label htmlFor="file-operations" className="text-sm">File Operations</label>
                             </div>
                             <div className="flex items-center space-x-2">
                               <Switch 
                                 id="code-execution" 
                                 checked={agentTools.codeExecution}
                                 onCheckedChange={() => handleToolToggle('codeExecution')}
                               />
                               <label htmlFor="code-execution" className="text-sm">Code Execution</label>
                             </div>
                             <div className="flex items-center space-x-2">
                               <Switch 
                                 id="database-access" 
                                 checked={agentTools.databaseAccess}
                                 onCheckedChange={() => handleToolToggle('databaseAccess')}
                               />
                               <label htmlFor="database-access" className="text-sm">Database Access</label>
                             </div>
                           </div>
                         </div>

                         <div className="space-y-2">
                           <label className="text-sm font-medium">Agent Settings</label>
                           <div className="grid grid-cols-2 gap-2">
                             <div className="flex items-center space-x-2">
                               <Switch 
                                 id="verbose-mode" 
                                 checked={agentSettings.verboseMode}
                                 onCheckedChange={() => handleSettingToggle('verboseMode')}
                               />
                               <label htmlFor="verbose-mode" className="text-sm">Verbose Mode</label>
                             </div>
                             <div className="flex items-center space-x-2">
                               <Switch 
                                 id="return-intermediate" 
                                 checked={agentSettings.returnIntermediate}
                                 onCheckedChange={() => handleSettingToggle('returnIntermediate')}
                               />
                               <label htmlFor="return-intermediate" className="text-sm">Return Intermediate Steps</label>
                             </div>
                           </div>
                         </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Monitor className="w-5 h-5" />
                          Agent Status
                        </CardTitle>
                        <CardDescription>
                          Monitor and manage running agents
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-muted-foreground">
                          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No agents are currently running</p>
                          <p className="text-sm">Create an agent to get started</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Theme Tab */}
              <TabsContent value="theme" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Theme Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize the appearance of the application with different themes.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Palette className="w-5 h-5" />
                          Theme Selection
                        </CardTitle>
                        <CardDescription>
                          Choose your preferred theme for the application
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Theme Mode</label>
                          <Select 
                            value={theme} 
                            onValueChange={(value: 'light' | 'dark' | 'system') => handleThemeChange(value)}
                            disabled={!mounted}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                  <Sun className="w-4 h-4" />
                                  Light
                                </div>
                              </SelectItem>
                              <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                  <Moon className="w-4 h-4" />
                                  Dark
                                </div>
                              </SelectItem>
                              <SelectItem value="system">
                                <div className="flex items-center gap-2">
                                  <Monitor className="w-4 h-4" />
                                  System
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Current Theme</label>
                          <div className="p-3 bg-muted rounded-md">
                            <div className="flex items-center gap-2">
                              {theme === 'light' && <Sun className="w-4 h-4" />}
                              {theme === 'dark' && <Moon className="w-4 h-4" />}
                              {theme === 'system' && <Monitor className="w-4 h-4" />}
                              <span className="text-sm">
                                {theme === 'light' && 'Light Mode'}
                                {theme === 'dark' && 'Dark Mode'}
                                {theme === 'system' && 'System Default'}
                              </span>
                            </div>
                            {theme === 'system' && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Follows your system's color scheme preference
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Theme Preview</label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Light Theme Preview */}
                            <Card 
                              className={cn(
                                "cursor-pointer transition-all",
                                theme === 'light' 
                                  ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20" 
                                  : "border-border hover:border-muted-foreground/50"
                              )}
                              onClick={() => handleThemeChange('light')}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sun className="w-4 h-4" />
                                  <span className="font-medium text-sm">Light</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="h-2 bg-gray-200 rounded"></div>
                                  <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Dark Theme Preview */}
                            <Card 
                              className={cn(
                                "cursor-pointer transition-all",
                                theme === 'dark' 
                                  ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20" 
                                  : "border-border hover:border-muted-foreground/50"
                              )}
                              onClick={() => handleThemeChange('dark')}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Moon className="w-4 h-4" />
                                  <span className="font-medium text-sm">Dark</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="h-2 bg-gray-700 rounded"></div>
                                  <div className="h-2 bg-gray-800 rounded w-3/4"></div>
                                  <div className="h-2 bg-gray-700 rounded w-1/2"></div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* System Theme Preview */}
                            <Card 
                              className={cn(
                                "cursor-pointer transition-all",
                                theme === 'system' 
                                  ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20" 
                                  : "border-border hover:border-muted-foreground/50"
                              )}
                              onClick={() => handleThemeChange('system')}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Monitor className="w-4 h-4" />
                                  <span className="font-medium text-sm">System</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-700 rounded"></div>
                                  <div className="h-2 bg-gradient-to-r from-gray-100 to-gray-800 rounded w-3/4"></div>
                                  <div className="h-2 bg-gradient-to-r from-gray-200 to-gray-700 rounded w-1/2"></div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Theme Information</label>
                          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-medium mb-1">Theme Settings</p>
                                <ul className="text-xs space-y-1">
                                  <li>• <strong>Light:</strong> Clean, bright interface for daytime use</li>
                                  <li>• <strong>Dark:</strong> Easy on the eyes for low-light environments</li>
                                  <li>• <strong>System:</strong> Automatically matches your OS theme preference</li>
                                </ul>
                                <p className="text-xs mt-2 opacity-75">
                                  Theme changes are saved automatically and persist across sessions.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Fact Checking Tab */}
              <TabsContent value="fact-checking" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Fact Checking Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure AI-powered fact checking to verify the accuracy of generated content
                    </p>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Fact Checking Settings
                      </CardTitle>
                      <CardDescription>
                        Enable and configure fact checking for AI-generated content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Enable Fact Checking</h4>
                          <p className="text-sm text-muted-foreground">
                            Automatically verify factual accuracy of AI responses
                          </p>
                        </div>
                        <Switch
                          checked={settings.factChecking.enabled}
                          onCheckedChange={(checked) => {
                            const newSettings = {
                              ...settings.factChecking,
                              enabled: checked
                            }
                            setSettings(prev => ({ 
                              ...prev, 
                              factChecking: newSettings
                            }))
                            if (onFactCheckingSettingsChange) {
                              onFactCheckingSettingsChange(newSettings)
                            }
                          }}
                        />
                      </div>

                      {settings.factChecking.enabled && (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Fact Check Model</label>
                            <Select 
                              value={settings.factChecking.model} 
                              onValueChange={(value) => {
                                const newSettings = {
                                  ...settings.factChecking,
                                  model: value
                                }
                                setSettings(prev => ({ 
                                  ...prev, 
                                  factChecking: newSettings
                                }))
                                if (onFactCheckingSettingsChange) {
                                  onFactCheckingSettingsChange(newSettings)
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                                                              <SelectContent>
                                  <SelectItem value="openai">OpenAI GPT-4</SelectItem>
                                  <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                                  <SelectItem value="google">Google Gemini</SelectItem>
                                  <SelectItem value="ollama">Ollama (Local)</SelectItem>
                                </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Temperature</label>
                              <Select 
                                value={settings.factChecking.temperature.toString()} 
                                onValueChange={(value) => 
                                  setSettings(prev => ({ 
                                    ...prev, 
                                    factChecking: { ...prev.factChecking, temperature: parseFloat(value) } 
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0.1">0.1 (Conservative)</SelectItem>
                                  <SelectItem value="0.3">0.3 (Balanced)</SelectItem>
                                  <SelectItem value="0.5">0.5 (Creative)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Max Tokens</label>
                              <Input
                                type="number"
                                value={settings.factChecking.maxTokens}
                                onChange={(e) => 
                                  setSettings(prev => ({ 
                                    ...prev, 
                                    factChecking: { ...prev.factChecking, maxTokens: parseInt(e.target.value) } 
                                  }))
                                }
                                placeholder="1000"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="include-sources"
                                checked={settings.factChecking.includeSources}
                                onCheckedChange={(checked) => 
                                  setSettings(prev => ({ 
                                    ...prev, 
                                    factChecking: { ...prev.factChecking, includeSources: checked } 
                                  }))
                                }
                              />
                              <label htmlFor="include-sources" className="text-sm font-medium">
                                Include source citations
                              </label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="strict-mode"
                                checked={settings.factChecking.strictMode}
                                onCheckedChange={(checked) => 
                                  setSettings(prev => ({ 
                                    ...prev, 
                                    factChecking: { ...prev.factChecking, strictMode: checked } 
                                  }))
                                }
                              />
                              <label htmlFor="strict-mode" className="text-sm font-medium">
                                Strict mode (higher accuracy)
                              </label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="auto-check"
                                checked={settings.factChecking.autoCheck}
                                onCheckedChange={(checked) => 
                                  setSettings(prev => ({ 
                                    ...prev, 
                                    factChecking: { ...prev.factChecking, autoCheck: checked } 
                                  }))
                                }
                              />
                              <label htmlFor="auto-check" className="text-sm font-medium">
                                Auto-check AI responses
                              </label>
                            </div>
                          </div>

                          {settings.factChecking.autoCheck && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Confidence Threshold</label>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="1"
                                  step="0.1"
                                  value={settings.factChecking.checkThreshold}
                                  onChange={(e) => 
                                    setSettings(prev => ({ 
                                      ...prev, 
                                      factChecking: { ...prev.factChecking, checkThreshold: parseFloat(e.target.value) } 
                                    }))
                                  }
                                  className="w-20"
                                />
                                <span className="text-sm text-muted-foreground">
                                  Only check responses below this confidence level
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* STT Tab */}
              <TabsContent value="stt" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Speech to Text Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure Whisper.cpp models and STT settings for audio transcription
                    </p>
                  </div>
                  
                  <STTSettingsPanel />
                </div>
              </TabsContent>

            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
