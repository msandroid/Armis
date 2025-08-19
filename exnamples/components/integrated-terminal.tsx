"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scrollarea"
import { 
  Terminal as TerminalIcon,
  X,
  Plus,
  Settings,
  Copy,
  Trash2,
  Play,
  Square,
  RefreshCw,
  ChevronRight,
  Folder,
  File
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { FileOperationHeuristics } from "@/lib/file-operation-heuristics"
import { chatEditingService } from "@/lib/chat-editing-service"

interface TerminalSession {
  id: string
  name: string
  cwd: string
  history: TerminalEntry[]
  isActive: boolean
  status: 'idle' | 'running' | 'error'
  pid?: number
}

interface TerminalEntry {
  id: string
  type: 'command' | 'output' | 'error' | 'info'
  content: string
  timestamp: Date
  exitCode?: number
  fileOperations?: Array<{
    type: string
    path: string
    detected: boolean
  }>
}

interface IntegratedTerminalProps {
  className?: string
  onFileOperation?: (operation: any) => void
  onDirectoryChange?: (path: string) => void
  initialDirectory?: string
  enableFileDetection?: boolean
}

export function IntegratedTerminal({
  className = "",
  onFileOperation,
  onDirectoryChange,
  initialDirectory = "/",
  enableFileDetection = true
}: IntegratedTerminalProps) {
  const [sessions, setSessions] = useState<TerminalSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isExecuting, setIsExecuting] = useState(false)
  const [settings, setSettings] = useState({
    fontSize: 14,
    fontFamily: "'JetBrains Mono', monospace",
    theme: 'dark',
    autoScroll: true,
    showTimestamps: false,
    detectFileOperations: enableFileDetection
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 初期セッションを作成
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession("Terminal 1", initialDirectory)
    }
  }, [initialDirectory])

  // アクティブセッションを取得
  const activeSession = sessions.find(s => s.id === activeSessionId)

  // 新しいターミナルセッションを作成
  const createNewSession = useCallback((name?: string, directory?: string) => {
    const sessionId = `terminal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newSession: TerminalSession = {
      id: sessionId,
      name: name || `Terminal ${sessions.length + 1}`,
      cwd: directory || initialDirectory,
      history: [{
        id: `entry-${Date.now()}`,
        type: 'info',
        content: `Welcome to Armis Terminal - ${directory || initialDirectory}`,
        timestamp: new Date()
      }],
      isActive: true,
      status: 'idle'
    }

    setSessions(prev => {
      const updated = prev.map(s => ({ ...s, isActive: false }))
      return [...updated, newSession]
    })
    setActiveSessionId(sessionId)
  }, [sessions.length, initialDirectory])

  // セッションを閉じる
  const closeSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId)
      if (filtered.length === 0) {
        // 最後のセッションを閉じる場合、新しいセッションを作成
        setTimeout(() => createNewSession(), 0)
      } else if (activeSessionId === sessionId) {
        // アクティブセッションを閉じる場合、別のセッションをアクティブに
        const newActive = filtered[filtered.length - 1]
        setActiveSessionId(newActive.id)
        newActive.isActive = true
      }
      return filtered
    })
  }, [activeSessionId, createNewSession])

  // コマンドを実行
  const executeCommand = useCallback(async (command: string) => {
    if (!activeSession || !command.trim()) return

    setIsExecuting(true)
    
    // コマンドをヒストリーに追加
    const commandEntry: TerminalEntry = {
      id: `entry-${Date.now()}`,
      type: 'command',
      content: `${activeSession.cwd}$ ${command}`,
      timestamp: new Date()
    }

    // コマンド履歴を更新
    setCommandHistory(prev => {
      const newHistory = [...prev, command]
      return newHistory.slice(-100) // 最新100件のみ保持
    })

    try {
      // ファイル操作の検出
      let detectedOperations: any[] = []
      if (settings.detectFileOperations) {
        const detection = FileOperationHeuristics.detectFileOperations(command)
        if (detection.isFileOperation) {
          detectedOperations = detection.operations.map(op => ({
            type: op.type,
            path: op.filePath,
            detected: true
          }))
        }
      }

      // コマンドを実際に実行（モック実装）
      const result = await mockExecuteCommand(command, activeSession.cwd)
      
      // 結果をターミナルに追加
      const outputEntry: TerminalEntry = {
        id: `entry-${Date.now() + 1}`,
        type: result.success ? 'output' : 'error',
        content: result.output,
        timestamp: new Date(),
        exitCode: result.exitCode,
        fileOperations: detectedOperations
      }

      // セッションを更新
      setSessions(prev => prev.map(session => {
        if (session.id === activeSession.id) {
          const updatedHistory = [...session.history, commandEntry, outputEntry]
          
          // ディレクトリ変更の検出
          let newCwd = session.cwd
          if (command.startsWith('cd ') && result.success) {
            const targetDir = command.substring(3).trim()
            newCwd = resolvePath(session.cwd, targetDir)
            onDirectoryChange?.(newCwd)
          }

          return {
            ...session,
            history: updatedHistory,
            cwd: newCwd,
            status: result.success ? 'idle' : 'error'
          }
        }
        return session
      }))

      // ファイル操作が検出された場合、コールバックを呼び出し
      if (detectedOperations.length > 0) {
        detectedOperations.forEach(op => onFileOperation?.(op))
        
        // チャット編集サービスに報告
        const activeSession = chatEditingService.getActiveSession()
        if (activeSession) {
          chatEditingService.reportFileChanges(
            activeSession.id,
            detectedOperations.map(op => ({
              type: op.type,
              filePath: op.path,
              confidence: 0.8,
              context: command
            }))
          )
        }
      }

    } catch (error) {
      const errorEntry: TerminalEntry = {
        id: `entry-${Date.now() + 1}`,
        type: 'error',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        exitCode: 1
      }

      setSessions(prev => prev.map(session => {
        if (session.id === activeSession.id) {
          return {
            ...session,
            history: [...session.history, commandEntry, errorEntry],
            status: 'error'
          }
        }
        return session
      }))
    } finally {
      setIsExecuting(false)
      setCurrentCommand("")
      setHistoryIndex(-1)
    }
  }, [activeSession, settings.detectFileOperations, onFileOperation, onDirectoryChange])

  // キーボードイベントハンドラ
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        if (!isExecuting && currentCommand.trim()) {
          executeCommand(currentCommand)
        }
        break
      
      case 'ArrowUp':
        e.preventDefault()
        if (commandHistory.length > 0) {
          const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1)
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
        }
        break
      
      case 'ArrowDown':
        e.preventDefault()
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex])
        } else if (historyIndex === 0) {
          setHistoryIndex(-1)
          setCurrentCommand("")
        }
        break
      
      case 'Tab':
        e.preventDefault()
        // 簡単なタブ補完（ファイル名など）
        handleTabCompletion()
        break
      
      case 'c':
        if (e.ctrlKey) {
          e.preventDefault()
          // Ctrl+C で実行中のコマンドを中断
          if (isExecuting) {
            setIsExecuting(false)
            addInfoEntry(activeSession?.id || '', '^C')
          }
        }
        break
    }
  }, [currentCommand, commandHistory, historyIndex, isExecuting, executeCommand, activeSession])

  // タブ補完の処理
  const handleTabCompletion = useCallback(() => {
    // 簡単な実装：現在のディレクトリのファイル/フォルダ名を補完
    // 実際の実装では、ファイルシステムAPIを使用
    console.log('Tab completion requested for:', currentCommand)
  }, [currentCommand])

  // 情報エントリを追加
  const addInfoEntry = useCallback((sessionId: string, content: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const infoEntry: TerminalEntry = {
          id: `entry-${Date.now()}`,
          type: 'info',
          content,
          timestamp: new Date()
        }
        return {
          ...session,
          history: [...session.history, infoEntry]
        }
      }
      return session
    }))
  }, [])

  // 自動スクロール
  useEffect(() => {
    if (settings.autoScroll && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [activeSession?.history, settings.autoScroll])

  // エントリの色を取得
  const getEntryColor = (type: TerminalEntry['type']) => {
    switch (type) {
      case 'command': return 'text-blue-400'
      case 'output': return 'text-green-400'
      case 'error': return 'text-red-400'
      case 'info': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  // エントリのアイコンを取得
  const getEntryIcon = (type: TerminalEntry['type']) => {
    switch (type) {
      case 'command': return <ChevronRight className="h-3 w-3" />
      case 'output': return <File className="h-3 w-3" />
      case 'error': return <X className="h-3 w-3" />
      case 'info': return <TerminalIcon className="h-3 w-3" />
      default: return null
    }
  }

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-100 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-medium">Terminal</span>
          {isExecuting && (
            <Badge variant="secondary" className="text-xs">
              Running
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => createNewSession()}
            className="h-6 w-6 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSettings(prev => ({ ...prev, autoScroll: !prev.autoScroll }))}>
                {settings.autoScroll ? 'Disable' : 'Enable'} Auto Scroll
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettings(prev => ({ ...prev, showTimestamps: !prev.showTimestamps }))}>
                {settings.showTimestamps ? 'Hide' : 'Show'} Timestamps
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettings(prev => ({ ...prev, detectFileOperations: !prev.detectFileOperations }))}>
                {settings.detectFileOperations ? 'Disable' : 'Enable'} File Detection
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => activeSession && closeSession(activeSession.id)}>
                <Trash2 className="h-3 w-3 mr-2" />
                Close Terminal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* タブ */}
      {sessions.length > 1 && (
        <Tabs value={activeSessionId || undefined} onValueChange={setActiveSessionId} className="w-full">
          <TabsList className="w-full justify-start bg-gray-800 rounded-none border-b border-gray-700">
            {sessions.map(session => (
              <TabsTrigger
                key={session.id}
                value={session.id}
                className="relative text-xs data-[state=active]:bg-gray-700"
              >
                {session.name}
                {sessions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1 hover:bg-gray-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      closeSession(session.id)
                    }}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* ターミナル内容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-2">
          <div className="space-y-1 font-mono text-sm">
            {activeSession?.history.map(entry => (
              <div key={entry.id} className="flex items-start gap-2">
                <div className={`flex items-center gap-1 ${getEntryColor(entry.type)}`}>
                  {getEntryIcon(entry.type)}
                  {settings.showTimestamps && (
                    <span className="text-xs text-gray-500">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className={`flex-1 ${getEntryColor(entry.type)}`}>
                  <pre className="whitespace-pre-wrap break-words">{entry.content}</pre>
                  {entry.fileOperations && entry.fileOperations.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {entry.fileOperations.map((op, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {op.type}: {op.path}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* コマンド入力 */}
        <div className="border-t border-gray-700 p-2">
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className="text-blue-400 shrink-0">
              {activeSession?.cwd}$
            </span>
            <Input
              ref={inputRef}
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              disabled={isExecuting}
              className="flex-1 bg-transparent border-none focus:ring-0 text-gray-100 placeholder-gray-500"
              style={{
                fontSize: settings.fontSize,
                fontFamily: settings.fontFamily
              }}
            />
            {isExecuting && (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// モックコマンド実行関数
async function mockExecuteCommand(command: string, cwd: string): Promise<{
  success: boolean
  output: string
  exitCode: number
}> {
  // 実際の実装では、Node.js child_processやWebAssemblyベースのシェルを使用
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500))

  const cmd = command.trim().toLowerCase()

  if (cmd === 'ls' || cmd === 'dir') {
    return {
      success: true,
      output: 'components/\nlib/\npackage.json\nREADME.md\ntsconfig.json',
      exitCode: 0
    }
  }

  if (cmd.startsWith('cd ')) {
    const targetDir = command.substring(3).trim()
    return {
      success: true,
      output: `Changed directory to ${targetDir}`,
      exitCode: 0
    }
  }

  if (cmd === 'pwd') {
    return {
      success: true,
      output: cwd,
      exitCode: 0
    }
  }

  if (cmd.startsWith('echo ')) {
    return {
      success: true,
      output: command.substring(5),
      exitCode: 0
    }
  }

  if (cmd === 'clear' || cmd === 'cls') {
    return {
      success: true,
      output: '',
      exitCode: 0
    }
  }

  // デフォルト: コマンドが見つからない
  return {
    success: false,
    output: `Command not found: ${command}`,
    exitCode: 127
  }
}

// パス解決ユーティリティ
function resolvePath(currentPath: string, targetPath: string): string {
  if (targetPath.startsWith('/')) {
    return targetPath
  }
  
  if (targetPath === '..') {
    const parts = currentPath.split('/').filter(Boolean)
    parts.pop()
    return '/' + parts.join('/')
  }
  
  if (targetPath === '.') {
    return currentPath
  }
  
  return currentPath.endsWith('/') 
    ? currentPath + targetPath 
    : currentPath + '/' + targetPath
}

export default IntegratedTerminal
