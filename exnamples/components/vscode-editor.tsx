"use client"

import { useState, useEffect, useRef } from "react"
import { VSCodeEditor } from "@/components/editor"
import { CommandPalette } from "@/components/command-palette"
import { SearchReplace } from "@/components/search-replace"
import { Snippets } from "@/components/snippets"
import { Terminal } from "@/components/terminal"
import { Settings } from "@/components/settings"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Settings as SettingsIcon, 
  Terminal as TerminalIcon,
  Code,
  Palette,
  Zap
} from "lucide-react"

interface VSCodeEditorProps {
  content?: string
  language?: string
  onContentChange?: (content: string) => void
  theme?: "vs-dark" | "vs-light" | "hc-black"
}

interface EditorSettings {
  theme: "vs-dark" | "vs-light" | "hc-black"
  fontSize: number
  fontFamily: string
  lineNumbers: "on" | "off" | "relative"
  wordWrap: "on" | "off" | "wordWrapColumn"
  minimap: boolean
  bracketPairColorization: boolean
  guides: {
    bracketPairs: boolean
    indentation: boolean
  }
  suggestOnTriggerCharacters: boolean
  quickSuggestions: boolean
  parameterHints: boolean
  autoSave: boolean
  tabSize: number
  insertSpaces: boolean
}

const defaultSettings: EditorSettings = {
  theme: "vs-dark",
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  lineNumbers: "on",
  wordWrap: "on",
  minimap: false,
  bracketPairColorization: true,
  guides: {
    bracketPairs: true,
    indentation: true
  },
  suggestOnTriggerCharacters: true,
  quickSuggestions: true,
  parameterHints: true,
  autoSave: true,
  tabSize: 2,
  insertSpaces: true
}

export function VSCodeEditor({ 
  content = "", 
  language = "javascript",
  onContentChange,
  theme = "vs-dark"
}: VSCodeEditorProps) {
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showSnippets, setShowSnippets] = useState(false)
  const [showTerminal, setShowTerminal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    // ローカルストレージから設定を読み込み
    const savedSettings = localStorage.getItem('armis-editor-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + P: コマンドパレット
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      // Cmd/Ctrl + P: クイックオープン
      else if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
      // Cmd/Ctrl + F: 検索
      else if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
      }
      // Cmd/Ctrl + H: 置換
      else if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault()
        setShowSearch(true)
      }
      // Cmd/Ctrl + ,: 設定
      else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setShowSettings(true)
      }
      // Ctrl + `: ターミナル
      else if (e.ctrlKey && e.key === '`') {
        e.preventDefault()
        setShowTerminal(!showTerminal)
      }
      // Escape: モーダルを閉じる
      else if (e.key === 'Escape') {
        if (showCommandPalette) setShowCommandPalette(false)
        if (showSearch) setShowSearch(false)
        if (showSnippets) setShowSnippets(false)
        if (showSettings) setShowSettings(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showTerminal, showCommandPalette, showSearch, showSnippets, showSettings])

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    editor.focus()
  }

  const handleEditorChange = (value: string | undefined) => {
    onContentChange?.(value || "")
  }

  const handleCommandExecute = (commandId: string) => {
    console.log('Executing command:', commandId)
    
    switch (commandId) {
      case "workbench.action.showCommands":
        setShowCommandPalette(true)
        break
      case "workbench.action.quickOpen":
        setShowCommandPalette(true)
        break
      case "actions.find":
        setShowSearch(true)
        break
      case "editor.action.startFindReplaceAction":
        setShowSearch(true)
        break
      case "workbench.action.toggleTerminal":
        setShowTerminal(!showTerminal)
        break
      case "workbench.action.openSettings":
        setShowSettings(true)
        break
      case "file.save":
        // ファイル保存処理
        console.log("Saving file...")
        break
      case "file.new":
        // 新規ファイル作成
        console.log("Creating new file...")
        break
      case "ai.chat":
        // AIチャットを開く
        console.log("Opening AI chat...")
        break
      default:
        console.log("Unknown command:", commandId)
    }
  }

  const handleSearch = (query: string, options: any) => {
    // 検索処理の実装
    console.log("Searching for:", query, options)
    // 実際の実装では、Monaco Editorの検索APIを使用
  }

  const handleReplace = (query: string, replacement: string, options: any) => {
    // 置換処理の実装
    console.log("Replacing:", query, "with:", replacement, options)
  }

  const handleReplaceAll = (query: string, replacement: string, options: any) => {
    // すべて置換処理の実装
    console.log("Replace all:", query, "with:", replacement, options)
  }

  const handleSnippetInsert = (snippet: any) => {
    if (editorRef.current) {
      // スニペットをエディターに挿入
      const position = editorRef.current.getPosition()
      editorRef.current.executeEdits('snippet-insert', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: snippet.body
      }])
    }
  }

  const handleTerminalCommand = async (command: string): Promise<string> => {
    // ターミナルコマンド実行の実装
    console.log("Executing terminal command:", command)
    return `Executed: ${command}`
  }

  const handleSettingsChange = (newSettings: EditorSettings) => {
    setSettings(newSettings)
    // 設定をローカルストレージに保存
    localStorage.setItem('armis-editor-settings', JSON.stringify(newSettings))
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* ツールバー */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(true)}
            className="h-8 px-3 text-xs"
          >
            <Search className="h-3 w-3 mr-1" />
            検索
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSnippets(true)}
            className="h-8 px-3 text-xs"
          >
            <Code className="h-3 w-3 mr-1" />
            スニペット
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTerminal(!showTerminal)}
            className={`h-8 px-3 text-xs ${showTerminal ? 'bg-blue-600 text-white' : ''}`}
          >
            <TerminalIcon className="h-3 w-3 mr-1" />
            ターミナル
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommandPalette(true)}
            className="h-8 px-3 text-xs"
          >
            <Palette className="h-3 w-3 mr-1" />
            コマンド
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="h-8 px-3 text-xs"
          >
            <SettingsIcon className="h-3 w-3 mr-1" />
            設定
          </Button>
        </div>
      </div>

      {/* メインエディター */}
      <div className="flex-1 overflow-hidden">
        <VSCodeEditor
          content={content}
          language={language}
          onContentChange={handleEditorChange}
          theme={settings.theme}
        />
      </div>

      {/* コマンドパレット */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onCommandExecute={handleCommandExecute}
      />

      {/* 検索・置換 */}
      <SearchReplace
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSearch={handleSearch}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        searchResults={searchResults}
        currentMatchIndex={currentMatchIndex}
        totalMatches={totalMatches}
      />

      {/* スニペット */}
      <Snippets
        isOpen={showSnippets}
        onClose={() => setShowSnippets(false)}
        onSnippetInsert={handleSnippetInsert}
        currentLanguage={language}
      />

      {/* ターミナル */}
      <Terminal
        isOpen={showTerminal}
        onClose={() => setShowTerminal(false)}
        onCommandExecute={handleTerminalCommand}
      />

      {/* 設定 */}
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  )
} 