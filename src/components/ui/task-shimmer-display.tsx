import React from 'react'
import { TaskExecutionInfo } from '@/components/chat/TaskExecutionDisplay'
import { ShimmerText } from './shimmer-text'

interface TaskShimmerDisplayProps {
  task: TaskExecutionInfo
  className?: string
}

export const TaskShimmerDisplay: React.FC<TaskShimmerDisplayProps> = ({
  task,
  className = ''
}) => {
  // タスクが実行中でない場合は表示しない
  if (task.status !== 'running' && task.status !== 'pending') {
    return null
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <ShimmerText className="text-sm font-medium">
            {task.title}
          </ShimmerText>
        </div>
      </div>
    </div>
  )
}
