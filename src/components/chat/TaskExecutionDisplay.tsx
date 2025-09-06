import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CircleSpinner } from '@/components/ui/circle-spinner'
import { ShimmerText } from '@/components/ui/shimmer-text'
import { TaskDescriptionService, TaskDescription } from '@/services/agent/task-description-service'
import { 
  Zap, 
  Brain, 
  Code, 
  Search, 
  Database,
  Cpu,
  Network,
  Settings,
  Lightbulb,
  Target,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { MaterialFileIcon } from '@/components/ui/material-file-icon'

export interface TaskExecutionInfo {
  id: string
  taskType: 'analysis' | 'generation' | 'processing' | 'search' | 'computation' | 'optimization' | 'learning' | 'custom'
  title: string
  description: string
  progress?: number
  status: 'pending' | 'running' | 'completed' | 'error'
  startTime: Date
  estimatedDuration?: number
  currentStep?: string
  totalSteps?: number
  currentStepIndex?: number
  metadata?: {
    model?: string
    complexity?: string
    priority?: 'low' | 'medium' | 'high'
    resources?: string[]
  }
}

interface TaskExecutionDisplayProps {
  task: TaskExecutionInfo
  className?: string
}

const getTaskIcon = (taskType: TaskExecutionInfo['taskType']) => {
  switch (taskType) {
    case 'analysis':
      return <Brain className="w-5 h-5" />
    case 'generation':
      return <Zap className="w-5 h-5" />
    case 'processing':
      return <Cpu className="w-5 h-5" />
    case 'search':
      return <Search className="w-5 h-5" />
    case 'computation':
      return <Code className="w-5 h-5" />
    case 'optimization':
      return <Target className="w-5 h-5" />
    case 'learning':
      return <Lightbulb className="w-5 h-5" />
    case 'custom':
      return <Settings className="w-5 h-5" />
    default:
      return <Zap className="w-5 h-5" />
  }
}

const getStatusColor = (status: TaskExecutionInfo['status']) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500'
    case 'running':
      return 'bg-blue-500'
    case 'completed':
      return 'bg-green-500'
    case 'error':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const getStatusText = (status: TaskExecutionInfo['status']) => {
  switch (status) {
    case 'pending':
      return '待機中'
    case 'running':
      return '実行中'
    case 'completed':
      return '完了'
    case 'error':
      return 'エラー'
    default:
      return '不明'
  }
}

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export const TaskExecutionDisplay: React.FC<TaskExecutionDisplayProps> = ({
  task,
  className = ''
}) => {
  const [taskDescription, setTaskDescription] = useState<TaskDescription | null>(null)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const taskDescriptionService = new TaskDescriptionService()

  const elapsedTime = Date.now() - task.startTime.getTime()
  const elapsedSeconds = Math.floor(elapsedTime / 1000)
  const elapsedMinutes = Math.floor(elapsedSeconds / 60)

  // タスク説明の生成
  useEffect(() => {
    const generateDescription = async () => {
      if (taskDescription || isGeneratingDescription) return

      setIsGeneratingDescription(true)
      try {
        await taskDescriptionService.initialize()
        const description = await taskDescriptionService.generateFullTaskDescription(task)
        setTaskDescription(description)
      } catch (error) {
        console.warn('Failed to generate task description:', error)
        // フォールバック: 基本的な説明を使用
        const fallbackDescription = taskDescriptionService.generateTaskDescription(task)
        setTaskDescription({
          title: task.title,
          description: fallbackDescription,
          status: task.status
        })
      } finally {
        setIsGeneratingDescription(false)
      }
    }

    generateDescription()
  }, [task, taskDescription, isGeneratingDescription])

  const formatElapsedTime = () => {
    if (elapsedMinutes > 0) {
      return `${elapsedMinutes}分${elapsedSeconds % 60}秒`
    }
    return `${elapsedSeconds}秒`
  }

  const getEstimatedTimeRemaining = () => {
    if (!task.estimatedDuration || !task.progress || task.progress === 0) {
      return null
    }
    
    const remainingProgress = 100 - task.progress
    const timePerPercent = elapsedTime / task.progress
    const remainingTime = remainingProgress * timePerPercent
    
    const remainingMinutes = Math.floor(remainingTime / 60000)
    const remainingSeconds = Math.floor((remainingTime % 60000) / 1000)
    
    if (remainingMinutes > 0) {
      return `${remainingMinutes}分${remainingSeconds}秒`
    }
    return `${remainingSeconds}秒`
  }

  return (
    <Card className={`border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* ヘッダー */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {task.status === 'running' ? (
                  <CircleSpinner size="sm" className="text-blue-500" />
                ) : task.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : task.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  getTaskIcon(task.taskType)
                )}
                <ShimmerText className="font-semibold text-lg">
                  {taskDescription?.title || task.title}
                </ShimmerText>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`${getStatusColor(task.status)} text-white border-0`}
              >
                {getStatusText(task.status)}
              </Badge>
              {task.metadata?.priority && (
                <Badge 
                  variant="outline" 
                  className={getPriorityColor(task.metadata.priority)}
                >
                  {task.metadata.priority === 'high' ? '高' : 
                   task.metadata.priority === 'medium' ? '中' : '低'}
                </Badge>
              )}
            </div>
          </div>

          {/* 説明 */}
          <div className="text-sm text-muted-foreground">
            <ShimmerText>
              {taskDescription?.description || task.description}
            </ShimmerText>
          </div>

          {/* 進捗バー */}
          {task.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {task.currentStep && (
                    <ShimmerText>
                      ステップ: {task.currentStep}
                    </ShimmerText>
                  )}
                </span>
                <span className="text-muted-foreground">
                  {task.progress.toFixed(1)}%
                </span>
              </div>
              <Progress value={task.progress} className="h-2" />
              
              {/* ステップ表示 */}
              {task.totalSteps && task.currentStepIndex !== undefined && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    ステップ {task.currentStepIndex + 1} / {task.totalSteps}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 時間情報 */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>経過時間: {formatElapsedTime()}</span>
              {task.estimatedDuration && (
                <span>予想時間: {Math.floor(task.estimatedDuration / 60000)}分</span>
              )}
            </div>
            
            {task.status === 'running' && getEstimatedTimeRemaining() && (
              <span>残り時間: {getEstimatedTimeRemaining()}</span>
            )}
          </div>

          {/* メタデータ */}
          {task.metadata && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {task.metadata.model && (
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  <span>{task.metadata.model}</span>
                </div>
              )}
              {task.metadata.complexity && (
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  <span>{task.metadata.complexity}</span>
                </div>
              )}
              {task.metadata.resources && task.metadata.resources.length > 0 && (
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>{task.metadata.resources.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
