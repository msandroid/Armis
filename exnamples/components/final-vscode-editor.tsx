"use client"

import { useState, useEffect, useRef } from "react"
import { AdvancedEditor } from "@/components/advanced-editor"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Settings as SettingsIcon, 
  Terminal as TerminalIcon,
  Code,
  Palette,
  Zap,
  Navigation,
  FileText,
  Save,
  Play,
  Bug,
  AlertCircle,
  Edit3,
  Eye,
  Cpu,
  Brackets
} from "lucide-react"

interface FinalVSCodeEditorProps {
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
  webWorkers: boolean
  codeLens: boolean
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
  insertSpaces: true,
  webWorkers: false,
  codeLens: true
}

export function FinalVSCodeEditor({ 
  content = "", 
  language = "javascript",
  onContentChange,
  theme = "vs-dark"
}: FinalVSCodeEditorProps) {
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings)
  const [isDirty, setIsDirty] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [isDebugging, setIsDebugging] = useState(false)
  const editorRef = useRef<any>(null)

  useEffect(() => {
    // ローカルストレージから設定を読み込み
    const savedSettings = localStorage.getItem('armis-editor-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Failed to parse saved settings:', error)
      }
    }
  }, [])

  const handleEditorChange = (value: string | undefined) => {
    setIsDirty(true)
    onContentChange?.(value || "")
  }

  const handleSave = () => {
    setIsDirty(false)
    console.log('File saved')
  }

  const handleRun = () => {
    setIsRunning(true)
    setTimeout(() => setIsRunning(false), 2000)
    console.log('Code executed')
  }

  const handleDebug = () => {
    setIsDebugging(true)
    setTimeout(() => setIsDebugging(false), 2000)
    console.log('Debug started')
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900 text-zinc-100">
      {/* ツールバー */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            className="h-8 px-3 text-xs"
            disabled={!isDirty}
          >
            <Save className="h-3 w-3 mr-1" />
            保存
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRun}
            className={`h-8 px-3 text-xs ${isRunning ? 'bg-green-600 text-white' : ''}`}
          >
            <Play className="h-3 w-3 mr-1" />
            実行
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDebug}
            className={`h-8 px-3 text-xs ${isDebugging ? 'bg-red-600 text-white' : ''}`}
          >
            <Bug className="h-3 w-3 mr-1" />
            デバッグ
          </Button>
        </div>
      </div>

      {/* メインエディター */}
      <div className="flex-1">
        <AdvancedEditor
          content={content}
          language={language}
          onContentChange={handleEditorChange}
          theme={settings.theme}
          settings={settings}
        />
      </div>
    </div>
  )
} 