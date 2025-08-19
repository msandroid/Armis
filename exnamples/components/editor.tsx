"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Eye, Play, Download, FileText, Settings, Search } from "lucide-react"
import Editor from "@monaco-editor/react"

interface VSCodeEditorProps {
  content?: string
  language?: string
  onContentChange?: (content: string) => void
  theme?: "vs-dark" | "vs-light" | "hc-black"
}

export function VSCodeEditor({ 
  content = "", 
  language = "javascript",
  onContentChange,
  theme = "vs-dark"
}: VSCodeEditorProps) {
  const [activeTab, setActiveTab] = useState("code")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const editorRef = useRef<any>(null)

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    editor.focus()
  }

  const handleEditorChange = (value: string | undefined) => {
    onContentChange?.(value || "")
  }

  const handleSave = () => {
    if (editorRef.current) {
      const value = editorRef.current.getValue()
      // ここでファイル保存処理を実装
      console.log("Saving file:", value)
    }
  }

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run()
    }
  }

  return (
    <div className={`flex flex-col h-full bg-zinc-950 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* VSCode-like Header */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs text-zinc-400 ml-2">Armis Editor</span>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-6 px-2 text-xs"
          >
            {isFullscreen ? "Exit" : "Full"}
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="bg-zinc-900 border-b border-zinc-800 rounded-none">
            <TabsTrigger value="code" className="text-xs">
              <Code className="h-3 w-3 mr-1" />
              Code
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="flex-1 p-0">
            <Editor
              height="100%"
              defaultLanguage={language}
              defaultValue={content}
              theme={theme}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                parameterHints: { enabled: true },
                bracketPairColorization: { enabled: true },
                guides: {
                  bracketPairs: true,
                  indentation: true
                }
              }}
            />
          </TabsContent>

          <TabsContent value="preview" className="flex-1 p-4">
            <div className="h-full bg-zinc-900 rounded-lg border border-zinc-800 p-4">
              <div className="text-zinc-400 text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>プレビュー画面</p>
                <p className="text-sm mt-2">ここに制作物のプレビューが表示されます</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between p-2 border-t border-zinc-800 bg-zinc-900 text-xs text-zinc-400">
        <div className="flex items-center space-x-4">
          <span>{language}</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  )
} 