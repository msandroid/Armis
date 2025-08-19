"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Editor, Monaco } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Play,
  Square,
  Save,
  Settings,
  Search,
  Replace,
  Palette,
  Terminal,
  MessageSquare,
  FileText,
  Zap,
  Bug,
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable"
import { IntegratedTerminal } from "./integrated-terminal"
import { FileOperationHeuristics, FileOperation } from "@/lib/file-operation-heuristics"
import { chatEditingService, ChatMessage } from "@/lib/chat-editing-service"

interface EnhancedMonacoEditorProps {
  content?: string
  language?: string
  theme?: "vs-dark" | "vs-light" | "hc-black"
  path?: string
  onContentChange?: (content: string) => void
  onSave?: (content: string, path: string) => void
  onRun?: (content: string, language: string) => void
  onDebug?: (content: string, language: string) => void
  className?: string
  enableTerminal?: boolean
  enableChat?: boolean
  enableFileDetection?: boolean
}

interface EditorState {
  content: string
  isDirty: boolean
  isRunning: boolean
  isDebugging: boolean
  hasErrors: boolean
  cursorPosition: { line: number; column: number }
  selectedText: string
  searchQuery: string
  replaceQuery: string
}

interface ChatIntegration {
  isOpen: boolean
  messages: ChatMessage[]
  currentInput: string
  isProcessing: boolean
}

export function EnhancedMonacoEditor({
  content = "",
  language = "javascript",
  theme = "vs-dark",
  path = "untitled",
  onContentChange,
  onSave,
  onRun,
  onDebug,
  className = "",
  enableTerminal = true,
  enableChat = true,
  enableFileDetection = true
}: EnhancedMonacoEditorProps) {
  const [editorState, setEditorState] = useState<EditorState>({
    content,
    isDirty: false,
    isRunning: false,
    isDebugging: false,
    hasErrors: false,
    cursorPosition: { line: 1, column: 1 },
    selectedText: "",
    searchQuery: "",
    replaceQuery: ""
  })

  const [chatIntegration, setChatIntegration] = useState<ChatIntegration>({
    isOpen: false,
    messages: [],
    currentInput: "",
    isProcessing: false
  })

  const [showTerminal, setShowTerminal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [detectedOperations, setDetectedOperations] = useState<FileOperation[]>([])
  const [settings, setSettings] = useState({
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineNumbers: "on" as const,
    wordWrap: "on" as const,
    minimap: { enabled: false },
    autoSave: true,
    tabSize: 2,
    insertSpaces: true,
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    }
  })

  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

  // エディタのマウント時の処理
  const handleEditorDidMount = useCallback((editor: any, monaco: Monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // カスタムアクション（コマンド）を追加
    editor.addAction({
      id: 'save-file',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => handleSave()
    })

    editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyCode.F5],
      run: () => handleRun()
    })

    editor.addAction({
      id: 'debug-code',
      label: 'Debug Code',
      keybindings: [monaco.KeyCode.F9],
      run: () => handleDebug()
    })

    editor.addAction({
      id: 'toggle-terminal',
      label: 'Toggle Terminal',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote],
      run: () => setShowTerminal(prev => !prev)
    })

    editor.addAction({
      id: 'open-chat',
      label: 'Open AI Chat',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC],
      run: () => handleOpenChat()
    })

    // カーソル位置の変更を監視
    editor.onDidChangeCursorPosition((e: any) => {
      setEditorState(prev => ({
        ...prev,
        cursorPosition: { line: e.position.lineNumber, column: e.position.column }
      }))
    })

    // 選択テキストの変更を監視
    editor.onDidChangeCursorSelection((e: any) => {
      const selectedText = editor.getModel()?.getValueInRange(e.selection) || ""
      setEditorState(prev => ({ ...prev, selectedText }))
    })

    // エラーマーカーの変更を監視
    monaco.editor.onDidChangeMarkers(() => {
      const model = editor.getModel()
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri })
        const hasErrors = markers.some(marker => marker.severity === monaco.MarkerSeverity.Error)
        setEditorState(prev => ({ ...prev, hasErrors }))
      }
    })
  }, [])

  // エディタ内容の変更処理
  const handleEditorChange = useCallback((value: string | undefined) => {
    const newContent = value || ""
    setEditorState(prev => ({ ...prev, content: newContent, isDirty: true }))
    onContentChange?.(newContent)

    // ファイル操作の検出
    if (enableFileDetection) {
      const detection = FileOperationHeuristics.detectFileOperations(newContent)
      if (detection.isFileOperation) {
        setDetectedOperations(detection.operations)
      }
    }

    // 自動保存
    if (settings.autoSave) {
      const timeoutId = setTimeout(() => {
        handleSave()
      }, 2000)
      return () => clearTimeout(timeoutId)
    }
  }, [onContentChange, enableFileDetection, settings.autoSave])

  // ファイル保存
  const handleSave = useCallback(() => {
    onSave?.(editorState.content, path)
    setEditorState(prev => ({ ...prev, isDirty: false }))

    // チャット編集サービスに報告
    if (enableChat) {
      const activeSession = chatEditingService.getActiveSession()
      if (activeSession) {
        chatEditingService.addMessage(
          activeSession.id,
          `File saved: ${path}`,
          'system',
          {
            workspaceFiles: [],
            openFiles: [path],
            currentFile: path,
            selectedText: editorState.selectedText,
            cursorPosition: editorState.cursorPosition
          }
        )
      }
    }
  }, [editorState.content, editorState.selectedText, editorState.cursorPosition, path, onSave, enableChat])

  // コード実行
  const handleRun = useCallback(() => {
    setEditorState(prev => ({ ...prev, isRunning: true }))
    onRun?.(editorState.content, language)
    
    setTimeout(() => {
      setEditorState(prev => ({ ...prev, isRunning: false }))
    }, 2000)
  }, [editorState.content, language, onRun])

  // デバッグ開始
  const handleDebug = useCallback(() => {
    setEditorState(prev => ({ ...prev, isDebugging: true }))
    onDebug?.(editorState.content, language)
    
    setTimeout(() => {
      setEditorState(prev => ({ ...prev, isDebugging: false }))
    }, 3000)
  }, [editorState.content, language, onDebug])

  // チャットを開く
  const handleOpenChat = useCallback(() => {
    setChatIntegration(prev => ({ ...prev, isOpen: true }))
    
    // チャット編集セッションを作成または取得
    let session = chatEditingService.getActiveSession()
    if (!session) {
      session = chatEditingService.createSession(`Editing ${path}`)
    }

    // 現在のエディタ状態をコンテキストとして追加
    chatEditingService.addMessage(
      session.id,
      `Opened editor for ${path}`,
      'system',
      {
        workspaceFiles: [],
        openFiles: [path],
        currentFile: path,
        selectedText: editorState.selectedText,
        cursorPosition: editorState.cursorPosition
      }
    )
  }, [path, editorState.selectedText, editorState.cursorPosition])

  // チャットメッセージを送信
  const handleSendChatMessage = useCallback(async (message: string) => {
    if (!message.trim()) return

    setChatIntegration(prev => ({ ...prev, isProcessing: true, currentInput: "" }))

    const session = chatEditingService.getActiveSession()
    if (session) {
      // ユーザーメッセージを追加
      const userMessage = chatEditingService.addMessage(
        session.id,
        message,
        'user',
        {
          workspaceFiles: [],
          openFiles: [path],
          currentFile: path,
          selectedText: editorState.selectedText,
          cursorPosition: editorState.cursorPosition
        }
      )

      // AIレスポンスをシミュレート（実際の実装では、AI APIを呼び出し）
      setTimeout(() => {
        const aiResponse = generateAIResponse(message, editorState.content, language)
        chatEditingService.addMessage(session.id, aiResponse, 'assistant')
        setChatIntegration(prev => ({ ...prev, isProcessing: false }))
      }, 1000)
    }
  }, [path, editorState.selectedText, editorState.cursorPosition, editorState.content, language])

  // ファイル操作を適用
  const handleApplyFileOperation = useCallback(async (operation: FileOperation) => {
    // 実際の実装では、ファイルシステムAPIを使用
    console.log('Applying file operation:', operation)
    
    if (operation.type === 'update' && operation.content) {
      setEditorState(prev => ({ ...prev, content: operation.content!, isDirty: true }))
      if (editorRef.current) {
        editorRef.current.setValue(operation.content)
      }
    }
  }, [])

  // ターミナルでのファイル操作を処理
  const handleTerminalFileOperation = useCallback((operation: any) => {
    console.log('Terminal file operation detected:', operation)
    // 必要に応じてエディタの内容を更新
  }, [])

  // ターミナルでのディレクトリ変更を処理
  const handleTerminalDirectoryChange = useCallback((newPath: string) => {
    console.log('Terminal directory changed to:', newPath)
  }, [])

  return (
    <div className={`flex flex-col h-full bg-gray-900 text-gray-100 ${className}`}>
      {/* ツールバー */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">{path}</span>
          {editorState.isDirty && <Badge variant="secondary" className="text-xs">●</Badge>}
          {editorState.hasErrors && <Badge variant="destructive" className="text-xs">!</Badge>}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!editorState.isDirty}
            className="h-8 px-2"
          >
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
            disabled={editorState.isRunning}
            className="h-8 px-2"
          >
            {editorState.isRunning ? (
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Run
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDebug}
            disabled={editorState.isDebugging}
            className="h-8 px-2"
          >
            <Bug className="h-3 w-3 mr-1" />
            Debug
          </Button>

          {enableTerminal && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTerminal(!showTerminal)}
              className="h-8 px-2"
            >
              <Terminal className="h-3 w-3 mr-1" />
              Terminal
            </Button>
          )}

          {enableChat && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenChat}
              className="h-8 px-2"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Chat
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-8 px-2"
          >
            {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Settings className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSettings(prev => ({ ...prev, minimap: { enabled: !prev.minimap.enabled } }))}>
                {settings.minimap.enabled ? 'Hide' : 'Show'} Minimap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSettings(prev => ({ ...prev, autoSave: !prev.autoSave }))}>
                {settings.autoSave ? 'Disable' : 'Enable'} Auto Save
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Palette className="h-3 w-3 mr-2" />
                Change Theme
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 検出されたファイル操作 */}
      {detectedOperations.length > 0 && (
        <div className="p-2 bg-blue-900/20 border-b border-blue-700">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-3 w-3 text-blue-400" />
            <span className="text-blue-400">Detected file operations:</span>
            <div className="flex gap-1">
              {detectedOperations.map((op, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-blue-800"
                  onClick={() => handleApplyFileOperation(op)}
                >
                  {op.type}: {op.filePath}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* エディタパネル */}
          <ResizablePanel defaultSize={showPreview ? 50 : 100}>
            <ResizablePanelGroup direction="vertical">
              {/* エディタ */}
              <ResizablePanel defaultSize={showTerminal ? 70 : 100}>
                <Editor
                  height="100%"
                  language={language}
                  value={editorState.content}
                  theme={theme}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    ...settings,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    parameterHints: { enabled: true }
                  }}
                />
              </ResizablePanel>

              {/* ターミナル */}
              {showTerminal && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={30} minSize={20}>
                    <IntegratedTerminal
                      onFileOperation={handleTerminalFileOperation}
                      onDirectoryChange={handleTerminalDirectoryChange}
                      enableFileDetection={enableFileDetection}
                    />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* プレビューパネル */}
          {showPreview && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={50}>
                <div className="h-full p-4 bg-gray-800">
                  <h3 className="text-lg font-semibold mb-4">Preview</h3>
                  <div className="bg-white text-black p-4 rounded">
                    {language === 'html' ? (
                      <iframe
                        srcDoc={editorState.content}
                        className="w-full h-full border-none"
                        title="HTML Preview"
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm">
                        {editorState.content}
                      </pre>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* ステータスバー */}
      <div className="flex items-center justify-between p-2 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Ln {editorState.cursorPosition.line}, Col {editorState.cursorPosition.column}</span>
          <span>{language}</span>
          <span>{editorState.content.length} chars</span>
          {editorState.selectedText && (
            <span>({editorState.selectedText.length} selected)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editorState.isRunning && (
            <Badge variant="secondary" className="text-xs">Running</Badge>
          )}
          {editorState.isDebugging && (
            <Badge variant="secondary" className="text-xs">Debugging</Badge>
          )}
          {detectedOperations.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {detectedOperations.length} operations detected
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// AIレスポンスを生成（モック実装）
function generateAIResponse(userMessage: string, code: string, language: string): string {
  const responses = [
    `I can help you with that ${language} code. Let me analyze it...`,
    `Based on your request, here are some suggestions for improving the code:`,
    `I notice you're working with ${language}. Here's what I recommend:`,
    `Let me help you optimize this code. I see a few areas for improvement:`,
    `Great question! For ${language} development, consider these approaches:`
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}

export default EnhancedMonacoEditor
