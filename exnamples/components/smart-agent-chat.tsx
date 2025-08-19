"use client"

import React, { useState, useEffect } from 'react'
import { Brain, Users, Zap, ChevronDown, ChevronRight, Settings, RefreshCw, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react'
import { useSmartAgentChat, SmartChatMessage } from '@/hooks/use-smart-agent-chat'
import { EnhancedChat } from '@/components/ui/enhanced-chat'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SequentialThinkingPanel } from '@/components/sequential-thinking-panel'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface SmartAgentChatProps {
  className?: string
  theme?: 'light' | 'dark'
  onChatSubmit?: (message: string) => void
  onChatResponse?: (response: string) => void
}

export function SmartAgentChat({ 
  className = '', 
  theme = 'dark',
  onChatSubmit,
  onChatResponse 
}: SmartAgentChatProps) {
  // Smart Agent Chat Hook
  const {
    messages,
    sendMessage,
    isProcessing,
    currentTask,
    selectedAgents,
    isThinking,
    currentThinkingStep,
    thinkingProgress,
    error,
    retryLastMessage,
    updateSettings
  } = useSmartAgentChat({
    enableSequentialThinking: true,
    enableAutoAgentSelection: true,
    maxAgents: 3,
    defaultWorkingStyle: 'thorough',
    onAgentSelected: (result) => {
      console.log('🤖 Agent selected:', result)
    },
    onTaskAnalyzed: (intent) => {
      console.log('🧠 Task analyzed:', intent)
    }
  })

  // UI状態
  const [input, setInput] = useState('')
  const [showAgentDetails, setShowAgentDetails] = useState(true)
  const [showThinking, setShowThinking] = useState(true)
  const [workingStyle, setWorkingStyle] = useState<'fast' | 'thorough' | 'creative'>('thorough')

  // 設定変更の反映
  useEffect(() => {
    updateSettings({
      defaultWorkingStyle: workingStyle
    })
  }, [workingStyle, updateSettings])

  // メッセージ送信処理
  const handleSubmit = async (message: string, attachments?: File[]) => {
    if (!message.trim()) return
    
    setInput('')
    onChatSubmit?.(message)
    
    try {
      await sendMessage(message, attachments)
    } catch (err) {
      console.error('Message send error:', err)
    }
  }

  // Enhanced Chat用のメッセージ変換
  const enhancedChatMessages = messages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
    createdAt: msg.timestamp,
    attachments: undefined,
    isStreaming: msg.executionState?.stage === 'executing' && msg.role === 'user'
  }))

  return (
    <div className={cn(
      'flex flex-col h-full max-w-6xl mx-auto',
      theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-black',
      className
    )}>
      {/* ヘッダー: スマートエージェント情報 */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold">Smart Agent Chat</h2>
              <p className="text-sm text-neutral-400">
                Sequential Thinking + 自動エージェント選択
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 作業スタイル選択 */}
            <Select value={workingStyle} onValueChange={(value: any) => setWorkingStyle(value)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">高速</SelectItem>
                <SelectItem value="thorough">徹底</SelectItem>
                <SelectItem value="creative">創作</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 設定 */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8"
              onClick={() => setShowAgentDetails(!showAgentDetails)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* エージェント選択結果表示 */}
      {selectedAgents && showAgentDetails && (
        <Collapsible open={showAgentDetails} onOpenChange={setShowAgentDetails}>
          <div className="flex-shrink-0 p-4 bg-neutral-800 border-b border-neutral-700">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="font-medium">選択されたエージェント</span>
                  <Badge variant="secondary" className="text-xs">
                    {currentTask && `${(currentTask.confidence * 100).toFixed(0)}%`}
                  </Badge>
                </div>
                {showAgentDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="mt-3 space-y-3">
                {/* 主要エージェント */}
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">主要</Badge>
                  <span className="text-sm font-medium">
                    {getAgentDisplayName(selectedAgents.primaryAgent)}
                  </span>
                </div>
                
                {/* 協力エージェント */}
                {selectedAgents.supportingAgents.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">協力</Badge>
                    {selectedAgents.supportingAgents.map((agent, index) => (
                      <span key={index} className="text-sm text-neutral-300">
                        {getAgentDisplayName(agent)}
                        {index < selectedAgents.supportingAgents.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* 実行戦略 */}
                <div className="text-xs text-neutral-400 bg-neutral-700 p-2 rounded">
                  {selectedAgents.reasoning}
                </div>
                
                {/* ワークフロー */}
                {selectedAgents.recommendedWorkflow && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">ワークフロー</Badge>
                    <span className="text-sm">{selectedAgents.recommendedWorkflow}</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      )}

      {/* Sequential Thinking パネル */}
      {(isThinking || currentThinkingStep) && showThinking && (
        <div className="flex-shrink-0">
          <Collapsible open={showThinking} onOpenChange={setShowThinking}>
            <div className="p-4 bg-purple-900/20 border-b border-purple-700/30">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="font-medium">Sequential Thinking</span>
                    <Progress value={thinkingProgress} className="w-20 h-2" />
                    <span className="text-xs text-purple-300">{thinkingProgress.toFixed(0)}%</span>
                  </div>
                  {showThinking ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="mt-3">
                  {/* 現在の思考ステップ表示 */}
                  {currentThinkingStep && (
                    <div className="mb-4 p-3 bg-purple-800/30 rounded-lg border border-purple-600/30">
                      <div className="flex items-start gap-2">
                        <Brain className="w-4 h-4 mt-0.5 text-purple-300" />
                        <div className="flex-1">
                          <p className="text-sm text-purple-100 font-medium">現在の思考:</p>
                          <p className="text-sm text-purple-200 mt-1">{currentThinkingStep}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <SequentialThinkingPanel
                    theme="dark"
                    aiContext={currentThinkingStep}
                    onThoughtGenerated={(thought) => {
                      console.log('💭 SmartAgentChat: Thought generated:', thought)
                    }}
                    onProcessComplete={(process) => {
                      console.log('🧠 SmartAgentChat: Process completed:', process)
                    }}
                    className="bg-transparent border-none p-0"
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      )}

      {/* メインチャットエリア */}
      <div className="flex-1 flex flex-col min-h-0">
        <EnhancedChat
          messages={enhancedChatMessages}
          input={input}
          handleInputChange={setInput}
          handleSubmit={handleSubmit}
          isGenerating={isProcessing}
          placeholder="何をお手伝いしましょうか？（自動でエージェントを選択します）"
          className="flex-1"
        />
      </div>

      {/* ステータスバー */}
      <div className="flex-shrink-0 px-4 py-2 bg-neutral-800 border-t border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-neutral-400">
            {/* 現在のタスク状況 */}
            {currentTask && (
              <div className="flex items-center gap-1">
                <span>タスク:</span>
                <Badge variant="outline" className="text-xs">
                  {getTaskTypeInJapanese(currentTask.taskType)}
                </Badge>
              </div>
            )}
            
            {/* 処理状況 */}
            {isProcessing && (
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>処理中...</span>
              </div>
            )}
            
            {/* エラー状況 */}
            {error && (
              <div className="flex items-center gap-1 text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={retryLastMessage}
                >
                  再試行
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>作業スタイル: {workingStyle === 'fast' ? '高速' : workingStyle === 'thorough' ? '徹底' : '創作'}</span>
            <span>|</span>
            <span>メッセージ: {messages.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * ヘルパー関数
 */
function getAgentDisplayName(agentName: string): string {
  const mapping: Record<string, string> = {
    code_reviewer: 'コードレビューア',
    technical_writer: 'テクニカルライター',
    project_manager: 'プロジェクトマネージャー',
    data_analyst: 'データアナリスト',
    qa_engineer: 'QAエンジニア',
    security_analyst: 'セキュリティアナリスト',
    ui_ux_designer: 'UI/UXデザイナー',
    devops_engineer: 'DevOpsエンジニア',
    mulmocast_agent: 'Mulmocastエージェント',
    video_analyst: '動画アナリスト',
    content_creator: 'コンテンツクリエイター'
  }
  
  return mapping[agentName] || agentName
}

function getTaskTypeInJapanese(taskType: string): string {
  const mapping: Record<string, string> = {
    video_creation: '動画制作',
    code_review: 'コードレビュー',
    code_generation: 'コード生成',
    documentation: 'ドキュメント作成',
    analysis: '分析',
    planning: '計画立案',
    general_chat: '一般対話',
    file_processing: 'ファイル処理',
    web_scraping: 'Web情報取得',
    automation: '自動化'
  }
  
  return mapping[taskType] || 'その他'
}
