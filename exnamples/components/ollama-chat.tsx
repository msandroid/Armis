'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Send, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Bot, 
  User,
  Settings,
  MessageSquare,
  Image,
  ArrowDown
} from 'lucide-react'
import { useOllama } from '@/hooks/use-ollama'
import { toast } from 'sonner'
import { JumpingDots } from '@/components/ui/jumping-dots'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
}

export function OllamaChat() {
  const { 
    models, 
    currentModel, 
    setCurrentModel, 
    isLoading, 
    isConnected, 
    error,
    sendChat,
    sendStreamingChat
  } = useOllama()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [shouldShowScrollButton, setShouldShowScrollButton] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // メッセージを送信
  const sendMessage = async () => {
    if (!inputMessage.trim() || !isConnected) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    try {
      // アシスタントメッセージを追加（ストリーミング用）
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        model: currentModel
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsStreaming(true)
      setStreamingMessage('')

      // ストリーミングチャットを送信
      await sendStreamingChat(
        messages.map(msg => ({ role: msg.role, content: msg.content })),
        (chunk) => {
          setStreamingMessage(prev => prev + chunk)
        },
        () => {
          setIsStreaming(false)
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: streamingMessage }
                : msg
            )
          )
          setStreamingMessage('')
        },
        (error) => {
          setIsStreaming(false)
          toast.error(`Chat error: ${error.message}`)
          setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id))
        },
        currentModel
      )
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    }
  }

  // チャット履歴をクリア
  const clearChat = () => {
    setMessages([])
    setStreamingMessage('')
  }

  // スクロール関数
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      } else {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
      }
      setShouldShowScrollButton(false)
    }
  }, [])

  // スクロール位置を監視してボタン表示を制御
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (viewport) {
        const { scrollTop, scrollHeight, clientHeight } = viewport
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShouldShowScrollButton(!isNearBottom)
      }
    }
  }, [])

  // スクロールを最下部に移動
  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage, scrollToBottom])

  // スクロールイベントリスナーを設定
  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (scrollArea) {
      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (viewport) {
        viewport.addEventListener('scroll', handleScroll)
        return () => viewport.removeEventListener('scroll', handleScroll)
      }
    }
  }, [handleScroll])

  // Enterキーでメッセージを送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ファイルアップロード処理
  const handleFileUpload = (files: FileList) => {
    const newFiles = Array.from(files)
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // ファイル情報をメッセージに追加
    const fileInfo = newFiles.map(file => 
      `📎 ${file.name} (${(file.size / 1024).toFixed(1)}KB)`
    ).join('\n')
    
    setInputMessage(prev => prev + (prev ? '\n' : '') + fileInfo)
  }

  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Ollama Chat</CardTitle>
            <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
              {isConnected ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Disconnected
                </>
              )}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={currentModel} onValueChange={setCurrentModel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.name} value={model.name}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={messages.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive" className="mx-4 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* チャット履歴 */}
      <CardContent className="flex-1 p-0 relative min-h-0">
        <ScrollArea className="h-full w-full chat-messages-area" ref={scrollAreaRef}>
          <div className="px-4 space-y-4 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-4" />
                <p>Start a conversation with Ollama</p>
                <p className="text-sm">Select a model and type your message below</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] lg:max-w-[75%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg px-3 py-2 break-words overflow-wrap-anywhere ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {message.role === 'user' ? 'You' : 'Assistant'}
                        </span>
                        {message.model && (
                          <Badge variant="outline" className="text-xs">
                            {message.model}
                          </Badge>
                        )}
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* AI回答待機時のローディング */}
            {isLoading && !isStreaming && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  
                  <div className="rounded-lg px-3 py-2 bg-muted">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Assistant</span>
                      <Badge variant="outline" className="text-xs">
                        {currentModel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        生成中...
                      </Badge>
                    </div>
                    <JumpingDots size="sm" color="currentColor" />
                  </div>
                </div>
              </div>
            )}

            {/* ストリーミング中のメッセージ */}
            {isStreaming && streamingMessage && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-4 w-4" />
                  </div>
                  
                  <div className="rounded-lg px-3 py-2 bg-muted">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">Assistant</span>
                      <Badge variant="outline" className="text-xs">
                        {currentModel}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Streaming
                      </Badge>
                    </div>
                    <p className="whitespace-pre-wrap">
                      {streamingMessage}
                      <span className="animate-pulse">▋</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* スクロールボトムボタン */}
        {shouldShowScrollButton && (
          <Button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg"
            size="icon"
            variant="secondary"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </CardContent>

      {/* 入力エリア */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!isConnected || isLoading || isStreaming}
            />
          </div>
          
          {/* ファイルアップロードボタン */}
          <Button
            variant="outline"
            size="icon"
            onClick={openFileDialog}
            disabled={!isConnected || isLoading || isStreaming}
            className="flex items-center gap-1"
            title="ファイルをアップロード"
          >
            <Image className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || !isConnected || isLoading || isStreaming}
            className="flex items-center gap-1"
          >
            {isLoading || isStreaming ? (
              <JumpingDots size="xxs" color="currentColor" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send
          </Button>
        </div>
        
        {!isConnected && (
          <p className="text-xs text-muted-foreground mt-2">
            Connect to Ollama server to start chatting
          </p>
        )}
        
        {/* 隠しファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,text/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={(e) => {
            if (e.target.files) {
              handleFileUpload(e.target.files)
            }
            // 同じファイルを再度選択できるようにリセット
            e.target.value = ''
          }}
          className="hidden"
          aria-label="ファイルをアップロード"
        />
      </div>
    </div>
  )
} 