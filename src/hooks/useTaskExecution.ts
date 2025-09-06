import { useState, useCallback, useRef, useEffect } from 'react'
import { TaskExecutionInfo } from '@/components/chat/TaskExecutionDisplay'
import { TaskDescriptionService } from '@/services/agent/task-description-service'

interface UseTaskExecutionReturn {
  activeTasks: TaskExecutionInfo[]
  addTask: (task: Omit<TaskExecutionInfo, 'id' | 'startTime'>) => string
  updateTask: (id: string, updates: Partial<TaskExecutionInfo>) => void
  removeTask: (id: string) => void
  clearCompletedTasks: () => void
  getTask: (id: string) => TaskExecutionInfo | undefined
  isTaskActive: (id: string) => boolean
}

export const useTaskExecution = (): UseTaskExecutionReturn => {
  const [activeTasks, setActiveTasks] = useState<TaskExecutionInfo[]>([])
  const taskRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const taskDescriptionService = useRef<TaskDescriptionService>(new TaskDescriptionService())

  // タスクを追加
  const addTask = useCallback(async (task: Omit<TaskExecutionInfo, 'id' | 'startTime'>) => {
    // Chat Response Generationタスクを除外
    if (task.title && task.title.includes('Chat Response Generation')) {
      return `excluded_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTask: TaskExecutionInfo = {
      ...task,
      id,
      startTime: new Date()
    }

    setActiveTasks(prev => [...prev, newTask])

    // タスク説明の生成（非同期で実行）
    try {
      await taskDescriptionService.current.initialize()
      const description = await taskDescriptionService.current.generateFullTaskDescription(newTask)
      
      // タスクを更新して生成された説明を反映
      setActiveTasks(prev => prev.map(t => 
        t.id === id ? { ...t, title: description.title, description: description.description } : t
      ))
    } catch (error) {
      console.warn('Failed to generate task description:', error)
      // エラーが発生してもタスクは正常に動作する
    }

    // 完了したタスクを自動的に削除するタイマーを設定
    if (task.status === 'completed' || task.status === 'error') {
      const timeout = setTimeout(() => {
        removeTask(id)
      }, 10000) // 10秒後に自動削除

      taskRefs.current.set(id, timeout)
    }

    return id
  }, [])

  // タスクを更新
  const updateTask = useCallback((id: string, updates: Partial<TaskExecutionInfo>) => {
    setActiveTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ))

    // タスクが完了した場合、自動削除タイマーを設定
    if (updates.status === 'completed' || updates.status === 'error') {
      // 既存のタイマーをクリア
      const existingTimeout = taskRefs.current.get(id)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // 新しいタイマーを設定
      const timeout = setTimeout(() => {
        removeTask(id)
      }, 10000) // 10秒後に自動削除

      taskRefs.current.set(id, timeout)
    }
  }, [])

  // タスクを削除
  const removeTask = useCallback((id: string) => {
    setActiveTasks(prev => prev.filter(task => task.id !== id))
    
    // タイマーをクリア
    const timeout = taskRefs.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      taskRefs.current.delete(id)
    }
  }, [])

  // 完了したタスクをクリア
  const clearCompletedTasks = useCallback(() => {
    setActiveTasks(prev => prev.filter(task => 
      (task.status !== 'completed' && task.status !== 'error') ||
      (task.title && task.title.includes('Chat Response Generation'))
    ))
  }, [])

  // タスクを取得
  const getTask = useCallback((id: string) => {
    return activeTasks.find(task => task.id === id)
  }, [activeTasks])

  // タスクがアクティブかチェック
  const isTaskActive = useCallback((id: string) => {
    return activeTasks.some(task => task.id === id && 
      (task.status === 'pending' || task.status === 'running'))
  }, [activeTasks])

  // コンポーネントのアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      taskRefs.current.forEach(timeout => clearTimeout(timeout))
      taskRefs.current.clear()
    }
  }, [])

  return {
    activeTasks,
    addTask,
    updateTask,
    removeTask,
    clearCompletedTasks,
    getTask,
    isTaskActive
  }
}
