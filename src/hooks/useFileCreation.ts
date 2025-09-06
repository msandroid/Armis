import { useState, useCallback, useRef, useEffect } from 'react'
import { FileCreationInfo } from '@/components/ui/file-creation-loader'

interface UseFileCreationReturn {
  activeFileCreations: FileCreationInfo[]
  addFileCreation: (fileInfo: Omit<FileCreationInfo, 'id' | 'startTime'>) => string
  updateFileCreation: (id: string, updates: Partial<FileCreationInfo>) => void
  removeFileCreation: (id: string) => void
  clearCompletedFileCreations: () => void
  getFileCreation: (id: string) => FileCreationInfo | undefined
  isFileCreationActive: (id: string) => boolean
}

export const useFileCreation = (): UseFileCreationReturn => {
  const [activeFileCreations, setActiveFileCreations] = useState<FileCreationInfo[]>([])
  const fileCreationRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // ファイル作成を追加
  const addFileCreation = useCallback((fileInfo: Omit<FileCreationInfo, 'id' | 'startTime'>) => {
    const id = `file_creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newFileCreation: FileCreationInfo = {
      ...fileInfo,
      id,
      startTime: new Date()
    }

    setActiveFileCreations(prev => [...prev, newFileCreation])

    // 完了したファイル作成を自動的に削除するタイマーを設定
    if (fileInfo.status === 'completed' || fileInfo.status === 'error') {
      const timeout = setTimeout(() => {
        removeFileCreation(id)
      }, 8000) // 8秒後に自動削除

      fileCreationRefs.current.set(id, timeout)
    }

    return id
  }, [])

  // ファイル作成を更新
  const updateFileCreation = useCallback((id: string, updates: Partial<FileCreationInfo>) => {
    setActiveFileCreations(prev => prev.map(fileCreation => 
      fileCreation.id === id ? { ...fileCreation, ...updates } : fileCreation
    ))

    // ファイル作成が完了した場合、自動削除タイマーを設定
    if (updates.status === 'completed' || updates.status === 'error') {
      // 既存のタイマーをクリア
      const existingTimeout = fileCreationRefs.current.get(id)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // 新しいタイマーを設定
      const timeout = setTimeout(() => {
        removeFileCreation(id)
      }, 8000) // 8秒後に自動削除

      fileCreationRefs.current.set(id, timeout)
    }
  }, [])

  // ファイル作成を削除
  const removeFileCreation = useCallback((id: string) => {
    setActiveFileCreations(prev => prev.filter(fileCreation => fileCreation.id !== id))
    
    // タイマーをクリア
    const timeout = fileCreationRefs.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      fileCreationRefs.current.delete(id)
    }
  }, [])

  // 完了したファイル作成をクリア
  const clearCompletedFileCreations = useCallback(() => {
    setActiveFileCreations(prev => prev.filter(fileCreation => 
      fileCreation.status !== 'completed' && fileCreation.status !== 'error'
    ))
  }, [])

  // ファイル作成を取得
  const getFileCreation = useCallback((id: string) => {
    return activeFileCreations.find(fileCreation => fileCreation.id === id)
  }, [activeFileCreations])

  // ファイル作成がアクティブかチェック
  const isFileCreationActive = useCallback((id: string) => {
    return activeFileCreations.some(fileCreation => fileCreation.id === id && 
      (fileCreation.status === 'creating' || fileCreation.status === 'processing'))
  }, [activeFileCreations])

  // コンポーネントのアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      fileCreationRefs.current.forEach(timeout => clearTimeout(timeout))
      fileCreationRefs.current.clear()
    }
  }, [])

  return {
    activeFileCreations,
    addFileCreation,
    updateFileCreation,
    removeFileCreation,
    clearCompletedFileCreations,
    getFileCreation,
    isFileCreationActive
  }
}
