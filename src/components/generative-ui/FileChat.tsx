import { useState, useRef, useEffect } from 'react'
import { Send, File, MessageSquare, Bot, User, X } from 'lucide-react'
import { SplitText } from '@/components/ui/split-text'
import { GoogleDirectService, FileMetadata } from '@/services/llm/google-direct-service'

interface FileChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  file?: FileMetadata
  timestamp: Date
}

interface FileChatProps {
  googleService: GoogleDirectService
  selectedFile: FileMetadata | null
}

export function FileChat({ googleService, selectedFile }: FileChatProps) {
  const [messages, setMessages] = useState<FileChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // メッセージリストの自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ファイルが選択された時の初期メッセージ
  useEffect(() => {
    if (selectedFile && messages.length === 0) {
      const initialMessage: FileChatMessage = {
        id: 'initial',
        role: 'assistant',
        content: `File "${selectedFile.displayName}" has been selected. Please ask any questions about this file.`,
        file: selectedFile,
        timestamp: new Date()
      }
      setMessages([initialMessage])
    }
  }, [selectedFile])

  // メッセージを送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedFile || isLoading) return

    const userMessage: FileChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      file: selectedFile,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      console.log('=== ファイルチャット開始 ===')
      console.log('ファイル:', selectedFile.displayName)
      console.log('プロンプト:', input)

      let response = ''
      await googleService.generateContentWithFile(
        input,
        selectedFile.uri,
        selectedFile.mimeType,
        (chunk: string) => {
          response += chunk
          // リアルタイムでレスポンスを更新
          setMessages(prev => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content = response
            } else {
              newMessages.push({
                id: Date.now().toString(),
                role: 'assistant',
                content: response,
                timestamp: new Date()
              })
            }
            return newMessages
          })
        }
      )

      console.log('ファイルチャット完了')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      console.error('ファイルチャットエラー:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // ファイルタイプを取得
  const getFileType = (mimeType: string) => {
    if (mimeType.startsWith('video/')) return 'Video'
    if (mimeType.startsWith('audio/')) return 'Audio'
    if (mimeType.startsWith('image/')) return 'Image'
    if (mimeType.includes('pdf')) return 'PDF'
    if (mimeType.includes('document')) return 'Document'
    return 'Other'
  }

  // ファイルサイズを人間が読みやすい形式に変換
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '不明'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <File className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Please select a file to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <File className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              File Chat
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFile.displayName}
            </p>
          </div>
        </div>
      </div>

      {/* ファイル情報 */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              {getFileType(selectedFile.mimeType)}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Size:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              {formatFileSize(selectedFile.sizeBytes)}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {selectedFile.state || 'Unknown'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Created:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {selectedFile.createTime ? new Date(selectedFile.createTime).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700">
          <div className="text-sm text-red-800 dark:text-red-200">
                          Error: {error}
          </div>
        </div>
      )}

      {/* メッセージリスト */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages
          .filter((message) => {
            // 空のメッセージや無効なメッセージを非表示にする
            if (!message.content || 
                message.content.trim() === '' || 
                message.content === ' ' ||
                message.content === '\n' ||
                message.content === '\t' ||
                message.content === '{}' ||
                message.content === '[]' ||
                message.content === 'null' ||
                message.content === 'undefined' ||
                /^\s*$/.test(message.content) ||
                /^\s*\{\s*\}\s*$/.test(message.content) ||
                /^\s*\[\s*\]\s*$/.test(message.content)) {
              return false
            }
            return true
          })
          .map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="whitespace-pre-wrap">
                    {message.role === 'assistant' ? (
                      <SplitText 
                        delay={0.1}
                        stagger={0.01}
                        duration={0.3}
                        ease="easeOut"
                      >
                        {message.content}
                      </SplitText>
                    ) : (
                      message.content
                    )}
                  </div>
                  {message.file && (
                    <div className="mt-2 text-xs opacity-75">
                      ファイル: {message.file.displayName}
                    </div>
                  )}
                  <div className="mt-1 text-xs opacity-50">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 入力フォーム */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask questions about the file..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
