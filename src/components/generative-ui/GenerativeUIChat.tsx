import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Settings, Bot, User, Image, Video, Eye, Upload, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { generativeUIService } from '@/services/generative-ui/generative-ui-service'
import { Weather } from './Weather'
import { Stock } from './Stock'
import { ImageGenerator } from './ImageGenerator'
import { Translation } from './Translation'
import { Calculator } from './Calculator'
import { SearchResults } from './SearchResults'
import { ImageAnalyzer } from './ImageAnalyzer'
import { MediaGenerator } from './MediaGenerator'
import { AIProviderConfig } from '@/types/ai-sdk'
import { GoogleDirectService } from '@/services/llm/google-direct-service'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageData?: string // 画像データ
  videoData?: string // ビデオデータ
  audioData?: string // 音声データ
  toolCalls?: Array<{
    toolName: string
    state: string
    output?: any
    errorText?: string
  }>
  timestamp: Date
}

interface GenerativeUIChatProps {
  className?: string
  onProviderConfigure?: (config: AIProviderConfig) => void
}

export const GenerativeUIChat: React.FC<GenerativeUIChatProps> = ({
  className = '',
  onProviderConfigure
}) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentResponse, setCurrentResponse] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'image-analysis' | 'media-generation'>('chat')
  const [chatImageData, setChatImageData] = useState<string | null>(null)
  const [chatVideoData, setChatVideoData] = useState<string | null>(null)
  const [chatAudioData, setChatAudioData] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [googleService, setGoogleService] = useState<GoogleDirectService | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentResponse])

  // Google Direct Serviceの初期化
  useEffect(() => {
    if (generativeUIService.isConfigured()) {
      const service = new GoogleDirectService()
      // AI SDK Serviceから設定を取得してGoogle Direct Serviceに設定
      const config = generativeUIService.getCurrentConfig()
      if (config && config.providerId === 'google' && config.apiKey) {
        service.configure(config.apiKey, config.modelId || 'gemini-2.5-flash')
        setGoogleService(service)
        console.log('Google Direct Service configured with model:', config.modelId || 'gemini-2.5-flash')
      }
    }
  }, [])

  // チャット用画像アップロード
  const onChatImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        const base64Data = result.split(',')[1]
        setChatImageData(base64Data)
        setChatVideoData(null)
        setChatAudioData(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // チャット用ビデオアップロード
  const onChatVideoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        const base64Data = result.split(',')[1]
        setChatVideoData(base64Data)
        setChatImageData(null)
        setChatAudioData(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // チャット用音声アップロード
  const onChatAudioDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        const base64Data = result.split(',')[1]
        setChatAudioData(base64Data)
        setChatImageData(null)
        setChatVideoData(null)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps: getChatImageRootProps, getInputProps: getChatImageInputProps } = useDropzone({
    onDrop: onChatImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  })

  const { getRootProps: getChatVideoRootProps, getInputProps: getChatVideoInputProps } = useDropzone({
    onDrop: onChatVideoDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv']
    },
    multiple: false
  })

  const { getRootProps: getChatAudioRootProps, getInputProps: getChatAudioInputProps } = useDropzone({
    onDrop: onChatAudioDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.aac', '.ogg', '.m4a']
    },
    multiple: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && !chatImageData) || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || (chatImageData ? 'この画像について説明してください' : chatVideoData ? 'このビデオについて説明してください' : chatAudioData ? 'この音声について説明してください' : ''),
      imageData: chatImageData || undefined,
      videoData: chatVideoData || undefined,
      audioData: chatAudioData || undefined,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setChatImageData(null)
    setChatVideoData(null)
    setChatAudioData(null)
    setIsLoading(true)
    setCurrentResponse('')
    setError(null)

    try {
              // Google Direct Serviceを使用してマルチモーダル処理
        if (googleService && (chatImageData || chatVideoData || chatAudioData || input.trim())) {
          const prompt = input || (chatImageData ? 'この画像について説明してください' : chatVideoData ? 'このビデオについて説明してください' : chatAudioData ? 'この音声について説明してください' : '')
          
          let fullResponse = ''
          await googleService.streamResponse(
            prompt,
            (chunk) => {
              fullResponse += chunk
              setCurrentResponse(prev => prev + chunk)
            },
            chatImageData || undefined,
            chatVideoData || undefined,
            chatAudioData || undefined
          )
          
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage?.role === 'assistant') {
              return prev.map((msg, index) => 
                index === prev.length - 1 
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            } else {
              return [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date()
              }]
            }
          })
          setCurrentResponse('')
          setIsLoading(false)
        } else {
        // 従来のGenerative UI Serviceを使用
        await generativeUIService.processGenerativeUIRequest(
          input,
          (chunk) => {
            setCurrentResponse(prev => prev + chunk)
          },
          (toolName, state, output) => {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1]
              if (lastMessage?.role === 'assistant') {
                const updatedToolCalls = [...(lastMessage.toolCalls || [])]
                const existingIndex = updatedToolCalls.findIndex(tc => tc.toolName === toolName)
                
                if (existingIndex >= 0) {
                  updatedToolCalls[existingIndex] = { toolName, state, output }
                } else {
                  updatedToolCalls.push({ toolName, state, output })
                }

                return prev.map((msg, index) => 
                  index === prev.length - 1 
                    ? { ...msg, toolCalls: updatedToolCalls }
                    : msg
                )
              }
              return prev
            })
          },
          (fullResponse) => {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1]
              if (lastMessage?.role === 'assistant') {
                return prev.map((msg, index) => 
                  index === prev.length - 1 
                    ? { ...msg, content: fullResponse }
                    : msg
                )
              } else {
                return [...prev, {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: fullResponse,
                  timestamp: new Date()
                }]
              }
            })
            setCurrentResponse('')
            setIsLoading(false)
          },
          (error) => {
            setError(error.message)
            setIsLoading(false)
            setCurrentResponse('')
          }
        )
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
      setIsLoading(false)
      setCurrentResponse('')
    }
  }

  const renderToolComponent = (toolCall: any) => {
    const { toolName, state, output, errorText } = toolCall

    switch (state) {
      case 'input-available':
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              {toolName} を実行中...
            </div>
          </div>
        )

      case 'output-available':
        switch (toolName) {
          case 'displayWeather':
            return <Weather {...output} />
          case 'getStockPrice':
            return <Stock {...output} />
          case 'generateImage':
            return <ImageGenerator {...output} />
          case 'translateText':
            return <Translation {...output} />
          case 'calculate':
            return <Calculator {...output} />
          case 'searchWeb':
            return <SearchResults {...output} />
          default:
            return (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ツール実行結果: {JSON.stringify(output, null, 2)}
                </div>
              </div>
            )
        }

      case 'output-error':
        return (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <div className="text-sm text-red-800 dark:text-red-200">
              エラー: {errorText}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const renderMessage = (message: Message) => {
    return (
      <div key={message.id} className="mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {message.role === 'user' ? (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              {/* 画像の表示 */}
              {message.imageData && (
                <div className="mb-3">
                  <img
                    src={`data:image/jpeg;base64,${message.imageData}`}
                    alt="送信された画像"
                    className="max-w-full h-auto max-h-48 rounded-lg border"
                  />
                </div>
              )}
              
              {/* ビデオの表示 */}
              {message.videoData && (
                <div className="mb-3">
                  <video
                    src={`data:video/mp4;base64,${message.videoData}`}
                    controls
                    className="max-w-full h-auto max-h-48 rounded-lg border"
                  />
                </div>
              )}
              
              {/* 音声の表示 */}
              {message.audioData && (
                <div className="mb-3">
                  <audio
                    src={`data:audio/mpeg;base64,${message.audioData}`}
                    controls
                    className="w-full"
                  />
                </div>
              )}
              
              <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {message.content}
              </div>
              
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-4 space-y-3">
                  {message.toolCalls.map((toolCall, index) => (
                    <div key={index}>
                      {renderToolComponent(toolCall)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Generative UI チャット
        </h2>
        <div className="flex items-center space-x-2">
          {!generativeUIService.isConfigured() && (
            <div className="text-sm text-red-600 dark:text-red-400">
              AIプロバイダーが設定されていません
            </div>
          )}
          <Settings className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          チャット
        </button>
        <button
          onClick={() => setActiveTab('image-analysis')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'image-analysis'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          画像分析
        </button>
        <button
          onClick={() => setActiveTab('media-generation')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'media-generation'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Image className="w-4 h-4" />
          メディア生成
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {messages.map(renderMessage)}
            
            {isLoading && (
              <div className="mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {currentResponse}
                        {isLoading && (
                          <span className="inline-block ml-1">
                            <div className="animate-pulse">▋</div>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="text-sm text-red-800 dark:text-red-200">
                  エラー: {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === 'image-analysis' && googleService && (
          <ImageAnalyzer googleService={googleService} />
        )}

        {activeTab === 'media-generation' && googleService && (
          <MediaGenerator googleService={googleService} />
        )}
      </div>

      {/* Input - Only show for chat tab */}
      {activeTab === 'chat' && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          {/* メディアプレビュー */}
          {chatImageData && (
            <div className="mb-3 relative">
              <img
                src={`data:image/jpeg;base64,${chatImageData}`}
                alt="アップロードされた画像"
                className="max-w-full h-auto max-h-32 rounded-lg border"
              />
              <button
                onClick={() => setChatImageData(null)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                title="画像を削除"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {chatVideoData && (
            <div className="mb-3 relative">
              <video
                src={`data:video/mp4;base64,${chatVideoData}`}
                controls
                className="max-w-full h-auto max-h-32 rounded-lg border"
              />
              <button
                onClick={() => setChatVideoData(null)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                title="ビデオを削除"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          {chatAudioData && (
            <div className="mb-3 relative">
              <audio
                src={`data:audio/mpeg;base64,${chatAudioData}`}
                controls
                className="w-full"
              />
              <button
                onClick={() => setChatAudioData(null)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                title="音声を削除"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="メッセージを入力してください..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
              disabled={isLoading || !generativeUIService.isConfigured()}
            />
            
            {/* メディアアップロードボタン */}
            <button
              type="button"
              {...getChatImageRootProps()}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              title="画像をアップロード"
            >
              <input {...getChatImageInputProps()} />
              <Image className="w-4 h-4 text-gray-500" />
            </button>
            
            <button
              type="button"
              {...getChatVideoRootProps()}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              title="ビデオをアップロード"
            >
              <input {...getChatVideoInputProps()} />
              <Video className="w-4 h-4 text-gray-500" />
            </button>
            
            <button
              type="button"
              {...getChatAudioRootProps()}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              title="音声をアップロード"
            >
              <input {...getChatAudioInputProps()} />
              <Upload className="w-4 h-4 text-gray-500" />
            </button>
            
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && !chatImageData && !chatVideoData && !chatAudioData) || !generativeUIService.isConfigured()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>送信</span>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
