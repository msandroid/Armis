/**
 * LangChain Chat Component
 * LangChain統合チャットインターフェース
 */

'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useLangChainChat } from '@/hooks/use-langchain-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  Bot, 
  User, 
  Send, 
  Trash2, 
  RotateCcw, 
  Zap, 
  Brain, 
  Clock,
  Settings,
  Wrench
} from 'lucide-react'

interface LangChainChatProps {
  className?: string
  defaultAgentType?: string
  enableAdvancedFeatures?: boolean
}

export function LangChainChat({ 
  className = '', 
  defaultAgentType = 'default',
  enableAdvancedFeatures = true 
}: LangChainChatProps) {
  // LangChainチャットフック
  const {
    messages,
    isProcessing,
    isStreaming,
    sendMessage,
    sendStreamingMessage,
    sendHybridMessage,
    clearMessages,
    retryLastMessage,
    updateOptions
  } = useLangChainChat({
    defaultAgentType: defaultAgentType as any,
    enableStreaming: false,
    enableIntentAnalysis: true,
    enableHybridMode: true,
    onMessage: (message) => {
      console.log('📨 New message:', message)
    },
    onError: (error) => {
      console.error('❌ Chat error:', error)
    },
    onToolUse: (toolName, toolInput) => {
      console.log('🔧 Tool used:', toolName, toolInput)
    }
  })

  // UI状態
  const [input, setInput] = useState('')
  const [selectedAgentType, setSelectedAgentType] = useState(defaultAgentType)
  const [enableStreaming, setEnableStreaming] = useState(false)
  const [enableHybridMode, setEnableHybridMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // オプション更新
  useEffect(() => {
    updateOptions({
      enableStreaming,
      enableHybridMode
    })
  }, [enableStreaming, enableHybridMode, updateOptions])

  /**
   * メッセージ送信処理
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const messageContent = input.trim()
    setInput('')

    try {
      if (enableHybridMode) {
        await sendHybridMessage(messageContent)
      } else if (enableStreaming) {
        await sendStreamingMessage(messageContent, selectedAgentType as any)
      } else {
        await sendMessage(messageContent, selectedAgentType as any)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  /**
   * エージェントタイプの表示名
   */
  const getAgentDisplayName = (agentType: string) => {
    const names = {
      default: 'デフォルト',
      multimedia: 'マルチメディア',
      code: 'コード',
      data: 'データ',
      hybrid: 'ハイブリッド'
    }
    return names[agentType as keyof typeof names] || agentType
  }

  /**
   * メッセージアイコン
   */
  const getMessageIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'assistant':
        return <Bot className="h-4 w-4" />
      case 'system':
        return <Settings className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  /**
   * 実行戦略のバッジ色
   */
  const getStrategyBadgeVariant = (strategy?: string) => {
    switch (strategy) {
      case 'langchain':
        return 'default'
      case 'smart-agents':
        return 'secondary'
      case 'hybrid':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* ヘッダー */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              LangChain Chat
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearMessages}
                disabled={messages.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={retryLastMessage}
                disabled={messages.length === 0 || isProcessing}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* 設定パネル */}
        {showSettings && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* エージェントタイプ選択 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-type">エージェントタイプ</Label>
                  <Select
                    value={selectedAgentType}
                    onValueChange={setSelectedAgentType}
                    disabled={enableHybridMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">デフォルト</SelectItem>
                      <SelectItem value="multimedia">マルチメディア</SelectItem>
                      <SelectItem value="code">コード</SelectItem>
                      <SelectItem value="data">データ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 機能設定 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="streaming">ストリーミング</Label>
                    <Switch
                      id="streaming"
                      checked={enableStreaming}
                      onCheckedChange={setEnableStreaming}
                      disabled={enableHybridMode}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="hybrid">ハイブリッドモード</Label>
                    <Switch
                      id="hybrid"
                      checked={enableHybridMode}
                      onCheckedChange={setEnableHybridMode}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* メッセージ表示エリア */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full p-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>LangChainエージェントとチャットを開始してください</p>
                  <p className="text-sm mt-2">
                    マルチメディア、コード、データ分析など様々なタスクに対応
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3 p-3 rounded-lg',
                      message.role === 'user'
                        ? 'bg-primary/10 ml-12'
                        : message.role === 'system'
                        ? 'bg-muted'
                        : 'bg-muted/50 mr-12'
                    )}
                  >
                    {/* アイコン */}
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.role === 'system'
                        ? 'bg-muted-foreground text-background'
                        : 'bg-secondary text-secondary-foreground'
                    )}>
                      {getMessageIcon(message.role)}
                    </div>

                    {/* コンテンツ */}
                    <div className="flex-1 space-y-2">
                      {/* メッセージ本文 */}
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* メタデータ */}
                      {message.role === 'assistant' && (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {message.agentType && (
                            <Badge variant="outline">
                              {getAgentDisplayName(message.agentType)}
                            </Badge>
                          )}
                          {message.executionStrategy && (
                            <Badge variant={getStrategyBadgeVariant(message.executionStrategy)}>
                              {message.executionStrategy}
                            </Badge>
                          )}
                          {message.toolsUsed && message.toolsUsed.length > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              {message.toolsUsed.length}
                            </Badge>
                          )}
                          {message.executionTime && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {message.executionTime}ms
                            </Badge>
                          )}
                          {message.isStreaming && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              ストリーミング中...
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* ツール使用詳細 */}
                      {message.toolsUsed && message.toolsUsed.length > 0 && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer hover:text-foreground">
                            使用ツール詳細
                          </summary>
                          <div className="mt-1 pl-2 border-l-2 border-muted">
                            {message.toolsUsed.map((tool, index) => (
                              <div key={index}>{tool}</div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>

        <Separator />

        {/* 入力エリア */}
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                enableHybridMode
                  ? "ハイブリッドモードでメッセージを入力..."
                  : enableStreaming
                  ? "ストリーミングメッセージを入力..."
                  : "メッセージを入力..."
              }
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="px-3"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {/* ステータス表示 */}
          {isProcessing && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
              <div className="animate-pulse h-2 w-2 bg-current rounded-full" />
              {isStreaming ? 'ストリーミング中...' : '処理中...'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
