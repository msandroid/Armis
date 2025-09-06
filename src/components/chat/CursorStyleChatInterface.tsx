import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { SplitText } from '@/components/ui/split-text'
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  Code, 
  Bug, 
  FileText, 
  Play, 
  Settings,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  AlertCircle,
  Info
} from 'lucide-react'
import { CursorStyleRouterAgent, RoutingResult, TaskClassification } from '@/services/agent/cursor-style-router-agent'

// チャットメッセージの定義
export interface ChatMessage {
  id: string
  type: 'user' | 'agent' | 'system'
  content: string
  timestamp: Date
  routingResult?: RoutingResult
  metadata?: {
    agent_name?: string
    task_type?: string
    confidence?: number
    execution_time?: number
  }
}

// チャットインターフェースのプロパティ
interface CursorStyleChatInterfaceProps {
  routerAgent: CursorStyleRouterAgent
  onMessageSend?: (message: ChatMessage) => void
  onAgentExecute?: (result: RoutingResult) => void
}

export function CursorStyleChatInterface({ 
  routerAgent, 
  onMessageSend, 
  onAgentExecute 
}: CursorStyleChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [showAgentDetails, setShowAgentDetails] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // メッセージ送信処理
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isProcessing) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsProcessing(true)

    try {
      // ルーターエージェントでメッセージを処理
      const routingResult = await routerAgent.routeAndExecute(input.trim())
      
      const agentMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'agent',
        content: routingResult.executionResult.output,
        timestamp: new Date(),
        routingResult,
        metadata: {
          agent_name: routingResult.selectedAgent.name,
          task_type: routingResult.classification.task_type,
          confidence: routingResult.classification.confidence,
          execution_time: routingResult.metadata.total_execution_time
        }
      }

      setMessages(prev => [...prev, agentMessage])
      
      // コールバック実行
      onMessageSend?.(userMessage)
      onAgentExecute?.(routingResult)

    } catch (error) {
      console.error('Message processing error:', error)
      
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'system',
        content: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }, [input, isProcessing, routerAgent, onMessageSend, onAgentExecute])

  // Enterキーでの送信
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  // メッセージのコピー
  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId(null), 2000)
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }, [])

  // エージェントアイコンの取得
  const getAgentIcon = (taskType: string) => {
    switch (taskType) {
      case 'code_refactor':
        return <Code className="h-4 w-4" />
      case 'command_execution':
        return <Play className="h-4 w-4" />
      case 'debugging':
        return <Bug className="h-4 w-4" />
      case 'document_search':
        return <FileText className="h-4 w-4" />
      case 'workflow_execution':
        return <Settings className="h-4 w-4" />
      case 'semantic_search':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  // 信頼度の色を取得
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Cursor Style Chat Interface
        </CardTitle>
        <p className="text-sm text-gray-600">
          自然言語入力から最適なエージェントに自動ルーティング
        </p>
      </CardHeader>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>メッセージを入力して、AIエージェントと対話を開始してください</p>
            <p className="text-sm mt-2">
              例: 「このコードをリファクタリングして」「サーバーを起動して」「このバグの原因を調べて」
            </p>
          </div>
        ) : (
          messages
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
            <div key={message.id} className="flex gap-3">
              {/* アバター */}
              <div className="flex-shrink-0">
                {message.type === 'user' ? (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    U
                  </div>
                ) : message.type === 'agent' ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                    {message.metadata?.agent_name ? 
                      getAgentIcon(message.metadata.task_type || '') : 
                      <MessageSquare className="h-4 w-4" />
                    }
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                )}
              </div>

              {/* メッセージコンテンツ */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">
                    {message.type === 'user' ? 'You' : 
                     message.type === 'agent' ? message.metadata?.agent_name || 'Agent' : 'System'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  
                  {/* エージェントメッセージの詳細情報 */}
                  {message.type === 'agent' && message.metadata && message.metadata.agent_name && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {message.metadata.task_type}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getConfidenceColor(message.metadata.confidence || 0)}`}
                      >
                        {Math.round((message.metadata.confidence || 0) * 100)}% 信頼度
                      </Badge>
                      {message.metadata.execution_time && (
                        <Badge variant="outline" className="text-xs">
                          {message.metadata.execution_time}ms
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* メッセージ本文 */}
                <Card className="mb-2">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 whitespace-pre-wrap text-sm">
                        {message.type === 'agent' ? (
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="flex-shrink-0"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* ルーティング詳細 */}
                {message.type === 'agent' && message.routingResult && (
                  <div className="mb-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAgentDetails(!showAgentDetails)}
                      className="text-xs"
                    >
                      {showAgentDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      ルーティング詳細
                    </Button>
                    
                    {showAgentDetails && (
                      <Card className="mt-2">
                        <CardContent className="p-3">
                          <Tabs defaultValue="classification" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="classification">分類</TabsTrigger>
                              <TabsTrigger value="execution">実行</TabsTrigger>
                              <TabsTrigger value="suggestions">提案</TabsTrigger>
                            </TabsList>

                            <TabsContent value="classification" className="space-y-2">
                              <div className="text-xs">
                                <div><strong>タスクタイプ:</strong> {message.routingResult.classification.task_type}</div>
                                <div><strong>選択エージェント:</strong> {message.routingResult.selectedAgent.name}</div>
                                <div><strong>信頼度:</strong> {Math.round(message.routingResult.classification.confidence * 100)}%</div>
                                <div><strong>優先度:</strong> {message.routingResult.classification.priority}</div>
                                <div><strong>理由:</strong> {message.routingResult.classification.reasoning}</div>
                              </div>
                            </TabsContent>

                            <TabsContent value="execution" className="space-y-2">
                              <div className="text-xs">
                                <div><strong>実行時間:</strong> {message.routingResult.metadata.total_execution_time}ms</div>
                                <div><strong>ルーティング時間:</strong> {message.routingResult.metadata.routing_time}ms</div>
                                <div><strong>成功:</strong> {message.routingResult.executionResult.success ? 'Yes' : 'No'}</div>
                                {message.routingResult.executionResult.error && (
                                  <div><strong>エラー:</strong> {message.routingResult.executionResult.error}</div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent value="suggestions" className="space-y-2">
                              {message.routingResult.suggestions && message.routingResult.suggestions.length > 0 ? (
                                <div className="text-xs space-y-1">
                                  {message.routingResult.suggestions.map((suggestion, index) => (
                                    <div key={index} className="flex items-start gap-2">
                                      <Info className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                      <span>{suggestion}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-xs text-gray-500">提案はありません</div>
                              )}
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力してください... (例: このコードをリファクタリングして)"
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isProcessing}
            className="self-end"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* 処理中インジケーター */}
        {isProcessing && (
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>エージェントが処理中...</span>
          </div>
        )}
      </div>
    </div>
  )
}
