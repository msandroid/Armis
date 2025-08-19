"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Code, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  FileText,
  Component,
  Zap,
  Database,
  Globe
} from "lucide-react"

interface Snippet {
  id: string
  name: string
  description: string
  prefix: string
  body: string
  language: string
  tags: string[]
  isGlobal?: boolean
}

interface SnippetsProps {
  isOpen: boolean
  onClose: () => void
  onSnippetInsert: (snippet: Snippet) => void
  currentLanguage?: string
}

const defaultSnippets: Snippet[] = [
  // React/TypeScript スニペット
  {
    id: "react-component",
    name: "React Component",
    description: "基本的なReactコンポーネント",
    prefix: "rfc",
    language: "typescript",
    tags: ["react", "component"],
    body: `import React from 'react'

interface \${1:ComponentName}Props {
  \${2:prop}: \${3:string}
}

export function \${1:ComponentName}({\${2:prop}}: \${1:ComponentName}Props) {
  return (
    <div>
      \${4:Content}
    </div>
  )
}`
  },
  {
    id: "react-hook",
    name: "React Hook",
    description: "カスタムフック",
    prefix: "rhook",
    language: "typescript",
    tags: ["react", "hook"],
    body: `import { useState, useEffect } from 'react'

export function use\${1:HookName}() {
  const [\${2:state}, set\${2:State}] = useState<\${3:string}>(\${4:''})

  useEffect(() => {
    \${5:// Effect logic}
  }, [])

  return { \${2:state} }
}`
  },
  {
    id: "typescript-interface",
    name: "TypeScript Interface",
    description: "TypeScriptインターフェース",
    prefix: "interface",
    language: "typescript",
    tags: ["typescript", "interface"],
    body: `interface \${1:InterfaceName} {
  \${2:property}: \${3:string}
}`
  },
  {
    id: "typescript-function",
    name: "TypeScript Function",
    description: "TypeScript関数",
    prefix: "function",
    language: "typescript",
    tags: ["typescript", "function"],
    body: `function \${1:functionName}(\${2:param}: \${3:string}): \${4:void} {
  \${5:// Function body}
}`
  },
  {
    id: "console-log",
    name: "Console Log",
    description: "コンソールログ",
    prefix: "clg",
    language: "javascript",
    tags: ["debug", "console"],
    body: `console.log(\${1:value})`
  },
  {
    id: "try-catch",
    name: "Try Catch",
    description: "try-catch文",
    prefix: "try",
    language: "javascript",
    tags: ["error", "try-catch"],
    body: `try {
  \${1:// Try block}
} catch (error) {
  console.error('Error:', error)
}`
  },
  {
    id: "async-function",
    name: "Async Function",
    description: "非同期関数",
    prefix: "async",
    language: "javascript",
    tags: ["async", "function"],
    body: `async function \${1:functionName}() {
  try {
    \${2:// Async logic}
  } catch (error) {
    console.error('Error:', error)
  }
}`
  },
  {
    id: "css-flexbox",
    name: "CSS Flexbox",
    description: "Flexboxレイアウト",
    prefix: "flex",
    language: "css",
    tags: ["css", "flexbox"],
    body: `.\${1:class-name} {
  display: flex;
  justify-content: \${2:center};
  align-items: \${3:center};
  flex-direction: \${4:row};
}`
  },
  {
    id: "css-grid",
    name: "CSS Grid",
    description: "Gridレイアウト",
    prefix: "grid",
    language: "css",
    tags: ["css", "grid"],
    body: `.\${1:class-name} {
  display: grid;
  grid-template-columns: \${2:repeat(auto-fit, minmax(200px, 1fr))};
  gap: \${3:1rem};
}`
  }
]

export function Snippets({ isOpen, onClose, onSnippetInsert, currentLanguage = "typescript" }: SnippetsProps) {
  const [snippets, setSnippets] = useState<Snippet[]>(defaultSnippets)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSnippet, setSelectedSnippet] = useState<Snippet | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newSnippet, setNewSnippet] = useState<Partial<Snippet>>({
    name: "",
    description: "",
    prefix: "",
    body: "",
    language: currentLanguage,
    tags: []
  })

  const filteredSnippets = snippets.filter(snippet =>
    snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    snippet.language.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const languageSnippets = filteredSnippets.filter(snippet => 
    snippet.language === currentLanguage || snippet.language === "javascript"
  )

  const globalSnippets = filteredSnippets.filter(snippet => 
    snippet.isGlobal || snippet.language === "javascript"
  )

  const handleSnippetInsert = (snippet: Snippet) => {
    onSnippetInsert(snippet)
    onClose()
  }

  const handleCreateSnippet = () => {
    if (newSnippet.name && newSnippet.prefix && newSnippet.body) {
      const snippet: Snippet = {
        id: Date.now().toString(),
        name: newSnippet.name,
        description: newSnippet.description || "",
        prefix: newSnippet.prefix,
        body: newSnippet.body,
        language: newSnippet.language || currentLanguage,
        tags: newSnippet.tags || [],
        isGlobal: false
      }
      setSnippets(prev => [...prev, snippet])
      setNewSnippet({
        name: "",
        description: "",
        prefix: "",
        body: "",
        language: currentLanguage,
        tags: []
      })
      setIsCreating(false)
    }
  }

  const handleDeleteSnippet = (snippetId: string) => {
    setSnippets(prev => prev.filter(s => s.id !== snippetId))
  }

  const getLanguageIcon = (language: string) => {
    switch (language.toLowerCase()) {
      case "typescript":
      case "javascript":
        return <Code className="h-4 w-4 text-blue-400" />
      case "react":
        return <Component className="h-4 w-4 text-cyan-400" />
      case "css":
        return <FileText className="h-4 w-4 text-pink-400" />
      case "html":
        return <Globe className="h-4 w-4 text-orange-400" />
      case "sql":
        return <Database className="h-4 w-4 text-green-400" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" />
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <div className="flex h-full">
          {/* サイドバー */}
          <div className="w-80 border-r border-zinc-700 bg-zinc-900">
            <div className="p-4 border-b border-zinc-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-zinc-200">スニペット</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(true)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="スニペットを検索..."
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
              />
            </div>

            <ScrollArea className="h-full">
              <Tabs defaultValue="language" className="h-full">
                <TabsList className="w-full bg-zinc-900 border-b border-zinc-700">
                  <TabsTrigger value="language" className="flex-1 text-xs">
                    {currentLanguage}
                  </TabsTrigger>
                  <TabsTrigger value="global" className="flex-1 text-xs">
                    グローバル
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="language" className="p-0">
                  <div className="p-2">
                    {languageSnippets.map(snippet => (
                      <div
                        key={snippet.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                          selectedSnippet?.id === snippet.id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                        onClick={() => setSelectedSnippet(snippet)}
                      >
                        <div className="flex items-center space-x-2">
                          {getLanguageIcon(snippet.language)}
                          <div>
                            <div className="text-sm font-medium">{snippet.name}</div>
                            <div className="text-xs opacity-70">{snippet.prefix}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSnippet(snippet.id)
                          }}
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="global" className="p-0">
                  <div className="p-2">
                    {globalSnippets.map(snippet => (
                      <div
                        key={snippet.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                          selectedSnippet?.id === snippet.id
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-zinc-800 text-zinc-300'
                        }`}
                        onClick={() => setSelectedSnippet(snippet)}
                      >
                        <div className="flex items-center space-x-2">
                          {getLanguageIcon(snippet.language)}
                          <div>
                            <div className="text-sm font-medium">{snippet.name}</div>
                            <div className="text-xs opacity-70">{snippet.prefix}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 flex flex-col">
            {selectedSnippet ? (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-200">{selectedSnippet.name}</h3>
                      <p className="text-sm text-zinc-400">{selectedSnippet.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-zinc-500">Prefix: {selectedSnippet.prefix}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSnippetInsert(selectedSnippet)}
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        挿入
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4">
                  <div className="mb-4">
                    <label className="text-sm font-medium text-zinc-300 mb-2 block">スニペット内容:</label>
                    <div className="bg-zinc-800 border border-zinc-700 rounded p-3">
                      <pre className="text-sm text-zinc-200 whitespace-pre-wrap">{selectedSnippet.body}</pre>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-zinc-500">タグ:</span>
                    {selectedSnippet.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-zinc-700 text-zinc-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-400">
                <div className="text-center">
                  <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">スニペットを選択</h3>
                  <p className="text-sm">左側のリストからスニペットを選択してください</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 新規スニペット作成ダイアログ */}
        {isCreating && (
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>新規スニペット作成</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">名前:</label>
                  <Input
                    value={newSnippet.name}
                    onChange={(e) => setNewSnippet(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="スニペット名"
                    className="bg-zinc-800 border-zinc-700 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">説明:</label>
                  <Input
                    value={newSnippet.description}
                    onChange={(e) => setNewSnippet(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="スニペットの説明"
                    className="bg-zinc-800 border-zinc-700 text-zinc-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-2 block">プレフィックス:</label>
                    <Input
                      value={newSnippet.prefix}
                      onChange={(e) => setNewSnippet(prev => ({ ...prev, prefix: e.target.value }))}
                      placeholder="trig"
                      className="bg-zinc-800 border-zinc-700 text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-2 block">言語:</label>
                    <Input
                      value={newSnippet.language}
                      onChange={(e) => setNewSnippet(prev => ({ ...prev, language: e.target.value }))}
                      placeholder="typescript"
                      className="bg-zinc-800 border-zinc-700 text-zinc-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">スニペット内容:</label>
                  <Textarea
                    value={newSnippet.body}
                    onChange={(e) => setNewSnippet(prev => ({ ...prev, body: e.target.value }))}
                    placeholder="スニペットの内容を入力..."
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 min-h-32"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(false)}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleCreateSnippet}
                    disabled={!newSnippet.name || !newSnippet.prefix || !newSnippet.body}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    作成
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
} 