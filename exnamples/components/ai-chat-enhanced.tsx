"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Sparkles, AlertCircle, ChevronDown, Globe, Server, AtSign, Image, Infinity, Brain, Bot, Cpu, Sparkles as SparklesIcon, Shield, CheckCircle, Upload, X, File, FileText, FileImage, FileVideo, FileAudio, ArrowUpCircle, Video, Link, Play } from "lucide-react"
import { useAI } from "@/hooks/use-ai"
import { ChatMessage } from "@/lib/ai-providers"
import { aiAPI, AIProvider } from "@/lib/ai-client"
import { AVAILABLE_MODELS } from "@/lib/models"
import { MulmocastIntegration } from "@/components/mulmocast-integration"
import { useMulmocastAI } from "@/hooks/use-mulmocast-ai"
import { VideoGenerationWorkflow } from "@/components/video-generation-workflow"
import { ModelSwitcher } from "@/components/model-switcher"
import { AutoModeSwitcher } from "@/components/auto-mode-switcher"
import { AddContextButton } from "@/components/add-context-button"
import { EnhancedChat, Message } from "@/components/ui/enhanced-chat"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AVAILABLE_MODELS as SHARED_MODELS } from "@/lib/models"
import { processUrlsInMessage, containsUrls, ScrapedContent } from "@/lib/url-utils"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  preview?: string
  status: 'uploading' | 'success' | 'error'
}

interface AIChatEnhancedProps {
  chatHistory: Array<{ role: string; content: string }>
  onChatSubmit: (message: string) => void
  onChatResponse: (response: string) => void
  theme?: "dark" | "light"
  onFileUpload?: (files: UploadedFile[]) => void
}

// 共通のモデル定義を使用
const AVAILABLE_MODELS = SHARED_MODELS

// 一般的なOllamaモデルのリスト
const COMMON_MODELS = [
  { name: 'qwen2.5:1.5b', description: 'Qwen2.5 1.5B - 軽量で高速' },
  { name: 'llama3.1:8b', description: 'Llama3.1 8B - バランスの取れた性能' },
  { name: 'llama3.1:3b', description: 'Llama3.1 3B - 軽量版' },
  { name: 'gemma3:2b', description: 'Gemma3 2B - Google製軽量モデル' },
  { name: 'phi3:mini', description: 'Phi3 Mini - Microsoft製軽量モデル' },
  { name: 'mistral:7b', description: 'Mistral 7B - 高性能オープンソース' },
  { name: 'codellama:7b', description: 'Code Llama 7B - コード生成特化' },
  { name: 'deepseek-coder:6.7b', description: 'DeepSeek Coder - コード生成' },
  { name: 'neural-chat:7b', description: 'Neural Chat - 会話特化' },
  { name: 'orca-mini:3b', description: 'Orca Mini - 軽量会話モデル' },
]

export function AIChatEnhanced({ chatHistory, onChatSubmit, onChatResponse, theme = "light", onFileUpload }: AIChatEnhancedProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userFriendlyError, setUserFriendlyError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState("auto")
  const [autoMode, setAutoMode] = useState("auto")
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showMulmocastIntegration, setShowMulmocastIntegration] = useState(false)
  const [showVideoWorkflow, setShowVideoWorkflow] = useState(false)
  const [lastAiResponse, setLastAiResponse] = useState<string>("")
  const [isProcessingUrls, setIsProcessingUrls] = useState(false)
  const [scrapedContents, setScrapedContents] = useState<ScrapedContent[]>([])
  
  // 設定から有効なモデルを読み込む
  const [enabledModels, setEnabledModels] = useState<{[key: string]: boolean}>({})
  
  // 音声合成設定
  const [isTTSEnabled, setIsTTSEnabled] = useState(false)
  const [isTTSProcessing, setIsTTSProcessing] = useState(false)
  
  const {
    isLoading,
    error,
    currentProvider,
    availableProviders,
    ollamaModels,
    currentModel,
    setCurrentProvider,
    setCurrentModel,
    fetchOllamaModels,
    sendStreamingChat,
    isConnected,
    ollamaServerStatus,
    startOllamaServer,
  } = useAI({
    defaultProvider: 'google',
    defaultModel: 'gemini-2.0-flash-lite',
    temperature: 0.7,
    maxTokens: 2048,
  })

  // mulmocast連携フック
  const {
    isConnected: mulmocastConnected,
    isProcessing: mulmocastProcessing,
    activeProjects,
    sendToMulmocast,
    generateVideoScript,
    videoTemplates
  } = useMulmocastAI()

  // 有効なモデルのみをフィルタリング
  const getEnabledModels = () => {
    const enabled = Object.entries(enabledModels)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([modelId, _]) => modelId)
    
    // デフォルトで有効なモデルを追加（設定がない場合）
    if (enabled.length === 0) {
      return [
        // Google Gemini モデル
        'gemini-2.0-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        // OpenAI モデル
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        // Anthropic Claude モデル
        'claude-3.5-sonnet',
        'claude-3.5-haiku',
        // xAI Grok モデル
        'grok-2',
        'grok-3-mini',
        // DeepSeek モデル
        'deepseek-r1',
        'deepseek-v3',
        // Ollama (共通モデル)
        'qwen2.5:1.5b',
        'llama3.2:3b',
        'orca-mini:3b'
      ]
    }
    
    return enabled
  }

  // 現在のプロバイダーで利用可能なモデルを取得（Settingsで有効化されたもののみ）
  const getAvailableModelsForProvider = (provider: string) => {
    const enabledModelIds = getEnabledModels()
    
    if (provider === 'ollama') {
      // Ollamaの場合は、設定に関係なく利用可能なすべてのモデルを表示
      // ローカルでインストールされているモデルは無料で使用可能なため
      return ollamaModels
    }
    
    // 全プロバイダーに対応した汎用的な処理
    const providerMappings: Record<string, string> = {
      'google': 'Google',
      'anthropic': 'Anthropic', 
      'openai': 'OpenAI',
      'xai': 'xAI',
      'deepseek': 'DeepSeek',
      'moonshot': 'Moonshot',
      'cursor': 'Cursor',
      'fireworks': 'Fireworks',
      'ollama': 'Ollama'
    }
    
    const providerName = providerMappings[provider]
    if (!providerName) {
      return []
    }
    
    // 他のプロバイダーの場合、Ollamaモデルを除外してフィルタリング
    return Object.entries(AVAILABLE_MODELS)
      .filter(([modelId, model]) => {
        // Ollamaモデルは明示的に除外（Ollamaプロバイダー選択時は上記の条件で処理済み）
        if (model.provider === 'Ollama') {
          return false
        }
        return model.provider === providerName && enabledModelIds.includes(modelId)
      })
      .map(([modelId, model]) => ({
        name: modelId,
        description: model.description || modelId,
        category: model.category || 'Standard',
        icon: model.icon
      }))
  }

  // 設定の変更を監視
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'armis-editor-settings') {
        try {
          const settings = JSON.parse(e.newValue || '{}')
          setEnabledModels(settings.models || {})
        } catch (error) {
          console.error('Failed to parse settings:', error)
        }
      }
    }

    const handleSettingsChange = (e: CustomEvent) => {
      if (e.detail?.models) {
        setEnabledModels(e.detail.models)
      }
    }

    const handleChatModelChange = (e: CustomEvent) => {
      if (e.detail?.provider && e.detail?.model) {
        console.log(`[Enhanced] Updating chat model from settings: ${e.detail.provider}/${e.detail.model}`)
        setCurrentProvider(e.detail.provider)
        setCurrentModel(e.detail.model)
      }
    }

    // 初期設定を読み込み
    try {
      const settings = localStorage.getItem('armis-editor-settings')
      if (settings) {
        const parsedSettings = JSON.parse(settings)
        setEnabledModels(parsedSettings.models || {})
        
        // チャット設定を復元
        if (parsedSettings.currentProvider) {
          setCurrentProvider(parsedSettings.currentProvider)
        }
        if (parsedSettings.currentModel) {
          setCurrentModel(parsedSettings.currentModel)
        }
        // 音声合成設定を復元
        if (parsedSettings.isTTSEnabled !== undefined) {
          setIsTTSEnabled(parsedSettings.isTTSEnabled)
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('armis-settings-changed', handleSettingsChange as EventListener)
    window.addEventListener('armis-chat-model-changed', handleChatModelChange as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('armis-settings-changed', handleSettingsChange as EventListener)
      window.removeEventListener('armis-chat-model-changed', handleChatModelChange as EventListener)
    }
  }, [])

  // コンポーネントのマウント状態を管理
  useEffect(() => {
    setMounted(true)
    
    // コンポーネントのアンマウント時のクリーンアップ
    return () => {
      // 進行中のTTSリクエストがあれば中断
      // この部分は必要に応じて実装
    }
  }, [])

  // 接続状態メッセージを取得
  const getConnectionMessage = () => {
    if (!mounted) return "初期化中..."
    
    if (currentProvider === 'ollama') {
      if (!isConnected) {
        return "Ollamaサーバーに接続できません"
      }
      return `Ollama接続済み (${currentModel})`
    }
    
    if (currentProvider === 'google') {
      return `Google AI接続済み (${currentModel})`
    }
    
    if (currentProvider === 'openai') {
      return `OpenAI接続済み (${currentModel})`
    }
    
    return "AIプロバイダーに接続中..."
  }

  // 音声合成設定の切り替え
  const handleTTSToggle = () => {
    const newTTSEnabled = !isTTSEnabled
    setIsTTSEnabled(newTTSEnabled)
    
    // 設定をローカルストレージに保存
    try {
      const settings = JSON.parse(localStorage.getItem('armis-editor-settings') || '{}')
      settings.isTTSEnabled = newTTSEnabled
      localStorage.setItem('armis-editor-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save TTS settings:', error)
    }
  }

  // メッセージ送信処理
  const handleSubmit = async (message: string, attachments?: File[]) => {
    if (!message.trim() && (!attachments || attachments.length === 0)) return

    setIsGenerating(true)
    setUserFriendlyError(null)

    try {
      // ユーザーメッセージを追加
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        createdAt: new Date(),
        attachments: attachments
      }
      
      setMessages(prev => [...prev, userMessage])

      // URL処理
      let processedMessage = message
      if (containsUrls(message)) {
        setIsProcessingUrls(true)
        try {
          const processed = await processUrlsInMessage(message)
          processedMessage = processed.processedMessage
          setScrapedContents(processed.scrapedContents)
        } catch (error) {
          console.error('URL processing failed:', error)
        } finally {
          setIsProcessingUrls(false)
        }
      }

      // AIレスポンスを取得
      const response = await sendStreamingChat(
        [...chatHistory, { role: "user", content: processedMessage }],
        (chunk) => {
          // ストリーミングレスポンスを処理
          setLastAiResponse(prev => prev + chunk)
        },
        () => {
          // ストリーミング完了
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: lastAiResponse,
            createdAt: new Date()
          }
          setMessages(prev => [...prev, assistantMessage])
          setLastAiResponse("")
          setIsGenerating(false)
        },
        (error) => {
          // エラー処理
          console.error('Chat error:', error)
          setUserFriendlyError(error.message || "メッセージの送信に失敗しました")
          setIsGenerating(false)
        },
        currentModel
      )

      onChatSubmit(message)
      if (response) {
        onChatResponse(response)
      }

      // 音声合成が有効な場合、ユーザーの入力テキストを音声合成
      if (isTTSEnabled && message.trim() && !isTTSProcessing) {
        setIsTTSProcessing(true)
        let ttsController: AbortController | undefined
        let ttsTimeoutId: NodeJS.Timeout | undefined
        
        try {
          // AbortControllerとタイムアウトを設定
          ttsController = new AbortController()
          ttsTimeoutId = setTimeout(() => {
            if (ttsController) {
              ttsController.abort()
            }
          }, 15000) // 15秒タイムアウト

          const ttsResponse = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: message,
              engine: 'auto',
              language: 'ja',
              format: 'mp3',
              speed: 1.0
            }),
            signal: ttsController.signal
          })

          // タイムアウトをクリア
          if (ttsTimeoutId) {
            clearTimeout(ttsTimeoutId)
            ttsTimeoutId = undefined
          }

          if (ttsResponse.ok) {
            const ttsResult = await ttsResponse.json()
            if (ttsResult.success && ttsResult.audio_data) {
              // 音声データをBase64デコードして再生
              const audioBuffer = Buffer.from(ttsResult.audio_data, 'base64')
              const blob = new Blob([audioBuffer], { type: 'audio/mp3' })
              const audioUrl = URL.createObjectURL(blob)
              const audio = new Audio(audioUrl)
              
              // 音声再生のエラーハンドリング
              audio.onerror = (error) => {
                console.error('Audio playback error:', error)
                URL.revokeObjectURL(audioUrl)
              }
              
              audio.onended = () => {
                URL.revokeObjectURL(audioUrl)
              }
              
              await audio.play()
            }
          }
        } catch (error: any) {
          // タイムアウトをクリア
          if (ttsTimeoutId) {
            clearTimeout(ttsTimeoutId)
          }
          
          // AbortErrorの場合は適切なエラーメッセージに変換
          if (error.name === 'AbortError') {
            console.warn('TTS request timeout or aborted')
          } else {
            console.error('TTS error:', error)
          }
        } finally {
          setIsTTSProcessing(false)
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error)
      setUserFriendlyError("メッセージの送信に失敗しました")
      setIsGenerating(false)
    }
  }

  // レスポンス評価
  const handleRateResponse = (messageId: string, rating: "thumbs-up" | "thumbs-down") => {
    console.log(`Rating message ${messageId}: ${rating}`)
    // ここで評価を保存する処理を追加できます
  }

  // 提案メッセージ
  const suggestions = [
    "こんにちは！何かお手伝いできることはありますか？",
    "コードの説明をお願いします",
    "バグの修正方法を教えてください",
    "新しい機能のアイデアを聞かせてください"
  ]

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">初期化中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">AI チャット</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <ModelSwitcher
            currentProvider={currentProvider}
            currentModel={currentModel}
            onProviderChange={setCurrentProvider}
            onModelChange={setCurrentModel}
            availableModels={getAvailableModelsForProvider(currentProvider)}
          />
          
          <AutoModeSwitcher
            autoMode={autoMode}
            onAutoModeChange={setAutoMode}
          />
          
          <AddContextButton />
          
          {/* 音声合成設定ボタン */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isTTSEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleTTSToggle}
                className="h-8 px-2"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isTTSEnabled ? "音声合成: オン" : "音声合成: オフ"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* 接続状態 */}
      <div className="px-4 py-2 bg-muted/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-muted-foreground">{getConnectionMessage()}</span>
          </div>
          
          {/* 音声合成状態表示 */}
          {isTTSEnabled && (
            <div className="flex items-center space-x-2">
              <Volume2 className={cn(
                "h-4 w-4",
                isTTSProcessing ? "text-yellow-500 animate-pulse" : "text-primary"
              )} />
              <span className="text-muted-foreground text-xs">
                {isTTSProcessing ? "音声合成中..." : "音声合成: オン"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* エラーメッセージ */}
      {userFriendlyError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{userFriendlyError}</span>
          </div>
        </div>
      )}

      {/* チャットエリア */}
      <div className="flex-1">
        <EnhancedChat
          messages={messages}
          input={input}
          handleInputChange={setInput}
          handleSubmit={handleSubmit}
          isGenerating={isGenerating}
          suggestions={suggestions}
          onRateResponse={handleRateResponse}
          placeholder="メッセージを入力してください..."
          enableTTS={true}
        />
      </div>

      {/* 統合パネル */}
      {showMulmocastIntegration && (
        <MulmocastIntegration
          isOpen={showMulmocastIntegration}
          onClose={() => setShowMulmocastIntegration(false)}
        />
      )}

      {showVideoWorkflow && (
        <VideoGenerationWorkflow
          isOpen={showVideoWorkflow}
          onClose={() => setShowVideoWorkflow(false)}
        />
      )}
    </div>
  )
}

