'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Play, Pause, Square, RotateCcw, Code, Search, TestTube, Brain, Settings } from 'lucide-react'
import { AgentWorkflowState, CodeAgentResult } from '../lib/mulmocast/types/agent'

interface AgentMessage {
  id: string
  type: 'user' | 'agent' | 'system' | 'step'
  content: string
  timestamp: Date
  agentType?: 'planning' | 'search' | 'analysis' | 'edit' | 'test'
  result?: CodeAgentResult
  metadata?: any
}

interface AutonomousAgentChatProps {
  onAgentStart?: (task: string) => void
  onAgentStop?: () => void
  onAgentComplete?: (result: any) => void
  theme?: 'light' | 'dark'
}

export function AutonomousAgentChat({ 
  onAgentStart,
  onAgentStop, 
  onAgentComplete,
  theme = 'light' 
}: AutonomousAgentChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [input, setInput] = useState('')
  const [isAgentRunning, setIsAgentRunning] = useState(false)
  const [workflowState, setWorkflowState] = useState<AgentWorkflowState | null>(null)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [agentMode, setAgentMode] = useState<'auto' | 'step-by-step'>('auto')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (message: Omit<AgentMessage, 'id' | 'timestamp'>) => {
    const newMessage: AgentMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    return newMessage
  }

  const startAutonomousAgent = async (task: string) => {
    if (!task.trim()) return

    setIsAgentRunning(true)
    setWorkflowState({
      currentStep: 0,
      totalSteps: 5,
      completed: [],
      pending: ['planning', 'search', 'analysis', 'edit', 'test'],
      failed: [],
      context: {}
    })

    // ユーザーメッセージを追加
    addMessage({
      type: 'user',
      content: task
    })

    // システムメッセージを追加
    addMessage({
      type: 'system',
      content: `🤖 自律エージェントを開始します...\nタスク: ${task}\nモード: ${agentMode === 'auto' ? '自動実行' : 'ステップバイステップ'}`
    })

    onAgentStart?.(task)

    try {
      if (agentMode === 'auto') {
        await runAutonomousWorkflow(task)
      } else {
        await runStepByStepWorkflow(task)
      }
    } catch (error) {
      addMessage({
        type: 'system',
        content: `❌ エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`
      })
    } finally {
      setIsAgentRunning(false)
      setCurrentStep('')
    }
  }

  const runAutonomousWorkflow = async (task: string) => {
    const steps = [
      { name: 'planning', icon: Brain, title: '計画立案', description: 'タスクの分析と実行計画の作成' },
      { name: 'search', icon: Search, title: 'コード検索', description: '関連コードの検索と理解' },
      { name: 'analysis', icon: Code, title: 'コード分析', description: 'コード構造と問題点の分析' },
      { name: 'edit', icon: Settings, title: 'コード編集', description: 'コードの修正と実装' },
      { name: 'test', icon: TestTube, title: 'テスト実行', description: '変更の検証とテスト' }
    ]

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      setCurrentStep(step.name)
      
      // ステップ開始メッセージ
      addMessage({
        type: 'step',
        content: `📋 ${step.title}を開始...`,
        agentType: step.name as any
      })

      // 実際のエージェント実行をシミュレート
      const result = await simulateAgentStep(step.name, task, selectedFiles)
      
      // ステップ完了メッセージ
      addMessage({
        type: 'step',
        content: `✅ ${step.title}が完了しました`,
        agentType: step.name as any,
        result: result
      })

      // ワークフロー状態を更新
      setWorkflowState(prev => prev ? {
        ...prev,
        currentStep: i + 1,
        completed: [...prev.completed, step.name],
        pending: prev.pending.filter(p => p !== step.name)
      } : null)

      // 少し待機（実際の処理感を演出）
      await new Promise(resolve => setTimeout(resolve, 1000))

      // エージェントが停止された場合
      if (!isAgentRunning) {
        break
      }
    }

    // 完了メッセージ
    addMessage({
      type: 'system',
      content: `🎉 自律エージェントがタスクを完了しました！\n実行時間: ${Math.round(Math.random() * 60 + 30)}秒`
    })

    onAgentComplete?.({
      task,
      completed: true,
      steps: steps.length,
      duration: Math.round(Math.random() * 60 + 30)
    })
  }

  const runStepByStepWorkflow = async (task: string) => {
    // ステップバイステップモードの実装
    addMessage({
      type: 'system',
      content: `🔄 ステップバイステップモードで実行します。各ステップで確認を求めます。`
    })
    
    // 実装は省略（ユーザー確認が必要なインタラクティブモード）
  }

  const simulateAgentStep = async (stepName: string, task: string, files: string[]): Promise<CodeAgentResult> => {
    // 実際のエージェント呼び出しをシミュレート
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
    
    const success = Math.random() > 0.1 // 90%の成功率
    
    const mockResults = {
      planning: {
        plan: { steps: ['analyze', 'implement', 'test'], estimatedTime: '30min' },
        searchQuery: `related code for: ${task}`
      },
      search: {
        relevantFiles: files.length > 0 ? files : ['src/main.ts', 'src/utils.ts'],
        matches: Math.floor(Math.random() * 10) + 1
      },
      analysis: {
        issues: Math.floor(Math.random() * 3),
        complexity: 'medium',
        suggestions: ['Add error handling', 'Improve type safety']
      },
      edit: {
        modifiedFiles: files.length > 0 ? files.slice(0, 2) : ['src/main.ts'],
        linesChanged: Math.floor(Math.random() * 50) + 10
      },
      test: {
        passed: success,
        failed: success ? 0 : Math.floor(Math.random() * 3) + 1,
        coverage: Math.floor(Math.random() * 20) + 80
      }
    }

    return {
      success,
      result: mockResults[stepName as keyof typeof mockResults],
      suggestions: success ? [] : ['Try a different approach', 'Check dependencies'],
      nextSteps: success ? ['proceed'] : ['retry', 'analyze_error']
    }
  }

  const stopAgent = () => {
    setIsAgentRunning(false)
    addMessage({
      type: 'system',
      content: '⏸️ エージェントが停止されました。'
    })
    onAgentStop?.()
  }

  const resetAgent = () => {
    setMessages([])
    setWorkflowState(null)
    setCurrentStep('')
    setInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isAgentRunning) {
      startAutonomousAgent(input.trim())
      setInput('')
    }
  }

  const getStepIcon = (stepName: string) => {
    const icons = {
      planning: Brain,
      search: Search,
      analysis: Code,
      edit: Settings,
      test: TestTube
    }
    return icons[stepName as keyof typeof icons] || Brain
  }

  const renderMessage = (message: AgentMessage) => {
    const isUser = message.type === 'user'
    const isStep = message.type === 'step'
    
    return (
      <div key={message.id} className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block max-w-[80%] lg:max-w-[75%] break-words overflow-wrap-anywhere ${
          isUser 
            ? 'bg-blue-500 text-white rounded-lg px-4 py-2' 
            : isStep
            ? 'bg-amber-50 border border-amber-200 rounded-lg px-4 py-2'
            : 'bg-gray-100 rounded-lg px-4 py-2'
        }`}>
          {isStep && message.agentType && (
            <div className="flex items-center gap-2 mb-2">
              {React.createElement(getStepIcon(message.agentType), { size: 16 })}
              <Badge variant="outline" className="text-xs">
                {message.agentType}
              </Badge>
            </div>
          )}
          
          <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.content}</div>
          
          {message.result && (
            <div className="mt-2 text-sm opacity-75 break-words overflow-wrap-anywhere">
              <div>成功: {message.result.success ? '✅' : '❌'}</div>
              {message.result.suggestions && message.result.suggestions.length > 0 && (
                <div>提案: {message.result.suggestions.join(', ')}</div>
              )}
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              自律コードエージェント
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Tabs value={agentMode} onValueChange={(value) => setAgentMode(value as any)} className="w-auto">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="auto" className="text-xs">自動</TabsTrigger>
                  <TabsTrigger value="step-by-step" className="text-xs">ステップ</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {isAgentRunning ? (
                <Button size="sm" variant="outline" onClick={stopAgent}>
                  <Pause className="h-4 w-4 mr-1" />
                  停止
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={resetAgent}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  リセット
                </Button>
              )}
            </div>
          </div>
          
          {workflowState && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>進行状況: {workflowState.currentStep}/{workflowState.totalSteps}</span>
                <span>{Math.round((workflowState.currentStep / workflowState.totalSteps) * 100)}%</span>
              </div>
              <Progress 
                value={(workflowState.currentStep / workflowState.totalSteps) * 100} 
                className="h-2"
              />
              
              {currentStep && (
                <Alert>
                  <div className="flex items-center gap-2">
                    {React.createElement(getStepIcon(currentStep), { size: 16 })}
                    <AlertDescription>
                      実行中: {currentStep === 'planning' ? '計画立案' : 
                               currentStep === 'search' ? 'コード検索' :
                               currentStep === 'analysis' ? 'コード分析' :
                               currentStep === 'edit' ? 'コード編集' :
                               currentStep === 'test' ? 'テスト実行' : currentStep}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </div>
          )}
        </CardHeader>
        
        <Separator />
        
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          <ScrollArea className="flex-1 w-full">
            <div className="space-y-4 pr-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>自律エージェントにタスクを依頼してください</p>
                  <p className="text-sm mt-2">例: "ログイン機能のバグを修正して" "新しいAPIエンドポイントを追加して"</p>
                </div>
              )}
              
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <Separator className="my-4" />
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isAgentRunning ? "エージェント実行中..." : "実行したいタスクを入力してください..."}
              disabled={isAgentRunning}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={!input.trim() || isAgentRunning}
              className="px-6"
            >
              {isAgentRunning ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </form>
          
          {selectedFiles.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-gray-500">対象ファイル:</span>
                {selectedFiles.map(file => (
                  <Badge key={file} variant="secondary" className="text-xs">
                    {file}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
