"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Sparkles, AlertCircle, ChevronDown, Globe, Server, AtSign, Image, Infinity, Brain, Bot, Cpu, Sparkles as SparklesIcon, Shield, CheckCircle, Upload, X, File, FileText, FileImage, FileVideo, FileAudio, ArrowUpCircle, Video, Link, Play } from "lucide-react"
import { JumpingDots } from "@/components/ui/jumping-dots"
import { useAI } from "@/hooks/use-ai"
import { ChatMessage, AIProvider } from "@/lib/ai-providers"
import { aiAPI, AIProvider as AIClientProvider } from "@/lib/ai-client"
import { MulmocastIntegration } from "@/components/mulmocast-integration"
import { useMulmocastAI } from "@/hooks/use-mulmocast-ai"
import { VideoGenerationWorkflow } from "@/components/video-generation-workflow"
import { ModelSwitcher } from "@/components/model-switcher"
import { AutoModeSwitcher } from "@/components/auto-mode-switcher"
import { AddContextButton } from "@/components/add-context-button"
import { SequentialThinkingPanel } from "@/components/sequential-thinking-panel"
import { useSequentialThinking } from "@/hooks/use-sequential-thinking"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AVAILABLE_MODELS as SHARED_MODELS } from "@/lib/models"
import { processUrlsInMessage, containsUrls, ScrapedContent } from "@/lib/url-utils"
import { ChatModeSwitcher, ChatMode, ChatModeConfig } from "@/components/chat-mode-switcher"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url?: string
  preview?: string
  status: 'uploading' | 'success' | 'error'
}

interface AIChatProps {
  chatHistory: Array<{ role: string; content: string }>
  onChatSubmit: (message: string) => void
  onChatResponse: (response: string) => void
  theme?: "dark" | "light"
  onFileUpload?: (files: UploadedFile[]) => void
  chatMode?: ChatMode
  agentFeatures?: ChatModeConfig['agentFeatures']
  onModeChange?: (mode: ChatMode) => void
  onAgentFeaturesChange?: (features: ChatModeConfig['agentFeatures']) => void
}

export function AIChatWithSequentialThinking({ 
  chatHistory, 
  onChatSubmit, 
  onChatResponse, 
  theme = "light", 
  onFileUpload,
  chatMode = "ask",
  agentFeatures = {
    sequentialThinking: true,
    cursorAgent: false,
    mulmocastCli: false,
    autogen: false
  },
  onModeChange,
  onAgentFeaturesChange
}: AIChatProps) {
  const [message, setMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingResponse, setStreamingResponse] = useState("")
  const [mounted, setMounted] = useState(false)
  const [userFriendlyError, setUserFriendlyError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState("auto")
  const [autoMode, setAutoMode] = useState("auto")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showMulmocastIntegration, setShowMulmocastIntegration] = useState(false)
  const [showVideoWorkflow, setShowVideoWorkflow] = useState(false)
  const [lastAiResponse, setLastAiResponse] = useState<string>("")
  const [isProcessingUrls, setIsProcessingUrls] = useState(false)
  const [scrapedContents, setScrapedContents] = useState<ScrapedContent[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const [enabledModels, setEnabledModels] = useState<{[key: string]: boolean}>({})
  
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

  const {
    isConnected: mulmocastConnected,
    isProcessing: mulmocastProcessing,
    activeProjects,
    sendToMulmocast,
    generateVideoScript,
    videoTemplates
  } = useMulmocastAI()

  // Sequential Thinking連携フック (Agent モードで有効化)
  const {
    startThinking,
    addThinkingStep,
    currentProcess,
    isProcessing: isThinkingProcessing,
    isConnected: isThinkingConnected
  } = useSequentialThinking({
    autoConnect: chatMode === 'agent' && agentFeatures.sequentialThinking,
    defaultTitle: "Armis AI チャット思考プロセス",
    onProcessComplete: (process) => {
      console.log('🧠 思考プロセス完了:', process)
    },
    onStepAdded: (step) => {
      console.log('💭 新しい思考ステップ:', step.thought)
    },
    onError: (error) => {
      console.error('🚨 Sequential Thinking エラー:', error)
    }
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      try {
        const settings = localStorage.getItem('armis-editor-settings')
        if (settings) {
          const parsedSettings = JSON.parse(settings)
          if (parsedSettings.models) {
            setEnabledModels(parsedSettings.models)
          }
        }
      } catch (error) {
        console.error('Failed to load model settings:', error)
      }
    }
  }, [mounted])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, streamingResponse])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (message.trim() && !isLoading && !isStreaming && mounted) {
      const userMessage = message.trim()
      setMessage("")
      setUserFriendlyError(null)
      
      // Sequential Thinking プロセスを自動開始（Agent モードで有効時のみ）
      if (chatMode === 'agent' && agentFeatures.sequentialThinking && !currentProcess) {
        await startThinking(`AI応答: ${userMessage.substring(0, 50)}...`, userMessage)
      }
      
      // URL処理
      const hasUrls = containsUrls(userMessage)
      
      if (hasUrls) {
        setIsProcessingUrls(true)
        try {
          const { processedMessage, scrapedContents: newScrapedContents } = await processUrlsInMessage(userMessage)
          setScrapedContents(newScrapedContents)
          
          await processChatMessage(processedMessage, userMessage)
        } catch (error) {
          console.error('Error processing URLs:', error)
          await processChatMessage(userMessage, userMessage)
          setUserFriendlyError('URLの処理中にエラーが発生しました。')
        } finally {
          setIsProcessingUrls(false)
        }
      } else {
        await processChatMessage(userMessage, userMessage)
      }
    }
  }

  const processChatMessage = async (processedMessage: string, originalMessage: string) => {
    onChatSubmit(originalMessage)
    
    setTimeout(() => {
      setScrapedContents([])
    }, 5000)

    // Agent モードでの外部API統合処理
    if (chatMode === 'agent') {
      await handleAgentFeatures(processedMessage, originalMessage)
      return
    }
      
    try {
      // Sequential Thinking: 分析段階（Ask モードでのシンプル処理）
      // Ask モードでは基本的なAI応答のみ

      setIsStreaming(true)
      setStreamingResponse("")
      
      const messages: ChatMessage[] = [
        ...chatHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        { role: 'user', content: processedMessage }
      ]

      // Ask モードでのシンプルなAI応答処理

      let finalResponse = ""
      
      await aiAPI.chatStream(
        {
          messages,
          provider: currentProvider as AIClientProvider,
          model: currentModel,
          temperature: 0.7,
          maxTokens: 2048,
          stream: true
        },
        (chunk) => {
          finalResponse += chunk
          setStreamingResponse(finalResponse)
        },
        async () => {
          // Ask モード: シンプルな応答完了処理
          setIsStreaming(false)
          setStreamingResponse("")
          setLastAiResponse(finalResponse)
          onChatResponse(finalResponse)
        },
        async (error) => {
          // Ask モード: シンプルなエラー処理
          setIsStreaming(false)
          setStreamingResponse("")
          setUserFriendlyError(error.message || "メッセージの送信に失敗しました")
        }
      )
    } catch (error) {
      console.error('Chat error:', error)
      setIsStreaming(false)
      setUserFriendlyError(error instanceof Error ? error.message : 'チャットでエラーが発生しました')
    }
  }

  // Agent機能統合処理
  const handleAgentFeatures = async (processedMessage: string, originalMessage: string) => {
    try {
      // Sequential Thinking: 分析段階
      if (agentFeatures.sequentialThinking && currentProcess) {
        await addThinkingStep(
          `🔍 Agent モードでユーザーの質問を分析中: "${processedMessage.substring(0, 100)}..."`,
          1, 6
        )
      }

      setIsStreaming(true)
      setStreamingResponse("")
      
      let agentResponse = ""
      
      // 有効な機能に基づいて処理
      const enabledFeatures = Object.entries(agentFeatures).filter(([_, enabled]) => enabled)
      
      if (agentFeatures.sequentialThinking && currentProcess) {
        await addThinkingStep(
          `🤖 有効なAgent機能: ${enabledFeatures.map(([key]) => key).join(', ')}`,
          2, 6
        )
      }

      // Cursor Agent統合
      if (agentFeatures.cursorAgent) {
        if (agentFeatures.sequentialThinking && currentProcess) {
          await addThinkingStep(`🔧 Cursor Agent に処理を委任中...`, 3, 6)
        }
        
        try {
          // Cursor Agent APIを呼び出し
          const cursorResponse = await fetch('/api/cursor-agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: processedMessage })
          })
          
          if (cursorResponse.ok) {
            const cursorData = await cursorResponse.json()
            agentResponse += `[Cursor Agent]: ${cursorData.response}\n\n`
          }
        } catch (error) {
          console.error('Cursor Agent Error:', error)
          agentResponse += `[Cursor Agent Error]: 接続に失敗しました\n\n`
        }
      }

      // Mulmocast CLI統合
      if (agentFeatures.mulmocastCli) {
        if (agentFeatures.sequentialThinking && currentProcess) {
          await addThinkingStep(`🎥 Mulmocast CLI に処理を委任中...`, 4, 6)
        }
        
        try {
          // Mulmocast CLI APIを呼び出し
          const mulmoResponse = await fetch('/api/mulmocast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'process_message',
              message: processedMessage 
            })
          })
          
          if (mulmoResponse.ok) {
            const mulmoData = await mulmoResponse.json()
            agentResponse += `[Mulmocast]: ${mulmoData.response}\n\n`
          }
        } catch (error) {
          console.error('Mulmocast Error:', error)
          agentResponse += `[Mulmocast Error]: 接続に失敗しました\n\n`
        }
      }

      // AutoGen統合
      if (agentFeatures.autogen) {
        if (agentFeatures.sequentialThinking && currentProcess) {
          await addThinkingStep(`🧠 AutoGen エージェントに処理を委任中...`, 5, 6)
        }
        
        try {
          // AutoGen APIを呼び出し
          const autogenResponse = await fetch('/api/autogen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: processedMessage })
          })
          
          if (autogenResponse.ok) {
            const autogenData = await autogenResponse.json()
            agentResponse += `[AutoGen]: ${autogenData.response}\n\n`
          }
        } catch (error) {
          console.error('AutoGen Error:', error)
          agentResponse += `[AutoGen Error]: 接続に失敗しました\n\n`
        }
      }

      // 基本AI応答も含める（Askモードと同じ処理）
      if (agentFeatures.sequentialThinking && currentProcess) {
        await addThinkingStep(`💭 基本AI応答を生成中...`, 6, 6)
      }

      const messages: ChatMessage[] = [
        ...chatHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        { role: 'user', content: processedMessage }
      ]

      let aiResponse = ""
      await aiAPI.chatStream(
        {
          messages,
          provider: currentProvider as AIClientProvider,
          model: currentModel,
          temperature: 0.7,
          maxTokens: 2048,
          stream: true
        },
        (chunk) => {
          aiResponse += chunk
          const combinedResponse = agentResponse + `[AI Response]: ${aiResponse}`
          setStreamingResponse(combinedResponse)
        },
        async () => {
          const finalResponse = agentResponse + `[AI Response]: ${aiResponse}`
          
          if (agentFeatures.sequentialThinking && currentProcess) {
            await addThinkingStep(
              `✅ Agent処理完了: 全ての有効な機能からの応答を統合しました`,
              6, 6, { needsMoreThoughts: false }
            )
          }
          
          setIsStreaming(false)
          setStreamingResponse("")
          setLastAiResponse(finalResponse)
          onChatResponse(finalResponse)
        },
        async (error) => {
          if (agentFeatures.sequentialThinking && currentProcess) {
            await addThinkingStep(
              `❌ Agent処理エラー: ${error.message}`,
              6, 6, { needsMoreThoughts: false }
            )
          }
          
          setIsStreaming(false)
          setStreamingResponse("")
          setUserFriendlyError(error.message || "Agent処理でエラーが発生しました")
        }
      )
    } catch (error) {
      console.error('Agent Features Error:', error)
      setIsStreaming(false)
      setUserFriendlyError(error instanceof Error ? error.message : 'Agent機能でエラーが発生しました')
    }
  }

  const isDark = theme === "dark"

  if (!mounted) {
    return (
      <div className="h-full bg-black text-white flex items-center justify-center">
        <JumpingDots size="lg" color="#3b82f6" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header with Logo */}
      <div className="flex-shrink-0 flex items-center justify-center py-8">
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center">
          <img src="/icon.png" alt="armis" className="w-16 h-16" />
        </div>
      </div>

      {/* Chat Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 w-full max-w-4xl mx-auto min-h-0 chat-messages-area">
        {/* Connection Status */}
        {error && (
          <div className="p-4 border-b border-neutral-700">
            <div className="flex items-start space-x-2 p-3 rounded-lg border bg-red-900/20 border-red-600 text-red-400">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium whitespace-pre-wrap break-words overflow-wrap-anywhere">{error}</p>
              </div>
            </div>
          </div>
        )}



        {/* Chat History */}
        {chatHistory.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg break-words overflow-wrap-anywhere ${
              msg.role === 'user'
                ? 'bg-neutral-800 text-white border border-neutral-700'
                : 'bg-[#389F70] text-white'
            }`}>
              <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{msg.content}</p>
              
              {/* URL処理結果 */}
              {msg.role === 'user' && scrapedContents.length > 0 && (
                <div className="mt-2 pt-2 border-t border-neutral-700">
                  <div className="flex items-center space-x-1 text-xs text-blue-400 mb-1">
                    <Link className="h-3 w-3" />
                    <span>Webreaderで抽出されたコンテンツ:</span>
                  </div>
                  {scrapedContents.map((content, contentIndex) => (
                    <div key={contentIndex} className="text-xs bg-neutral-800 p-2 rounded border border-neutral-700 mb-1 break-words overflow-wrap-anywhere">
                      <div className="font-medium text-blue-300 mb-1">{content.title}</div>
                      <div className="text-blue-200 text-xs mb-1">{content.description}</div>
                      <div className="text-blue-100 text-xs">{content.content.substring(0, 100)}...</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* AI Streaming Response */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg bg-[#389F70] text-white break-words overflow-wrap-anywhere">
              {streamingResponse ? (
                <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {streamingResponse}
                  <span className="animate-pulse">▌</span>
                </p>
              ) : (
                <div className="flex items-center justify-center py-2">
                  <JumpingDots size="sm" color="white" />
                </div>
              )}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
        {/* Bottom padding for complete scrolling */}
        <div className="h-4"></div>
      </div>

      {/* Error Message */}
      {userFriendlyError && (
        <div className="p-4 border-t border-neutral-700 bg-red-900/20">
          <div className="flex items-center space-x-2 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{userFriendlyError}</span>
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="flex-shrink-0 w-full">
        <Card className="w-full max-w-3xl mx-auto p-4 bg-neutral-900 rounded-t-3xl">
        <CardContent className="flex items-center gap-2">
          {/* チャットモード切り替え */}
          {onModeChange && onAgentFeaturesChange && (
            <ChatModeSwitcher
              currentMode={chatMode}
              agentFeatures={agentFeatures}
              onModeChange={onModeChange}
              onAgentFeaturesChange={onAgentFeaturesChange}
              className="mr-2"
            />
          )}
          
          <AddContextButton
            onAddContext={(type) => {
              console.log('Adding context:', type)
            }}
            className="h-8 px-3 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700"
          />

          {/* Sequential Thinking インジケーター */}
          <div 
            className={`flex items-center px-2 py-1 rounded text-xs text-white ${
              isThinkingConnected ? 'bg-blue-600' : 'bg-gray-600'
            }`} 
            title={`Sequential Thinking ${isThinkingConnected ? '接続済み' : '未接続'}`}
          >
            <Brain className="w-3 h-3 mr-1" />
            <span>思考</span>
            {isThinkingProcessing && (
              <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
            )}
          </div>

          <Input
            className="flex-1 bg-neutral-800 text-white placeholder:text-neutral-400 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Send a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading || isStreaming || isProcessingUrls}
          />

          <ModelSwitcher
            currentProvider={currentProvider}
            currentModel={currentModel}
            availableProviders={availableProviders}
            onProviderChange={(provider) => setCurrentProvider(provider as AIProvider)}
            onModelChange={(model) => setCurrentModel(model)}
            getAvailableModelsForProvider={() => []}
            className="h-8 px-3 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700"
          />

          <AutoModeSwitcher
            currentMode={autoMode}
            onModeChange={setAutoMode}
            className="h-8 px-3 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700"
          />

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading || isStreaming || isProcessingUrls}
            className="text-white"
          >
            {isLoading || isStreaming || isProcessingUrls ? (
              <JumpingDots size="xxs" color="white" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </CardContent>
        </Card>
      </div>

      {/* Sequential Thinking Panel - Agent モードで有効時のみ表示 */}
      {chatMode === 'agent' && agentFeatures.sequentialThinking && (
        <div className="flex-shrink-0 mt-4 p-4 border-t border-neutral-700 bg-neutral-800 rounded-lg max-w-3xl w-full mx-auto">
          <SequentialThinkingPanel
            theme="dark"
            aiContext={message}
            onThoughtGenerated={(thought) => {
              console.log('💭 Sequential Thinking generated:', thought)
            }}
            onProcessComplete={(process) => {
              console.log('🧠 Thinking process completed:', process)
            }}
          />
        </div>
      )}
    </div>
  )
}
