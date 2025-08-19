import React, { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage, ChatMessageProps } from './ChatMessage'
import { PromptInputBox } from './PromptInputBox'
import { FilePreview } from './file-preview'
import { Button } from '@/components/ui/button'
import { X, Paperclip } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { SequentialThinkingPanel } from './SequentialThinkingPanel'
import { ArmisSettings } from '@/components/settings/ArmisSettings'
import { Settings, AlertCircle, Brain, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SequentialThinkingPlan } from '@/types/llm'
import { AIProviderConfig, ModelSettings, AVAILABLE_PROVIDERS } from '@/types/ai-sdk'
import { AISDKService } from '@/services/llm/ai-sdk-service'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { JumpingDots } from '@/components/ui/jumping-dots'

interface ChatWindowProps {
  className?: string
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ className }) => {
  const [messages, setMessages] = useState<ChatMessageProps[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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
  const [streamingResponse, setStreamingResponse] = useState('')

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
      const provider = AVAILABLE_PROVIDERS.find(p => p.id === model.providerId)
      const modelExists = provider?.models.some(m => m.id === model.modelId)
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

  const handleSendMessage = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>) => {
    if (!content.trim() && selectedFiles.length === 0) return

    setIsTyping(true)
    setLoadingState('text')

    // ユーザーメッセージを追加（ファイル付き）
    const userMessage: ChatMessageProps = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      files: selectedFiles.length > 0 ? selectedFiles : undefined
    }
    setMessages(prev => [...prev, userMessage])

    // ファイルをクリア
    setSelectedFiles([])

    try {
      if (content.toLowerCase().includes('sequential') || content.toLowerCase().includes('step by step') || content.toLowerCase().includes('plan')) {
        await handleSequentialThinkingRequest(content, contexts)
      } else {
        await handleRegularChatRequest(content, contexts)
      }
    } catch (error) {
      console.error('Error handling message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setLastError(errorMessage)
      setIsTyping(false)
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
    } finally {
      setIsTyping(false)
      setLoadingState('idle')
      setIsAgentMode(false)
    }
  }

  const handleRegularChatRequest = async (content: string, contexts?: Array<{id: string, type: string, name: string, value?: string}>) => {
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

        // チャット履歴を構築
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
      }
    } catch (error) {
      console.error('Error in regular chat request:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      const assistantMessage: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        content: `申し訳ございませんが、エラーが発生しました: ${errorMessage}。APIキーを確認して再試行してください。`,
        role: 'assistant',
      }
      setMessages(prev => [...prev, assistantMessage])
      setLastError(errorMessage)
    } finally {
      setIsTyping(false)
      setLoadingState('idle')
    }
  }

  const handleFilesAdded = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files])
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
            <ChatMessage key={message.id} {...message} />
          ))}
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
                    <span className="text-sm text-muted-foreground">Working...</span>
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
                <FilePreview file={file} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <PromptInputBox
          onSend={handleSendMessage}
          onAttachFiles={handleFilesAdded}
          disabled={isTyping}
          placeholder="Ask me anything about video editing, media production, or general questions..."
          modelSettings={modelSettings}
          onModelSettingsChange={setModelSettings}
          onModelSelect={handleModelSelect}
          providerApiKeys={providerApiKeys}
          loadingState={loadingState}
          selectedFiles={selectedFiles}
          currentProviderConfig={currentProviderConfig}
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
