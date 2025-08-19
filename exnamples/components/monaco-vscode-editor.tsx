"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Editor from "@monaco-editor/react"
import * as monaco from "monaco-editor"
import { Button } from "@/components/ui/button"
import { 
  Save, 
  Play, 
  Bug, 
  Settings, 
  Search,
  Replace,
  Palette,
  Terminal,
  GitBranch,
  RefreshCw,
  Download
} from "lucide-react"

interface MonacoVSCodeEditorProps {
  content?: string
  language?: string
  onContentChange?: (content: string) => void
  theme?: "vs-dark" | "vs-light" | "hc-black"
  path?: string
  onSave?: () => void
  onRun?: () => void
  onDebug?: () => void
}

interface EditorState {
  isDirty: boolean
  isRunning: boolean
  isDebugging: boolean
  hasErrors: boolean
  hasWarnings: boolean
  cursorPosition: { line: number; column: number }
  selection: string
}

export function MonacoVSCodeEditor({
  content = "",
  language = "javascript",
  onContentChange,
  theme = "vs-dark",
  path = "untitled",
  onSave,
  onRun,
  onDebug
}: MonacoVSCodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [editorState, setEditorState] = useState<EditorState>({
    isDirty: false,
    isRunning: false,
    isDebugging: false,
    hasErrors: false,
    hasWarnings: false,
    cursorPosition: { line: 1, column: 1 },
    selection: ""
  })

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    editorRef.current = editor

    // エディタの設定
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      lineNumbers: "on",
      minimap: { enabled: true },
      wordWrap: "on",
      scrollBeyondLastLine: false,
      automaticLayout: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
      },
      suggestOnTriggerCharacters: true,
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true
      },
      parameterHints: { enabled: true },
      codeLens: true,
      folding: true,
      foldingStrategy: "indentation",
      showFoldingControls: "always",
      matchBrackets: "always",
      renderWhitespace: "selection",
      renderControlCharacters: true,
      cursorSmoothCaretAnimation: "on",
      smoothScrolling: true,
      contextmenu: true,
      mouseWheelZoom: true
    })

    // カーソル位置変更の監視
    editor.onDidChangeCursorPosition((e) => {
      setEditorState(prev => ({
        ...prev,
        cursorPosition: {
          line: e.position.lineNumber,
          column: e.position.column
        }
      }))
    })

    // 選択範囲変更の監視
    editor.onDidChangeCursorSelection((e) => {
      const selectedText = editor.getModel()?.getValueInRange(e.selection) || ""
      setEditorState(prev => ({
        ...prev,
        selection: selectedText
      }))
    })

    // エラー・警告の監視
    monaco.editor.onDidChangeMarkers(([resource]) => {
      const markers = monaco.editor.getModelMarkers({ resource })
      const hasErrors = markers.some(marker => marker.severity === monaco.MarkerSeverity.Error)
      const hasWarnings = markers.some(marker => marker.severity === monaco.MarkerSeverity.Warning)
      
      setEditorState(prev => ({
        ...prev,
        hasErrors,
        hasWarnings
      }))
    })

    // キーボードショートカット
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F5, () => {
      handleRun()
    })

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.F5, () => {
      handleDebug()
    })

    // コマンドパレット
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
      editor.trigger("", "editor.action.quickCommand", {})
    })

    // ファイル内検索
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      editor.trigger("", "actions.find", {})
    })

    // 置換
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyH, () => {
      editor.trigger("", "editor.action.startFindReplaceAction", {})
    })
  }

  const handleEditorChange = (value: string | undefined) => {
    setEditorState(prev => ({ ...prev, isDirty: true }))
    onContentChange?.(value || "")
  }

  const handleSave = useCallback(() => {
    setEditorState(prev => ({ ...prev, isDirty: false }))
    onSave?.()
  }, [onSave])

  const handleRun = useCallback(() => {
    setEditorState(prev => ({ ...prev, isRunning: true }))
    onRun?.()
    setTimeout(() => {
      setEditorState(prev => ({ ...prev, isRunning: false }))
    }, 2000)
  }, [onRun])

  const handleDebug = useCallback(() => {
    setEditorState(prev => ({ ...prev, isDebugging: true }))
    onDebug?.()
    setTimeout(() => {
      setEditorState(prev => ({ ...prev, isDebugging: false }))
    }, 3000)
  }, [onDebug])

  const openCommandPalette = () => {
    editorRef.current?.trigger("", "editor.action.quickCommand", {})
  }

  const openFind = () => {
    editorRef.current?.trigger("", "actions.find", {})
  }

  const openReplace = () => {
    editorRef.current?.trigger("", "editor.action.startFindReplaceAction", {})
  }

  const formatDocument = () => {
    editorRef.current?.trigger("", "editor.action.formatDocument", {})
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* タブバー */}
      <div className="flex items-center border-b border-[#2d2d30] bg-[#252526]">
        <div className="flex items-center px-3 py-2 border-r border-[#2d2d30] bg-[#1e1e1e] text-[#cccccc]">
          <span className="text-sm font-medium">{path}</span>
          {editorState.isDirty && (
            <span className="ml-1 text-[#ffffff] text-xs">●</span>
          )}
        </div>
      </div>

      {/* ツールバー */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-[#2d2d30] bg-[#252526]">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="h-7 px-2 text-xs text-[#cccccc] hover:bg-[#2a2a2a]"
            disabled={!editorState.isDirty}
          >
            <Save className="h-3 w-3 mr-1" />
            保存
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
            className={`h-7 px-2 text-xs hover:bg-[#2a2a2a] ${
              editorState.isRunning 
                ? 'bg-[#0e639c] text-white' 
                : 'text-[#cccccc]'
            }`}
          >
            <Play className="h-3 w-3 mr-1" />
            実行
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDebug}
            className={`h-7 px-2 text-xs hover:bg-[#2a2a2a] ${
              editorState.isDebugging 
                ? 'bg-[#cc6633] text-white' 
                : 'text-[#cccccc]'
            }`}
          >
            <Bug className="h-3 w-3 mr-1" />
            デバッグ
          </Button>

          <div className="w-px h-4 bg-[#2d2d30] mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={openFind}
            className="h-7 px-2 text-xs text-[#cccccc] hover:bg-[#2a2a2a]"
            title="検索 (Ctrl+F)"
          >
            <Search className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={openReplace}
            className="h-7 px-2 text-xs text-[#cccccc] hover:bg-[#2a2a2a]"
            title="置換 (Ctrl+H)"
          >
            <Replace className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={openCommandPalette}
            className="h-7 px-2 text-xs text-[#cccccc] hover:bg-[#2a2a2a]"
            title="コマンドパレット (Ctrl+Shift+P)"
          >
            <Palette className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={formatDocument}
            className="h-7 px-2 text-xs text-[#cccccc] hover:bg-[#2a2a2a]"
            title="フォーマット"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#cccccc]">
          {editorState.hasErrors && (
            <span className="text-[#f14c4c]">● エラー</span>
          )}
          {editorState.hasWarnings && (
            <span className="text-[#ffcc02]">▲ 警告</span>
          )}
          <span>{language.toUpperCase()}</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
      </div>

      {/* エディター */}
      <div className="flex-1">
        <Editor
          value={content}
          language={language}
          theme={theme}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace"
          }}
        />
      </div>

      {/* ステータスバー */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-[#2d2d30] bg-[#007acc] text-white text-xs">
        <div className="flex items-center space-x-4">
          <span>{language}</span>
          <span>UTF-8</span>
          <span>LF</span>
          <span>Ln {editorState.cursorPosition.line}, Col {editorState.cursorPosition.column}</span>
          {editorState.selection && (
            <span>({editorState.selection.length} selected)</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <GitBranch className="h-3 w-3" />
          <span>main</span>
        </div>
      </div>
    </div>
  )
}
