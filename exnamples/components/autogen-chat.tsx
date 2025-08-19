'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Bot, 
  Users, 
  Play, 
  Square, 
  RefreshCw, 
  Trash2, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Loader2,
  MessageSquare,
  Clock,
  AlertCircle,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface AutoGenAgent {
  id: string
  name: string
  type: string
  role: string
  description: string
  status: 'idle' | 'active' | 'thinking' | 'error'
}

interface AutoGenSession {
  sessionId: string
  status: 'idle' | 'running' | 'completed' | 'error'
  agents: AutoGenAgent[]
  messages: AutoGenMessage[]
  createdAt: Date
  lastActivity: Date
}

interface AutoGenMessage {
  id: string
  sender: string
  recipient: string
  content: string
  timestamp: Date
  type: 'user' | 'agent' | 'system'
}

interface AutoGenChatProps {
  onSessionStart?: (sessionId: string) => void
  onSessionEnd?: (sessionId: string) => void
  onMessageReceived?: (message: AutoGenMessage) => void
  className?: string
}

const AVAILABLE_AGENT_TYPES = [
  { id: 'user_proxy', name: 'ユーザープロキシ', description: 'ユーザーの代理として動作' },
  { id: 'assistant', name: 'アシスタント', description: '汎用的なアシスタントエージェント' },
  { id: 'code_executor', name: 'コード実行者', description: 'コードの実行と検証を担当' },
  { id: 'reviewer', name: 'レビュアー', description: '成果物のレビューと改善提案' },
  { id: 'planner', name: 'プランナー', description: 'タスクの計画と分解を担当' },
  { id: 'researcher', name: 'リサーチャー', description: '情報収集と調査を担当' }
]

export function AutoGenChat({ 
  onSessionStart, 
  onSessionEnd, 
  onMessageReceived, 
  className = '' 
}: AutoGenChatProps) {
  // セッション管理
  const [currentSession, setCurrentSession] = useState<AutoGenSession | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isExecutingTask, setIsExecutingTask] = useState(false)
  
  // エージェント設定
  const [selectedAgentTypes, setSelectedAgentTypes] = useState<string[]>(['user_proxy', 'assistant'])
  const [taskDescription, setTaskDescription] = useState('')
  const [currentMessage, setCurrentMessage] = useState('')
  
  // サーバー状態
  const [serverStatus, setServerStatus] = useState<{
    isHealthy: boolean
    autoGenStatus: string
    lastCheck: Date | null
  }>({
    isHealthy: false,
    autoGenStatus: 'unknown',
    lastCheck: null
  })
  
  // 利用可能なエージェント
  const [availableAgents, setAvailableAgents] = useState<any[]>([])

  // サーバーヘルスチェック
  const checkServerHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/autogen?action=health')
      const data = await response.json()
      
      setServerStatus({
        isHealthy: data.success,
        autoGenStatus: data.data?.autoGenStatus || 'unknown',
        lastCheck: new Date()
      })
      
      if (!data.success) {
        toast.error('AutoGenサーバーに接続できません')
      }
    } catch (error) {
      console.error('Health check failed:', error)
      setServerStatus({
        isHealthy: false,
        autoGenStatus: 'error',
        lastCheck: new Date()
      })
    }
  }, [])

  // 利用可能なエージェントを取得
  const fetchAvailableAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/autogen?action=agents')
      const data = await response.json()
      
      if (data.success) {
        setAvailableAgents(data.data?.agents || [])
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    }
  }, [])

  // 初期化
  useEffect(() => {
    checkServerHealth()
    fetchAvailableAgents()
    
    // 定期的なヘルスチェック
    const interval = setInterval(checkServerHealth, 30000)
    return () => clearInterval(interval)
  }, [checkServerHealth, fetchAvailableAgents])

  // セッション作成
  const createSession = async () => {
    if (!taskDescription.trim()) {
      toast.error('タスクの説明を入力してください')
      return
    }

    if (selectedAgentTypes.length === 0) {
      toast.error('少なくとも1つのエージェントタイプを選択してください')
      return
    }

    setIsCreatingSession(true)
    
    try {
      const sessionId = `session_${Date.now()}`
      
      const response = await fetch('/api/autogen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_team',
          sessionId,
          agentTypes: selectedAgentTypes,
          task: taskDescription
        })
      })

      const data = await response.json()

      if (data.success) {
        const newSession: AutoGenSession = {
          sessionId,
          status: 'idle',
          agents: selectedAgentTypes.map((type, index) => ({
            id: `agent_${index}`,
            name: AVAILABLE_AGENT_TYPES.find(a => a.id === type)?.name || type,
            type,
            role: AVAILABLE_AGENT_TYPES.find(a => a.id === type)?.description || '',
            status: 'idle'
          })),
          messages: [],
          createdAt: new Date(),
          lastActivity: new Date()
        }

        setCurrentSession(newSession)
        onSessionStart?.(sessionId)
        toast.success('AutoGenチームが作成されました')
      } else {
        throw new Error(data.error || 'セッション作成に失敗しました')
      }
    } catch (error) {
      console.error('Session creation failed:', error)
      toast.error(error instanceof Error ? error.message : 'セッション作成に失敗しました')
    } finally {
      setIsCreatingSession(false)
    }
  }

  // タスク実行
  const executeTask = async () => {
    if (!currentSession || !currentMessage.trim()) {
      return
    }

    setIsExecutingTask(true)

    try {
      const response = await fetch('/api/autogen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_task',
          sessionId: currentSession.sessionId,
          message: currentMessage
        })
      })

      const data = await response.json()

      if (data.success) {
        // メッセージを追加
        const newMessage: AutoGenMessage = {
          id: `msg_${Date.now()}`,
          sender: 'user',
          recipient: 'team',
          content: currentMessage,
          timestamp: new Date(),
          type: 'user'
        }

        setCurrentSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, newMessage],
          status: 'running',
          lastActivity: new Date()
        } : null)

        setCurrentMessage('')
        onMessageReceived?.(newMessage)

        // レスポンスメッセージがある場合は追加
        if (data.data?.response) {
          const responseMessage: AutoGenMessage = {
            id: `msg_${Date.now() + 1}`,
            sender: 'system',
            recipient: 'user',
            content: data.data.response,
            timestamp: new Date(),
            type: 'system'
          }

          setCurrentSession(prev => prev ? {
            ...prev,
            messages: [...prev.messages, responseMessage]
          } : null)

          onMessageReceived?.(responseMessage)
        }

        toast.success('タスクが実行されました')
      } else {
        throw new Error(data.error || 'タスク実行に失敗しました')
      }
    } catch (error) {
      console.error('Task execution failed:', error)
      toast.error(error instanceof Error ? error.message : 'タスク実行に失敗しました')
    } finally {
      setIsExecutingTask(false)
    }
  }

  // セッション終了
  const closeSession = async () => {
    if (!currentSession) return

    try {
      const response = await fetch('/api/autogen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close_session',
          sessionId: currentSession.sessionId
        })
      })

      const data = await response.json()

      if (data.success) {
        onSessionEnd?.(currentSession.sessionId)
        setCurrentSession(null)
        toast.success('セッションが終了されました')
      } else {
        throw new Error(data.error || 'セッション終了に失敗しました')
      }
    } catch (error) {
      console.error('Session close failed:', error)
      toast.error(error instanceof Error ? error.message : 'セッション終了に失敗しました')
    }
  }

  // エージェントタイプの選択/解除
  const toggleAgentType = (agentType: string) => {
    setSelectedAgentTypes(prev => 
      prev.includes(agentType)
        ? prev.filter(type => type !== agentType)
        : [...prev, agentType]
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6" />
          <h2 className="text-2xl font-bold">AutoGen統合</h2>
          <Badge variant={serverStatus.isHealthy ? 'default' : 'destructive'}>
            {serverStatus.isHealthy ? '接続中' : '切断'}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkServerHealth}
            disabled={isCreatingSession}
          >
            <RefreshCw className="h-4 w-4" />
            更新
          </Button>
          
          {currentSession && (
            <Button
              variant="destructive"
              size="sm"
              onClick={closeSession}
            >
              <Square className="h-4 w-4" />
              セッション終了
            </Button>
          )}
        </div>
      </div>

      {/* サーバー状態アラート */}
      {!serverStatus.isHealthy && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            AutoGenサーバーに接続できません。サーバーが起動していることを確認してください。
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="session" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="session">セッション</TabsTrigger>
          <TabsTrigger value="agents">エージェント</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        {/* セッション管理 */}
        <TabsContent value="session" className="space-y-4">
          {!currentSession ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  新しいAutoGenセッション
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="task">タスクの説明</Label>
                  <Textarea
                    id="task"
                    placeholder="AutoGenチームに実行してもらいたいタスクを詳しく説明してください..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>エージェントタイプ</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_AGENT_TYPES.map((agentType) => (
                      <div
                        key={agentType.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAgentTypes.includes(agentType.id)
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleAgentType(agentType.id)}
                      >
                        <div className="font-medium">{agentType.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agentType.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={createSession}
                  disabled={isCreatingSession || !serverStatus.isHealthy}
                  className="w-full"
                >
                  {isCreatingSession ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      セッション作成中...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      セッション開始
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* セッション情報 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      アクティブセッション
                    </div>
                    <Badge variant="outline">
                      {currentSession.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">セッションID:</span>
                      <br />
                      <code className="text-xs">{currentSession.sessionId}</code>
                    </div>
                    <div>
                      <span className="font-medium">エージェント数:</span>
                      <br />
                      {currentSession.agents.length}個
                    </div>
                    <div>
                      <span className="font-medium">作成日時:</span>
                      <br />
                      {currentSession.createdAt.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">最終活動:</span>
                      <br />
                      {currentSession.lastActivity.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* チャットエリア */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    チャット
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-64 w-full border rounded-lg p-4">
                    {currentSession.messages.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        メッセージがありません
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentSession.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-primary text-primary-foreground ml-8'
                                : 'bg-muted mr-8'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">
                                {message.sender}
                              </span>
                              <span className="text-xs opacity-70">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-sm">{message.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      placeholder="メッセージを入力..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          executeTask()
                        }
                      }}
                    />
                    <Button
                      onClick={executeTask}
                      disabled={isExecutingTask || !currentMessage.trim()}
                    >
                      {isExecutingTask ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* エージェント管理 */}
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>エージェント状態</CardTitle>
            </CardHeader>
            <CardContent>
              {currentSession ? (
                <div className="space-y-3">
                  {currentSession.agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {agent.role}
                        </div>
                      </div>
                      <Badge variant={
                        agent.status === 'active' ? 'default' :
                        agent.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {agent.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  アクティブなセッションがありません
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 設定 */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AutoGen設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">サーバー状態:</span>
                  <br />
                  <Badge variant={serverStatus.isHealthy ? 'default' : 'destructive'}>
                    {serverStatus.autoGenStatus}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">最終チェック:</span>
                  <br />
                  {serverStatus.lastCheck?.toLocaleTimeString() || '未確認'}
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">利用可能なエージェントタイプ</h4>
                <div className="space-y-2">
                  {AVAILABLE_AGENT_TYPES.map((agentType) => (
                    <div key={agentType.id} className="text-sm">
                      <span className="font-medium">{agentType.name}:</span> {agentType.description}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
