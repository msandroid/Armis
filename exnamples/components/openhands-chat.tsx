'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User, Terminal, FileText, Globe, Code, Settings, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Switch } from './ui/switch'
import { useToast } from './ui/use-toast'
import { OpenHandsMessage, OpenHandsSession, OpenHandsConfig } from '../types/openhands'

interface OpenHandsChatProps {
  className?: string
  defaultConfig?: Partial<OpenHandsConfig>
  onSessionChange?: (session: OpenHandsSession | null) => void
}

export function OpenHandsChat({ className, defaultConfig, onSessionChange }: OpenHandsChatProps) {
  const [session, setSession] = useState<OpenHandsSession | null>(null)
  const [messages, setMessages] = useState<OpenHandsMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [config, setConfig] = useState<OpenHandsConfig>({
    baseUrl: process.env.NEXT_PUBLIC_OPENHANDS_BASE_URL || 'http://localhost:3000',
    model: 'anthropic/claude-sonnet-4-20250514',
    maxTokens: 4000,
    temperature: 0.7,
    ...defaultConfig
  })
  const [showSettings, setShowSettings] = useState(false)
  const [useStreaming, setUseStreaming] = useState(true)
  
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // メッセージ一覧の自動スクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  // OpenHandsサービスの接続確認
  const checkConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/openhands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkConnection' })
      })
      
      const result = await response.json()
      setIsConnected(result.success)
      return result.success
    } catch (error) {
      console.error('Connection check failed:', error)
      setIsConnected(false)
      return false
    }
  }

  // セッションの作成
  const createSession = async (): Promise<OpenHandsSession | null> => {
    try {
      const response = await fetch('/api/openhands/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        const newSession = result.data
        setSession(newSession)
        setMessages([])
        onSessionChange?.(newSession)
        
        toast({
          title: "セッション作成",
          description: "新しいOpenHandsセッションを開始しました",
        })
        
        return newSession
      } else {
        throw new Error(result.error || 'セッションの作成に失敗しました')
      }
    } catch (error) {
      console.error('Session creation failed:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : 'セッションの作成に失敗しました',
        variant: "destructive"
      })
      return null
    }
  }

  // メッセージの送信
  const sendMessage = async (content: string) => {
    if (!session) {
      const newSession = await createSession()
      if (!newSession) return
    }

    if (!content.trim() || isLoading) return

    const userMessage: OpenHandsMessage = {
      role: 'user',
      content,
      timestamp: new Date(),
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setStreamingMessage('')

    // AbortControllerを作成
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch(`/api/openhands/sessions/${session?.sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content, 
          stream: useStreaming 
        }),
        signal: abortControllerRef.current.signal
      })

      if (useStreaming) {
        // ストリーミングレスポンスの処理
        const reader = response.body?.getReader()
        if (!reader) throw new Error('ストリーミングレスポンスを読み取れません')

        let assistantMessage = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.chunk) {
                  assistantMessage += data.chunk
                  setStreamingMessage(assistantMessage)
                } else if (data.done) {
                  // ストリーミング完了
                  const finalMessage: OpenHandsMessage = {
                    role: 'assistant',
                    content: assistantMessage,
                    timestamp: new Date(),
                    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                  }
                  setMessages(prev => [...prev, finalMessage])
                  setStreamingMessage('')
                } else if (data.error) {
                  throw new Error(data.error)
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', parseError)
              }
            }
          }
        }
      } else {
        // 通常のレスポンス処理
        const result = await response.json()
        
        if (result.success) {
          setMessages(prev => [...prev, result.data])
        } else {
          throw new Error(result.error || 'メッセージの送信に失敗しました')
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted')
        return
      }
      
      console.error('Message send failed:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : 'メッセージの送信に失敗しました',
        variant: "destructive"
      })
      
      // エラーメッセージを追加
      const errorMessage: OpenHandsMessage = {
        role: 'assistant',
        content: `エラー: ${error instanceof Error ? error.message : 'メッセージの送信に失敗しました'}`,
        timestamp: new Date(),
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setStreamingMessage('')
      abortControllerRef.current = null
    }
  }

  // リクエストのキャンセル
  const cancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsLoading(false)
      setStreamingMessage('')
    }
  }

  // 設定の更新
  const updateConfig = async (newConfig: Partial<OpenHandsConfig>) => {
    try {
      const response = await fetch('/api/openhands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'updateConfig', 
          config: newConfig 
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setConfig(prev => ({ ...prev, ...newConfig }))
        toast({
          title: "設定更新",
          description: "OpenHands設定を更新しました",
        })
      } else {
        throw new Error(result.error || '設定の更新に失敗しました')
      }
    } catch (error) {
      console.error('Config update failed:', error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : '設定の更新に失敗しました',
        variant: "destructive"
      })
    }
  }

  // 初期化
  useEffect(() => {
    checkConnection()
  }, [])

  // メッセージアイコンの取得
  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'assistant':
        return <Bot className="w-4 h-4 text-blue-600" />
      case 'user':
        return <User className="w-4 h-4 text-green-600" />
      default:
        return <Terminal className="w-4 h-4 text-gray-600" />
    }
  }

  // メッセージの形式化
  const formatContent = (content: string) => {
    // 簡単なMarkdown風の表示（コードブロック、リンクなど）
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('```')) {
          return <code key={index} className="block bg-gray-100 p-2 rounded text-sm font-mono">{line.slice(3)}</code>
        }
        if (line.trim().startsWith('- ')) {
          return <li key={index} className="ml-4">{line.slice(2)}</li>
        }
        return <p key={index} className="mb-1">{line}</p>
      })
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            OpenHands チャット
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "接続済み" : "未接続"}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkConnection()}
              disabled={isLoading}
            >
              接続確認
            </Button>
            
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>OpenHands設定</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model">AIモデル</Label>
                    <Select
                      value={config.model}
                      onValueChange={(value) => setConfig(prev => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anthropic/claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                        <SelectItem value="anthropic/claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="openai/gpt-4">GPT-4</SelectItem>
                        <SelectItem value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxTokens">最大トークン数</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min="100"
                      max="8000"
                      value={config.maxTokens}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="streaming"
                      checked={useStreaming}
                      onCheckedChange={setUseStreaming}
                    />
                    <Label htmlFor="streaming">ストリーミング応答</Label>
                  </div>
                  
                  <Button onClick={() => updateConfig(config)} className="w-full">
                    設定を保存
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {session && (
          <div className="text-sm text-muted-foreground">
            セッション ID: {session.sessionId}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4">
        <ScrollArea className="flex-1 mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.messageId}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {getMessageIcon(message.role)}
                </div>
                <div
                  className={`flex-1 max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm">
                    {formatContent(message.content)}
                  </div>
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {streamingMessage && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 max-w-[80%] p-3 rounded-lg bg-muted">
                  <div className="text-sm">
                    {formatContent(streamingMessage)}
                    <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="OpenHandsに質問やタスクを入力してください..."
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(inputValue)
              }
            }}
            className="flex-1"
          />
          {isLoading ? (
            <Button onClick={cancelRequest} variant="outline" size="sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              停止
            </Button>
          ) : (
            <Button 
              onClick={() => sendMessage(inputValue)}
              disabled={!inputValue.trim() || !isConnected}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {!isConnected && (
          <div className="mt-2 text-sm text-muted-foreground text-center">
            OpenHandsサービスに接続されていません。設定を確認してください。
          </div>
        )}
      </CardContent>
    </Card>
  )
}
