/**
 * Sequential Thinking Panel Component for Armis
 * VSCode風の思考プロセス可視化パネル
 */

"use client"

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  Brain, 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Trash2, 
  GitBranch, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  TreePine,
  Lightbulb,
  Target,
  Zap
} from 'lucide-react'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useSequentialThinking } from '@/hooks/use-sequential-thinking'
import { ThinkingProcess, ThinkingStep } from '@/lib/mcp-client'

interface SequentialThinkingPanelProps {
  className?: string
  onThoughtGenerated?: (thought: string) => void
  onProcessComplete?: (process: ThinkingProcess) => void
  aiContext?: string
  theme?: 'light' | 'dark'
}

export function SequentialThinkingPanel({
  className = '',
  onThoughtGenerated,
  onProcessComplete,
  aiContext = '',
  theme = 'dark'
}: SequentialThinkingPanelProps) {
  const [newProcessTitle, setNewProcessTitle] = useState('')
  const [newThought, setNewThought] = useState('')
  const [expandedProcesses, setExpandedProcesses] = useState<Set<string>>(new Set())
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null)
  const [isAddingThought, setIsAddingThought] = useState(false)

  const {
    currentProcess,
    allProcesses,
    isConnected,
    isProcessing,
    error,
    startThinking,
    addThinkingStep,
    pauseCurrentProcess,
    resumeProcess,
    deleteProcess,
    generateThoughtFromAI,
    analyzeThinkingPattern
  } = useSequentialThinking({
    autoConnect: true,
    onProcessComplete: (process) => {
      onProcessComplete?.(process)
      // 完了時に自動展開
      setExpandedProcesses(prev => new Set([...prev, process.id]))
    },
    onStepAdded: (step) => {
      onThoughtGenerated?.(step.thought)
    }
  })

  const isDark = theme === 'dark'
  const bgColor = isDark ? 'bg-zinc-900' : 'bg-white'
  const cardBg = isDark ? 'bg-zinc-800' : 'bg-gray-50'
  const textColor = isDark ? 'text-zinc-100' : 'text-gray-900'
  const textMuted = isDark ? 'text-zinc-400' : 'text-gray-600'
  const borderColor = isDark ? 'border-zinc-700' : 'border-gray-200'

  // プロセス展開/縮小の切り替え
  const toggleProcessExpansion = (processId: string) => {
    setExpandedProcesses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(processId)) {
        newSet.delete(processId)
      } else {
        newSet.add(processId)
      }
      return newSet
    })
  }

  // 新しい思考プロセスを開始
  const handleStartNewProcess = async () => {
    if (!newProcessTitle.trim()) return

    const processId = await startThinking(newProcessTitle, aiContext)
    if (processId) {
      setNewProcessTitle('')
      setExpandedProcesses(prev => new Set([...prev, processId]))
      setSelectedProcessId(processId)
    }
  }

  // AI思考ステップ生成
  const handleGenerateAIThought = async () => {
    if (!currentProcess) return

    const previousThoughts = currentProcess.steps.map(step => step.thought)
    const thought = await generateThoughtFromAI(
      aiContext || currentProcess.context || currentProcess.title,
      previousThoughts
    )

    if (thought) {
      setNewThought(thought)
    }
  }

  // 手動思考ステップ追加
  const handleAddThought = async () => {
    if (!currentProcess || !newThought.trim()) return

    setIsAddingThought(true)
    const thoughtNumber = currentProcess.steps.length + 1
    const totalThoughts = Math.max(5, thoughtNumber + 2) // 動的に調整

    await addThinkingStep(newThought, thoughtNumber, totalThoughts)
    setNewThought('')
    setIsAddingThought(false)
  }

  // 思考ステップのバッジカラー取得
  const getStepBadgeColor = (step: ThinkingStep) => {
    if (step.isRevision) return 'bg-yellow-600'
    if (step.branchFromThought) return 'bg-purple-600'
    if (!step.nextThoughtNeeded) return 'bg-green-600'
    return 'bg-blue-600'
  }

  // 思考ステップのアイコン取得
  const getStepIcon = (step: ThinkingStep) => {
    if (step.isRevision) return <RotateCcw className="h-3 w-3" />
    if (step.branchFromThought) return <GitBranch className="h-3 w-3" />
    if (!step.nextThoughtNeeded) return <CheckCircle className="h-3 w-3" />
    return <Lightbulb className="h-3 w-3" />
  }

  return (
    <Card className={`${className} ${bgColor} ${textColor} ${borderColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>Sequential Thinking</span>
          {isConnected ? (
            <Badge variant="outline" className="text-green-400 border-green-400">
              接続済み
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-400 border-red-400">
              未接続
            </Badge>
          )}
        </CardTitle>
        
        {error && (
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 新しいプロセス開始 */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="思考プロセスのタイトル"
              value={newProcessTitle}
              onChange={(e) => setNewProcessTitle(e.target.value)}
              className={`flex-1 ${cardBg} ${textColor}`}
              disabled={isProcessing}
            />
            <Button
              onClick={handleStartNewProcess}
              disabled={!newProcessTitle.trim() || isProcessing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-4 w-4 mr-1" />
              開始
            </Button>
          </div>
        </div>

        {/* 現在のプロセス制御 */}
        {currentProcess && (
          <div className={`p-3 rounded-lg ${cardBg} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge 
                  className={`${
                    currentProcess.status === 'active' ? 'bg-green-600' :
                    currentProcess.status === 'paused' ? 'bg-yellow-600' :
                    'bg-gray-600'
                  }`}
                >
                  {currentProcess.status === 'active' ? '実行中' :
                   currentProcess.status === 'paused' ? '一時停止' :
                   '完了'}
                </Badge>
                <span className="font-medium">{currentProcess.title}</span>
              </div>
              
              <div className="flex space-x-1">
                {currentProcess.status === 'active' && (
                  <Button
                    onClick={pauseCurrentProcess}
                    size="sm"
                    variant="outline"
                    disabled={isProcessing}
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  onClick={() => deleteProcess(currentProcess.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-400 hover:text-red-300"
                  disabled={isProcessing}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* プロセス統計 */}
            {(() => {
              const stats = analyzeThinkingPattern(currentProcess)
              return (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <Target className="h-3 w-3 text-blue-400" />
                    <span>{stats.totalSteps} ステップ</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span>{stats.completedSteps} 完了</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <GitBranch className="h-3 w-3 text-purple-400" />
                    <span>{stats.branchPoints} 分岐</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RotateCcw className="h-3 w-3 text-yellow-400" />
                    <span>{stats.revisions} 修正</span>
                  </div>
                </div>
              )
            })()}

            {/* 新しい思考ステップ追加 */}
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Button
                  onClick={handleGenerateAIThought}
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  AI思考生成
                </Button>
              </div>
              
              <Textarea
                placeholder="次の思考ステップを入力..."
                value={newThought}
                onChange={(e) => setNewThought(e.target.value)}
                className={`${cardBg} ${textColor} min-h-[80px]`}
                disabled={isProcessing}
              />
              
              <Button
                onClick={handleAddThought}
                disabled={!newThought.trim() || isProcessing || isAddingThought}
                size="sm"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-3 w-3 mr-1" />
                思考ステップ追加
              </Button>
            </div>
          </div>
        )}

        {/* プロセス履歴 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center space-x-1">
            <TreePine className="h-4 w-4" />
            <span>思考プロセス履歴</span>
          </h4>
          
          {allProcesses.length === 0 ? (
            <div className={`text-center py-6 ${textMuted}`}>
              <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>まだ思考プロセスがありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allProcesses.map((process) => (
                <Collapsible 
                  key={process.id}
                  open={expandedProcesses.has(process.id)}
                  onOpenChange={() => toggleProcessExpansion(process.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start p-2 h-auto ${cardBg} hover:bg-opacity-80`}
                    >
                      <div className="flex items-center space-x-2 flex-1">
                        {expandedProcesses.has(process.id) ? 
                          <ChevronDown className="h-3 w-3" /> : 
                          <ChevronRight className="h-3 w-3" />
                        }
                        <div className="flex items-center space-x-2 flex-1">
                          <Badge 
                            size="sm"
                            className={`${
                              process.status === 'active' ? 'bg-green-600' :
                              process.status === 'paused' ? 'bg-yellow-600' :
                              'bg-gray-600'
                            }`}
                          >
                            {process.steps.length}
                          </Badge>
                          <span className="text-left truncate">{process.title}</span>
                        </div>
                        <Clock className="h-3 w-3 opacity-50" />
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="pt-2">
                    <div className="ml-4 space-y-2">
                      {process.steps.map((step, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded ${cardBg} border-l-2 ${
                            step.isRevision ? 'border-yellow-400' :
                            step.branchFromThought ? 'border-purple-400' :
                            !step.nextThoughtNeeded ? 'border-green-400' :
                            'border-blue-400'
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <Badge 
                              size="sm"
                              className={`${getStepBadgeColor(step)} flex items-center space-x-1`}
                            >
                              {getStepIcon(step)}
                              <span>{step.thoughtNumber}</span>
                            </Badge>
                            <div className="flex-1">
                              <p className="text-sm">{step.thought}</p>
                              {step.branchId && (
                                <p className="text-xs text-purple-400 mt-1">
                                  分岐: {step.branchId}
                                </p>
                              )}
                              {step.isRevision && step.revisesThought && (
                                <p className="text-xs text-yellow-400 mt-1">
                                  ステップ {step.revisesThought} の修正
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {process.status !== 'completed' && process.steps.length > 0 && (
                        <div className="flex space-x-2 mt-2">
                          <Button
                            onClick={() => resumeProcess(process.id)}
                            size="sm"
                            variant="outline"
                            disabled={isProcessing}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            再開
                          </Button>
                          <Button
                            onClick={() => deleteProcess(process.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-400 hover:text-red-300"
                            disabled={isProcessing}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            削除
                          </Button>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
