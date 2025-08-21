import React, { useState, useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { ChatMessage, ChatMessageProps } from './ChatMessage'
import { PromptInputBox } from './PromptInputBox'

import { EnhancedFilePreview } from './EnhancedFilePreview'
import { ArmisSettings } from '@/components/settings/ArmisSettings'
import { AISDKService } from '@/services/llm/ai-sdk-service'
import { GeminiFileService } from '@/services/llm/gemini-file-service'
import { AIProviderConfig, ModelSettings, AVAILABLE_PROVIDERS } from '@/types/ai-sdk'
import { cn } from '@/lib/utils'
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
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { JumpingDots } from '@/components/ui/jumping-dots'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { SequentialThinkingPanel } from './SequentialThinkingPanel'
import { SequentialThinkingPlan } from '@/types/llm'
import { LLMManager } from '@/services/llm/llm-manager'
import { InputAnalyzer, InputAnalysis } from '@/services/agent/input-analyzer'
import { AgentType } from '@/types/llm'
import { AgentInfoDisplay } from './AgentInfoDisplay'

interface ChatWindowProps {
  className?: string
  useEnhancedPreview?: boolean // 拡張プレビューを使用するかどうか
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  className,
  useEnhancedPreview = true // デフォルトで拡張プレビューを使用
}) => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false) // 生成中状態

  const [currentPlan, setCurrentPlan] = useState<SequentialThinkingPlan | null>(null)
  const [showSequentialThinking, setShowSequentialThinking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentProviderConfig, setCurrentProviderConfig] = useState<AIProviderConfig | null>(null)
  
  // ローディング状態管理
  const [loadingState, setLoadingState] = useState<'idle' | 'text' | 'media'>('idle')
  const [modelSettings, setModelSettings] = useState<ModelSettings>({
    enabledModels: [
      { providerId: 'openai', modelId: 'gpt-5', enabled: true, priority: 1 },
      { providerId: 'anthropic', modelId: 'claude-opus-4.1', enabled: true, priority: 2 },
      { providerId: 'google', modelId: 'gemini-2.5-pro', enabled: true, priority: 3 },
      { providerId: 'openai', modelId: 'gpt-4o', enabled: true, priority: 4 },
      { providerId: 'anthropic', modelId: 'claude-opus-4', enabled: true, priority: 5 },
      { providerId: 'google', modelId: 'gemini-2.5-flash', enabled: true, priority: 6 },
      { providerId: 'xai', modelId: 'grok-4', enabled: true, priority: 7 },
      { providerId: 'groq', modelId: 'llama-3.1-8b-instant', enabled: true, priority: 8 },
      { providerId: 'mistral', modelId: 'codestral', enabled: true, priority: 9 },
      { providerId: 'groq', modelId: 'llama-3.1-405b', enabled: true, priority: 10 }
    ],
    defaultModel: 'openai:gpt-5',
    autoSwitch: true
  })
  
  // プロバイダーごとのAPI Key管理
  const [providerApiKeys, setProviderApiKeys] = useState<Record<string, string>>(() => {
    // localStorageからAPIキーを読み込み
    try {
      const saved = localStorage.getItem('armis_provider_api_keys')
      return saved ? JSON.parse(saved) : {}
    } catch (error) {
      console.error('Failed to load API keys from localStorage:', error)
      return {}
    }
  })
  const [aiSDKService] = useState(() => new AISDKService())
  const [geminiFileService] = useState(() => new GeminiFileService())
  const [streamingResponse, setStreamingResponse] = useState('')

  // Router Agent System関連の状態
  const [llmManager, setLlmManager] = useState<LLMManager | null>(null)
  const [inputAnalyzer] = useState(() => new InputAnalyzer())
  const [currentAnalysis, setCurrentAnalysis] = useState<InputAnalysis | null>(null)
  const [agentInfo, setAgentInfo] = useState<{
    type: AgentType | null
    confidence: number
    reasoning: string
  } | null>(null)

  // APIキーをlocalStorageに保存する関数
  const saveApiKeysToStorage = (apiKeys: Record<string, string>) => {
    try {
      localStorage.setItem('armis_provider_api_keys', JSON.stringify(apiKeys))
    } catch (error) {
      console.error('Failed to save API keys to localStorage:', error)
    }
  }

  // APIキー更新時のハンドラー
  const handleProviderApiKeysChange = (newApiKeys: Record<string, string>) => {
    setProviderApiKeys(newApiKeys)
    saveApiKeysToStorage(newApiKeys)
  }
  const [lastError, setLastError] = useState<string | null>(null)

  // LLMManagerの初期化
  useEffect(() => {
    const initializeLLMManager = async () => {
      try {
        console.log('Initializing LLM Manager for Router Agent System...')
        
        // LLM設定（デフォルト設定）
        const config = {
          modelPath: './models/llama-2-7b-chat.gguf',
          contextSize: 4096,
          temperature: 0.7,
          topP: 0.9,
          topK: 40
        }
        
        const manager = new LLMManager(config)
        await manager.initialize()
        
        setLlmManager(manager)
        console.log('LLM Manager initialized successfully')
      } catch (error) {
        console.error('Failed to initialize LLM Manager:', error)
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
    aiSDKService.stopGeneration()
    setIsGenerating(false)
    setIsTyping(false)
    setLoadingState('idle')
    setStreamingResponse('')
  }

  const handleSendMessage = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>) => {
    if (!content.trim() && selectedFiles.length === 0) return

    setIsTyping(true)
    setIsGenerating(true)
    setLoadingState('text')

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
    setMessages(prev => [...prev, userMessage])

    // ファイルを一時保存（API呼び出し後にクリア）
    const filesToSend = [...selectedFiles]
    setSelectedFiles([])

    try {
      if (content.toLowerCase().includes('sequential') || content.toLowerCase().includes('step by step') || content.toLowerCase().includes('plan')) {
        await handleSequentialThinkingRequest(content, contexts)
      } else if (isYouTubeUrl && selectedFiles.length === 0) {
        // YouTube URLの場合は動画分析を実行
        await handleYouTubeVideoRequest(content, contexts)
      } else {
        await handleRegularChatRequest(content, contexts, filesToSend)
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

  const handleSequentialThinkingRequest = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>) => {
    try {
      setIsAgentMode(true)
      setShowSequentialThinking(true)

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

        // Use AI SDK with tools for Sequential Thinking
        let fullResponse = ''
        const toolCalls: any[] = []
        
        await aiSDKService.streamResponse(
          `You are an AI assistant specialized in video production and media editing. The user wants to: ${content}. 
           Use the available tools to accomplish this task step by step. Think through the process and use tools when needed.
           ${contexts ? `Context: ${contexts.map(ctx => `@${ctx.name}`).join(', ')}` : ''}`,
          (chunk: string) => {
            fullResponse += chunk
            setStreamingResponse(fullResponse)
          }
        )

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
      
      const assistantMessage: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        content: `❌ Sequential Thinking failed: ${errorMessage}`,
        role: 'assistant',
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsGenerating(false)
    } finally {
      setIsTyping(false)
      setLoadingState('idle')
      setIsAgentMode(false)
    }
  }

  const handleRegularChatRequest = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>, files?: File[]) => {
    try {
      // 入力分析を実行
      const analysis = inputAnalyzer.analyzeInput(content, { files })
      setCurrentAnalysis(analysis)
      
      console.log('Input Analysis:', analysis)
      
      // Router Agent Systemが利用可能で、Router Agentが必要な場合
      if (llmManager && analysis.needsRouterAgent) {
        console.log('Using Router Agent System...')
        
        // エージェント情報を設定
        setAgentInfo({
          type: analysis.suggestedAgent || null,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning
        })
        
        // Router Agent Systemで処理
        const response = await llmManager.routeAndExecute(content, {
          files,
          contexts,
          analysis
        })
        
        // アシスタントメッセージを追加
        const assistantMessage: ChatMessageProps = {
          id: (Date.now() + 1).toString(),
          content: response.content,
          role: 'assistant',
          metadata: {
            agentType: response.agentType,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            executionTime: response.executionTime,
            complexity: analysis.complexity
          }
        }
        
        setMessages(prev => [...prev, assistantMessage])
        return
      }
      
      // 通常のLLM処理（Router Agentが不要な場合）
      console.log('Using standard LLM...')
      setAgentInfo(null)
      
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

        // ファイルがある場合はGemini APIを使用
        if (files && files.length > 0 && currentConfig.providerId === 'google') {
          await handleFileChatRequest(content, contexts, files, apiKey)
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
          { role: 'user' as const, content }
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
          content: '',
          role: 'assistant',
        }
        
        // アシスタントメッセージを即座に追加（ストリーミング表示用）
        setMessages(prev => [...prev, assistantMessage])
        setStreamingResponse('')

        // 新しいストリーミングチャット機能を使用
        await aiSDKService.streamChatResponse(
          updatedHistory,
          (chunk: string) => {
            // ストリーミングチャンクを処理
            setStreamingResponse(prev => prev + chunk)
          },
          (fullResponse: string) => {
            // ストリーミング完了時の処理
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            )
            setStreamingResponse('')
            setIsGenerating(false)
          },
          (error: Error) => {
            // エラー処理
            console.error('Streaming error:', error)
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId 
                  ? { ...msg, content: `❌ エラーが発生しました: ${error.message}` }
                  : msg
              )
            )
            setStreamingResponse('')
            setLastError(error.message)
            setIsGenerating(false)
          }
        )
      } else {
        // Fallback to mock response
        const mockResponse = `I understand you're asking about: "${content}". However, I need to be configured with an AI provider to provide meaningful responses. Please configure an AI provider in the settings.`
        
        const assistantMessage: ChatMessageProps = {
          id: (Date.now() + 1).toString(),
          content: mockResponse,
          role: 'assistant',
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
      }
      setMessages(prev => [...prev, errorResponse])
      setIsGenerating(false)
    } finally {
      setIsTyping(false)
      setLoadingState('idle')
    }
  }

  // YouTube動画リクエスト処理
  const handleYouTubeVideoRequest = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>) => {
    try {
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

      } else {
        // Fallback to mock response
        const mockResponse = `I understand you want to analyze a YouTube video: "${content}". However, I need to be configured with an AI provider to provide meaningful responses. Please configure an AI provider in the settings.`
        
        const assistantMessage: ChatMessageProps = {
          id: (Date.now() + 1).toString(),
          content: mockResponse,
          role: 'assistant',
        }
        setMessages(prev => [...prev, assistantMessage])
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
      setLoadingState('idle')
    }
  }

  // ファイルチャットリクエスト処理
  const handleFileChatRequest = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>, files?: File[], apiKey?: string) => {
    if (!files || files.length === 0 || !apiKey) {
      throw new Error('Files and API key are required for file chat')
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

      // modelIdの形式: "providerId:modelId"
      const [providerId, selectedModelId] = modelId.split(':')
      
      if (!providerId || !selectedModelId) {
        console.error('Invalid model ID format:', modelId)
        return
      }

      // プロバイダーのAPI Keyを取得
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
      {/* Header with Settings Button */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {isAgentMode && (
            <div className="flex items-center gap-1 text-blue-500">
              <Brain className="w-4 h-4" />
              <span className="text-sm">Agent Mode</span>
            </div>
          )}
        </div>
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
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage 
              key={message.id} 
              {...message} 
              useEnhancedPreview={useEnhancedPreview}
              onEdit={handleMessageEdit}
              onCancelEdit={handleMessageEditCancel}
            />
          ))}
          
          {/* Agent Info Display */}
          {agentInfo && agentInfo.type && currentAnalysis && (
            <AgentInfoDisplay
              agentType={agentInfo.type}
              confidence={agentInfo.confidence}
              reasoning={agentInfo.reasoning}
              complexity={currentAnalysis.complexity}
            />
          )}
          {isTyping && (
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                {loadingState === 'media' ? (
                  <>
                    <CircleSpinner size="sm" className="text-blue-500" />
                    <span className="text-sm text-muted-foreground">Generating...</span>
                  </>
                ) : loadingState === 'text' ? (
                  <>
                    <JumpingDots className="text-blue-500" />
                  </>
                ) : (
                  <>
                    <JumpingDots className="text-blue-500" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </>
                )}
              </div>
            </div>
          )}
          {streamingResponse && (
            <ChatMessage
              id="streaming"
              content={streamingResponse}
              role="assistant"
            />
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

        <PromptInputBox
          onSend={handleSendMessage}
          onAttachFiles={handleFilesAdded}
          onStop={handleStopGeneration}
          disabled={isTyping}
          placeholder=""
          modelSettings={modelSettings}
          onModelSettingsChange={setModelSettings}
          onModelSelect={handleModelSelect}
          providerApiKeys={providerApiKeys}
          loadingState={loadingState}
          selectedFiles={selectedFiles}
          currentProviderConfig={currentProviderConfig}
          isGenerating={isGenerating}
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
          currentProviderConfig={currentProviderConfig}
          onModelSettingsChange={setModelSettings}
          currentModelSettings={modelSettings}
          providerApiKeys={providerApiKeys}
          onProviderApiKeysChange={handleProviderApiKeysChange}
        />
      )}
    </div>
  )
}
