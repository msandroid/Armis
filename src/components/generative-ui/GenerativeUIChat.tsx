import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Settings, Bot, User, Image, Video, Eye, Upload, X, Brain, File, Volume2 } from 'lucide-react'
import { generativeUIService } from '@/services/generative-ui/generative-ui-service'
import { Weather } from './Weather'
import { Stock } from './Stock'
import { ImageGenerator } from './ImageGenerator'
import { Translation } from './Translation'
import { Calculator } from './Calculator'
import { SearchResults } from './SearchResults'
import { ImageAnalyzer } from './ImageAnalyzer'
import { MediaGenerator } from './MediaGenerator'
import { GeminiUnderstandingInterface } from './GeminiUnderstandingInterface'
import { VideoPlayer } from './VideoPlayer'
import { VideoOptimizationInfo } from './VideoOptimizationInfo'
import { FileManager } from './FileManager'
import { AudioTranscription } from './AudioTranscription'
import { AIProviderConfig } from '@/types/ai-sdk'
import { GoogleDirectService, FileMetadata } from '@/services/llm/google-direct-service'

// 利用可能なGeminiモデル
const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '高速・高精度（推奨）' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: '最高精度・長文対応' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'バランス型' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '長文・高精度' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: '高速処理' }
]

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageData?: string // 画像データ
  videoData?: string // ビデオデータ
  videoMimeType?: string // 動画のMIMEタイプ
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
  const [activeTab, setActiveTab] = useState<'chat' | 'image-analysis' | 'media-generation' | 'understanding' | 'files' | 'audio-transcription'>('chat')
  const [chatImageData, setChatImageData] = useState<string | null>(null)
  const [chatImageFile, setChatImageFile] = useState<File | null>(null)
  const [chatVideoData, setChatVideoData] = useState<string | null>(null)
  const [chatVideoFile, setChatVideoFile] = useState<File | null>(null)
  const [chatVideoMimeType, setChatVideoMimeType] = useState<string>('video/mp4')
  const [chatAudioData, setChatAudioData] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [googleService, setGoogleService] = useState<GoogleDirectService | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash')
  const [modelChangeStatus, setModelChangeStatus] = useState<'idle' | 'changing' | 'success' | 'error'>('idle')

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
        service.configure(config.apiKey, selectedModel)
        setGoogleService(service)
        console.log('Google Direct Service configured with model:', selectedModel)
      }
    }
  }, [selectedModel])

  // モデル変更ハンドラー
  const handleModelChange = async (newModel: string) => {
    setModelChangeStatus('changing')
    try {
      setSelectedModel(newModel)
      if (googleService) {
        const config = generativeUIService.getCurrentConfig()
        if (config && config.apiKey) {
          googleService.configure(config.apiKey, newModel)
        }
      }
      setModelChangeStatus('success')
      setTimeout(() => setModelChangeStatus('idle'), 2000)
    } catch (error) {
      console.error('Model change failed:', error)
      setModelChangeStatus('error')
      setTimeout(() => setModelChangeStatus('idle'), 2000)
    }
  }

  // ファイルアップロードハンドラー
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const result = e.target?.result as string
      const base64Data = result.split(',')[1]

      if (file.type.startsWith('image/')) {
        setChatImageData(base64Data)
        setChatImageFile(file)
      } else if (file.type.startsWith('video/')) {
        setChatVideoData(base64Data)
        setChatVideoFile(file)
        setChatVideoMimeType(file.type)
      } else if (file.type.startsWith('audio/')) {
        setChatAudioData(base64Data)
      }
    }

    reader.readAsDataURL(file)
  }

  // 添付ファイルをクリア
  const clearAttachments = () => {
    setChatImageData(null)
    setChatImageFile(null)
    setChatVideoData(null)
    setChatVideoFile(null)
    setChatVideoMimeType('video/mp4')
    setChatAudioData(null)
  }

  // メッセージ送信ハンドラー
  const handleSend = async () => {
    if (!input.trim() && !chatImageData && !chatVideoData && !chatAudioData) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      imageData: chatImageData || undefined,
      videoData: chatVideoData || undefined,
      videoMimeType: chatVideoMimeType,
      audioData: chatAudioData || undefined,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    clearAttachments()
    setIsLoading(true)
    setCurrentResponse('')
    setError(null)

    try {
      // ここでAIサービスを呼び出してレスポンスを生成
      // 実際の実装では、generativeUIServiceを使用
      const response = "これはサンプルレスポンスです。実際のAIサービスとの統合が必要です。"
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  // キーダウンハンドラー
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // メッセージレンダリング
  const renderMessage = (message: Message) => {
    return (
      <div key={message.id} className="mb-6">
        <div className="flex items-start space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
          }`}>
            {message.role === 'user' ? (
              <User className="w-5 h-5 text-white" />
            ) : (
              <Bot className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              {/* 画像の表示 */}
              {message.imageData && (
                <div className="mb-3">
                  <img
                    src={`data:image/jpeg;base64,${message.imageData}`}
                    alt="アップロードされた画像"
                    className="max-w-full h-auto max-h-48 rounded"
                  />
                </div>
              )}
              
              {/* ビデオの表示 */}
              {message.videoData && (
                <div className="mb-3">
                  <VideoPlayer
                    src={`data:${message.videoMimeType || 'video/mp4'};base64,${message.videoData}`}
                    className="max-w-full h-auto max-h-48"
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
                      {/* ツールコールの表示 */}
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
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Generative UI Chat
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Model Selection */}
          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            disabled={modelChangeStatus === 'changing'}
            title="AIモデルを選択"
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
          
          {modelChangeStatus === 'changing' && (
            <div className="text-sm text-blue-600">変更中...</div>
          )}
          {modelChangeStatus === 'success' && (
            <div className="text-sm text-green-600">✓</div>
          )}
          {modelChangeStatus === 'error' && (
            <div className="text-sm text-red-600">✗</div>
          )}
          
          <button
            onClick={() => setActiveTab('chat')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="設定"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>チャット</span>
        </button>
        
        <button
          onClick={() => setActiveTab('image-analysis')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'image-analysis'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>画像分析</span>
        </button>
        
        <button
          onClick={() => setActiveTab('media-generation')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'media-generation'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>メディア生成</span>
        </button>
        
        <button
          onClick={() => setActiveTab('understanding')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'understanding'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>理解・分析</span>
        </button>
        
        <button
          onClick={() => setActiveTab('audio-transcription')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'audio-transcription'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>音声文字起こし</span>
        </button>
        
        <button
          onClick={() => setActiveTab('files')}
          className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'files'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <File className="w-4 h-4" />
          <span>ファイル管理</span>
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

        {activeTab === 'understanding' && googleService && (
          <GeminiUnderstandingInterface googleService={googleService} />
        )}

        {activeTab === 'audio-transcription' && (
          <AudioTranscription />
        )}

        {activeTab === 'files' && googleService && (
          <FileManager googleService={googleService} />
        )}

        {activeTab === 'media-generation' && (
          <div className="space-y-6">
            <ImageGenerator 
              prompt=""
              style=""
              size={{ width: 512, height: 512 }}
              imageUrl=""
              generatedAt=""
            />
            {googleService && (
              <MediaGenerator googleService={googleService} />
            )}
          </div>
        )}
      </div>

      {/* Input Area - Only show for chat tab */}
      {activeTab === 'chat' && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力してください..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                title="メッセージ入力"
              />
              
              {/* File Upload Button */}
              <button
                onClick={() => document.getElementById('file-upload')?.click()}
                className="absolute right-2 bottom-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="ファイルをアップロード"
              >
                <Upload className="w-4 h-4" />
              </button>
              
              <input
                id="file-upload"
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileUpload}
                className="hidden"
                multiple
                title="ファイル選択"
              />
            </div>
            
            <button
              onClick={handleSend}
              disabled={!input.trim() && !chatImageData && !chatVideoData && !chatAudioData || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              title="メッセージを送信"
            >
              <Send className="w-4 h-4" />
              <span>送信</span>
            </button>
          </div>
          
          {/* Preview Area */}
          {(chatImageData || chatVideoData || chatAudioData) && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  添付ファイル:
                </span>
                <button
                  onClick={clearAttachments}
                  className="text-red-500 hover:text-red-700"
                  title="添付ファイルを削除"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {chatImageData && (
                <div className="mt-2">
                  <img
                    src={`data:image/jpeg;base64,${chatImageData}`}
                    alt="Preview"
                    className="max-w-32 max-h-32 object-cover rounded"
                  />
                </div>
              )}
              
              {chatVideoData && (
                <div className="mt-2">
                  <video
                    src={`data:${chatVideoMimeType};base64,${chatVideoData}`}
                    controls
                    className="max-w-32 max-h-32 object-cover rounded"
                  />
                </div>
              )}
              
              {chatAudioData && (
                <div className="mt-2">
                  <audio
                    src={`data:audio/mpeg;base64,${chatAudioData}`}
                    controls
                    className="w-full"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
