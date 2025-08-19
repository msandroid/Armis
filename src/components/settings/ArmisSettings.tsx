import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ArrowRight
} from 'lucide-react'
import { AIProviderConfig, AVAILABLE_PROVIDERS, EnabledModel, ModelSettings } from '@/types/ai-sdk'
import { AISDKService } from '@/services/llm/ai-sdk-service'

interface ArmisSettingsProps {
  onClose: () => void
  className?: string
  onProviderSelect?: (config: AIProviderConfig) => Promise<void>
  currentProviderConfig?: AIProviderConfig | null
  onTestConnection?: () => Promise<boolean>
  onModelSettingsChange?: (settings: ModelSettings) => void
  currentModelSettings?: ModelSettings
  providerApiKeys?: Record<string, string>
  onProviderApiKeysChange?: (apiKeys: Record<string, string>) => void
}

export const ArmisSettings: React.FC<ArmisSettingsProps> = ({
  onClose,
  className,
  onProviderSelect,
  currentProviderConfig,
  onTestConnection,
  onModelSettingsChange,
  currentModelSettings,
  providerApiKeys: externalProviderApiKeys,
  onProviderApiKeysChange
}) => {
  const [activeTab, setActiveTab] = useState('api-keys')
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [baseUrl, setBaseUrl] = useState<string>('')
  const [temperature, setTemperature] = useState<number>(0.7)
  const [maxOutputTokens, setMaxOutputTokens] = useState<number>(1000)
  const [showRecommendedModels, setShowRecommendedModels] = useState(false)
  const [modelSearchTerm, setModelSearchTerm] = useState('')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [taskFilter, setTaskFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // プロバイダーごとのAPI Key管理
  const [providerApiKeys, setProviderApiKeys] = useState<Record<string, string>>(externalProviderApiKeys || {})

  // モデル設定の初期化
  const [modelSettings, setModelSettings] = useState<ModelSettings>(() => {
    if (currentModelSettings) {
      return currentModelSettings
    }
    
    // デフォルトで推奨モデルを有効にする
    const defaultEnabledModels: EnabledModel[] = [
      { providerId: 'openai', modelId: 'gpt-5', enabled: true, priority: 1 },
      { providerId: 'openai', modelId: 'o1', enabled: true, priority: 2 },
      { providerId: 'anthropic', modelId: 'claude-opus-4.1', enabled: true, priority: 3 },
      { providerId: 'google', modelId: 'gemini-2.5-pro', enabled: true, priority: 4 },
      { providerId: 'openai', modelId: 'gpt-4o', enabled: true, priority: 5 },
      { providerId: 'openai', modelId: 'o3', enabled: true, priority: 6 },
      { providerId: 'anthropic', modelId: 'claude-opus-4', enabled: true, priority: 7 },
      { providerId: 'google', modelId: 'gemini-2.5-flash', enabled: true, priority: 8 },
      { providerId: 'google', modelId: 'gemini-2.5-flash-lite', enabled: true, priority: 9 },
      { providerId: 'mistral', modelId: 'mistral-medium-2508', enabled: true, priority: 10 },
      { providerId: 'mistral', modelId: 'codestral-2508', enabled: true, priority: 11 },
      { providerId: 'fireworks', modelId: 'accounts/fireworks/models/llama-v3p1-8b-instruct', enabled: true, priority: 12 },
      { providerId: 'fireworks', modelId: 'gpt-oss-120b', enabled: true, priority: 13 },
      { providerId: 'fireworks', modelId: 'gpt-oss-20b', enabled: true, priority: 14 },
      { providerId: 'fireworks', modelId: 'flux-1', enabled: true, priority: 15 },
      { providerId: 'fireworks', modelId: 'flux-1-kontext', enabled: true, priority: 16 },
      { providerId: 'fireworks', modelId: 'llava-v1.6-34b', enabled: true, priority: 17 },
      { providerId: 'fireworks', modelId: 'llava-v1.6-13b', enabled: true, priority: 18 },
      { providerId: 'fireworks', modelId: 'whisper-large-v3', enabled: true, priority: 19 },
      { providerId: 'fireworks', modelId: 'accounts/fireworks/models/codellama-70b-instruct', enabled: true, priority: 20 },
      { providerId: 'xai', modelId: 'grok-4', enabled: true, priority: 21 }
    ]
    
    return {
      enabledModels: defaultEnabledModels,
      defaultModel: 'openai:gpt-5',
      autoSwitch: true
    }
  })

  const [settings, setSettings] = useState({
    // モデル関連設定
    models: {
      whisper: 'whisper-large-v3',
      lmm: 'gpt-4',
      tts: 'vits2',
      autoSwitch: true
    },
    // APIキー設定
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
    // ワークフロールール
    workflow: {
      promptTemplates: [],
      mulmoScriptTemplates: [],
      scope: 'global' // 'global' | 'project'
    },
    // インデックス設定
    indexing: {
      autoIndex: true,
      excludedExtensions: ['.mp4', '.avi', '.mov'],
      maxFileSize: 100 * 1024 * 1024, // 100MB
      indexList: []
    },
    // メモリー設定
    memory: {
      enabled: true,
      maxEntries: 1000,
      autoCleanup: true
    },
    // ネットワーク設定
    network: {
      scrapingEnabled: true,
      http2Enabled: true,
      timeout: 30000
    },
    // ツール設定
    tools: {
      whisper: true,
      pySceneDetect: true,
      tts: true,
      diffBuild: true,
      customWorkflows: []
    },
    // UI/パフォーマンス設定
    performance: {
      previewSpeed: 30, // 秒
      gpuEnabled: true,
      telemetry: false
    },
    // 入出力設定
    output: {
      videoCodec: 'h264',
      audioCodec: 'aac',
      resolution: '1080p',
      fps: 30,
      supportedFormats: ['.png', '.jpg', '.mp4', '.mp3', '.wav']
    }
  })

  const handleSave = () => {
    // モデル設定を保存
    if (onModelSettingsChange) {
      onModelSettingsChange(modelSettings)
    }
    
    // TODO: 設定を保存する処理
    console.log('Settings saved:', settings)
    console.log('Model settings saved:', modelSettings)
    onClose()
  }

  const handleTestConnection = async (provider: string) => {
    // TODO: 接続テストの実装
    console.log(`Testing connection for ${provider}`)
  }

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId)
    setSelectedModel('')
    const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId)
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id)
    }
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
  }

  const handleConfigureProvider = async () => {
    if (!selectedProvider || !selectedModel || !apiKey) {
      alert('Please select a provider, model, and enter an API key')
      return
    }

    const config: AIProviderConfig = {
      providerId: selectedProvider,
      modelId: selectedModel,
      apiKey: apiKey,
      baseUrl: baseUrl || undefined,
      temperature: temperature,
              maxOutputTokens: maxOutputTokens
    }

    if (onProviderSelect) {
      try {
        await onProviderSelect(config)
        // Clear form after successful configuration
        setSelectedProvider('')
        setSelectedModel('')
        setApiKey('')
        setBaseUrl('')
      } catch (error) {
        console.error('Failed to configure provider:', error)
        // Don't clear form on error so user can fix and retry
      }
    }
  }

  // モデル設定の管理
  const toggleModelEnabled = (providerId: string, modelId: string) => {
    setModelSettings(prev => {
      const existingIndex = prev.enabledModels.findIndex(
        m => m.providerId === providerId && m.modelId === modelId
      )
      
      let updatedSettings: ModelSettings
      
      if (existingIndex >= 0) {
        // 既存のモデルを更新
        const updatedModels = [...prev.enabledModels]
        updatedModels[existingIndex] = {
          ...updatedModels[existingIndex],
          enabled: !updatedModels[existingIndex].enabled
        }
        updatedSettings = { ...prev, enabledModels: updatedModels }
      } else {
        // 新しいモデルを追加
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

      // リアルタイムで変更を適用
      if (onModelSettingsChange) {
        onModelSettingsChange(updatedSettings)
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

      // リアルタイムで変更を適用
      if (onModelSettingsChange) {
        onModelSettingsChange(updatedSettings)
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

  // フィルタリングされたモデルリスト（プロバイダーごとにグループ化）
  const getFilteredModelsByProvider = () => {
    const filteredProviders: Array<{ provider: any; models: any[] }> = []
    
    const providersSorted = [...AVAILABLE_PROVIDERS].sort((a, b) => a.name.localeCompare(b.name))

    providersSorted.forEach(provider => {
      const filteredModels = provider.models.filter(model => {
        // 検索フィルター
        const matchesSearch = !modelSearchTerm || 
          model.name.toLowerCase().includes(modelSearchTerm.toLowerCase()) ||
          model.description?.toLowerCase().includes(modelSearchTerm.toLowerCase()) ||
          provider.name.toLowerCase().includes(modelSearchTerm.toLowerCase())
        
        // カテゴリフィルター
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

        // タスクフィルター
        let matchesTask = true
        switch (taskFilter) {
          case 'llm':
            matchesTask = !model.capabilities.imageInput && !model.capabilities.objectGeneration
            break
          case 'vision':
            matchesTask = model.capabilities.imageInput
            break
          case 'audio':
            // 音声関連のモデルを識別（名前や説明から）
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

  const getRecommendedModels = () => {
    const recommendations = [
      { 
        id: 'gpt-5', 
        providerId: 'openai', 
        name: 'GPT-5', 
        description: 'Latest and most capable model for complex reasoning', 
        capabilities: ['toolUsage', 'objectGeneration'] 
      },
      { 
        id: 'o1', 
        providerId: 'openai', 
        name: 'O1', 
        description: 'Advanced reasoning model with enhanced problem-solving', 
        capabilities: ['toolUsage', 'objectGeneration'] 
      },
      { 
        id: 'claude-opus-4.1', 
        providerId: 'anthropic', 
        name: 'Claude Opus 4.1', 
        description: 'Latest Claude model with enhanced reasoning', 
        capabilities: ['imageInput', 'toolUsage'] 
      },
      { 
        id: 'gemini-2.5-pro', 
        providerId: 'google', 
        name: 'Gemini 2.5 Pro', 
        description: 'Most capable Gemini model for complex reasoning', 
        capabilities: ['imageInput', 'toolUsage'] 
      },
      { 
        id: 'gpt-4o', 
        providerId: 'openai', 
        name: 'GPT-4o', 
        description: 'Latest GPT-4 model with enhanced capabilities and vision', 
        capabilities: ['imageInput', 'toolUsage'] 
      },
      { 
        id: 'o3', 
        providerId: 'openai', 
        name: 'O3', 
        description: 'High-performance reasoning model', 
        capabilities: ['toolUsage', 'objectGeneration'] 
      },
      { 
        id: 'claude-opus-4', 
        providerId: 'anthropic', 
        name: 'Claude Opus 4', 
        description: 'Most capable model for reasoning and analysis', 
        capabilities: ['imageInput', 'toolUsage'] 
      },
      { 
        id: 'gemini-2.5-flash', 
        providerId: 'google', 
        name: 'Gemini 2.5 Flash', 
        description: 'Fast and efficient model with enhanced capabilities', 
        capabilities: ['imageInput', 'toolUsage'] 
      },
      { 
        id: 'grok-4', 
        providerId: 'xai', 
        name: 'Grok-4', 
        description: 'Fast and efficient for general use', 
        capabilities: ['toolUsage'] 
      },
      { 
        id: 'llama-3.1-8b-instant', 
        providerId: 'groq', 
        name: 'Llama 3.1 8B Instant', 
        description: 'Ultra-fast responses', 
        capabilities: [] 
      }
    ]

    return recommendations.map(rec => {
      const provider = AVAILABLE_PROVIDERS.find(p => p.id === rec.providerId)
      const model = provider?.models.find(m => m.id === rec.id)
      return {
        ...rec,
        provider: provider?.name || rec.providerId,
        model: model || { id: rec.id, name: rec.name, capabilities: { imageInput: false, objectGeneration: false, toolUsage: false, toolStreaming: false } }
      }
    })
  }

  const handleRecommendedModelSelect = (recommendation: any) => {
    setSelectedProvider(recommendation.providerId)
    setSelectedModel(recommendation.id)
  }

  // プロバイダーAPI Keyの更新
  const handleApiKeyChange = (providerId: string, apiKey: string) => {
    const updatedApiKeys = {
      ...providerApiKeys,
      [providerId]: apiKey
    }
    setProviderApiKeys(updatedApiKeys)
    
    // API Keyが変更されたら検証結果をクリア
    if (verificationResults[providerId]) {
      setVerificationResults(prev => {
        const newResults = { ...prev }
        delete newResults[providerId]
        return newResults
      })
    }
    
    // 外部のコールバックも呼び出し
    if (onProviderApiKeysChange) {
      onProviderApiKeysChange(updatedApiKeys)
    }
  }

  // API Keyの検証
  const [verifyingStates, setVerifyingStates] = useState<Record<string, boolean>>({})
  const [verificationResults, setVerificationResults] = useState<Record<string, { success: boolean; message: string }>>({})

  const handleVerifyApiKey = async (providerId: string) => {
    // 既に検証中の場合は重複を防ぐ
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
      
      // 一時的なAI SDKサービスを作成して検証
      const tempAISDKService = new AISDKService()
      
      // プロバイダー情報を取得
      const provider = AVAILABLE_PROVIDERS.find(p => p.id === providerId)
      if (!provider) {
        throw new Error(`Provider ${providerId} not found in available providers`)
      }

      // デフォルトモデルを選択
      const defaultModel = provider.models[0]
      if (!defaultModel) {
        throw new Error(`No models available for provider ${providerId}`)
      }

      console.log(`Using model: ${defaultModel.id} for verification`)

      // プロバイダーを設定
      await tempAISDKService.configureProvider({
        providerId,
        modelId: defaultModel.id,
        apiKey: apiKey,
        temperature: 0.7,
        maxOutputTokens: 100
      })

      // 接続テスト
      const isConnected = await tempAISDKService.testConnection()
      
      if (isConnected) {
        console.log(`API Key verification successful for ${providerId}`)
        setVerificationResults(prev => ({
          ...prev,
          [providerId]: { success: true, message: 'Verified' }
        }))
        
        // 検証成功時にプロバイダー設定を更新
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
        
        // より具体的なエラーメッセージを提供
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
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
              <TabsTrigger value="api-keys" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10">
                <Brain className="w-4 h-4" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10">
                <Brain className="w-4 h-4" />
                Models
              </TabsTrigger>
              <TabsTrigger value="workflow" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10">
                <FileText className="w-4 h-4" />
                Workflow
              </TabsTrigger>
              <TabsTrigger value="indexing" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10">
                <Database className="w-4 h-4" />
                Indexing
              </TabsTrigger>
              <TabsTrigger value="memory" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10">
                <BrainCircuit className="w-4 h-4" />
                Memory
              </TabsTrigger>
              <TabsTrigger value="network" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10">
                <Network className="w-4 h-4" />
                Network
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10">
                <Wrench className="w-4 h-4" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10">
                <Monitor className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="output" className="flex items-center gap-2 justify-start h-12 px-4 rounded-none data-[state=active]:bg-primary/10">
                <Download className="w-4 h-4" />
                Output
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 p-6 overflow-y-auto">
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
                    {[...AVAILABLE_PROVIDERS].sort((a, b) => a.name.localeCompare(b.name)).map((provider) => (
                      <div key={provider.id} className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{provider.name} API Key</h3>
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
                            {provider.id === 'amazon-bedrock' && "Configure AWS credentials to use Amazon Bedrock models. Requires AWS authentication."}
                            {provider.id === 'azure' && "Configure Azure credentials to use Azure OpenAI Service. Requires Azure authentication."}
                            {provider.id === 'ollama' && "No API key required. Run Ollama locally on your machine."}
                            {!['openai', 'anthropic', 'google', 'xai', 'fireworks', 'groq', 'mistral', 'perplexity', 'deepseek', 'togetherai', 'cohere', 'cerebras', 'deepinfra', 'amazon-bedrock', 'azure', 'ollama'].includes(provider.id) && `Enter your ${provider.name} API key to use their models.`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={providerApiKeys[provider.id] || ''}
                            onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                            placeholder={`Enter your ${provider.name} API Key`}
                            className="flex-1"
                            disabled={provider.id === 'ollama'}
                          />
                          {provider.id !== 'ollama' && (
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
                                  <span>Verify</span>
                                  <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                              )}
                            </Button>
                          )}
                        </div>
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
                    ))}
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

                  {/* Model Grid/List - プロバイダーごとにグループ化 */}
                  <div className="space-y-6">
                    {getFilteredModelsByProvider().map(({ provider, models }) => (
                      <div key={provider.id} className="space-y-3">
                        {/* プロバイダーヘッダー */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                              <Brain className="w-4 h-4 text-primary" />
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

                        {/* モデルリスト */}
                        <div className={cn(
                          viewMode === 'grid' 
                            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                            : "space-y-2"
                        )}>
                          {models.map((model) => (
                            <Card 
                              key={`${provider.id}:${model.id}`}
                              className={cn(
                                "cursor-pointer transition-all",
                                isModelEnabled(provider.id, model.id) 
                                  ? "border-primary/50 bg-primary/5" 
                                  : "border-border hover:border-muted-foreground/50",
                                isDefaultModel(provider.id, model.id) && "ring-2 ring-primary/20"
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
                                    </div>
                                    {model.description && (
                                      <p className="text-xs text-muted-foreground mb-2">{model.description}</p>
                                    )}
                                    <div className="flex gap-1 mb-2">
                                      {/* Text - 基本的なテキスト生成機能 */}
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
                                      
                                      {/* Vision - 画像入力機能 */}
                                      {model.capabilities.imageInput && (
                                        <Badge variant="secondary" className="text-xs">
                                          Vision
                                        </Badge>
                                      )}
                                      
                                      {/* Image - 画像生成機能 */}
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
                                      
                                      {/* Speech - 音声生成機能 */}
                                      {(model.name.toLowerCase().includes('tts') || 
                                        model.name.toLowerCase().includes('speech') ||
                                        model.description?.toLowerCase().includes('text-to-speech') ||
                                        model.description?.toLowerCase().includes('audio generation')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Speech
                                        </Badge>
                                      )}
                                      
                                      {/* Audio - 音声認識機能 */}
                                      {(model.name.toLowerCase().includes('whisper') || 
                                        model.name.toLowerCase().includes('transcribe') ||
                                        model.description?.toLowerCase().includes('speech recognition') ||
                                        model.description?.toLowerCase().includes('audio transcription')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Audio
                                        </Badge>
                                      )}
                                      
                                      {/* Video - 動画生成機能 */}
                                      {(model.name.toLowerCase().includes('veo') ||
                                        model.description?.toLowerCase().includes('video generation')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Video
                                        </Badge>
                                      )}
                                      
                                      {/* Embedding - 埋め込み機能 */}
                                      {(model.name.toLowerCase().includes('embedding') ||
                                        model.description?.toLowerCase().includes('embedding') ||
                                        model.description?.toLowerCase().includes('text embedding')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Embedding
                                        </Badge>
                                      )}
                                      
                                      {/* Reasoning - 推論機能 */}
                                      {(model.name.toLowerCase().includes('o1') || 
                                        model.name.toLowerCase().includes('o3') || 
                                        model.name.toLowerCase().includes('o4') ||
                                        model.description?.toLowerCase().includes('reasoning') ||
                                        model.description?.toLowerCase().includes('problem-solving')) && (
                                        <Badge variant="secondary" className="text-xs">
                                          Reasoning
                                        </Badge>
                                      )}
                                      
                                      {/* Tools - ツール使用機能 */}
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
                    ))}
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
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
