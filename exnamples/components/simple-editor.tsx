"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Eye, FileText, Search, Save, Settings } from "lucide-react"

interface SimpleEditorProps {
  content?: string
  language?: string
  onContentChange?: (content: string) => void
  theme?: "dark" | "light"
}

export function SimpleEditor({ 
  content = "", 
  language = "javascript",
  onContentChange,
  theme = "dark"
}: SimpleEditorProps) {
  const [activeTab, setActiveTab] = useState("code")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange?.(e.target.value)
  }

  const handleSave = () => {
    console.log("Saving file:", content)
  }

  const handleFormat = () => {
    // シンプルなフォーマット機能
    if (textareaRef.current) {
      const formatted = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim()
      onContentChange?.(formatted)
    }
  }

  const getLanguageClass = () => {
    switch (language) {
      case 'typescript':
      case 'javascript':
        return 'language-javascript'
      case 'json':
        return 'language-json'
      case 'markdown':
        return 'language-markdown'
      default:
        return 'language-plaintext'
    }
  }

  const isDark = theme === "dark"
  const bgColor = isDark ? "bg-zinc-950" : "bg-white"
  const headerBg = isDark ? "bg-zinc-900" : "bg-gray-50"
  const borderColor = isDark ? "border-zinc-800" : "border-gray-200"
  const textColor = isDark ? "text-zinc-100" : "text-gray-900"
  const textMuted = isDark ? "text-zinc-400" : "text-gray-600"
  const hoverBg = isDark ? "hover:bg-zinc-800" : "hover:bg-gray-100"

  return (
    <div className={`flex flex-col h-full ${bgColor}`}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between p-2 border-b ${borderColor} ${headerBg}`}>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 text-xs ${textMuted}`}>
            <Search className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className={`${headerBg} border-b ${borderColor} rounded-none`}>
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
            <div className={`h-full ${isDark ? 'bg-zinc-900' : 'bg-gray-50'} border ${borderColor}`}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                className={`w-full h-full bg-transparent ${textColor} p-4 resize-none outline-none font-mono text-sm ${getLanguageClass()}`}
                placeholder="Start coding here..."
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 p-4">
            <div className={`h-full ${isDark ? 'bg-zinc-900' : 'bg-gray-50'} rounded-lg border ${borderColor} p-4`}>
              <div className={`text-center ${textMuted}`}>
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>プレビュー画面</p>
                <p className="text-sm mt-2">ここに制作物のプレビューが表示されます</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className={`flex items-center justify-between p-2 border-t ${borderColor} ${headerBg} text-xs ${textMuted}`}>
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